<template>
  <div class="app-shell" :style="{ '--layout-panel-width': store.panelOpen.value ? store.panelWidth.value + 'px' : '0px' }">
    <!-- 顶部栏 -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="topbar-logo">
          <svg class="logo-icon" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563EB"/>
            <path d="M16 6L22 11L20 20H12L10 11L16 6Z" fill="#0F172A" opacity="0.9"/>
            <rect x="9" y="20" width="14" height="4" rx="1" fill="#0F172A" opacity="0.7"/>
          </svg>
          <span class="topbar-title">危运原型框架</span>
        </div>
        <!-- 面包屑路径 -->
        <span class="topbar-breadcrumb" v-if="breadcrumb">
          <span class="bread-sep">/</span>
          <span v-for="(seg, i) in breadcrumb" :key="i">
            <span v-if="i > 0" class="bread-sep">/</span>
            <span class="bread-item" :class="{ active: i === breadcrumb.length - 1 }">{{ seg }}</span>
          </span>
        </span>
      </div>

      <div class="topbar-right">
        <!-- 需求标注开关 -->
        <button
          class="annotation-toggle"
          :class="{ active: store.panelOpen.value }"
          @click="store.togglePanel()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          需求标注
          <span class="annotation-dot" v-if="!store.panelOpen.value"></span>
        </button>
      </div>
    </header>

    <!-- 侧边导航 -->
    <aside class="sidebar sidebar-glass">
      <div class="sidebar-header">
        <span class="sidebar-label">导航菜单</span>
      </div>
      <nav class="sidebar-nav">
        <!-- 遍历菜单树 -->
        <template v-for="group in menuTree" :key="group.key">
          <!-- 一级菜单 -->
          <div
            class="sidebar-item sidebar-item-l1"
            :class="{ active: isExpanded(group.key), 'has-children': group.children?.length }"
            @click="toggleGroup(group)"
          >
            <span class="sidebar-item-icon" v-html="group.icon"></span>
            <span class="sidebar-item-label">{{ group.label }}</span>
            <svg v-if="group.children?.length" class="sidebar-arrow" :class="{ open: isExpanded(group.key) }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <!-- 二级 / 三级菜单 -->
          <div v-if="isExpanded(group.key) && group.children" class="sidebar-sub">
            <template v-for="child in group.children" :key="child.key">
              <div
                v-if="child.path"
                class="sidebar-item sidebar-item-l2"
                :class="{ active: currentPage === child.path }"
                @click="navigateTo(child)"
              >
                <span class="sidebar-item-dot"></span>
                <span>{{ child.label }}</span>
                <span class="sidebar-item-tag">{{ child.type }}</span>
              </div>

              <!-- 二级分组（含三级） -->
              <template v-else>
                <div
                  class="sidebar-item sidebar-item-l2"
                  :class="{ expanded: isExpanded(child.key) }"
                  @click="toggleGroup(child)"
                >
                  <span class="sidebar-item-dot"></span>
                  <span>{{ child.label }}</span>
                  <svg v-if="child.children?.length" class="sidebar-arrow" :class="{ open: isExpanded(child.key) }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div v-if="isExpanded(child.key) && child.children" class="sidebar-sub">
                  <div
                    v-for="sub in child.children"
                    :key="sub.key"
                    class="sidebar-item sidebar-item-l3"
                    :class="{ active: currentPage === sub.path }"
                    @click="navigateTo(sub)"
                  >
                    <span class="sidebar-item-dash"></span>
                    <span>{{ sub.label }}</span>
                    <span class="sidebar-item-tag">{{ sub.type }}</span>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </template>
      </nav>

    </aside>

    <!-- 主内容 -->
    <main
      class="main-area"
      :style="store.panelOpen.value ? { marginRight: store.panelWidth.value + 'px' } : {}"
    >
      <component :is="currentComponent" />
    </main>

    <!-- 标注面板 -->
    <Transition name="panel-slide">
      <aside v-if="store.panelOpen.value" class="annotation-panel" :style="{ width: store.panelWidth.value + 'px' }">
        <div class="panel-resize-handle" @mousedown="startResize"></div>
        <div class="panel-header">
          <h2 class="panel-title">需求说明</h2>
          <span class="panel-count">{{ store.requirementsForCurrentPage.value.length }} 项需求</span>
          <button class="panel-close" @click="store.togglePanel()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="panel-list">
          <!-- 页面概览 -->
          <div v-if="store.currentPageData.value" class="panel-overview">
            <div class="panel-overview-title">{{ store.currentPageData.value.title }}</div>
            <div class="panel-overview-meta">
              <span class="panel-overview-type">{{ store.currentPageData.value.type }}</span>
              <span v-if="store.currentPageData.value.menuPath" class="panel-overview-path">{{ store.currentPageData.value.menuPath }}</span>
            </div>
            <div v-if="store.currentPageData.value.summary" class="panel-overview-summary">
              {{ store.currentPageData.value.summary }}
            </div>
          </div>

          <!-- 页面级说明 -->
          <div
            v-for="(section, sectionIndex) in store.pageSectionsForCurrentPage.value"
            :key="section.title"
            class="panel-section"
          >
            <div class="panel-section-title" :title="canEditPrd ? '三击编辑' : ''" @click="handleSectionTitleClick($event, section, sectionIndex)">
              {{ section.title }}
            </div>
            <div v-if="isEditingSection(section.title)" class="panel-editor">
              <textarea v-model="editingDraft" class="panel-editor-input" rows="10"></textarea>
              <div class="panel-editor-actions">
                <span class="panel-editor-status" :class="{ error: editError }">{{ editStatus }}</span>
                <button class="panel-editor-btn" :disabled="savingEdit" @click="cancelPrdEdit">取消</button>
                <button class="panel-editor-btn primary" :disabled="savingEdit" @click="savePrdEdit">保存</button>
              </div>
            </div>
            <div v-else class="panel-section-body" v-html="renderMd(section.content)"></div>
          </div>

          <!-- 警告 -->
          <div v-if="store.currentPageWarnings.value.length" class="panel-warnings">
            <div
              v-for="(warning, i) in store.currentPageWarnings.value"
              :key="i"
              class="panel-warning"
            >
              {{ warning }}
            </div>
          </div>

          <!-- 功能点列表 -->
          <div
            v-for="req in store.requirementsForCurrentPage.value"
            :key="req.id"
            :id="`req-panel-item-${req.id}`"
            class="panel-item"
            :class="{ active: store.activeReqId.value === req.id }"
            @click="store.selectRequirement(req.id)"
          >
            <div class="panel-item-head">
              <span class="panel-item-badge">{{ req.id }}</span>
              <span class="panel-item-title" :title="canEditPrd ? '三击编辑' : ''" @click="handleRequirementTitleClick($event, req)">
                {{ req.title }}
              </span>
              <span v-if="req.type === 'modal'" class="panel-item-modal">弹窗</span>
            </div>
            <div v-if="isEditingRequirement(req.id)" class="panel-editor" @click.stop>
              <textarea v-model="editingDraft" class="panel-editor-input" rows="12"></textarea>
              <div class="panel-editor-actions">
                <span class="panel-editor-status" :class="{ error: editError }">{{ editStatus }}</span>
                <button class="panel-editor-btn" :disabled="savingEdit" @click="cancelPrdEdit">取消</button>
                <button class="panel-editor-btn primary" :disabled="savingEdit" @click="savePrdEdit">保存</button>
              </div>
            </div>
            <div v-else class="panel-item-body" v-html="renderMd(req.content)"></div>
            <div v-if="req.scenarios?.length" class="panel-scenarios">
              <button
                v-for="scenario in req.scenarios"
                :key="scenario.scenario"
                class="panel-scenario-btn"
                @click.stop="store.applyScenario(req.id, scenario.scenario)"
              >
                {{ scenario.label }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </Transition>

    <AnnotationOverlay />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import TransportDashboard from './pages/_reference/transport-dashboard/index.vue'
import TransportTaskList from './pages/_reference/transport-task-list/index.vue'
import TransportTaskForm from './pages/_reference/transport-task-form/index.vue'
import MobileSecurityCheck from './pages/_reference/mobile-security-check/index.vue'
import InspectionRecord from './pages/inspection-record/index.vue'
import InspectionType from './pages/inspection-type/index.vue'
import InspectionPoint from './pages/inspection-point/index.vue'
import MobileInspection from './pages/mobile-inspection/index.vue'
import AnnotationOverlay from './composables/AnnotationOverlay.vue'
import { getAnnotationStore } from './composables/useAnnotationStore'
import type { ParsedPrdSection, ParsedRequirement } from './composables/useAnnotationStore'

const store = getAnnotationStore()
const canEditPrd = import.meta.env.DEV
const editingKey = ref('')
const editingDraft = ref('')
const savingEdit = ref(false)
const editStatus = ref('')
const editError = ref(false)
const editClickState = reactive({ key: '', count: 0, lastAt: 0 })

function sectionEditKey(sectionIndex: number) {
  return `section:${sectionIndex}`
}

function requirementEditKey(reqId: number) {
  return `requirement:${reqId}`
}

function isEditingSection(title: string) {
  const sectionIndex = store.pageSectionsForCurrentPage.value.findIndex(section => section.title === title)
  return editingKey.value === sectionEditKey(sectionIndex)
}

function isEditingRequirement(reqId: number) {
  return editingKey.value === requirementEditKey(reqId)
}

function isTripleTitleClick(event: MouseEvent, key: string) {
  const now = Date.now()
  if (event.detail >= 3) return true

  if (editClickState.key === key && now - editClickState.lastAt < 600) {
    editClickState.count += 1
  } else {
    editClickState.key = key
    editClickState.count = 1
  }
  editClickState.lastAt = now

  return editClickState.count >= 3
}

function handleSectionTitleClick(event: MouseEvent, section: ParsedPrdSection, sectionIndex: number) {
  const key = sectionEditKey(sectionIndex)
  if (!canEditPrd || !isTripleTitleClick(event, key)) return
  event.stopPropagation()
  editingKey.value = key
  editingDraft.value = section.content
  editStatus.value = ''
  editError.value = false
}

function handleRequirementTitleClick(event: MouseEvent, req: ParsedRequirement) {
  const key = requirementEditKey(req.id)
  if (!canEditPrd || !isTripleTitleClick(event, key)) return
  event.stopPropagation()
  editingKey.value = key
  editingDraft.value = req.content
  editStatus.value = ''
  editError.value = false
}

function cancelPrdEdit() {
  editingKey.value = ''
  editingDraft.value = ''
  editStatus.value = ''
  editError.value = false
}

async function savePrdEdit() {
  if (!editingKey.value || savingEdit.value) return

  const [kind, id] = editingKey.value.split(':')
  const payload: Record<string, unknown> = {
    page: store.currentPage.value,
    content: editingDraft.value,
  }

  if (kind === 'section') {
    payload.kind = 'section'
    payload.sectionIndex = Number(id)
  } else {
    payload.kind = 'requirement'
    payload.reqId = Number(id)
  }

  savingEdit.value = true
  editStatus.value = '保存中...'
  editError.value = false

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}__prd/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '保存失败')

    store.replacePrdMarkdown(data.markdown)
    editingKey.value = ''
    editingDraft.value = ''
    editStatus.value = ''
  } catch (error) {
    editError.value = true
    editStatus.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    savingEdit.value = false
  }
}

// ===== 菜单树 =====
interface MenuItem {
  key: string
  label: string
  icon?: string
  type?: string
  path?: string
  children?: MenuItem[]
}

const expandedKeys = reactive(new Set<string>(['park-inspection']))

function isExpanded(key: string) { return expandedKeys.has(key) }
function toggleGroup(group: MenuItem) {
  if (!group.children?.length) return
  if (expandedKeys.has(group.key)) expandedKeys.delete(group.key)
  else expandedKeys.add(group.key)
}

// 业务菜单 — 新项目中在此添加你的菜单
const businessMenu: MenuItem[] = [
  {
    key: 'park-inspection',
    label: '园区巡检',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>',
    children: [
      { key: 'inspection-record', label: '巡检记录', type: '列表', path: 'inspection-record' },
      { key: 'inspection-type', label: '巡检类型', type: '列表', path: 'inspection-type' },
      { key: 'inspection-point', label: '巡检点位', type: '列表', path: 'inspection-point' },
      { key: 'mobile-inspection', label: '移动端巡检', type: '移动端', path: 'mobile-inspection' },
    ]
  }
]

// 参考页面
const referenceMenu: MenuItem = {
  key: '_reference', label: '参考页面',
  icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  children: [
    { key: 'ref-dashboard', label: '运输监控看板', type: '看板', path: 'transport-dashboard' },
    { key: 'ref-list', label: '运输任务列表', type: '列表', path: 'transport-task-list' },
    { key: 'ref-form', label: '运输任务编辑', type: '表单', path: 'transport-task-form' },
    { key: 'ref-mobile', label: '装货安全检查', type: '移动端', path: 'mobile-security-check' },
  ]
}

const menuTree = computed(() => businessMenu)

// 平铺所有页面（用于路由匹配）
function flattenTree(items: MenuItem[]): { path: string; type: string }[] {
  const result: { path: string; type: string }[] = []
  for (const item of items) {
    if (item.path) result.push({ path: item.path, type: item.type || '' })
    if (item.children) result.push(...flattenTree(item.children))
  }
  return result
}

const currentPage = ref('inspection-record')

const componentMap: Record<string, any> = {
  'transport-dashboard': TransportDashboard,
  'transport-task-list': TransportTaskList,
  'transport-task-form': TransportTaskForm,
  'mobile-security-check': MobileSecurityCheck,
  'inspection-record': InspectionRecord,
  'inspection-type': InspectionType,
  'inspection-point': InspectionPoint,
  'mobile-inspection': MobileInspection,
}

const currentComponent = computed(() => componentMap[currentPage.value])

// 面包屑
const breadcrumb = computed(() => {
  const allItems = flattenTree(menuTree.value)
  const found = allItems.find(i => i.path === currentPage.value)
  if (!found) return null

  const result: string[] = []
  function find(items: MenuItem[], target: string, parents: string[]): string[] | null {
    for (const item of items) {
      if (item.path === target) return [...parents, item.label]
      if (item.children) {
        const r = find(item.children, target, [...parents, item.label])
        if (r) return r
      }
    }
    return null
  }
  return find(menuTree.value, currentPage.value, [])
})

// 导航
function navigateTo(item: MenuItem) {
  if (item.path) {
    currentPage.value = item.path
    store.setPage(item.path)
  }
}

onMounted(() => {
  store.setPage(currentPage.value)
})

// Markdown render
function renderMd(md: string): string {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const inlineMd = (value: string) =>
    escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

  const lines = md.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    if (!line) {
      i++
      continue
    }

    const headingMatch = line.match(/^(#{2,6})\s+(.+)$/)
    if (headingMatch) {
      const level = Math.min(6, Math.max(3, headingMatch[1].length))
      result.push(`<h${level} class="md-heading md-heading-${level}">${inlineMd(headingMatch[2])}</h${level}>`)
      i++
      continue
    }

    if (line.includes('|') && i + 1 < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i + 1].trim())) {
      const headers = line.split('|').filter(c => c.trim() !== '')
      let table = '<div class="md-table-wrap"><table class="md-table"><thead><tr>'
      for (const h of headers) table += `<th>${inlineMd(h.trim())}</th>`
      table += '</tr></thead><tbody>'
      i += 2
      while (i < lines.length && lines[i].trim().includes('|')) {
        const cells = lines[i].trim().split('|').filter(c => c.trim() !== '')
        table += '<tr>'
        for (const c of cells) table += `<td>${inlineMd(c.trim())}</td>`
        table += '</tr>'
        i++
      }
      table += '</tbody></table></div>'
      result.push(table)
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(`<li>${inlineMd(lines[i].trim().slice(2))}</li>`)
        i++
      }
      result.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    result.push(`<p>${inlineMd(line)}</p>`)
    i += 1
  }

  return result.join('')
}

// Panel resize
let resizing = false
function startResize(e: MouseEvent) {
  resizing = true
  const sx = e.clientX
  const sw = store.panelWidth.value
  const move = (ev: MouseEvent) => { if (resizing) store.panelWidth.value = Math.min(600, Math.max(320, sw + sx - ev.clientX)) }
  const up = () => { resizing = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}
</script>

<style scoped>
.app-shell { display: flex; min-height: 100vh; padding-left: 240px; padding-top: 60px; }

/* ====== 顶部栏 ====== */
.topbar { position: fixed; top: 0; left: 0; right: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 100; background: rgba(248,250,252,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.06); box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02); }
.topbar-left { display: flex; align-items: center; gap: 20px; }
.topbar-logo { display: flex; align-items: center; gap: 10px; }
.logo-icon { width: 28px; height: 28px; }
.topbar-title { font-size: 15px; font-weight: 700; color: #0F172A; letter-spacing: -0.02em; }

/* 面包屑 */
.topbar-breadcrumb { display: flex; align-items: center; gap: 2px; font-size: 12px; color: #94A3B8; }
.bread-sep { color: #CBD5E1; margin: 0 4px; }
.bread-item { color: #64748B; }
.bread-item.active { color: #0F172A; font-weight: 600; }

.topbar-right { display: flex; align-items: center; gap: 12px; }

/* 需求标注按钮 */
.annotation-toggle { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; border: 1px solid #E2E8F0; background: #fff; color: #475569; cursor: pointer; transition: all 0.2s; position: relative; }
.annotation-toggle:hover { border-color: #2563EB; color: #2563EB; }
.annotation-toggle.active { background: #2563EB; color: #fff; border-color: #2563EB; }
.annotation-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #2563EB; animation: dot-pulse 2s ease-in-out infinite; }
@keyframes dot-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ====== 侧边栏 ====== */
.sidebar { position: fixed; top: 0; left: 0; width: 240px; height: 100vh; display: flex; flex-direction: column; padding: 76px 0 0; z-index: 90; border-right: 1px solid rgba(255,255,255,0.08); }
.sidebar-header { padding: 8px 16px 12px; flex-shrink: 0; }
.sidebar-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); }
.sidebar-nav { flex: 1; overflow-y: auto; padding: 0 8px; display: flex; flex-direction: column; gap: 1px; }
.sidebar-sub { padding-left: 0; display: flex; flex-direction: column; gap: 1px; }

/* 一级菜单 */
.sidebar-item { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; color: rgba(255,255,255,0.55); user-select: none; }
.sidebar-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
.sidebar-item.active { background: rgba(37,99,235,0.15); color: #2563EB; }

.sidebar-item-l1 { font-size: 13px; font-weight: 600; margin-bottom: 1px; }
.sidebar-item-l2 { padding-left: 24px; font-size: 12px; }
.sidebar-item-l3 { padding-left: 42px; font-size: 11px; }

.sidebar-item-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; opacity: 0.7; }
.sidebar-item.active .sidebar-item-icon { opacity: 1; }

.sidebar-item-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.25); flex-shrink: 0; }
.sidebar-item.active .sidebar-item-dot { background: #2563EB; }
.sidebar-item-dash { width: 8px; height: 1px; background: rgba(255,255,255,0.2); flex-shrink: 0; }
.sidebar-item.active .sidebar-item-dash { background: #2563EB; }

.sidebar-item-label { flex: 1; line-height: 1.3; }
.sidebar-item-tag { font-size: 9px; padding: 1px 6px; border-radius: 3px; background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); flex-shrink: 0; }
.sidebar-item.active .sidebar-item-tag { background: rgba(37,99,235,0.2); color: rgba(37,99,235,0.8); }

.sidebar-arrow { flex-shrink: 0; transition: transform 0.2s; opacity: 0.4; }
.sidebar-arrow.open { transform: rotate(180deg); }

/* 底部开关 */
.sidebar-footer { padding: 12px; flex-shrink: 0; }
.sidebar-toggle-ref { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.15s; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
.sidebar-toggle-ref:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }
.ref-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: background 0.2s; }
.ref-dot.on { background: #10B981; }

/* ====== 主内容 ====== */
.main-area { flex: 1; min-height: calc(100vh - 60px); background: #F1F5F9; }

/* ====== 标注面板 ====== */
.annotation-panel { position: fixed; top: 60px; right: 0; height: calc(100vh - 60px); background: rgba(248,250,252,0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 1px solid #E2E8F0; z-index: 80; display: flex; flex-direction: column; box-shadow: -8px 0 32px rgba(0,0,0,0.06); }

.panel-resize-handle { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; cursor: col-resize; z-index: 1; }
.panel-resize-handle:hover { background: rgba(0,0,0,0.08); }
.panel-slide-enter-active, .panel-slide-leave-active { transition: transform 0.25s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { transform: translateX(100%); }
.panel-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid #E2E8F0; flex-shrink: 0; }
.panel-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 0; flex: 1; }
.panel-count { font-size: 11px; color: #94A3B8; font-weight: 600; background: #F1F5F9; padding: 2px 8px; border-radius: 10px; }
.panel-close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; border-radius: 8px; color: #94A3B8; }
.panel-close:hover { background: #F1F5F9; color: #0F172A; }
.panel-list { flex: 1; overflow-y: auto; padding: 8px 12px; }
.panel-item { margin-bottom: 6px; padding: 12px 14px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
.panel-item:hover { background: rgba(255,255,255,0.6); border-color: #E2E8F0; }
.panel-item.active { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.3); }
.panel-item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.panel-item-badge { display: inline-block; background: #2563EB; color: #fff; font-size: 10px; font-weight: 700; line-height: 14px; padding: 0 4px; border-radius: 2px; flex-shrink: 0; }
.panel-item-title { font-size: 13px; font-weight: 700; color: #0F172A; }
.panel-item-modal { font-size: 9px; padding: 1px 6px; border-radius: 3px; background: #E2E8F0; color: #64748B; font-weight: 600; }
.panel-item-body { font-size: 12px; line-height: 1.65; color: #475569; }
.panel-item-body :deep(strong) { font-weight: 700; color: #0F172A; }
.panel-item-body :deep(li) { margin: 2px 0 2px 14px; }
.panel-item-body :deep(p) { margin: 0 0 6px; }
.panel-item-body :deep(.md-heading) { margin: 10px 0 6px; font-weight: 800; color: #0F172A; line-height: 1.35; }
.panel-item-body :deep(.md-heading-4), .panel-item-body :deep(.md-heading-5), .panel-item-body :deep(.md-heading-6) { font-size: 12px; }
.panel-editor { margin-top: 8px; }
.panel-editor-input { width: 100%; min-height: 180px; resize: vertical; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px; font-size: 12px; line-height: 1.55; color: #0F172A; background: #fff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; box-sizing: border-box; }
.panel-editor-input:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.panel-editor-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.panel-editor-status { flex: 1; font-size: 11px; color: #64748B; }
.panel-editor-status.error { color: #DC2626; }
.panel-editor-btn { border: 1px solid #CBD5E1; background: #fff; color: #334155; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
.panel-editor-btn:hover:not(:disabled) { border-color: #94A3B8; background: #F8FAFC; }
.panel-editor-btn.primary { border-color: #2563EB; background: #2563EB; color: #fff; }
.panel-editor-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.panel-scenarios { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.panel-scenario-btn { border: 1px solid rgba(239,68,68,0.25); background: #FEF2F2; color: #DC2626; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 700; cursor: pointer; }
.panel-scenario-btn:hover { background: #FEE2E2; border-color: rgba(239,68,68,0.45); }

/* 页面概览 */
.panel-overview { padding: 14px 14px 10px; border-bottom: 1px solid #E2E8F0; }
.panel-overview-title { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
.panel-overview-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.panel-overview-type { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: #EFF6FF; color: #2563EB; }
.panel-overview-path { font-size: 11px; color: #94A3B8; }
.panel-overview-summary { font-size: 12px; color: #475569; line-height: 1.6; }

/* 页面级说明 */
.panel-section { padding: 10px 14px; border-bottom: 1px solid #F1F5F9; }
.panel-section-title { font-size: 11px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
.panel-section-body { font-size: 12px; line-height: 1.65; color: #475569; }
.panel-section-body :deep(strong) { font-weight: 700; color: #0F172A; }
.panel-section-body :deep(p) { margin: 0 0 4px; }
.panel-section-body :deep(.md-heading) { margin: 8px 0 6px; font-size: 12px; font-weight: 800; color: #0F172A; line-height: 1.35; }

/* 警告 */
.panel-warnings { padding: 8px 14px; }
.panel-warning { font-size: 11px; color: #D97706; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 6px 10px; margin-bottom: 4px; }

/* Markdown 表格 */
.panel-section-body :deep(.md-table-wrap),
.panel-item-body :deep(.md-table-wrap) { overflow-x: auto; max-width: 100%; margin: 6px 0 10px; -webkit-overflow-scrolling: touch; }
.panel-section-body :deep(.md-table),
.panel-item-body :deep(.md-table) { width: max-content; min-width: 100%; border-collapse: collapse; table-layout: auto; font-size: 11px; line-height: 1.35; }
.panel-section-body :deep(.md-table th),
.panel-section-body :deep(.md-table td),
.panel-item-body :deep(.md-table th),
.panel-item-body :deep(.md-table td) { padding: 5px 8px; border: 1px solid #E2E8F0; text-align: left; vertical-align: top; white-space: nowrap; word-break: keep-all; }
.panel-section-body :deep(.md-table th),
.panel-item-body :deep(.md-table th) { background: #F8FAFC; font-weight: 700; color: #0F172A; }
.panel-section-body :deep(.md-table td),
.panel-item-body :deep(.md-table td) { color: #475569; }
</style>

<style>
@keyframes req-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); } 50% { box-shadow: 0 0 0 6px rgba(37,99,235,0.2); } }
[data-req-badge].highlight { animation: req-pulse 2s ease-out; }
.req-panel-item--highlight { animation: panel-item-flash 2s ease-out; }
@keyframes panel-item-flash { 0% { background: rgba(37,99,235,0.3); } 100% { background: transparent; } }
[data-req-id].anno-highlight { animation: anno-glow 2s ease-out; outline: 2px solid #2563EB; outline-offset: 4px; border-radius: 8px; }
@keyframes anno-glow { 0% { outline-color: #2563EB; outline-width: 4px; } 50% { outline-color: rgba(37,99,235,0.6); } 100% { outline-color: transparent; outline-width: 0; } }
</style>
