import { ref, reactive, type Ref } from 'vue'

export interface Requirement {
  id: number
  title: string
  content: string          // Markdown 原文
  type: 'inline' | 'modal' // 内联元素 or 弹窗
  modalId?: string         // 弹窗类需求对应弹窗的 ref 名
  conditions?: Condition[] // 条件状态列表
}

export interface Condition {
  label: string
  description: string
}

export function useAnnotationBridge(requirements: Requirement[]) {
  /** 面板是否展开 */
  const panelOpen = ref(false)

  /** 当前高亮的需求编号 */
  const activeReqId = ref<number | null>(null)

  /** 高亮的需求编号集合（同一编号可能有多个页面元素） */
  const highlightedBadges = reactive(new Set<number>())

  /** 面板 ref */
  const panelRef = ref<HTMLElement | null>(null)

  /** 各弹窗的 open 方法注册表 */
  const modalRegistry = reactive(new Map<string, () => void>())

  function togglePanel() {
    panelOpen.value = !panelOpen.value
  }

  /** 面板中点击需求项 → 页面元素高亮 */
  function highlightPageElement(reqId: number) {
    activeReqId.value = reqId

    // 高亮所有对应角标
    const badges = document.querySelectorAll(`[data-req-badge="${reqId}"]`)
    badges.forEach((badge) => {
      badge.classList.remove('highlight')
      void (badge as HTMLElement).offsetHeight // reflow
      badge.classList.add('highlight')
      highlightedBadges.add(reqId)
    })

    // 滚动到第一个对应元素
    const firstEl = document.querySelector(`[data-req-id="${reqId}"]`)
    if (firstEl) {
      firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // 如果是弹窗类需求，触发弹窗
    const req = requirements.find(r => r.id === reqId)
    if (req?.type === 'modal' && req.modalId) {
      const openModal = modalRegistry.get(req.modalId)
      openModal?.()
    }

    // 2s 后清除高亮
    setTimeout(() => {
      badges.forEach(b => b.classList.remove('highlight'))
      highlightedBadges.delete(reqId)
    }, 2000)
  }

  /** 页面中点击角标 → 面板滚动到对应需求项 */
  function scrollPanelToReq(reqId: number, _element: HTMLElement) {
    activeReqId.value = reqId

    const itemEl = document.getElementById(`req-panel-item-${reqId}`)
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      itemEl.classList.add('req-panel-item--highlight')
      setTimeout(() => itemEl.classList.remove('req-panel-item--highlight'), 2000)
    }
  }

  /** 注册弹窗的 open 方法 */
  function registerModal(id: string, openFn: () => void) {
    modalRegistry.set(id, openFn)
  }

  /** 注销弹窗 */
  function unregisterModal(id: string) {
    modalRegistry.delete(id)
  }

  return {
    panelOpen,
    activeReqId,
    highlightedBadges,
    panelRef,
    togglePanel,
    highlightPageElement,
    scrollPanelToReq,
    registerModal,
    unregisterModal,
  }
}
</script>

export type { Requirement, Condition }
