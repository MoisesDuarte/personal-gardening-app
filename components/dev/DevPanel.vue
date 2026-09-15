<script setup lang="ts">
import { formatAppDate, formatAppTime, calendarDateKey } from '~/utils/dates'
import type { DevCropOverride, DevTab } from '~/composables/useDevMode'

const { enabled, selectedGardenId, selectedPlotId, clockOverride, parameterOverrides, activeTab, expanded, revision, notifyChanged } = useDevMode()
const { garden, plots, cropTypes } = useGarden()
const { success, error: notifyError } = useGardenToast()
const inspection = ref<any>(null)
const loading = ref(false)
const clockDate = ref('')
const quickCropId = ref('')
const quickAge = ref(20)
const customEventAt = ref('')
const pendingDatabaseAction = ref<string | null>(null)
const wateringInterval = ref(1)
const fertilizingInterval = ref(1)
const harvestDays = ref(1)
const tabs: { id: DevTab; label: string }[] = [
  { id: 'state', label: 'State' }, { id: 'time', label: 'Time' }, { id: 'parameters', label: 'Parameters' },
  { id: 'events', label: 'Events' }, { id: 'scenarios', label: 'Scenarios' }, { id: 'database', label: 'Database' }, { id: 'raw', label: 'Raw' }
]
const scenarios = [
  ['normal', 'Normal'], ['water-today', 'Water today'], ['water-overdue', 'Water overdue'], ['fertilize-today', 'Fertilize today'],
  ['fertilize-overdue', 'Fertilize overdue'], ['water-fertilize', 'Water + fertilize'], ['harvest-soon', 'Harvest soon'], ['ready', 'Ready to harvest']
] as const
const contextPlot = computed(() => plots.value.find((plot) => plot.id === selectedPlotId.value) || null)
const contextPlanting = computed(() => inspection.value?.planting || contextPlot.value?.planting || null)
const contextLabel = computed(() => contextPlot.value ? `${String.fromCharCode(64 + contextPlot.value.row)}${contextPlot.value.column}` : '—')
const stateReasons = computed(() => {
  const planting = contextPlanting.value
  if (!planting) return []
  const reasons = []
  if (planting.needsWatering) reasons.push('needsWatering')
  if (planting.needsFertilizing) reasons.push('needsFertilizing')
  if (planting.state === 'NEAR_HARVEST') reasons.push('nearHarvest')
  if (planting.state === 'READY') reasons.push('readyForHarvest')
  return reasons
})
const effectiveCrop = computed(() => inspection.value?.effectiveCropType || contextPlanting.value?.cropType || null)
const persistedCrop = computed(() => inspection.value?.persistedCropType || contextPlanting.value?.cropType || null)
const rawJson = computed(() => JSON.stringify(inspection.value || { plot: contextPlot.value, planting: null }, null, 2))
const isActive = computed(() => contextPlanting.value?.status === 'ACTIVE')

function plotLabel(plot: { row: number; column: number }) { return `${String.fromCharCode(64 + plot.row)}${plot.column}` }
function syncParameterInputs() {
  const crop = effectiveCrop.value
  if (!crop) return
  wateringInterval.value = crop.defaultWateringIntervalDays
  fertilizingInterval.value = crop.defaultFertilizingIntervalDays
  harvestDays.value = crop.defaultHarvestDays
}
async function inspect() {
  if (!enabled.value || !selectedPlotId.value) { inspection.value = null; return }
  loading.value = true
  try { inspection.value = await $fetch(`/api/dev/inspect?plotId=${selectedPlotId.value}`); syncParameterInputs() }
  catch (cause: any) { inspection.value = null; notifyError('Não foi possível inspecionar a célula', cause?.data?.statusMessage || 'Tente novamente.') }
  finally { loading.value = false }
}
async function loadDevState() {
  if (!enabled.value) return
  try {
    const state = await $fetch<{ clockOverride: string | null; parameterOverrides: Record<string, DevCropOverride> }>('/api/dev/state')
    clockOverride.value = state.clockOverride
    parameterOverrides.value = state.parameterOverrides
    clockDate.value = state.clockOverride ? calendarDateKey(new Date(state.clockOverride)) : ''
  } catch (cause: any) { notifyError('Dev Mode indisponível', cause?.data?.statusMessage || 'Verifique DEV_MODE.') }
}
async function run(label: string, action: () => Promise<unknown>) {
  try { await action(); success(label); notifyChanged(); await inspect() }
  catch (cause: any) { notifyError(label, cause?.data?.statusMessage || 'Não foi possível concluir a operação.') }
}
async function setClock(date = clockDate.value || null) {
  await run('Clock changed', async () => {
    const result = await $fetch<{ clockOverride: string | null }>('/api/dev/clock', { method: 'POST', body: { date } })
    clockOverride.value = result.clockOverride
    clockDate.value = result.clockOverride ? calendarDateKey(new Date(result.clockOverride)) : ''
  })
}
function shiftClock(days: number) {
  const base = clockDate.value ? new Date(`${clockDate.value}T12:00:00.000Z`) : new Date()
  clockDate.value = calendarDateKey(new Date(base.getTime() + days * 24 * 60 * 60 * 1000))
  setClock()
}
async function resetOverrides() {
  await run('Dev overrides reset', async () => {
    await Promise.all([
      $fetch('/api/dev/clock', { method: 'POST', body: { date: null } }),
      $fetch('/api/dev/parameters/reset', { method: 'POST', body: {} })
    ])
    clockOverride.value = null; clockDate.value = ''; parameterOverrides.value = {}
  })
}
async function applyParameters() {
  if (!persistedCrop.value) return
  await run('Runtime parameters applied', async () => {
    const result = await $fetch<{ parameterOverrides: Record<string, any> }>('/api/dev/parameters', { method: 'POST', body: { cropTypeId: persistedCrop.value.id, wateringIntervalDays: Number(wateringInterval.value), fertilizingIntervalDays: Number(fertilizingInterval.value), harvestDays: Number(harvestDays.value) } })
    parameterOverrides.value = result.parameterOverrides
  })
}
async function saveParameters() {
  if (!persistedCrop.value) return
  await run('CropType persisted', async () => {
    const result = await $fetch<{ parameterOverrides: Record<string, DevCropOverride> }>('/api/dev/parameters/persist', { method: 'POST', body: { cropTypeId: persistedCrop.value.id, wateringIntervalDays: Number(wateringInterval.value), fertilizingIntervalDays: Number(fertilizingInterval.value), harvestDays: Number(harvestDays.value) } })
    parameterOverrides.value = result.parameterOverrides
  })
}
async function resetParameters() {
  await run('Runtime parameters reset', async () => {
    const result = await $fetch<{ parameterOverrides: Record<string, DevCropOverride> }>('/api/dev/parameters/reset', { method: 'POST', body: { cropTypeId: persistedCrop.value?.id } })
    parameterOverrides.value = result.parameterOverrides
  })
}
async function quickPlant() {
  if (!contextPlot.value || !quickCropId.value) return
  await run('Quick plant created', async () => {
    await $fetch('/api/dev/quick-plant', { method: 'POST', body: { plotId: contextPlot.value!.id, cropTypeId: quickCropId.value, ageDays: Number(quickAge.value) } })
  })
}
async function addEvent(type: 'WATERING' | 'FERTILIZING' | 'HARVEST' | 'REMOVAL') {
  if (!contextPlanting.value) return
  await run(`${type} event added`, async () => {
    await $fetch(`/api/plantings/${contextPlanting.value!.id}/events`, { method: 'POST', body: { type, ...(customEventAt.value ? { performedAt: new Date(customEventAt.value).toISOString() } : {}) } })
  })
}
async function applyScenario(scenario: string) {
  if (!contextPlot.value) return
  await run('Scenario applied', async () => { await $fetch('/api/dev/scenario', { method: 'POST', body: { plotId: contextPlot.value!.id, scenario } }) })
}
async function setPlantedAt(value: string) {
  if (!contextPlot.value || !value) return
  await run('Planted date changed', async () => { await $fetch('/api/dev/planting', { method: 'POST', body: { plotId: contextPlot.value!.id, plantedAt: value } }) })
}
async function databaseAction(action: string) {
  if (!contextPlot.value && action !== 'reset-garden') return
  if (action === 'reset-garden' && !selectedGardenId.value) return
  const destructive = ['clear-plot', 'reset-planting', 'reset-garden'].includes(action)
  if (destructive) { pendingDatabaseAction.value = action; return }
  await executeDatabaseAction(action)
}
async function executeDatabaseAction(action: string) {
  pendingDatabaseAction.value = null
  await run('Database operation completed', async () => { await $fetch('/api/dev/database', { method: 'POST', body: { action, plotId: contextPlot.value?.id, gardenId: selectedGardenId.value } }) })
}
function databaseActionLabel(action: string | null) { return action === 'reset-garden' ? 'resetar a horta selecionada' : action === 'clear-plot' ? 'limpar a célula selecionada' : 'resetar o plantio selecionado' }
async function copyRaw() {
  await navigator.clipboard.writeText(rawJson.value)
  success('JSON copied')
}

watch([selectedPlotId, revision], inspect)
watch(() => effectiveCrop.value?.id, syncParameterInputs)
watch(() => plots.value.length, () => { if (!selectedPlotId.value && plots.value[0]) selectedPlotId.value = plots.value[0].id })
watch([activeTab, expanded], () => { if (import.meta.client) { sessionStorage.setItem('cultiva-dev-tab', activeTab.value); sessionStorage.setItem('cultiva-dev-expanded', String(expanded.value)) } })
onMounted(async () => {
  const savedTab = sessionStorage.getItem('cultiva-dev-tab') as DevTab | null
  if (savedTab && tabs.some((tab) => tab.id === savedTab)) activeTab.value = savedTab
  const savedExpanded = sessionStorage.getItem('cultiva-dev-expanded')
  if (savedExpanded !== null) expanded.value = savedExpanded !== 'false'
  await loadDevState(); if (!selectedPlotId.value && plots.value[0]) selectedPlotId.value = plots.value[0].id; await inspect()
})
</script>

<template>
  <section v-if="enabled" class="dev-panel" :class="{ collapsed: !expanded }" aria-label="Development tools">
    <div class="dev-panel-bar">
      <button class="dev-panel-toggle" :aria-expanded="expanded" @click="expanded = !expanded"><span aria-hidden="true">🛠</span> DEV MODE <span class="dev-panel-context">{{ garden?.name || 'No garden' }} · {{ contextLabel }}</span><span aria-hidden="true">{{ expanded ? '⌄' : '⌃' }}</span></button>
      <span v-if="clockOverride" class="dev-override-badge">⚡ CLOCK OVERRIDE {{ formatAppDate(clockOverride) }}</span>
    </div>
    <div v-if="expanded" class="dev-panel-body">
      <div class="dev-context-row"><label>Garden<select v-model="selectedGardenId"><option :value="garden?.id">{{ garden?.name || 'No garden' }}</option></select></label><label>Plot<select v-model="selectedPlotId"><option v-for="plot in plots" :key="plot.id" :value="plot.id">{{ plotLabel(plot) }} · {{ plot.planting?.cropType.name || 'FREE' }}</option></select></label><span v-if="loading" class="dev-loading">Inspecting…</span></div>
      <nav class="dev-tabs" aria-label="Development sections"><button v-for="tab in tabs" :key="tab.id" :aria-selected="activeTab === tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button></nav>
      <div class="dev-content">
        <div v-if="activeTab === 'state'" class="dev-grid-content"><div><h3>Derived state</h3><dl class="dev-definition-list"><template v-if="contextPlanting"><dt>Planting ID</dt><dd>{{ contextPlanting.id }}</dd><dt>Status</dt><dd>{{ contextPlanting.status }}</dd><dt>Planted at</dt><dd>{{ formatAppDate(contextPlanting.plantedAt) }} · {{ contextPlanting.plantedAt }}</dd><dt>Age</dt><dd>{{ contextPlanting.ageInDays }} days</dd><dt>Needs watering</dt><dd>{{ contextPlanting.needsWatering }}</dd><dt>Next watering</dt><dd>{{ formatAppDate(contextPlanting.nextWateringAt) }} · {{ contextPlanting.wateringDaysUntil }} days</dd><dt>Needs fertilizing</dt><dd>{{ contextPlanting.needsFertilizing }}</dd><dt>Next fertilizing</dt><dd>{{ formatAppDate(contextPlanting.nextFertilizingAt) }} · {{ contextPlanting.fertilizingDaysUntil }} days</dd><dt>Expected harvest</dt><dd>{{ formatAppDate(contextPlanting.expectedHarvestAt) }} · {{ contextPlanting.daysToHarvest }} days</dd><dt>Harvest status</dt><dd>{{ contextPlanting.state }}</dd><dt>Needs care</dt><dd>{{ contextPlanting.needsCare }}</dd></template><template v-else><dt>Status</dt><dd>FREE</dd></template></dl></div><div><h3>Filter classification</h3><dl class="dev-definition-list"><dt>All</dt><dd>true</dd><dt>Free</dt><dd>{{ !contextPlanting }}</dd><dt>Needs care</dt><dd>{{ Boolean(contextPlanting?.needsCare) }}</dd><dt>Reasons</dt><dd>{{ stateReasons.length ? stateReasons.join(', ') : '—' }}</dd><dt>Expected indicators</dt><dd>{{ contextPlanting?.needsWatering ? 'WATERING_DUE ' : '' }}{{ contextPlanting?.needsFertilizing ? 'FERTILIZING_DUE ' : '' }}{{ contextPlanting?.state === 'READY' ? 'READY_FOR_HARVEST' : contextPlanting?.state === 'NEAR_HARVEST' ? 'NEAR_HARVEST' : '' }}</dd></dl></div></div>
        <div v-else-if="activeTab === 'time'" class="dev-form"><h3>Application date</h3><p class="dev-help">Overrides only the application clock. Historical timestamps remain unchanged.</p><div class="dev-inline-form"><label><input v-model="clockDate" type="date" /></label><button @click="setClock()">Apply</button><button @click="shiftClock(1)">Today +1</button><button @click="shiftClock(7)">Today +7</button><button @click="shiftClock(30)">Today +30</button><button class="dev-muted-button" @click="setClock(null)">Reset</button></div><p>Current: <strong>{{ clockOverride ? formatAppDate(clockOverride) : 'Real time' }}</strong></p></div>
        <div v-else-if="activeTab === 'parameters'" class="dev-form"><h3>Parameters <span v-if="parameterOverrides[persistedCrop?.id || '']" class="dev-override-badge">⚡ DEV OVERRIDE</span></h3><p v-if="!persistedCrop">Select an active planting.</p><template v-else><p class="dev-help">{{ persistedCrop.name }} · Default values are persisted in CropType; overrides affect runtime calculations only.</p><div class="dev-fields"><label>Watering interval <small>Default: {{ persistedCrop.defaultWateringIntervalDays }} days</small><input v-model.number="wateringInterval" type="number" min="1" max="365" /></label><label>Fertilizing interval <small>Default: {{ persistedCrop.defaultFertilizingIntervalDays }} days</small><input v-model.number="fertilizingInterval" type="number" min="1" max="365" /></label><label>Harvest cycle <small>Default: {{ persistedCrop.defaultHarvestDays }} days</small><input v-model.number="harvestDays" type="number" min="1" max="730" /></label></div><div class="dev-actions"><button @click="applyParameters">Apply runtime override</button><button @click="saveParameters">Save to CropType</button><button class="dev-muted-button" @click="resetParameters">Reset defaults</button></div></template></div>
        <div v-else-if="activeTab === 'events'" class="dev-form"><h3>Add event</h3><p v-if="!isActive" class="dev-help">Select an active planting to use the real event endpoint.</p><template v-else><label>Performed at <input v-model="customEventAt" type="datetime-local" /><small>Leave empty to use clock.now().</small></label><div class="dev-actions"><button @click="addEvent('WATERING')">💧 Watering</button><button @click="addEvent('FERTILIZING')">🌱 Fertilizing</button><button @click="addEvent('HARVEST')">🧺 Harvest</button><button class="dev-danger-button" @click="addEvent('REMOVAL')">Remove plant</button></div></template><h3 class="dev-subheading">Care events</h3><div class="dev-event-list"><div v-for="event in inspection?.lastEvents || []" :key="event.id"><strong>{{ event.type }}</strong><span>{{ event.id }}</span><time>{{ formatAppDate(event.performedAt) }} · {{ formatAppTime(event.performedAt) }}</time></div><p v-if="!inspection?.lastEvents?.length">No events.</p></div></div>
        <div v-else-if="activeTab === 'scenarios'" class="dev-form"><h3>Scenarios</h3><p class="dev-help">Scenarios adjust planted date and real care events; no artificial state flags are created.</p><div class="dev-actions dev-scenario-grid"><button v-for="scenario in scenarios" :key="scenario[0]" :disabled="!isActive" @click="applyScenario(scenario[0])">{{ scenario[1] }}</button></div><h3 class="dev-subheading">Quick plant</h3><div v-if="!contextPlanting" class="dev-fields"><label>Crop<select v-model="quickCropId"><option value="" disabled>Select crop</option><option v-for="crop in cropTypes.filter((item) => item.isActive)" :key="crop.id" :value="crop.id">{{ crop.name }}</option></select></label><label>Age in days<input v-model.number="quickAge" type="number" min="0" max="3650" /></label><button @click="quickPlant">Create</button></div><p v-else class="dev-help">The selected plot is occupied. Use Database to reset it or choose a free plot.</p></div>
        <div v-else-if="activeTab === 'database'" class="dev-form"><h3>Development overrides</h3><div class="dev-actions"><button @click="resetOverrides">Reset Dev Overrides</button><button @click="setPlantedAt(clockDate || calendarDateKey(new Date()))" :disabled="!isActive">Set planted at application date</button></div><h3 class="dev-subheading">Danger zone</h3><div class="dev-actions"><button :disabled="!contextPlanting" @click="databaseAction('delete-last-event')">Delete last event</button><button :disabled="!contextPlanting" @click="databaseAction('clear-events')">Clear care events</button><button :disabled="!contextPlanting" class="dev-danger-button" @click="databaseAction('reset-planting')">Reset selected planting</button><button :disabled="!contextPlanting" class="dev-danger-button" @click="databaseAction('clear-plot')">Clear selected plot</button><button :disabled="!selectedGardenId" class="dev-danger-button" @click="databaseAction('reset-garden')">Reset garden</button></div></div>
        <div v-else class="dev-raw"><div class="dev-raw-heading"><h3>Inspector JSON</h3><button @click="copyRaw">Copy JSON</button></div><pre>{{ rawJson }}</pre></div>
      </div>
    </div>
    <UiDialog :open="Boolean(pendingDatabaseAction)" title="Confirmar operação" description="Esta ação altera dados persistidos." @update:open="pendingDatabaseAction = $event ? pendingDatabaseAction : null">
      <div class="dev-confirmation"><p>Deseja {{ databaseActionLabel(pendingDatabaseAction) }}?</p><div><button class="dev-muted-button" @click="pendingDatabaseAction = null">Cancelar</button><button class="dev-danger-button" @click="executeDatabaseAction(pendingDatabaseAction!)">Continuar</button></div></div>
    </UiDialog>
  </section>
</template>

<style scoped>
.dev-panel { position:fixed; right:0; bottom:0; left:0; z-index:45; border-top:2px solid #b58725; background:#192521; color:#edf5ed; box-shadow:0 -8px 28px #101b1833; }
.dev-panel.collapsed .dev-panel-bar { border-bottom:0; }.dev-panel-bar { display:flex; min-height:38px; align-items:center; justify-content:space-between; gap:16px; padding:0 14px; }.dev-panel-toggle { display:flex; min-height:36px; align-items:center; gap:7px; border:0; background:none; color:#fff6d4; font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--weight-bold); letter-spacing:.02em; line-height:var(--leading-normal); }.dev-panel-toggle:focus-visible,.dev-tabs button:focus-visible,.dev-actions button:focus-visible,.dev-raw-heading button:focus-visible { outline:2px solid #f5d36a; outline-offset:2px; }.dev-panel-context { color:#a9b9ad; font-weight:var(--weight-regular); }.dev-override-badge { display:inline-flex; width:max-content; align-items:center; border:1px solid #9c7c2d; border-radius:3px; padding:4px 7px; color:#f5d36a; font-family:var(--font-mono); font-size:var(--text-xs); font-weight:var(--weight-medium); font-variant-numeric:tabular-nums; white-space:nowrap; }.dev-panel-body { max-height:35vh; overflow:auto; border-top:1px solid #30423a; }.dev-context-row { display:flex; align-items:end; gap:8px; padding:8px 14px; border-bottom:1px solid #30423a; }.dev-context-row label,.dev-fields label,.dev-form > label { display:flex; min-width:150px; flex-direction:column; gap:5px; color:#b8c9bb; font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--weight-medium); letter-spacing:.04em; text-transform:uppercase; }.dev-context-row select,.dev-fields input,.dev-fields select,.dev-form input { min-height:31px; border:1px solid #52675b; border-radius:3px; background:#263a31; color:#f2f7ef; padding:5px 7px; font-size:var(--text-xs); text-transform:none; }.dev-loading { padding-bottom:8px; color:#a9b9ad; font-size:var(--text-xs); }.dev-tabs { display:flex; gap:2px; overflow:auto; padding:0 14px; border-bottom:1px solid #30423a; }.dev-tabs button { min-height:33px; border:0; border-bottom:2px solid transparent; background:none; color:#9eb0a3; padding:5px 9px; font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--weight-medium); white-space:nowrap; }.dev-tabs button:hover,.dev-tabs button.active { color:#fff6d4; }.dev-tabs button.active { border-bottom-color:#f5d36a; }.dev-content { padding:10px 14px 13px; }.dev-content h3 { margin:0 0 11px; color:#fff; font-size:var(--text-lg); font-weight:var(--weight-semibold); line-height:var(--leading-tight); }.dev-help,.dev-form p { margin:0 0 9px; color:#a9b9ad; font-size:var(--text-xs); line-height:var(--leading-relaxed); }.dev-grid-content { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr); gap:20px; }.dev-definition-list { display:grid; grid-template-columns:minmax(130px,.5fr) minmax(0,1fr); margin:0; border-top:1px solid #30423a; }.dev-definition-list dt,.dev-definition-list dd { margin:0; padding:4px 0; border-bottom:1px solid #30423a; font-size:var(--text-xs); line-height:var(--leading-normal); }.dev-definition-list dt { color:#91a497; }.dev-definition-list dd { overflow-wrap:anywhere; color:#edf5ed; font-family:var(--font-mono); font-variant-numeric:tabular-nums; }.dev-inline-form,.dev-actions { display:flex; flex-wrap:wrap; align-items:end; gap:8px; }.dev-inline-form button,.dev-actions button,.dev-raw-heading button { min-height:36px; border:1px solid #607466; border-radius:3px; background:#30483b; color:#f2f7ef; padding:7px 11px; font-size:var(--text-xs); font-weight:var(--weight-semibold); line-height:var(--leading-normal); }.dev-inline-form button:hover,.dev-actions button:hover,.dev-raw-heading button:hover { background:#3c5a49; }.dev-muted-button { background:transparent !important; color:#b8c9bb !important; }.dev-danger-button { border-color:#a45b4d !important; background:#5c312c !important; color:#ffdcd4 !important; }.dev-form > p:last-child { margin-top:13px; }.dev-fields { display:flex; flex-wrap:wrap; align-items:end; gap:8px; margin-bottom:9px; }.dev-fields label { min-width:155px; }.dev-fields small { color:#82998a; font-size:11px; text-transform:none; }.dev-subheading { margin-top:14px !important; padding-top:10px; border-top:1px solid #30423a; }.dev-event-list { max-height:125px; overflow:auto; border-top:1px solid #30423a; }.dev-event-list > div { display:grid; grid-template-columns:130px 1fr auto; gap:10px; padding:7px 0; border-bottom:1px solid #30423a; color:#dce9dc; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }.dev-event-list span { overflow:hidden; color:#91a497; text-overflow:ellipsis; }.dev-event-list time { color:#a9b9ad; }.dev-event-list p { padding:8px 0; }.dev-scenario-grid { max-width:850px; }.dev-raw-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }.dev-raw pre { max-height:280px; overflow:auto; margin:0; border:1px solid #30423a; border-radius:3px; background:#101b18; padding:13px; color:#dce9dc; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; line-height:var(--leading-relaxed); white-space:pre-wrap; }.dev-panel button:disabled { cursor:not-allowed; opacity:.45; }.dev-panel.collapsed { box-shadow:0 -3px 14px #101b1833; }.dev-confirmation p { margin:0 0 18px; color:var(--ink); font-size:var(--text-md); line-height:var(--leading-relaxed); }.dev-confirmation > div { display:flex; justify-content:flex-end; gap:8px; }
 .dev-fields small { font-size:var(--text-xs); }

@media (max-width:720px) {
  .dev-panel-bar { min-height:46px; padding:0 10px; }.dev-panel-toggle { min-height:44px; gap:9px; font-size:12px; }.dev-panel-context { display:none; }.dev-panel-body { max-height:58vh; }.dev-context-row { align-items:stretch; flex-direction:column; gap:10px; padding:12px 18px; }.dev-context-row label { width:100%; }.dev-context-row select,.dev-fields input,.dev-fields select,.dev-form input { min-height:34px; padding:6px 8px; }.dev-tabs { padding:0 18px; }.dev-tabs button { min-height:38px; padding:6px 11px; }.dev-content { padding:15px 18px 18px; }.dev-grid-content { grid-template-columns:1fr; gap:20px; }.dev-definition-list { grid-template-columns:120px minmax(0,1fr); }.dev-definition-list dt,.dev-definition-list dd { padding:6px 0; }.dev-event-list > div { grid-template-columns:1fr; gap:3px; }.dev-event-list time { text-align:left; }.dev-fields { gap:12px; margin-bottom:13px; }.dev-fields label { width:100%; min-width:180px; }.dev-inline-form label input { width:100%; }.dev-subheading { margin-top:20px !important; padding-top:15px; }
}
.dev-panel-toggle { font-size:var(--text-xs); }
</style>
