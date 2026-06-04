<template>
  <span
    class="req-badge"
    :data-req-badge="reqId"
    @click.stop="handleClick"
  >
    {{ reqId }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  reqId: number
}>()

const emit = defineEmits<{
  click: [reqId: number, element: HTMLElement]
}>()

function handleClick(event: MouseEvent) {
  const el = (event.currentTarget as HTMLElement).parentElement
  if (el) {
    emit('click', props.reqId, el)
  }
}
</script>

<style scoped>
.req-badge {
  display: inline-block;
  vertical-align: top;
  background: #2563EB;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  line-height: 14px;
  padding: 0 4px;
  border-radius: 2px;
  border: none;
  cursor: pointer;
  position: absolute;
  top: -8px;
  right: -4px;
  z-index: 9990;
  user-select: none;
  white-space: nowrap;
}

.req-badge.highlight {
  animation: req-pulse 2s ease-out;
}

@keyframes req-pulse {
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5); }
  30% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}
</style>
