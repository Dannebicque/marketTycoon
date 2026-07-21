<template>
  <aside class="selection-panel">
    <div class="panel-heading">
      <div><span class="eyebrow">Équipement</span><h2>{{ selectedItem ? selectedItem.buildingName : 'Sélection' }}</h2></div>
      <button v-if="selectedItem" class="close-button" @click="$emit('select', null)">×</button>
    </div>

    <template v-if="selectedItem?.type === 'shelf'">
      <div class="selection-type">{{ selectedItem.columns }} colonnes × {{ selectedItem.levels }} étagères</div>
      <p class="panel-help">{{ selectedItem.description }}</p>
      <div class="equipment-summary"><span>{{ selectedItem.configuredSlots }}/{{ selectedItem.slots.length }} configurés</span><strong>{{ selectedItem.stock }}/{{ selectedItem.capacity }}</strong></div>
      <button class="panel-action" @click="$emit('restock-equipment', selectedItem.id)">Remplir depuis la réserve</button>
      <div class="equipment-grid" :style="{ gridTemplateColumns: `repeat(${selectedItem.columns}, minmax(0, 1fr))` }">
        <section v-for="column in selectedItem.columnGroups" :key="column.index" class="equipment-column">
          <h3>Col. {{ column.index + 1 }}</h3>
          <article v-for="slot in column.slots" :key="slot.id" class="equipment-slot" :class="{ empty: !slot.productKey }">
            <div class="slot-heading"><span>Étagère {{ slot.level + 1 }}</span><strong>{{ slot.quantity }}/{{ slot.capacity }}</strong></div>
            <select :value="slot.productKey ?? ''" @change="$emit('assign-product', selectedItem.id, slot.id, $event)">
              <option value="">Vide</option>
              <option v-for="product in selectedItem.compatibleProducts" :key="product.key" :value="product.key">{{ product.name }} ({{ product.capacity }})</option>
            </select>
            <div v-if="slot.productKey" class="slot-product"><i :style="{ background: slot.color }" /><span>{{ slot.productName }}</span></div>
            <small v-if="slot.productKey">Réserve : {{ slot.reserveQuantity }}</small>
            <button v-if="slot.productKey && slot.quantity < slot.capacity" class="slot-action" @click="$emit('restock-slot', selectedItem.id, slot.id)">Remplir</button>
          </article>
        </section>
      </div>
    </template>

    <template v-else-if="selectedItem?.type === 'storage'">
      <div class="selection-type">Réserve {{ storageLabel(selectedItem.storageType) }}</div>
      <p class="panel-help">{{ selectedItem.description }}</p>
      <div class="stock-meter"><span :style="{ width: `${selectedItem.ratio * 100}%` }" /></div>
      <dl class="detail-list"><div><dt>Utilisé</dt><dd>{{ selectedItem.used }}</dd></div><div><dt>Capacité</dt><dd>{{ selectedItem.capacity }}</dd></div><div><dt>Disponible</dt><dd>{{ selectedItem.free }}</dd></div></dl>
      <button class="panel-action" @click="$emit('open-management', 'reserve')">Ouvrir la gestion de réserve</button>
    </template>

    <template v-else-if="selectedItem?.type === 'checkout'">
      <div class="selection-type">Caisse</div><p class="panel-help">{{ selectedItem.description }}</p>
      <dl class="detail-list">
        <div><dt>Ouverture</dt><dd :class="selectedItem.open ? 'positive-text' : 'negative-text'">{{ selectedItem.open ? 'Ouverte' : 'Fermée' }}</dd></div>
        <div><dt>Caissier</dt><dd>{{ selectedItem.employeeName ?? 'Aucun' }}</dd></div>
        <div><dt>File</dt><dd>{{ selectedItem.queueLength }}</dd></div>
        <div><dt>État</dt><dd>{{ selectedItem.busy ? 'Encaissement' : selectedItem.open ? 'Disponible' : 'Hors service' }}</dd></div>
        <div><dt>Paiements</dt><dd>{{ selectedItem.payments.join(', ') }}</dd></div>
      </dl>
      <button v-if="!selectedItem.open" class="panel-action" @click="$emit('open-management', 'employees')">Affecter un caissier</button>
    </template>

    <template v-else>
      <p class="panel-help">Clique sur un équipement dans la scène pour le configurer.</p>
      <h3>Rayons</h3><button v-for="item in shelves" :key="item.id" class="selection-row" @click="$emit('select', item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.stock }}/{{ item.capacity }}</strong></button>
      <h3>Réserves</h3><button v-for="item in storages" :key="item.id" class="selection-row" @click="$emit('select', item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.used }}/{{ item.capacity }}</strong></button>
      <h3>Caisses</h3><button v-for="item in checkouts" :key="item.id" class="selection-row" @click="$emit('select', item.id)"><span>{{ item.buildingName }}</span><strong>{{ item.open ? item.queueLength : 'Fermée' }}</strong></button>
    </template>
  </aside>
</template>

<script setup lang="ts">
import type { StorageType } from '@market-tycoon/catalog'

defineProps<{ selectedItem?: any; shelves: any[]; storages: any[]; checkouts: any[] }>()
defineEmits<{
  select: [id: string | null]
  'assign-product': [buildingId: string, slotId: string, event: Event]
  'restock-slot': [buildingId: string, slotId: string]
  'restock-equipment': [buildingId: string]
  'open-management': [tab: 'reserve' | 'employees']
}>()

function storageLabel(type: StorageType) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée' }
</script>
