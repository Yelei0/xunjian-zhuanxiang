---
name: annotation-panel
description: 将 PRD 需求点注入原型页面，实现右侧面板 + 页面标注叠加层 + 双向联动。每个页面需求编号独立从 1 开始。支持弹窗触发和内容区自适应。
---

# 需求标注面板

## 触发场景

当已生成 PRD 文档，需要将需求点标注到原型页面中时使用。读取 `PRD.md` 中的需求编号，在页面对应位置注入标注。

## 核心设计

### 三层架构

| 层 | 组件 | 职责 |
|----|------|------|
| 切换按钮 | Topbar 右侧"需求标注"按钮 | 展开/收起整个标注系统 |
| 右侧面板 | AnnotationPanel | 显示当前页面的需求列表，点击触发联动 |
| 页面叠加层 | AnnotationOverlay | 在内容区每个标注元素右上角渲染可见的序号角标 |

### 每页独立编号

每个页面的需求编号独立从 1 开始，不同页面之间编号互不影响。切换页面时面板和叠加层自动切换到当前页面的需求列表。

### 页面作用域

标注系统必须按“当前页面”限定扫描范围，不能全局扫描 `.main-area` 下所有 `[data-req-id]` 后直接渲染。

规则：

- 普通单页页面可以只使用数字 `data-req-id`。
- 移动端多子页面必须在每个子页面根节点添加 `data-req-page="<页面标识>"`。
- 叠加层只扫描当前页面根节点内的 `[data-req-id]`。
- 面板点击需求项时，也只在当前页面根节点内查找对应编号。
- 重复编号只允许代表同一需求的多个入口，例如同页中的“搜索”和“重置”共用 `[2]`。如果多个入口距离很近，可以显示多个角标；如果视觉拥挤，应把 `data-req-id` 放到共同父容器上。

示例：

```html
<div data-req-page="mobile-inspection-records">
  <div data-req-id="1">筛选区</div>
  <div data-req-id="2">
    <button>搜索</button>
    <button>重置</button>
  </div>
</div>
```

禁止：

```html
<div data-req-id="mobile-records"></div>
<button data-req-id="mobile-2">搜索</button>
```

### 双向联动

| 触发方 | 行为 | 效果 |
|--------|------|------|
| 面板点击需求项 | 页面中对应 [N] 元素和角标高亮 | 2s 橙色脉冲动画 + 滚动定位 |
| 页面点击角标 | 面板滚动到对应需求项 | 面板内高亮 2s |
| 面板点击弹窗类需求 | 触发页面对应弹窗 | 弹窗自动打开（通过 CustomEvent） |
| 拖拽面板左边缘 | 调整面板宽度 | 320-600px，内容区自动同步缩窄 |

### 弹窗触发机制

PRD 中 `type=modal` 的需求，面板点击时通过 `window.dispatchEvent(new CustomEvent('annotation:trigger-modal', { detail: { reqId, modalId } }))` 触发。

各页面需监听此事件并打开对应弹窗：
```ts
window.addEventListener('annotation:trigger-modal', (e: CustomEvent) => {
  if (e.detail.modalId === 'submitResult') openSubmitModal()
})
```

### 内容区自适应

面板打开时，主内容区 `margin-right` 动态等于面板宽度，确保内容不被遮挡。面板宽度变化时通过 store 同步更新。

## 视觉规范

### 页面角标（AnnotationOverlay 渲染）

```
定位：fixed 全屏叠加层中的 absolute 子元素，使用元素 getBoundingClientRect() 的视口坐标
样式：18×18px, bg #2563EB, 白色 10px bold, border-radius 3px
高亮动画：badge-pulse 0.4s × 3, 缩放 1.5x
hover：scale(1.3) + 加深阴影
```

#### 角标坐标计算（强制）

`AnnotationOverlay` 使用 `Teleport to="body"` 和全屏 `position: fixed`。因此角标坐标必须直接使用目标元素的视口坐标：

```ts
const elRect = el.getBoundingClientRect()
x = elRect.left - 26
y = elRect.top + 4
```

不得减去 `.main-area`、页面容器、滚动容器的 `getBoundingClientRect()`。错误写法会导致角标整体向左/向上偏移，筛选区角标消失，按钮角标跑到其他字段上方。

禁止：

```ts
x = elRect.left - mainAreaRect.left - 26
y = elRect.top - mainAreaRect.top + 4
```

#### 扫描过滤

- 只扫描当前页面根节点：`mainArea.querySelector([data-req-page="当前页面"]) || mainArea`。
- 只渲染当前面板中存在的需求编号，避免弹窗、隐藏页、其他页面的同号元素混入。
- 忽略宽高都为 0 的隐藏元素。
- 弹窗类需求只有弹窗打开后才应该显示弹窗内角标；未打开时只显示页面入口按钮角标。

### 右侧面板（AnnotationPanel）

```
定位：position: fixed, top:60px, right:0, 默认宽 420px
背景：rgba(248,250,252,0.96) + backdrop-blur(20px)
需求项：白色半透明，hover变色，选中橙黄背景
角标编号：与页面角标样式一致
```

### 被标注元素高亮

点击需求项时，被标注元素添加 `anno-highlight` class：2px 橙黄 outline + 扩展动画，2s 消退。

## 工作流程

1. 确认目标 PRD 和涉及的页面列表
2. 读取 `PRD.md`，解析各页面的需求编号和描述（每页独立编号）
3. 确认页面中 `data-req-id` 与 PRD 编号一致
4. 若页面是移动端多子页面，确认每个子页面根节点有 `data-req-page`，内部跳转会同步当前标注页面
5. 挂载 AnnotationPanel（右侧面板）
6. 挂载 AnnotationOverlay（内容区角标层）
7. 初始化双向联动 + 弹窗触发监听
8. 自检：切换页面、点击联动、拖拽、弹窗触发、内容区宽度自适应
9. 角标定位自检：筛选区、搜索/重置、表格操作列、弹窗入口的角标必须贴近对应元素，不得整体偏移或显示到其他字段上方
