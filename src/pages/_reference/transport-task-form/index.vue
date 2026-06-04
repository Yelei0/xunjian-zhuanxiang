<template>
  <div class="page-root">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-ghost" @click="handleBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          返回列表
        </button>
        <h1 class="page-title">{{ isEdit ? '编辑运输任务' : '新建运输任务' }}</h1>
      </div>
    </div>

    <form class="form-layout" @submit.prevent="handleSubmit">
      <!-- 列1 -->
      <div class="form-col">
        <!-- 基本信息 -->
        <div data-req-id="1" class="subtle-card form-card">
          <h2 class="card-hd">基本信息</h2>
          <div class="field-group">
            <div class="field" :class="{ 'field-err': errors.taskName }">
              <label class="field-label">任务名称 <span class="req">*</span></label>
              <input v-model="form.taskName" class="input-field" placeholder="输入任务名称" maxlength="50" @blur="validate('taskName')" />
              <span v-if="errors.taskName" class="field-err-msg">{{ errors.taskName }}</span>
            </div>
            <div class="field">
              <label class="field-label">运输类型 <span class="req">*</span></label>
              <select v-model="form.transportType" class="select-field"><option value="">请选择</option><option value="long-haul">长途干线</option><option value="short-haul">短途配送</option><option value="transship">中转转运</option></select>
            </div>
            <div class="field">
              <label class="field-label">计划发车时间 <span class="req">*</span></label>
              <input v-model="form.plannedTime" type="datetime-local" class="input-field" />
            </div>
            <div class="field">
              <label class="field-label">承运商 <span class="req">*</span></label>
              <select v-model="form.company" class="select-field"><option value="">请选择</option><option v-for="c in companies" :key="c" :value="c">{{ c }}</option></select>
            </div>
          </div>
        </div>

        <!-- 化学品信息 -->
        <div data-req-id="2" class="subtle-card form-card">
          <h2 class="card-hd">化学品信息</h2>
          <div class="field-group">
            <div class="field">
              <label class="field-label">化学品名称 <span class="req">*</span></label>
              <select v-model="form.chemicalName" class="select-field" @change="onChemicalChange"><option value="">请选择</option><option v-for="chem in chemicals" :key="chem.name" :value="chem.name">{{ chem.name }}</option></select>
            </div>
            <div class="field">
              <label class="field-label">UN编号</label>
              <input :value="form.unNumber" class="input-field" readonly style="background:#F1F5F9;color:#94A3B8;" />
            </div>
            <div class="field">
              <label class="field-label">危险类别</label>
              <input :value="form.chemicalCategory" class="input-field" readonly style="background:#F1F5F9;color:#94A3B8;" />
            </div>
            <div class="field">
              <label class="field-label">数量（吨） <span class="req">*</span></label>
              <input v-model="form.quantity" type="number" class="input-field" placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
        </div>
      </div>

      <!-- 列2 -->
      <div class="form-col">
        <!-- 车辆与人员 -->
        <div data-req-id="3" class="subtle-card form-card">
          <h2 class="card-hd">车辆与人员</h2>
          <div class="field-group">
            <div class="field">
              <label class="field-label">车头车牌 <span class="req">*</span></label>
              <input v-model="form.tractorPlate" class="input-field" placeholder="如 浙A12345" maxlength="8" />
            </div>
            <div class="field">
              <label class="field-label">挂车车牌</label>
              <input v-model="form.trailerPlate" class="input-field" placeholder="如 浙A1234挂" maxlength="8" />
            </div>
            <div class="field">
              <label class="field-label">驾驶员 <span class="req">*</span></label>
              <select v-model="form.driver" class="select-field"><option value="">请选择</option><option v-for="d in drivers" :key="d" :value="d">{{ d }}</option></select>
            </div>
            <div class="field">
              <label class="field-label">押运员 <span class="req">*</span></label>
              <select v-model="form.escort" class="select-field"><option value="">请选择</option><option v-for="e in escorts" :key="e" :value="e">{{ e }}</option></select>
            </div>
            <div class="field">
              <label class="field-label">车辆类型</label>
              <select v-model="form.vehicleType" class="select-field"><option value="">请选择</option><option value="tanker">罐车（槽罐车）</option><option value="box">厢式危货车</option><option value="container">集装箱危货车</option><option value="flatbed">平板危货车</option></select>
            </div>
          </div>
        </div>

        <!-- 路线信息 -->
        <div data-req-id="4" class="subtle-card form-card">
          <h2 class="card-hd">路线信息</h2>
          <div class="field-group">
            <div class="field">
              <label class="field-label">起运地 <span class="req">*</span></label>
              <input v-model="form.origin" class="input-field" placeholder="省市区 + 化工园区名称" />
            </div>
            <div class="field">
              <label class="field-label">目的地 <span class="req">*</span></label>
              <input v-model="form.dest" class="input-field" placeholder="省市区 + 化工园区名称" />
            </div>
            <div class="field field-full">
              <label class="field-label">备注</label>
              <textarea v-model="form.remark" class="input-field" rows="3" placeholder="特殊要求、注意事项等" maxlength="200" style="resize:vertical;"></textarea>
              <span class="field-count">{{ form.remark.length }}/200</span>
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- 底部操作 -->
    <div class="form-footer">
      <button type="button" class="btn-ghost" @click="handleSaveDraft">保存草稿</button>
      <button type="button" class="btn-ghost" @click="handleCancel">取消</button>
      <button class="btn-brand" @click="handleSubmit">提交任务</button>
    </div>

    <!-- 提交结果弹窗 -->
    <div v-if="submitModal.visible" class="modal-overlay" @click.self="submitModal.visible = false">
      <div class="modal-box modal-sm">
        <div class="modal-head">
          <h3>{{ submitModal.success ? '提交成功' : '提交失败' }}</h3>
          <button class="modal-x" @click="submitModal.visible = false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
          <div class="success-icon" v-if="submitModal.success">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="success-icon" v-else>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <p style="text-align:center;" v-if="submitModal.success">运输任务 <strong>#{{ submitModal.taskId }}</strong> 已成功创建</p>
          <p style="text-align:center;" v-else><strong>{{ submitModal.errorMsg }}</strong></p>
          <p class="modal-hint" v-if="submitModal.success">状态：<span class="badge badge-neutral">待派车</span>，调度员将收到通知进行派车操作。</p>
        </div>
        <div class="modal-foot">
          <button v-if="!submitModal.success" class="btn-ghost" @click="submitModal.visible = false">返回修改</button>
          <button class="btn-brand" @click="handleBack" style="flex:1;">返回列表</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
const isEdit = ref(false)
const companies = ['荣通危化物流有限公司', '鑫海化工运输有限公司', '恒安危货运输有限公司', '瑞达危险品供应链有限公司', '安泰化工物流有限公司']
const chemicals = [
  { name: '甲醇', unNumber: 'UN 1230', category: '3类 易燃液体', packaging: 'II' },
  { name: '苯乙烯', unNumber: 'UN 2055', category: '3类 易燃液体', packaging: 'III' },
  { name: '液氯', unNumber: 'UN 1017', category: '2.3类 毒性气体', packaging: '-' },
  { name: '硝酸', unNumber: 'UN 2031', category: '8类 腐蚀性', packaging: 'I' },
  { name: '氢氟酸', unNumber: 'UN 1790', category: '8类 腐蚀性', packaging: 'II' },
]
const drivers = ['王建国', '张海峰', '刘永昌', '周立新', '孙建华']
const escorts = ['李卫东', '陈志强', '赵明辉', '吴国栋', '钱伟民']

const form = reactive({ taskName: '', transportType: '', plannedTime: '', company: '', chemicalName: '', unNumber: '', chemicalCategory: '', quantity: '' as string | number, packaging: '', tractorPlate: '', trailerPlate: '', driver: '', escort: '', vehicleType: '', origin: '', dest: '', remark: '' })
const errors = reactive<Record<string, string>>({})
const failReasons = [
  '承运商"荣通危化物流有限公司"的道路运输经营许可证已过期（有效期至2025-12-31），无法创建任务',
  '车辆浙A12345目前在检修中，预计2026-05-22恢复，请更换车辆',
  '驾驶员王建国的从业资格证将于2026-06-01到期，需更新后重新提交',
  '化学品"液氯"需要额外的毒性气体运输资质，当前承运商不具备该资质',
]

const submitModal = reactive({ visible: false, taskId: 0, success: true, errorMsg: '' })

function onChemicalChange() { const chem = chemicals.find(c => c.name === form.chemicalName); if (chem) { form.unNumber = chem.unNumber; form.chemicalCategory = chem.category; form.packaging = chem.packaging } }
function validate(field: string) { if (field === 'taskName' && !form.taskName.trim()) errors.taskName = '请输入任务名称'; else delete errors.taskName }

function handleSubmit() {
  if (!form.taskName || !form.company || !form.chemicalName || !form.tractorPlate || !form.driver || !form.escort) { alert('请填写所有必填字段'); return }
  submitModal.taskId = Math.floor(1000 + Math.random() * 1000)
  // 随机成功(70%) 或失败(30%)
  const roll = Math.random()
  if (roll < 0.7) {
    submitModal.success = true
    submitModal.errorMsg = ''
  } else {
    submitModal.success = false
    submitModal.errorMsg = failReasons[Math.floor(Math.random() * failReasons.length)]
  }
  submitModal.visible = true
}

function triggerSubmitResult() {
  submitModal.taskId = 1009
  submitModal.success = false
  submitModal.errorMsg = failReasons[0]
  submitModal.visible = true
}

// 监听标注面板弹窗触发
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  window.addEventListener('annotation:trigger-modal', onAnnotationModal as EventListener)
})
onUnmounted(() => {
  window.removeEventListener('annotation:trigger-modal', onAnnotationModal as EventListener)
})
function onAnnotationModal(e: CustomEvent) {
  if (e.detail?.modalId === 'submitResult') triggerSubmitResult()
}

function handleSaveDraft() { alert('草稿已保存') }
function handleCancel() { if (form.taskName && !confirm('已填写内容尚未保存，确定离开吗？')) return; handleBack() }
function handleBack() { alert('返回列表页') }
</script>

<style scoped>
.page-root { padding: 32px; }
.page-header { margin-bottom: 28px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.page-title { font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; }

/* 双列布局 */
.form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.form-col { display: flex; flex-direction: column; gap: 16px; }
.form-card { padding: 24px; }
.card-hd { font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9; }

.field-group { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field-full { grid-column: span 2; } /* unused in single-col but keep */
.field-label { font-size: 12px; font-weight: 600; color: #475569; }
.req { color: #EF4444; }
.field-err .input-field { border-color: #EF4444; }
.field-err-msg { font-size: 11px; color: #EF4444; margin-top: 2px; }
.field-count { font-size: 11px; color: #94A3B8; text-align: right; }

/* 底部操作 */
.form-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.4); position: sticky; bottom: 24px; }

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
.modal-hint { text-align: center; font-size: 13px; color: #64748B; margin-top: 12px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid #F1F5F9; }
.success-icon { display: flex; justify-content: center; margin-bottom: 16px; }
</style>
