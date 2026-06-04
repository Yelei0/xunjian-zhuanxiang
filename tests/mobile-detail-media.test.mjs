import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobile = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')

assert(mobile.includes('detailRoutePoints') && mobile.includes('routeStartPoints') && mobile.includes('generateOrthogonalRoutePath') && mobile.includes('openRoutePreview'))
assert(!mobile.includes('已拍照') && mobile.includes('detail-photo-grid') && mobile.includes('openPhotoPreview') && mobile.includes('previewPhoto'))
assert(mobile.includes('inspectionStatusOptions') && mobile.includes('inspection-status-choice') && mobile.includes("inspectionStatus: 'normal'") && mobile.includes("value: 'abnormal'") && mobile.includes("currentTaskPoint.value.inspectionStatus = 'abnormal'") && mobile.includes('setCurrentInspectionStatus'))
assert(mobile.includes('activeDetailPointIndex') && mobile.includes('activeDetailPoint') && mobile.includes('detailPointStatusClass') && mobile.includes('point-tag-order') && mobile.includes('selectDetailPoint'))
assert(mobile.includes('未提交') && mobile.includes('已提交') && mobile.includes('已完成') && mobile.includes('整改打卡') && mobile.includes('整改照片') && mobile.includes('整改情况') && mobile.includes('getRecordResultSummary'))
