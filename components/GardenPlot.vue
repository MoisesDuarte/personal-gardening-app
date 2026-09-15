<script setup lang="ts">
import type { Plot } from '~/types/domain'
import { formatAppDate, relativeDayLabel } from '~/utils/dates'

const props = defineProps<{ plot: Plot; selected?: boolean; dimmed?: boolean }>()
const emit = defineEmits<{ select: [plot: Plot] }>()
const planting = computed(() => props.plot.planting)
const emoji = computed(() => planting.value?.cropType.emoji || '🌱')
const cellLabel = computed(() => `${String.fromCharCode(64 + props.plot.row)}${props.plot.column}`)
const stateClass = computed(() => planting.value ? `plot-${planting.value.state.toLowerCase()}` : 'plot-empty')
const indicators = computed(() => {
  if (!planting.value) return []
  const result: { text: string; kind: string }[] = []
  if (planting.value.needsWatering) result.push({ text: planting.value.wateringOverdueDays ? `⚠ Irrigação atrasada${planting.value.wateringOverdueDays > 1 ? ` há ${planting.value.wateringOverdueDays} dias` : ''}` : '💧 Irrigar hoje', kind: planting.value.wateringOverdueDays ? 'danger' : 'water' })
  if (planting.value.needsFertilizing && result.length < 2) result.push({ text: planting.value.fertilizingOverdueDays ? `⚠ Adubação atrasada${planting.value.fertilizingOverdueDays > 1 ? ` há ${planting.value.fertilizingOverdueDays} dias` : ''}` : '🌱 Adubar hoje', kind: planting.value.fertilizingOverdueDays ? 'danger' : 'fertilizing' })
  if (!result.length && planting.value.state === 'READY') result.push({ text: '🧺 Pronta para colher', kind: 'ready' })
  if (!result.length && planting.value.state === 'NEAR_HARVEST') result.push({ text: `🧺 Colheita em ${planting.value.daysToHarvest} dias`, kind: 'harvest' })
  return result
})
const accessibleLabel = computed(() => planting.value ? `${emoji.value} ${planting.value.cropType.name}, ${planting.value.ageInDays} dias. ${indicators.value.map((item) => item.text).join('. ') || 'Em crescimento.'}` : `Célula ${cellLabel.value} vazia. Adicionar plantio.`)
const formatDate = (date: string) => formatAppDate(date)
const careLabel = (days: number) => days < 0 ? 'Atrasada' : relativeDayLabel(days)
</script>

<template>
  <UiHoverCard v-if="planting">
    <template #trigger>
      <button class="plot-cell" :data-plot-id="plot.id" :class="[stateClass, { 'plot-dimmed': dimmed, 'plot-selected': selected }]" :aria-label="accessibleLabel" :aria-pressed="selected" @click="emit('select', plot)">
        <span class="cell-crop"><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }}</span>
        <span v-for="indicator in indicators" :key="indicator.text" class="cell-indicator" :class="`indicator-${indicator.kind}`">{{ indicator.text }}</span>
        <small>{{ cellLabel }}</small>
      </button>
    </template>
    <div class="plot-hover-card">
      <strong><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }} · {{ cellLabel }}</strong>
      <dl>
        <div><dt>Irrigação</dt><dd>{{ formatDate(planting.nextWateringAt) }} <small :class="{ 'hover-overdue': planting.wateringDaysUntil < 0 }">{{ careLabel(planting.wateringDaysUntil) }}</small></dd></div>
        <div><dt>Adubação</dt><dd>{{ formatDate(planting.nextFertilizingAt) }} <small :class="{ 'hover-overdue': planting.fertilizingDaysUntil < 0 }">{{ careLabel(planting.fertilizingDaysUntil) }}</small></dd></div>
        <div><dt>Colheita prevista</dt><dd>{{ formatDate(planting.expectedHarvestAt) }} <small>{{ planting.daysToHarvest < 0 ? 'Pronta' : relativeDayLabel(planting.daysToHarvest) }}</small></dd></div>
      </dl>
    </div>
  </UiHoverCard>
  <button v-else class="plot-cell" :data-plot-id="plot.id" :class="[stateClass, { 'plot-dimmed': dimmed, 'plot-selected': selected }]" :aria-label="accessibleLabel" :aria-pressed="selected" @click="emit('select', plot)">
    <span class="empty-content"><span class="empty-mark" aria-hidden="true">+</span><span class="empty-hint">Plantar</span></span>
    <small>{{ cellLabel }}</small>
  </button>
</template>

<style scoped>
.plot-cell { position:relative; display:flex; min-width:88px; min-height:76px; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:9px 9px 16px; border:1px solid #e5ebe4; border-radius:3px; background:#fbfcfa; color:var(--ink); text-align:left; }
.plot-cell:hover { border-color:#83c38c; box-shadow:0 2px 8px #466d3915; }
.plot-cell:focus-visible { position:relative; z-index:1; outline:3px solid #347a4b; outline-offset:2px; }
.plot-cell small { position:absolute; right:7px; bottom:5px; color:#7d8d83; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
.plot-dimmed { opacity:.28; filter:grayscale(.3); }
.plot-selected { border:3px solid #347a4b; box-shadow:0 0 0 3px #b9e1bd; }
.plot-needs_watering { background:#eef9fa; border-color:#cbecef; }
.plot-needs_fertilizing { background:#f2faed; border-color:#d9efd1; }
.plot-near_harvest { background:#fff9e6; border-color:#f7e7a7; }
.plot-ready { background:#fff1e9; border-color:#f4cdb9; }
.cell-crop { min-width:0; overflow:visible; overflow-wrap:anywhere; font-size:var(--text-sm); font-weight:var(--weight-semibold); line-height:var(--leading-tight); text-align:center; white-space:normal; }
.cell-indicator { display:block; max-width:100%; margin-top:0; overflow:visible; overflow-wrap:anywhere; padding:4px 6px; border-radius:3px; font-size:var(--text-xs); font-weight:var(--weight-semibold); line-height:var(--leading-tight); text-align:center; }
.indicator-water { background:#c9edf1; color:#185f67; }
.indicator-fertilizing { background:#dcedcb; color:#356b3f; }
.indicator-danger { background:#f8d2c6; color:#8b3b2d; }
.indicator-ready { background:#f8d6be; color:#843f27; }
.indicator-harvest { background:#f8eab2; color:#725d1e; }
.empty-content { display:flex; height:auto; flex-direction:row; align-items:center; justify-content:flex-start; gap:6px; }
.empty-mark { color:#8ba68f; font-size:21px; }
.empty-hint { color:#67816e; font-size:var(--text-xs); font-weight:var(--weight-semibold); }
.plot-hover-card > strong { display:block; margin-bottom:10px; font-size:var(--text-sm); font-weight:var(--weight-semibold); }
.plot-hover-card dl { margin:0; }
.plot-hover-card dl > div { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:7px 0; border-top:1px solid var(--line); }
.plot-hover-card dt { color:var(--muted); font-size:var(--text-xs); }
.plot-hover-card dd { margin:0; color:#4d7c57; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; text-align:right; }
.plot-hover-card dd small { position:static; display:block; margin-top:3px; color:#76927b; font-family:var(--font-sans); font-size:var(--text-xs); }
.plot-hover-card dd small.hover-overdue { color:#a74737; font-weight:var(--weight-bold); }

@media (max-width:720px) {
  .plot-cell { min-height:82px; padding:10px 9px 18px; }
  .cell-crop { font-size:var(--text-sm); }
  .cell-indicator { font-size:var(--text-xs); }
}
</style>
