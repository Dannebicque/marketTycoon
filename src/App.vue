<template>
  <main class="app-shell">
    <header class="hud">
      <div class="brand"><span class="eyebrow">Market Tycoon</span><strong>Jour {{ ui.day }}</strong></div>
      <div class="hud-stat"><span>Budget</span><strong>{{ money(ui.cash) }}</strong></div>
      <div class="hud-stat"><span>Heure</span><strong>{{ ui.time }}</strong></div>
      <div class="hud-stat"><span>Clients</span><strong>{{ ui.customers }}</strong></div>
      <div class="hud-stat"><span>Stock</span><strong>{{ ui.stock }}</strong></div>
      <div class="hud-stat positive"><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></div>
      <div class="hud-stat negative"><span>Charges</span><strong>{{ money(ui.dayMerchandiseCost + ui.dayOperatingCost) }}</strong></div>
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
      <button @click="command('restock')"><span class="tool-icon">📦</span><span>Réappro.</span></button>
    </aside>

    <section ref="gameContainer" class="game-container" />

    <aside class="selection-panel">
      <div class="panel-heading">
        <div><span class="eyebrow">Gestion</span><h2>{{ selectedItem ? selectedItem.buildingName : 'Sélection' }}</h2></div>
        <button v-if="selectedItem" class="close-button" @click="selectBuilding(null)">×</button>
      </div>

      <template v-if="selectedItem?.type === 'shelf'">
        <div class="selection-type">{{ selectedItem.columns }} colonnes × {{ selectedItem.levels }} étagères</div>
        <p class="panel-help">{{ selectedItem.description }}</p>
        <div class="equipment-summary">
          <span>{{ selectedItem.configuredSlots }}/{{ selectedItem.slots.length }} emplacements configurés</span>
          <strong>{{ selectedItem.stock }}/{{ selectedItem.capacity }}</strong>
        </div>
        <button class="panel-action" @click="restockEquipment(selectedItem.id)">Réapprovisionner le meuble</button>

        <div class="equipment-grid" :style="{ gridTemplateColumns: `repeat(${selectedItem.columns}, minmax(0, 1fr))` }">
          <section v-for="column in selectedItem.columnGroups" :key="column.index" class="equipment-column">
            <h3>Col. {{ column.index + 1 }}</h3>
            <article v-for="slot in column.slots" :key="slot.id" class="equipment-slot" :class="{ empty: !slot.productKey }">
              <div class="slot-heading">
                <span>Étagère {{ slot.level + 1 }}</span>
                <strong>{{ slot.quantity }}/{{ slot.capacity }}</strong>
              </div>
              <select :value="slot.productKey ?? ''" @change="assignProduct(selectedItem.id, slot.id, $event)">
                <option value="">Vide</option>
                <option v-for="product in selectedItem.compatibleProducts" :key="product.key" :value="product.key">
                  {{ product.name }} ({{ product.capacity }})
                </option>
              </select>
              <div v-if="slot.productKey" class="slot-product">
                <i :style="{ background: slot.color }" />
                <span>{{ slot.productName }}</span>
              </div>
              <button v-if="slot.productKey && slot.quantity < slot.capacity" class="slot-action" @click="restockSlot(selectedItem.id, slot.id)">Remplir</button>
            </article>
          </section>
        </div>
      </template>

      <template v-else-if="selectedItem?.type === 'checkout'">
        <div class="selection-type">Caisse</div>
        <p class="panel-help">{{ selectedItem.description }}</p>
        <dl class="detail-list">
          <div><dt>File actuelle</dt><dd>{{ selectedItem.queueLength }} client(s)</dd></div>
          <div><dt>État</dt><dd>{{ selectedItem.busy ? 'Encaissement' : 'Disponible' }}</dd></div>
          <div><dt>Articles max.</dt><dd>{{ selectedItem.maxBasketSize ?? 'Illimité' }}</dd></div>
          <div><dt>Paiements</dt><dd>{{ selectedItem.payments.join(', ') }}</dd></div>
          <div><dt>Employé requis</dt><dd>{{ selectedItem.requiresEmployee ? 'Oui' : 'Non' }}</dd></div>
          <div><dt>Coût</dt><dd>{{ money(selectedItem.price) }}</dd></div>
        </dl>
      </template>

      <template v-else>
        <p class="panel-help">Clique sur un équipement dans la scène ou dans cette liste pour le configurer.</p>
        <h3>Rayons</h3>
        <button v-for="item in shelves" :key="item.id" class="selection-row" @click="selectBuilding(item.id)">
          <span><i :style="{ background: item.color }" />{{ item.buildingName }}</span><strong>{{ item.stock }}/{{ item.capacity }}</strong>
        </button>
        <h3>Caisses</h3>
        <button v-for="item in checkouts" :key="item.id" class="selection-row" @click="selectBuilding(item.id)">
          <span>{{ item.buildingName }}</span><strong>{{ item.queueLength }} en file</strong>
        </button>
      </template>

      <div class="economy-card">
        <h3>Économie du jour</h3>
        <dl class="detail-list">
          <div><dt>Construction</dt><dd>{{ money(ui.dayConstructionCost) }}</dd></div>
          <div><dt>Marchandises</dt><dd>{{ money(ui.dayMerchandiseCost) }}</dd></div>
          <div><dt>Électricité</dt><dd>{{ money(ui.dayOperatingCost) }}</dd></div>
          <div><dt>Chiffre d’affaires</dt><dd>{{ money(ui.dayRevenue) }}</dd></div>
          <div class="total"><dt>Bénéfice</dt><dd>{{ money(ui.dayProfit) }}</dd></div>
        </dl>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Phaser from 'phaser'
import { BUILDINGS } from './game/catalog/buildings'
import { getProductDefinition } from './game/catalog/products'
import type { BuildingKey } from './game/definitions'
import { isCheckoutDefinition, isShelfDefinition } from './game/definitions'
import { StoreScene } from './game/StoreScene'

interface ProductOption { key: string; name: string; capacity: number }
interface SlotUi { id: string; column: number; level: number; productKey: string | null; productName: string; quantity: number; capacity: number; color: string }
interface ShelfUi {
  id: string; type: 'shelf'; buildingName: string; description: string; color: string
  columns: number; levels: number; slots: SlotUi[]; stock: number; capacity: number
  configuredSlots: number; compatibleProducts: ProductOption[]
  columnGroups: Array<{ index: number; slots: SlotUi[] }>
}
interface CheckoutUi {
  id: string; type: 'checkout'; buildingName: string; description: string; queueLength: number
  busy: boolean; price: number; maxBasketSize?: number; payments: string[]; requiresEmployee: boolean
}
type SelectedUi = ShelfUi | CheckoutUi

const gameContainer = ref<HTMLElement | null>(null)
const activeTool = ref<BuildingKey>('standard-shelf')
const selectedId = ref<string | null>(null)
let game: Phaser.Game | null = null
let refreshTimer: number | undefined

const tools = BUILDINGS
const ui = reactive({
  cash: 2000, day: 1, time: '08:00', customers: 0, stock: 0, autoSpawn: false,
  dayRevenue: 0, dayConstructionCost: 0, dayMerchandiseCost: 0, dayOperatingCost: 0, dayProfit: 0,
})
const shelves = ref<ShelfUi[]>([])
const checkouts = ref<CheckoutUi[]>([])
const selectedItem = computed<SelectedUi | undefined>(() => [...shelves.value, ...checkouts.value].find(item => item.id === selectedId.value))

function getScene(): StoreScene | null {
  if (!game) return null
  return game.scene.getScene('StoreScene') as StoreScene | null
}

function selectTool(key: BuildingKey) {
  activeTool.value = key
  getScene()?.select(key)
}

function selectBuilding(id: string | null) {
  selectedId.value = id
  getScene()?.selectBuilding(id)
}

function command(name: 'spawnCustomer' | 'toggleAutoSpawn' | 'restock') {
  const scene = getScene()
  if (!scene) return
  if (name === 'spawnCustomer') void scene.spawnCustomer()
  else scene[name]()
}

function assignProduct(buildingId: string, compartmentId: string, event: Event) {
  const productKey = (event.target as HTMLSelectElement).value || null
  getScene()?.configureCompartment(buildingId, compartmentId, productKey)
  refreshUi()
}

function restockSlot(buildingId: string, compartmentId: string) {
  getScene()?.restockCompartment(buildingId, compartmentId)
  refreshUi()
}

function restockEquipment(buildingId: string) {
  getScene()?.restockEquipment(buildingId)
  refreshUi()
}

function refreshUi() {
  const scene = getScene()
  if (!scene) return
  const simulation = scene.simulation
  const metrics = simulation.metrics
  const minutes = scene.currentMinutes

  ui.cash = metrics.cash
  ui.day = scene.day
  ui.time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  ui.customers = scene.customers.size
  ui.stock = simulation.getTotalStock()
  ui.autoSpawn = scene.autoSpawn
  ui.dayRevenue = simulation.getDayRevenue()
  ui.dayConstructionCost = simulation.getDayConstructionExpenses()
  ui.dayMerchandiseCost = simulation.getDayMerchandiseExpenses()
  ui.dayOperatingCost = simulation.getDayOperatingExpenses()
  ui.dayProfit = simulation.getDayProfit()

  const buildings = scene.grid.getBuildings()
  shelves.value = buildings.filter(building => isShelfDefinition(building.definition)).map(building => {
    const definition = building.definition
    const inventory = simulation.getEquipmentInventory(building.id)
    const slots: SlotUi[] = (inventory?.compartments ?? []).map(slot => {
      const product = slot.productKey ? getProductDefinition(slot.productKey) : undefined
      return {
        id: slot.id,
        column: slot.column,
        level: slot.level,
        productKey: slot.productKey,
        productName: product?.name ?? 'Vide',
        quantity: slot.quantity,
        capacity: slot.capacity,
        color: product ? `#${product.color.toString(16).padStart(6, '0')}` : '#334155',
      }
    })
    const compatibleProducts = simulation.getCompatibleProducts(building.id).map(product => ({
      key: product.key,
      name: product.name,
      capacity: product.capacities[definition.layout.compartmentType] ?? 0,
    }))
    const stock = slots.reduce((total, slot) => total + slot.quantity, 0)
    const capacity = slots.reduce((total, slot) => total + slot.capacity, 0)
    return {
      id: building.id,
      type: 'shelf' as const,
      buildingName: definition.name,
      description: definition.description,
      color: `#${definition.color.toString(16).padStart(6, '0')}`,
      columns: definition.layout.columns,
      levels: definition.layout.levels,
      slots,
      stock,
      capacity,
      configuredSlots: slots.filter(slot => slot.productKey).length,
      compatibleProducts,
      columnGroups: Array.from({ length: definition.layout.columns }, (_, index) => ({
        index,
        slots: slots.filter(slot => slot.column === index).sort((a, b) => b.level - a.level),
      })),
    }
  })

  checkouts.value = buildings.filter(building => isCheckoutDefinition(building.definition)).map(building => ({
    id: building.id,
    type: 'checkout' as const,
    buildingName: building.definition.name,
    description: building.definition.description,
    queueLength: simulation.queueLength(building.id),
    busy: simulation.isCheckoutBusy(building.id),
    price: building.definition.price,
    maxBasketSize: building.definition.maxBasketSize,
    payments: building.definition.acceptedPayments.map(paymentLabel),
    requiresEmployee: building.definition.requiresEmployee,
  }))

  selectedId.value = scene.selectedBuildingId
  if (selectedId.value && ![...shelves.value, ...checkouts.value].some(item => item.id === selectedId.value)) selectBuilding(null)
}

function paymentLabel(value: string) { return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces' }
function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value) }

function handleAzertyShortcuts(event: KeyboardEvent) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return
  const key = event.key.toLocaleLowerCase('fr-FR')
  const scene = getScene()
  if (!scene) return
  if (!event.shiftKey && key === 'a') { event.preventDefault(); scene.rotateScene(-1) }
  if (!event.shiftKey && key === 'e') { event.preventDefault(); scene.rotateScene(1) }
  if (event.shiftKey && key === 'a') { event.preventDefault(); scene.restock() }
  if (event.shiftKey && key === 's') { event.preventDefault(); scene.toggleAutoSpawn() }
}

onMounted(() => {
  if (!gameContainer.value) return
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: gameContainer.value.clientWidth,
    height: gameContainer.value.clientHeight,
    backgroundColor: '#0f172a',
    scene: [StoreScene],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
  })
  window.addEventListener('keydown', handleAzertyShortcuts, { capture: true })
  refreshTimer = window.setInterval(refreshUi, 200)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true })
  if (refreshTimer) window.clearInterval(refreshTimer)
  game?.destroy(true)
})
</script>
