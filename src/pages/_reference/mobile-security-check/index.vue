<template>
  <div class="mobile-shell">
    <PhoneFrame>
      <!-- 头部 -->
      <div class="mh">
        <button class="mh-back" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="mh-title">装货安全检查</span>
        <span class="mh-count">{{ checkedCount }}/{{ checkItems.length }}</span>
      </div>

      <!-- 任务信息 -->
      <div data-req-id="1" class="mc">
        <div class="mc-row"><span class="mc-l">任务编号</span><span class="mc-v">#1005</span></div>
        <div class="mc-row"><span class="mc-l">车头车牌</span><span class="mc-v mono">浙A12345</span></div>
        <div class="mc-row"><span class="mc-l">挂车车牌</span><span class="mc-v mono">浙A1234挂</span></div>
        <div class="mc-row"><span class="mc-l">化学品</span><span class="mc-v">甲醇（UN 1230）</span></div>
      </div>

      <!-- 检查项 -->
      <div data-req-id="2" class="ms">
        <h3 class="ms-ttl">检查项目</h3>
        <div v-for="item in checkItems" :key="item.id" class="ci" @click="toggleCheck(item)">
          <div class="ci-left">
            <div class="ci-dot" :class="{ ok: item.checked && !item.failed, fail: item.checked && item.failed }">
              <span v-if="item.checked && !item.failed">✓</span>
              <span v-else-if="item.checked && item.failed">✕</span>
            </div>
            <div>
              <div class="ci-name">{{ item.name }}</div>
              <div class="ci-desc">{{ item.desc }}</div>
            </div>
          </div>
          <button v-if="item.checked && item.failed" class="ci-cam" @click.stop="takePhoto(item)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            拍照
          </button>
        </div>
      </div>

      <!-- 异常说明 -->
      <div v-if="hasFailed" data-req-id="3" class="ms">
        <h3 class="ms-ttl">异常说明</h3>
        <textarea v-model="remark" class="mc-ta" placeholder="请描述检查不通过的原因..." rows="3"></textarea>
      </div>

      <!-- 签名 -->
      <div data-req-id="4" class="ms">
        <h3 class="ms-ttl">安检员签名</h3>
        <div class="sig-pad" @click="signature = '安检员：钱伟民\n2026-05-20 09:41'">
          <span v-if="!signature" class="sig-place">点击此处签名</span>
          <span v-else class="sig-text">{{ signature }}</span>
        </div>
      </div>

      <!-- 底部 -->
      <div data-req-id="5" class="mft">
        <button class="mft-ghost" @click="handleSaveDraft">暂存</button>
        <button class="mft-brand" :disabled="!canSubmit" @click="handleSubmit">
          {{ canSubmit ? '提交检查结果' : `还有 ${uncheckedCount} 项待检查` }}
        </button>
      </div>

      <!-- 成功 -->
      <div v-if="submitModal.visible" class="mmodal-bg" @click.self="submitModal.visible = false">
        <div class="mmodal">
          <div class="mmodal-ok"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="mmodal-ttl">提交成功</div>
          <div class="mmodal-desc">安检结果已上报，调度员将收到通知</div>
          <button class="mmodal-btn" @click="handleBack">返回任务列表</button>
        </div>
      </div>
    </PhoneFrame>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PhoneFrame from '../../../../skills/phone-frame/PhoneFrame.vue'

interface CheckItem { id: number; name: string; desc: string; checked: boolean; failed: boolean }

const checkItems = reactive<CheckItem[]>([
  { id: 1, name: '车辆外观检查', desc: '检查罐体无破损、无泄漏痕迹', checked: false, failed: false },
  { id: 2, name: '紧急切断阀', desc: '测试紧急切断阀开闭正常', checked: false, failed: false },
  { id: 3, name: '灭火器', desc: '灭火器在有效期内，压力正常', checked: false, failed: false },
  { id: 4, name: '静电接地带', desc: '静电接地带完好、接触地面', checked: false, failed: false },
  { id: 5, name: '轮胎与制动', desc: '轮胎无严重磨损，制动系统正常', checked: false, failed: false },
  { id: 6, name: '随车证件', desc: '行驶证、道路运输证、押运员证齐全', checked: false, failed: false },
  { id: 7, name: '货物核验', desc: '核对化学品名称、UN编号、数量与单据一致', checked: false, failed: false },
  { id: 8, name: '铅封检查', desc: '装货口铅封完好', checked: false, failed: false },
])

const remark = ref('')
const signature = ref('')
const submitModal = reactive({ visible: false })
const checkedCount = computed(() => checkItems.filter(i => i.checked).length)
const uncheckedCount = computed(() => checkItems.filter(i => !i.checked).length)
const hasFailed = computed(() => checkItems.some(i => i.checked && i.failed))
const canSubmit = computed(() => checkItems.every(i => i.checked) && !!signature.value)

function toggleCheck(item: CheckItem) {
  if (!item.checked) { const ok = confirm(`"${item.name}"检查是否合格？\n\n确定=合格 | 取消=不合格`); item.checked = true; item.failed = !ok }
  else { item.checked = false; item.failed = false }
}
function takePhoto(item: CheckItem) { alert(`模拟拍照 — ${item.name} 不合格现场照片`) }
function handleSaveDraft() { alert('检查结果已暂存') }
function handleSubmit() { if (!canSubmit) return; submitModal.visible = true }
function handleBack() { alert('返回上级页面') }
</script>

<style scoped>
.mobile-shell { display: flex; justify-content: center; padding: 40px 0; }

/* 头部 */
.mh { display: flex; align-items: center; padding: 12px 14px; background: #fff; border-bottom: 1px solid #F1F5F9; gap: 8px; }
.mh-back { background: none; border: none; cursor: pointer; color: #334155; padding: 4px; border-radius: 6px; display: flex; }
.mh-title { flex: 1; font-size: 15px; font-weight: 700; color: #0F172A; }
.mh-count { font-size: 12px; font-weight: 700; color: #2563EB; background: rgba(37,99,235,0.1); padding: 4px 10px; border-radius: 20px; }

/* 卡片 */
.mc { background: #fff; margin: 10px 14px; border-radius: 14px; padding: 14px 16px; border: 1px solid #F1F5F9; }
.mc-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
.mc-l { font-size: 12px; color: #94A3B8; }
.mc-v { font-size: 13px; font-weight: 600; color: #0F172A; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

.ms { margin: 6px 14px; }
.ms-ttl { font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em; }

/* 检查项 */
.ci { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #fff; border-radius: 12px; margin-bottom: 6px; border: 1px solid #F1F5F9; cursor: pointer; transition: all 0.15s; }
.ci:active { background: #F8FAFC; }
.ci-left { display: flex; align-items: center; gap: 10px; }
.ci-dot { width: 22px; height: 22px; border: 2px solid #E2E8F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; transition: all 0.2s; }
.ci-dot.ok { border-color: #10B981; background: #10B981; color: #fff; }
.ci-dot.fail { border-color: #EF4444; background: #EF4444; color: #fff; }
.ci-name { font-size: 13px; font-weight: 600; color: #0F172A; }
.ci-desc { font-size: 11px; color: #94A3B8; margin-top: 2px; }
.ci-cam { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 20px; font-size: 11px; font-weight: 600; color: #DC2626; cursor: pointer; }

.mc-ta { width: 100%; padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 10px; font-size: 13px; font-family: inherit; resize: none; background: #F8FAFC; outline: none; }
.mc-ta:focus { border-color: #2563EB; }

/* 签名 */
.sig-pad { height: 72px; background: #F8FAFC; border: 1px dashed #E2E8F0; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
.sig-pad:hover { border-color: #2563EB; background: rgba(37,99,235,0.03); }
.sig-place { font-size: 13px; color: #94A3B8; }
.sig-text { font-size: 15px; font-family: 'KaiTi', serif; white-space: pre-line; text-align: center; color: #0F172A; }

/* 底部 */
.mft { padding: 14px; display: flex; gap: 10px; }
.mft-ghost { flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; border: none; background: #F1F5F9; color: #475569; cursor: pointer; }
.mft-brand { flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; border: none; background: #2563EB; color: #fff; cursor: pointer; }
.mft-brand:disabled { background: #E2E8F0; color: #94A3B8; cursor: not-allowed; }

/* 弹窗 */
.mmodal-bg { position: absolute; inset: 0; background: rgba(15,23,42,0.35); display: flex; align-items: center; justify-content: center; z-index: 100; border-radius: 40px; }
.mmodal { background: #fff; border-radius: 20px; padding: 32px 24px; text-align: center; width: 260px; }
.mmodal-ok { width: 52px; height: 52px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.mmodal-ttl { font-size: 18px; font-weight: 800; margin-bottom: 6px; color: #0F172A; }
.mmodal-desc { font-size: 12px; color: #94A3B8; margin-bottom: 20px; }
.mmodal-btn { width: 100%; padding: 12px; background: #2563EB; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
</style>
