<template>
  <main class="app-shell">
    <aside class="panel">
      <p class="eyebrow">Prototype jouable</p>
      <h1>Market Tycoon</h1>
      <p>Construis le magasin, diversifie les rayons et gère les clients sur une journée complète.</p>

      <h2>Construction</h2>
      <dl>
        <div><dt>1</dt><dd>Rayon</dd></div>
        <div><dt>2</dt><dd>Caisse</dd></div>
        <div><dt>3</dt><dd>Mur</dd></div>
        <div><dt>4</dt><dd>Porte</dd></div>
      </dl>

      <h2>Simulation</h2>
      <dl>
        <div><dt>C</dt><dd>Ajouter un client</dd></div>
        <div><dt>Maj + S</dt><dd>Arrivées automatiques</dd></div>
        <div><dt>Maj + A</dt><dd>Réapprovisionner</dd></div>
        <div><dt>N</dt><dd>Jour suivant</dd></div>
      </dl>

      <h2>Vue — AZERTY</h2>
      <dl>
        <div><dt>A / E</dt><dd>Tourner la scène</dd></div>
        <div><dt>ZQSD</dt><dd>Déplacer la caméra</dd></div>
        <div><dt>Flèches</dt><dd>Déplacer la caméra</dd></div>
        <div><dt>Bouton central</dt><dd>Déplacer à la souris</dd></div>
        <div><dt>Molette</dt><dd>Zoomer</dd></div>
      </dl>

      <h2>Construction</h2>
      <dl>
        <div><dt>Clic gauche</dt><dd>Placer / tracer un mur</dd></div>
        <div><dt>Clic droit</dt><dd>Supprimer</dd></div>
        <div><dt>R</dt><dd>Faire pivoter l’objet</dd></div>
      </dl>
    </aside>
    <section ref="gameContainer" class="game-container" />
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Phaser from 'phaser'
import { StoreScene } from './game/StoreScene'

const gameContainer = ref<HTMLElement | null>(null)
let game: Phaser.Game | null = null

type SceneCommands = {
  rotateScene: (step: -1 | 1) => void
  restock: () => void
  toggleAutoSpawn: () => void
}

function getStoreScene(): SceneCommands | null {
  const scene = game?.scene.getScene('StoreScene')
  return scene ? scene as unknown as SceneCommands : null
}

function handleAzertyShortcuts(event: KeyboardEvent) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, [contenteditable="true"]')) return

  const key = event.key.toLocaleLowerCase('fr-FR')
  const scene = getStoreScene()
  if (!scene) return

  if (!event.shiftKey && key === 'a') {
    event.preventDefault()
    event.stopImmediatePropagation()
    scene.rotateScene(-1)
    return
  }

  if (!event.shiftKey && key === 'e') {
    event.preventDefault()
    event.stopImmediatePropagation()
    scene.rotateScene(1)
    return
  }

  if (event.shiftKey && key === 'a') {
    event.preventDefault()
    event.stopImmediatePropagation()
    scene.restock()
    return
  }

  if (event.shiftKey && key === 's') {
    event.preventDefault()
    event.stopImmediatePropagation()
    scene.toggleAutoSpawn()
  }
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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleAzertyShortcuts, { capture: true })
  game?.destroy(true)
})
</script>
