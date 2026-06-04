import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobile = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')

assert(!mobile.includes('task-cameras') && !mobile.includes('camera-circle'))
assert(mobile.includes('home-action-primary') && mobile.includes('home-secondary-grid') && mobile.includes('选择巡检类型、场地和点位'))
assert(mobile.includes('扫码核对') && !mobile.includes('模拟扫码核对') && mobile.includes('simulateScanSuccess'))
assert(!mobile.includes('模拟异常') && mobile.includes('handleAnnotationScenario') && mobile.includes('simulateScanError'))
assert(mobile.includes('提交本次巡检') && mobile.includes('本次巡检') && mobile.includes('请整改') && mobile.includes('canFinishInspection'))
assert(mobile.includes('未提交') && mobile.includes('已提交') && mobile.includes('已完成') && mobile.includes('继续巡检>>>') && mobile.includes('查看详情>>>') && mobile.includes('getRecordResultSummary'))
assert(mobile.includes('整改打卡') && mobile.includes('整改照片') && mobile.includes('整改情况') && mobile.includes('rectification') && mobile.includes('detail-point-card'))
assert(mobile.includes('quickRemarkOptions') && mobile.includes('存在异常') && mobile.includes('卫生问题') && mobile.includes('设备异样') && mobile.includes('appendQuickRemark') && mobile.includes('；'))
assert(mobile.includes('flex: 0 0 96px') && mobile.includes('overflow-x: auto') && mobile.includes('orderedTaskPoints') && mobile.includes('checkedInAt') && mobile.includes('checkin-time-inline') && !mobile.includes('class="checkin-time"'))
assert(mobile.includes('isPointComplete') && mobile.includes('canEditInspectionContent') && mobile.includes('MIN_REMARK_LENGTH') && mobile.includes(':disabled="!canEditInspectionContent"') && mobile.includes('请先完成当前点位的打卡、点位照片和巡检情况'))
