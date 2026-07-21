<template>
  <main class="app-shell">
    <header class="hud">
      <div class="brand"><span class="eyebrow">Market Tycoon</span><strong>Jour {{ ui.day }}</strong></div>
      <div class="hud-stat"><span>Budget</span><strong>{{ money(ui.cash) }}</strong></div>
      <div class="hud-stat"><span>Heure</span><strong>{{ ui.time }}</strong></div>
      <div class="hud-stat"><span>Clients</span><strong>{{ ui.customers }}</strong></div>
      <div class="hud-stat"><span>Rayons</span><strong>{{ ui.shelfStock }}</strong></div>
      <div class="hud-stat"><span>Réserve</span><strong>{{ ui.reserveStock }}</strong></div>
      <div class="hud-stat positive"><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></div>
      <button class="management-button" @click="openManagement('dashboard')">☰ Gestion</button>
    </header>

    <aside class="build-toolbar" aria-label="Outils de construction">
      <button v-for="tool in tools" :key="tool.key" :class="{ active: activeTool === tool.key }" :title="tool.description" @click="selectTool(tool.key)"><span class="tool-icon">{{ tool.toolbar?.icon ?? '•' }}</span><span>{{ tool.name }}</span><small>{{ tool.price }} €</small></button>
      <div class="toolbar-separator" />
      <button @click="command('spawnCustomer')"><span class="tool-icon">🧍</span><span>Client</span></button>
      <button :class="{ active: ui.autoSpawn }" @click="command('toggleAutoSpawn')"><span class="tool-icon">▶</span><span>Auto</span></button>
      <button @click="command('restock')"><span class="tool-icon">📦</span><span>Réassort</span></button>
    </aside>

    <section ref="gameContainer" class="game-container" />
    <EquipmentPanel :selected-item="selectedItem" :shelves="shelves" :storages="storages" :checkouts="checkouts" @select="selectBuilding" @assign-product="assignProduct" @restock-slot="restockSlot" @restock-equipment="restockEquipment" @open-management="openManagement" />

    <ManagementWindow
      v-if="managementOpen"
      :tab="managementTab"
      :ui="ui"
      :alerts="managementAlerts"
      :pending-orders="pendingOrders"
      :suppliers="suppliers"
      :storage-capacities="storageCapacities"
      :reserve-lines="reserveLines"
      :orders="orders"
      :products="products"
      :pricing-lines="pricingLines"
      :customer-analytics="customerAnalytics"
      :order-message="orderMessage"
      :order-message-type="orderMessageType"
      :employees="employees"
      :candidates="candidates"
      :employee-roles="employeeRoles"
      :checkouts="checkouts"
      :payroll="payroll"
      :has-save="saveAvailable"
      :save-message="saveMessage"
      @close="managementOpen = false"
      @update:tab="managementTab = $event"
      @submit-order="submitOrder"
      @update-price="updateProductPrice"
      @apply-markup="applyMarkup"
      @hire="hireEmployee"
      @dismiss="dismissEmployee"
      @assign="assignEmployee"
      @refresh-candidates="refreshCandidates"
      @save-game="saveGame"
      @load-game="loadGame"
      @delete-save="deleteCurrentSave"
    />
  </main>
</template>

<script setup lang="ts">
import type { CustomerAnalyticsSummary, CustomerPurchaseObservation, ProductCustomerAnalytics } from '@market-tycoon/analytics'
import { StorePricingManager } from '@market-tycoon/economy'
import Phaser from 'phaser'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import EquipmentPanel from './components/EquipmentPanel.vue'
import ManagementWindow, { type ManagementTab } from './components/management/ManagementWindow.vue'
import { BUILDINGS, getBuildingDefinition, getProductDefinition, isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from '@market-tycoon/catalog'
import type { BuildingKey, EmployeeRoleDefinition, ProductDefinition, StorageType } from '@market-tycoon/catalog'
import { EmployeeManager, type EmployeeState } from '@market-tycoon/employees'
import { EmployeeRuntime } from './phaser/employees/EmployeeRuntime'
import { SAVE_GAME_VERSION, type SaveGameV1 } from '@market-tycoon/save'
import { deleteSaveGame, hasSaveGame, readSaveGame, storeSaveGame } from './infrastructure/LocalStorageSaveRepository'
import { initializeDevelopmentScenario } from './dev/initializeDevelopmentScenario'
import { StoreScene } from './phaser/StoreScene'

const gameContainer = ref<HTMLElement | null>(null)
const activeTool = ref<BuildingKey>('standard-shelf')
const selectedId = ref<string | null>(null)
const managementOpen = ref(false)
const managementTab = ref<ManagementTab>('dashboard')
const orderMessage = ref('')
const orderMessageType = ref<'success' | 'error'>('success')
const saveMessage = ref('')
const saveAvailable = ref(hasSaveGame())
let game: Phaser.Game | null = null
let refreshTimer: number | undefined
let processedDay = 0
let payrollProcessedDay = 1
let employeeRuntime: EmployeeRuntime | null = null
let workforcePoliciesInstalled = false
let pricingInitialized = false
let developmentScenarioChecked = false

const employeeManager = new EmployeeManager()
const pricingManager = new StorePricingManager()
const recommendedPrices = new Map<string, number>()
const tools = BUILDINGS
const ui = reactive({ cash: 2000, day: 1, time: '08:00', customers: 0, shelfStock: 0, reserveStock: 0, autoSpawn: false, dayRevenue: 0, dayProfit: 0, dayConstructionCost: 0, dayMerchandiseCost: 0, dayOperatingCost: 0, dayExpenses: 0 })
const shelves = ref<any[]>([]), storages = ref<any[]>([]), checkouts = ref<any[]>([]), suppliers = ref<any[]>([]), orders = ref<any[]>([]), reserveLines = ref<any[]>([]), storageCapacities = ref<any[]>([])
const products = ref<ProductDefinition[]>([])
const employees = ref<EmployeeState[]>([])
const candidates = ref<EmployeeState[]>([])
const employeeRoles = ref<EmployeeRoleDefinition[]>([])
const emptySummary = (): CustomerAnalyticsSummary => ({ observations: 0, requestedQuantity: 0, acceptedQuantity: 0, rejectedQuantity: 0, conversionRate: 0, estimatedLostRevenue: 0, averageSatisfactionDelta: 0 })
const customerAnalytics = reactive<{ day: number; daySummary: CustomerAnalyticsSummary; allSummary: CustomerAnalyticsSummary; dayProducts: ProductCustomerAnalytics[]; allProducts: ProductCustomerAnalytics[]; recent: CustomerPurchaseObservation[] }>({ day: 1, daySummary: emptySummary(), allSummary: emptySummary(), dayProducts: [], allProducts: [], recent: [] })
const payroll = computed(() => employeeManager.getDailyPayroll())
const selectedItem = computed(() => [...shelves.value, ...storages.value, ...checkouts.value].find(item => item.id === selectedId.value))
const pendingOrders = computed(() => orders.value.filter(order => order.status === 'ordered'))
const pricingLines = computed(() => products.value.map(product => { const summary = pricingManager.getSummary(product); return { ...summary, name: product.name, category: product.category, recommendedPrice: recommendedPrices.get(product.key) ?? product.salePrice } }))
const managementAlerts = computed(() => {
  const alerts: string[] = []
  for (const capacity of storageCapacities.value) {
    if (capacity.capacity === 0) alerts.push(`Aucune réserve ${storageLabel(capacity.type)} construite.`)
    else if (capacity.ratio >= .85) alerts.push(`La réserve ${storageLabel(capacity.type)} est presque pleine (${capacity.used}/${capacity.capacity}).`)
  }
  if (ui.shelfStock === 0) alerts.push('Aucun produit disponible dans les rayons.')
  if (!employeeManager.hasRole('cashier')) alerts.push('Aucun caissier recruté : les caisses classiques sont fermées.')
  if (!employeeManager.hasRole('stocker')) alerts.push('Aucun employé de rayon : le réassort automatique est indisponible.')
  if (!employeeManager.hasRole('technician')) alerts.push('Aucun technicien : les incidents de caisse dureront plus longtemps.')
  const lossCount = pricingLines.value.filter(line => line.isLossLeader).length
  const lowMarginCount = pricingLines.value.filter(line => !line.isLossLeader && line.markupRate < .1).length
  if (lossCount) alerts.push(`${lossCount} produit(s) sont vendus à perte.`)
  if (lowMarginCount) alerts.push(`${lowMarginCount} produit(s) ont une marge inférieure à 10 %.`)
  const highLossProducts = customerAnalytics.dayProducts.filter(line => line.observations >= 3 && line.quantityConversionRate < .6)
  if (highLossProducts.length) alerts.push(`${highLossProducts.length} produit(s) perdent plus de 40 % de la demande client. Consultez l’onglet Clients.`)
  if (customerAnalytics.daySummary.estimatedLostRevenue >= 20) alerts.push(`${money(customerAnalytics.daySummary.estimatedLostRevenue)} de CA potentiel perdu aujourd’hui selon les décisions d’achat.`)
  return alerts
})

function getScene() { return game ? game.scene.getScene('StoreScene') as StoreScene : null }
function openManagement(tab: ManagementTab) { managementTab.value = tab; managementOpen.value = true; refreshUi() }
function selectTool(key: BuildingKey) { activeTool.value = key; getScene()?.select(key) }
function selectBuilding(id: string | null) { selectedId.value = id; getScene()?.selectBuilding(id) }
function command(name: 'spawnCustomer' | 'toggleAutoSpawn' | 'restock') { const scene = getScene(); if (!scene) return; if (name === 'restock' && !employeeManager.hasRole('stocker')) { openManagement('employees'); return } if (name === 'spawnCustomer') void scene.spawnCustomer(); else if (name === 'restock') saveMessage.value = 'Les employés de rayon gèrent automatiquement le réassort.'; else scene[name]() }
function assignProduct(buildingId: string, slotId: string, event: Event) { getScene()?.configureCompartment(buildingId, slotId, (event.target as HTMLSelectElement).value || null); refreshUi() }
function restockSlot(buildingId: string, slotId: string) { getScene()?.restockCompartment(buildingId, slotId); refreshUi() }
function restockEquipment(buildingId: string) { getScene()?.restockEquipment(buildingId); refreshUi() }
function submitOrder(supplierKey: string, lines: Array<{ productKey: string; quantity: number }>) { const scene = getScene(); if (!scene) return; const order = scene.simulation.createPurchaseOrder(supplierKey, lines, scene.day); orderMessageType.value = order ? 'success' : 'error'; orderMessage.value = order ? `${order.id} enregistrée. Livraison prévue au jour ${order.expectedDay}.` : 'Le bon de commande n’a pas pu être enregistré.'; refreshUi() }
function updateProductPrice(productKey: string, salePrice: number) { if (!pricingManager.setSalePrice(productKey, salePrice)) { saveMessage.value = 'Le prix de vente doit être supérieur à 0.'; return } applyPricingToProducts(); saveMessage.value = `Prix de ${getProductDefinition(productKey)?.name ?? productKey} mis à jour.` }
function applyMarkup(markupRate: number) { pricingManager.applyMarkup(products.value, markupRate); applyPricingToProducts(); saveMessage.value = `Coefficient de marge de ${(markupRate * 100).toFixed(0)} % appliqué à tous les produits.` }
function initializePricing(source: ProductDefinition[]) { if (pricingInitialized) return; source.forEach(product => recommendedPrices.set(product.key, product.salePrice)); pricingManager.reset(source); pricingInitialized = true }
function applyPricingToProducts() { for (const product of products.value) product.salePrice = pricingManager.getSalePrice(product) }
function hireEmployee(candidateId: string) { const scene = getScene(); if (!scene) return; const employee = employeeManager.hire(candidateId, scene.day); saveMessage.value = employee ? `${employee.firstName} ${employee.lastName} a rejoint l’équipe.` : 'Candidat introuvable.'; syncWorkforce() }
function dismissEmployee(employeeId: string) { employeeManager.dismiss(employeeId); syncWorkforce() }
function assignEmployee(employeeId: string, buildingId?: string) { employeeManager.assign(employeeId, buildingId); syncWorkforce() }
function refreshCandidates() { employeeManager.refreshCandidates(getScene()?.day ?? 1); refreshEmployees() }
function refreshEmployees() { employees.value = employeeManager.getEmployees(); candidates.value = employeeManager.getCandidates(); employeeRoles.value = employeeManager.getRoles() }
function syncWorkforce() { employeeRuntime?.sync(); refreshEmployees(); refreshUi() }

function ensureEmployeeRuntime(scene: StoreScene) {
  if (!employeeRuntime) employeeRuntime = new EmployeeRuntime(scene, employeeManager)
  employeeRuntime.sync()
  if (workforcePoliciesInstalled) return
  workforcePoliciesInstalled = true
  const originalChooseCheckout = scene.simulation.chooseCheckout.bind(scene.simulation)
  scene.simulation.chooseCheckout = (available, basket, payment) => originalChooseCheckout(available.filter(checkout => employeeRuntime?.isCheckoutStaffed(checkout)), basket, payment)
  const originalCheckoutTiming = scene.simulation.getCheckoutTiming.bind(scene.simulation)
  scene.simulation.getCheckoutTiming = (checkout, articleCount, payment) => { const timing = originalCheckoutTiming(checkout, articleCount, payment); if (!timing.incident) return timing; void employeeRuntime?.requestRepair(checkout); const quality = employeeManager.getAverageQuality('technician'); const repairDelay = quality > 0 ? Math.max(900, Math.round(3_800 * (1.15 - quality / 130))) : 4_000; return { ...timing, durationMs: Math.max(0, timing.durationMs - 4_000 + repairDelay) } }
}
function applyPayroll(day: number) { const scene = getScene(); if (!scene || payrollProcessedDay >= day) return; const cost = employeeManager.getDailyPayroll(); scene.simulation.metrics.cash -= cost; scene.simulation.metrics.operatingExpenses += cost; payrollProcessedDay = day }

function saveGame() {
  const scene = getScene(); if (!scene) return
  const simulation = scene.simulation
  const save: SaveGameV1 = {
    version: SAVE_GAME_VERSION, savedAt: new Date().toISOString(), day: scene.day, currentMinutes: scene.currentMinutes,
    metrics: { ...simulation.metrics },
    buildings: scene.grid.getBuildings().map(building => ({ oldId: building.id, definitionKey: building.definition.key, gridX: building.gridX, gridY: building.gridY, direction: building.direction, compartments: simulation.getEquipmentInventory(building.id)?.compartments.map(slot => ({ id: slot.id, productKey: slot.productKey, quantity: slot.quantity, capacity: slot.capacity })) })),
    edges: scene.grid.getEdges().map(edge => ({ definitionKey: edge.definitionKey, gridX: edge.gridX, gridY: edge.gridY, direction: edge.direction })),
    reserve: simulation.reserve.exportState(), purchaseOrders: simulation.purchaseOrders.exportState(), employees: employeeManager.exportState(), pricing: pricingManager.exportState(),
  }
  storeSaveGame(save); saveAvailable.value = true; saveMessage.value = `Partie sauvegardée le ${new Date(save.savedAt).toLocaleString('fr-FR')}.`
}

function loadGame() {
  const save = readSaveGame(), scene = getScene()
  if (!save || !scene || scene.customers.size) { saveMessage.value = 'Chargement impossible pendant la présence de clients.'; return }
  employeeRuntime?.destroy(); employeeRuntime = null
  for (const edge of scene.grid.getEdges()) scene.grid.removeAt(edge.gridX, edge.gridY, edge.direction)
  for (const building of scene.grid.getBuildings()) scene.grid.removeAt(building.gridX, building.gridY)
  const idMap = new Map<string, string>()
  for (const saved of save.buildings) { const definition = getBuildingDefinition(saved.definitionKey); if (!definition) continue; const placed = scene.grid.place(definition, saved.gridX, saved.gridY, saved.direction); if (placed && 'definition' in placed) idMap.set(saved.oldId, placed.id) }
  for (const edge of save.edges) { const definition = getBuildingDefinition(edge.definitionKey); if (definition) scene.grid.place(definition, edge.gridX, edge.gridY, edge.direction) }
  scene.simulation.syncBuildings(scene.grid.getBuildings())
  for (const saved of save.buildings) { const newId = idMap.get(saved.oldId); const inventory = newId ? scene.simulation.getEquipmentInventory(newId) : undefined; if (!inventory || !saved.compartments) continue; for (const savedSlot of saved.compartments) { const slot = inventory.compartments.find(item => item.id === savedSlot.id); if (slot) Object.assign(slot, savedSlot) } }
  Object.assign(scene.simulation.metrics, save.metrics)
  scene.simulation.reserve.importState(save.reserve); scene.simulation.purchaseOrders.importState(save.purchaseOrders)
  employeeManager.importState({ ...save.employees, employees: save.employees.employees?.map(employee => ({ ...employee, assignedBuildingId: employee.assignedBuildingId ? idMap.get(employee.assignedBuildingId) : undefined })) })
  pricingManager.importState(save.pricing, scene.simulation.getProducts()); products.value = scene.simulation.getProducts(); applyPricingToProducts()
  scene.day = save.day; scene.currentMinutes = save.currentMinutes; processedDay = save.day; payrollProcessedDay = save.day
  scene.rotateScene(1); scene.rotateScene(-1); ensureEmployeeRuntime(scene); refreshEmployees(); refreshUi(); saveMessage.value = `Partie du ${new Date(save.savedAt).toLocaleString('fr-FR')} chargée.`
}

function deleteCurrentSave() { deleteSaveGame(); saveAvailable.value = false; saveMessage.value = 'Sauvegarde supprimée.' }
function refreshUi() {
  const scene = getScene(); if (!scene) return
  if (!developmentScenarioChecked) {
    developmentScenarioChecked = true
    if (!saveAvailable.value && initializeDevelopmentScenario(scene, employeeManager)) saveMessage.value = 'Mode développement : magasin de démonstration initialisé.'
  }
  ensureEmployeeRuntime(scene)
  const simulation = scene.simulation
  simulation.setCurrentDay(scene.day)
  simulation.syncBuildings(scene.grid.getBuildings())
  if (processedDay !== scene.day) { simulation.processDeliveries(scene.day); applyPayroll(scene.day); employeeManager.refreshCandidates(scene.day); processedDay = scene.day }
  const minutes = scene.currentMinutes
  Object.assign(ui, { cash: simulation.metrics.cash, day: scene.day, time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, customers: scene.customers.size, shelfStock: simulation.getTotalShelfStock(), reserveStock: simulation.getTotalReserveStock(), autoSpawn: scene.autoSpawn, dayRevenue: simulation.getDayRevenue(), dayProfit: simulation.getDayProfit(), dayConstructionCost: simulation.getDayConstructionExpenses(), dayMerchandiseCost: simulation.getDayMerchandiseExpenses(), dayOperatingCost: simulation.getDayOperatingExpenses() })
  ui.dayExpenses = ui.dayConstructionCost + ui.dayMerchandiseCost + ui.dayOperatingCost
  const buildings = scene.grid.getBuildings()
  shelves.value = buildings.filter(b => isShelfDefinition(b.definition)).map(building => { const definition = building.definition, inventory = simulation.getEquipmentInventory(building.id); const slots = (inventory?.compartments ?? []).map(slot => { const product = slot.productKey ? getProductDefinition(slot.productKey) : undefined; return { ...slot, productName: product?.name ?? 'Vide', reserveQuantity: product ? simulation.getReserveQuantity(product.key) : 0, color: product ? `#${product.color.toString(16).padStart(6, '0')}` : '#334155' } }); return { id: building.id, type: 'shelf', buildingName: definition.name, description: definition.description, columns: definition.layout.columns, levels: definition.layout.levels, slots, stock: slots.reduce((sum, slot) => sum + slot.quantity, 0), capacity: slots.reduce((sum, slot) => sum + slot.capacity, 0), configuredSlots: slots.filter(slot => slot.productKey).length, compatibleProducts: simulation.getCompatibleProducts(building.id).map(product => ({ key: product.key, name: product.name, capacity: product.capacities[definition.layout.compartmentType] ?? 0 })), columnGroups: Array.from({ length: definition.layout.columns }, (_, index) => ({ index, slots: slots.filter(slot => slot.column === index).sort((a, b) => b.level - a.level) })) } })
  storages.value = buildings.filter(b => isStorageDefinition(b.definition)).map(building => { const type = building.definition.storageType, capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { id: building.id, type: 'storage', buildingName: building.definition.name, description: building.definition.description, storageType: type, capacity, used, free: Math.max(0, capacity - used), ratio: capacity ? used / capacity : 0 } })
  checkouts.value = buildings.filter(b => isCheckoutDefinition(b.definition)).map(building => { const assigned = employeeManager.getAssignedTo(building.id); return { id: building.id, type: 'checkout', buildingName: building.definition.name, description: building.definition.description, queueLength: simulation.queueLength(building.id), busy: simulation.isCheckoutBusy(building.id), payments: building.definition.acceptedPayments.map(paymentLabel), employeeName: assigned ? `${assigned.firstName} ${assigned.lastName}` : null, open: !building.definition.requiresEmployee || Boolean(assigned) } })
  suppliers.value = simulation.getSuppliers(); orders.value = simulation.getPurchaseOrders(); products.value = simulation.getProducts(); initializePricing(products.value); applyPricingToProducts(); reserveLines.value = simulation.getReserveLines().map(line => ({ ...line, productName: getProductDefinition(line.productKey)?.name ?? line.productKey })); storageCapacities.value = (['ambient', 'cold', 'frozen'] as StorageType[]).map(type => { const capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { type, capacity, used, ratio: capacity ? used / capacity : 0 } })
  Object.assign(customerAnalytics, { day: scene.day, daySummary: simulation.customerAnalytics.getSummary(scene.day), allSummary: simulation.customerAnalytics.getSummary(), dayProducts: simulation.customerAnalytics.getProductAnalytics(scene.day), allProducts: simulation.customerAnalytics.getProductAnalytics(), recent: simulation.customerAnalytics.getRecent(30) })
  selectedId.value = scene.selectedBuildingId; refreshEmployees()
}

function storageLabel(type: StorageType) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée' }
function paymentLabel(value: string) { return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
function handleAzertyShortcuts(event: KeyboardEvent) { if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || managementOpen.value) return; const target = event.target as HTMLElement | null; if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return; const key = event.key.toLocaleLowerCase('fr-FR'), scene = getScene(); if (!scene) return; if (!event.shiftKey && key === 'a') scene.rotateScene(-1); if (!event.shiftKey && key === 'e') scene.rotateScene(1); if (event.shiftKey && key === 'a') command('restock'); if (event.shiftKey && key === 's') scene.toggleAutoSpawn() }

onMounted(() => { if (!gameContainer.value) return; game = new Phaser.Game({ type: Phaser.AUTO, parent: gameContainer.value, width: gameContainer.value.clientWidth, height: gameContainer.value.clientHeight, backgroundColor: '#0f172a', scene: [StoreScene], scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true } }); refreshEmployees(); window.addEventListener('keydown', handleAzertyShortcuts, { capture: true }); refreshTimer = window.setInterval(refreshUi, 250) })
onBeforeUnmount(() => { employeeRuntime?.destroy(); window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true }); if (refreshTimer) window.clearInterval(refreshTimer); game?.destroy(true) })
</script>