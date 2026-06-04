# 场区巡检状态与整改流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一园区巡检原型的任务状态口径、整体结果展示和异常整改入口，并让记录详情页承载整改操作。

**Architecture:** 任务状态只保留原型层需要的三种展示口径：未提交、已提交、已完成。整体结果不单独存储，由点位表实时计算；移动端任务页负责生成巡检记录，记录详情页负责异常点位整改，Web 列表页负责展示状态摘要并打开统一的巡检详情弹窗。

**Tech Stack:** Vue 3 `<script setup lang="ts">`, 现有原型组件, 本地模拟数据, 现有测试脚本.

---

### Task 1: 先收口测试

**Files:**
- Modify: `tests/mobile-task-check.test.mjs`
- Modify: `tests/mobile-detail-media.test.mjs`
- Modify: `tests/inspection-record-detail.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobile = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')
assert(mobile.includes('未提交'))
assert(mobile.includes('已提交'))
assert(mobile.includes('已完成'))
assert(mobile.includes('处理整改>>>'))
assert(mobile.includes('整改打卡'))
assert(mobile.includes('整改照片'))
assert(mobile.includes('整改情况'))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile-task-check.test.mjs`
Expected: FAIL because current code still uses the old status wording and list behavior.

- [ ] **Step 3: Write minimal implementation**

No production code yet.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile-task-check.test.mjs`
Expected: PASS after the code changes land.

- [ ] **Step 5: Commit**

```bash
git add tests/mobile-task-check.test.mjs
git commit -m "test: lock new inspection status wording"
```

### Task 2: 移动端巡检页

**Files:**
- Modify: `src/pages/mobile-inspection/index.vue`

- [ ] **Step 1: Write the failing test**

```js
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobile = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')
assert(mobile.includes('处理整改>>>'))
assert(mobile.includes('getRecordResultSummary'))
assert(mobile.includes('rectification'))
assert(mobile.includes('已提交'))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/mobile-detail-media.test.mjs`
Expected: FAIL until the page uses the new status and rectification model.

- [ ] **Step 3: Write minimal implementation**

Update the record list, detail view, and task submission flow so that records show `未提交 / 已提交 / 已完成`, calculate `存在异常 N | 已整改 M` from point data, and expose rectification fields only inside record detail.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/mobile-detail-media.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/mobile-inspection/index.vue
git commit -m "feat: update mobile inspection status flow"
```

### Task 3: Web 巡检详情

**Files:**
- Modify: `src/pages/inspection-record/index.vue`

- [ ] **Step 1: Write the failing test**

```js
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const web = readFileSync('src/pages/inspection-record/index.vue', 'utf8')
assert(web.includes('巡检详情'))
assert(web.includes('task-status'))
assert(web.includes('result-summary'))
assert(web.includes('rectification-section'))
assert(web.includes('整改打卡'))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/inspection-record-detail.test.mjs`
Expected: FAIL until the modal is refactored into a unified detail view.

- [ ] **Step 3: Write minimal implementation**

Replace the separate image/route popups with a single detail modal that lists point order, photos, inspection remarks, rectification info, and the orthogonal route preview.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/inspection-record-detail.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/inspection-record/index.vue
git commit -m "feat: unify inspection record detail modal"
```

### Task 4: PRD 和标注

**Files:**
- Modify: `PRD.md`
- Modify: `src/composables/useAnnotationStore.ts`

- [ ] **Step 1: Write the failing test**

```js
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const prd = readFileSync('PRD.md', 'utf8')
assert(prd.includes('未提交'))
assert(prd.includes('已提交'))
assert(prd.includes('已完成'))
assert(prd.includes('整改打卡'))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/skill-guidance.test.mjs`
Expected: FAIL until the wording and flow are updated.

- [ ] **Step 3: Write minimal implementation**

Rewrite the PRD sections for mobile start/task/records/detail and the Web record page so they match the new prototype-only status model and rectification flow.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/skill-guidance.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add PRD.md src/composables/useAnnotationStore.ts
git commit -m "docs: align prd and annotations with rectification flow"
```

### Task 5: 全量验证

**Files:**
- No code changes

- [ ] **Step 1: Run the full verification set**

Run:
`node tests/mobile-task-check.test.mjs`
`node tests/mobile-detail-media.test.mjs`
`node tests/inspection-record-detail.test.mjs`
`node tests/annotation-scope.test.mjs`
`node tests/skill-guidance.test.mjs`
`npm run build`

Expected: all pass.

- [ ] **Step 2: Fix any residual failures**

Adjust only the smallest code path that fails, then rerun the affected test.

