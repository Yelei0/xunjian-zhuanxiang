<template>
  <div class="page-root">
    <div class="page-header">
      <div>
        <h1 class="page-title">运输监控看板</h1>
        <p class="page-subtitle">实时掌握危化品运输全局态势</p>
      </div>
      <div data-req-id="1" class="time-pills">
        <button v-for="t in timeRanges" :key="t.value" class="pill" :class="{ active: timeRange === t.value }" @click="timeRange = t.value">{{ t.label }}</button>
      </div>
    </div>

    <!-- 指标卡片 -->
    <div data-req-id="2" class="metrics-row">
      <div v-for="m in metrics" :key="m.label" class="glass-card metric-card" @click="handleMetricClick(m)">
        <div class="metric-top">
          <span class="metric-label">{{ m.label }}</span>
          <span v-if="m.alert" class="metric-alert-dot"></span>
        </div>
        <div class="metric-value" :class="{ 'text-status-danger': m.alert }">{{ m.value }}</div>
        <div class="metric-foot">
          <span :class="m.trend > 0 ? 'trend-up' : 'trend-down'">
            {{ m.trend > 0 ? '↑' : '↓' }} {{ Math.abs(m.trend) }}%
          </span>
          <span class="metric-compare">vs 昨日</span>
        </div>
      </div>
    </div>

    <!-- 图表行 -->
    <div class="charts-row">
      <div data-req-id="3" class="subtle-card chart-card">
        <h3 class="chart-title">运输任务趋势</h3>
        <div class="bar-chart">
          <div v-for="bar in barData" :key="bar.label" class="bar-wrap">
            <div class="bar-value">{{ bar.height }}</div>
            <div class="bar-track"><div class="bar-fill" :style="{ height: bar.height + '%' }"></div></div>
            <span class="bar-label">{{ bar.label }}</span>
          </div>
        </div>
      </div>
      <div class="subtle-card chart-card">
        <h3 class="chart-title">车辆状态分布</h3>
        <div class="pie-legend">
          <div v-for="seg in pieData" :key="seg.label" class="pie-row">
            <span class="pie-dot" :style="{ background: seg.color }"></span>
            <span class="pie-label">{{ seg.label }}</span>
            <span class="pie-count">{{ seg.value }}<small> 辆</small></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 在途车辆 -->
    <div data-req-id="4" class="subtle-card section-card">
      <div class="section-head">
        <h3 class="section-title-text">在途车辆实时状态</h3>
        <span class="refresh-badge">刷新于 {{ lastRefresh }}</span>
      </div>
      <div class="table-scroll">
        <table class="modern-table">
          <thead>
            <tr>
              <th>车头车牌</th><th>挂车车牌</th><th>驾驶员</th><th>化学品</th><th>当前位置</th><th>速度</th><th>罐温</th><th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in inTransitVehicles" :key="v.plate">
              <td class="mono">{{ v.plate }}</td>
              <td class="mono">{{ v.trailerPlate }}</td>
              <td class="fw-600">{{ v.driver }}</td>
              <td>{{ v.chemical }}</td>
              <td class="text-sm">{{ v.location }}</td>
              <td>{{ v.speed }} km/h</td>
              <td :class="{ 'text-status-danger fw-700': v.tempAlert }">{{ v.temp }}°C</td>
              <td><span class="badge" :class="statusClass(v)">{{ v.statusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 告警 -->
    <div data-req-id="5" class="subtle-card section-card">
      <div class="section-head"><h3 class="section-title-text">近期告警</h3></div>
      <div v-if="alerts.length === 0" class="empty-state">暂无告警，一切正常</div>
      <div v-for="a in alerts" :key="a.id" class="alert-row" :class="a.level">
        <span class="alert-dot-icon" :class="a.level"></span>
        <span class="alert-time">{{ a.time }}</span>
        <span class="alert-desc">{{ a.desc }}</span>
        <span class="alert-plate mono">{{ a.plate }}</span>
        <button class="alert-btn" @click="handleAlertClick(a)">处理</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const timeRange = ref('today')
const timeRanges = [{ label: '今日', value: 'today' }, { label: '近7天', value: '7d' }, { label: '近30天', value: '30d' }]

const metrics = [
  { label: '今日任务总数', value: 128, trend: 12, alert: false },
  { label: '在途任务', value: 43, trend: -5, alert: false },
  { label: '已完成', value: 78, trend: 8, alert: false },
  { label: '异常任务', value: 3, trend: 200, alert: true },
]

const barData = [
  { label: '周一', height: 65 }, { label: '周二', height: 72 }, { label: '周三', height: 58 }, { label: '周四', height: 80 }, { label: '周五', height: 75 }, { label: '周六', height: 40 }, { label: '周日', height: 25 },
]

const pieData = [
  { label: '在途', value: 43, color: '#3B82F6' }, { label: '装货中', value: 12, color: '#F59E0B' }, { label: '待派车', value: 28, color: '#94A3B8' }, { label: '维修/停运', value: 7, color: '#EF4444' },
]

const lastRefresh = ref('09:41:20')

const inTransitVehicles = [
  { plate: '浙A12345', trailerPlate: '浙A1234挂', driver: '王建国', chemical: '甲醇', location: 'G60沪昆高速嘉兴段', speed: 78, temp: 22, tempAlert: false, statusLabel: '正常', status: 'normal' },
  { plate: '浙B67890', trailerPlate: '浙B5678挂', driver: '张海峰', chemical: '苯乙烯', location: 'G15沈海高速宁波段', speed: 65, temp: 28, tempAlert: true, statusLabel: '温度偏高', status: 'warn' },
  { plate: '苏C23456', trailerPlate: '苏C9012挂', driver: '刘永昌', chemical: '液氯', location: 'G36宁洛高速滁州段', speed: 82, temp: 18, tempAlert: false, statusLabel: '正常', status: 'normal' },
  { plate: '沪F89012', trailerPlate: '沪F1234挂', driver: '周立新', chemical: '丙酮', location: 'G50沪渝高速湖州段', speed: 0, temp: 24, tempAlert: false, statusLabel: '异常停车', status: 'danger' },
]

const alerts = [
  { id: 1, level: 'warn', time: '09:32', desc: '罐体温度超过阈值（28°C > 25°C）', plate: '浙B67890' },
  { id: 2, level: 'danger', time: '09:15', desc: '车辆异常停车超过10分钟', plate: '沪F89012' },
  { id: 3, level: 'warn', time: '08:47', desc: '偏离规划路线超过5公里', plate: '苏C23456' },
]

function statusClass(v: any) {
  if (v.status === 'normal') return 'badge-success'
  if (v.status === 'warn') return 'badge-warn'
  return 'badge-danger'
}

function handleMetricClick(m: any) { alert(`下钻查看：${m.label}`) }
function handleAlertClick(a: any) { alert(`处理告警：${a.desc}`) }

setInterval(() => { lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour12: false }) }, 30000)
</script>

<style scoped>
.page-root { padding: 32px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; }
.page-subtitle { font-size: 13px; color: #64748B; margin-top: 4px; }

.time-pills { display: flex; gap: 4px; background: #E2E8F0; border-radius: 12px; padding: 4px; }
.pill { padding: 7px 16px; border-radius: 9px; font-size: 13px; font-weight: 500; background: transparent; border: none; color: #64748B; cursor: pointer; transition: all 0.2s; }
.pill.active { background: #fff; color: #0F172A; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

/* 指标卡片 */
.metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.metric-card { padding: 20px 24px; cursor: pointer; }
.metric-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.metric-label { font-size: 12px; color: #64748B; font-weight: 500; }
.metric-alert-dot { width: 6px; height: 6px; border-radius: 50%; background: #EF4444; }
.metric-value { font-size: 32px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; }
.metric-foot { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; }
.trend-up { color: #10B981; font-weight: 600; }
.trend-down { color: #6B7280; font-weight: 600; }
.metric-compare { color: #94A3B8; }

/* 图表 */
.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
.chart-card { padding: 24px; }
.chart-title { font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 20px; }

.bar-chart { display: flex; align-items: flex-end; gap: 20px; height: 180px; padding: 0 8px; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
.bar-value { font-size: 11px; font-weight: 700; color: #64748B; }
.bar-track { width: 100%; max-width: 36px; flex: 1; min-height: 4px; background: #F1F5F9; border-radius: 6px 6px 0 0; overflow: hidden; display: flex; align-items: flex-end; }
.bar-fill { width: 100%; border-radius: 6px 6px 0 0; background: linear-gradient(to top, #2563EB, rgba(37,99,235,0.25)); transition: height 0.4s ease; }
.bar-label { font-size: 10px; color: #94A3B8; font-weight: 500; }

.pie-legend { display: flex; flex-direction: column; gap: 14px; padding: 12px 0; }
.pie-row { display: flex; align-items: center; gap: 10px; }
.pie-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.pie-label { flex: 1; font-size: 13px; color: #475569; }
.pie-count { font-size: 16px; font-weight: 700; color: #0F172A; }
.pie-count small { font-size: 12px; color: #94A3B8; font-weight: 400; }

/* 表格 */
.section-card { padding: 24px; margin-bottom: 16px; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title-text { font-size: 14px; font-weight: 700; color: #0F172A; }
.refresh-badge { font-size: 11px; color: #94A3B8; font-weight: 500; }

.table-scroll { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.modern-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
.modern-table td { padding: 12px 14px; border-bottom: 1px solid #F1F5F9; color: #334155; }
.modern-table tbody tr:hover td { background: #F8FAFC; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.fw-600 { font-weight: 600; }
.text-sm { font-size: 12px; }
.text-status-danger { color: #EF4444; }
.fw-700 { font-weight: 700; }

/* 告警 */
.alert-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; margin-bottom: 6px; font-size: 13px; }
.alert-row.warn { background: #FFFBEB; }
.alert-row.danger { background: #FEF2F2; }
.alert-dot-icon { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.alert-dot-icon.warn { background: #F59E0B; }
.alert-dot-icon.danger { background: #EF4444; }
.alert-time { color: #94A3B8; font-size: 12px; width: 38px; flex-shrink: 0; }
.alert-desc { flex: 1; font-weight: 500; }
.alert-plate { font-size: 12px; color: #64748B; }
.alert-btn { padding: 4px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #fff; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.15s; }
.alert-btn:hover { border-color: #CBD5E1; background: #F8FAFC; }

.empty-state { padding: 32px; text-align: center; color: #94A3B8; font-size: 13px; }
</style>
