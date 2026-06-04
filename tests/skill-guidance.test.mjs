import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const proto = readFileSync('skills/chemical-proto-generator/SKILL.md', 'utf8')
const prd = readFileSync('skills/chemical-prd-generator/SKILL.md', 'utf8')
const annotation = readFileSync('skills/annotation-panel/SKILL.md', 'utf8')

assert(
  proto.includes('data-req-page') && proto.includes('移动端多子页面'),
  'chemical-proto-generator must document mobile subpage annotation scope'
)

assert(
  proto.includes('禁止使用 data-req-id="mobile-1"') && proto.includes('同一页面内 `data-req-id` 必须是数字字符串'),
  'chemical-proto-generator must forbid prefixed/mobile request ids'
)

assert(
  prd.includes('移动端内部子页面按独立页面处理'),
  'chemical-prd-generator must treat mobile subpages as independent PRD pages'
)

assert(
  annotation.includes('fixed 全屏叠加层') && annotation.includes('不得减去 `.main-area`'),
  'annotation-panel must document fixed-overlay viewport coordinate rules'
)

assert(
  annotation.includes('只扫描当前页面根节点') && annotation.includes('重复编号只允许代表同一需求的多个入口'),
  'annotation-panel must document page-scoped scanning and duplicate-id handling'
)
