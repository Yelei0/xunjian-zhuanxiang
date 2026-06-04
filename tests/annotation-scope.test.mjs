import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobile = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')
const overlay = readFileSync('src/composables/AnnotationOverlay.vue', 'utf8')
const store = readFileSync('src/composables/useAnnotationStore.ts', 'utf8')

const mobileReqIds = [...mobile.matchAll(/data-req-id="([^"]+)"/g)].map(match => match[1])
const nonNumericReqIds = mobileReqIds.filter(id => !/^\d+$/.test(id))

assert.deepEqual(
  nonNumericReqIds,
  [],
  `mobile-inspection data-req-id must be numeric and page-scoped, found: ${nonNumericReqIds.join(', ')}`
)

const expectedPages = [
  'mobile-inspection',
  'mobile-inspection-start',
  'mobile-inspection-task',
  'mobile-inspection-records',
  'mobile-inspection-map',
  'mobile-inspection-detail',
]

for (const page of expectedPages) {
  assert(
    mobile.includes(`data-req-page="${page}"`),
    `mobile subpage is missing data-req-page="${page}"`
  )
}

assert(
  !mobile.includes("currentPage.value = 'task'") && !mobile.includes("currentPage.value = 'detail'"),
  'mobile internal navigation must use goTo() so annotation state stays in sync'
)

assert(
  overlay.includes('getCurrentPageSelector') && store.includes('getCurrentPageSelector'),
  'annotation overlay/store must scope element lookup to the active page'
)

assert(
  !overlay.includes('elRect.left - rect.left') && !overlay.includes('elRect.top - rect.top'),
  'fixed annotation overlay must use viewport coordinates, not coordinates relative to .main-area'
)
