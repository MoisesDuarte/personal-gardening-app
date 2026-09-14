<script setup lang="ts">
import type { Plot } from '~/types/domain'
const props = defineProps<{ rows: number; columns: number; plots: Plot[]; filter?: string }>()
const emit = defineEmits<{ select: [plot: Plot] }>()
const plotMap = computed(() => new Map(props.plots.map((plot) => [`${plot.row}-${plot.column}`, plot])))
const label = (plot: Plot) => String.fromCharCode(64 + plot.row) + plot.column
const stateLabel: Record<string, string> = { READY: 'Pronta', NEAR_HARVEST: 'Colheita', NEEDS_WATERING: 'Irrigar', NEEDS_FERTILIZING: 'Adubar' }
const isVisible = (plot: Plot) => !props.filter || props.filter === 'all' || (props.filter === 'empty' ? !plot.planting : props.filter === 'NEEDS_WATERING' ? ['NEEDS_WATERING', 'NEEDS_FERTILIZING'].includes(plot.planting?.state || '') : plot.planting?.state === props.filter)
</script>

<template>
  <div class="garden-grid-wrap" :style="{ '--columns': columns }">
    <div class="grid-corner" />
    <div v-for="column in columns" :key="`head-${column}`" class="grid-axis">{{ String(column).padStart(2, '0') }}</div>
    <template v-for="row in rows" :key="row">
      <div class="grid-axis row-axis">{{ String.fromCharCode(64 + row) }}</div>
      <button v-for="column in columns" :key="`${row}-${column}`" class="plot-cell" :class="[plotMap.get(`${row}-${column}`)?.planting ? `plot-${plotMap.get(`${row}-${column}`)!.planting!.state.toLowerCase()}` : 'plot-empty', { 'plot-dimmed': !isVisible(plotMap.get(`${row}-${column}`)!) }]" :disabled="!plotMap.get(`${row}-${column}`) || !isVisible(plotMap.get(`${row}-${column}`)!)" @click="emit('select', plotMap.get(`${row}-${column}`)!)">
        <template v-if="plotMap.get(`${row}-${column}`)?.planting">
          <span class="cell-plant">{{ plotMap.get(`${row}-${column}`)!.planting!.cropType.name }}</span>
          <span class="cell-state">{{ stateLabel[plotMap.get(`${row}-${column}`)!.planting!.state] || 'Crescendo' }}</span>
        </template>
        <span v-else class="empty-mark">+</span>
        <small>{{ label(plotMap.get(`${row}-${column}`)!) }}</small>
      </button>
    </template>
  </div>
</template>
