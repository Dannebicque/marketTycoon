<template>
  <section class="help-widget">
    <div class="help-actions">
      <button title="Tourner la carte vers la gauche" @click="rotate(-1)">↶</button>
      <button title="Tourner la carte vers la droite" @click="rotate(1)">↷</button>
      <button class="wall-mode-trigger" :title="wallModeTitle" @click="cycleWallMode">{{ wallModeIcon }} {{ wallModeLabel }}</button>
      <button class="help-trigger" @click="open = true">? Aide</button>
    </div>

    <div v-if="open" class="help-backdrop" @click.self="open = false">
      <article class="help-window" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header>
          <div><span class="eyebrow">Guide du joueur</span><h2 id="help-title">Commandes et raccourcis</h2></div>
          <button class="help-close" title="Fermer" @click="open = false">×</button>
        </header>

        <nav class="help-tabs" aria-label="Pages d’aide">
          <button :class="{ active: page === 'commands' }" @click="page = 'commands'">Commandes</button>
          <button :class="{ active: page === 'construction' }" @click="page = 'construction'">Construction</button>
        </nav>

        <div v-if="page === 'commands'" class="help-content">
          <section>
            <h3>Caméra et carte</h3>
            <dl>
              <div><dt><kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Déplacer la caméra</dd></div>
              <div><dt><kbd>Molette</kbd></dt><dd>Zoomer ou dézoomer</dd></div>
              <div><dt><kbd>Clic milieu</kbd></dt><dd>Déplacer librement la caméra</dd></div>
              <div><dt><kbd>A</kbd> / <kbd>E</kbd></dt><dd>Tourner la carte à gauche ou à droite</dd></div>
              <div><dt><kbd>Bouton Murs</kbd></dt><dd>Passer entre affichage automatique, complet et abaissé</dd></div>
            </dl>
          </section>

          <section>
            <h3>Construction</h3>
            <dl>
              <div><dt><kbd>R</kbd></dt><dd>Tourner l’équipement ou l’arête sélectionnée</dd></div>
              <div><dt><kbd>1</kbd></dt><dd>Sélectionner un rayon standard</dd></div>
              <div><dt><kbd>2</kbd></dt><dd>Sélectionner une caisse standard</dd></div>
              <div><dt><kbd>3</kbd></dt><dd>Sélectionner l’outil Mur</dd></div>
              <div><dt><kbd>4</kbd></dt><dd>Sélectionner l’outil Porte</dd></div>
              <div><dt><kbd>Clic droit</kbd></dt><dd>Supprimer l’élément ou la zone survolée</dd></div>
            </dl>
          </section>

          <section>
            <h3>Simulation</h3>
            <dl>
              <div><dt><kbd>Espace</kbd></dt><dd>Mettre en pause ou reprendre</dd></div>
              <div><dt><kbd>C</kbd></dt><dd>Ajouter un client</dd></div>
              <div><dt><kbd>N</kbd></dt><dd>Passer au jour suivant lorsque possible</dd></div>
              <div><dt><kbd>Maj</kbd> + <kbd>A</kbd></dt><dd>Demander le réassort</dd></div>
              <div><dt><kbd>Maj</kbd> + <kbd>S</kbd></dt><dd>Activer ou désactiver les arrivées automatiques</dd></div>
            </dl>
          </section>
        </div>

        <div v-else class="help-content">
          <section>
            <h3>Construire une longueur de mur</h3>
            <ol>
              <li>Sélectionnez l’outil <strong>Mur</strong>.</li>
              <li>Orientez l’arête avec <kbd>R</kbd>.</li>
              <li>Maintenez le clic gauche sur la première arête.</li>
              <li>Déplacez le pointeur : le tracé reste verrouillé sur la ligne ou la colonne initiale.</li>
              <li>Relâchez pour terminer la longueur.</li>
            </ol>
            <p>Le jeu remplit automatiquement les segments intermédiaires. Une légère dérive du pointeur ne change plus l’axe du mur.</p>
          </section>
          <section>
            <h3>Visibilité des murs</h3>
            <p><strong>Auto</strong> conserve les murs éloignés en hauteur et abaisse ceux situés au premier plan. <strong>Complets</strong> montre toute la hauteur. <strong>Bas</strong> réduit tous les murs pour faciliter la construction et la sélection des équipements.</p>
          </section>
          <section>
            <h3>Modes d’interaction</h3>
            <p><strong>Curseur</strong> sélectionne les équipements sans construire. <strong>Construction</strong> place l’objet choisi. <strong>Zones</strong> peint les surfaces fonctionnelles et désactive les équipements.</p>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { viewDisplayRuntime, type WallDisplayMode } from '../../phaser/viewDisplayRuntime'

const open = ref(false)
const page = ref<'commands' | 'construction'>('commands')
const revision = ref(0)
const unsubscribe = viewDisplayRuntime.subscribe(() => revision.value++)
onBeforeUnmount(unsubscribe)

const wallMode = computed(() => { void revision.value; return viewDisplayRuntime.wallMode })
const wallModeLabel = computed(() => wallMode.value === 'auto' ? 'Auto' : wallMode.value === 'full' ? 'Complets' : 'Bas')
const wallModeIcon = computed(() => wallMode.value === 'auto' ? '◩' : wallMode.value === 'full' ? '▥' : '▁')
const wallModeTitle = computed(() => `Affichage des murs : ${wallModeLabel.value}`)

function rotate(step: -1 | 1) {
  window.dispatchEvent(new CustomEvent('market-tycoon:rotate', { detail: { step } }))
}

function cycleWallMode() {
  const next: Record<WallDisplayMode, WallDisplayMode> = { auto: 'full', full: 'low', low: 'auto' }
  viewDisplayRuntime.setWallMode(next[wallMode.value])
}
</script>
