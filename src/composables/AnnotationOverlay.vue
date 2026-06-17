<template>
  <Teleport to="body">
    <div v-if="store.panelOpen.value" class="anno-overlay" @click.stop>
      <div
        v-for="badge in badges"
        :key="badge.id"
        class="anno-badge"
        :class="{ active: store.activeReqId.value === badge.reqId }"
        :data-req="badge.reqId"
        :style="{ left: badge.x + 'px', top: badge.y + 'px' }"
        @click.stop="store.handleBadgeClick(badge.reqId)"
      >
        {{ badge.reqId }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getAnnotationStore } from './useAnnotationStore'

const store = getAnnotationStore()

interface BadgePos {
  id: string
  reqId: number
  x: number
  y: number
}

const badges = ref<BadgePos[]>([])

function updateBadges() {
  if (!store.panelOpen.value) { badges.value = []; return }

  const mainArea = document.querySelector('.main-area')
  if (!mainArea) return

  const pageRoot = mainArea.querySelector(store.getCurrentPageSelector()) || mainArea
  const visibleReqIds = new Set(store.requirementsForCurrentPage.value.map(req => req.id))
  const els = pageRoot.querySelectorAll('[data-req-id]')
  const result: BadgePos[] = []

  els.forEach(el => {
    const reqId = parseInt(el.getAttribute('data-req-id') || '0')
    if (!reqId || !visibleReqIds.has(reqId)) return
    const elRect = el.getBoundingClientRect()
    if (elRect.width === 0 && elRect.height === 0) return
    result.push({
      id: `${reqId}-${elRect.x}-${elRect.y}`,
      reqId,
      x: elRect.left - 26,
      y: elRect.top + 4,
    })
  })

  badges.value = result
}

watch(() => store.panelOpen.value, () => {
  setTimeout(updateBadges, 100)
})

watch(() => store.currentPage.value, () => {
  setTimeout(updateBadges, 100)
})

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(updateBadges, 500)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.anno-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 70;
}

.anno-badge {
  position: absolute;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #2563EB;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
  z-index: 9990;
}

.anno-badge:hover {
  transform: scale(1.3);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6);
}

.anno-badge.highlight,
.anno-badge.active {
  animation: badge-pulse 0.4s ease-out 3;
  box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.3);
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.5); }
}
</style>

<!-- Global styles for highlighted elements -->
<style>
[data-req-id].anno-highlight {
  animation: el-glow 2s ease-out;
  outline: 2px solid #2563EB;
  outline-offset: 4px;
  border-radius: 8px;
}
@keyframes el-glow {
  0% { outline-color: #2563EB; outline-width: 4px; }
  100% { outline-color: transparent; outline-width: 0px; }
}
</style>
