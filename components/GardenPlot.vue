<script setup lang="ts">
import type { Plot } from '~/types/domain'

const props = defineProps<{ plot: Plot; selected?: boolean; dimmed?: boolean }>()
const emit = defineEmits<{ select: [plot: Plot] }>()
const planting = computed(() => props.plot.planting)
const emoji = computed(() => planting.value?.cropType.name === 'Cenoura' ? '🥕' : planting.value?.cropType.name === 'Alface' ? '🥬' : '🌱')
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
</script>

<template>
  <button class="plot-cell" :data-plot-id="plot.id" :class="[stateClass, { 'plot-dimmed': dimmed, 'plot-selected': selected }]" :aria-label="accessibleLabel" :aria-pressed="selected" @click="emit('select', plot)">
    <template v-if="planting">
      <span class="cell-crop"><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }}</span>
      <span class="cell-age">{{ planting.ageInDays }} dias</span>
      <span v-for="indicator in indicators" :key="indicator.text" class="cell-indicator" :class="`indicator-${indicator.kind}`">{{ indicator.text }}</span>
    </template>
    <span v-else class="empty-content"><span class="empty-mark" aria-hidden="true">+</span><span class="empty-hint">Plantar</span></span>
    <small>{{ cellLabel }}</small>
  </button>
</template>
