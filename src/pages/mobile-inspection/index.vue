<template>
  <div class="mobile-shell">
    <PhoneFrame>
      <!-- ===== 首页 ===== -->
      <div v-if="currentPage === 'home'" class="page-home" data-req-page="mobile-inspection">
        <div class="mh">
          <span class="mh-title">园区巡检</span>
        </div>
        <div class="home-grid">
          <div class="home-action-primary" data-req-id="1" @click="goTo('start')">
            <div class="home-primary-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5h6"/><path d="M9 3h6v4H9z"/><path d="M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><path d="m9 14 2 2 4-5"/><circle cx="17" cy="18" r="3"/><path d="M17 15v6"/><path d="M14 18h6"/></svg>
            </div>
            <div class="home-primary-copy">
              <span class="home-card-name home-card-name-light">开始巡检</span>
              <span class="home-card-desc home-card-desc-light">选择巡检类型、场地和点位</span>
            </div>
            <div class="home-primary-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="home-secondary-grid">
            <div class="home-card home-card-secondary" data-req-id="2" @click="goTo('records')">
              <div class="home-secondary-copy">
                <span class="home-card-name">巡检记录</span>
                <span class="home-card-desc">查看历史巡检任务</span>
              </div>
              <div class="home-secondary-icon home-secondary-icon-blue">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4h6"/><path d="M9 2h6v4H9z"/><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M8 11h8"/><path d="M8 15h8"/></svg>
              </div>
            </div>
            <div class="home-card home-card-secondary" data-req-id="3" @click="goTo('map')">
              <div class="home-secondary-copy">
                <span class="home-card-name">点位地图</span>
                <span class="home-card-desc">查看点位分布地图</span>
              </div>
              <div class="home-secondary-icon home-secondary-icon-green">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 开始巡检 ===== -->
      <div v-if="currentPage === 'start'" class="page-start" data-req-page="mobile-inspection-start">
        <div class="mh">
          <button class="mh-back" @click="goTo('home')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="mh-title">开始巡检</span>
        </div>
        <div class="form-area">
          <div class="form-row" data-req-id="1">
            <label class="form-label">巡检类型</label>
            <select v-model="startForm.type" class="form-select" @change="onTypeChange">
              <option value="">下拉菜单</option>
              <option v-for="t in inspectionTypes" :key="t.name" :value="t.name">{{ t.name }}</option>
            </select>
          </div>
          <div class="form-row" data-req-id="2">
            <label class="form-label">巡检场地</label>
            <input type="text" class="form-input disabled" :value="startForm.area" disabled />
          </div>
          <div class="form-row" data-req-id="3">
            <label class="form-label">巡检点位</label>
            <div class="point-selects">
              <div class="point-select-tips">点击点位行即可选中，选中后会显示蓝色描边和高亮字体</div>
              <div class="point-list">
                <button
                  v-for="pt in availablePoints()"
                  :key="pt.id"
                  type="button"
                  class="point-row"
                  :class="{ selected: isPointSelected(pt.id) }"
                  @click="togglePoint(pt.id)"
                >
                  <span class="point-row-name">{{ pt.name }}</span>
                  <span class="point-row-state">{{ isPointSelected(pt.id) ? '已选中' : '点击选择' }}</span>
                </button>
              </div>
              <div v-if="selectedPointItems.length" class="point-selected-list">
                <button
                  v-for="pt in selectedPointItems"
                  :key="pt.id"
                  type="button"
                  class="point-selected-chip"
                  @click="removeSelectedPoint(pt.id)"
                >
                  {{ pt.name }}
                  <span class="point-selected-chip-close">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="page-bottom">
          <button class="btn-brand" data-req-id="5" :disabled="!canStart" @click="startInspection">下一步</button>
        </div>
      </div>

      <!-- ===== 巡检任务 ===== -->
      <div v-if="currentPage === 'task'" class="page-task" data-req-page="mobile-inspection-task">
        <div class="mh">
          <button class="mh-back" @click="goTo('start')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="mh-title">巡检任务</span>
        </div>

        <!-- 点位进度条 -->
        <div class="point-progress" data-req-id="1">
          <div
            v-for="(p, idx) in orderedTaskPoints"
            :key="p.id"
            class="point-tab"
            :class="{
              active: p.id === currentPointId,
              done: isPointComplete(p),
              abnormal: isPointComplete(p) && p.inspectionStatus === 'abnormal'
            }"
            @click="switchPoint(p.id)"
          >
            <span class="point-order" :class="{ 'point-order--done': p.checkedInAt }">
              {{ p.checkedInAt ? idx + 1 : '待' }}
            </span>
            {{ p.name }}
          </div>
        </div>

        <div v-if="currentTaskPoint" class="task-content">
          <!-- 点位核对状态 -->
          <div class="task-field" data-req-id="2">
            <label class="task-label">点位核对</label>
            <button class="scan-btn" @click="simulateScanSuccess">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h2v2h-2zM19 14h2v7h-7v-2h5z"/>
              </svg>
              扫码核对
            </button>
            <div class="task-status" :class="verifyStatusClass">
              <span class="task-status-text">{{ verifyStatusText }}</span>
              <span v-if="currentTaskPoint.checkedInAt" class="checkin-time-inline">{{ formatTimeOnly(currentTaskPoint.checkedInAt) }}</span>
            </div>
          </div>

          <!-- 点位照片 -->
          <div class="task-field" data-req-id="3">
            <label class="task-label">点位照片</label>
            <div class="photo-grid">
              <div v-for="(photo, idx) in currentTaskPoint.photos" :key="idx" class="photo-item">
                <span class="photo-taken-icon">✓</span>
                <button class="photo-delete" @click="deletePhoto(idx)">×</button>
              </div>
              <button
                v-if="currentTaskPoint.photos.length < 6"
                class="photo-add"
                :disabled="!canEditInspectionContent"
                @click="takePhoto"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span class="photo-add-text">拍照</span>
              </button>
            </div>
            <span class="photo-count">{{ currentTaskPoint.photos.length }}/6</span>
            <span v-if="!canEditInspectionContent" class="field-hint">请先完成点位打卡</span>
          </div>

          <!-- 巡检情况 -->
        <div class="task-field" data-req-id="4">
          <label class="task-label">巡检情况</label>
          <div class="inspection-status-choice">
            <button
              v-for="item in inspectionStatusOptions"
              :key="item.value"
              type="button"
              class="inspection-status-btn"
              :class="{ active: currentTaskPoint.inspectionStatus === item.value, abnormal: item.value === 'abnormal' }"
              :disabled="!canEditInspectionContent"
              @click="setCurrentInspectionStatus(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
          <textarea
            v-model="currentTaskPoint.remark"
            class="task-textarea"
            :disabled="!canEditInspectionContent"
            :placeholder="canEditInspectionContent ? '请输入，至少2个字' : '请先完成点位打卡'"
            rows="3"
          ></textarea>
          <div class="quick-remark-actions">
            <button
              v-for="item in quickRemarkOptions"
              :key="item"
              type="button"
              class="quick-remark-btn"
              :disabled="!canEditInspectionContent"
              @click="appendQuickRemark(item)"
            >
              {{ item }}
            </button>
          </div>
          <span class="field-hint">至少输入 {{ MIN_REMARK_LENGTH }} 个字</span>
        </div>
        </div>

        <!-- 底部 -->
        <div class="page-bottom">
          <button class="btn-ghost" data-req-id="5" @click="saveDraft">暂存</button>
          <button v-if="hasNextPoint" class="btn-brand" data-req-id="6" :disabled="!isCurrentPointComplete" @click="nextPoint">下一点位</button>
          <button v-else class="btn-brand" data-req-id="7" :disabled="!canFinishInspection" @click="finishInspection">提交本次巡检</button>
        </div>
      </div>

      <!-- ===== 巡检记录列表 ===== -->
      <div v-if="currentPage === 'records'" class="page-records" data-req-page="mobile-inspection-records">
        <div class="mh">
          <button class="mh-back" @click="goTo('home')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="mh-title">巡检记录</span>
        </div>

        <!-- 筛选 -->
        <div class="filter-bar" data-req-id="1">
          <select v-model="recordFilter.type" class="filter-mini">
            <option value="">巡检类型</option>
            <option v-for="t in inspectionTypes" :key="t.name" :value="t.name">{{ t.name }}</option>
          </select>
          <input v-model="recordFilter.time" type="datetime-local" class="filter-mini" />
        </div>

        <!-- 记录列表 -->
        <div class="record-list" data-req-id="2">
          <div v-for="record in filteredRecords" :key="record.id" class="record-card" @click="viewRecordDetail(record)">
            <div class="record-head">
              <span class="record-title">{{ record.type }}-{{ record.area }}</span>
              <span class="record-status" :class="getRecordStatusClass(record)">{{ getRecordStatusText(record) }}</span>
            </div>
            <div class="record-row">
              <span class="record-label">巡检人：</span>
              <span class="record-value">{{ record.inspector }}</span>
              <span class="record-link" v-if="record.status === 'draft'">继续巡检>>></span>
              <span class="record-link" v-else-if="record.status === 'submitted'">处理整改>>></span>
              <span class="record-link" v-else-if="record.status === 'completed'">查看详情>>></span>
            </div>
            <div class="record-row">
              <span class="record-label">巡检时间：</span>
              <span class="record-value">{{ record.time }}</span>
            </div>
            <div v-if="record.status !== 'draft'" class="record-row">
              <span class="record-label">巡检结果：</span>
              <span
                v-if="getRecordAbnormalCount(record) === 0"
                class="record-value record-result record-result-normal"
              >
                全部正常
              </span>
              <span v-else class="record-value record-result">
                <span class="record-result-abnormal">存在异常 {{ getRecordAbnormalCount(record) }}</span>
                <span class="record-result-divider"> | </span>
                <span class="record-result-rectified">已整改 {{ getRecordRectifiedCount(record) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 点位地图 ===== -->
      <div v-if="currentPage === 'map'" class="page-map" data-req-page="mobile-inspection-map">
        <div class="mh">
          <button class="mh-back" @click="goTo('home')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="mh-title">点位地图</span>
        </div>

        <!-- 场地切换 -->
        <div class="map-tabs" data-req-id="1">
          <button class="map-tab" :class="{ active: mapArea === '物流园区' }" @click="mapArea = '物流园区'">物流园区</button>
          <button class="map-tab" :class="{ active: mapArea === '接收站' }" @click="mapArea = '接收站'">接收站</button>
        </div>

        <!-- 地图 -->
        <div class="map-container" data-req-id="2">
          <img :src="mapArea === '接收站' ? '/images/jieshouzhan.jpg' : '/images/park.jpg'" alt="地图" class="map-image" />
          <!-- SVG 点位标记 -->
          <svg class="map-svg" viewBox="0 0 600 500">
            <defs>
              <filter id="label-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <g v-for="point in currentMapPoints" :key="point.id">
              <circle :cx="point.x" :cy="point.y" r="8" fill="#2563EB" stroke="#fff" stroke-width="3"/>
              <rect :x="point.x - 40" :y="point.y + 12" width="80" height="22" rx="4" fill="#2563EB" filter="url(#label-shadow)"/>
              <text :x="point.x" :y="point.y + 27" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">{{ point.name }}</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- ===== 记录详情 ===== -->
      <div v-if="currentPage === 'detail'" class="page-detail" data-req-page="mobile-inspection-detail">
        <div class="mh">
          <button class="mh-back" @click="goTo('records')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="mh-title">巡检记录</span>
        </div>

        <div v-if="detailRecord" class="detail-content">
          <!-- 信息区 -->
          <div class="detail-info" data-req-id="1">
            <div class="detail-row">
              <span class="detail-label">巡检类型</span>
              <span class="detail-value">{{ detailRecord.type }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">巡检场地</span>
              <span class="detail-value">{{ detailRecord.area }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">巡检人</span>
              <span class="detail-value">{{ detailRecord.inspector }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">巡检时间</span>
              <span class="detail-value">{{ detailRecord.time }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">任务状态</span>
              <span class="detail-value" :class="getRecordStatusClass(detailRecord)">{{ getRecordStatusText(detailRecord) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">巡检结果</span>
              <span class="detail-value">{{ getRecordResultSummary(detailRecord) }}</span>
            </div>
          </div>

          <!-- 巡检路线图 -->
          <div class="detail-section" data-req-id="2">
            <h4 class="section-title">巡检路线</h4>
            <div class="detail-map" @click="openRoutePreview">
              <img :src="detailRecord.area === '接收站' ? '/images/jieshouzhan.jpg' : '/images/park.jpg'" alt="地图" class="map-image" />
              <svg class="map-svg" viewBox="0 0 600 500">
                <polyline
                  v-if="detailRoutePath.length > 1"
                  :points="detailRoutePath.map((p: any) => `${p.x},${p.y}`).join(' ')"
                  fill="none" stroke="#FBBF24" stroke-width="3" stroke-dasharray="8 4"
                />
                <g v-for="(arrow, idx) in detailRouteArrows" :key="`mobile-detail-arrow-${idx}`" :transform="`translate(${arrow.x} ${arrow.y}) rotate(${arrow.rotation})`">
                  <polygon points="-7,-3.5 7,0 -7,3.5" fill="#FBBF24"/>
                </g>
                <g v-for="(point, idx) in detailRoutePoints" :key="point.id">
                  <circle :cx="point.x" :cy="point.y" r="8" :fill="idx === 0 ? '#10B981' : '#2563EB'" stroke="#fff" stroke-width="2"/>
                  <text :x="point.x" :y="point.y + 4" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">{{ idx === 0 ? '起' : idx }}</text>
                  <rect
                    :x="point.x - getRouteLabelWidth(point.name) / 2"
                    :y="point.y - 34"
                    :width="getRouteLabelWidth(point.name)"
                    height="20"
                    rx="6"
                    fill="#2563EB"
                  />
                  <text :x="point.x" :y="point.y - 20" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">{{ point.name }}</text>
                </g>
              </svg>
              <span class="zoom-tip">点击查看大图</span>
            </div>
          </div>

          <!-- 点位详情 -->
          <div class="detail-section">
            <div class="point-tags">
              <button
                v-for="(p, idx) in detailRecord.points"
                :key="idx"
                type="button"
                class="point-tag"
                :class="{ active: idx === activeDetailPointIndex, abnormal: p.pointStatus === 'abnormal', rectified: p.pointStatus === 'rectified' }"
                @click="selectDetailPoint(idx)"
              >
                <span class="point-tag-order">{{ idx + 1 }}</span>
                {{ p.name }}
              </button>
            </div>
          </div>

          <!-- 巡检结果 -->
          <div v-if="activeDetailPoint" class="detail-section detail-point-card" data-req-id="3">
            <div class="detail-row">
              <span class="detail-label">打卡时间</span>
              <span class="detail-value">{{ activeDetailPoint.time }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">结果状态</span>
              <span class="detail-value" :class="detailPointStatusClass(activeDetailPoint)">
                {{ getDetailPointStatusText(activeDetailPoint) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">点位照片</span>
              <div class="detail-photo-grid">
                <button
                  v-for="(photo, photoIdx) in getPointPhotos(activeDetailPoint, activeDetailPointIndex)"
                  :key="photoIdx"
                  class="detail-photo-thumb"
                  @click="openPhotoPreview(photo)"
                >
                  <img :src="photo" alt="点位照片" />
                </button>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-label">巡检情况</span>
              <span class="detail-value" :class="detailPointStatusClass(activeDetailPoint)">{{ activeDetailPoint.status }}</span>
            </div>
            <div v-if="activeDetailPoint.pointStatus === 'abnormal'" class="rectification-section">
              <div class="rectification-head">
                <span class="section-title">整改</span>
                <span class="rectification-tip">整改打卡 + 整改照片 + 整改情况</span>
              </div>
              <button class="scan-btn scan-btn-secondary" :disabled="!canEditRectification" @click="simulateRectificationCheckin">
                整改打卡
              </button>
              <div class="rectification-status" :class="{ active: activeDetailPoint.rectification.checkedIn }">
                {{ activeDetailPoint.rectification.checkedIn ? `整改打卡时间：${formatTimestamp(activeDetailPoint.rectification.checkedInAt!)}` : '请先完成整改打卡' }}
              </div>
              <div class="task-field">
                <label class="task-label">整改照片</label>
                <div class="photo-grid">
                  <div v-for="(photo, idx) in activeDetailPoint.rectification.photos" :key="idx" class="photo-item">
                    <span class="photo-taken-icon">✓</span>
                    <button class="photo-delete" @click="deleteRectificationPhoto(idx)">×</button>
                  </div>
                  <button
                    v-if="activeDetailPoint.rectification.photos.length < 6"
                    class="photo-add"
                    :disabled="!canAddRectificationContent"
                    @click="addRectificationPhoto"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span class="photo-add-text">拍照</span>
                  </button>
                </div>
                <span class="photo-count">{{ activeDetailPoint.rectification.photos.length }}/6</span>
              </div>
              <div class="task-field">
                <label class="task-label">整改情况</label>
                <textarea
                  v-model="activeDetailPoint.rectification.remark"
                  class="task-textarea"
                  :disabled="!canAddRectificationContent"
                  placeholder="请输入整改说明"
                  rows="3"
                ></textarea>
              </div>
              <button class="btn-brand rectification-submit" :disabled="!canFinishRectification" @click="finishRectification">
                完成整改
              </button>
            </div>
            <div v-else-if="activeDetailPoint.pointStatus === 'rectified'" class="rectification-summary">
              <div class="detail-row">
                <span class="detail-label">整改状态</span>
                <span class="detail-value status-rectified-text">已整改</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">整改打卡</span>
                <span class="detail-value">{{ activeDetailPoint.rectification.checkedInAt ? formatTimestamp(activeDetailPoint.rectification.checkedInAt) : '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">整改情况</span>
                <span class="detail-value">{{ activeDetailPoint.rectification.remark || '无' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showRoutePreview && detailRecord" class="preview-overlay" @click.self="showRoutePreview = false">
        <div class="route-preview-box">
          <button class="preview-close" @click="showRoutePreview = false">×</button>
          <img :src="detailRecord.area === '接收站' ? '/images/jieshouzhan.jpg' : '/images/park.jpg'" alt="巡检路线大图" class="preview-map-image" />
          <svg class="preview-map-svg" viewBox="0 0 600 500">
            <polyline
              v-if="detailRoutePath.length > 1"
              :points="detailRoutePath.map((p: any) => `${p.x},${p.y}`).join(' ')"
              fill="none" stroke="#FBBF24" stroke-width="4" stroke-dasharray="8 4"
            />
            <g v-for="(arrow, idx) in detailRouteArrows" :key="`mobile-preview-arrow-${idx}`" :transform="`translate(${arrow.x} ${arrow.y}) rotate(${arrow.rotation})`">
              <polygon points="-7,-3.5 7,0 -7,3.5" fill="#FBBF24"/>
            </g>
            <g v-for="(point, idx) in detailRoutePoints" :key="point.id">
              <circle :cx="point.x" :cy="point.y" r="10" :fill="idx === 0 ? '#10B981' : '#2563EB'" stroke="#fff" stroke-width="3"/>
              <text :x="point.x" :y="point.y + 4" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">{{ idx === 0 ? '起' : idx }}</text>
              <rect
                :x="point.x - getRouteLabelWidth(point.name) / 2"
                :y="point.y - 36"
                :width="getRouteLabelWidth(point.name)"
                height="22"
                rx="6"
                fill="#2563EB"
              />
              <text :x="point.x" :y="point.y - 21" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">{{ point.name }}</text>
            </g>
          </svg>
        </div>
      </div>

      <div v-if="previewPhoto" class="preview-overlay" @click.self="previewPhoto = ''">
        <div class="photo-preview-box">
          <button class="preview-close" @click="previewPhoto = ''">×</button>
          <img :src="previewPhoto" alt="点位照片大图" />
        </div>
      </div>
    </PhoneFrame>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import PhoneFrame from '../../../skills/phone-frame/PhoneFrame.vue'
import { getAnnotationStore } from '../../composables/useAnnotationStore'

const store = getAnnotationStore()

// ========== 页面路由 ==========
const currentPage = ref('home')

// 页面名称映射
const pageNameMap: Record<string, string> = {
  'home': 'mobile-inspection',
  'start': 'mobile-inspection-start',
  'task': 'mobile-inspection-task',
  'records': 'mobile-inspection-records',
  'map': 'mobile-inspection-map',
  'detail': 'mobile-inspection-detail'
}

function goTo(page: string) {
  currentPage.value = page
  // 同步更新 store 中的页面标识
  store.setPage(pageNameMap[page] || 'mobile-inspection')
}

// ========== 巡检类型与场地映射 ==========
const inspectionTypes = ref([
  { name: '日常巡检-物流园区', area: '物流园区' },
  { name: '日常巡检-接收站', area: '接收站' },
  { name: '专项巡检-物流园区', area: '物流园区' },
])

// ========== 全部点位坐标 ==========
const allPoints = {
  '物流园区': [
    { id: 1, name: '东门岗', x: 180, y: 100 },
    { id: 2, name: '物流园编组区', x: 350, y: 150 },
    { id: 3, name: '综合楼', x: 480, y: 280 },
    { id: 4, name: '仓库区', x: 380, y: 380 },
    { id: 5, name: '南门岗', x: 150, y: 400 },
    { id: 6, name: '办公楼', x: 100, y: 250 },
  ],
  '接收站': [
    { id: 7, name: '泵房', x: 200, y: 120 },
    { id: 8, name: '编组区', x: 380, y: 180 },
    { id: 9, name: '重车区', x: 450, y: 300 },
    { id: 10, name: '轻车区', x: 320, y: 350 },
    { id: 11, name: '地磅房', x: 180, y: 320 },
    { id: 12, name: '门卫室', x: 120, y: 200 },
  ]
}

// ========== 开始巡检 ==========
const startForm = reactive({
  type: '',
  area: '',
  points: [] as string[]
})

function onTypeChange() {
  const found = inspectionTypes.value.find(t => t.name === startForm.type)
  startForm.area = found ? found.area : ''
  startForm.points = []
}

function availablePoints() {
  return allPoints[startForm.area as keyof typeof allPoints] || []
}

const selectedPointItems = computed(() => {
  const all = availablePoints()
  return startForm.points
    .map(id => all.find(p => String(p.id) === id))
    .filter((p): p is { id: number; name: string; x: number; y: number } => Boolean(p))
})

function isPointSelected(pointId: number) {
  return startForm.points.includes(String(pointId))
}

function togglePoint(pointId: number) {
  const id = String(pointId)
  if (isPointSelected(pointId)) {
    removeSelectedPoint(pointId)
    return
  }
  startForm.points = [...startForm.points, id]
}

function removeSelectedPoint(pointId: number) {
  startForm.points = startForm.points.filter(id => id !== String(pointId))
}

const canStart = computed(() => Boolean(startForm.type && startForm.area && startForm.points.length > 0))

// ========== 巡检任务 ==========
interface TaskPoint {
  id: number
  name: string
  verified: boolean
  verifyError: boolean
  checkedIn: boolean
  checkedInAt: number | null
  inspectionStatus: 'normal' | 'abnormal'
  photos: string[]
  remark: string
}

interface RectificationInfo {
  checkedIn: boolean
  checkedInAt: number | null
  photos: string[]
  remark: string
}

interface RecordPoint {
  id: number
  name: string
  time: string
  pointStatus: 'normal' | 'abnormal' | 'rectified'
  status: string
  photos: string[]
  rectification: RectificationInfo
}

interface InspectionRecord {
  id: number
  type: string
  area: string
  inspector: string
  time: string
  status: 'draft' | 'submitted' | 'completed'
  points: RecordPoint[]
}

const taskPoints = ref<TaskPoint[]>([])
const currentPointId = ref<number | null>(null)
const currentTaskPoint = computed(() => taskPoints.value.find(p => p.id === currentPointId.value) || null)
const MIN_REMARK_LENGTH = 2
const photoPlaceholders = ['/images/park.jpg', '/images/jieshouzhan.jpg']
const quickRemarkOptions = ['存在异常', '卫生问题', '设备异样']
const inspectionStatusOptions = [
  { label: '正常', value: 'normal' as const },
  { label: '异常', value: 'abnormal' as const },
]

function isPointComplete(point: TaskPoint) {
  return point.checkedIn && point.photos.length > 0 && point.remark.trim().length >= MIN_REMARK_LENGTH
}

const orderedTaskPoints = computed(() =>
  [...taskPoints.value].sort((a, b) => {
    if (a.checkedInAt && b.checkedInAt) return a.checkedInAt - b.checkedInAt
    if (a.checkedInAt) return -1
    if (b.checkedInAt) return 1
    return a.id - b.id
  })
)

const canEditInspectionContent = computed(() => {
  if (!currentTaskPoint.value) return false
  return currentTaskPoint.value.checkedIn && !currentTaskPoint.value.verifyError
})

const isCurrentPointComplete = computed(() =>
  currentTaskPoint.value ? isPointComplete(currentTaskPoint.value) : false
)

const hasNextPoint = computed(() => {
  if (!currentTaskPoint.value) return false
  return orderedTaskPoints.value.some((p, idx) => p.id === currentTaskPoint.value?.id && idx < orderedTaskPoints.value.length - 1)
})

const canFinishInspection = computed(() =>
  taskPoints.value.length > 0 &&
  taskPoints.value.every(isPointComplete)
)

const verifyStatusText = computed(() => {
  if (!currentTaskPoint.value) return '请扫描点位二维码进行核对'
  if (currentTaskPoint.value.verifyError) return '打卡异常，点位码与当前点位不对应'
  if (currentTaskPoint.value.checkedIn) return '核对成功，已完成打卡'
  return '请扫描点位二维码进行核对'
})

const verifyStatusClass = computed(() => {
  if (!currentTaskPoint.value) return ''
  if (currentTaskPoint.value.verifyError) return 'status-error'
  if (currentTaskPoint.value.checkedIn) return 'status-ok'
  if (currentTaskPoint.value.verified) return 'status-ok'
  return ''
})

function getRecordAbnormalCount(record: InspectionRecord) {
  return record.points.filter(point => point.pointStatus !== 'normal').length
}

function getRecordRectifiedCount(record: InspectionRecord) {
  return record.points.filter(point => point.pointStatus === 'rectified').length
}

function getRecordResultSummary(record: InspectionRecord) {
  const abnormalCount = getRecordAbnormalCount(record)
  const rectifiedCount = getRecordRectifiedCount(record)
  if (abnormalCount === 0) return '全部正常'
  return `存在异常 ${abnormalCount} | 已整改 ${rectifiedCount}`
}

function getRecordStatusText(record: InspectionRecord) {
  if (record.status === 'draft') return '未提交'
  if (record.status === 'submitted') return '已提交'
  return '已完成'
}

function getRecordStatusClass(record: InspectionRecord) {
  if (record.status === 'draft') return 'status-draft'
  if (record.status === 'submitted') return 'status-unfinished'
  return 'status-completed'
}

function getDetailPointStatusText(point: RecordPoint) {
  if (point.pointStatus === 'rectified') return '已整改'
  if (point.pointStatus === 'abnormal') return '异常'
  return '正常'
}

function startInspection() {
  const points = startForm.points
    .map(id => {
      const all = allPoints[startForm.area as keyof typeof allPoints] || []
      return all.find(p => p.id === Number(id))
    })
    .filter(Boolean)

  taskPoints.value = points.map(p => ({
    id: p!.id,
    name: p!.name,
    verified: false,
    verifyError: false,
    checkedIn: false,
    checkedInAt: null,
    inspectionStatus: 'normal',
    photos: [],
    remark: ''
  }))
  currentPointId.value = taskPoints.value[0]?.id || null
  goTo('task')
}

function switchPoint(pointId: number) { currentPointId.value = pointId }
function nextPoint() {
  if (!isCurrentPointComplete.value) {
    alert('请先完成当前点位的打卡、点位照片和巡检情况')
    return
  }
  if (!currentTaskPoint.value) return
  const currentIndex = orderedTaskPoints.value.findIndex(p => p.id === currentTaskPoint.value!.id)
  const nextPointItem = orderedTaskPoints.value[currentIndex + 1]
  if (nextPointItem) currentPointId.value = nextPointItem.id
}

function simulateScanSuccess() {
  if (!currentTaskPoint.value) return
  currentTaskPoint.value.verified = true
  currentTaskPoint.value.verifyError = false
  currentTaskPoint.value.checkedIn = true
  if (!currentTaskPoint.value.checkedInAt) currentTaskPoint.value.checkedInAt = Date.now()
}

function simulateScanError() {
  if (!currentTaskPoint.value) return
  currentTaskPoint.value.verified = false
  currentTaskPoint.value.checkedIn = false
  currentTaskPoint.value.verifyError = true
  currentTaskPoint.value.checkedInAt = null
  currentTaskPoint.value.inspectionStatus = 'abnormal'
  currentTaskPoint.value.photos = []
  currentTaskPoint.value.remark = ''
  alert('打卡异常，点位码与当前点位不对应')
}

function setCurrentInspectionStatus(status: 'normal' | 'abnormal') {
  if (!currentTaskPoint.value) return
  if (!canEditInspectionContent.value) {
    alert('请先完成点位打卡')
    return
  }
  currentTaskPoint.value.inspectionStatus = status
}

function appendQuickRemark(text: string) {
  if (!currentTaskPoint.value) return
  if (!canEditInspectionContent.value) {
    alert('请先完成点位打卡')
    return
  }

  const current = currentTaskPoint.value.remark.trim()
  currentTaskPoint.value.remark = current ? `${current}；${text}` : text
}

function handleAnnotationScenario(event: Event) {
  const detail = (event as CustomEvent).detail
  if (detail?.page !== 'mobile-inspection-task' || detail?.reqId !== 2) return
  if (detail.scenario === 'scan-error') simulateScanError()
}

onMounted(() => {
  window.addEventListener('annotation:apply-scenario', handleAnnotationScenario)
})

onUnmounted(() => {
  window.removeEventListener('annotation:apply-scenario', handleAnnotationScenario)
})

function takePhoto() {
  if (!currentTaskPoint.value) return
  if (!canEditInspectionContent.value) {
    alert('请先完成点位打卡')
    return
  }
  if (currentTaskPoint.value.photos.length >= 6) return
  // 模拟拍照
  currentTaskPoint.value.photos.push(photoPlaceholders[currentTaskPoint.value.photos.length % photoPlaceholders.length])
}

function deletePhoto(idx: number) {
  if (!currentTaskPoint.value) return
  currentTaskPoint.value.photos.splice(idx, 1)
}

function formatTimestamp(timestamp: number) {
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatTimeOnly(timestamp: number) {
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function saveDraft() { alert('已暂存') }

function finishInspection() {
  if (!canFinishInspection.value) {
    alert('请完成所有点位的打卡、点位照片和巡检情况后再提交')
    return
  }
  // 添加到记录列表
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  const hasAbnormalPoint = orderedTaskPoints.value.some(p => p.inspectionStatus === 'abnormal')

  inspectionRecords.unshift({
    id: Date.now(),
    type: startForm.type,
    area: startForm.area,
    inspector: '张杨洲',
    time: timeStr,
    status: hasAbnormalPoint ? 'submitted' : 'completed',
    points: orderedTaskPoints.value.map(p => ({
      id: p.id,
      name: p.name,
      time: p.checkedInAt ? formatTimestamp(p.checkedInAt) : timeStr,
      pointStatus: p.inspectionStatus === 'normal' ? 'normal' : 'abnormal',
      status: p.remark || '无异常',
      photos: [...p.photos],
      rectification: {
        checkedIn: false,
        checkedInAt: null,
        photos: [],
        remark: ''
      }
    }))
  })

  if (hasAbnormalPoint) {
    alert(`本次巡检${orderedTaskPoints.value.filter(p => p.inspectionStatus === 'abnormal').length}处异常，请整改`)
  } else {
    alert('巡检提交成功')
  }
  goTo('records')
}

// ========== 巡检记录 ==========
const recordFilter = reactive({ type: '', time: '' })

const inspectionRecords = reactive([
  {
    id: 1,
    type: '日常巡检-物流园区',
    area: '物流园区',
    inspector: '张扬洲',
    time: '2026-01-01 08:00:00',
    status: 'completed',
    points: [
      { id: 1, name: '编组区', time: '2026-01-01 08:10:00', pointStatus: 'normal', status: '无异常', photos: ['/images/park.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
      { id: 2, name: '综合楼', time: '2026-01-01 08:20:00', pointStatus: 'normal', status: '无异常', photos: ['/images/jieshouzhan.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
      { id: 3, name: '仓库区', time: '2026-01-01 08:30:00', pointStatus: 'normal', status: '无异常', photos: ['/images/park.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
      { id: 4, name: '南门岗', time: '2026-01-01 08:40:00', pointStatus: 'normal', status: '无异常', photos: ['/images/jieshouzhan.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
    ]
  },
  {
    id: 2,
    type: '专项巡检-物流园区',
    area: '物流园区',
    inspector: '张扬洲',
    time: '2026-01-02 09:00:00',
    status: 'draft',
    points: [
      { id: 1, name: '编组区', time: '2026-01-02 09:10:00', pointStatus: 'normal', status: '无异常', photos: ['/images/park.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
      { id: 2, name: '综合楼', time: '2026-01-02 09:20:00', pointStatus: 'normal', status: '无异常', photos: ['/images/jieshouzhan.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
    ]
  },
  {
    id: 3,
    type: '日常巡检-接收站',
    area: '接收站',
    inspector: '马伟杜',
    time: '2026-01-03 07:30:00',
    status: 'submitted',
    points: [
      { id: 7, name: '泵房', time: '2026-01-03 07:40:00', pointStatus: 'normal', status: '无异常', photos: ['/images/jieshouzhan.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
      { id: 8, name: '编组区', time: '2026-01-03 07:50:00', pointStatus: 'abnormal', status: '灭火器压力不足', photos: ['/images/park.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
      { id: 9, name: '重车区', time: '2026-01-03 08:05:00', pointStatus: 'abnormal', status: '地面油污未清理', photos: ['/images/jieshouzhan.jpg'], rectification: { checkedIn: false, checkedInAt: null, photos: [], remark: '' } },
    ]
  }
])

const filteredRecords = computed(() => {
  return inspectionRecords.filter(r => {
    if (recordFilter.type && r.type !== recordFilter.type) return false
    return true
  })
})

// ========== 点位地图 ==========
const mapArea = ref('物流园区')
const currentMapPoints = computed(() => allPoints[mapArea.value as keyof typeof allPoints] || [])

// ========== 记录详情 ==========
const detailRecord = ref<InspectionRecord | null>(null)
const activeDetailPointIndex = ref(0)
const showRoutePreview = ref(false)
const previewPhoto = ref('')

function restoreTaskFromRecord(record: InspectionRecord) {
  startForm.type = record.type
  startForm.area = record.area
  startForm.points = record.points.map(point => String(point.id))
  taskPoints.value = record.points.map(point => ({
    id: point.id,
    name: point.name,
    verified: true,
    verifyError: false,
    checkedIn: true,
    checkedInAt: point.time ? new Date(point.time.replace(/-/g, '/')).getTime() : Date.now(),
    inspectionStatus: point.pointStatus === 'normal' ? 'normal' : 'abnormal',
    photos: [...point.photos],
    remark: point.status
  }))
  currentPointId.value = taskPoints.value[0]?.id || null
}

function viewRecordDetail(record: InspectionRecord) {
  if (record.status === 'draft') {
    restoreTaskFromRecord(record)
    goTo('task')
    return
  }
  detailRecord.value = record
  activeDetailPointIndex.value = 0
  goTo('detail')
}

const activeDetailPoint = computed(() =>
  detailRecord.value?.points?.[activeDetailPointIndex.value] || null
)

function selectDetailPoint(index: number) {
  activeDetailPointIndex.value = index
}

function isDetailPointAbnormal(point: RecordPoint) {
  return point.pointStatus === 'abnormal'
}

function detailPointStatusClass(point: RecordPoint) {
  return point.pointStatus === 'abnormal' ? 'status-abnormal-text' : 'status-normal-text'
}

const canEditRectification = computed(() => {
  return Boolean(activeDetailPoint.value && activeDetailPoint.value.pointStatus === 'abnormal')
})

const canAddRectificationContent = computed(() => {
  return Boolean(activeDetailPoint.value && activeDetailPoint.value.pointStatus === 'abnormal' && activeDetailPoint.value.rectification.checkedIn)
})

const canFinishRectification = computed(() => {
  if (!activeDetailPoint.value || activeDetailPoint.value.pointStatus !== 'abnormal') return false
  return activeDetailPoint.value.rectification.checkedIn &&
    activeDetailPoint.value.rectification.photos.length > 0 &&
    activeDetailPoint.value.rectification.remark.trim().length >= MIN_REMARK_LENGTH
})

function simulateRectificationCheckin() {
  if (!activeDetailPoint.value || activeDetailPoint.value.pointStatus !== 'abnormal') return
  activeDetailPoint.value.rectification.checkedIn = true
  activeDetailPoint.value.rectification.checkedInAt = activeDetailPoint.value.rectification.checkedInAt || Date.now()
}

function addRectificationPhoto() {
  if (!activeDetailPoint.value || !canAddRectificationContent.value) return
  if (activeDetailPoint.value.rectification.photos.length >= 6) return
  activeDetailPoint.value.rectification.photos.push(
    photoPlaceholders[activeDetailPoint.value.rectification.photos.length % photoPlaceholders.length]
  )
}

function deleteRectificationPhoto(idx: number) {
  if (!activeDetailPoint.value || activeDetailPoint.value.pointStatus !== 'abnormal') return
  activeDetailPoint.value.rectification.photos.splice(idx, 1)
}

const routeStartPoints: Record<string, { x: number; y: number }> = {
  '物流园区': { x: 80, y: 80 },
  '接收站': { x: 100, y: 100 }
}

function generateOrthogonalRoutePath(points: { x: number; y: number }[]): { x: number; y: number }[] {
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

const detailPoints = computed(() => {
  if (!detailRecord.value) return []
  const areaPoints = allPoints[detailRecord.value.area as keyof typeof allPoints] || []
  return detailRecord.value.points
    .map(point => areaPoints.find(areaPoint => areaPoint.name === point.name))
    .filter((point): point is { id: number; name: string; x: number; y: number } => Boolean(point))
})

const detailRoutePoints = computed(() => {
  if (!detailRecord.value) return []
  const start = routeStartPoints[detailRecord.value.area] || routeStartPoints['物流园区']
  return [
    { id: 0, name: '起点', x: start.x, y: start.y },
    ...detailPoints.value
  ]
})

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

function getRouteLabelWidth(name: string) {
  return Math.max(52, name.length * 12 + 16)
}

function openRoutePreview() {
  if (detailRoutePoints.value.length > 1) showRoutePreview.value = true
}

function getPointPhotos(point: RecordPoint, index: number) {
  if (point.photos.length > 0) return point.photos
  return [photoPlaceholders[index % photoPlaceholders.length]]
}

function openPhotoPreview(photo: string) {
  previewPhoto.value = photo
}

function finishRectification() {
  if (!detailRecord.value || !activeDetailPoint.value) return
  if (!canFinishRectification.value) {
    alert('请先完成整改打卡、整改照片和整改情况')
    return
  }

  activeDetailPoint.value.pointStatus = 'rectified'
  const abnormalLeft = detailRecord.value.points.some(point => point.pointStatus === 'abnormal')
  if (!abnormalLeft) {
    detailRecord.value.status = 'completed'
  }
  alert('整改完成')
}
</script>

<style scoped>
.mobile-shell { display: flex; justify-content: center; padding: 40px 0; }

/* ===== 通用头部 ===== */
.mh { display: flex; align-items: center; padding: 12px 14px; background: #fff; border-bottom: 1px solid #F1F5F9; gap: 8px; flex-shrink: 0; }
.mh-back { background: none; border: none; cursor: pointer; color: #334155; padding: 4px; border-radius: 6px; display: flex; }
.mh-title { flex: 1; font-size: 16px; font-weight: 700; color: #0F172A; }

/* ===== 首页 ===== */
.page-home { display: flex; flex-direction: column; min-height: 100%; }
.home-grid { display: flex; flex-direction: column; gap: 10px; padding: 18px 14px 24px; }
.home-action-primary { min-height: 96px; padding: 16px; border-radius: 8px; background: linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%); color: #fff; display: flex; align-items: center; gap: 12px; cursor: pointer; box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22); }
.home-action-primary:active { transform: translateY(1px); box-shadow: 0 6px 14px rgba(37, 99, 235, 0.2); }
.home-primary-icon { width: 54px; height: 54px; border-radius: 8px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.home-primary-copy { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.home-primary-arrow { width: 30px; height: 30px; border-radius: 999px; background: #fff; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.home-secondary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.home-card { cursor: pointer; transition: all 0.15s; }
.home-card-secondary { min-height: 82px; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; background: #fff; display: flex; justify-content: space-between; gap: 8px; }
.home-card-secondary:active { background: #F8FAFC; border-color: #2563EB; }
.home-secondary-copy { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.home-secondary-icon { align-self: center; width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.home-secondary-icon-blue { color: #2563EB; background: #EFF6FF; }
.home-secondary-icon-green { color: #10B981; background: #ECFDF5; }
.home-card-name { font-size: 15px; font-weight: 800; color: #0F172A; line-height: 1.2; }
.home-card-name-light { color: #fff; font-size: 18px; }
.home-card-desc { font-size: 11px; color: #64748B; line-height: 1.35; }
.home-card-desc-light { color: rgba(255,255,255,0.86); }

/* ===== 表单 ===== */
.form-area { padding: 16px 14px; flex: 1; }
.form-row { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #0F172A; margin-bottom: 6px; }
.form-select, .form-input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; color: #374151; background: #fff; appearance: auto; }
.form-select.disabled, .form-input.disabled { background: #F1F5F9; color: #64748B; }
.point-select-multi { height: auto; min-height: 140px; padding: 8px 0; }
.point-selects { display: flex; flex-direction: column; gap: 8px; }
.point-select-tips { font-size: 11px; color: #94A3B8; line-height: 1.5; }
.point-list { display: flex; flex-direction: column; gap: 8px; }
.point-row { width: 100%; padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.15s; text-align: left; }
.point-row:active { background: #F8FAFC; }
.point-row.selected { border-color: #2563EB; background: #EFF6FF; }
.point-row-name { font-size: 13px; font-weight: 600; color: #334155; }
.point-row.selected .point-row-name { color: #2563EB; }
.point-row-state { font-size: 11px; color: #94A3B8; }
.point-row.selected .point-row-state { color: #2563EB; }
.point-selected-list { display: flex; flex-wrap: wrap; gap: 8px; }
.point-selected-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid #BFDBFE; border-radius: 999px; background: #EFF6FF; color: #2563EB; font-size: 12px; font-weight: 600; cursor: pointer; }
.point-selected-chip-close { font-size: 14px; line-height: 1; }

/* ===== 巡检任务 ===== */
.page-task { display: flex; flex-direction: column; min-height: 100%; }
.point-progress { display: flex; gap: 0; padding: 0; overflow-x: auto; overflow-y: hidden; flex-shrink: 0; border-bottom: 1px solid #F1F5F9; -webkit-overflow-scrolling: touch; }
.point-tab { flex: 0 0 96px; width: 96px; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #64748B; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.point-order { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; border-radius: 999px; background: #E2E8F0; color: #475569; font-size: 11px; font-weight: 700; }
.point-order--done { background: #E2E8F0; color: #475569; }
.point-tab.active { color: #2563EB; border-bottom-color: #2563EB; }
.point-tab.done { background: #10B981; color: #fff; border-bottom-color: #10B981; }
.point-tab.done .point-order--done { background: rgba(255,255,255,0.22); color: #fff; }
.point-tab.abnormal { background: #EF4444; color: #fff; border-bottom-color: #EF4444; }
.point-tab.abnormal .point-order--done { background: rgba(255,255,255,0.2); color: #fff; }
.task-content { flex: 1; padding: 16px 14px; overflow-y: auto; }
.task-field { margin-bottom: 14px; }
.task-label { display: block; font-size: 12px; font-weight: 600; color: #64748B; margin-bottom: 6px; }
.scan-btn { width: 100%; height: 42px; border: none; border-radius: 10px; background: #2563EB; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; margin-bottom: 8px; box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2); }
.scan-btn:active { transform: translateY(1px); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.18); }
.task-status { font-size: 13px; color: #64748B; padding: 8px 12px; background: #F8FAFC; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.task-status-text { min-width: 0; }
.checkin-time-inline { font-size: 12px; font-weight: 600; color: inherit; opacity: 0.9; white-space: nowrap; }
.task-status.status-ok { color: #10B981; background: #ECFDF5; }
.task-status.status-error { color: #EF4444; background: #FEF2F2; }
.inspection-status-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.inspection-status-btn { height: 34px; border: 1px solid #E2E8F0; border-radius: 8px; background: #fff; color: #64748B; font-size: 13px; font-weight: 700; cursor: pointer; }
.inspection-status-btn.active { border-color: #10B981; background: #ECFDF5; color: #059669; }
.inspection-status-btn.abnormal.active { border-color: #EF4444; background: #FEF2F2; color: #EF4444; }
.inspection-status-btn:disabled { cursor: not-allowed; opacity: 0.5; background: #F1F5F9; }
.task-textarea { width: 100%; padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; font-family: inherit; resize: none; background: #F8FAFC; }
.task-textarea:focus { outline: none; border-color: #2563EB; }
.quick-remark-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.quick-remark-btn { padding: 6px 10px; border: 1px solid #BFDBFE; border-radius: 999px; background: #EFF6FF; color: #2563EB; font-size: 12px; font-weight: 600; cursor: pointer; }
.quick-remark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.quick-remark-btn:active { transform: translateY(1px); }

.photo-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.photo-item { position: relative; width: 72px; height: 72px; background: #ECFDF5; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.photo-taken-icon { font-size: 24px; color: #10B981; font-weight: 700; }
.photo-delete { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: #EF4444; color: #fff; border: none; border-radius: 50%; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
.photo-add { width: 72px; height: 72px; border: 2px dashed #D1D5DB; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; background: #F8FAFC; }
.photo-add:disabled { cursor: not-allowed; opacity: 0.5; background: #F1F5F9; }
.photo-add:active { background: #F1F5F9; }
.photo-add-text { font-size: 11px; color: #94A3B8; }
.photo-count { display: block; font-size: 11px; color: #94A3B8; margin-top: 6px; }
.field-hint { display: block; margin-top: 5px; font-size: 11px; color: #94A3B8; }

/* ===== 底部按钮 ===== */
.page-bottom { padding: 12px 14px; display: flex; gap: 10px; flex-shrink: 0; }
.btn-ghost { flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; border: none; background: #F1F5F9; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; text-align: center; }
.btn-brand { flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; border: none; background: #2563EB; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; text-align: center; }
.btn-brand:disabled { background: #E2E8F0; color: #94A3B8; cursor: not-allowed; }

/* ===== 巡检记录列表 ===== */
.page-records { display: flex; flex-direction: column; min-height: 100%; }
.filter-bar { display: flex; gap: 8px; padding: 10px 14px; flex-shrink: 0; }
.filter-mini { flex: 1; height: 32px; padding: 0 8px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 11px; color: #374151; background: #fff; }
.record-list { flex: 1; padding: 0 14px 14px; overflow-y: auto; }
.record-card { padding: 12px; background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; margin-bottom: 10px; cursor: pointer; }
.record-card:active { background: #F8FAFC; }
.record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.record-title { font-size: 14px; font-weight: 700; color: #0F172A; }
.record-status { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.status-completed { color: #10B981; background: #ECFDF5; }
.status-unfinished { color: #F59E0B; background: #FEF3C7; }
.status-abnormal { color: #EF4444; background: #FEF2F2; }
.record-row { display: flex; align-items: center; padding: 2px 0; }
.record-label { font-size: 12px; color: #94A3B8; }
.record-value { font-size: 12px; color: #374151; }
.record-result { display: inline-flex; align-items: center; flex-wrap: wrap; }
.record-result-normal { color: #10B981; font-weight: 700; }
.record-result-abnormal { color: #EF4444; font-weight: 700; }
.record-result-divider { color: #94A3B8; }
.record-result-rectified { color: #F59E0B; font-weight: 700; }
.record-link { margin-left: auto; font-size: 12px; color: #2563EB; font-weight: 600; }

/* ===== 点位地图 ===== */
.page-map { display: flex; flex-direction: column; min-height: 100%; }
.map-tabs { display: flex; padding: 0 14px; gap: 0; flex-shrink: 0; }
.map-tab { flex: 1; padding: 10px; text-align: center; font-size: 13px; font-weight: 600; color: #64748B; background: #F1F5F9; border: none; cursor: pointer; }
.map-tab.active { background: #2563EB; color: #fff; }
.map-container { flex: 1; position: relative; margin: 10px 14px; border-radius: 10px; overflow: hidden; background: #E5E7EB; }
.map-image { width: 100%; height: 100%; object-fit: contain; }
.map-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }

/* ===== 记录详情 ===== */
.page-detail { display: flex; flex-direction: column; min-height: 100%; }
.detail-content { flex: 1; padding: 14px; overflow-y: auto; }
.detail-info { background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
.detail-row { display: flex; align-items: center; padding: 6px 0; }
.detail-label { font-size: 12px; color: #94A3B8; width: 70px; flex-shrink: 0; }
.detail-value { font-size: 12px; color: #374151; font-weight: 500; }
.detail-section { margin-bottom: 12px; }
.section-title { font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 8px; }
.detail-map { position: relative; border-radius: 10px; overflow: hidden; background: #E5E7EB; height: 200px; cursor: zoom-in; }
.detail-map .map-image { height: 200px; }
.detail-map .map-svg { height: 200px; }
.zoom-tip { position: absolute; right: 8px; bottom: 8px; padding: 3px 8px; border-radius: 999px; background: rgba(15,23,42,0.7); color: #fff; font-size: 10px; font-weight: 700; }
.point-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.point-tag { padding: 6px 10px; border: 1px solid #A7F3D0; background: #ECFDF5; color: #059669; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; }
.point-tag.active { background: #10B981; color: #fff; border-color: #10B981; }
.point-tag.abnormal { border-color: #FCA5A5; background: #FEF2F2; color: #EF4444; }
.point-tag.abnormal.active { background: #EF4444; color: #fff; border-color: #EF4444; }
.point-tag.rectified { border-color: #FCD34D; background: #FFFBEB; color: #D97706; }
.point-tag.rectified.active { background: #F59E0B; color: #fff; border-color: #F59E0B; }
.point-tag-order { width: 16px; height: 16px; border-radius: 999px; background: #10B981; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; line-height: 1; }
.point-tag.abnormal .point-tag-order { background: #EF4444; }
.point-tag.rectified .point-tag-order { background: #F59E0B; }
.point-tag.active .point-tag-order { background: rgba(255,255,255,0.22); color: #fff; }
.detail-point-card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 10px 12px; background: #fff; }
.status-normal-text { color: #059669; font-weight: 700; }
.status-abnormal-text { color: #EF4444; font-weight: 700; }
.status-rectified-text { color: #D97706; font-weight: 700; }
.rectification-section { margin-top: 12px; padding: 12px; border: 1px solid #FDE68A; border-radius: 10px; background: #FFFBEB; }
.rectification-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #FDE68A; }
.rectification-head .section-title { margin-bottom: 0; color: #B45309; }
.rectification-tip { display: inline-flex; align-items: center; min-height: 24px; padding: 0 10px; border-radius: 999px; background: #FEF3C7; color: #B45309; font-size: 11px; font-weight: 700; }
.scan-btn-secondary { box-shadow: none; }
.rectification-status { margin-top: 8px; margin-bottom: 12px; padding: 9px 12px; border-radius: 8px; background: #FFF7ED; color: #9A3412; font-size: 12px; font-weight: 600; }
.rectification-status.active { background: #ECFDF5; color: #059669; }
.rectification-submit { margin-top: 6px; }
.rectification-summary { margin-top: 12px; padding: 12px; border: 1px solid #FDE68A; border-radius: 10px; background: #FFFBEB; }
.detail-photo-grid { display: flex; gap: 6px; flex-wrap: wrap; }
.detail-photo-thumb { width: 54px; height: 54px; padding: 0; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC; cursor: zoom-in; }
.detail-photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.preview-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(15,23,42,0.72); display: flex; align-items: center; justify-content: center; padding: 18px; }
.route-preview-box { position: relative; width: min(92vw, 760px); aspect-ratio: 6 / 5; border-radius: 16px; overflow: hidden; background: #E5E7EB; box-shadow: 0 24px 80px rgba(0,0,0,0.35); }
.preview-map-image, .preview-map-svg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.photo-preview-box { position: relative; max-width: min(92vw, 720px); max-height: 82vh; border-radius: 16px; overflow: hidden; background: #0F172A; box-shadow: 0 24px 80px rgba(0,0,0,0.35); }
.photo-preview-box img { display: block; max-width: 100%; max-height: 82vh; object-fit: contain; }
.preview-close { position: absolute; top: 10px; right: 10px; z-index: 2; width: 30px; height: 30px; border: none; border-radius: 50%; background: rgba(15,23,42,0.78); color: #fff; font-size: 20px; line-height: 1; cursor: pointer; }
</style>
