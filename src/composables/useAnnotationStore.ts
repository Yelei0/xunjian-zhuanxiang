import { ref, computed } from 'vue'
import prdMarkdown from '../../PRD.md?raw'
import { parsePrdPages } from './parsePrd'
import type { ParsedPrdPage, ParsedPrdSection, ParsedRequirement } from './parsePrd'

export type { ParsedPrdPage, ParsedPrdSection, ParsedRequirement }

const prdMarkdownSource = ref(prdMarkdown)
const parsedPages = computed(() => parsePrdPages(prdMarkdownSource.value))
const allRequirements = computed(() => parsedPages.value.flatMap(page => page.requirements))

const panelOpen = ref(false)
const activeReqId = ref<number | null>(null)
const currentPage = ref('transport-dashboard')
const panelWidth = ref(420)
const bindingWarnings = ref<string[]>([])

export function useAnnotationStore() {
  const currentPageData = computed(() =>
    parsedPages.value.find(page => page.page === currentPage.value)
  )

  const requirementsForCurrentPage = computed(() =>
    currentPageData.value?.requirements ?? []
  )

  const pageSectionsForCurrentPage = computed(() =>
    currentPageData.value?.pageSections ?? []
  )

  const currentPageWarnings = computed(() => [
    ...(currentPageData.value?.warnings ?? []),
    ...bindingWarnings.value,
  ])

  function getCurrentPageSelector() {
    return `[data-req-page="${currentPage.value}"]`
  }

  function getCurrentPageRoot(): Element | Document {
    const mainArea = document.querySelector('.main-area')
    if (!mainArea) return document
    return mainArea.querySelector(getCurrentPageSelector()) || mainArea
  }

  function refreshBindingWarnings() {
    const pageData = currentPageData.value
    if (!pageData) {
      bindingWarnings.value = []
      return
    }

    const domIds = new Set<number>()
    const domAllIds = new Set<string>()

    // Scan the rendered document, not only the page root, because modal nodes can
    // be mounted outside the current page container.
    document.querySelectorAll('[data-req-id]').forEach(el => {
      const raw = el.getAttribute('data-req-id') ?? ''
      domAllIds.add(raw)
      const n = Number(raw)
      if (Number.isFinite(n) && n > 0) domIds.add(n)
    })

    const prdIds = new Set(requirementsForCurrentPage.value.map(r => r.id))
    const warnings: string[] = []

    for (const req of requirementsForCurrentPage.value) {
      if (req.type === 'modal' && req.modalId) continue
      if (!domIds.has(req.id)) {
        warnings.push(`需求 [${req.id}] ${req.title} 未找到对应页面元素，请检查 data-req-id="${req.id}" 是否已添加`)
      }
    }

    for (const rawId of domAllIds) {
      const n = Number(rawId)
      if (Number.isFinite(n) && n > 0 && !prdIds.has(n)) {
        warnings.push(`页面元素 data-req-id="${rawId}" 未写入当前页面 PRD`)
      }
    }

    if (pageData.requirementCount != null && pageData.requirementCount !== prdIds.size) {
      warnings.push(`PRD 需求数 ${pageData.requirementCount} 与实际解析需求数 ${prdIds.size} 不一致`)
    }

    for (const req of requirementsForCurrentPage.value) {
      if (req.type === 'modal' && !req.modalId) {
        warnings.push(`需求 [${req.id}] ${req.title} 是弹窗类型，但缺少 modalId`)
      }
    }

    bindingWarnings.value = warnings
  }

  function setPage(page: string) {
    currentPage.value = page
    activeReqId.value = null
    setTimeout(refreshBindingWarnings, 100)
  }

  function togglePanel() {
    panelOpen.value = !panelOpen.value
    if (!panelOpen.value) activeReqId.value = null
    if (panelOpen.value) setTimeout(refreshBindingWarnings, 100)
  }

  function selectRequirement(reqId: number) {
    activeReqId.value = reqId

    document.querySelectorAll('.anno-badge').forEach(b => b.classList.remove('highlight'))

    const root = getCurrentPageRoot()
    const els = root.querySelectorAll(`[data-req-id="${reqId}"]`)
    els.forEach(el => {
      el.classList.add('anno-highlight')
      setTimeout(() => el.classList.remove('anno-highlight'), 2000)
    })

    if (els[0]) {
      els[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    document.querySelectorAll(`.anno-badge[data-req="${reqId}"]`).forEach(b => {
      b.classList.add('highlight')
      setTimeout(() => b.classList.remove('highlight'), 2000)
    })

    const req = requirementsForCurrentPage.value.find(r => r.id === reqId)
    if (req?.type === 'modal' && req.modalId) {
      window.dispatchEvent(new CustomEvent('annotation:trigger-modal', {
        detail: {
          page: currentPage.value,
          reqId,
          modalId: req.modalId,
          trigger: req.trigger,
        }
      }))
    }
  }

  function handleBadgeClick(reqId: number) {
    activeReqId.value = reqId
    const itemEl = document.getElementById(`req-panel-item-${reqId}`)
    itemEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    itemEl?.classList.add('req-panel-item--highlight')
    setTimeout(() => itemEl?.classList.remove('req-panel-item--highlight'), 2000)
  }

  function applyScenario(reqId: number, scenario: string) {
    activeReqId.value = reqId
    window.dispatchEvent(new CustomEvent('annotation:apply-scenario', {
      detail: { page: currentPage.value, reqId, scenario }
    }))
  }

  function replacePrdMarkdown(markdown: string) {
    prdMarkdownSource.value = markdown
    setTimeout(refreshBindingWarnings, 100)
  }

  return {
    allRequirements,
    requirementsForCurrentPage,
    pageSectionsForCurrentPage,
    currentPageWarnings,
    currentPageData,
    parsedPages,
    panelOpen,
    activeReqId,
    currentPage,
    panelWidth,
    getCurrentPageSelector,
    getCurrentPageRoot,
    setPage,
    togglePanel,
    selectRequirement,
    handleBadgeClick,
    applyScenario,
    replacePrdMarkdown,
  }
}

let storeInstance: ReturnType<typeof useAnnotationStore> | null = null

export function getAnnotationStore() {
  if (!storeInstance) storeInstance = useAnnotationStore()
  return storeInstance
}
