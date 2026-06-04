<template>
  <div class="phone-frame-wrapper">
    <!-- 状态栏 -->
    <div class="phone-status-bar">
      <span class="phone-time">9:41</span>
      <span class="phone-notch"></span>
      <span class="phone-icons">📶 🔋</span>
    </div>
    <!-- 内容区 -->
    <div class="phone-content">
      <slot />
    </div>
    <!-- 底部导航条（可选） -->
    <div v-if="$slots.nav" class="phone-nav">
      <slot name="nav" />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.phone-frame-wrapper {
  width: 375px;
  height: 780px;
  border: 2px solid #333;
  border-radius: 40px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 8px #1a1a1a, 0 0 0 10px #333, 0 8px 32px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.phone-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #000;
  background: #fff;
  flex-shrink: 0;
}

.phone-notch {
  width: 120px;
  height: 25px;
  background: #000;
  border-radius: 0 0 16px 16px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
}

.phone-status-bar {
  position: relative;
  padding-top: 30px;
}

.phone-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.phone-nav {
  border-top: 1px solid #e5e5e5;
  flex-shrink: 0;
}
</style>
