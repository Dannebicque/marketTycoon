<template>
  <main class="app-shell">
    <header class="hud">
      <div class="brand">
        <span class="eyebrow">Market Tycoon</span>
        <strong>Jour {{ ui.day }}</strong>
      </div>
      <div class="hud-stat"><span>Budget</span><strong>{{ money(ui.cash) }}</strong></div>
      <div class="hud-stat"><span>Heure</span><strong>{{ ui.time }}</strong></div>
      <div class="hud-stat"><span>Clients</span><strong>{{ ui.customers }}</strong></div>
      <div class="hud-stat"><span>Stock</span><strong>{{ ui.stock }}</strong></div>
      <div class="hud-stat positive"><span>CA du jour</span><strong>{{ money(ui.dayRevenue) }}</strong></div>
      <div class="hud-stat negative"><span>Marchandises</span><strong>{{ money(ui.dayMerchandiseCost) }}</strong></div>
      <div class="hud-stat" :class="ui.dayProfit >= 0 ? 'positive' : 'negative'">
        <span>Bénéfice du jour</span><strong>{{ money(ui.dayProfit) }}</strong>
      </div>
    </header>

    <aside class="build-toolbar" aria-label="Outils de construction">
      <button
        v-for="tool in tools"
        :key="tool.key"
        :class="{ active: activeTool === tool.key }"
        :title="`${tool.label} — ${tool.price} €`"
        @click="selectTool(tool.key)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <span>{{ tool.label }}</span>
        <small>{{ tool.price }} €</small>
      </button>
      <div class="toolbar-separator" />
      <button title="Ajouter un client" @click="command('spawnCustomer')"><span class="tool-icon">🧍</span><span>Client</span></button>
      <button :class="{ active: ui.autoSpawn }" title="Arrivées automatiques" @click="command('toggleAutoSpawn')"><span class="tool-icon">▶</span><span>Auto</span></button>
      <button title="Réapprovisionner tous les rayons" @click="command('restock')"><span class="tool-icon">📦</span><span>Réappro.</span></button>
    </aside>

    <section ref="gameContainer" class="game-container" />

    <aside class="selection-panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">Gestion</span>
          <h2>Sélection</h2>
        </div>
        <button v-if="selectedItem" class="close-button" @click="selectedId = null">×</button>
      </div>

      <template v-if="selectedItem?.type === 'shelf'">
        <div class="selection-type">Rayon</div>
        <h3>{{ selectedItem.product }}</h3>
        <div class="stock-meter"><span :style="{ width: `${selectedItem.stockRatio * 100}%` }" /></div>
        <dl class="detail-list">
          <div><dt>Stock</dt><dd>{{ selectedItem.stock }} / {{ selectedItem.capacity }}</dd></div>
          <div><dt>Prix de vente</dt><dd>{{ money(selectedItem.salePrice) }}</dd></div>
          <div><dt>Coût d’achat</dt><dd>{{ money(selectedItem.purchasePrice) }}</dd></div>
          <div><dt>Valeur du stock</dt><dd>{{ money(selectedItem.stock * selectedItem.purchasePrice) }}</dd></div>
        </dl>
      </template>

      <template v-else-if="selectedItem?.type === 'checkout'">
        <div class="selection-type">Caisse</div>
        <h3>{{ selectedItem.label }}</h3>
        <dl class="detail-list">
          <div><dt>File actuelle</dt><dd>{{ selectedItem.queueLength }} client(s)</dd></div>
          <div><dt>État</dt><dd>{{ selectedItem.queueLength ? 'En service' : 'Disponible' }}</dd></div>
          <div><dt>Coût de construction</dt><dd>{{ money(selectedItem.price) }}</dd></div>
        </dl>
      </template>

      <template v-else>
        <p class="panel-help">Sélectionne un rayon ou une caisse dans la liste pour afficher ses informations.</p>
        <h3>Rayons</h3>
        <button v-for="item in shelves" :key="item.id" class="selection-row" @click="selectedId = item.id">
          <span><i :style="{ background: item.color }" />{{ item.product }}</span>
          <strong>{{ item.stock }}/{{ item.capacity }}</strong>
        </button>
        <h3>Caisses</h3>
        <button v-for="item in checkouts" :key="item.id" class="selection-row" @click="selectedId = item.id">
          <span>{{ item.label }}</span><strong>{{ item.queueLength }} en file</strong>
        </button>
      </template>

      <div class="economy-card">
        <h3>Économie du jour</h3>
        <dl class="detail-list">
          <div><dt>Construction</dt><dd>{{ money(ui.dayConstructionCost) }}</dd></div>
          <div><dt>Marchandises</dt><dd>{{ money(ui.dayMerchandiseCost) }}</dd></div>
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
import { StoreScene } from './game/StoreScene'

type ToolKey = 'shelf' | 'checkout' | 'wall' | 'door'
type SceneLike = Record<string, any>

const gameContainer = ref<HTMLElement | null>(null)
const activeTool = ref<ToolKey>('shelf')
const selectedId = ref<string | null>(null)
let game: Phaser.Game | null = null
let refreshTimer: number | undefined

const tools: Array<{ key: ToolKey; label: string; icon: string; price: number }> = [
  { key: 'shelf', label: 'Rayon', icon: '▥', price: 100 },
  { key: 'checkout', label: 'Caisse', icon: '▣', price: 300 },
  { key: 'wall', label: 'Mur', icon: '▤', price: 20 },
  { key: 'door', label: 'Porte', icon: '▯', price: 150 },
]

const ui = reactive({
  cash: 2000,
  day: 1,
  time: '08:00',
  customers: 0,
  stock: 0,
  autoSpawn: false,
  dayRevenue: 0,
  dayConstructionCost: 0,
  dayMerchandiseCost: 0,
  dayProfit: 0,
})

const shelves = ref<any[]>([])
const checkouts = ref<any[]>([])
const selectedItem = computed(() => [...shelves.value, ...checkouts.value].find(item => item.id === selectedId.value))

function getScene(): SceneLike | null {
  return game?.scene.getScene('StoreScene') as unknown as SceneLike ?? null
}

function selectTool(tool: ToolKey) {
  activeTool.value = tool
  getScene()?.select?.(tool)
}

function command(name: string) {
  getScene()?.[name]?.()
}

function refreshUi() {
  const scene = getScene()
  if (!scene?.simulation || !scene?.grid) return
  const simulation = scene.simulation
  const metrics = simulation.metrics
  const minutes = Number(scene.currentMinutes ?? 0)

  ui.cash = metrics.cash
  ui.day = scene.day ?? 1
  ui.time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  ui.customers = scene.customers?.size ?? 0
  ui.stock = simulation.getTotalStock()
  ui.autoSpawn = Boolean(scene.autoSpawn)
  ui.dayRevenue = simulation.getDayRevenue()
  ui.dayConstructionCost = simulation.getDayConstructionExpenses()
  ui.dayMerchandiseCost = simulation.getDayMerchandiseExpenses()
  ui.dayProfit = simulation.getDayProfit()

  const buildings = scene.grid.getBuildings()
  shelves.value = buildings.filter((building: any) => building.definition.type === 'shelf').map((building: any, index: number) => {
    const state = simulation.getShelfState(building.id)
    return {
      id: building.id,
      type: 'shelf',
      label: `Rayon ${index + 1}`,
      product: state?.product.name ?? 'Rayon',
      stock: state?.stock ?? 0,
      capacity: state?.capacity ?? 0,
      stockRatio: state?.capacity ? state.stock / state.capacity : 0,
      salePrice: state?.product.salePrice ?? 0,
      purchasePrice: state?.product.purchasePrice ?? 0,
      color: `#${(state?.product.color ?? 0x64748b).toString(16).padStart(6, '0')}`,
    }
  })
  checkouts.value = buildings.filter((building: any) => building.definition.type === 'checkout').map((building: any, index: number) => ({
    id: building.id,
    type: 'checkout',
    label: `Caisse ${index + 1}`,
    queueLength: simulation.queueLength(building.id),
    price: building.definition.price,
  }))

  if (selectedId.value && ![...shelves.value, ...checkouts.value].some(item => item.id === selectedId.value)) selectedId.value = null
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
  if (!event.shiftKey && key === 'a') { event.preventDefault(); scene.rotateScene?.(-1) }
  if (!event.shiftKey && key === 'e') { event.preventDefault(); scene.rotateScene?.(1) }
  if (event.shiftKey && key === 'a') { event.preventDefault(); scene.restock?.() }
  if (event.shiftKey && key === 's') { event.preventDefault(); scene.toggleAutoSpawn?.() }
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
