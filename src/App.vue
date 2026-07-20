<template>
  <main class="app-shell">
    <aside class="panel">
      <p class="eyebrow">Prototype jouable</p>
      <h1>Market Tycoon</h1>
      <p>Construis ton magasin, puis teste le parcours d’un premier client.</p>

      <h2>Éléments</h2>
      <dl>
        <div><dt>1</dt><dd>Rayon</dd></div>
        <div><dt>2</dt><dd>Caisse</dd></div>
        <div><dt>3</dt><dd>Mur</dd></div>
        <div><dt>4</dt><dd>Porte</dd></div>
      </dl>

      <h2>Contrôles</h2>
      <dl>
        <div><dt>Clic gauche</dt><dd>Placer</dd></div>
        <div><dt>Glisser</dt><dd>Tracer des murs</dd></div>
        <div><dt>Clic droit</dt><dd>Supprimer</dd></div>
        <div><dt>R</dt><dd>Faire pivoter</dd></div>
        <div><dt>C</dt><dd>Lancer un client</dd></div>
        <div><dt>Échap</dt><dd>Masquer l’aperçu</dd></div>
        <div><dt>Molette</dt><dd>Zoomer</dd></div>
      </dl>

      <p class="hint">Le client doit pouvoir aller de l’entrée au rayon, puis à la caisse et enfin ressortir. Les murs bloquent le déplacement, les portes l’autorisent.</p>
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
