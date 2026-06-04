# 危化品运输行业 Vibecoding 原型框架

## 项目定位

这是一个**纯前端原型框架**，用于快速生成危化品运输行业的 UI 原型页面。
不做后端、不做真实数据接口、不做生产级代码。所有数据均为前端模拟数据。

## 核心工作流

```
用户描述需求 → Skill ① 生成原型页面 → Skill ② 提取 PRD → Skill ③ 注入标注面板
```

三个 Skill 通过文件约定串联：

| 步骤 | Skill | 输入 | 输出 |
|------|-------|------|------|
| 1 | `skills/chemical-proto-generator/SKILL.md` | 自然语言需求 | `src/pages/<name>/index.vue` + `spec.md` + `design.md` |
| 2 | `skills/chemical-prd-generator/SKILL.md` | 步骤 1 输出（多页面） | `prd/<模块名称>.md` |
| 3 | `skills/annotation-panel/SKILL.md` | 步骤 2 输出 | 页面注入标注面板 |

## 技术栈

- Vue 3 Composition API（`<script setup lang="ts">`）
- Tailwind CSS
- Vite 开发服务器
- 不引入 UI 组件库（保持轻量，所有组件手写）

## 关键约束

### 模拟数据
**必须**遵守 `skills/industry-data-rules.md` 中的行业规范。禁止使用：
- 快递公司名（顺丰、中通等）
- 电商平台名（淘宝、京东等）
- 通用占位名（张三、某某等）
- 科技互联网行业场景

### 页面风格
- 所有页面使用统一的左侧导航栏 + 右侧主内容区布局
- 配色以 `#2563EB`（橙黄色）为品牌主色
- 状态色：成功=绿色、告警=橙黄、危险=红色、信息=蓝色
- 注重层次感、留白、语义化标签
- 所有交互状态（加载中、空数据、异常）必须实现

### 代码规范
- 驼峰命名（文件用小写连字符，组件用 PascalCase）
- 每个页面文件 <500 行
- 不引入非必要依赖
- 模拟数据内联在组件中（使用 `ref` 定义）

### 标注预留
每个功能模块的 DOM 元素上添加 `data-req-id=""` 属性，供 Skill ③ 填充需求编号。

## 页面类型

| 类型 | 布局特征 | 输出目录 |
|------|---------|---------|
| 数据看板 | 指标卡片 + 图表 + 状态列表 | `src/pages/<name>/` |
| 后台列表 | 筛选区 + 数据表格 + 分页 | `src/pages/<name>/` |
| 表单编辑 | 字段表单 + 提交操作 | `src/pages/<name>/` |
| 移动端 | PhoneFrame 组件内渲染 | `src/pages/<name>/` |

## 项目结构

```
原型框架/
├── AGENTS.md                          # 本文档
├── prd/                               # PRD 文档（按业务模块组织）
│   ├── 运输任务管理.md                 # 覆盖列表+编辑+看板
│   └── 装货安全检查.md                 # 覆盖移动端
├── skills/                            # 技能定义
│   ├── industry-data-rules.md         # 行业数据规范
│   ├── phone-frame/PhoneFrame.vue     # 手机端框架组件
│   ├── chemical-proto-generator/      # Skill ①
│   ├── chemical-prd-generator/        # Skill ②
│   └── annotation-panel/             # Skill ③
└── src/
    ├── App.vue                        # 根组件（含导航）
    ├── main.ts
    ├── assets/main.css
    └── pages/                         # 原型页面（不含PRD）
        ├── <page-name>/
        │   ├── index.vue
        │   ├── spec.md
        │   └── design.md
```

## 注意事项

- 不做后端 API 对接
- 不做用户认证
- 不做真实文件上传
- 数据刷新为模拟延时（setTimeout）
- 表单提交为模拟成功/失败
- 弹窗、下拉、切换等交互用 Vue 响应式实现
