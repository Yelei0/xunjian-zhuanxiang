import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const mobilePage = readFileSync('src/pages/mobile-inspection/index.vue', 'utf8')
const phoneFrame = readFileSync('skills/phone-frame/PhoneFrame.vue', 'utf8')

assert.match(
  phoneFrame,
  /\.phone-frame-wrapper\s*\{[\s\S]*position:\s*relative;/,
  'PhoneFrame should provide a relative positioning boundary for in-phone overlays.'
)

assert.doesNotMatch(
  mobilePage,
  /\balert\s*\(/,
  'Mobile inspection page should use an in-phone dialog instead of browser alert().'
)

assert.match(
  mobilePage,
  /const phoneDialog = reactive/,
  'Mobile inspection page should define a reusable phone dialog state.'
)

assert.match(
  mobilePage,
  /function showPhoneDialog/,
  'Mobile inspection page should expose a reusable showPhoneDialog helper.'
)

assert.match(
  mobilePage,
  /\.preview-overlay\s*\{[^}]*position:\s*absolute;/,
  'Mobile preview overlays should be scoped inside the phone frame instead of fixed to the browser viewport.'
)

assert.match(
  mobilePage,
  /class="phone-dialog"/,
  'Mobile inspection page should render an in-phone dialog panel.'
)

assert.match(
  mobilePage,
  /\.phone-dialog\s*\{/,
  'Mobile inspection page should style the in-phone dialog panel.'
)

console.log('Mobile phone dialog and overlay scope checks passed.')
