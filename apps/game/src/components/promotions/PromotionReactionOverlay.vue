<template>
  <div class="promotion-reactions" aria-live="polite">
    <transition-group name="reaction">
      <article v-for="reaction in reactions" :key="reaction.id" :class="{ accepted: reaction.accepted }">
        <span>{{ reaction.accepted ? '💬' : '🤔' }}</span>
        <div><strong>{{ reaction.customerId }} · {{ reaction.productName }}</strong><p>{{ reaction.message }}</p></div>
        <small>{{ reaction.promotionLabel }}</small>
      </article>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface PromotionReaction {
  id: number
  customerId: string
  productName: string
  promotionLabel?: string
  accepted: boolean
  message: string
}

const reactions = ref<PromotionReaction[]>([])
let nextId = 1

function onReaction(event: Event) {
  const detail = (event as CustomEvent<Omit<PromotionReaction, 'id'>>).detail
  const reaction = { ...detail, id: nextId++ }
  reactions.value = [...reactions.value.slice(-3), reaction]
  window.setTimeout(() => { reactions.value = reactions.value.filter(item => item.id !== reaction.id) }, 3_800)
}

onMounted(() => window.addEventListener('market-tycoon:promotion-reaction', onReaction))
onBeforeUnmount(() => window.removeEventListener('market-tycoon:promotion-reaction', onReaction))
</script>

<style scoped>
.promotion-reactions{position:fixed;right:18px;bottom:92px;z-index:1400;display:flex;width:min(360px,calc(100vw - 36px));flex-direction:column;gap:8px;pointer-events:none}.promotion-reactions article{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px 12px;border:1px solid #7c2d12;border-radius:12px;background:rgba(67,20,7,.94);box-shadow:0 12px 30px rgba(0,0,0,.28);color:#ffedd5}.promotion-reactions article.accepted{border-color:#166534;background:rgba(20,83,45,.94);color:#dcfce7}.promotion-reactions strong{display:block;font-size:11px}.promotion-reactions p{margin:2px 0 0;font-size:11px}.promotion-reactions small{padding:3px 6px;border-radius:999px;background:rgba(255,255,255,.12);font-size:9px;font-weight:900}.reaction-enter-active,.reaction-leave-active{transition:.25s ease}.reaction-enter-from,.reaction-leave-to{transform:translateX(24px);opacity:0}
</style>
