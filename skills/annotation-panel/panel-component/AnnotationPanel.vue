<template>
  <Teleport to="body">
    <!-- 切换按钮 -->
    <button
      class="annotation-toggle-btn"
      :class="{ active: visible }"
      @click="$emit('toggle')"
    >
      <span class="toggle-icon">{{ visible ? '◢' : '◤' }}</span>
      需求标注
    </button>

    <!-- 面板 -->
    <Transition name="panel-slide">
      <aside
        v-if="visible"
        ref="panelEl"
        class="annotation-panel"
        :style="{ width: panelWidth + 'px' }"
        @mousedown.stop
      >
        <!-- 拖拽把手 -->
        <div class="panel-resize-handle" @mousedown="startResize"></div>

        <!-- 头部 -->
        <div class="panel-header">
          <h2 class="panel-title">需求说明</h2>
          <button class="panel-close-btn" @click="$emit('toggle')">✕</button>
        </div>

        <!-- 搜索 -->
        <div class="panel-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索需求编号或关键词..."
            class="panel-search-input"
          />
        </div>

        <!-- 需求列表 -->
        <div class="panel-list" ref="listEl">
          <div
            v-for="req in filteredRequirements"
            :key="req.id"
            :id="`req-panel-item-${req.id}`"
            class="req-item"
            :class="{ 'req-item--active': activeReqId === req.id }"
            @click="handleReqClick(req)"
          >
            <!-- 需求标题 -->
            <div class="req-item-header">
              <span class="req-item-badge">{{ req.id }}</span>
              <span class="req-item-title">{{ req.title }}</span>
              <span v-if="req.type === 'modal'" class="req-item-type-tag">弹窗</span>
            </div>

            <!-- 需求内容 Markdown 渲染 -->
            <div class="req-item-body" v-html="renderMarkdown(req.content)" />

            <!-- 条件状态切换（如有） -->
            <div v-if="req.conditions?.length" class="req-conditions">
              <span class="req-conditions-label">条件预览：</span>
              <button
                v-for="cond in req.conditions"
                :key="cond.label"
                class="req-condition-btn"
                :class="{ active: activeCondition?.[req.id] === cond.label }"
                @click.stop="toggleCondition(req.id, cond.label)"
              >
                {{ cond.label }}
              </button>
            </div>
          </div>

          <!-- 空结果 -->
          <div v-if="filteredRequirements.length === 0" class="panel-empty">
            未找到匹配的需求
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Requirement } from './useAnnotationBridge'

const props = defineProps<{
  visible: boolean
  requirements: Requirement[]
  activeReqId: number | null
}>()

const emit = defineEmits<{
  toggle: []
  selectReq: [reqId: number]
  conditionChange: [reqId: number, conditionLabel: string]
}>()

const searchQuery = ref('')
const panelEl = ref<HTMLElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const panelWidth = ref(420)
const activeCondition = ref<Record<number, string>>({})

let isResizing = false

const filteredRequirements = computed(() => {
  if (!searchQuery.value) return props.requirements
  const q = searchQuery.value.toLowerCase()
  return props.requirements.filter(
    r =>
      String(r.id).includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q)
  )
})

function handleReqClick(req: Requirement) {
  emit('selectReq', req.id)
}

function toggleCondition(reqId: number, label: string) {
  if (activeCondition.value[reqId] === label) {
    delete activeCondition.value[reqId]
  } else {
    activeCondition.value[reqId] = label
  }
  emit('conditionChange', reqId, label)
}

function startResize(e: MouseEvent) {
  isResizing = true
  const startX = e.clientX
  const startWidth = panelWidth.value

  function onMove(ev: MouseEvent) {
    if (!isResizing) return
    const delta = startX - ev.clientX
    const newWidth = Math.min(600, Math.max(320, startWidth + delta))
    panelWidth.value = newWidth
  }

  function onUp() {
    isResizing = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// 简易 Markdown → HTML 渲染（保留加粗、列表、引用）
function renderMarkdown(md: string): string {
  let html = md
    // 转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 引用块
    .replace(/^&gt; (.*)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 无序列表
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li-ordered">$1</li>')
    // 段落（连续换行 → </p><p>）
    .replace(/\n\n+/g, '</p><p>')
    // 单换行 → <br>
    .replace(/\n/g, '<br>')

  html = '<p>' + html + '</p>'
  return html
}

// 当 activeReqId 变化时，面板内滚动到对应项
watch(() => props.activeReqId, (id) => {
  if (id != null) {
    const el = document.getElementById(`req-panel-item-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})
</script>

<style scoped>
.annotation-toggle-btn {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: background 0.2s;
}

.annotation-toggle-btn:hover {
  background: #f5f5f5;
}

.annotation-toggle-btn.active {
  background: #2563EB;
  color: #fff;
  border-color: #2563EB;
}

.toggle-icon {
  font-size: 10px;
}

.annotation-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  background: #f0efef;
  z-index: 9999;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 拖拽把手 */
.panel-resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
}

.panel-resize-handle:hover {
  background: rgba(0, 0, 0, 0.12);
}

/* 过渡动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.25s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}

/* 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.panel-close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
}

.panel-close-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

/* 搜索 */
.panel-search {
  padding: 12px 20px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.panel-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  outline: none;
}

.panel-search-input:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* 需求列表 */
.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.req-item {
  margin: 6px 12px;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.req-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.req-item--active {
  background: rgba(37, 99, 235, 0.12);
}

.req-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.req-item-badge {
  display: inline-block;
  background: #2563EB;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  line-height: 14px;
  padding: 0 4px;
  border-radius: 2px;
  flex-shrink: 0;
}

.req-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.req-item-type-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  background: #e5e5e5;
  color: #666;
  flex-shrink: 0;
}

.req-item-body {
  font-size: 13px;
  line-height: 1.6;
  color: #444;
}

.req-item-body :deep(strong) {
  font-weight: 700;
  color: #1a1a1a;
}

.req-item-body :deep(em) {
  font-style: italic;
}

.req-item-body :deep(li) {
  margin-left: 16px;
  margin-bottom: 2px;
}

.req-item-body :deep(.md-blockquote) {
  border-left: 3px solid #ccc;
  padding-left: 12px;
  margin: 8px 0;
  color: #777;
}

.req-item-body :deep(p) {
  margin: 0 0 8px;
}

/* 条件预览 */
.req-conditions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.req-conditions-label {
  font-size: 11px;
  color: #999;
}

.req-condition-btn {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}

.req-condition-btn:hover {
  border-color: #2563EB;
}

.req-condition-btn.active {
  background: #2563EB;
  color: #fff;
  border-color: #2563EB;
}

/* 空结果 */
.panel-empty {
  padding: 40px 20px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

/* 面板内高亮项 */
.req-panel-item--highlight {
  animation: panel-item-flash 2s ease-out;
}

@keyframes panel-item-flash {
  0% { background: rgba(37, 99, 235, 0.3); }
  100% { background: transparent; }
}
</style>
