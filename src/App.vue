<template>
  <main class="app-shell">
    <aside class="panel">
      <p class="eyebrow">Prototype</p>
      <h1>Market Tycoon</h1>
      <p>Construis les premiers rayons de ton magasin sur une grille isométrique.</p>
      <dl>
        <div><dt>Clic gauche</dt><dd>Placer un rayon</dd></div>
        <div><dt>Clic droit</dt><dd>Supprimer</dd></div>
        <div><dt>R</dt><dd>Faire pivoter</dd></div>
        <div><dt>Molette</dt><dd>Zoomer</dd></div>
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
})

onBeforeUnmount(() => game?.destroy(true))
</script>
