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
      <button v-for="tool in tools" :key="tool.key" :class="{ active: activeTool === tool.key }" :title="tool.description" @click="selectTool(tool.key)">
        <span class="tool-icon">{{ tool.toolbar?.icon ?? '•' }}</span><span>{{ tool.name }}</span><small>{{ tool.price }} €</small>
      </button>
      <div class="toolbar-separator" />
      <button @click="command('spawnCustomer')"><span class="tool-icon">🧍</span><span>Client</span></button>
      <button :class="{ active: ui.autoSpawn }" @click="command('toggleAutoSpawn')"><span class="tool-icon">▶</span><span>Auto</span></button>
      <button @click="command('restock')"><span class="tool-icon">📦</span><span>Réassort</span></button>
    </aside>

    <section ref="gameContainer" class="game-container" />

    <aside class="selection-panel">
      <div class="panel-heading">
        <div><span class="eyebrow">Équipement</span><h2>{{ selectedItem ? selectedItem.buildingName : 'Sélection' }}</h2></div>
        <button v-if="selectedItem" class="close-button" @click="selectBuilding(null)">×</button>
      </div>

      <template v-if="selectedItem?.type === 'shelf'">
        <div class="selection-type">{{ selectedItem.columns }} colonnes × {{ selectedItem.levels }} étagères</div>
        <p class="panel-help">{{ selectedItem.description }}</p>
        <div class="equipment-summary"><span>{{ selectedItem.configuredSlots }}/{{ selectedItem.slots.length }} configurés</span><strong>{{ selectedItem.stock }}/{{ selectedItem.capacity }}</strong></div>
        <button class="panel-action" @click="restockEquipment(selectedItem.id)">Remplir depuis la réserve</button>
        <div class="equipment-grid" :style="{ gridTemplateColumns: `repeat(${selectedItem.columns}, minmax(0, 1fr))` }">
          <section v-for="column in selectedItem.columnGroups" :key="column.index" class="equipment-column">
            <h3>Col. {{ column.index + 1 }}</h3>
            <article v-for="slot in column.slots" :key="slot.id" class="equipment-slot" :class="{ empty: !slot.productKey }">
              <div class="slot-heading"><span>Étagère {{ slot.level + 1 }}</span><strong>{{ slot.quantity }}/{{ slot.capacity }}</strong></div>
              <select :value="slot.productKey ?? ''" @change="assignProduct(selectedItem.id, slot.id, $event)">
                <option value="">Vide</option>
                <option v-for="product in selectedItem.compatibleProducts" :key="product.key" :value="product.key">{{ product.name }} ({{ product.capacity }})</option>
              </select>
              <div v-if="slot.productKey" class="slot-product"><i :style="{ background: slot.color }" /><span>{{ slot.productName }}</span></div>
              <small v-if="slot.productKey">Réserve : {{ slot.reserveQuantity }}</small>
              <button v-if="slot.productKey && slot.quantity < slot.capacity" class="slot-action" @click="restockSlot(selectedItem.id, slot.id)">Remplir</button>
            </article>
          </section>
        </div>
      </template>

      <template v-else-if="selectedItem?.type === 'storage'">
        <div class="selection-type">Réserve {{ storageLabel(selectedItem.storageType) }}</div>
        <p class="panel-help">{{ selectedItem.description }}</p>
        <div class="stock-meter"><span :style="{ width: `${selectedItem.ratio * 100}%` }" /></div>
        <dl class="detail-list"><div><dt>Utilisé</dt><dd>{{ selectedItem.used }}</dd></div><div><dt>Capacité</dt><dd>{{ selectedItem.capacity }}</dd></div><div><dt>Disponible</dt><dd>{{ selectedItem.free }}</dd></div></dl>
        <button class="panel-action" @click="openManagement('reserve')">Ouvrir la gestion de réserve</button>
      </template>

      <template v-else-if="selectedItem?.type === 'checkout'">
        <div class="selection-type">Caisse</div><p class="panel-help">{{ selectedItem.description }}</p>
        <dl class="detail-list"><div><dt>File</dt><dd>{{ selectedItem.queueLength }}</dd></div><div><dt>État</dt><dd>{{ selectedItem.busy ? 'Encaissement' : 'Disponible' }}</dd></div><div><dt>Paiements</dt><dd>{{ selectedItem.payments.join(', ') }}</dd></div></dl>
      </template>

      <template v-else>
        <p class="panel-help">Clique sur un équipement dans la scène pour le configurer.</p>
        <h3>Rayons</h3><button v-for="item in shelves" :key="item.id" class="selection-row" @click="selectBuilding(item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.stock }}/{{ item.capacity }}</strong></button>
        <h3>Réserves</h3><button v-for="item in storages" :key="item.id" class="selection-row" @click="selectBuilding(item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.used }}/{{ item.capacity }}</strong></button>
        <h3>Caisses</h3><button v-for="item in checkouts" :key="item.id" class="selection-row" @click="selectBuilding(item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.queueLength }}</strong></button>
      </template>
    </aside>

    <div v-if="managementOpen" class="management-overlay" @click.self="managementOpen = false">
      <section class="management-window">
        <header class="management-header"><div><span class="eyebrow">Pilotage du magasin</span><h1>Gestion et suivi</h1></div><button class="close-button" @click="managementOpen = false">×</button></header>
        <nav class="management-nav">
          <button v-for="tab in managementTabs" :key="tab.key" :class="{ active: managementTab === tab.key }" @click="managementTab = tab.key">{{ tab.label }}</button>
        </nav>

        <div v-if="managementTab === 'dashboard'" class="management-content">
          <div class="kpi-grid">
            <article><span>Trésorerie</span><strong>{{ money(ui.cash) }}</strong></article><article><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></article>
            <article><span>Bénéfice du jour</span><strong :class="ui.dayProfit >= 0 ? 'positive-text' : 'negative-text'">{{ money(ui.dayProfit) }}</strong></article><article><span>Clients</span><strong>{{ ui.customers }}</strong></article>
            <article><span>Stock en rayon</span><strong>{{ ui.shelfStock }}</strong></article><article><span>Stock en réserve</span><strong>{{ ui.reserveStock }}</strong></article>
          </div>
          <h2>Alertes</h2>
          <div v-if="!managementAlerts.length" class="success-state">Aucune alerte logistique.</div>
          <div v-for="alert in managementAlerts" :key="alert" class="alert-card">{{ alert }}</div>
          <h2>Commandes en cours</h2>
          <div v-if="!pendingOrders.length" class="empty-state">Aucune livraison en attente.</div>
          <article v-for="order in pendingOrders" :key="order.id" class="order-card"><div><strong>{{ order.id }}</strong><span>Jour {{ order.expectedDay }}</span></div><small>{{ supplierName(order.supplierKey) }} · {{ money(order.orderedTotal) }}</small></article>
        </div>

        <div v-else-if="managementTab === 'finances'" class="management-content">
          <div class="finance-summary"><article><span>Revenus</span><strong>{{ money(ui.dayRevenue) }}</strong></article><article><span>Charges</span><strong>{{ money(ui.dayExpenses) }}</strong></article><article><span>Résultat</span><strong>{{ money(ui.dayProfit) }}</strong></article></div>
          <dl class="finance-list"><div><dt>Construction</dt><dd>{{ money(ui.dayConstructionCost) }}</dd></div><div><dt>Achats de marchandises</dt><dd>{{ money(ui.dayMerchandiseCost) }}</dd></div><div><dt>Électricité et fonctionnement</dt><dd>{{ money(ui.dayOperatingCost) }}</dd></div><div class="total"><dt>Total des charges</dt><dd>{{ money(ui.dayExpenses) }}</dd></div></dl>
        </div>

        <div v-else-if="managementTab === 'reserve'" class="management-content">
          <div class="capacity-grid"><article v-for="capacity in storageCapacities" :key="capacity.type" class="capacity-card"><div><strong>{{ storageLabel(capacity.type) }}</strong><span>{{ capacity.used }}/{{ capacity.capacity }}</span></div><div class="stock-meter"><span :style="{ width: `${capacity.ratio * 100}%` }" /></div><small v-if="capacity.capacity === 0">Aucune zone construite.</small></article></div>
          <h2>Produits stockés</h2><div v-if="!reserveLines.length" class="empty-state">La réserve est vide.</div><div v-for="line in reserveLines" :key="line.productKey" class="reserve-line"><span>{{ line.productName }}</span><strong>{{ line.quantity }}</strong></div>
        </div>

        <div v-else class="management-content orders-layout">
          <section class="order-form-card">
            <h2>Nouvelle commande</h2>
            <label class="field-label">Fournisseur</label><select v-model="orderSupplier"><option v-for="supplier in suppliers" :key="supplier.key" :value="supplier.key">{{ supplier.name }}</option></select>
            <div v-if="selectedSupplier" class="supplier-info"><span>Livraison J+{{ selectedSupplier.leadTimeDays }}</span><span>Minimum {{ money(selectedSupplier.minimumOrderAmount) }}</span><span>Frais {{ money(selectedSupplier.deliveryFee) }}</span></div>
            <label class="field-label">Produit disponible</label><select v-model="orderProduct"><option v-for="product in orderableProducts" :key="product.key" :value="product.key">{{ product.name }}</option></select>
            <label class="field-label">Quantité</label><input v-model.number="orderQuantity" type="number" min="1" step="1" />
            <div class="order-preview"><div><span>Marchandises</span><strong>{{ money(orderPreview.merchandiseTotal) }}</strong></div><div><span>Frais</span><strong>{{ money(orderPreview.deliveryFee) }}</strong></div><div class="total"><span>Total</span><strong>{{ money(orderPreview.total) }}</strong></div><div><span>Capacité libre compatible</span><strong>{{ orderPreview.storageFree }}</strong></div></div>
            <div v-for="error in orderPreview.errors" :key="error" class="form-error">{{ error }}</div>
            <button class="panel-action" :disabled="orderPreview.errors.length > 0" @click="placeOrder">Valider la commande</button>
            <p v-if="orderMessage" :class="orderMessageType === 'success' ? 'form-success' : 'form-error'">{{ orderMessage }}</p>
          </section>
          <section><h2>Historique</h2><div v-if="!orders.length" class="empty-state">Aucune commande.</div><article v-for="order in orders" :key="order.id" class="order-card"><div><strong>{{ order.id }}</strong><span>{{ orderStatusLabel(order.status) }}</span></div><small>{{ supplierName(order.supplierKey) }} · livraison jour {{ order.expectedDay }} · {{ money(order.orderedTotal) }}</small><small v-if="order.rejectedLines.length">{{ order.rejectedLines.reduce((sum: number, line: any) => sum + line.quantity, 0) }} unité(s) refusée(s) faute de place.</small></article></section>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Phaser from 'phaser'
import { BUILDINGS } from './game/catalog/buildings'
import { getProductDefinition } from './game/catalog/products'
import type { BuildingKey, StorageType } from './game/definitions'
import { isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from './game/definitions'
import { StoreScene } from './game/StoreScene'

const gameContainer = ref<HTMLElement | null>(null)
const activeTool = ref<BuildingKey>('standard-shelf')
const selectedId = ref<string | null>(null)
const managementOpen = ref(false)
const managementTab = ref<'dashboard' | 'finances' | 'reserve' | 'orders'>('dashboard')
const managementTabs = [{ key: 'dashboard', label: 'Tableau de bord' }, { key: 'finances', label: 'Finances' }, { key: 'reserve', label: 'Réserve' }, { key: 'orders', label: 'Commandes' }] as const
const orderSupplier = ref('metro-market')
const orderProduct = ref('pasta')
const orderQuantity = ref(50)
const orderMessage = ref('')
const orderMessageType = ref<'success' | 'error'>('success')
let game: Phaser.Game | null = null
let refreshTimer: number | undefined
let processedDay = 0

const tools = BUILDINGS
const ui = reactive({ cash: 2000, day: 1, time: '08:00', customers: 0, shelfStock: 0, reserveStock: 0, autoSpawn: false, dayRevenue: 0, dayProfit: 0, dayConstructionCost: 0, dayMerchandiseCost: 0, dayOperatingCost: 0, dayExpenses: 0 })
const shelves = ref<any[]>([]), storages = ref<any[]>([]), checkouts = ref<any[]>([]), suppliers = ref<any[]>([]), orders = ref<any[]>([]), reserveLines = ref<any[]>([]), storageCapacities = ref<any[]>([])
const selectedItem = computed(() => [...shelves.value, ...storages.value, ...checkouts.value].find(item => item.id === selectedId.value))
const selectedSupplier = computed(() => suppliers.value.find(item => item.key === orderSupplier.value))
const orderableProducts = computed(() => getScene()?.simulation.getProducts().filter(product => selectedSupplier.value?.productKeys.includes(product.key)) ?? [])
const selectedOrderProduct = computed(() => orderableProducts.value.find(product => product.key === orderProduct.value))
const pendingOrders = computed(() => orders.value.filter(order => order.status === 'ordered'))
const orderPreview = computed(() => {
  const supplier = selectedSupplier.value, product = selectedOrderProduct.value, quantity = Math.max(0, Math.floor(Number(orderQuantity.value) || 0))
  const unitPrice = supplier && product ? product.purchasePrice * supplier.priceMultiplier : 0
  const merchandiseTotal = quantity * unitPrice, deliveryFee = supplier?.deliveryFee ?? 0, total = merchandiseTotal + deliveryFee
  const storageType: StorageType | null = product ? (product.requiresFreezing ? 'frozen' : product.requiresRefrigeration ? 'cold' : 'ambient') : null
  const storage = storageCapacities.value.find(item => item.type === storageType)
  const errors: string[] = []
  if (!supplier) errors.push('Sélectionnez un fournisseur valide.')
  if (!product) errors.push('Ce produit n’est pas proposé par le fournisseur sélectionné.')
  if (quantity < 1) errors.push('La quantité doit être au moins égale à 1.')
  if (supplier && merchandiseTotal < supplier.minimumOrderAmount) errors.push(`Minimum fournisseur non atteint : il manque ${money(supplier.minimumOrderAmount - merchandiseTotal)} de marchandises.`)
  if (total > ui.cash) errors.push(`Budget insuffisant : il manque ${money(total - ui.cash)}.`)
  if (storageType && (!storage || storage.capacity === 0)) errors.push(`Aucune réserve ${storageLabel(storageType)} n’est construite.`)
  else if (storage && quantity > Math.max(0, storage.capacity - storage.used)) errors.push(`Capacité insuffisante : seulement ${Math.max(0, storage.capacity - storage.used)} unité(s) peuvent être réceptionnées.`)
  return { merchandiseTotal, deliveryFee, total, storageFree: storage ? Math.max(0, storage.capacity - storage.used) : 0, errors }
})
const managementAlerts = computed(() => {
  const alerts: string[] = []
  for (const capacity of storageCapacities.value) if (capacity.capacity === 0) alerts.push(`Aucune réserve ${storageLabel(capacity.type)} construite.`); else if (capacity.ratio >= .85) alerts.push(`La réserve ${storageLabel(capacity.type)} est presque pleine (${capacity.used}/${capacity.capacity}).`)
  if (ui.shelfStock === 0) alerts.push('Aucun produit disponible dans les rayons.')
  return alerts
})

watch(orderSupplier, () => { if (!orderableProducts.value.some(product => product.key === orderProduct.value)) orderProduct.value = orderableProducts.value[0]?.key ?? ''; orderMessage.value = '' })
watch([orderProduct, orderQuantity], () => { orderMessage.value = '' })

function getScene() { return game ? game.scene.getScene('StoreScene') as StoreScene : null }
function openManagement(tab: typeof managementTab.value) { managementTab.value = tab; managementOpen.value = true; refreshUi() }
function selectTool(key: BuildingKey) { activeTool.value = key; getScene()?.select(key) }
function selectBuilding(id: string | null) { selectedId.value = id; getScene()?.selectBuilding(id) }
function command(name: 'spawnCustomer' | 'toggleAutoSpawn' | 'restock') { const scene = getScene(); if (!scene) return; if (name === 'spawnCustomer') void scene.spawnCustomer(); else scene[name]() }
function assignProduct(buildingId: string, slotId: string, event: Event) { getScene()?.configureCompartment(buildingId, slotId, (event.target as HTMLSelectElement).value || null); refreshUi() }
function restockSlot(buildingId: string, slotId: string) { getScene()?.restockCompartment(buildingId, slotId); refreshUi() }
function restockEquipment(buildingId: string) { getScene()?.restockEquipment(buildingId); refreshUi() }
function placeOrder() { const scene = getScene(); if (!scene || orderPreview.value.errors.length) return; const order = scene.simulation.createPurchaseOrder(orderSupplier.value, [{ productKey: orderProduct.value, quantity: orderQuantity.value }], scene.day); orderMessageType.value = order ? 'success' : 'error'; orderMessage.value = order ? `${order.id} enregistrée. Livraison prévue au jour ${order.expectedDay}.` : 'La commande n’a pas pu être enregistrée.'; refreshUi() }

function refreshUi() {
  const scene = getScene(); if (!scene) return
  const simulation = scene.simulation; simulation.syncBuildings(scene.grid.getBuildings()); if (processedDay !== scene.day) { simulation.processDeliveries(scene.day); processedDay = scene.day }
  const minutes = scene.currentMinutes
  Object.assign(ui, { cash: simulation.metrics.cash, day: scene.day, time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, customers: scene.customers.size, shelfStock: simulation.getTotalShelfStock(), reserveStock: simulation.getTotalReserveStock(), autoSpawn: scene.autoSpawn, dayRevenue: simulation.getDayRevenue(), dayProfit: simulation.getDayProfit(), dayConstructionCost: simulation.getDayConstructionExpenses(), dayMerchandiseCost: simulation.getDayMerchandiseExpenses(), dayOperatingCost: simulation.getDayOperatingExpenses() })
  ui.dayExpenses = ui.dayConstructionCost + ui.dayMerchandiseCost + ui.dayOperatingCost
  const buildings = scene.grid.getBuildings()
  shelves.value = buildings.filter(b => isShelfDefinition(b.definition)).map(building => { const definition = building.definition, inventory = simulation.getEquipmentInventory(building.id); const slots = (inventory?.compartments ?? []).map(slot => { const product = slot.productKey ? getProductDefinition(slot.productKey) : undefined; return { ...slot, productName: product?.name ?? 'Vide', reserveQuantity: product ? simulation.getReserveQuantity(product.key) : 0, color: product ? `#${product.color.toString(16).padStart(6, '0')}` : '#334155' } }); return { id: building.id, type: 'shelf', buildingName: definition.name, description: definition.description, columns: definition.layout.columns, levels: definition.layout.levels, slots, stock: slots.reduce((sum, slot) => sum + slot.quantity, 0), capacity: slots.reduce((sum, slot) => sum + slot.capacity, 0), configuredSlots: slots.filter(slot => slot.productKey).length, compatibleProducts: simulation.getCompatibleProducts(building.id).map(product => ({ key: product.key, name: product.name, capacity: product.capacities[definition.layout.compartmentType] ?? 0 })), columnGroups: Array.from({ length: definition.layout.columns }, (_, index) => ({ index, slots: slots.filter(slot => slot.column === index).sort((a, b) => b.level - a.level) })) } })
  storages.value = buildings.filter(b => isStorageDefinition(b.definition)).map(building => { const type = building.definition.storageType, capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { id: building.id, type: 'storage', buildingName: building.definition.name, description: building.definition.description, storageType: type, capacity, used, free: Math.max(0, capacity - used), ratio: capacity ? used / capacity : 0 } })
  checkouts.value = buildings.filter(b => isCheckoutDefinition(b.definition)).map(building => ({ id: building.id, type: 'checkout', buildingName: building.definition.name, description: building.definition.description, queueLength: simulation.queueLength(building.id), busy: simulation.isCheckoutBusy(building.id), payments: building.definition.acceptedPayments.map(paymentLabel) }))
  suppliers.value = simulation.getSuppliers(); orders.value = simulation.getPurchaseOrders(); reserveLines.value = simulation.getReserveLines().map(line => ({ ...line, productName: getProductDefinition(line.productKey)?.name ?? line.productKey })); storageCapacities.value = (['ambient', 'cold', 'frozen'] as StorageType[]).map(type => { const capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { type, capacity, used, ratio: capacity ? used / capacity : 0 } }); selectedId.value = scene.selectedBuildingId
}

function storageLabel(type: StorageType) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée' }
function supplierName(key: string) { return suppliers.value.find(item => item.key === key)?.name ?? key }
function orderStatusLabel(status: string) { return status === 'ordered' ? 'En attente' : status === 'delivered' ? 'Livrée' : status === 'partially-delivered' ? 'Partielle' : 'Annulée' }
function paymentLabel(value: string) { return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
function handleAzertyShortcuts(event: KeyboardEvent) { if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || managementOpen.value) return; const target = event.target as HTMLElement | null; if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return; const key = event.key.toLocaleLowerCase('fr-FR'), scene = getScene(); if (!scene) return; if (!event.shiftKey && key === 'a') scene.rotateScene(-1); if (!event.shiftKey && key === 'e') scene.rotateScene(1); if (event.shiftKey && key === 'a') scene.restock(); if (event.shiftKey && key === 's') scene.toggleAutoSpawn() }

onMounted(() => { if (!gameContainer.value) return; game = new Phaser.Game({ type: Phaser.AUTO, parent: gameContainer.value, width: gameContainer.value.clientWidth, height: gameContainer.value.clientHeight, backgroundColor: '#0f172a', scene: [StoreScene], scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true } }); window.addEventListener('keydown', handleAzertyShortcuts, { capture: true }); refreshTimer = window.setInterval(refreshUi, 250) })
onBeforeUnmount(() => { window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true }); if (refreshTimer) window.clearInterval(refreshTimer); game?.destroy(true) })
</script>