<template>
  <div class="inspection-record-page" data-req-page="inspection-record">
    <div class="page-header">
      <h2 class="page-title">巡检记录</h2>
    </div>

    <div class="filter-section" data-req-id="1">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">巡检人</label>
          <input v-model="filters.inspector" type="text" class="filter-input" placeholder="请输入" />
        </div>
        <div class="filter-item">
          <label class="filter-label">巡检场地</label>
          <select v-model="filters.parkArea" class="filter-select">
            <option value="">请选择</option>
            <option v-for="area in parkAreas" :key="area" :value="area">{{ area }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">巡检开始时间</label>
          <input v-model="filters.startTime" type="date" class="filter-input filter-date" />
          <span class="filter-separator">至</span>
          <input v-model="filters.endTime" type="date" class="filter-input filter-date" />
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">巡检类型</label>
          <select v-model="filters.inspectionType" class="filter-select">
            <option value="">请选择</option>
            <option v-for="type in inspectionTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" data-req-id="2" @click="handleSearch">搜索</button>
          <button class="btn btn-default" data-req-id="2" @click="handleReset">重置</button>
        </div>
      </div>
      <div class="filter-toolbar">
        <button class="btn btn-link" data-req-id="3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          导出
        </button>
      </div>
    </div>

    <div class="table-section" data-req-id="4">
      <table class="data-table">
        <thead>
          <tr>
            <th class="th-checkbox">
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
            </th>
            <th class="th-index">序号</th>
            <th class="th-area">巡检场地</th>
            <th class="th-type">类型</th>
            <th class="th-person">巡检人</th>
            <th class="th-point">巡检点位</th>
            <th class="th-task">任务状态</th>
            <th class="th-result">巡检结果</th>
            <th class="th-time">巡检开始时间</th>
            <th class="th-time">巡检提交时间</th>
            <th class="th-time">整改完成时间</th>
            <th class="th-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in filteredData" :key="item.id">
            <td class="td-checkbox">
              <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
            </td>
            <td class="td-index">{{ index + 1 }}</td>
            <td class="td-area">{{ item.parkArea }}</td>
            <td class="td-type">
              <span class="tag" :class="getTypeClass(item.inspectionType)">{{ item.inspectionType }}</span>
            </td>
            <td class="td-person">{{ item.inspector }}</td>
            <td class="td-point point-text">{{ getPointNames(item).join('、') }}</td>
            <td class="td-task">
              <span class="task-badge" :class="getTaskStatusClass(item)">{{ getTaskStatusText(item) }}</span>
            </td>
            <td class="td-result">
              <span v-if="item.taskStatus === 'draft'" class="result-empty">未提交不显示</span>
              <template v-else-if="getRecordAbnormalCount(item) === 0">
                <span class="result-normal">全部正常</span>
              </template>
              <template v-else>
                <span class="result-abnormal">存在异常 {{ getRecordAbnormalCount(item) }}</span>
                <span class="result-divider">|</span>
                <span class="result-rectified">已整改 {{ getRecordRectifiedCount(item) }}</span>
              </template>
            </td>
            <td class="td-time">{{ item.startTime }}</td>
            <td class="td-time">{{ item.submitTime || '-' }}</td>
            <td class="td-time">{{ getRectificationCompletedTime(item) }}</td>
            <td class="td-action">
              <button class="action-link action-detail" data-req-id="5" @click="viewDetail(item)">巡检详情</button>
              <button class="action-link action-delete" data-req-id="7" @click="confirmDelete(item)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredData.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p>暂无数据</p>
      </div>
    </div>

    <div v-if="showDetailModal && currentDetailRecord" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content modal-detail" data-req-id="5">
        <div class="modal-header">
          <h3>巡检详情</h3>
          <button class="btn-close" @click="showDetailModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body detail-modal-body">
          <div class="detail-grid">
            <div class="detail-card detail-basic-card">
              <div class="detail-card-head">
                <div>
                  <div class="detail-title">{{ currentDetailRecord.inspectionType }} · {{ currentDetailRecord.parkArea }}</div>
                  <div class="detail-subtitle">{{ currentDetailRecord.inspector }} | 开始：{{ currentDetailRecord.startTime }}</div>
                </div>
                <span class="task-badge" :class="getTaskStatusClass(currentDetailRecord)">
                  {{ getTaskStatusText(currentDetailRecord) }}
                </span>
              </div>
              <div class="summary-row">
                <span class="summary-label">巡检结果</span>
                <div class="summary-value">
                  <span v-if="currentDetailRecord.taskStatus === 'draft'" class="result-empty">未提交不显示</span>
                  <template v-else-if="getRecordAbnormalCount(currentDetailRecord) === 0">
                    <span class="result-normal">全部正常</span>
                  </template>
                  <template v-else>
                    <span class="result-abnormal">存在异常 {{ getRecordAbnormalCount(currentDetailRecord) }}</span>
                    <span class="result-divider">|</span>
                    <span class="result-rectified">已整改 {{ getRecordRectifiedCount(currentDetailRecord) }}</span>
                  </template>
                </div>
              </div>
              <div class="summary-meta">
                <div class="meta-item">
                  <span class="meta-label">巡检提交时间</span>
                  <span class="meta-value">{{ currentDetailRecord.submitTime || '-' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">整改完成时间</span>
                  <span class="meta-value">{{ getRectificationCompletedTime(currentDetailRecord) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">巡检点位</span>
                  <span class="meta-value">{{ getPointNames(currentDetailRecord).join('、') }}</span>
                </div>
              </div>
            </div>

            <div class="detail-card detail-route-card" data-req-id="6">
              <div class="detail-section-head">
                <h4>巡检路线</h4>
                <span class="route-tip">{{ getPointNames(currentDetailRecord).length }} 个点位</span>
              </div>
              <div class="route-map route-map-clickable" @click="openRoutePreview(currentDetailRecord)">
                <img
                  :src="currentDetailRecord.parkArea === '接收站' ? stationImage : parkImage"
                  alt="巡检路线图"
                  class="map-image"
                />
                <svg class="route-svg" viewBox="0 0 600 500">
                  <polyline
                    v-if="detailRoutePath.length > 1"
                    :points="detailRoutePath.map(p => `${p.x},${p.y}`).join(' ')"
                    fill="none"
                    stroke="#2563EB"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <g v-for="(arrow, idx) in detailRouteArrows" :key="`detail-arrow-${idx}`" :transform="`translate(${arrow.x} ${arrow.y}) rotate(${arrow.rotation})`">
                    <polygon points="-7,-3.5 7,0 -7,3.5" fill="#2563EB" />
                  </g>
                  <g v-for="(point, idx) in detailRoutePoints" :key="point.id">
                    <circle :cx="point.x" :cy="point.y" :r="idx === 0 ? 10 : 8" :fill="idx === 0 ? '#10B981' : '#2563EB'" stroke="#fff" stroke-width="2" />
                    <text :x="point.x" :y="point.y + 4" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">
                      {{ idx === 0 ? '起' : idx }}
                    </text>
                    <rect
                      :x="point.x - getRouteLabelWidth(point.name) / 2"
                      :y="point.y - 34"
                      :width="getRouteLabelWidth(point.name)"
                      height="20"
                      rx="6"
                      fill="#2563EB"
                    />
                    <text :x="point.x" :y="point.y - 20" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">
                      {{ point.name }}
                    </text>
                  </g>
                </svg>
                <span class="zoom-tip">点击查看大图</span>
              </div>
            </div>
          </div>

          <div class="detail-card detail-points-card">
            <div class="detail-section-head">
              <h4>点位详情</h4>
              <span class="route-tip">按巡检顺序展示</span>
            </div>
            <div class="point-detail-list">
              <div v-for="(point, idx) in currentDetailRecord.points" :key="point.id" class="point-detail-item">
                <div class="point-detail-head">
                  <div class="point-title-wrap">
                    <span class="point-index" :class="getPointStatusChipClass(point)">{{ idx + 1 }}</span>
                    <span class="point-name">{{ point.name }}</span>
                  </div>
                  <span class="point-status-chip" :class="getPointStatusChipClass(point)">
                    {{ getPointStatusText(point) }}
                  </span>
                </div>
                <div class="point-meta-grid">
                  <div class="point-meta-item">
                    <span class="meta-label">打卡时间</span>
                    <span class="meta-value">{{ point.checkInTime }}</span>
                  </div>
                  <div class="point-meta-item">
                    <span class="meta-label">巡检情况</span>
                    <span class="meta-value" :class="getPointStatusTextClass(point)">{{ point.inspectionRemark }}</span>
                  </div>
                </div>
                <div class="photo-row">
                  <span class="meta-label photo-label">点位照片</span>
                  <div class="photo-grid">
                    <div v-for="(photo, photoIdx) in point.photos" :key="photoIdx" class="photo-thumb">
                      <img :src="photo" alt="点位照片" />
                    </div>
                  </div>
                </div>

                <div v-if="point.pointStatus === 'abnormal' || point.pointStatus === 'rectified'" class="rectify-card">
                  <div class="rectify-head">
                    <span class="rectify-title">整改信息</span>
                    <span class="rectify-badge" :class="point.pointStatus === 'rectified' ? 'rectify-badge-done' : 'rectify-badge-pending'">
                      {{ point.pointStatus === 'rectified' ? '已整改' : '待整改' }}
                    </span>
                  </div>
                  <div class="point-meta-grid">
                    <div class="point-meta-item">
                      <span class="meta-label">整改打卡</span>
                      <span class="meta-value">{{ point.rectification.checkedInAt || '待整改' }}</span>
                    </div>
                    <div class="point-meta-item">
                      <span class="meta-label">整改情况</span>
                      <span class="meta-value" :class="point.pointStatus === 'rectified' ? 'text-rectified' : 'text-pending'">
                        {{ point.rectification.remark || '待补充整改说明' }}
                      </span>
                    </div>
                  </div>
                  <div v-if="point.rectification.photos.length" class="photo-row">
                    <span class="meta-label photo-label">整改照片</span>
                    <div class="photo-grid">
                      <div v-for="(photo, photoIdx) in point.rectification.photos" :key="photoIdx" class="photo-thumb photo-thumb-rectify">
                        <img :src="photo" alt="整改照片" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRouteModal" class="modal-overlay" @click.self="showRouteModal = false">
      <div class="modal-content modal-large" data-req-id="6">
        <div class="modal-header">
          <h3>巡检路线大图</h3>
          <button class="btn-close" @click="showRouteModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="currentRouteRecord" class="route-map route-map-large">
            <img
              :src="currentRouteRecord.parkArea === '接收站' ? stationImage : parkImage"
              alt="巡检路线图"
              class="map-image"
            />
            <svg class="route-svg" viewBox="0 0 600 500">
              <polyline
                v-if="detailRoutePath.length > 1"
                :points="detailRoutePath.map(p => `${p.x},${p.y}`).join(' ')"
                fill="none"
                stroke="#2563EB"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g v-for="(arrow, idx) in detailRouteArrows" :key="`preview-arrow-${idx}`" :transform="`translate(${arrow.x} ${arrow.y}) rotate(${arrow.rotation})`">
                <polygon points="-7,-3.5 7,0 -7,3.5" fill="#2563EB" />
              </g>
              <g v-for="(point, idx) in detailRoutePoints" :key="point.id">
                <circle :cx="point.x" :cy="point.y" :r="idx === 0 ? 10 : 8" :fill="idx === 0 ? '#10B981' : '#2563EB'" stroke="#fff" stroke-width="2" />
                <text :x="point.x" :y="point.y + 4" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">
                  {{ idx === 0 ? '起' : idx }}
                </text>
                <rect
                  :x="point.x - getRouteLabelWidth(point.name) / 2"
                  :y="point.y - 34"
                  :width="getRouteLabelWidth(point.name)"
                  height="20"
                  rx="6"
                  fill="#2563EB"
                />
                <text :x="point.x" :y="point.y - 20" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">
                  {{ point.name }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content" data-req-id="7">
        <div class="modal-header">
          <h3>确认删除</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除这条巡检记录吗？</p>
          <p class="modal-tip">删除后将无法恢复</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-danger" @click="handleDelete">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}images/${file}`
const parkImage = assetUrl('park.jpg')
const stationImage = assetUrl('jieshouzhan.jpg')

interface RectificationInfo {
  checkedInAt: string
  remark: string
  photos: string[]
}

interface PointRecord {
  id: number
  name: string
  checkInTime: string
  pointStatus: 'normal' | 'abnormal' | 'rectified'
  inspectionRemark: string
  photos: string[]
  rectification: RectificationInfo
}

interface InspectionRecord {
  id: number
  startTime: string
  submitTime: string
  parkArea: string
  inspectionType: string
  inspector: string
  taskStatus: 'draft' | 'submitted' | 'completed'
  points: PointRecord[]
}

interface RoutePoint {
  id: number
  name: string
  x: number
  y: number
}

const parkAreas = ref(['物流园区', '接收站', '物流园区&接收站'])
const inspectionTypes = ref(['日常巡检-白天', '日常巡检-夜晚', '专项巡检', '应急巡检'])

const filters = reactive({
  inspector: '',
  parkArea: '',
  startTime: '',
  endTime: '',
  inspectionType: '',
})

const appliedFilters = reactive({ ...filters })

const pointCoordinates: Record<string, RoutePoint[]> = {
  物流园区: [
    { id: 1, name: '东门岗', x: 180, y: 100 },
    { id: 2, name: '物流园编组区', x: 350, y: 150 },
    { id: 3, name: '综合楼', x: 480, y: 280 },
    { id: 4, name: '仓库区', x: 380, y: 380 },
    { id: 5, name: '南门岗', x: 150, y: 400 },
    { id: 6, name: '办公楼', x: 100, y: 250 },
  ],
  接收站: [
    { id: 7, name: '泵房', x: 200, y: 120 },
    { id: 8, name: '编组区', x: 380, y: 180 },
    { id: 9, name: '重车区', x: 450, y: 300 },
    { id: 10, name: '轻车区', x: 320, y: 350 },
    { id: 11, name: '地磅房', x: 180, y: 320 },
    { id: 12, name: '门卫室', x: 120, y: 200 },
  ],
}

const routeStartPoints: Record<string, { x: number; y: number }> = {
  物流园区: { x: 80, y: 80 },
  接收站: { x: 100, y: 100 },
}

const tableData = ref<InspectionRecord[]>([
  {
    id: 1,
    startTime: '2026-01-01 08:00:00',
    submitTime: '2026-01-01 08:32:00',
    parkArea: '物流园区',
    inspectionType: '日常巡检-白天',
    inspector: '张扬洲',
    taskStatus: 'completed',
    points: [
      {
        id: 1,
        name: '东门岗',
        checkInTime: '2026-01-01 08:00:00',
        pointStatus: 'normal',
        inspectionRemark: '无异常',
        photos: [parkImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
      {
        id: 2,
        name: '物流园编组区',
        checkInTime: '2026-01-01 08:12:00',
        pointStatus: 'normal',
        inspectionRemark: '无异常',
        photos: [parkImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
      {
        id: 3,
        name: '综合楼',
        checkInTime: '2026-01-01 08:25:00',
        pointStatus: 'normal',
        inspectionRemark: '无异常',
        photos: [parkImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
    ],
  },
  {
    id: 2,
    startTime: '2026-01-02 09:00:00',
    submitTime: '',
    parkArea: '物流园区',
    inspectionType: '专项巡检',
    inspector: '张扬洲',
    taskStatus: 'draft',
    points: [
      {
        id: 4,
        name: '办公楼',
        checkInTime: '2026-01-02 09:00:00',
        pointStatus: 'normal',
        inspectionRemark: '待提交',
        photos: [parkImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
      {
        id: 5,
        name: '南门岗',
        checkInTime: '2026-01-02 09:16:00',
        pointStatus: 'normal',
        inspectionRemark: '待提交',
        photos: [parkImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
    ],
  },
  {
    id: 3,
    startTime: '2026-01-03 07:30:00',
    submitTime: '2026-01-03 08:05:00',
    parkArea: '接收站',
    inspectionType: '日常巡检-夜晚',
    inspector: '马伟杜',
    taskStatus: 'submitted',
    points: [
      {
        id: 7,
        name: '泵房',
        checkInTime: '2026-01-03 07:30:00',
        pointStatus: 'abnormal',
        inspectionRemark: '灭火器压力不足',
        photos: [stationImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
      {
        id: 8,
        name: '编组区',
        checkInTime: '2026-01-03 07:42:00',
        pointStatus: 'abnormal',
        inspectionRemark: '园区东侧灭火器罩破损',
        photos: [stationImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
      {
        id: 9,
        name: '重车区',
        checkInTime: '2026-01-03 07:50:00',
        pointStatus: 'normal',
        inspectionRemark: '无异常',
        photos: [stationImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
    ],
  },
  {
    id: 4,
    startTime: '2026-01-04 10:20:00',
    submitTime: '2026-01-04 10:58:00',
    parkArea: '接收站',
    inspectionType: '应急巡检',
    inspector: '刘小龙',
    taskStatus: 'completed',
    points: [
      {
        id: 10,
        name: '轻车区',
        checkInTime: '2026-01-04 10:20:00',
        pointStatus: 'rectified',
        inspectionRemark: '防撞桩松动',
        photos: [stationImage],
        rectification: {
          checkedInAt: '2026-01-04 11:15:00',
          remark: '已完成加固处理并复检正常',
          photos: [stationImage],
        },
      },
      {
        id: 11,
        name: '地磅房',
        checkInTime: '2026-01-04 10:36:00',
        pointStatus: 'rectified',
        inspectionRemark: '地面警示线模糊',
        photos: [stationImage],
        rectification: {
          checkedInAt: '2026-01-04 11:32:00',
          remark: '已完成补刷并复核通过',
          photos: [stationImage],
        },
      },
      {
        id: 12,
        name: '门卫室',
        checkInTime: '2026-01-04 10:48:00',
        pointStatus: 'normal',
        inspectionRemark: '无异常',
        photos: [stationImage],
        rectification: { checkedInAt: '', remark: '', photos: [] },
      },
    ],
  },
])

function getPointNames(record: InspectionRecord) {
  return record.points.map(point => point.name)
}

function getRecordAbnormalCount(record: InspectionRecord) {
  return record.points.filter(point => point.pointStatus !== 'normal').length
}

function getRecordRectifiedCount(record: InspectionRecord) {
  return record.points.filter(point => point.pointStatus === 'rectified').length
}

function getTaskStatusText(record: InspectionRecord) {
  if (record.taskStatus === 'draft') return '未提交'
  if (record.taskStatus === 'submitted') return '已提交'
  return '已完成'
}

function getRectificationCompletedTime(record: InspectionRecord) {
  const times = record.points
    .map(point => point.rectification.checkedInAt)
    .filter(Boolean)
    .sort()
  if (times.length === 0) return '-'
  return times[times.length - 1]
}

function getTaskStatusClass(record: InspectionRecord) {
  if (record.taskStatus === 'draft') return 'task-draft'
  if (record.taskStatus === 'submitted') return 'task-submitted'
  return 'task-completed'
}

function getPointStatusText(point: PointRecord) {
  if (point.pointStatus === 'abnormal') return '异常'
  if (point.pointStatus === 'rectified') return '已整改'
  return '正常'
}

function getPointStatusChipClass(point: PointRecord) {
  if (point.pointStatus === 'abnormal') return 'chip-abnormal'
  if (point.pointStatus === 'rectified') return 'chip-rectified'
  return 'chip-normal'
}

function getPointStatusTextClass(point: PointRecord) {
  if (point.pointStatus === 'abnormal') return 'text-abnormal'
  if (point.pointStatus === 'rectified') return 'text-rectified'
  return 'text-normal'
}

function getRouteLabelWidth(name: string) {
  return Math.max(52, name.length * 12 + 16)
}

function getTypeClass(type: string) {
  return type.includes('专项') ? 'tag-special' : type.includes('应急') ? 'tag-emergency' : 'tag-normal'
}

function handleSearch() {
  Object.assign(appliedFilters, filters)
}

function handleReset() {
  filters.inspector = ''
  filters.parkArea = ''
  filters.startTime = ''
  filters.endTime = ''
  filters.inspectionType = ''
  Object.assign(appliedFilters, filters)
}

const filteredData = computed(() =>
  tableData.value.filter(item => {
    const taskStatusText = getTaskStatusText(item)
    const resultText =
      item.taskStatus === 'draft'
        ? ''
        : getRecordAbnormalCount(item) === 0
          ? '全部正常'
          : `存在异常 ${getRecordAbnormalCount(item)} 已整改 ${getRecordRectifiedCount(item)}`
    const mergedStatusText = `${taskStatusText} ${resultText} ${item.points.map(point => point.inspectionRemark).join(' ')}`
    const inspectionDate = item.startTime.slice(0, 10)
    const startPass = !appliedFilters.startTime || inspectionDate >= appliedFilters.startTime
    const endPass = !appliedFilters.endTime || inspectionDate <= appliedFilters.endTime

    return (
      (!appliedFilters.inspector || item.inspector.includes(appliedFilters.inspector)) &&
      (!appliedFilters.parkArea || item.parkArea === appliedFilters.parkArea) &&
      (!appliedFilters.inspectionType || item.inspectionType === appliedFilters.inspectionType) &&
      startPass &&
      endPass
    )
  })
)

const selectedIds = ref<number[]>([])
const isAllSelected = computed(() => filteredData.value.length > 0 && filteredData.value.every(item => selectedIds.value.includes(item.id)))

function toggleSelect(id: number) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(itemId => itemId !== id)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !filteredData.value.some(item => item.id === id))
  } else {
    const merged = new Set([...selectedIds.value, ...filteredData.value.map(item => item.id)])
    selectedIds.value = [...merged]
  }
}

const showDetailModal = ref(false)
const currentDetailRecord = ref<InspectionRecord | null>(null)
const showRouteModal = ref(false)
const currentRouteRecord = ref<InspectionRecord | null>(null)
const showDeleteModal = ref(false)
const deleteItemId = ref<number | null>(null)

function viewDetail(item: InspectionRecord) {
  currentDetailRecord.value = item
  showDetailModal.value = true
}

function openRoutePreview(item: InspectionRecord) {
  currentRouteRecord.value = item
  showRouteModal.value = true
}

function confirmDelete(item: InspectionRecord) {
  deleteItemId.value = item.id
  showDeleteModal.value = true
}

function handleDelete() {
  if (deleteItemId.value === null) return
  tableData.value = tableData.value.filter(item => item.id !== deleteItemId.value)
  selectedIds.value = selectedIds.value.filter(id => id !== deleteItemId.value)
  showDeleteModal.value = false
  deleteItemId.value = null
}

function buildRoutePoints(record: InspectionRecord | null) {
  if (!record) return []
  const start = routeStartPoints[record.parkArea] || routeStartPoints['物流园区']
  const areaPoints = pointCoordinates[record.parkArea] || pointCoordinates['物流园区']
  const matched = record.points
    .map(point => areaPoints.find(areaPoint => areaPoint.name === point.name))
    .filter((point): point is RoutePoint => Boolean(point))

  return [{ id: 0, name: '起点', x: start.x, y: start.y }, ...matched]
}

function generateOrthogonalRoutePath(points: RoutePoint[]) {
  if (points.length < 2) return points
  const path: { x: number; y: number }[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    path.push({ x: from.x, y: from.y })
    path.push({ x: from.x, y: to.y })
  }
  path.push({ x: points[points.length - 1].x, y: points[points.length - 1].y })
  return path
}

const detailRoutePoints = computed(() => buildRoutePoints(currentRouteRecord.value || currentDetailRecord.value))
const detailRoutePath = computed(() => generateOrthogonalRoutePath(detailRoutePoints.value))
const detailRouteArrows = computed(() =>
  detailRoutePath.value.slice(0, -1).map((point, index) => {
    const next = detailRoutePath.value[index + 1]
    const horizontal = next.x !== point.x
    return {
      x: (point.x + next.x) / 2,
      y: (point.y + next.y) / 2,
      rotation: horizontal ? (next.x > point.x ? 0 : 180) : (next.y > point.y ? 90 : -90),
    }
  })
)

function handleAnnotationModal(event: CustomEvent) {
  const { modalId } = event.detail
  if (modalId === 'detailModal' && filteredData.value[0]) {
    viewDetail(filteredData.value[0])
  } else if (modalId === 'routeModal' && filteredData.value[0]) {
    openRoutePreview(filteredData.value[0])
  } else if (modalId === 'deleteModal') {
    showDeleteModal.value = true
  }
}

onMounted(() => {
  window.addEventListener('annotation:trigger-modal', handleAnnotationModal as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('annotation:trigger-modal', handleAnnotationModal as EventListener)
})
</script>

<style scoped>
.inspection-record-page {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.filter-section {
  background: #FAFBFC;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
  font-weight: 500;
}

.filter-input,
.filter-select {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #fff;
  min-width: 160px;
}

.filter-date {
  min-width: 148px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-separator {
  font-size: 13px;
  color: #6B7280;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filter-toolbar {
  display: flex;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563EB;
  color: #fff;
  border-color: #2563EB;
}

.btn-default {
  background: #fff;
  color: #374151;
  border-color: #D1D5DB;
}

.btn-danger {
  background: #DC2626;
  color: #fff;
  border-color: #DC2626;
}

.btn-link {
  background: transparent;
  color: #2563EB;
  border: none;
  padding: 0;
  height: auto;
}

.table-section {
  margin-bottom: 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #E5E7EB;
  vertical-align: top;
}

.data-table th {
  background: #F9FAFB;
  font-weight: 700;
  color: #334155;
}

.data-table tbody tr:hover {
  background: #F8FAFC;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.th-checkbox,
.td-checkbox {
  width: 48px;
  text-align: center;
}

.th-index,
.td-index {
  width: 60px;
  text-align: center;
}

.th-time {
  width: 168px;
}

.th-point {
  width: 170px;
}

.th-result {
  width: 180px;
}

.th-action {
  width: 200px;
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2563EB;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.tag-normal {
  background: #FEF3C7;
  color: #B45309;
}

.tag-special {
  background: #FEE2E2;
  color: #DC2626;
}

.tag-emergency {
  background: #DBEAFE;
  color: #2563EB;
}

.point-text {
  white-space: pre-line;
  color: #334155;
}

.task-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.task-draft {
  background: #E5E7EB;
  color: #4B5563;
}

.task-submitted {
  background: #FEF3C7;
  color: #D97706;
}

.task-completed {
  background: #DCFCE7;
  color: #059669;
}

.td-result {
  color: #334155;
}

.result-empty {
  color: #94A3B8;
}

.result-normal {
  color: #059669;
  font-weight: 700;
}

.result-abnormal {
  color: #DC2626;
  font-weight: 700;
}

.result-divider {
  margin: 0 6px;
  color: #94A3B8;
}

.result-rectified {
  color: #D97706;
  font-weight: 700;
}

.action-link {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  margin-right: 12px;
}

.action-detail {
  color: #059669;
}

.action-delete {
  color: #DC2626;
}

.empty-state,
.empty-route {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 20px;
  color: #94A3B8;
}

.modal-overlay {
  position: fixed;
  top: var(--layout-topbar-height, 60px);
  left: var(--layout-sidebar-width, 240px);
  right: var(--layout-panel-width, 0px);
  bottom: 0;
  background: rgba(15, 23, 42, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--layout-modal-z, 60);
  padding: 24px;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 480px;
  max-width: 100%;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.modal-large {
  width: min(1000px, 92vw);
}

.modal-detail {
  width: min(1180px, 94vw);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #F8FAFC;
  border-radius: 8px;
  color: #64748B;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.detail-modal-body {
  max-height: 78vh;
  overflow-y: auto;
  background: #F8FAFC;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(420px, 1.1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.detail-card {
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
}

.detail-card-head,
.detail-section-head,
.point-detail-head,
.rectify-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.detail-subtitle {
  margin-top: 6px;
  color: #64748B;
  font-size: 13px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #F8FAFC;
}

.summary-label,
.meta-label {
  color: #94A3B8;
  font-size: 12px;
}

.summary-value {
  color: #334155;
  font-size: 14px;
}

.summary-meta,
.point-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin-top: 16px;
}

.meta-item,
.point-meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-value {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.route-map {
  position: relative;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  background: #E2E8F0;
}

.route-map-clickable {
  cursor: zoom-in;
}

.route-map-large {
  height: 520px;
}

.map-image,
.route-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.route-tip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #EFF6FF;
  color: #2563EB;
  font-size: 12px;
  font-weight: 700;
}

.zoom-tip {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.detail-section-head h4 {
  margin: 0;
  font-size: 15px;
  color: #0F172A;
}

.point-detail-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.point-detail-item {
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px;
  background: #fff;
}

.point-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.point-index,
.point-status-chip,
.rectify-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.point-name {
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
}

.chip-normal {
  background: #DCFCE7;
  color: #059669;
}

.chip-abnormal {
  background: #FEE2E2;
  color: #DC2626;
}

.chip-rectified {
  background: #FEF3C7;
  color: #D97706;
}

.text-normal {
  color: #059669;
  font-weight: 700;
}

.text-abnormal {
  color: #DC2626;
  font-weight: 700;
}

.text-rectified {
  color: #D97706;
  font-weight: 700;
}

.text-pending {
  color: #B45309;
  font-weight: 700;
}

.photo-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
}

.photo-label {
  width: 56px;
  margin-top: 4px;
}

.photo-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.photo-thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  background: #F8FAFC;
}

.photo-thumb-rectify {
  border-color: #FCD34D;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rectify-card {
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #FDE68A;
  background: #FFFBEB;
}

.rectify-title {
  font-size: 14px;
  font-weight: 700;
  color: #92400E;
}

.rectify-badge-pending {
  background: #FEE2E2;
  color: #DC2626;
}

.rectify-badge-done {
  background: #FEF3C7;
  color: #D97706;
}

.modal-tip {
  margin-top: 8px;
  color: #94A3B8;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 20px 20px;
}

@media (max-width: 1200px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
