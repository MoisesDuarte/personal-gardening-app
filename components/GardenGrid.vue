<script setup lang="ts">
import type { Plot } from '~/types/domain'
const props = defineProps<{ rows: number; columns: number; plots: Plot[]; filter?: string; selectedPlotId?: string | null }>()
const emit = defineEmits<{ select: [plot: Plot] }>()
const plotMap = computed(() => new Map(props.plots.map((plot) => [`${plot.row}-${plot.column}`, plot])))
const isVisible = (plot: Plot) => !props.filter || props.filter === 'all' || (props.filter === 'empty' ? !plot.planting : props.filter === 'NEEDS_WATERING' ? Boolean(plot.planting?.needsCare) : plot.planting?.state === props.filter)
</script>

<template>
  <div class="garden-grid-wrap" :style="{ '--columns': columns }" role="grid" aria-label="Mapa de células da horta">
    <div class="grid-corner" />
    <div v-for="column in columns" :key="`head-${column}`" class="grid-axis" aria-hidden="true">{{ String(column).padStart(2, '0') }}</div>
    <template v-for="row in rows" :key="row">
      <div class="grid-axis row-axis" aria-hidden="true">{{ String.fromCharCode(64 + row) }}</div>
      <GardenPlot v-for="column in columns" :key="`${row}-${column}`" :plot="plotMap.get(`${row}-${column}`)!" :selected="selectedPlotId === plotMap.get(`${row}-${column}`)?.id" :dimmed="!isVisible(plotMap.get(`${row}-${column}`)!)" @select="emit('select', $event)" />
    </template>
  </div>
</template>
