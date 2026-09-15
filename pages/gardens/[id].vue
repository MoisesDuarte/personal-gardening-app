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
    const rect = target?.getBoundingClientRect()
    const width = 390
    const top = rect ? Math.min(Math.max(16, rect.top), Math.max(16, window.innerHeight - 510)) : 80
    let left = rect ? rect.right + 14 : 24
    if (left + width > window.innerWidth - 16) left = rect ? rect.left - width - 14 : 24
    popoverPosition.value = { top, left: Math.max(16, left) }
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
  <main class="app-shell garden-page">
    <header class="topbar">
      <NuxtLink class="brand" to="/"><span class="brand-mark">✳</span><span>cultiva<span>.</span></span></NuxtLink>
      <div class="topbar-right"><NuxtLink class="back-link" to="/">← Dashboard</NuxtLink><span class="avatar">MF</span></div>
    </header>

    <div v-if="loading" class="loading-card">Abrindo sua horta…</div>
    <div v-else-if="garden" class="garden-layout">
      <section class="garden-main">
        <div class="garden-heading">
          <div>
            <label class="garden-current-label" for="garden-switcher">HORTA ATUAL</label>
            <select id="garden-switcher" class="garden-switcher" :value="garden.id" aria-label="Selecionar horta" @change="onGardenChange">
              <option v-for="option in gardenOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
            </select>
            <h1>{{ garden.name }}</h1>
            <p class="subtitle">{{ garden.rows }} × {{ garden.columns }} blocos <span class="dot-separator">·</span> Uma visão viva da sua horta</p>
          </div>
          <div class="garden-header-actions"><UiButton variant="outline" @click="openCompletedHistory">Histórico de cultivos</UiButton><UiButton class="button button-dark" :disabled="!freeCount" @click="selectPlot(plots.find((plot) => !plot.planting) || plots[0] || null!)">+ Novo plantio</UiButton><UiButton variant="ghost" @click="createOpen = true">Nova horta</UiButton></div>
        </div>
        <GardenFilters v-model="activeFilter" :total="plots.length" :free="freeCount" :care="needsCare" />
        <div class="grid-card"><GardenGrid :rows="garden.rows" :columns="garden.columns" :plots="plots" :filter="activeFilter" :selected-plot-id="selectedPlot?.id" @select="selectPlot" /><p v-if="filterEmptyMessage" class="filter-empty-message" aria-live="polite">{{ filterEmptyMessage }}</p><div class="grid-caption"><span><i class="tiny-sprout">✳</i> Selecione uma célula para ver seu estado e ações</span><span class="grid-count">{{ activeCount }} plantios ativos · {{ freeCount }} livres</span></div></div>
      </section>
    </div>
    <p v-else class="form-error">{{ error || 'Horta não encontrada.' }}</p>
    <PlantingPanel :plot="selectedPlot" :crop-types="cropTypes" :position="popoverPosition" :history-open="historyOpen" @close="closePanel" @changed="refresh" @sync="syncPlot" @history="openHistory" />
    <CompletedPlantingsSheet v-model:open="completedOpen" :garden-name="garden?.name || ''" :plantings="completedPlantings" :loading="completedLoading" @select="openHistoricalPlanting" />
    <PlantHistoryDrawer :open="historyOpen" :planting="historyPlanting" :cell-label="historyCellLabel" @update:open="closeHistory" />
    <UiSheet :open="createOpen" title="Nova horta" description="Crie uma nova área de cultivo" @update:open="createOpen = $event">
      <GardenForm compact @created="onGardenCreated" @cancel="createOpen = false" />
    </UiSheet>
  </main>
</template>
