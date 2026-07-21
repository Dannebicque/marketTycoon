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
      <div class="hud-stat" :class="ui.dayProfit >= 0 ? 'positive' : 'negative'"><span>Bénéfice</span><strong>{{ money(ui.dayProfit) }}</strong></div>
    </header>

    <aside class="build-toolbar" aria-label="Outils de construction">
      <button v-for="tool in tools" :key="tool.key" :class="{ active: activeTool === tool.key }" :title="tool.description" @click="selectTool(tool.key)">
        <span class="tool-icon">{{ tool.toolbar?.icon ?? '•' }}</span>
        <span>{{ tool.name }}</span>
        <small>{{ tool.price }} €</small>
      </button>
      <div class="toolbar-separator" />
      <button @click="command('spawnCustomer')"><span class="tool-icon">🧍</span><span>Client</span></button>
      <button :class="{ active: ui.autoSpawn }" @click="command('toggleAutoSpawn')"><span class="tool-icon">▶</span><span>Auto</span></button>
      <button @click="command('restock')"><span class="tool-icon">📦</span><span>Réassort</span></button>
    </aside>

    <section ref="gameContainer" class="game-container" />

    <aside class="selection-panel">
      <div class="panel-tabs">
        <button :class="{ active: panelTab === 'equipment' }" @click="panelTab = 'equipment'">Équipement</button>
        <button :class="{ active: panelTab === 'reserve' }" @click="panelTab = 'reserve'">Réserve</button>
        <button :class="{ active: panelTab === 'orders' }" @click="panelTab = 'orders'">Commandes</button>
      </div>

      <template v-if="panelTab === 'equipment'">
        <div class="panel-heading">
          <div><span class="eyebrow">Gestion</span><h2>{{ selectedItem ? selectedItem.buildingName : 'Sélection' }}</h2></div>
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
          <div class="selection-type">Zone de réserve {{ storageLabel(selectedItem.storageType) }}</div>
          <p class="panel-help">{{ selectedItem.description }}</p>
          <div class="stock-meter"><span :style="{ width: `${selectedItem.ratio * 100}%` }" /></div>
          <dl class="detail-list">
            <div><dt>Utilisé</dt><dd>{{ selectedItem.used }}</dd></div>
            <div><dt>Capacité totale</dt><dd>{{ selectedItem.capacity }}</dd></div>
            <div><dt>Disponible</dt><dd>{{ selectedItem.free }}</dd></div>
          </dl>
        </template>

        <template v-else-if="selectedItem?.type === 'checkout'">
          <div class="selection-type">Caisse</div>
          <p class="panel-help">{{ selectedItem.description }}</p>
          <dl class="detail-list">
            <div><dt>File</dt><dd>{{ selectedItem.queueLength }}</dd></div>
            <div><dt>État</dt><dd>{{ selectedItem.busy ? 'Encaissement' : 'Disponible' }}</dd></div>
            <div><dt>Paiements</dt><dd>{{ selectedItem.payments.join(', ') }}</dd></div>
          </dl>
        </template>

        <template v-else>
          <p class="panel-help">Clique sur un équipement pour le configurer.</p>
          <h3>Rayons</h3>
          <button v-for="item in shelves" :key="item.id" class="selection-row" @click="selectBuilding(item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.stock }}/{{ item.capacity }}</strong></button>
          <h3>Réserves</h3>
          <button v-for="item in storages" :key="item.id" class="selection-row" @click="selectBuilding(item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.used }}/{{ item.capacity }}</strong></button>
          <h3>Caisses</h3>
          <button v-for="item in checkouts" :key="item.id" class="selection-row" @click="selectBuilding(item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.queueLength }}</strong></button>
        </template>
      </template>

      <template v-else-if="panelTab === 'reserve'">
        <div class="panel-heading"><div><span class="eyebrow">Logistique</span><h2>Réserve</h2></div></div>
        <div v-for="capacity in storageCapacities" :key="capacity.type" class="capacity-card">
          <div><strong>{{ storageLabel(capacity.type) }}</strong><span>{{ capacity.used }}/{{ capacity.capacity }}</span></div>
          <div class="stock-meter"><span :style="{ width: `${capacity.ratio * 100}%` }" /></div>
          <small v-if="capacity.capacity === 0">Construire une zone compatible pour stocker ces produits.</small>
        </div>
        <h3>Produits stockés</h3>
        <div v-if="!reserveLines.length" class="empty-state">La réserve est vide.</div>
        <div v-for="line in reserveLines" :key="line.productKey" class="reserve-line"><span>{{ line.productName }}</span><strong>{{ line.quantity }}</strong></div>
      </template>

      <template v-else>
        <div class="panel-heading"><div><span class="eyebrow">Approvisionnement</span><h2>Commandes</h2></div></div>
        <label class="field-label">Fournisseur</label>
        <select v-model="orderSupplier">
          <option v-for="supplier in suppliers" :key="supplier.key" :value="supplier.key">{{ supplier.name }} · J+{{ supplier.leadTimeDays }}</option>
        </select>
        <label class="field-label">Produit</label>
        <select v-model="orderProduct">
          <option v-for="product in orderableProducts" :key="product.key" :value="product.key">{{ product.name }}</option>
        </select>
        <label class="field-label">Quantité</label>
        <input v-model.number="orderQuantity" type="number" min="1" step="1" />
        <button class="panel-action" @click="placeOrder">Commander</button>
        <p v-if="orderMessage" class="panel-help">{{ orderMessage }}</p>

        <h3>Historique</h3>
        <div v-if="!orders.length" class="empty-state">Aucune commande.</div>
        <article v-for="order in orders" :key="order.id" class="order-card">
          <div><strong>{{ order.id }}</strong><span>{{ order.status }}</span></div>
          <small>Livraison prévue jour {{ order.expectedDay }} · {{ money(order.orderedTotal) }}</small>
          <small v-if="order.rejectedLines.length">{{ order.rejectedLines.reduce((sum, line) => sum + line.quantity, 0) }} unité(s) refusée(s) faute de place.</small>
        </article>
      </template>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Phaser from 'phaser'
import { BUILDINGS } from './game/catalog/buildings'
import { getProductDefinition } from './game/catalog/products'
import type { BuildingKey, StorageType } from './game/definitions'
import { isCheckoutDefinition, isShelfDefinition, isStorageDefinition } from './game/definitions'
import { StoreScene } from './game/StoreScene'

const gameContainer = ref<HTMLElement | null>(null)
const activeTool = ref<BuildingKey>('standard-shelf')
const selectedId = ref<string | null>(null)
const panelTab = ref<'equipment' | 'reserve' | 'orders'>('equipment')
const orderSupplier = ref('metro-market')
const orderProduct = ref('pasta')
const orderQuantity = ref(50)
const orderMessage = ref('')
let game: Phaser.Game | null = null
let refreshTimer: number | undefined
let processedDay = 0

const tools = BUILDINGS
const ui = reactive({ cash: 2000, day: 1, time: '08:00', customers: 0, shelfStock: 0, reserveStock: 0, autoSpawn: false, dayRevenue: 0, dayProfit: 0 })
const shelves = ref<any[]>([])
const storages = ref<any[]>([])
const checkouts = ref<any[]>([])
const suppliers = ref<any[]>([])
const orders = ref<any[]>([])
const reserveLines = ref<any[]>([])
const storageCapacities = ref<any[]>([])
const selectedItem = computed(() => [...shelves.value, ...storages.value, ...checkouts.value].find(item => item.id === selectedId.value))
const orderableProducts = computed(() => {
  const supplier = suppliers.value.find(item => item.key === orderSupplier.value)
  return getScene()?.simulation.getProducts().filter(product => supplier?.productKeys.includes(product.key)) ?? []
})

function getScene() { return game ? game.scene.getScene('StoreScene') as StoreScene : null }
function selectTool(key: BuildingKey) { activeTool.value = key; getScene()?.select(key) }
function selectBuilding(id: string | null) { selectedId.value = id; getScene()?.selectBuilding(id) }
function command(name: 'spawnCustomer' | 'toggleAutoSpawn' | 'restock') { const scene = getScene(); if (!scene) return; if (name === 'spawnCustomer') void scene.spawnCustomer(); else scene[name]() }
function assignProduct(buildingId: string, slotId: string, event: Event) { getScene()?.configureCompartment(buildingId, slotId, (event.target as HTMLSelectElement).value || null); refreshUi() }
function restockSlot(buildingId: string, slotId: string) { getScene()?.restockCompartment(buildingId, slotId); refreshUi() }
function restockEquipment(buildingId: string) { getScene()?.restockEquipment(buildingId); refreshUi() }

function placeOrder() {
  const scene = getScene()
  if (!scene) return
  const order = scene.simulation.createPurchaseOrder(orderSupplier.value, [{ productKey: orderProduct.value, quantity: orderQuantity.value }], scene.day)
  orderMessage.value = order ? `${order.id} enregistrée. Livraison prévue jour ${order.expectedDay}.` : 'Commande impossible : budget, minimum fournisseur ou produit invalide.'
  refreshUi()
}

function refreshUi() {
  const scene = getScene()
  if (!scene) return
  const simulation = scene.simulation
  simulation.syncBuildings(scene.grid.getBuildings())
  if (processedDay !== scene.day) { simulation.processDeliveries(scene.day); processedDay = scene.day }
  const minutes = scene.currentMinutes
  ui.cash = simulation.metrics.cash
  ui.day = scene.day
  ui.time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  ui.customers = scene.customers.size
  ui.shelfStock = simulation.getTotalShelfStock()
  ui.reserveStock = simulation.getTotalReserveStock()
  ui.autoSpawn = scene.autoSpawn
  ui.dayRevenue = simulation.getDayRevenue()
  ui.dayProfit = simulation.getDayProfit()

  const buildings = scene.grid.getBuildings()
  shelves.value = buildings.filter(building => isShelfDefinition(building.definition)).map(building => {
    const definition = building.definition
    const inventory = simulation.getEquipmentInventory(building.id)
    const slots = (inventory?.compartments ?? []).map(slot => {
      const product = slot.productKey ? getProductDefinition(slot.productKey) : undefined
      return { ...slot, productName: product?.name ?? 'Vide', reserveQuantity: product ? simulation.getReserveQuantity(product.key) : 0, color: product ? `#${product.color.toString(16).padStart(6, '0')}` : '#334155' }
    })
    return {
      id: building.id, type: 'shelf', buildingName: definition.name, description: definition.description,
      columns: definition.layout.columns, levels: definition.layout.levels, slots,
      stock: slots.reduce((sum, slot) => sum + slot.quantity, 0), capacity: slots.reduce((sum, slot) => sum + slot.capacity, 0),
      configuredSlots: slots.filter(slot => slot.productKey).length,
      compatibleProducts: simulation.getCompatibleProducts(building.id).map(product => ({ key: product.key, name: product.name, capacity: product.capacities[definition.layout.compartmentType] ?? 0 })),
      columnGroups: Array.from({ length: definition.layout.columns }, (_, index) => ({ index, slots: slots.filter(slot => slot.column === index).sort((a, b) => b.level - a.level) })),
    }
  })
  storages.value = buildings.filter(building => isStorageDefinition(building.definition)).map(building => {
    const type = building.definition.storageType
    const capacity = simulation.getStorageCapacity(type)
    const used = simulation.getStorageUsed(type)
    return { id: building.id, type: 'storage', buildingName: building.definition.name, description: building.definition.description, storageType: type, capacity, used, free: Math.max(0, capacity - used), ratio: capacity ? used / capacity : 0 }
  })
  checkouts.value = buildings.filter(building => isCheckoutDefinition(building.definition)).map(building => ({ id: building.id, type: 'checkout', buildingName: building.definition.name, description: building.definition.description, queueLength: simulation.queueLength(building.id), busy: simulation.isCheckoutBusy(building.id), payments: building.definition.acceptedPayments.map(paymentLabel) }))

  suppliers.value = simulation.getSuppliers()
  orders.value = simulation.getPurchaseOrders()
  reserveLines.value = simulation.getReserveLines().map(line => ({ ...line, productName: getProductDefinition(line.productKey)?.name ?? line.productKey }))
  storageCapacities.value = (['ambient', 'cold', 'frozen'] as StorageType[]).map(type => { const capacity = simulation.getStorageCapacity(type); const used = simulation.getStorageUsed(type); return { type, capacity, used, ratio: capacity ? used / capacity : 0 } })
  selectedId.value = scene.selectedBuildingId
}

function storageLabel(type: StorageType) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée' }
function paymentLabel(value: string) { return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value) }
function handleAzertyShortcuts(event: KeyboardEvent) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return
  const key = event.key.toLocaleLowerCase('fr-FR')
  const scene = getScene()
  if (!scene) return
  if (!event.shiftKey && key === 'a') scene.rotateScene(-1)
  if (!event.shiftKey && key === 'e') scene.rotateScene(1)
  if (event.shiftKey && key === 'a') scene.restock()
  if (event.shiftKey && key === 's') scene.toggleAutoSpawn()
}

onMounted(() => {
  if (!gameContainer.value) return
  game = new Phaser.Game({ type: Phaser.AUTO, parent: gameContainer.value, width: gameContainer.value.clientWidth, height: gameContainer.value.clientHeight, backgroundColor: '#0f172a', scene: [StoreScene], scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true } })
  window.addEventListener('keydown', handleAzertyShortcuts, { capture: true })
  refreshTimer = window.setInterval(refreshUi, 250)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true })
  if (refreshTimer) window.clearInterval(refreshTimer)
  game?.destroy(true)
})
</script>
