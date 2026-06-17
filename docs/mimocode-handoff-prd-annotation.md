# Codex-Mimocode Handoff: PRD 驱动需求标注面板

## 项目

`E:\Project\园区巡检与专项检查`

## 背景

这是一个纯前端 Vue 3 原型框架。当前右侧“需求说明/标注面板”的内容写死在 `src/composables/useAnnotationStore.ts` 的 `allRequirements` 数组中。

已完成的前置设计：

- `skills/chemical-prd-generator/SKILL.md` 已升级为“PRD 可解析协议”。
- `skills/annotation-panel/SKILL.md` 已要求标注面板从 PRD 读取需求说明。
- `skills/chemical-proto-generator/SKILL.md` 已要求页面生成时输出 `data-req-page`、数字型 `data-req-id` 和 `spec.md` 需求编号映射。
- PRD 格式目标：页面元信息 + 页面级说明 + 功能点说明 + 弹窗/场景元信息 + 标准 Markdown 表格。

## 总目标

把前端需求说明系统从“硬编码需求数组”改成“读取 PRD.md 并展示”的模式。

用户修改 `PRD.md` 后，开发服务器热更新后右侧“需求说明”面板应展示 PRD 中的最新内容。页面角标、弹窗触发、场景按钮继续可用。

## 任务切片 1：重构 PRD 解析器

### 文件

`src/composables/parsePrd.ts`

### 目标

把当前只返回 `ParsedRequirement[]` 的解析器升级为解析完整页面结构。

### 建议数据结构

```ts
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
```

### 必须支持

- 页面元信息：
  - `**页面**：inspection-record`
  - `**类型**：后台列表`
  - `**菜单路径**：园区巡检 / 巡检记录`
  - `**页面说明**：xxx`
  - `**需求数**：7`
- 页面级说明：
  - `### 页面功能描述`
  - `### 页面状态机`
  - `### 页面特殊情况`
- 功能点：
  - `### [1] 筛选区 {type=inline, target=filter-section}`
  - `### [5] 巡检详情 {type=modal, modalId=detailModal, trigger=req:4.action:view-detail}`
  - `scenarios=[预览异常:scan-error, 恢复成功:scan-success]`

### 验收

- 能解析当前 `PRD.md`。
- 能解析新模板中的页面级说明。
- 不破坏现有 `type=modal` 和 `scenarios` 语法。

## 任务切片 2：让标注 Store 从 PRD 数据驱动

### 文件

`src/composables/useAnnotationStore.ts`

### 目标

移除或旁路 `allRequirements` 硬编码数组，改为从 PRD 解析结果中读取当前页面需求。

### 建议方案

Vite 可用 `?raw` 读取 Markdown：

```ts
import prdMarkdown from '../../PRD.md?raw'
import { parsePrdMarkdown } from './parsePrd'
```

然后：

```ts
const parsedPages = parsePrdMarkdown(prdMarkdown)
const currentPageData = computed(() => parsedPages.find(p => p.page === currentPage.value))
const requirementsForCurrentPage = computed(() => currentPageData.value?.requirements ?? [])
const pageSectionsForCurrentPage = computed(() => currentPageData.value?.pageSections ?? [])
```

### 需要保留

- `panelOpen`
- `activeReqId`
- `currentPage`
- `panelWidth`
- `setPage`
- `togglePanel`
- `selectRequirement`
- `handleBadgeClick`
- `applyScenario`
- `getCurrentPageSelector`
- `getCurrentPageRoot`

### 事件 detail 需要升级

当前：

```ts
detail: { reqId, modalId }
```

改为：

```ts
detail: {
  page: currentPage.value,
  reqId,
  modalId: req.modalId,
  trigger: req.trigger
}
```

### 验收

- 打开页面后面板需求来自 `PRD.md`。
- 修改 `PRD.md` 后，开发服务器热更新后面板内容变化。
- 弹窗和场景按钮仍可触发。

## 任务切片 3：改造 App.vue 的需求面板渲染

### 文件

`src/App.vue`

### 目标

让右侧面板展示：

1. 页面元信息
2. 页面级说明
3. 功能点列表
4. 解析/绑定告警

### 当前问题

`renderMd()` 不支持 Markdown 表格，会导致 PRD 字段表错位。

### 要求

- 增加页面说明区，展示：
  - 页面说明
  - 页面功能描述
  - 页面状态机
  - 页面特殊情况
- 功能点继续展示编号、标题、弹窗标签、正文、场景按钮。
- Markdown 表格必须渲染成 `<table>`。

### 推荐实现

可以写一个轻量 Markdown renderer，不引入依赖：

- 先按行识别标准 Markdown 表格块。
- 表格块转成 `<table><thead><tbody>`。
- 非表格部分继续处理段落、列表、加粗、行内代码。

### 验收

- PRD 中字段规则表正常显示为表格。
- 页面级状态机表正常显示为表格。
- 功能点表格不再错位。

## 任务切片 4：增加 PRD/DOM 绑定校验

### 文件

优先放在 `src/composables/useAnnotationStore.ts`。

### 目标

发现不一致并展示在面板中。

### 校验项

- PRD 有 `[N]`，当前页面 DOM 没有 `data-req-id="N"`。
- 当前页面 DOM 有 `data-req-id="N"`，PRD 没有 `[N]`。
- `需求数` 与实际解析功能点数量不一致。
- `type=modal` 但没有 `modalId`。

### 注意

DOM 校验要在页面渲染后执行，可用面板打开后或页面切换后延迟执行。

### 验收

当前至少应能发现：

- `mobile-inspection-start` 的 `[4] 已选点位管理` 如果 PRD 保留 `[4]`，但页面没有对应 `data-req-id="4"`，应提示未绑定。
- 弹窗类需求缺少 `modalId` 时要提示。

## 任务切片 5：兼容弹窗和隐藏功能点

### 涉及文件

- `src/pages/inspection-type/index.vue`
- `src/pages/inspection-point/index.vue`
- `src/pages/inspection-record/index.vue`
- `src/pages/mobile-inspection/index.vue`

### 已知风险

1. `inspection-type` 新增和编辑共用 `formModal`，但弹窗 DOM 只标了 `data-req-id="3"`。
   - 新增 `[3]`
   - 编辑 `[4]`
   - 点击 `[4]` 打开弹窗后，弹窗内部角标仍是 `[3]`
2. `inspection-point` 新增/编辑共用 `formModal`，也有同样问题。
3. 巡检点位的地图选点 `[5]` 在表单弹窗内部。点击面板 `[5]` 时，如果弹窗未打开，当前无法定位到地图选点。

### 建议处理

- 对共用弹窗，可以根据当前触发 reqId 设置 `activeModalReqId`，弹窗容器动态绑定：

```vue
:data-req-id="activeModalReqId"
```

- 或者 PRD 将新增/编辑合并成同一个需求点，避免一个弹窗对应多个编号。
- 对隐藏在弹窗内的功能点，PRD 用 `trigger` 表达父级弹窗：

```md
### [5] 地图选点 {type=modal, modalId=formModal, trigger=req:3.action:add}
```

点击 `[5]` 时先打开 `formModal`，再定位内部元素。

### 验收

- 点击编辑功能需求时，打开表单弹窗，并能正确定位/高亮编辑相关区域。
- 点击地图选点需求时，能打开点位表单弹窗并显示地图选点区域角标。

## 任务切片 6：验证

### 命令

```bash
npm run build
```

如项目已有测试，也运行相关测试：

```bash
node tests/annotation-scope.test.mjs
node tests/mobile-phone-dialog-scope.test.mjs
node tests/mobile-task-point-edit.test.mjs
```

### 手工验证

1. 打开开发服务器。
2. 进入“巡检记录”，打开需求标注。
3. 确认需求说明来自 PRD。
4. PRD 中表格在面板中正常显示。
5. 点击弹窗类需求，弹窗能打开。
6. 切换到移动端巡检任务，点击“预览异常情况”，扫码异常状态生效。
7. 切换移动端子页面后，不出现其他页面同编号角标串页。

## 非目标

- 不接后端。
- 不做数据库。
- 不引入重量级 UI 组件库。
- 不重构业务页面视觉样式。
- 不改无关工作区变更。

## 注意事项

工作区已有其他改动，不要回滚用户改动。只改与 PRD 驱动标注面板相关的文件。
