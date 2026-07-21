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
      <button
        v-for="tool in tools"
        :key="tool.key"
        :class="{ active: activeTool === tool.key }"
        :title="tool.description"
        @click="selectTool(tool.key)"
      >
        <span class="tool-icon">{{ iconFor(tool.category, tool.key) }}</span>
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
        <div><span class="eyebrow">Gestion</span><h2>Sélection</h2></div>
        <button v-if="selectedItem" class="close-button" @click="selectedId = null">×</button>
      </div>

      <template v-if="selectedItem?.type === 'shelf'">
        <div class="selection-type">{{ selectedItem.buildingName }}</div>
        <h3>{{ selectedItem.product }}</h3>
        <p class="panel-help">{{ selectedItem.description }}</p>
        <div class="stock-meter"><span :style="{ width: `${selectedItem.stockRatio * 100}%` }" /></div>
        <dl class="detail-list">
          <div><dt>Stock</dt><dd>{{ selectedItem.stock }} / {{ selectedItem.capacity }}</dd></div>
          <div><dt>Catégorie</dt><dd>{{ selectedItem.category }}</dd></div>
          <div><dt>Prix de vente</dt><dd>{{ money(selectedItem.salePrice) }}</dd></div>
          <div><dt>Coût d’achat</dt><dd>{{ money(selectedItem.purchasePrice) }}</dd></div>
          <div><dt>Prise article</dt><dd>{{ selectedItem.pickupTime }} ms</dd></div>
          <div><dt>Électricité/jour</dt><dd>{{ money(selectedItem.electricityCost) }}</dd></div>
        </dl>
      </template>

      <template v-else-if="selectedItem?.type === 'checkout'">
        <div class="selection-type">Caisse</div>
        <h3>{{ selectedItem.buildingName }}</h3>
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
        <p class="panel-help">Sélectionne un équipement pour afficher ses caractéristiques.</p>
        <h3>Rayons</h3>
        <button v-for="item in shelves" :key="item.id" class="selection-row" @click="selectedId = item.id">
          <span><i :style="{ background: item.color }" />{{ item.buildingName }}</span><strong>{{ item.stock }}/{{ item.capacity }}</strong>
        </button>
        <h3>Caisses</h3>
        <button v-for="item in checkouts" :key="item.id" class="selection-row" @click="selectedId = item.id">
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
import type { BuildingKey } from './game/definitions'
import { isCheckoutDefinition, isShelfDefinition } from './game/definitions'
import { StoreScene } from './game/StoreScene'

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
const shelves = ref<any[]>([])
const checkouts = ref<any[]>([])
const selectedItem = computed(() => [...shelves.value, ...checkouts.value].find(item => item.id === selectedId.value))

function getScene(): StoreScene | null {
  if (!game) return null
  return game.scene.getScene('StoreScene') as StoreScene | null
}

function selectTool(key: BuildingKey) {
  activeTool.value = key
  getScene()?.select(key)
}

function command(name: 'spawnCustomer' | 'toggleAutoSpawn' | 'restock') {
  const scene = getScene()
  if (!scene) return
  if (name === 'spawnCustomer') void scene.spawnCustomer()
  else scene[name]()
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
    const state = simulation.getShelfState(building.id)
    return {
      id: building.id,
      type: 'shelf',
      buildingName: definition.name,
      description: definition.description,
      product: state?.product.name ?? 'Aucun produit',
      category: state?.product.category ?? '-',
      stock: state?.stock ?? 0,
      capacity: state?.capacity ?? definition.capacity,
      stockRatio: state?.capacity ? state.stock / state.capacity : 0,
      salePrice: state?.product.salePrice ?? 0,
      purchasePrice: state?.product.purchasePrice ?? 0,
      color: `#${definition.color.toString(16).padStart(6, '0')}`,
      pickupTime: definition.customerPickupTimeMs,
      electricityCost: definition.electricityCostPerDay ?? 0,
    }
  })
  checkouts.value = buildings.filter(building => isCheckoutDefinition(building.definition)).map(building => {
    const definition = building.definition
    return {
      id: building.id,
      type: 'checkout',
      buildingName: definition.name,
      description: definition.description,
      queueLength: simulation.queueLength(building.id),
      busy: simulation.isCheckoutBusy(building.id),
      price: definition.price,
      maxBasketSize: definition.maxBasketSize,
      payments: definition.acceptedPayments.map(paymentLabel),
      requiresEmployee: definition.requiresEmployee,
    }
  })

  if (selectedId.value && ![...shelves.value, ...checkouts.value].some(item => item.id === selectedId.value)) selectedId.value = null
}

function paymentLabel(value: string) {
  return value === 'contactless' ? 'sans contact' : value === 'card' ? 'carte' : 'espèces'
}

function iconFor(category: string, key: string) {
  if (key === 'freezer') return '❄'
  if (key === 'fruit-shelf') return '🍎'
  if (key === 'refrigerated-shelf') return '◫'
  if (key === 'bakery-shelf') return '🥖'
  if (key === 'self-checkout') return '🤖'
  if (key === 'express-checkout') return '⚡'
  if (category === 'shelf') return '▥'
  if (category === 'checkout') return '▣'
  if (category === 'wall') return '▤'
  return '▯'
}

function money(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

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
