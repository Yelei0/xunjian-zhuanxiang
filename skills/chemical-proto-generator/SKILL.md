---
name: chemical-proto-generator
description: 基于自然语言需求生成危化品运输行业原型页面（Vue 3 + Tailwind CSS）。适用于数据看板、后台列表、表单编辑和移动端页面类型。
---

# 危化品运输原型页面生成

## 触发场景

当用户描述一个页面需求，要求生成原型页面时使用此技能。例如：
- "帮我生成一个危化品运输任务列表页"
- "做一个在途监控数据看板"
- "画一个移动端的装货检查页面"

## 前置步骤

在生成任何页面之前，必须执行以下步骤：

1. **读取行业数据规范**：读取 `skills/industry-data-rules.md`，掌握所有模拟数据规范
2. **读取手机端框架组件**：如果判定为移动端页面，读取 `skills/phone-frame/PhoneFrame.vue` 了解手机框架用法

## 页面类型判定

根据用户需求描述，判定为以下 4 种类型之一：

| 类型 | 特征关键词 | 布局结构 |
|------|----------|---------|
| 数据看板 | 统计、概览、监控、大屏、仪表盘 | 指标卡片行 + 图表区 + 状态列表 |
| 后台列表 | 列表、管理、查询、名录 | 筛选区 + 数据表格 + 分页 |
| 表单编辑 | 新增、编辑、修改、录入、登记 | 字段表单 + 提交/取消操作 |
| 移动端 | 手机、移动端、APP端、司机端 | PhoneFrame 组件内渲染 |

若类型不明显，向用户确认后再生成。

## 核心规则

### 1. 模拟数据规范（强制执行）

生成的所有模拟数据必须符合 `skills/industry-data-rules.md` 规范。检查清单：
- [ ] 公司名使用行业规范中的名称（荣通危化物流、鑫海化工运输等）
- [ ] 人员姓名使用行业规范中的姓名（王建国、李卫东等）
- [ ] 化学品数据附带 UN 编号、CAS 号、危险类别
- [ ] 车牌号符合规范格式（浙A12345 / 浙A1234挂）
- [ ] 证照名称与行业规范一致
- [ ] 禁用项：无"顺丰"、"张三"、"某某"等占位数据

### 2. 标注预留

页面中每个可标注的功能模块必须在对应的 DOM 元素上添加 `data-req-id` 属性。生成正式页面时，`data-req-id` 应与后续 PRD 编号保持一致；如果尚未生成 PRD，可先留空，等待标注 Skill 填充。
```html
<div data-req-id="" class="filter-area">...</div>
<button data-req-id="">查询</button>
<table data-req-id="">...</table>
```

标注范围涵盖：筛选区、操作按钮、数据表格、弹窗、表单区块、Tab 切换、状态标签等。

#### 编号格式（强制）

- 同一页面内 `data-req-id` 必须是数字字符串，如 `data-req-id="1"`、`data-req-id="2"`。
- 禁止使用 data-req-id="mobile-1"、`data-req-id="page-1"`、`data-req-id="inspection-record"` 这类带页面前缀或语义名的值。
- 不同页面可以重复使用相同数字编号，因为需求编号按页面独立。
- 同一页面内同一个数字可以出现在多个元素上，但只能代表同一需求的多个入口，例如“搜索”和“重置”同属 `[2] 搜索/重置`。

#### 移动端多子页面

移动端多子页面是指一个 Vue 文件在 `<PhoneFrame>` 内通过 `currentPage`、Tab、步骤流等方式切换首页、一级页面、二级页面、详情页。

必须按以下规则生成：

- 每个手机端子页面的根节点必须添加 `data-req-page="<页面标识>"`。
- 手机首页页面标识使用模块名，例如 `mobile-inspection`。
- 手机内部子页面使用稳定后缀，例如 `mobile-inspection-start`、`mobile-inspection-task`、`mobile-inspection-records`、`mobile-inspection-detail`。
- 子页面内的 `data-req-id` 按该子页面自己的 PRD 编号填写，不要沿用首页编号，也不要加 `mobile-` 前缀。
- 所有内部跳转必须通过统一函数同步页面状态和标注页面，例如 `goTo('detail')` 内部同时更新 `currentPage` 与 annotation store。禁止在业务函数里直接写 `currentPage.value = 'detail'` 后忘记同步标注页。

推荐结构：

```vue
<div v-if="currentPage === 'home'" data-req-page="mobile-inspection">
  <button data-req-id="1" @click="goTo('start')">开始巡检</button>
</div>

<div v-if="currentPage === 'start'" data-req-page="mobile-inspection-start">
  <div data-req-id="1">巡检类型</div>
  <button data-req-id="5" @click="startInspection">下一步</button>
</div>
```

### 3. 技术栈约束

- Vue 3 Composition API（`<script setup lang="ts">`）
- Tailwind CSS 用于样式
- 所有交互状态（Loading、Empty、Error）必须实现
- 移动端页面必须在 `<PhoneFrame>` 内渲染

### 4. 设计质量

遵循 Web 设计质量规范：
- 有层次感的空间节奏，非均匀填充
- 语义化色彩（状态、告警、分类标签）
- hover/focus/active 状态
- 空状态和加载状态

## 输出产物

为每个页面创建独立目录，输出以下文件：

### `src/pages/<page-name>/index.vue`
原型页面主文件。包含完整的 Vue 组件代码，数据内联为响应式变量。

### `src/pages/<page-name>/spec.md`
页面规格说明，格式：

```markdown
# [页面名称]

## 概述
[一句话说明页面定位和核心价值，<50字]

## 目标用户
[谁使用这个页面]

## 核心功能
1. [功能点1]
2. [功能点2]
...

## 页面类型
[数据看板/后台列表/表单编辑/移动端]
```

### `src/pages/<page-name>/design.md`
UI 设计规范，格式：

```markdown
# [页面名称] — 设计规范

## 布局结构
[描述页面整体布局：顶部区域、主内容区、底部操作区等]

## 组件层级
[列出主要组件及其嵌套关系]

## 交互状态
| 状态 | 表现 |
|------|------|
| 加载中 | [Loading 样式说明] |
| 空数据 | [Empty 状态说明] |
| 错误 | [Error 状态说明] |
| 正常 | [正常展示说明] |

## 视觉风格
- 配色：[主色/辅色/告警色]
- 字体：[字体栈]
- 间距：[间距规则]
```

## 工作流程

1. 接收用户需求，判定页面类型
2. 如果类型模糊，向用户确认
3. 读取 `industry-data-rules.md`
4. 如果是移动端，读取 `PhoneFrame.vue`
5. 按类型对应的布局结构生成页面代码
6. 同时生成 `spec.md` 和 `design.md`
7. 自检：模拟数据是否合法、标注是否预留、三种交互状态是否实现
8. 若为移动端多子页面，自检每个子页面是否都有 `data-req-page`、编号是否为数字、跳转是否统一同步标注页
