/**
 * PRD Markdown 解析器（v2）
 *
 * 解析完整页面结构，包括页面元信息、页面级说明、功能点需求。
 * 驱动右侧标注面板的需求描述。
 *
 * 新 API：parsePrdPages(md) → ParsedPrdPage[]
 * 兼容旧 API：parsePrdMarkdown(md) → ParsedRequirement[]
 */

export interface ParsedPrdPage {
  page: string
  title: string
  type: string
  menuPath?: string
  summary?: string
  requirementCount?: number
  pageSections: ParsedPrdSection[]
  requirements: ParsedRequirement[]
  warnings: string[]
}

export interface ParsedPrdSection {
  title: string
  content: string
}

export interface ParsedRequirement {
  id: number
  title: string
  page: string
  type: 'inline' | 'modal'
  target?: string
  modalId?: string
  trigger?: string
  content: string
  scenarios?: { label: string; scenario: string }[]
}

const SKIP_SECTIONS = ['权限规划', '全局交互', '修订记录', '附录', '变更历史']

const PAGE_SECTION_TITLES = ['页面功能描述', '页面状态机', '页面特殊情况']

/**
 * 解析完整页面结构
 */
export function parsePrdPages(md: string): ParsedPrdPage[] {
  const lines = md.split('\n')
  const pages: ParsedPrdPage[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // 匹配二级标题作为页面章节
    if (/^##\s+/.test(line)) {
      const sectionTitle = line.replace(/^##\s+/, '')
      const isSkip = SKIP_SECTIONS.some(s => sectionTitle.includes(s))
      if (isSkip) {
        i++
        while (i < lines.length && !/^##\s+/.test(lines[i].trim())) i++
        continue
      }

      const page = parsePageBlock(lines, i, sectionTitle)
      if (page) pages.push(page)
      i = page?._endLine ?? i + 1
      delete (page as any)?._endLine
      continue
    }

    i++
  }

  return pages
}

/**
 * 从 lines[startIdx] 开始解析一个页面块（## 标题行）
 */
function parsePageBlock(
  lines: string[],
  startIdx: number,
  sectionTitle: string,
): (ParsedPrdPage & { _endLine: number }) | null {
  const page: ParsedPrdPage & { _endLine: number } = {
    page: '',
    title: sectionTitle,
    type: '',
    pageSections: [],
    requirements: [],
    warnings: [],
    _endLine: lines.length,
  }

  let i = startIdx + 1

  // 阶段1：解析页面元信息（遇到 ### 或 ## 或 EOF 停止）
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (trimmed === '') {
      i += 1
      continue
    }
    if (/^##\s+/.test(trimmed)) break
    if (/^###\s+/.test(trimmed)) break

    const pageMatch = trimmed.match(/\*\*页面\*\*[：:]\s*(\S+)/)
    if (pageMatch) page.page = pageMatch[1]

    const typeMatch = trimmed.match(/\*\*类型\*\*[：:]\s*(.+?)$/)
    if (typeMatch) page.type = typeMatch[1].trim()

    const menuMatch = trimmed.match(/\*\*菜单路径\*\*[：:]\s*(.+?)$/)
    if (menuMatch) page.menuPath = menuMatch[1].trim()

    const summaryMatch = trimmed.match(/\*\*页面说明\*\*[：:]\s*(.+?)$/)
    if (summaryMatch) page.summary = summaryMatch[1].trim()

    const countMatch = trimmed.match(/\*\*需求数\*\*[：:]\s*(\d+)/)
    if (countMatch) page.requirementCount = parseInt(countMatch[1], 10)

    i++
  }

  // 阶段2：解析页面级说明和功能点
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (/^##\s+/.test(trimmed)) break

    const h3Match = trimmed.match(/^###\s+(.+)/)
    if (h3Match) {
      const subTitle = h3Match[1].trim()

      // 页面级说明章节
      const isPageSection = PAGE_SECTION_TITLES.some(t => subTitle === t || subTitle.startsWith(t))
      if (isPageSection) {
        const { content, endLine } = collectUntilH3(lines, i + 1)
        page.pageSections.push({ title: subTitle, content })
        i = endLine
        continue
      }

      // 功能点需求
      const req = parseRequirement(lines, i, page.page)
      if (req) {
        page.requirements.push(req.req)
        i = req.endLine
        continue
      }
    }

    i++
  }

  page._endLine = i
  return page
}

/**
 * 从 lines[startIdx] 开始解析一个功能点（### 标题行）
 */
function parseRequirement(
  lines: string[],
  startIdx: number,
  pageName: string,
): { req: ParsedRequirement; endLine: number } | null {
  const trimmed = lines[startIdx].trim()
  const reqMatch = trimmed.match(/^###\s+\[(\d+)\]\s+(.+)/)
  if (!reqMatch) return null

  const id = parseInt(reqMatch[1], 10)
  let titleAndMeta = reqMatch[2].trim()

  const meta: { type?: string; target?: string; modalId?: string; trigger?: string; scenarios?: { label: string; scenario: string }[] } = {}
  const metaMatch = titleAndMeta.match(/\{([^}]+)\}\s*$/)
  if (metaMatch) {
    titleAndMeta = titleAndMeta.slice(0, metaMatch.index).trim()
    parseMetaString(metaMatch[1], meta)
  }

  const contentLines: string[] = []
  let i = startIdx + 1
  while (i < lines.length) {
    const t = lines[i].trim()
    if (/^###\s+/.test(t) || /^##\s+/.test(t)) break
    contentLines.push(t)
    i++
  }

  const content = contentLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  const req: ParsedRequirement = {
    id,
    title: titleAndMeta,
    page: pageName,
    type: meta.type === 'modal' ? 'modal' : 'inline',
    target: meta.target,
    modalId: meta.modalId,
    trigger: meta.trigger,
    content,
    scenarios: meta.scenarios?.length ? meta.scenarios : undefined,
  }

  return { req, endLine: i }
}

/**
 * 收集内容直到下一个 ### 标题或 ## 标题
 */
function collectUntilH3(lines: string[], startIdx: number): { content: string; endLine: number } {
  const contentLines: string[] = []
  let i = startIdx
  while (i < lines.length) {
    const t = lines[i].trim()
    if (/^###\s+/.test(t) || /^##\s+/.test(t)) break
    contentLines.push(t)
    i++
  }
  return { content: contentLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(), endLine: i }
}

/**
 * 解析元数据字符串，支持 type, target, modalId, trigger, scenarios
 */
function parseMetaString(
  metaStr: string,
  target: { type?: string; target?: string; modalId?: string; trigger?: string; scenarios?: { label: string; scenario: string }[] },
) {
  const scenariosMatch = metaStr.match(/scenarios=\[([^\]]*)\]/)
  if (scenariosMatch) {
    target.scenarios = parseScenarios(scenariosMatch[1])
  }

  const pairs = metaStr.replace(/scenarios=\[[^\]]*\]/g, '').split(',')
  for (const pair of pairs) {
    const eq = pair.indexOf('=')
    if (eq < 0) continue
    const key = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    if (key === 'type') target.type = value
    if (key === 'modalId') target.modalId = value
    if (key === 'target') target.target = value
    if (key === 'trigger') target.trigger = value
  }
}

function parseScenarios(raw: string): { label: string; scenario: string }[] {
  const result: { label: string; scenario: string }[] = []
  if (!raw.trim()) return result
  const items = raw.split(',')
  for (const item of items) {
    const colon = item.indexOf(':')
    if (colon < 0) continue
    const label = item.slice(0, colon).trim()
    const scenario = item.slice(colon + 1).trim()
    if (label && scenario) result.push({ label, scenario })
  }
  return result
}

/**
 * 兼容旧 API：解析 PRD Markdown，返回扁平需求列表
 */
export function parsePrdMarkdown(md: string): ParsedRequirement[] {
  return parsePrdPages(md).flatMap(p => p.requirements)
}
