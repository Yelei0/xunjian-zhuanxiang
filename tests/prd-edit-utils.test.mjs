import assert from 'node:assert/strict'
import { updatePrdBlock } from '../scripts/prd-edit-utils.mjs'

const samplePrd = `# PRD

## 一、巡检记录

**页面**：inspection-record
**类型**：后台列表

### 页面功能描述

旧页面说明

### [1] 筛选区 {type=inline, target=filters}

旧筛选说明

### [2] 搜索/重置 {type=inline, target=actions}

旧搜索说明

## 二、巡检类型

**页面**：inspection-type

### 页面功能描述

类型页面说明

### [1] 筛选区 {type=inline, target=filters}

类型筛选说明
`

const updatedSection = updatePrdBlock(samplePrd, {
  page: 'inspection-record',
  kind: 'section',
  sectionIndex: 0,
  content: '新页面说明\n\n| 字段 | 规则 |\n|------|------|\n| A | B |',
})

assert(updatedSection.includes('### 页面功能描述\n\n新页面说明\n\n| 字段 | 规则 |'))
assert(updatedSection.includes('旧筛选说明'), 'updating a page section must keep requirements intact')
assert(updatedSection.includes('类型页面说明'), 'updating one page must not affect another page')

const updatedRequirement = updatePrdBlock(samplePrd, {
  page: 'inspection-record',
  kind: 'requirement',
  reqId: 1,
  content: '新筛选说明',
})

assert(updatedRequirement.includes('### [1] 筛选区 {type=inline, target=filters}\n\n新筛选说明'))
assert(updatedRequirement.includes('### [2] 搜索/重置 {type=inline, target=actions}\n\n旧搜索说明'))
assert(updatedRequirement.includes('类型筛选说明'))

assert.throws(
  () => updatePrdBlock(samplePrd, { page: 'missing-page', kind: 'section', title: '页面功能描述', content: 'x' }),
  /PRD page not found/
)
