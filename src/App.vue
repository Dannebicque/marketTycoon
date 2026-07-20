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
        <div><dt>A</dt><dd>Réapprovisionner</dd></div>
        <div><dt>N</dt><dd>Jour suivant</dd></div>
      </dl>

      <h2>Caméra</h2>
      <dl>
        <div><dt>Q / E</dt><dd>Tourner la scène</dd></div>
        <div><dt>Flèches</dt><dd>Déplacer la vue</dd></div>
        <div><dt>Bouton central</dt><dd>Faire glisser la vue</dd></div>
        <div><dt>Molette</dt><dd>Zoomer</dd></div>
      </dl>

      <h2>Fonctionnement</h2>
      <p>Les clients prennent 1 à 9 articles sur plusieurs rayons. Le temps de caisse dépend du panier et du paiement.</p>

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
