---
name: annotation-panel
description: 将可解析 PRD 接入原型页面需求说明，实现右侧面板、页面角标、PRD 内容展示、弹窗触发、场景预览和双向联动。用于页面已有 data-req-id 或需要从 PRD 驱动需求说明时。
---

# 需求标注面板

## 目标

标注面板必须以 PRD 为需求说明数据源。用户修改 `PRD.md` 后，页面右侧“需求说明”面板应展示 PRD 中的最新内容，而不是展示写死在 Vue 文件里的说明。

三类内容都要支持：

1. 页面级说明：页面功能描述、页面状态机、页面特殊情况。
2. 功能点说明：PRD 中 `### [N]` 对应页面 DOM 的 `data-req-id="N"`。
3. 触发型说明：弹窗、确认框、ActionSheet、场景预览按钮。

## PRD 数据协议

标注面板读取 `PRD.md` 或用户指定的 `prd/<模块>.md`。PRD 必须遵守 `chemical-prd-generator` 的可解析格式。

### 页面元信息

每个页面章节必须包含：

```markdown
## 一、巡检记录

**页面**：inspection-record
**类型**：后台列表
**菜单路径**：园区巡检 / 巡检记录
**页面说明**：用于查询、导出、查看和维护园区巡检记录。
**需求数**：7
```

解析规则：

| PRD 字段 | 面板用途 |
|----------|----------|
| 页面 | 匹配当前 `data-req-page` 和 store 当前页面 |
| 类型 | 展示页面类型 |
| 菜单路径 | 展示页面来源 |
| 页面说明 | 展示页面业务说明 |
| 需求数 | 用于校验需求数量 |

### 页面级说明

以下章节不绑定角标，但必须显示在面板顶部的“页面说明”区域：

```markdown
### 页面功能描述
### 页面状态机
### 页面特殊情况
```

页面级说明用于承载不适合绑定到具体功能点的业务描述，例如状态流转、异常场景、整页规则、补充说明。

### 功能点说明

功能点标题格式：

```markdown
### [4] 数据表格 {type=inline, target=data-table}
### [5] 巡检详情 {type=modal, modalId=detailModal, trigger=req:4.action:view-detail}
### [2] 点位核对与打卡 {type=inline, scenarios=[预览异常:scan-error, 恢复成功:scan-success]}
```

元信息解析规则：

| key | 说明 |
|-----|------|
| type | `inline` 或 `modal`，默认 `inline` |
| target | 功能区域语义标识，仅用于展示和校验 |
| modalId | 弹窗标识，`type=modal` 时必填 |
| trigger | 触发来源说明，例如 `req:4.action:delete` |
| scenarios | 场景按钮列表，例如 `[预览异常:scan-error]` |

每个功能点的正文保留 Markdown 内容，面板负责渲染段落、列表、加粗、表格。

## DOM 映射规则

### 页面作用域

标注系统必须按当前页面限定扫描范围：

```html
<div data-req-page="inspection-record">
  <section data-req-id="1">筛选区</section>
  <button data-req-id="2">查询</button>
</div>
```

规则：

- 普通页面也建议添加 `data-req-page="<页面标识>"`。
- 移动端多子页面必须在每个子页面根节点添加 `data-req-page`。
- 叠加层只扫描当前页面根节点内的 `[data-req-id]`。
- 面板点击需求项时，也只在当前页面根节点内查找对应编号。
- 同页重复编号只允许代表同一需求的多个入口。

禁止：

```html
<div data-req-id="mobile-records"></div>
<button data-req-id="mobile-2">搜索</button>
```

### 编号校验

标注面板或自检脚本应检查：

| 校验项 | 处理 |
|--------|------|
| PRD 有 `[N]`，页面没有 `data-req-id="N"` | 在面板中标记“未绑定页面元素” |
| 页面有 `data-req-id="N"`，PRD 没有 `[N]` | 在面板中标记“页面元素未写入 PRD” |
| PRD `需求数` 与实际功能点数量不一致 | 给出解析告警 |
| 弹窗需求缺少 `modalId` | 给出解析告警，不触发弹窗 |

## 双向联动

| 触发方 | 行为 | 效果 |
|--------|------|------|
| 面板点击功能点 | 页面中对应 `[N]` 元素和角标高亮 | 滚动定位并高亮 2 秒 |
| 页面点击角标 | 面板滚动到对应需求项 | 面板内高亮 2 秒 |
| 面板点击弹窗类需求 | 触发页面对应弹窗 | 通过 `annotation:trigger-modal` 打开 |
| 面板点击场景按钮 | 切换页面模拟状态 | 通过 `annotation:apply-scenario` 触发 |
| 拖拽面板左边缘 | 调整面板宽度 | 内容区同步缩窄 |

## 弹窗触发机制

PRD 中 `type=modal` 的需求，面板点击时触发：

```ts
window.dispatchEvent(new CustomEvent('annotation:trigger-modal', {
  detail: { page, reqId, modalId, trigger }
}))
```

页面监听后按 `modalId` 打开对应弹窗：

```ts
window.addEventListener('annotation:trigger-modal', (event) => {
  const detail = (event as CustomEvent).detail
  if (detail.page !== 'inspection-record') return
  if (detail.modalId === 'detailModal') openDetailModal()
})
```

要求：

- 监听时必须校验 `page`，避免移动端多个子页面误触发。
- 弹窗内需要展示角标时，弹窗容器也添加相同 `data-req-id`。
- 弹窗未打开时，不应渲染弹窗内部隐藏元素的角标。

## 场景预览机制

PRD 中 `scenarios=[标签:场景值]` 生成面板按钮。

点击场景按钮触发：

```ts
window.dispatchEvent(new CustomEvent('annotation:apply-scenario', {
  detail: { page, reqId, scenario }
}))
```

页面根据 `scenario` 切换模拟状态，例如扫码异常、提交失败、空数据、加载失败。

场景按钮只用于原型预览，不代表真实业务操作。

## Markdown 渲染要求

需求说明正文必须支持以下 Markdown：

| 类型 | 要求 |
|------|------|
| 段落 | 保留换行和段落间距 |
| 加粗 | `**文本**` 渲染为强调文本 |
| 无序/有序列表 | 渲染为正常列表 |
| 表格 | 标准 Markdown 表格必须渲染为 HTML table |
| 代码 | 行内代码可保留等宽样式 |

表格渲染是强制要求。不能把 Markdown 表格原样展示成纯文本，否则字段规则和操作规则会错位。

标准表格示例：

```markdown
| 字段 | 类型 | 是否必填 | 默认值 | 校验规则 |
|------|------|----------|--------|----------|
| 巡检人 | 文本输入 | 否 | 无 | 最多 20 字 |
```

## 视觉规范

### 页面角标

| 项 | 规则 |
|----|------|
| 定位 | `Teleport to="body"` 的 fixed 叠加层 |
| 坐标 | 使用目标元素 `getBoundingClientRect()` 的视口坐标 |
| 样式 | 18x18px，背景 `#2563EB`，白字，3px 圆角 |
| 交互 | hover 放大，点击联动面板 |

角标坐标必须直接使用目标元素视口坐标：

```ts
const elRect = el.getBoundingClientRect()
x = elRect.left - 26
y = elRect.top + 4
```

不得减去 `.main-area` 或页面容器的坐标。

### 右侧面板

| 区域 | 内容 |
|------|------|
| 顶部 | 页面名称、页面类型、需求数量、解析告警 |
| 页面说明 | 页面说明、功能描述、状态机、特殊情况 |
| 功能点列表 | `[N]`、标题、类型、正文、场景按钮 |
| 弹窗标识 | `type=modal` 的需求显示“弹窗”标签 |
| 未绑定提示 | 对 PRD/DOM 不一致项给出提示 |

## 内容区自适应

面板打开时，主内容区 `margin-right` 动态等于面板宽度，避免内容被遮挡。面板宽度变化时通过 store 同步更新。

## 工作流程

1. 读取目标 PRD。
2. 解析页面元信息、页面级说明、功能点说明和元信息。
3. 按当前页面 `data-req-page` 过滤需求。
4. 扫描当前页面 DOM 的 `data-req-id`。
5. 对 PRD 和 DOM 做编号一致性校验。
6. 渲染右侧面板和页面角标。
7. 实现面板点击、角标点击、弹窗触发、场景预览。
8. 自检 Markdown 表格是否正常渲染。
9. 自检切换页面、移动端子页面、弹窗打开后的角标范围。

## 自检清单

- PRD 修改后，需求说明内容来自 PRD，而不是硬编码数组。
- 页面级说明显示在功能点列表前。
- 每个页面只显示当前 `data-req-page` 的需求。
- 同号需求不会跨页面误匹配。
- 弹窗类需求点击后能打开对应弹窗。
- 场景按钮能触发页面模拟状态。
- Markdown 表格渲染为正常表格。
- 筛选区、表格操作列、弹窗入口的角标贴近目标元素，没有整体偏移。
## PRD 可编辑需求说明协议

锚点：`prd-edit-mode`、`triple-click-title-edit`。

需求说明面板必须把 `PRD.md` 作为唯一内容来源，不允许在 Vue 页面里维护另一份写死的需求说明。开发原型时，需求说明面板需要支持轻量编辑 PRD：

- 仅在 `import.meta.env.DEV` 为 true 时启用编辑能力；发布到 devfile 或生产构建后，同事访问时不能编辑。
- 不增加显眼的编辑按钮。使用 `triple-click-title-edit`：三击页面级说明标题或功能点标题进入编辑。
- 页面级说明包括“页面功能描述 / 页面状态机 / 页面特殊情况”等块；功能点说明对应 `### [N]` 块。
- 编辑框展示 Markdown 原文，保存后调用开发态接口 `__prd/update` 写回 `PRD.md` 对应块。
- 保存成功后刷新面板内解析内容，不刷新整个页面；取消不写文件。
- 内容相同的保存不得重写 `PRD.md`，避免触发 Vite 热更新导致页面状态丢失。
- `__prd/update` 只能在本地开发服务注册，不进入生产能力。

定位与渲染补充：
- 页面角标使用 fixed 全屏叠加层，坐标直接来自目标元素 `getBoundingClientRect()`，不得减去 `.main-area`。
- 叠加层只扫描当前页面根节点；重复编号只允许代表同一需求的多个入口。
