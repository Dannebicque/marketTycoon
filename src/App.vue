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

    <EquipmentPanel
      :selected-item="selectedItem"
      :shelves="shelves"
      :storages="storages"
      :checkouts="checkouts"
      @select="selectBuilding"
      @assign-product="assignProduct"
      @restock-slot="restockSlot"
      @restock-equipment="restockEquipment"
      @open-management="openManagement"
    />

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
      :order-message="orderMessage"
      :order-message-type="orderMessageType"
      @close="managementOpen = false"
      @update:tab="managementTab = $event"
      @submit-order="submitOrder"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Phaser from 'phaser'
import EquipmentPanel from './components/EquipmentPanel.vue'
import ManagementWindow, { type ManagementTab } from './components/management/ManagementWindow.vue'
import { BUILDINGS } from './game/catalog/buildings'
import { getProductDefinition } from './game/catalog/products'
import type { BuildingKey, ProductDefinition, StorageType } from './game/definitions'
import { isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from './game/definitions'
import { StoreScene } from './game/StoreScene'

const gameContainer = ref<HTMLElement | null>(null)
const activeTool = ref<BuildingKey>('standard-shelf')
const selectedId = ref<string | null>(null)
const managementOpen = ref(false)
const managementTab = ref<ManagementTab>('dashboard')
const orderMessage = ref('')
const orderMessageType = ref<'success' | 'error'>('success')
let game: Phaser.Game | null = null
let refreshTimer: number | undefined
let processedDay = 0

const tools = BUILDINGS
const ui = reactive({ cash: 2000, day: 1, time: '08:00', customers: 0, shelfStock: 0, reserveStock: 0, autoSpawn: false, dayRevenue: 0, dayProfit: 0, dayConstructionCost: 0, dayMerchandiseCost: 0, dayOperatingCost: 0, dayExpenses: 0 })
const shelves = ref<any[]>([])
const storages = ref<any[]>([])
const checkouts = ref<any[]>([])
const suppliers = ref<any[]>([])
const orders = ref<any[]>([])
const reserveLines = ref<any[]>([])
const storageCapacities = ref<any[]>([])
const products = ref<ProductDefinition[]>([])
const selectedItem = computed(() => [...shelves.value, ...storages.value, ...checkouts.value].find(item => item.id === selectedId.value))
const pendingOrders = computed(() => orders.value.filter(order => order.status === 'ordered'))
const managementAlerts = computed(() => {
  const alerts: string[] = []
  for (const capacity of storageCapacities.value) {
    if (capacity.capacity === 0) alerts.push(`Aucune réserve ${storageLabel(capacity.type)} construite.`)
    else if (capacity.ratio >= .85) alerts.push(`La réserve ${storageLabel(capacity.type)} est presque pleine (${capacity.used}/${capacity.capacity}).`)
  }
  if (ui.shelfStock === 0) alerts.push('Aucun produit disponible dans les rayons.')
  return alerts
})

function getScene() { return game ? game.scene.getScene('StoreScene') as StoreScene : null }
function openManagement(tab: ManagementTab) { managementTab.value = tab; managementOpen.value = true; refreshUi() }
function selectTool(key: BuildingKey) { activeTool.value = key; getScene()?.select(key) }
function selectBuilding(id: string | null) { selectedId.value = id; getScene()?.selectBuilding(id) }
function command(name: 'spawnCustomer' | 'toggleAutoSpawn' | 'restock') { const scene = getScene(); if (!scene) return; if (name === 'spawnCustomer') void scene.spawnCustomer(); else scene[name]() }
function assignProduct(buildingId: string, slotId: string, event: Event) { getScene()?.configureCompartment(buildingId, slotId, (event.target as HTMLSelectElement).value || null); refreshUi() }
function restockSlot(buildingId: string, slotId: string) { getScene()?.restockCompartment(buildingId, slotId); refreshUi() }
function restockEquipment(buildingId: string) { getScene()?.restockEquipment(buildingId); refreshUi() }
function submitOrder(supplierKey: string, lines: Array<{ productKey: string; quantity: number }>) {
  const scene = getScene()
  if (!scene) return
  const order = scene.simulation.createPurchaseOrder(supplierKey, lines, scene.day)
  orderMessageType.value = order ? 'success' : 'error'
  orderMessage.value = order ? `${order.id} enregistrée. Livraison prévue au jour ${order.expectedDay}.` : 'Le bon de commande n’a pas pu être enregistré.'
  refreshUi()
}

function refreshUi() {
  const scene = getScene(); if (!scene) return
  const simulation = scene.simulation
  simulation.syncBuildings(scene.grid.getBuildings())
  if (processedDay !== scene.day) { simulation.processDeliveries(scene.day); processedDay = scene.day }
  const minutes = scene.currentMinutes
  Object.assign(ui, { cash: simulation.metrics.cash, day: scene.day, time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, customers: scene.customers.size, shelfStock: simulation.getTotalShelfStock(), reserveStock: simulation.getTotalReserveStock(), autoSpawn: scene.autoSpawn, dayRevenue: simulation.getDayRevenue(), dayProfit: simulation.getDayProfit(), dayConstructionCost: simulation.getDayConstructionExpenses(), dayMerchandiseCost: simulation.getDayMerchandiseExpenses(), dayOperatingCost: simulation.getDayOperatingExpenses() })
  ui.dayExpenses = ui.dayConstructionCost + ui.dayMerchandiseCost + ui.dayOperatingCost
  const buildings = scene.grid.getBuildings()
  shelves.value = buildings.filter(b => isShelfDefinition(b.definition)).map(building => {
    const definition = building.definition
    const inventory = simulation.getEquipmentInventory(building.id)
    const slots = (inventory?.compartments ?? []).map(slot => { const product = slot.productKey ? getProductDefinition(slot.productKey) : undefined; return { ...slot, productName: product?.name ?? 'Vide', reserveQuantity: product ? simulation.getReserveQuantity(product.key) : 0, color: product ? `#${product.color.toString(16).padStart(6, '0')}` : '#334155' } })
    return { id: building.id, type: 'shelf', buildingName: definition.name, description: definition.description, columns: definition.layout.columns, levels: definition.layout.levels, slots, stock: slots.reduce((sum, slot) => sum + slot.quantity, 0), capacity: slots.reduce((sum, slot) => sum + slot.capacity, 0), configuredSlots: slots.filter(slot => slot.productKey).length, compatibleProducts: simulation.getCompatibleProducts(building.id).map(product => ({ key: product.key, name: product.name, capacity: product.capacities[definition.layout.compartmentType] ?? 0 })), columnGroups: Array.from({ length: definition.layout.columns }, (_, index) => ({ index, slots: slots.filter(slot => slot.column === index).sort((a, b) => b.level - a.level) })) }
  })
  storages.value = buildings.filter(b => isStorageDefinition(b.definition)).map(building => { const type = building.definition.storageType, capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { id: building.id, type: 'storage', buildingName: building.definition.name, description: building.definition.description, storageType: type, capacity, used, free: Math.max(0, capacity - used), ratio: capacity ? used / capacity : 0 } })
  checkouts.value = buildings.filter(b => isCheckoutDefinition(b.definition)).map(building => ({ id: building.id, type: 'checkout', buildingName: building.definition.name, description: building.definition.description, queueLength: simulation.queueLength(building.id), busy: simulation.isCheckoutBusy(building.id), payments: building.definition.acceptedPayments.map(paymentLabel) }))
  suppliers.value = simulation.getSuppliers()
  orders.value = simulation.getPurchaseOrders()
  products.value = simulation.getProducts()
  reserveLines.value = simulation.getReserveLines().map(line => ({ ...line, productName: getProductDefinition(line.productKey)?.name ?? line.productKey }))
  storageCapacities.value = (['ambient', 'cold', 'frozen'] as StorageType[]).map(type => { const capacity = simulation.getStorageCapacity(type), used = simulation.getStorageUsed(type); return { type, capacity, used, ratio: capacity ? used / capacity : 0 } })
  selectedId.value = scene.selectedBuildingId
}

function storageLabel(type: StorageType) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée' }
function paymentLabel(value: string) { return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0) }
function handleAzertyShortcuts(event: KeyboardEvent) { if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || managementOpen.value) return; const target = event.target as HTMLElement | null; if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return; const key = event.key.toLocaleLowerCase('fr-FR'), scene = getScene(); if (!scene) return; if (!event.shiftKey && key === 'a') scene.rotateScene(-1); if (!event.shiftKey && key === 'e') scene.rotateScene(1); if (event.shiftKey && key === 'a') scene.restock(); if (event.shiftKey && key === 's') scene.toggleAutoSpawn() }

onMounted(() => { if (!gameContainer.value) return; game = new Phaser.Game({ type: Phaser.AUTO, parent: gameContainer.value, width: gameContainer.value.clientWidth, height: gameContainer.value.clientHeight, backgroundColor: '#0f172a', scene: [StoreScene], scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true } }); window.addEventListener('keydown', handleAzertyShortcuts, { capture: true }); refreshTimer = window.setInterval(refreshUi, 250) })
onBeforeUnmount(() => { window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true }); if (refreshTimer) window.clearInterval(refreshTimer); game?.destroy(true) })
</script>
