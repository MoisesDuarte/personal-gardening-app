<script setup lang="ts">
import type { Planting, Plot } from '~/types/domain'

const route = useRoute()
const { garden, plots, cropTypes, loading, error, loadGarden, loadCropTypes } = useGarden()
const selectedPlot = ref<Plot | null>(null)
const activeFilter = ref<'all' | 'empty' | 'NEEDS_WATERING'>('all')
const popoverPosition = ref<{ top: number; left: number }>()
const historyOpen = ref(false)
const historyPlanting = ref<Plot['planting']>(null)
const activeCount = computed(() => plots.value.filter((plot) => plot.planting).length)
const freeCount = computed(() => plots.value.filter((plot) => !plot.planting).length)
const needsCare = computed(() => plots.value.filter((plot) => plot.planting?.needsCare).length)
const filterEmptyMessage = computed(() => activeFilter.value === 'empty' && freeCount.value === 0 ? '✓ Nenhum bloco livre agora.' : activeFilter.value === 'NEEDS_WATERING' && needsCare.value === 0 ? '✓ Nenhuma planta precisa de cuidado agora.' : '')
const historyCellLabel = computed(() => {
  const plot = plots.value.find((item) => item.planting?.id === historyPlanting.value?.id)
  return plot ? `${String.fromCharCode(64 + plot.row)}${plot.column}` : undefined
})

function closePanel() {
  const plotId = selectedPlot.value?.id
  selectedPlot.value = null
  popoverPosition.value = undefined
  nextTick(() => (plotId ? document.querySelector(`[data-plot-id="${plotId}"]`) as HTMLElement | null : null)?.focus())
}

function selectPlot(plot: Plot) {
  selectedPlot.value = plot
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
  await loadGarden(String(route.params.id))
  if (action === 'HARVEST' || action === 'REMOVAL') return closePanel()
  selectedPlot.value = plots.value.find((plot) => plot.id === selectedId) || null
}

function openHistory(planting: NonNullable<Plot['planting']>) {
  closePanel()
  historyPlanting.value = planting
  historyOpen.value = true
}

async function syncPlot(plotId: string) {
  await loadGarden(String(route.params.id))
  const current = plots.value.find((plot) => plot.id === plotId)
  if (current) selectPlot(current)
}

onMounted(async () => { await Promise.all([loadGarden(String(route.params.id)), loadCropTypes()]) })
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
        <div class="garden-heading"><div><span class="eyebrow">MAPA DE CULTIVO</span><h1>{{ garden.name }}</h1><p class="subtitle">{{ garden.rows }} × {{ garden.columns }} blocos <span class="dot-separator">·</span> Uma visão viva da sua horta</p></div><UiButton class="button button-dark" :disabled="!freeCount" @click="selectPlot(plots.find((plot) => !plot.planting) || plots[0] || null!)">+ Novo plantio</UiButton></div>
        <GardenFilters v-model="activeFilter" :total="plots.length" :free="freeCount" :care="needsCare" />
        <div class="grid-card"><GardenGrid :rows="garden.rows" :columns="garden.columns" :plots="plots" :filter="activeFilter" :selected-plot-id="selectedPlot?.id" @select="selectPlot" /><p v-if="filterEmptyMessage" class="filter-empty-message" aria-live="polite">{{ filterEmptyMessage }}</p><div class="grid-caption"><span><i class="tiny-sprout">✳</i> Selecione uma célula para ver seu estado e ações</span><span class="grid-count">{{ activeCount }} plantios ativos · {{ freeCount }} livres</span></div></div>
      </section>
    </div>
    <p v-else class="form-error">{{ error || 'Horta não encontrada.' }}</p>
    <PlantingPanel :plot="selectedPlot" :crop-types="cropTypes" :position="popoverPosition" @close="closePanel" @changed="refresh" @sync="syncPlot" @history="openHistory" />
    <PlantHistoryDrawer v-model:open="historyOpen" :planting="historyPlanting" :cell-label="historyCellLabel" />
  </main>
</template>
