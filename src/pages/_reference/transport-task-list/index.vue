<template>
  <div class="page-root">
    <div class="page-header">
      <div>
        <h1 class="page-title">运输任务列表</h1>
        <p class="page-subtitle">管理和跟踪所有危化品运输任务</p>
      </div>
      <button class="btn-brand" @click="handleCreate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新建任务
      </button>
    </div>

    <!-- 筛选区 -->
    <div data-req-id="1" class="subtle-card filter-area">
      <div class="filter-grid">
        <div class="filter-item">
          <label class="filter-label">任务状态</label>
          <select v-model="filters.status" class="select-field">
            <option value="">全部</option>
            <option value="pending">待派车</option>
            <option value="loading">装货中</option>
            <option value="transit">在途</option>
            <option value="arrived">已到达</option>
            <option value="completed">已完成</option>
            <option value="abnormal">异常</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">承运商</label>
          <select v-model="filters.company" class="select-field">
            <option value="">全部</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">化学品</label>
          <input v-model="filters.chemical" type="text" class="input-field" placeholder="输入品名搜索" />
        </div>
        <div class="filter-item">
          <label class="filter-label">车头车牌</label>
          <input v-model="filters.plate" type="text" class="input-field" placeholder="如 浙A12345" />
        </div>
        <div class="filter-item">
          <label class="filter-label">发车日期</label>
          <input v-model="filters.dateFrom" type="date" class="input-field" />
        </div>
        <div class="filter-item">
          <label class="filter-label">至</label>
          <input v-model="filters.dateTo" type="date" class="input-field" />
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn-brand" @click="handleSearch">查询</button>
        <button class="btn-ghost" @click="handleReset">重置</button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <span class="toolbar-count">共 <strong>{{ filteredData.length }}</strong> 条记录</span>
      <div class="toolbar-right">
        <button class="btn-ghost" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</button>
        <button class="btn-ghost" @click="handleExport">导出 CSV</button>
      </div>
    </div>

    <!-- 表格 -->
    <div data-req-id="2" class="subtle-card table-card">
      <div v-if="loading" class="state-block"><div class="spinner"></div><span>加载中...</span></div>
      <div v-else-if="error" class="state-block state-error"><span>数据加载失败</span><button class="btn-ghost" @click="fetchData">重试</button></div>
      <div v-else-if="filteredData.length === 0" class="state-block"><div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div><span>暂无数据</span><span class="state-hint">请调整筛选条件后重新查询</span></div>

      <table v-else class="modern-table">
        <thead>
          <tr>
            <th class="col-cb"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th class="col-id sort-col" @click="toggleSort('id')">任务编号 <span class="sort-icon">{{ sortIcon('id') }}</span></th>
            <th>化学品</th><th>UN编号</th><th>承运商</th><th>车头车牌</th><th>挂车车牌</th><th>驾驶员</th><th>押运员</th><th>起运地 → 目的地</th>
            <th class="sort-col" @click="toggleSort('status')">状态 <span class="sort-icon">{{ sortIcon('status') }}</span></th>
            <th>发车时间</th><th class="col-acts">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pagedData" :key="row.id" :class="{ 'row-sel': selectedIds.includes(row.id) }">
            <td><input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleSelect(row.id)" /></td>
            <td class="mono fw-bold brand-text">#{{ row.id }}</td>
            <td>
              <span class="chem-name">{{ row.chemicalName }}</span>
              <span class="badge" :class="chemCatClass(row.chemicalCategory)">{{ row.chemicalCategoryLabel }}</span>
            </td>
            <td class="mono text-sm">{{ row.unNumber }}</td>
            <td>{{ row.company }}</td>
            <td class="mono text-sm">{{ row.tractorPlate }}</td>
            <td class="mono text-sm">{{ row.trailerPlate }}</td>
            <td class="fw-600">{{ row.driver }}</td>
            <td>{{ row.escort }}</td>
            <td class="text-sm route-cell">{{ row.origin }}<br><span class="route-arrow">→</span> {{ row.dest }}</td>
            <td><span class="badge" :class="statusBadge(row.status)">{{ statusMap[row.status] }}</span></td>
            <td class="text-sm">{{ row.departTime }}</td>
            <td class="col-acts">
              <button class="act-link" @click="handleView(row)">查看</button>
              <button class="act-link" @click="handleEdit(row)">编辑</button>
              <button class="act-link act-del" @click="handleDelete(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pager" v-if="filteredData.length > 0">
      <span class="pager-info">{{ totalPages }} 页 / {{ filteredData.length }} 条</span>
      <div class="pager-btns">
        <button :disabled="page === 1" @click="page--">上一页</button>
        <button v-for="p in visiblePages" :key="p" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
        <button :disabled="page === totalPages" @click="page++">下一页</button>
      </div>
      <select v-model="pageSize" class="select-field" style="width: auto;">
        <option :value="10">10条/页</option><option :value="20">20条/页</option><option :value="50">50条/页</option>
      </select>
    </div>

    <!-- 查看弹窗 -->
    <div v-if="viewModal.visible" class="modal-overlay" @click.self="viewModal.visible = false">
      <div class="modal-box" data-req-id="3">
        <div class="modal-head"><h3>任务详情 — #{{ viewModal.data?.id }}</h3><button class="modal-x" @click="viewModal.visible = false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" v-if="viewModal.data">
          <dl class="detail-grid">
            <div><dt>化学品</dt><dd>{{ viewModal.data.chemicalName }}（{{ viewModal.data.unNumber }}）</dd></div>
            <div><dt>危险类别</dt><dd><span class="badge" :class="chemCatClass(viewModal.data.chemicalCategory)">{{ viewModal.data.chemicalCategoryLabel }}</span></dd></div>
            <div><dt>承运商</dt><dd>{{ viewModal.data.company }}</dd></div>
            <div><dt>车头车牌</dt><dd class="mono">{{ viewModal.data.tractorPlate }}</dd></div>
            <div><dt>挂车车牌</dt><dd class="mono">{{ viewModal.data.trailerPlate }}</dd></div>
            <div><dt>驾驶员</dt><dd>{{ viewModal.data.driver }}</dd></div>
            <div><dt>押运员</dt><dd>{{ viewModal.data.escort }}</dd></div>
            <div><dt>起运地 → 目的地</dt><dd>{{ viewModal.data.origin }} → {{ viewModal.data.dest }}</dd></div>
            <div><dt>发车时间</dt><dd>{{ viewModal.data.departTime }}</dd></div>
            <div><dt>状态</dt><dd><span class="badge" :class="statusBadge(viewModal.data.status)">{{ statusMap[viewModal.data.status] }}</span></dd></div>
          </dl>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteModal.visible" class="modal-overlay" @click.self="deleteModal.visible = false">
      <div class="modal-box modal-sm" data-req-id="4">
        <div class="modal-head"><h3>确认删除</h3><button class="modal-x" @click="deleteModal.visible = false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body"><p>确定要删除任务 <strong>#{{ deleteModal.taskId }}</strong> 吗？此操作不可撤销。</p></div>
        <div class="modal-foot"><button class="btn-ghost" @click="deleteModal.visible = false">取消</button><button class="btn-danger" @click="confirmDelete">确认删除</button></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface TaskRow {
  id: number; chemicalName: string; unNumber: string; chemicalCategory: number; chemicalCategoryLabel: string
  company: string; tractorPlate: string; trailerPlate: string; driver: string; escort: string
  origin: string; dest: string; status: string; departTime: string
}

const companies = ['荣通危化物流有限公司', '鑫海化工运输有限公司', '恒安危货运输有限公司', '瑞达危险品供应链有限公司', '安泰化工物流有限公司']

const mockData: TaskRow[] = [
  { id: 1001, chemicalName: '甲醇', unNumber: 'UN 1230', chemicalCategory: 3, chemicalCategoryLabel: '3类 易燃', company: '荣通危化物流有限公司', tractorPlate: '浙A12345', trailerPlate: '浙A1234挂', driver: '王建国', escort: '李卫东', origin: '杭州萧山化工园', dest: '上海金山化工区', status: 'transit', departTime: '2026-05-20 08:30' },
  { id: 1002, chemicalName: '苯乙烯', unNumber: 'UN 2055', chemicalCategory: 3, chemicalCategoryLabel: '3类 易燃', company: '鑫海化工运输有限公司', tractorPlate: '浙B67890', trailerPlate: '浙B5678挂', driver: '张海峰', escort: '陈志强', origin: '宁波镇海化工区', dest: '南京江北新材料园', status: 'loading', departTime: '2026-05-20 09:00' },
  { id: 1003, chemicalName: '液氯', unNumber: 'UN 1017', chemicalCategory: 23, chemicalCategoryLabel: '2.3类 毒性', company: '恒安危货运输有限公司', tractorPlate: '苏C23456', trailerPlate: '苏C9012挂', driver: '刘永昌', escort: '赵明辉', origin: '南京化工园', dest: '合肥经开区化工园', status: 'pending', departTime: '2026-05-20 14:00' },
  { id: 1004, chemicalName: '硝酸', unNumber: 'UN 2031', chemicalCategory: 8, chemicalCategoryLabel: '8类 腐蚀', company: '瑞达危险品供应链有限公司', tractorPlate: '鲁D78901', trailerPlate: '鲁D3456挂', driver: '周立新', escort: '吴国栋', origin: '淄博齐鲁化工区', dest: '天津滨海化工区', status: 'completed', departTime: '2026-05-19 06:30' },
  { id: 1005, chemicalName: '氢氟酸', unNumber: 'UN 1790', chemicalCategory: 8, chemicalCategoryLabel: '8类 腐蚀', company: '安泰化工物流有限公司', tractorPlate: '皖E34567', trailerPlate: '皖E7890挂', driver: '孙建华', escort: '钱伟民', origin: '合肥化工园', dest: '武汉东湖高新区', status: 'transit', departTime: '2026-05-20 11:00' },
  { id: 1006, chemicalName: '丙酮', unNumber: 'UN 1090', chemicalCategory: 3, chemicalCategoryLabel: '3类 易燃', company: '荣通危化物流有限公司', tractorPlate: '沪F89012', trailerPlate: '沪F1234挂', driver: '王建国', escort: '张海峰', origin: '上海金山化工区', dest: '杭州萧山化工园', status: 'arrived', departTime: '2026-05-20 07:15' },
  { id: 1007, chemicalName: '硫酸', unNumber: 'UN 1830', chemicalCategory: 8, chemicalCategoryLabel: '8类 腐蚀', company: '鑫海化工运输有限公司', tractorPlate: '赣G56789', trailerPlate: '赣G9012挂', driver: '陈志强', escort: '赵明辉', origin: '南昌化工园', dest: '福州江阴化工区', status: 'abnormal', departTime: '2026-05-20 10:45' },
  { id: 1008, chemicalName: '甲苯', unNumber: 'UN 1294', chemicalCategory: 3, chemicalCategoryLabel: '3类 易燃', company: '恒安危货运输有限公司', tractorPlate: '闽H12340', trailerPlate: '闽H5678挂', driver: '李卫东', escort: '刘永昌', origin: '厦门海沧化工区', dest: '广州南沙化工区', status: 'transit', departTime: '2026-05-20 13:20' },
]

const statusMap: Record<string, string> = { pending: '待派车', loading: '装货中', transit: '在途', arrived: '已到达', completed: '已完成', abnormal: '异常' }

const filters = reactive({ status: '', company: '', chemical: '', plate: '', dateFrom: '', dateTo: '' })
const loading = ref(false)
const error = ref(false)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const selectedIds = ref<number[]>([])
const viewModal = reactive({ visible: false, data: null as TaskRow | null })
const deleteModal = reactive({ visible: false, taskId: 0 })

const filteredData = computed(() => {
  let data = [...mockData]
  if (filters.status) data = data.filter(r => r.status === filters.status)
  if (filters.company) data = data.filter(r => r.company === filters.company)
  if (filters.chemical) data = data.filter(r => r.chemicalName.includes(filters.chemical))
  if (filters.plate) data = data.filter(r => r.tractorPlate.includes(filters.plate))
  if (filters.dateFrom) data = data.filter(r => r.departTime >= filters.dateFrom)
  if (filters.dateTo) data = data.filter(r => r.departTime <= filters.dateTo)
  if (sortField.value) data.sort((a: any, b: any) => {
    const va = String(a[sortField.value]), vb = String(b[sortField.value])
    return sortDir.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
  })
  return data
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value) || 1)
const pagedData = computed(() => filteredData.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const allSelected = computed(() => pagedData.value.length > 0 && pagedData.value.every(r => selectedIds.value.includes(r.id)))
const visiblePages = computed(() => {
  const pages: number[] = []
  for (let i = Math.max(1, page.value - 2); i <= Math.min(totalPages.value, page.value + 2); i++) pages.push(i)
  return pages
})

function fetchData() { loading.value = true; error.value = false; setTimeout(() => { loading.value = false }, 600) }
function handleSearch() { page.value = 1; fetchData() }
function handleReset() { Object.assign(filters, { status: '', company: '', chemical: '', plate: '', dateFrom: '', dateTo: '' }); page.value = 1 }
function toggleSort(field: string) { sortField.value === field ? sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc' : (sortField.value = field, sortDir.value = 'asc') }
function sortIcon(f: string) { return sortField.value !== f ? '↕' : sortDir.value === 'asc' ? '↑' : '↓' }
function toggleAll() { allSelected.value ? selectedIds.value = selectedIds.value.filter(id => !pagedData.value.find(r => r.id === id)) : pagedData.value.forEach(r => { if (!selectedIds.value.includes(r.id)) selectedIds.value.push(r.id) }) }
function toggleSelect(id: number) { const i = selectedIds.value.indexOf(id); i >= 0 ? selectedIds.value.splice(i, 1) : selectedIds.value.push(id) }
function handleView(row: TaskRow) { viewModal.data = row; viewModal.visible = true }
function handleEdit(row: TaskRow) { alert(`跳转至编辑页 — 任务 #${row.id}`) }
function handleCreate() { alert('跳转至新建任务页') }
function handleDelete(row: TaskRow) { deleteModal.taskId = row.id; deleteModal.visible = true }
function confirmDelete() { const i = mockData.findIndex(r => r.id === deleteModal.taskId); if (i >= 0) mockData.splice(i, 1); deleteModal.visible = false }
function handleBatchDelete() { if (!selectedIds.value.length) return; if (confirm(`确认删除选中的 ${selectedIds.value.length} 条记录？`)) { for (let i = mockData.length - 1; i >= 0; i--) { if (selectedIds.value.includes(mockData[i].id)) mockData.splice(i, 1) } selectedIds.value = [] } }
function handleExport() { alert('导出当前筛选条件下的全部数据（CSV格式）') }
function statusBadge(s: string) { const m: Record<string, string> = { pending: 'badge-neutral', loading: 'badge-info', transit: 'badge-warn', arrived: 'badge-info', completed: 'badge-success', abnormal: 'badge-danger' }; return m[s] || 'badge-neutral' }
function chemCatClass(c: number) { const m: Record<number, string> = { 3: 'badge-danger', 23: 'badge-info', 8: 'badge-neutral' }; return m[c] || 'badge-neutral' }

// 监听标注面板弹窗触发
import { onMounted, onUnmounted } from 'vue'
onMounted(() => { window.addEventListener('annotation:trigger-modal', onAnnotationModal as EventListener) })
onUnmounted(() => { window.removeEventListener('annotation:trigger-modal', onAnnotationModal as EventListener) })
function onAnnotationModal(e: CustomEvent) {
  const mid = e.detail?.modalId
  if (mid === 'viewModal') { const row = mockData[0]; if (row) { viewModal.data = row; viewModal.visible = true } }
  if (mid === 'deleteModal') { const row = mockData[0]; if (row) { deleteModal.taskId = row.id; deleteModal.visible = true } }
}

fetchData()
</script>

<style scoped>
.page-root { padding: 32px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; }
.page-subtitle { font-size: 13px; color: #64748B; margin-top: 4px; }

/* 筛选 */
.filter-area { padding: 20px 24px; margin-bottom: 16px; }
.filter-grid { display: flex; flex-wrap: wrap; gap: 16px; }
.filter-item { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
.filter-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em; }
.filter-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #F1F5F9; }

/* 工具栏 */
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 4px; }
.toolbar-count { font-size: 13px; color: #64748B; }
.toolbar-count strong { color: #0F172A; font-weight: 700; }
.toolbar-right { display: flex; gap: 8px; }

/* 表格 */
.table-card { padding: 0; overflow: hidden; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.modern-table th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
.modern-table td { padding: 12px 14px; border-bottom: 1px solid #F1F5F9; color: #334155; }
.modern-table tbody tr:hover td { background: #FAFBFC; }
.modern-table tbody tr.row-sel td { background: rgba(37,99,235,0.04); }
.col-cb { width: 40px; }
.col-acts { width: 140px; }
.sort-col { cursor: pointer; user-select: none; }
.sort-icon { font-size: 10px; color: #94A3B8; margin-left: 2px; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.fw-bold { font-weight: 700; }
.fw-600 { font-weight: 600; }
.text-sm { font-size: 12px; }
.brand-text { color: #2563EB; }
.chem-name { margin-right: 6px; font-weight: 500; }
.route-cell { line-height: 1.5; }
.route-arrow { color: #94A3B8; margin: 0 2px; }

/* 操作链接 */
.act-link { padding: 3px 0; background: none; border: none; font-size: 12px; font-weight: 600; color: #1E40AF; cursor: pointer; margin-right: 8px; transition: color 0.15s; }
.act-link:hover { color: #2563EB; }
.act-del { color: #EF4444; }
.act-del:hover { color: #DC2626; }

/* 分页 */
.pager { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 0; }
.pager-info { font-size: 12px; color: #94A3B8; }
.pager-btns { display: flex; gap: 4px; }
.pager-btns button { min-width: 32px; height: 32px; padding: 0 10px; border: 1px solid #E2E8F0; background: #fff; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 500; color: #475569; transition: all 0.15s; white-space: nowrap; }
.pager-btns button.active { background: #2563EB; color: #fff; border-color: #2563EB; font-weight: 700; }
.pager-btns button:disabled { opacity: 0.3; cursor: not-allowed; }

/* 状态 */
.state-block { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px 0; color: #94A3B8; font-size: 14px; }
.state-error { color: #EF4444; }
.state-hint { font-size: 12px; color: #CBD5E1; }
.spinner { width: 24px; height: 24px; border: 3px solid #E2E8F0; border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-box { background: #fff; border-radius: 16px; width: 640px; max-height: 80vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.12); }
.modal-sm { width: 400px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #F1F5F9; }
.modal-head h3 { font-size: 16px; font-weight: 700; }
.modal-x { background: none; border: none; cursor: pointer; color: #94A3B8; padding: 4px; border-radius: 6px; }
.modal-x:hover { background: #F1F5F9; color: #0F172A; }
.modal-body { padding: 24px; }
.modal-body p { font-size: 14px; color: #334155; line-height: 1.7; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid #F1F5F9; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
.detail-grid dt { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 3px; }
.detail-grid dd { font-size: 14px; font-weight: 500; color: #0F172A; }
</style>
