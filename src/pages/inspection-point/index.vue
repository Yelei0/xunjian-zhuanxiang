<template>
  <div class="inspection-point-page" data-req-page="inspection-point">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h2 class="page-title">巡检点位</h2>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section" data-req-id="1">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">点位名称</label>
          <input
            v-model="filters.pointName"
            type="text"
            class="filter-input"
            placeholder="请输入"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">应用场地</label>
          <select v-model="filters.parkArea" class="filter-select">
            <option value="">请选择</option>
            <option v-for="area in parkAreas" :key="area" :value="area">{{ area }}</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" data-req-id="2" @click="handleSearch">搜索</button>
          <button class="btn btn-default" data-req-id="2" @click="handleReset">重置</button>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar" data-req-id="3">
      <button class="btn btn-primary" data-req-id="3" @click="openAddModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <table class="data-table">
        <thead>
          <tr>
            <th class="th-checkbox">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th class="th-index">序号</th>
            <th class="th-name">点位名称</th>
            <th class="th-area">应用场地</th>
            <th class="th-code">点位码</th>
            <th class="th-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in tableData" :key="item.id">
            <td class="td-checkbox">
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                @change="toggleSelect(item.id)"
              />
            </td>
            <td class="td-index">{{ index + 1 }}</td>
            <td class="td-name">{{ item.pointName }}</td>
            <td class="td-area">{{ item.parkArea }}</td>
            <td class="td-code">
              <button class="code-link" data-req-id="6" @click="viewCode(item)">点击查看</button>
            </td>
            <td class="td-action">
              <button class="action-link action-edit" data-req-id="4" @click="openEditModal(item)">
                编辑
              </button>
              <button class="action-link action-delete" data-req-id="7" @click="confirmDelete(item)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="tableData.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>暂无数据</p>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="showFormModal = false">
      <div class="modal-content modal-large" :data-req-id="activeFormReqId">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑巡检点位' : '新增巡检点位' }}</h3>
          <button class="btn-close" @click="showFormModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <h4 class="form-section-title">编辑</h4>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">点位名称</label>
                <input
                  v-model="formData.pointName"
                  type="text"
                  class="form-input"
                  placeholder="请输入"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">应用场地</label>
                <select v-model="formData.parkArea" class="form-select">
                  <option value="">请选择</option>
                  <option v-for="area in parkAreas" :key="area" :value="area">{{ area }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">地图选点</label>
              <div class="map-picker" ref="mapPickerRef" @click="handleMapClick" data-req-id="5">
                <!-- 物流园区地图 -->
                <div class="map-container" :class="{ 'active': formData.parkArea === '物流园区' || !formData.parkArea }">
                  <img
                    v-if="formData.parkArea === '物流园区' || !formData.parkArea"
                    :src="parkImage"
                    alt="物流园区地图"
                    class="map-image"
                    @load="onMapLoad"
                  />
                  <img
                    v-else
                    :src="stationImage"
                    alt="接收站地图"
                    class="map-image"
                    @load="onMapLoad"
                  />
                </div>
                <!-- 已选点位标记 -->
                <div
                  v-if="formData.coordinate"
                  class="map-marker"
                  :style="{ left: formData.coordinate.x + 'px', top: formData.coordinate.y + 'px' }"
                >
                  <span class="marker-dot"></span>
                  <span class="marker-label">{{ formData.pointName }}</span>
                </div>
                <!-- 其他点位标记 -->
                <div
                  v-for="point in otherPoints"
                  :key="point.id"
                  class="map-marker other-marker"
                  :style="{ left: point.coordinate.x + 'px', top: point.coordinate.y + 'px' }"
                >
                  <span class="marker-dot"></span>
                </div>
              </div>
              <p v-if="formData.coordinate" class="map-hint">
                坐标：({{ formData.coordinate.x }}, {{ formData.coordinate.y }})
              </p>
              <p v-else class="map-hint">点击地图选择点位位置</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showFormModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSave">保存</button>
        </div>
      </div>
    </div>

    <!-- 点位码弹窗 -->
    <div v-if="showCodeModal" class="modal-overlay" @click.self="showCodeModal = false">
      <div class="modal-content modal-small" data-req-id="6">
        <div class="modal-header">
          <h3>点位码</h3>
          <button class="btn-close" @click="showCodeModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="code-section">
            <h4 class="code-section-title">点位码</h4>
            <div class="qr-code">
              <div class="qr-placeholder">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <rect width="120" height="120" fill="#fff"/>
                  <rect x="10" y="10" width="30" height="30" fill="#000"/>
                  <rect x="15" y="15" width="20" height="20" fill="#fff"/>
                  <rect x="20" y="20" width="10" height="10" fill="#000"/>
                  <rect x="80" y="10" width="30" height="30" fill="#000"/>
                  <rect x="85" y="15" width="20" height="20" fill="#fff"/>
                  <rect x="90" y="20" width="10" height="10" fill="#000"/>
                  <rect x="10" y="80" width="30" height="30" fill="#000"/>
                  <rect x="15" y="85" width="20" height="20" fill="#fff"/>
                  <rect x="20" y="90" width="10" height="10" fill="#000"/>
                  <rect x="50" y="50" width="20" height="20" fill="#000"/>
                  <rect x="55" y="55" width="10" height="10" fill="#fff"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="downloadCode">下载</button>
          <button class="btn btn-default" @click="showCodeModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content modal-small" data-req-id="7">
        <div class="modal-header">
          <h3>确认删除</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除这个巡检点位吗？</p>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}images/${file}`
const parkImage = assetUrl('park.jpg')
const stationImage = assetUrl('jieshouzhan.jpg')

// 筛选条件
const filters = reactive({
  pointName: '',
  parkArea: ''
})

// 下拉选项数据
const parkAreas = ref(['物流园区', '接收站'])

// 坐标类型
interface Coordinate {
  x: number
  y: number
}

// 表格数据
interface InspectionPoint {
  id: number
  pointName: string
  parkArea: string
  coordinate: Coordinate | null
  codeUrl?: string
}

const tableData = ref<InspectionPoint[]>([
  { id: 1, pointName: '东门岗', parkArea: '物流园区', coordinate: { x: 150, y: 80 } },
  { id: 2, pointName: '物流园编组区', parkArea: '物流园区', coordinate: { x: 300, y: 150 } },
  { id: 3, pointName: '重车区', parkArea: '接收站', coordinate: { x: 200, y: 120 } }
])

// 多选
const selectedIds = ref<number[]>([])
const isAllSelected = computed(() =>
  tableData.value.length > 0 && selectedIds.value.length === tableData.value.length
)

function toggleSelect(id: number) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = tableData.value.map(item => item.id)
  }
}

// 搜索/重置
function handleSearch() {
  console.log('搜索条件:', filters)
}

function handleReset() {
  filters.pointName = ''
  filters.parkArea = ''
}

// 监听需求标注弹窗触发
function handleAnnotationModal(e: CustomEvent) {
  const { modalId, reqId } = e.detail
  if (modalId === 'formModal') {
    if (reqId === 4 && tableData.value.length > 0) {
      openEditModal(tableData.value[0])
    } else if (reqId === 5) {
      openAddModal()
    } else {
      openAddModal()
    }
  } else if (modalId === 'codeModal') {
    showCodeModal.value = true
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

// 表单弹窗
const showFormModal = ref(false)
const isEdit = ref(false)
const activeFormReqId = ref(3)
let editItemId: number | null = null

const formData = reactive({
  pointName: '',
  parkArea: '',
  coordinate: null as Coordinate | null
})

// 其他点位（排除当前编辑的）
const otherPoints = computed(() => {
  return tableData.value.filter(p => p.id !== editItemId && p.coordinate) as (InspectionPoint & { coordinate: Coordinate })[]
})

function openAddModal() {
  isEdit.value = false
  activeFormReqId.value = 3
  editItemId = null
  formData.pointName = ''
  formData.parkArea = ''
  formData.coordinate = null
  showFormModal.value = true
}

function openEditModal(item: InspectionPoint) {
  isEdit.value = true
  activeFormReqId.value = 4
  editItemId = item.id
  formData.pointName = item.pointName
  formData.parkArea = item.parkArea
  formData.coordinate = item.coordinate ? { ...item.coordinate } : null
  showFormModal.value = true
}

// 地图点击选点
const mapPickerRef = ref<HTMLDivElement | null>(null)

function onMapLoad() {
  // 地图图片加载完成
}

function handleMapClick(e: MouseEvent) {
  if (!mapPickerRef.value) return

  const rect = mapPickerRef.value.getBoundingClientRect()
  const x = Math.round(e.clientX - rect.left)
  const y = Math.round(e.clientY - rect.top)

  formData.coordinate = { x, y }
}

function handleSave() {
  if (!formData.pointName || !formData.parkArea) {
    alert('请填写完整信息')
    return
  }

  if (isEdit.value && editItemId !== null) {
    // 编辑
    const index = tableData.value.findIndex(item => item.id === editItemId)
    if (index !== -1) {
      tableData.value[index] = {
        ...tableData.value[index],
        pointName: formData.pointName,
        parkArea: formData.parkArea,
        coordinate: formData.coordinate ? { ...formData.coordinate } : null
      }
    }
  } else {
    // 新增
    const newId = Math.max(...tableData.value.map(item => item.id), 0) + 1
    tableData.value.push({
      id: newId,
      pointName: formData.pointName,
      parkArea: formData.parkArea,
      coordinate: formData.coordinate ? { ...formData.coordinate } : null,
      codeUrl: ''
    })
  }

  showFormModal.value = false
}

// 点位码弹窗
const showCodeModal = ref(false)
let currentCodeItem: InspectionPoint | null = null

function viewCode(item: InspectionPoint) {
  currentCodeItem = item
  showCodeModal.value = true
}

function downloadCode() {
  alert('下载功能开发中')
}

// 删除
const showDeleteModal = ref(false)
let deleteItemId: number | null = null

function confirmDelete(item: InspectionPoint) {
  deleteItemId = item.id
  showDeleteModal.value = true
}

function handleDelete() {
  if (deleteItemId !== null) {
    tableData.value = tableData.value.filter(item => item.id !== deleteItemId)
    showDeleteModal.value = false
    deleteItemId = null
  }
}
</script>

<style scoped>
.inspection-point-page {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

/* 筛选区 */
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
  align-items: center;
  flex-wrap: wrap;
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
  transition: border-color 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* 工具栏 */
.toolbar {
  margin-bottom: 16px;
}

/* 按钮样式 */
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
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563EB;
  color: #fff;
  border-color: #2563EB;
}

.btn-primary:hover {
  background: #1D4ED8;
}

.btn-default {
  background: #fff;
  color: #374151;
  border-color: #D1D5DB;
}

.btn-default:hover {
  background: #F9FAFB;
}

.btn-danger {
  background: #DC2626;
  color: #fff;
  border-color: #DC2626;
}

.btn-danger:hover {
  background: #B91C1C;
}

/* 数据表格 */
.table-section {
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
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #E5E7EB;
}

.data-table th {
  background: #F9FAFB;
  font-weight: 600;
  color: #374151;
}

.data-table tbody tr:hover {
  background: #F9FAFB;
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

.th-code {
  width: 120px;
}

.th-action {
  width: 150px;
}

/* 复选框 */
input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2563EB;
}

/* 点位码链接 */
.code-link {
  background: none;
  border: none;
  color: #2563EB;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.code-link:hover {
  text-decoration: underline;
  color: #1D4ED8;
}

/* 操作按钮 */
.action-link {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  margin-right: 12px;
  text-decoration: none;
}

.action-edit {
  color: #2563EB;
}

.action-edit:hover {
  color: #1D4ED8;
  text-decoration: underline;
}

.action-delete {
  color: #DC2626;
}

.action-delete:hover {
  color: #B91C1C;
  text-decoration: underline;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #9CA3AF;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: var(--layout-topbar-height, 60px);
  left: var(--layout-sidebar-width, 240px);
  right: var(--layout-panel-width, 0px);
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--layout-modal-z, 60);
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-large {
  width: 700px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-small {
  width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9CA3AF;
  border-radius: 4px;
}

.btn-close:hover {
  background: #E5E7EB;
  color: #374151;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.modal-tip {
  margin-top: 8px !important;
  font-size: 13px !important;
  color: #9CA3AF !important;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #E5E7EB;
  flex-shrink: 0;
}

/* 表单 */
.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E5E7EB;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-label.required::before {
  content: '*';
  color: #DC2626;
  margin-right: 4px;
}

.form-input,
.form-select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #fff;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* 地图选点 */
.map-picker {
  position: relative;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
  background: #F3F4F6;
}

.map-container {
  width: 100%;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #E5E7EB;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.map-svg {
  width: 100%;
  height: 100%;
}

.map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #2563EB;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.other-marker .marker-dot {
  background: #9CA3AF;
  width: 8px;
  height: 8px;
}

.marker-label {
  margin-top: 4px;
  padding: 2px 6px;
  background: #2563EB;
  color: #fff;
  font-size: 11px;
  border-radius: 4px;
  white-space: nowrap;
}

.map-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #6B7280;
}

/* 点位码 */
.code-section {
  text-align: center;
}

.code-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 16px;
}

.qr-code {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.qr-placeholder {
  padding: 16px;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
}
</style>
