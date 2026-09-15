<script setup lang="ts">
import type { Garden, HistoricalPlanting, Planting, Plot } from '~/types/domain'

const route = useRoute()
const router = useRouter()
const { garden, plots, cropTypes, loading, error, loadGarden, loadCropTypes } = useGarden()
const { setContext, revision } = useDevMode()
const { success, error: notifyError } = useGardenToast()
const gardenOptions = ref<Garden[]>([])
const selectedPlot = ref<Plot | null>(null)
const activeFilter = ref<'all' | 'empty' | 'NEEDS_WATERING'>('all')
const popoverPosition = ref<{ top: number; left: number }>()
const historyOpen = ref(false)
const historyPlanting = ref<(Plot['planting'] | HistoricalPlanting)>(null)
const historyReturnTarget = ref<HTMLElement | null>(null)
const completedOpen = ref(false)
const completedLoading = ref(false)
const completedPlantings = ref<HistoricalPlanting[]>([])
const createOpen = ref(false)
const activeCount = computed(() => plots.value.filter((plot) => plot.planting).length)
const freeCount = computed(() => plots.value.filter((plot) => !plot.planting).length)
const needsCare = computed(() => plots.value.filter((plot) => plot.planting?.needsCare).length)
const filterEmptyMessage = computed(() => activeFilter.value === 'empty' && freeCount.value === 0 ? '✓ Nenhum bloco livre agora.' : activeFilter.value === 'NEEDS_WATERING' && needsCare.value === 0 ? '✓ Nenhuma planta precisa de cuidado agora.' : '')
const historyCellLabel = computed(() => {
  const planting = historyPlanting.value
  if (!planting) return undefined
  if ('plot' in planting) return `${String.fromCharCode(64 + planting.plot.row)}${planting.plot.column}`
  const plot = plots.value.find((item) => item.planting?.id === planting.id)
  return plot ? `${String.fromCharCode(64 + plot.row)}${plot.column}` : undefined
})

function currentGardenId() { return String(route.params.id) }
function closePanel() {
  const plotId = selectedPlot.value?.id
  selectedPlot.value = null
  popoverPosition.value = undefined
  nextTick(() => (plotId ? document.querySelector(`[data-plot-id="${plotId}"]`) as HTMLElement | null : null)?.focus())
}
function selectPlot(plot: Plot) {
  selectedPlot.value = plot
  if (garden.value) setContext(garden.value.id, plot.id)
  nextTick(() => {
    const target = document.querySelector(`[data-plot-id="${plot.id}"]`) as HTMLElement | null
    let rect = target?.getBoundingClientRect()
    const panelReserve = 540
    if (target && window.innerWidth > 720 && rect && rect.bottom + panelReserve > window.innerHeight - 16) {
      target.scrollIntoView({ block: 'center', inline: 'nearest' })
      rect = target.getBoundingClientRect()
    }
    popoverPosition.value = {
      top: rect ? Math.max(16, rect.top) : 80,
      left: rect ? rect.right : 24,
    }
  })
}
async function refresh(action: 'WATERING' | 'FERTILIZING' | 'HARVEST' | 'REMOVAL', updated?: Planting) {
  const selectedId = selectedPlot.value?.id
  if (updated) {
    const current = plots.value.find((plot) => plot.id === updated.plotId)
    if (current) {
      const next = { ...current, planting: updated.status === 'ACTIVE' ? updated : null }
      plots.value = plots.value.map((plot) => plot.id === current.id ? next : plot)
      selectedPlot.value = next
    }
  }
  await loadGarden(currentGardenId())
  if (action === 'HARVEST' || action === 'REMOVAL') {
    if (completedOpen.value) await loadCompleted()
    return closePanel()
  }
  selectedPlot.value = plots.value.find((plot) => plot.id === selectedId) || null
}
async function loadCompleted() {
  completedLoading.value = true
  try { completedPlantings.value = await $fetch<HistoricalPlanting[]>(`/api/gardens/${currentGardenId()}/plantings/history`) }
  catch { notifyError('Não foi possível carregar o histórico', 'Tente novamente em instantes.') }
  finally { completedLoading.value = false }
}
async function syncPlot(plotId: string) {
  await loadGarden(currentGardenId())
  const current = plots.value.find((plot) => plot.id === plotId)
  if (current) selectPlot(current)
}
function openCompletedHistory() { completedOpen.value = true; loadCompleted() }
function openHistory(planting: NonNullable<Plot['planting']>) {
  historyReturnTarget.value = document.activeElement as HTMLElement | null
  historyPlanting.value = planting
  historyOpen.value = true
}
function openHistoricalPlanting(planting: HistoricalPlanting) {
  completedOpen.value = false
  historyReturnTarget.value = null
  historyPlanting.value = planting
  historyOpen.value = true
}
function closeHistory(open: boolean) {
  historyOpen.value = open
  if (!open) nextTick(() => historyReturnTarget.value?.focus())
}
function switchGarden(id: string) { if (id && id !== currentGardenId()) router.push(`/gardens/${id}`) }
function onGardenChange(event: Event) { switchGarden((event.target as HTMLSelectElement).value) }
function onGardenCreated(id: string) {
  createOpen.value = false
  success('Horta criada', 'Sua nova horta está pronta para receber plantios.')
  router.push(`/gardens/${id}`)
}
async function loadOptions() { gardenOptions.value = await $fetch<Garden[]>('/api/gardens') }
async function loadCurrent() {
  await Promise.all([loadGarden(currentGardenId()), loadCropTypes(), loadOptions()])
  if (import.meta.client) localStorage.setItem('cultiva-selected-garden', currentGardenId())
  if (garden.value) setContext(garden.value.id, selectedPlot.value?.id || null)
  const plotId = String(route.query.plotId || '')
  if (plotId) {
    await nextTick()
    const target = plots.value.find((plot) => plot.id === plotId)
    if (target) selectPlot(target)
  }
}
watch(revision, async () => { await loadGarden(currentGardenId()); if (completedOpen.value) await loadCompleted(); if (selectedPlot.value) selectedPlot.value = plots.value.find((plot) => plot.id === selectedPlot.value?.id) || null })
watch(() => route.params.id, async (id, previous) => {
  if (id === previous) return
  closePanel(); historyOpen.value = false; completedOpen.value = false; historyPlanting.value = null; historyReturnTarget.value = null; activeFilter.value = 'all'
  await loadCurrent()
})
onMounted(loadCurrent)
</script>

<template>
  <AppShell>
    <div v-if="loading" class="loading-card">Abrindo sua horta…</div>
    <div v-else-if="garden" class="garden-layout">
      <section class="garden-main">
        <div class="context-breadcrumb"><NuxtLink to="/gardens">Hortas</NuxtLink><span>/</span><strong>{{ garden.name }}</strong></div>
        <div class="garden-heading">
          <div>
            <label class="garden-current-label" for="garden-switcher">HORTA ATUAL</label>
            <select id="garden-switcher" class="garden-switcher" :value="garden.id" aria-label="Selecionar horta" @change="onGardenChange">
              <option v-for="option in gardenOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
            </select>
            <h1>{{ garden.name }}</h1>
            <p class="subtitle">{{ garden.rows }} × {{ garden.columns }} blocos <span class="dot-separator">·</span> Uma visão viva da sua horta</p>
          </div>
          <div class="garden-header-actions"><UiButton variant="outline" @click="openCompletedHistory">Histórico de cultivos</UiButton><UiButton :disabled="!freeCount" @click="selectPlot(plots.find((plot) => !plot.planting) || plots[0] || null!)">+ Novo plantio</UiButton><UiButton variant="ghost" @click="createOpen = true">Nova horta</UiButton></div>
        </div>
        <GardenFilters v-model="activeFilter" :total="plots.length" :free="freeCount" :care="needsCare" />
        <div class="grid-card"><div class="garden-grid-viewport"><GardenGrid :rows="garden.rows" :columns="garden.columns" :plots="plots" :filter="activeFilter" :selected-plot-id="selectedPlot?.id" @select="selectPlot" /></div><p v-if="filterEmptyMessage" class="filter-empty-message" aria-live="polite">{{ filterEmptyMessage }}</p><div class="grid-caption"><span><i class="tiny-sprout">✳</i> Selecione uma célula para ver seu estado e ações</span><span class="grid-count">{{ activeCount }} plantios ativos · {{ freeCount }} livres</span></div></div>
      </section>
    </div>
    <p v-else class="form-error">{{ error || 'Horta não encontrada.' }}</p>
    <PlantingPanel :plot="selectedPlot" :crop-types="cropTypes" :position="popoverPosition" @close="closePanel" @changed="refresh" @sync="syncPlot" @history="openHistory" />
    <CompletedPlantingsSheet v-model:open="completedOpen" :garden-name="garden?.name || ''" :plantings="completedPlantings" :loading="completedLoading" @select="openHistoricalPlanting" />
    <PlantHistoryDrawer :open="historyOpen" :planting="historyPlanting" :cell-label="historyCellLabel" @update:open="closeHistory" />
    <UiSheet :open="createOpen" title="Nova horta" description="Crie uma nova área de cultivo" @update:open="createOpen = $event">
      <GardenForm compact @created="onGardenCreated" @cancel="createOpen = false" />
    </UiSheet>
  </AppShell>
</template>

<style scoped>
.garden-layout { display:block; padding-top:28px; }.garden-main { width:100%; }.context-breadcrumb { display:flex; align-items:center; gap:8px; margin-bottom:14px; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }.context-breadcrumb a { color:#5b9c69; text-decoration:none; }.context-breadcrumb strong { color:var(--ink); font-weight:var(--weight-semibold); }
.garden-heading { display:flex; align-items:end; justify-content:space-between; gap:20px; margin-bottom:14px; }.garden-heading > div:first-child { min-width:0; }.garden-current-label { display:block; margin-bottom:4px; color:#809088; font-size:var(--text-xs); font-weight:var(--weight-semibold); letter-spacing:.08em; }.garden-switcher { max-width:100%; border:0; border-bottom:1px solid #a9c6ad; border-radius:0; background:transparent; color:var(--ink); padding:0 28px 3px 0; font-size:var(--text-sm); font-weight:var(--weight-semibold); }.garden-switcher:focus-visible { outline:3px solid #347a4b; outline-offset:3px; }.garden-heading h1 { margin:6px 0 3px; font-size:var(--text-display); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }.garden-heading .subtitle { font-size:var(--text-sm); }.dot-separator { padding:0 7px; color:#b4c1b8; }.garden-header-actions { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:8px; }.garden-header-actions .ui-button { min-height:36px; padding:7px 11px; font-size:var(--text-sm); }
.grid-card { display:flex; min-height:0; flex-direction:column; overflow:hidden; border:1px solid var(--line); background:#fff; padding:14px 14px 0; }.garden-grid-viewport { min-height:240px; max-height:min(560px,calc(100vh - 250px)); overflow:auto; padding-bottom:14px; overscroll-behavior:contain; scroll-padding-bottom:14px; }.grid-card > .filter-empty-message { flex:0 0 auto; margin:0; }.filter-empty-message { margin:0; padding:15px; border:1px dashed #cbd9cb; color:#5f8065; font-size:var(--text-md); text-align:center; }.grid-caption { display:flex; flex:0 0 auto; justify-content:space-between; margin:0; border-top:1px solid var(--line); background:#fff; padding:17px 0; color:#94a09a; font-size:var(--text-xs); line-height:var(--leading-normal); }.tiny-sprout { margin-right:7px; color:#6aae73; }.grid-count { font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
@media (max-width:720px) {
  .garden-layout { padding-top:26px; }.garden-heading { align-items:flex-start; flex-direction:column; margin-bottom:22px; }.garden-heading h1 { margin-top:8px; font-size:var(--text-2xl); }.garden-heading .ui-button { width:100%; }.garden-header-actions { width:100%; justify-content:stretch; }.garden-header-actions .ui-button { flex:1; }.grid-card { padding:12px 10px 0; }.garden-grid-viewport { max-height:calc(100dvh - 330px); }.grid-caption { align-items:flex-start; flex-direction:column; gap:6px; }.grid-count { font-size:var(--text-xs); }
}
</style>
