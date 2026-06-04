import { ref, computed, reactive } from 'vue'

export interface Requirement {
  id: number
  title: string
  page: string
  type: 'inline' | 'modal'
  modalId?: string
  content: string
  scenarios?: {
    label: string
    scenario: string
  }[]
}

// 每个页面独立编号
const allRequirements: Requirement[] = [
  // ===== 运输监控看板 (1-5) =====
  { id: 1, title: '时间范围切换', page: 'transport-dashboard', type: 'inline', content: '支持**今日 / 近7天 / 近30天**切换。\n\n切换后所有指标卡片、趋势图、分布图**同步刷新**。默认选中"今日"。' },
  { id: 2, title: '指标卡片', page: 'transport-dashboard', type: 'inline', content: '4项核心指标，含环比趋势。\n\n| 指标 | 统计口径 |\n|------|---------|\n| 今日任务总数 | 当日全部任务 |\n| 在途任务 | 状态=在途 |\n| 已完成 | 当日已完成 |\n| 异常任务 | 当日异常（红色数值） |\n\n点击任意卡片可**下钻**至对应筛选列表。' },
  { id: 3, title: '图表分析', page: 'transport-dashboard', type: 'inline', content: '- **运输任务趋势**：柱状图，按日统计近7天每日任务量\n- **车辆状态分布**：饼图，分类统计在途/装货中/待派车/维修停运\n\n与时间范围联动，切换时间后数据同步刷新。' },
  { id: 4, title: '在途车辆实时状态', page: 'transport-dashboard', type: 'inline', content: '展示所有在途车辆的关键监控数据。\n\n| 字段 | 说明 |\n|------|------|\n| 车牌（车头+挂车） | 车辆标识 |\n| 驾驶员、化学品 | 基础信息 |\n| 当前位置 | GPS路段描述 |\n| 速度 | km/h |\n| 罐温 | ℃，超阈值标红 |\n| 状态 | 正常/温度偏高/异常停车 |' },
  { id: 5, title: '告警管理', page: 'transport-dashboard', type: 'inline', content: '展示近期告警事件列表。\n\n| 级别 | 触发条件 |\n|------|---------|\n| 🟡 黄色预警 | 温度超阈值、偏离路线 |\n| 🔴 红色告警 | 异常停车>10分钟 |\n\n每条告警含时间、描述、关联车牌、"处理"入口。' },

  // ===== 运输任务列表 (1-4) =====
  { id: 1, title: '筛选查询', page: 'transport-task-list', type: 'inline', content: '支持按**任务状态、承运商、化学品品名、车头车牌、发车日期**组合筛选。\n\n- **查询**：根据筛选条件刷新列表数据\n- **重置**：恢复所有筛选条件为默认值' },
  { id: 2, title: '数据列表', page: 'transport-task-list', type: 'inline', content: '13列数据表格，含排序、分页、行选择和批量操作。\n\n- **分页**：默认10条/页，可选20/50条\n- **排序**：任务编号、状态列支持升降序\n- **批量删除**：勾选后点击删除，二次确认\n- **导出**：导出当前筛选条件下全部CSV' },
  { id: 3, title: '查看详情弹窗', page: 'transport-task-list', type: 'modal', modalId: 'viewModal', content: '点击行操作"查看"触发，弹窗展示任务全部字段。\n\n- 展示内容：化学品及UN编号、危险类别、承运商、车牌、人员、路线、时间、状态\n- 关闭方式：点击关闭按钮或弹窗外区域' },
  { id: 4, title: '删除确认弹窗', page: 'transport-task-list', type: 'modal', modalId: 'deleteModal', content: '点击行操作"删除"触发，**二次确认**后方可删除。\n\n- 提示："确定要删除任务 #编号 吗？此操作不可撤销。"\n- 按钮：取消 / 确认删除' },

  // ===== 运输任务编辑 (1-4) =====
  { id: 1, title: '基本信息', page: 'transport-task-form', type: 'inline', content: '录入任务基础信息。\n\n| 字段 | 约束 |\n|------|------|\n| 任务名称 | ≤50字符，必填 |\n| 运输类型 | 长途干线/短途配送/中转转运 |\n| 计划发车时间 | ≥当前时间 |\n| 承运商 | 合作承运商列表 |' },
  { id: 2, title: '化学品信息', page: 'transport-task-form', type: 'inline', content: '选择化学品后**自动回填** UN编号、危险类别、包装类别。\n\n- 化学品选项：甲醇、苯乙烯、液氯、硝酸、氢氟酸等\n- 数量：>0吨，精确到2位小数\n- 联动：选择化学品→UN编号/危险类别/包装自动填充（只读）' },
  { id: 3, title: '车辆与人员', page: 'transport-task-form', type: 'inline', content: '分配运输车辆和持证人员。\n\n| 字段 | 约束 |\n|------|------|\n| 车头车牌 | 浙A12345格式，必填 |\n| 挂车车牌 | 浙A1234挂格式，选填 |\n| 驾驶员 | 持证驾驶员，必填 |\n| 押运员 | 持证押运员，必填 |\n| 车辆类型 | 罐车/厢式/集装箱/平板 |' },
  { id: 4, title: '路线信息与提交', page: 'transport-task-form', type: 'modal', modalId: 'submitResult', content: '**路线**：起运地（必填）、目的地（必填）、备注（≤200字符，选填）\n\n**提交逻辑**：\n- 必填校验通过 → 提交\n- 模拟后端返回**成功**或**失败**\n- 成功：弹窗显示任务编号 + "待派车"状态\n- 失败：弹窗显示失败原因（如"承运商证照已过期"、"车辆在检修中"）\n\n**保存草稿**：跳过校验保存。**取消**：已填时弹出放弃确认。' },

  // ===== 装货安全检查 (1-5) =====
  { id: 1, title: '任务信息', page: 'mobile-security-check', type: 'inline', content: '展示当前待检查任务的关键信息：\n\n- 任务编号\n- 车头车牌（如浙A12345）\n- 挂车车牌（如浙A1234挂）\n- 化学品品名及UN编号' },
  { id: 2, title: '检查项目', page: 'mobile-security-check', type: 'inline', content: '**8项安全检查**逐项确认：\n\n1. 车辆外观 2. 紧急切断阀 3. 灭火器\n4. 静电接地带 5. 轮胎与制动 6. 随车证件\n7. 货物核验 8. 铅封检查\n\n- 合格 → 绿色对勾\n- 不合格 → 红色叉号 + 拍照按钮' },
  { id: 3, title: '异常说明', page: 'mobile-security-check', type: 'inline', content: '存在不合格检查项时显示。\n\n安检员填写检查不通过的具体原因（多行文本，选填）。' },
  { id: 4, title: '安检员签名', page: 'mobile-security-check', type: 'inline', content: '点击签名区域弹出签名板，**手写签名**确认。\n\n- 签名内容：安检员姓名 + 日期时间\n- 系统自动记录时间戳' },
  { id: 5, title: '结果提交', page: 'mobile-security-check', type: 'inline', content: '| 按钮 | 行为 |\n|------|------|\n| 暂存 | 保存进度 |\n| 提交 | 全部8项已确认+签名完成 |\n\n提交后**调度员收到通知**。全部合格→发车；不合格→整改后重检。' },

  // ===== 巡检记录页 =====
  { id: 1, title: '筛选区', page: 'inspection-record', type: 'inline', content: '支持按巡检人、巡检场地、巡检开始时间、巡检类型组合筛选巡检记录。' },
  { id: 2, title: '搜索/重置', page: 'inspection-record', type: 'inline', content: '搜索按钮按当前筛选条件刷新记录列表。\n\n重置按钮清空所有筛选条件并恢复默认列表。' },
  { id: 3, title: '导出功能', page: 'inspection-record', type: 'inline', content: '支持导出当前筛选条件下的巡检记录数据。' },
  { id: 4, title: '数据表格', page: 'inspection-record', type: 'inline', content: '展示巡检记录清单，包含巡检场地、巡检类型、巡检人、巡检点位、任务状态、巡检结果、巡检开始时间、巡检提交时间、整改完成时间和操作入口。\n\n任务状态展示“未提交 / 已提交 / 已完成”。未提交记录不显示巡检结果；已提交和已完成记录显示结果摘要：全部正常，或“存在异常 N | 已整改 M”。其中“全部正常”为绿色，“存在异常”为红色，“已整改”为黄色。\n\n三个时间列统一放在巡检结果后方展示。' },
  { id: 5, title: '巡检详情', page: 'inspection-record', type: 'modal', modalId: 'detailModal', content: '点击“巡检详情”后，弹窗展示该记录的完整巡检信息。\n\n内容包括：基础信息、巡检结果摘要、巡检路线图，以及按顺序展示的点位打卡时间、点位照片、巡检情况和整改信息。' },
  { id: 6, title: '巡检路线查看', page: 'inspection-record', type: 'modal', modalId: 'routeModal', content: '点击巡检路线入口后，弹窗单独展示该记录的巡检路线。路线从起点开始，按点位顺序使用横线和竖线连接，并显示行进方向。' },
  { id: 7, title: '删除功能', page: 'inspection-record', type: 'modal', modalId: 'deleteModal', content: '删除巡检记录前必须二次确认，确认后从当前列表移除该记录。' },

  // ===== 巡检类型页 =====
  { id: 1, title: '筛选区', page: 'inspection-type', type: 'inline', content: '支持按巡检类型名称和应用场地筛选巡检类型。' },
  { id: 2, title: '搜索/重置', page: 'inspection-type', type: 'inline', content: '搜索按钮执行筛选查询，重置按钮清空筛选条件。' },
  { id: 3, title: '新增功能', page: 'inspection-type', type: 'modal', modalId: 'formModal', content: '新增巡检类型时填写类型名称和应用场地，保存后新增一条类型记录。' },
  { id: 4, title: '编辑功能', page: 'inspection-type', type: 'modal', modalId: 'formModal', content: '编辑巡检类型时回显原记录，修改后保存并更新列表。' },
  { id: 5, title: '删除功能', page: 'inspection-type', type: 'modal', modalId: 'deleteModal', content: '删除巡检类型前必须二次确认，确认后从列表移除。' },
  { id: 6, title: '应用场地选项', page: 'inspection-type', type: 'inline', content: '应用场地支持物流园区、接收站、物流园区&接收站。巡检类型保存时必须关联应用场地。' },

  // ===== 巡检点位页 =====
  { id: 1, title: '筛选区', page: 'inspection-point', type: 'inline', content: '支持按点位名称和应用场地筛选巡检点位。' },
  { id: 2, title: '搜索/重置', page: 'inspection-point', type: 'inline', content: '搜索按钮执行筛选查询，重置按钮清空筛选条件。' },
  { id: 3, title: '新增功能', page: 'inspection-point', type: 'modal', modalId: 'formModal', content: '新增点位时填写点位名称、选择应用场地并在地图上选择坐标，保存后新增点位记录。' },
  { id: 4, title: '编辑功能', page: 'inspection-point', type: 'modal', modalId: 'formModal', content: '编辑点位时回显点位名称、应用场地和坐标，保存后更新记录。' },
  { id: 5, title: '地图选点', page: 'inspection-point', type: 'inline', content: '在地图上点击选择点位坐标。已选坐标保存到点位记录中，下次编辑可继续查看和修改。' },
  { id: 6, title: '点位码查看', page: 'inspection-point', type: 'modal', modalId: 'codeModal', content: '点击点位码入口后，弹窗展示该点位的点位码，并支持下载。' },
  { id: 7, title: '删除功能', page: 'inspection-point', type: 'modal', modalId: 'deleteModal', content: '删除巡检点位前必须二次确认，确认后从列表移除。' },

  // ===== 移动端首页 =====
  { id: 1, title: '开始巡检入口', page: 'mobile-inspection', type: 'inline', content: '首页主卡片突出显示开始巡检，作为移动端巡检的核心入口。\n\n点击后进入开始巡检页面，选择巡检类型、场地和点位后发起巡检任务。' },
  { id: 2, title: '巡检记录入口', page: 'mobile-inspection', type: 'inline', content: '首页下方次入口展示巡检记录，用于查看历史巡检任务。\n\n点击进入移动端巡检记录列表，查看历史巡检结果并可进入详情。' },
  { id: 3, title: '点位地图入口', page: 'mobile-inspection', type: 'inline', content: '首页下方次入口展示点位地图，用于查看点位分布地图。\n\n点击进入点位地图，查看不同场地的巡检点位分布。' },

  // ===== 移动端开始巡检 =====
  { id: 1, title: '巡检类型选择', page: 'mobile-inspection-start', type: 'inline', content: '选择巡检类型，系统据此确定当前巡检任务的业务类型。' },
  { id: 2, title: '巡检场地自动匹配', page: 'mobile-inspection-start', type: 'inline', content: '巡检场地根据巡检类型自动匹配，不支持手动修改。' },
  { id: 3, title: '巡检点位选择', page: 'mobile-inspection-start', type: 'inline', content: '选择巡检场地后，系统以一行一个点位的列表展示当前场地下可选巡检点位。\n\n用户可直接点击某一行完成选中或取消选中，选中后该行应以蓝色字体和蓝色边框高亮。\n\n已选择的点位应在下方以标签形式展示，支持继续添加和单独删除。' },
  { id: 4, title: '已选点位管理', page: 'mobile-inspection-start', type: 'inline', content: '已选点位在下方以标签形式展示，用户可以直接删除某个已选点位，也可以继续点击列表补充更多点位。删除后对应点位不进入本次巡检任务。' },
  { id: 5, title: '下一步', page: 'mobile-inspection-start', type: 'inline', content: '巡检类型、场地和点位均完整后，点击下一步进入巡检任务页面。' },

  // ===== 移动端巡检任务 =====
  { id: 1, title: '点位进度条', page: 'mobile-inspection-task', type: 'inline', content: '展示本次任务的所有巡检点位，支持切换当前点位。\n\n点位较多时，点位条采用固定宽度横向滚动，避免按钮拥挤。\n\n打卡成功后，点位顺序按打卡时间重新排序，并在上方直接显示对应顺序编号。\n\n点位填写完成后，正常点位显示为绿色，异常点位显示为红色。' },
  {
    id: 2,
    title: '点位核对与打卡',
    page: 'mobile-inspection-task',
    type: 'inline',
    content: '点击"扫码核对"后，不接入真实扫码能力，只模拟扫码操作，直接显示核对成功并完成打卡。\n\n打卡成功后，在成功标签内直接显示时间，用于标识该点位的巡检顺序。\n\n业务顺序：打卡是第一步。打卡成功后才允许填写点位照片和巡检情况。\n\n异常情况：当点位码与当前点位不对应时，提示"打卡异常，点位码与当前点位不对应"；异常时当前点位不计为已完成，且不允许填写照片和巡检情况。\n\n点位照片、打卡状态、巡检情况均为必填项。',
    scenarios: [{ label: '预览异常情况', scenario: 'scan-error' }],
  },
  { id: 3, title: '点位照片拍摄', page: 'mobile-inspection-task', type: 'inline', content: '打卡成功后才允许添加点位照片。\n\n每个点位至少需要 1 张点位照片，最多可保留 6 张。照片可删除，删除后数量重新计算。' },
  { id: 4, title: '巡检情况记录', page: 'mobile-inspection-task', type: 'inline', content: '打卡成功后才允许填写巡检情况。\n\n巡检情况需包含正常/异常选择和文字说明。默认状态为正常，选择异常后后续记录详情中应按异常结果展示。\n\n巡检情况为必填项，用于记录当前点位的巡检说明或异常描述，至少输入 2 个字。\n\n提供“存在异常 / 卫生问题 / 设备异样”便捷填写按钮，点击后将对应内容追加到备注中，并用“；”分隔。' },
  { id: 5, title: '暂存功能', page: 'mobile-inspection-task', type: 'inline', content: '点击暂存保存当前巡检进度，并在记录列表中以“未提交”状态展示，便于稍后继续处理。' },
  { id: 6, title: '下一点位', page: 'mobile-inspection-task', type: 'inline', content: '当前点位完成后才允许进入下一点位。\n\n点位完成标准：打卡成功、至少 1 张点位照片、巡检情况至少 2 个字。切换后已填写内容保留。' },
  { id: 7, title: '提交本次巡检', page: 'mobile-inspection-task', type: 'inline', content: '只有所有点位都达到完成标准后，才允许提交本次巡检。\n\n点位完成标准：打卡成功、至少上传 1 张点位照片、巡检情况至少 2 个字。\n\n提交后生成巡检记录并进入记录列表；如本次存在异常点位，则提示“本次巡检X处异常，请整改”，并以“已提交”状态进入记录详情处理整改。' },

  // ===== 移动端巡检记录 =====
  { id: 1, title: '筛选功能', page: 'mobile-inspection-records', type: 'inline', content: '支持按巡检类型和巡检时间筛选移动端巡检记录。' },
  { id: 2, title: '记录状态显示', page: 'mobile-inspection-records', type: 'inline', content: '记录列表展示“未提交 / 已提交 / 已完成”三类任务状态，并按状态决定是否展示巡检结果摘要。\n\n未提交记录点击后进入巡检任务页继续填写，且列表中不显示巡检结果；已提交和已完成记录点击后进入记录详情。\n\n巡检结果摘要按点位结果汇总展示：全部正常，或“存在异常 N | 已整改 M”。其中“全部正常”为绿色，“存在异常”为红色，“已整改”为黄色。' },

  // ===== 移动端点位地图 =====
  { id: 1, title: '场地切换', page: 'mobile-inspection-map', type: 'inline', content: '支持在物流园区和接收站之间切换，查看对应场地的点位分布。' },
  { id: 2, title: '点位显示', page: 'mobile-inspection-map', type: 'inline', content: '地图上展示当前场地全部点位标记和点位名称。' },

  // ===== 移动端记录详情 =====
  { id: 1, title: '基本信息显示', page: 'mobile-inspection-detail', type: 'inline', content: '展示巡检类型、巡检场地、巡检人和巡检时间。' },
  { id: 2, title: '巡检路线图', page: 'mobile-inspection-detail', type: 'inline', content: '根据巡检点位顺序生成巡检路线，用于回看本次巡检路径。\n\n路线必须从起点开始，再依次连接第一个点位、第二个点位等。不同点位之间使用横线和竖线连接，不允许斜线直连。\n\n点击路线图可放大查看。' },
  { id: 3, title: '点位详情', page: 'mobile-inspection-detail', type: 'inline', content: '点位标签需要显示点位顺序 1、2、3、4 等，点击某个点位标签后，只展示该点位对应的打卡时间、点位照片和巡检情况。\n\n点位照片需要直接显示实际拍摄照片，原型阶段可使用图片占位符。点击照片可查看大图。\n\n如果点位巡检结果为异常，则点位标签和状态文案显示红色。\n\n异常点位在详情页下方提供整改区域，包含整改打卡、整改照片和整改情况；整改完成后，在巡检详情中继续保留整改记录。' },
]

// Shared state
const panelOpen = ref(false)
const activeReqId = ref<number | null>(null)
const currentPage = ref('transport-dashboard')
const panelWidth = ref(420)

export function useAnnotationStore() {
  const requirementsForCurrentPage = computed(() =>
    allRequirements.filter(r => r.page === currentPage.value)
  )

  function getCurrentPageSelector() {
    return `[data-req-page="${currentPage.value}"]`
  }

  function getCurrentPageRoot(): Element | Document {
    const mainArea = document.querySelector('.main-area')
    if (!mainArea) return document
    return mainArea.querySelector(getCurrentPageSelector()) || mainArea
  }

  function setPage(page: string) {
    currentPage.value = page
    activeReqId.value = null
  }

  function togglePanel() {
    panelOpen.value = !panelOpen.value
    if (!panelOpen.value) activeReqId.value = null
  }

  function selectRequirement(reqId: number) {
    activeReqId.value = reqId

    // Highlight badges in content area
    document.querySelectorAll('.anno-badge').forEach(b => b.classList.remove('highlight'))

    // Limit lookup to the active page. Mobile prototypes can keep several
    // logical screens in one Vue component, so numeric IDs are page-scoped.
    const root = getCurrentPageRoot()
    const els = root.querySelectorAll(`[data-req-id="${reqId}"]`)
    els.forEach(el => {
      el.classList.add('anno-highlight')
      setTimeout(() => el.classList.remove('anno-highlight'), 2000)
    })

    // Scroll to first matching element
    if (els[0]) {
      els[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Highlight corresponding badge in overlay
    document.querySelectorAll(`.anno-badge[data-req="${reqId}"]`).forEach(b => {
      b.classList.add('highlight')
      setTimeout(() => b.classList.remove('highlight'), 2000)
    })

    // Trigger modal if needed
    const req = allRequirements.find(r => r.id === reqId && r.page === currentPage.value)
    if (req?.type === 'modal' && req.modalId) {
      window.dispatchEvent(new CustomEvent('annotation:trigger-modal', {
        detail: { reqId, modalId: req.modalId }
      }))
    }
  }

  function handleBadgeClick(reqId: number) {
    activeReqId.value = reqId
    // Scroll panel to that item
    const itemEl = document.getElementById(`req-panel-item-${reqId}`)
    itemEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    itemEl?.classList.add('req-panel-item--highlight')
    setTimeout(() => itemEl?.classList.remove('req-panel-item--highlight'), 2000)
  }

  function applyScenario(reqId: number, scenario: string) {
    activeReqId.value = reqId
    window.dispatchEvent(new CustomEvent('annotation:apply-scenario', {
      detail: { page: currentPage.value, reqId, scenario }
    }))
  }

  return {
    allRequirements,
    requirementsForCurrentPage,
    panelOpen,
    activeReqId,
    currentPage,
    panelWidth,
    getCurrentPageSelector,
    getCurrentPageRoot,
    setPage,
    togglePanel,
    selectRequirement,
    handleBadgeClick,
    applyScenario,
  }
}

let storeInstance: ReturnType<typeof useAnnotationStore> | null = null
export function getAnnotationStore() {
  if (!storeInstance) storeInstance = useAnnotationStore()
  return storeInstance
}
