<template>
  <div class="management-content settings-panel">
    <div>
      <span class="eyebrow">{{ t('settings.title') }}</span>
      <h2>{{ t('settings.intro') }}</h2>
    </div>

    <label class="setting-row">
      <span>
        <strong>{{ t('settings.language') }}</strong>
        <small>{{ t('settings.languageHelp') }}</small>
      </span>
      <select v-model="selectedLocale" @change="changeLocale">
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>

    <article class="translation-example">
      <span>Exemple objet / Phaser</span>
      <strong>{{ t('objects.standard-shelf.name') }}</strong>
      <small>{{ t('objects.standard-shelf.description') }}</small>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type SupportedLocale } from '../../i18n'

const { t, locale } = useI18n({ useScope: 'global' })
const selectedLocale = ref<SupportedLocale>(locale.value as SupportedLocale)

function changeLocale() {
  setLocale(selectedLocale.value)
}
</script>

<style scoped>
.settings-panel { display:grid; gap:20px; }
.setting-row { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:18px; border:1px solid rgba(148,163,184,.25); border-radius:12px; background:rgba(15,23,42,.45); }
.setting-row span { display:grid; gap:5px; }
.setting-row small, .translation-example small { color:#94a3b8; }
.setting-row select { min-width:180px; padding:10px 12px; border-radius:8px; border:1px solid #475569; background:#0f172a; color:#f8fafc; }
.translation-example { display:grid; gap:6px; padding:18px; border-radius:12px; background:rgba(30,41,59,.65); }
.translation-example > span { color:#94a3b8; font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; }
@media (max-width:700px) { .setting-row { align-items:stretch; flex-direction:column; } .setting-row select { width:100%; } }
</style>
