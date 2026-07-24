<template>
  <section class="store-identity" :class="{ editing }" aria-label="Identité du magasin">
    <button v-if="!editing" class="store-identity-card" type="button" title="Personnaliser le magasin" @click="startEditing">
      <span class="store-logo" aria-hidden="true">{{ identity.icon }}</span>
      <span class="store-copy">
        <small>Market Tycoon</small>
        <strong>{{ identity.name }}</strong>
        <span>{{ identity.tagline }}</span>
      </span>
      <span class="store-edit-icon" aria-hidden="true">✦</span>
    </button>

    <form v-else class="store-identity-editor" @submit.prevent="save">
      <header>
        <div><span class="eyebrow">Votre enseigne</span><strong>Personnalisation</strong></div>
        <button type="button" aria-label="Fermer" @click="cancel">×</button>
      </header>

      <label>
        <span>Nom du magasin</span>
        <input ref="nameInput" v-model.trim="draft.name" maxlength="32" placeholder="Mon magasin" />
      </label>

      <label>
        <span>Slogan</span>
        <input v-model.trim="draft.tagline" maxlength="48" placeholder="Tout pour votre quotidien" />
      </label>

      <fieldset>
        <legend>Emblème</legend>
        <div class="store-icon-grid">
          <button v-for="icon in icons" :key="icon" type="button" :class="{ active: draft.icon === icon }" @click="draft.icon = icon">{{ icon }}</button>
        </div>
      </fieldset>

      <div class="store-editor-actions">
        <button type="button" class="secondary" @click="cancel">Annuler</button>
        <button type="submit" class="primary">Enregistrer</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'

type StoreIdentity = { name: string; tagline: string; icon: string }

const STORAGE_KEY = 'market-tycoon.store-identity'
const defaults: StoreIdentity = { name: 'Mon magasin', tagline: 'Votre commerce de proximité', icon: '🏪' }
const icons = ['🏪', '🛒', '🏬', '🌿', '⭐', '🥕', '🧺', '🏙️']

function readIdentity(): StoreIdentity {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<StoreIdentity> | null
    return { ...defaults, ...(saved ?? {}) }
  } catch {
    return { ...defaults }
  }
}

const identity = reactive<StoreIdentity>(readIdentity())
const draft = reactive<StoreIdentity>({ ...identity })
const editing = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

function startEditing() {
  Object.assign(draft, identity)
  editing.value = true
  void nextTick(() => nameInput.value?.focus())
}

function cancel() {
  Object.assign(draft, identity)
  editing.value = false
}

function save() {
  const name = draft.name.trim() || defaults.name
  const tagline = draft.tagline.trim() || defaults.tagline
  Object.assign(identity, { name, tagline, icon: draft.icon || defaults.icon })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
  editing.value = false
}
</script>
