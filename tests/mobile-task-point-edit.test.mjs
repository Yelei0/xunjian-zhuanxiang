import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobile = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')
const store = readFileSync('src/composables/useAnnotationStore.ts', 'utf8')
const prd = readFileSync('PRD.md', 'utf8')

assert(mobile.includes('data-req-id="8"') && mobile.includes('openPointEditModal'))
assert(mobile.includes('showPointEditModal') && mobile.includes('editPointIds'))
assert(mobile.includes('editableTaskPoints') && mobile.includes('toggleEditPoint'))
assert(mobile.includes('savePointEdit') && mobile.includes('cancelPointEdit'))
assert(mobile.includes('point-edit-modal') && mobile.includes('point-edit-list'))
assert(mobile.includes('点位编辑') && mobile.includes('保存点位'))
assert(prd.includes('### [8] 点位编辑') && prd.includes('modalId=pointEditModal'))
