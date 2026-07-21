/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { StorePricingManager } from '@market-tycoon/economy';
import Phaser from 'phaser';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import EquipmentPanel from './components/EquipmentPanel.vue';
import ManagementWindow from './components/management/ManagementWindow.vue';
import { BUILDINGS, getBuildingDefinition } from '@market-tycoon/catalog';
import { getProductDefinition } from '@market-tycoon/catalog';
import { isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from '@market-tycoon/catalog';
import { EmployeeManager } from './game/employees/EmployeeManager';
import { EmployeeRuntime } from './game/employees/EmployeeRuntime';
import { deleteSaveGame, hasSaveGame, readSaveGame, SAVE_GAME_VERSION, storeSaveGame } from './game/save/SaveGame';
import { StoreScene } from './game/StoreScene';
const gameContainer = ref(null);
const activeTool = ref('standard-shelf');
const selectedId = ref(null);
const managementOpen = ref(false);
const managementTab = ref('dashboard');
const orderMessage = ref('');
const orderMessageType = ref('success');
const saveMessage = ref('');
const saveAvailable = ref(hasSaveGame());
let game = null;
let refreshTimer;
let processedDay = 0;
let payrollProcessedDay = 1;
let employeeRuntime = null;
let workforcePoliciesInstalled = false;
let pricingInitialized = false;
const employeeManager = new EmployeeManager();
const pricingManager = new StorePricingManager();
const recommendedPrices = new Map();
const tools = BUILDINGS;
const ui = reactive({ cash: 2000, day: 1, time: '08:00', customers: 0, shelfStock: 0, reserveStock: 0, autoSpawn: false, dayRevenue: 0, dayProfit: 0, dayConstructionCost: 0, dayMerchandiseCost: 0, dayOperatingCost: 0, dayExpenses: 0 });
const shelves = ref([]), storages = ref([]), checkouts = ref([]), suppliers = ref([]), orders = ref([]), reserveLines = ref([]), storageCapacities = ref([]);
const products = ref([]);
const employees = ref([]);
const candidates = ref([]);
const employeeRoles = ref([]);
const emptySummary = () => ({ observations: 0, requestedQuantity: 0, acceptedQuantity: 0, rejectedQuantity: 0, conversionRate: 0, estimatedLostRevenue: 0, averageSatisfactionDelta: 0 });
const customerAnalytics = reactive({ day: 1, daySummary: emptySummary(), allSummary: emptySummary(), dayProducts: [], allProducts: [], recent: [] });
const payroll = computed(() => employeeManager.getDailyPayroll());
const selectedItem = computed(() => [...shelves.value, ...storages.value, ...checkouts.value].find(item => item.id === selectedId.value));
const pendingOrders = computed(() => orders.value.filter(order => order.status === 'ordered'));
const pricingLines = computed(() => products.value.map(product => { const summary = pricingManager.getSummary(product); return { ...summary, name: product.name, category: product.category, recommendedPrice: recommendedPrices.get(product.key) ?? product.salePrice }; }));
const managementAlerts = computed(() => {
    const alerts = [];
    for (const capacity of storageCapacities.value) {
        if (capacity.capacity === 0)
            alerts.push(`Aucune réserve ${storageLabel(capacity.type)} construite.`);
        else if (capacity.ratio >= .85)
            alerts.push(`La réserve ${storageLabel(capacity.type)} est presque pleine (${capacity.used}/${capacity.capacity}).`);
    }
    if (ui.shelfStock === 0)
        alerts.push('Aucun produit disponible dans les rayons.');
    if (!employeeManager.hasRole('cashier'))
        alerts.push('Aucun caissier recruté : les caisses classiques sont fermées.');
    if (!employeeManager.hasRole('stocker'))
        alerts.push('Aucun employé de rayon : le réassort automatique est indisponible.');
    if (!employeeManager.hasRole('technician'))
        alerts.push('Aucun technicien : les incidents de caisse dureront plus longtemps.');
    const lossCount = pricingLines.value.filter(line => line.isLossLeader).length;
    const lowMarginCount = pricingLines.value.filter(line => !line.isLossLeader && line.markupRate < .1).length;
    if (lossCount)
        alerts.push(`${lossCount} produit(s) sont vendus à perte.`);
    if (lowMarginCount)
        alerts.push(`${lowMarginCount} produit(s) ont une marge inférieure à 10 %.`);
    const highLossProducts = customerAnalytics.dayProducts.filter(line => line.observations >= 3 && line.quantityConversionRate < .6);
    if (highLossProducts.length)
        alerts.push(`${highLossProducts.length} produit(s) perdent plus de 40 % de la demande client. Consultez l’onglet Clients.`);
    if (customerAnalytics.daySummary.estimatedLostRevenue >= 20)
        alerts.push(`${money(customerAnalytics.daySummary.estimatedLostRevenue)} de CA potentiel perdu aujourd’hui selon les décisions d’achat.`);
    return alerts;
});
function getScene() { return game ? game.scene.getScene('StoreScene') : null; }
function openManagement(tab) { managementTab.value = tab; managementOpen.value = true; refreshUi(); }
function selectTool(key) { activeTool.value = key; getScene()?.select(key); }
function selectBuilding(id) { selectedId.value = id; getScene()?.selectBuilding(id); }
function command(name) { const scene = getScene(); if (!scene)
    return; if (name === 'restock' && !employeeManager.hasRole('stocker')) {
    openManagement('employees');
    return;
} if (name === 'spawnCustomer')
    void scene.spawnCustomer();
else if (name === 'restock')
    saveMessage.value = 'Les employés de rayon gèrent automatiquement le réassort.';
else
    scene[name](); }
function assignProduct(buildingId, slotId, event) { getScene()?.configureCompartment(buildingId, slotId, event.target.value || null); refreshUi(); }
function restockSlot(buildingId, slotId) { getScene()?.restockCompartment(buildingId, slotId); refreshUi(); }
function restockEquipment(buildingId) { getScene()?.restockEquipment(buildingId); refreshUi(); }
function submitOrder(supplierKey, lines) { const scene = getScene(); if (!scene)
    return; const order = scene.simulation.createPurchaseOrder(supplierKey, lines, scene.day); orderMessageType.value = order ? 'success' : 'error'; orderMessage.value = order ? `${order.id} enregistrée. Livraison prévue au jour ${order.expectedDay}.` : 'Le bon de commande n’a pas pu être enregistré.'; refreshUi(); }
function updateProductPrice(productKey, salePrice) { if (!pricingManager.setSalePrice(productKey, salePrice)) {
    saveMessage.value = 'Le prix de vente doit être supérieur à 0.';
    return;
} applyPricingToProducts(); saveMessage.value = `Prix de ${getProductDefinition(productKey)?.name ?? productKey} mis à jour.`; }
function applyMarkup(markupRate) { pricingManager.applyMarkup(products.value, markupRate); applyPricingToProducts(); saveMessage.value = `Coefficient de marge de ${(markupRate * 100).toFixed(0)} % appliqué à tous les produits.`; }
function initializePricing(source) { if (pricingInitialized)
    return; source.forEach(product => recommendedPrices.set(product.key, product.salePrice)); pricingManager.reset(source); pricingInitialized = true; }
function applyPricingToProducts() { for (const product of products.value)
    product.salePrice = pricingManager.getSalePrice(product); }
function hireEmployee(candidateId) { const scene = getScene(); if (!scene)
    return; const employee = employeeManager.hire(candidateId, scene.day); saveMessage.value = employee ? `${employee.firstName} ${employee.lastName} a rejoint l’équipe.` : 'Candidat introuvable.'; syncWorkforce(); }
function dismissEmployee(employeeId) { employeeManager.dismiss(employeeId); syncWorkforce(); }
function assignEmployee(employeeId, buildingId) { employeeManager.assign(employeeId, buildingId); syncWorkforce(); }
function refreshCandidates() { employeeManager.refreshCandidates(getScene()?.day ?? 1); refreshEmployees(); }
function refreshEmployees() { employees.value = employeeManager.getEmployees(); candidates.value = employeeManager.getCandidates(); employeeRoles.value = employeeManager.getRoles(); }
function syncWorkforce() { employeeRuntime?.sync(); refreshEmployees(); refreshUi(); }
function ensureEmployeeRuntime(scene) {
    if (!employeeRuntime)
        employeeRuntime = new EmployeeRuntime(scene, employeeManager);
    employeeRuntime.sync();
    if (workforcePoliciesInstalled)
        return;
    workforcePoliciesInstalled = true;
    const originalChooseCheckout = scene.simulation.chooseCheckout.bind(scene.simulation);
    scene.simulation.chooseCheckout = (available, basket, payment) => originalChooseCheckout(available.filter(checkout => employeeRuntime?.isCheckoutStaffed(checkout)), basket, payment);
    const originalCheckoutTiming = scene.simulation.getCheckoutTiming.bind(scene.simulation);
    scene.simulation.getCheckoutTiming = (checkout, articleCount, payment) => { const timing = originalCheckoutTiming(checkout, articleCount, payment); if (!timing.incident)
        return timing; void employeeRuntime?.requestRepair(checkout); const quality = employeeManager.getAverageQuality('technician'); const repairDelay = quality > 0 ? Math.max(900, Math.round(3_800 * (1.15 - quality / 130))) : 4_000; return { ...timing, durationMs: Math.max(0, timing.durationMs - 4_000 + repairDelay) }; };
}
function applyPayroll(day) { const scene = getScene(); if (!scene || payrollProcessedDay >= day)
    return; const cost = employeeManager.getDailyPayroll(); scene.simulation.metrics.cash -= cost; scene.simulation.metrics.operatingExpenses += cost; payrollProcessedDay = day; }
function saveGame() {
    const scene = getScene();
    if (!scene)
        return;
    const simulation = scene.simulation;
    const save = {
        version: SAVE_GAME_VERSION, savedAt: new Date().toISOString(), day: scene.day, currentMinutes: scene.currentMinutes,
        metrics: { ...simulation.metrics },
        buildings: scene.grid.getBuildings().map(building => ({ oldId: building.id, definitionKey: building.definition.key, gridX: building.gridX, gridY: building.gridY, direction: building.direction, compartments: simulation.getEquipmentInventory(building.id)?.compartments.map(slot => ({ id: slot.id, productKey: slot.productKey, quantity: slot.quantity, capacity: slot.capacity })) })),
        edges: scene.grid.getEdges().map(edge => ({ definitionKey: edge.definitionKey, gridX: edge.gridX, gridY: edge.gridY, direction: edge.direction })),
        reserve: simulation.reserve.exportState(), purchaseOrders: simulation.purchaseOrders.exportState(), employees: employeeManager.exportState(), pricing: pricingManager.exportState(),
    };
    storeSaveGame(save);
    saveAvailable.value = true;
    saveMessage.value = `Partie sauvegardée le ${new Date(save.savedAt).toLocaleString('fr-FR')}.`;
}
function loadGame() {
    const save = readSaveGame(), scene = getScene();
    if (!save || !scene || scene.customers.size) {
        saveMessage.value = 'Chargement impossible pendant la présence de clients.';
        return;
    }
    employeeRuntime?.destroy();
    employeeRuntime = null;
    for (const edge of scene.grid.getEdges())
        scene.grid.removeAt(edge.gridX, edge.gridY, edge.direction);
    for (const building of scene.grid.getBuildings())
        scene.grid.removeAt(building.gridX, building.gridY);
    const idMap = new Map();
    for (const saved of save.buildings) {
        const definition = getBuildingDefinition(saved.definitionKey);
        if (!definition)
            continue;
        const placed = scene.grid.place(definition, saved.gridX, saved.gridY, saved.direction);
        if (placed && 'definition' in placed)
            idMap.set(saved.oldId, placed.id);
    }
    for (const edge of save.edges) {
        const definition = getBuildingDefinition(edge.definitionKey);
        if (definition)
            scene.grid.place(definition, edge.gridX, edge.gridY, edge.direction);
    }
    scene.simulation.syncBuildings(scene.grid.getBuildings());
    for (const saved of save.buildings) {
        const newId = idMap.get(saved.oldId);
        const inventory = newId ? scene.simulation.getEquipmentInventory(newId) : undefined;
        if (!inventory || !saved.compartments)
            continue;
        for (const savedSlot of saved.compartments) {
            const slot = inventory.compartments.find(item => item.id === savedSlot.id);
            if (slot)
                Object.assign(slot, savedSlot);
        }
    }
    Object.assign(scene.simulation.metrics, save.metrics);
    scene.simulation.reserve.importState(save.reserve);
    scene.simulation.purchaseOrders.importState(save.purchaseOrders);
    employeeManager.importState({ ...save.employees, employees: save.employees.employees?.map(employee => ({ ...employee, assignedBuildingId: employee.assignedBuildingId ? idMap.get(employee.assignedBuildingId) : undefined })) });
    pricingManager.importState(save.pricing, scene.simulation.getProducts());
    products.value = scene.simulation.getProducts();
    applyPricingToProducts();
    scene.day = save.day;
    scene.currentMinutes = save.currentMinutes;
    processedDay = save.day;
    payrollProcessedDay = save.day;
    scene.rotateScene(1);
    scene.rotateScene(-1);
    ensureEmployeeRuntime(scene);
    refreshEmployees();
    refreshUi();
    saveMessage.value = `Partie du ${new Date(save.savedAt).toLocaleString('fr-FR')} chargée.`;
}
function deleteCurrentSave() { deleteSaveGame(); saveAvailable.value = false; saveMessage.value = 'Sauvegarde supprimée.'; }
function refreshUi() {
    const scene = getScene();
    if (!scene)
        return;
    ensureEmployeeRuntime(scene);
    const simulation = scene.simulation;
    simulation.setCurrentDay(scene.day);
    simulation.syncBuildings(scene.grid.getBuildings());
    if (processedDay !== scene.day) {
        simulation.processDeliveries(scene.day);
        applyPayroll(scene.day);
        employeeManager.refreshCandidates(scene.day);
        processedDay = scene.day;
    }
    const minutes = scene.currentMinutes;
    Object.assign(ui, { cash: simulation.metrics.cash, day: scene.day, time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, customers: scene.customers.size, shelfStock: simulation.getTotalShelfStock(), reserveStock: simulation.getTotalReserveStock(), autoSpawn: scene.autoSpawn, dayRevenue: simulation.getDayRevenue(), dayProfit: simulation.getDayProfit(), dayConstructionCost: simulation.getDayConstructionExpenses(), dayMerchandiseCost: simulation.getDayMerchandiseExpenses(), dayOperatingCost: simulation.getDayOperatingExpenses() });
    ui.dayExpenses = ui.dayConstructionCost + ui.dayMerchandiseCost + ui.dayOperatingCost;
    const buildings = scene.grid.getBuildings();
    shelves.value = buildings.filter(b => isShelfDefinition(b.definition)).map(building => { const definition = building.definition, inventory = simulation.getEquipmentInventory(building.id); const slots = (inventory?.compartments ?? []).map(slot => { const product = slot.productKey ? getProductDefinition(slot.productKey) : undefined; return { ...slot, productName: product?.name ?? 'Vide', reserveQuantity: product ? simulation.getReserveQuantity(product.key) : 0, color: product ? `#${product.color.toString(16).padStart(6, '0')}` : '#334155' }; }); return { id: building.id, type: 'shelf', buildingName: definition.name, description: definition.description, columns: definition.layout.columns, levels: definition.layout.levels, slots, stock: slots.reduce((sum, slot) => sum + slot.quantity, 0), capacity: slots.reduce((sum, slot) => sum + slot.capacity, 0), configuredSlots: slots.filter(slot => slot.productKey).length, compatibleProducts: simulation.getCompatibleProducts(building.id).map(product => ({ key: product.key, name: product.name, capacity: product.capacities[definition.layout.compartmentType] ?? 0 })), columnGroups: Array.from({ length: definition.layout.columns }, (_, index) => ({ index, slots: slots.filter(slot => slot.column === index).sort((a, b) => b.level - a.level) })) }; });
    storages.value = buildings.filter(b => isStorageDefinition(b.definition)).map(building => { const type = building.definition.storageType, capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { id: building.id, type: 'storage', buildingName: building.definition.name, description: building.definition.description, storageType: type, capacity, used, free: Math.max(0, capacity - used), ratio: capacity ? used / capacity : 0 }; });
    checkouts.value = buildings.filter(b => isCheckoutDefinition(b.definition)).map(building => { const assigned = employeeManager.getAssignedTo(building.id); return { id: building.id, type: 'checkout', buildingName: building.definition.name, description: building.definition.description, queueLength: simulation.queueLength(building.id), busy: simulation.isCheckoutBusy(building.id), payments: building.definition.acceptedPayments.map(paymentLabel), employeeName: assigned ? `${assigned.firstName} ${assigned.lastName}` : null, open: !building.definition.requiresEmployee || Boolean(assigned) }; });
    suppliers.value = simulation.getSuppliers();
    orders.value = simulation.getPurchaseOrders();
    products.value = simulation.getProducts();
    initializePricing(products.value);
    applyPricingToProducts();
    reserveLines.value = simulation.getReserveLines().map(line => ({ ...line, productName: getProductDefinition(line.productKey)?.name ?? line.productKey }));
    storageCapacities.value = ['ambient', 'cold', 'frozen'].map(type => { const capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { type, capacity, used, ratio: capacity ? used / capacity : 0 }; });
    Object.assign(customerAnalytics, { day: scene.day, daySummary: simulation.customerAnalytics.getSummary(scene.day), allSummary: simulation.customerAnalytics.getSummary(), dayProducts: simulation.customerAnalytics.getProductAnalytics(scene.day), allProducts: simulation.customerAnalytics.getProductAnalytics(), recent: simulation.customerAnalytics.getRecent(30) });
    selectedId.value = scene.selectedBuildingId;
    refreshEmployees();
}
function storageLabel(type) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée'; }
function paymentLabel(value) { return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces'; }
function money(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0); }
function handleAzertyShortcuts(event) { if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || managementOpen.value)
    return; const target = event.target; if (target?.matches('input, textarea, select, button, [contenteditable="true"]'))
    return; const key = event.key.toLocaleLowerCase('fr-FR'), scene = getScene(); if (!scene)
    return; if (!event.shiftKey && key === 'a')
    scene.rotateScene(-1); if (!event.shiftKey && key === 'e')
    scene.rotateScene(1); if (event.shiftKey && key === 'a')
    command('restock'); if (event.shiftKey && key === 's')
    scene.toggleAutoSpawn(); }
onMounted(() => { if (!gameContainer.value)
    return; game = new Phaser.Game({ type: Phaser.AUTO, parent: gameContainer.value, width: gameContainer.value.clientWidth, height: gameContainer.value.clientHeight, backgroundColor: '#0f172a', scene: [StoreScene], scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true } }); refreshEmployees(); window.addEventListener('keydown', handleAzertyShortcuts, { capture: true }); refreshTimer = window.setInterval(refreshUi, 250); });
onBeforeUnmount(() => { employeeRuntime?.destroy(); window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true }); if (refreshTimer)
    window.clearInterval(refreshTimer); game?.destroy(true); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "app-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "hud" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.ui.day);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hud-stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.money(__VLS_ctx.ui.cash));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hud-stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.ui.time);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hud-stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.ui.customers);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hud-stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.ui.shelfStock);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hud-stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.ui.reserveStock);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hud-stat positive" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.money(__VLS_ctx.ui.dayRevenue));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openManagement('dashboard');
        } },
    ...{ class: "management-button" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "build-toolbar" },
    'aria-label': "Outils de construction",
});
for (const [tool] of __VLS_getVForSourceType((__VLS_ctx.tools))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectTool(tool.key);
            } },
        key: (tool.key),
        ...{ class: ({ active: __VLS_ctx.activeTool === tool.key }) },
        title: (tool.description),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tool-icon" },
    });
    (tool.toolbar?.icon ?? '•');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (tool.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (tool.price);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "toolbar-separator" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.command('spawnCustomer');
        } },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.command('toggleAutoSpawn');
        } },
    ...{ class: ({ active: __VLS_ctx.ui.autoSpawn }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.command('restock');
        } },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section)({
    ref: "gameContainer",
    ...{ class: "game-container" },
});
/** @type {typeof __VLS_ctx.gameContainer} */ ;
/** @type {[typeof EquipmentPanel, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(EquipmentPanel, new EquipmentPanel({
    ...{ 'onSelect': {} },
    ...{ 'onAssignProduct': {} },
    ...{ 'onRestockSlot': {} },
    ...{ 'onRestockEquipment': {} },
    ...{ 'onOpenManagement': {} },
    selectedItem: (__VLS_ctx.selectedItem),
    shelves: (__VLS_ctx.shelves),
    storages: (__VLS_ctx.storages),
    checkouts: (__VLS_ctx.checkouts),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onSelect': {} },
    ...{ 'onAssignProduct': {} },
    ...{ 'onRestockSlot': {} },
    ...{ 'onRestockEquipment': {} },
    ...{ 'onOpenManagement': {} },
    selectedItem: (__VLS_ctx.selectedItem),
    shelves: (__VLS_ctx.shelves),
    storages: (__VLS_ctx.storages),
    checkouts: (__VLS_ctx.checkouts),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onSelect: (__VLS_ctx.selectBuilding)
};
const __VLS_7 = {
    onAssignProduct: (__VLS_ctx.assignProduct)
};
const __VLS_8 = {
    onRestockSlot: (__VLS_ctx.restockSlot)
};
const __VLS_9 = {
    onRestockEquipment: (__VLS_ctx.restockEquipment)
};
const __VLS_10 = {
    onOpenManagement: (__VLS_ctx.openManagement)
};
var __VLS_2;
if (__VLS_ctx.managementOpen) {
    /** @type {[typeof ManagementWindow, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(ManagementWindow, new ManagementWindow({
        ...{ 'onClose': {} },
        ...{ 'onUpdate:tab': {} },
        ...{ 'onSubmitOrder': {} },
        ...{ 'onUpdatePrice': {} },
        ...{ 'onApplyMarkup': {} },
        ...{ 'onHire': {} },
        ...{ 'onDismiss': {} },
        ...{ 'onAssign': {} },
        ...{ 'onRefreshCandidates': {} },
        ...{ 'onSaveGame': {} },
        ...{ 'onLoadGame': {} },
        ...{ 'onDeleteSave': {} },
        tab: (__VLS_ctx.managementTab),
        ui: (__VLS_ctx.ui),
        alerts: (__VLS_ctx.managementAlerts),
        pendingOrders: (__VLS_ctx.pendingOrders),
        suppliers: (__VLS_ctx.suppliers),
        storageCapacities: (__VLS_ctx.storageCapacities),
        reserveLines: (__VLS_ctx.reserveLines),
        orders: (__VLS_ctx.orders),
        products: (__VLS_ctx.products),
        pricingLines: (__VLS_ctx.pricingLines),
        customerAnalytics: (__VLS_ctx.customerAnalytics),
        orderMessage: (__VLS_ctx.orderMessage),
        orderMessageType: (__VLS_ctx.orderMessageType),
        employees: (__VLS_ctx.employees),
        candidates: (__VLS_ctx.candidates),
        employeeRoles: (__VLS_ctx.employeeRoles),
        checkouts: (__VLS_ctx.checkouts),
        payroll: (__VLS_ctx.payroll),
        hasSave: (__VLS_ctx.saveAvailable),
        saveMessage: (__VLS_ctx.saveMessage),
    }));
    const __VLS_12 = __VLS_11({
        ...{ 'onClose': {} },
        ...{ 'onUpdate:tab': {} },
        ...{ 'onSubmitOrder': {} },
        ...{ 'onUpdatePrice': {} },
        ...{ 'onApplyMarkup': {} },
        ...{ 'onHire': {} },
        ...{ 'onDismiss': {} },
        ...{ 'onAssign': {} },
        ...{ 'onRefreshCandidates': {} },
        ...{ 'onSaveGame': {} },
        ...{ 'onLoadGame': {} },
        ...{ 'onDeleteSave': {} },
        tab: (__VLS_ctx.managementTab),
        ui: (__VLS_ctx.ui),
        alerts: (__VLS_ctx.managementAlerts),
        pendingOrders: (__VLS_ctx.pendingOrders),
        suppliers: (__VLS_ctx.suppliers),
        storageCapacities: (__VLS_ctx.storageCapacities),
        reserveLines: (__VLS_ctx.reserveLines),
        orders: (__VLS_ctx.orders),
        products: (__VLS_ctx.products),
        pricingLines: (__VLS_ctx.pricingLines),
        customerAnalytics: (__VLS_ctx.customerAnalytics),
        orderMessage: (__VLS_ctx.orderMessage),
        orderMessageType: (__VLS_ctx.orderMessageType),
        employees: (__VLS_ctx.employees),
        candidates: (__VLS_ctx.candidates),
        employeeRoles: (__VLS_ctx.employeeRoles),
        checkouts: (__VLS_ctx.checkouts),
        payroll: (__VLS_ctx.payroll),
        hasSave: (__VLS_ctx.saveAvailable),
        saveMessage: (__VLS_ctx.saveMessage),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    let __VLS_14;
    let __VLS_15;
    let __VLS_16;
    const __VLS_17 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.managementOpen))
                return;
            __VLS_ctx.managementOpen = false;
        }
    };
    const __VLS_18 = {
        'onUpdate:tab': (...[$event]) => {
            if (!(__VLS_ctx.managementOpen))
                return;
            __VLS_ctx.managementTab = $event;
        }
    };
    const __VLS_19 = {
        onSubmitOrder: (__VLS_ctx.submitOrder)
    };
    const __VLS_20 = {
        onUpdatePrice: (__VLS_ctx.updateProductPrice)
    };
    const __VLS_21 = {
        onApplyMarkup: (__VLS_ctx.applyMarkup)
    };
    const __VLS_22 = {
        onHire: (__VLS_ctx.hireEmployee)
    };
    const __VLS_23 = {
        onDismiss: (__VLS_ctx.dismissEmployee)
    };
    const __VLS_24 = {
        onAssign: (__VLS_ctx.assignEmployee)
    };
    const __VLS_25 = {
        onRefreshCandidates: (__VLS_ctx.refreshCandidates)
    };
    const __VLS_26 = {
        onSaveGame: (__VLS_ctx.saveGame)
    };
    const __VLS_27 = {
        onLoadGame: (__VLS_ctx.loadGame)
    };
    const __VLS_28 = {
        onDeleteSave: (__VLS_ctx.deleteCurrentSave)
    };
    var __VLS_13;
}
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['hud']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['hud-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['hud-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['hud-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['hud-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['hud-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['hud-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['positive']} */ ;
/** @type {__VLS_StyleScopedClasses['management-button']} */ ;
/** @type {__VLS_StyleScopedClasses['build-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-separator']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['game-container']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            EquipmentPanel: EquipmentPanel,
            ManagementWindow: ManagementWindow,
            gameContainer: gameContainer,
            activeTool: activeTool,
            managementOpen: managementOpen,
            managementTab: managementTab,
            orderMessage: orderMessage,
            orderMessageType: orderMessageType,
            saveMessage: saveMessage,
            saveAvailable: saveAvailable,
            tools: tools,
            ui: ui,
            shelves: shelves,
            storages: storages,
            checkouts: checkouts,
            suppliers: suppliers,
            orders: orders,
            reserveLines: reserveLines,
            storageCapacities: storageCapacities,
            products: products,
            employees: employees,
            candidates: candidates,
            employeeRoles: employeeRoles,
            customerAnalytics: customerAnalytics,
            payroll: payroll,
            selectedItem: selectedItem,
            pendingOrders: pendingOrders,
            pricingLines: pricingLines,
            managementAlerts: managementAlerts,
            openManagement: openManagement,
            selectTool: selectTool,
            selectBuilding: selectBuilding,
            command: command,
            assignProduct: assignProduct,
            restockSlot: restockSlot,
            restockEquipment: restockEquipment,
            submitOrder: submitOrder,
            updateProductPrice: updateProductPrice,
            applyMarkup: applyMarkup,
            hireEmployee: hireEmployee,
            dismissEmployee: dismissEmployee,
            assignEmployee: assignEmployee,
            refreshCandidates: refreshCandidates,
            saveGame: saveGame,
            loadGame: loadGame,
            deleteCurrentSave: deleteCurrentSave,
            money: money,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
