<script setup lang="ts">
import type { HistoricalPlanting, Planting } from '~/types/domain'
import { formatAppDate, formatAppTime } from '~/utils/dates'
const props = defineProps<{ open: boolean; planting: (Planting | HistoricalPlanting) | null; cellLabel?: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const isCompleted = computed(() => props.planting?.status === 'HARVESTED' || props.planting?.status === 'REMOVED')
const endedAt = computed(() => props.planting?.harvestedAt || props.planting?.removedAt || null)
const duration = computed(() => 'durationInDays' in (props.planting || {}) ? (props.planting as HistoricalPlanting).durationInDays : props.planting?.ageInDays || 0)
const formatDate = (date?: string | null) => date ? formatAppDate(date) : '—'
const formatTime = (date: string) => formatAppTime(date)
const eventLabel = (type: string) => type === 'WATERING' ? 'Irrigação' : type === 'FERTILIZING' ? 'Adubação' : type === 'HARVEST' ? 'Colheita' : 'Plantio removido'
const eventEmoji = (type: string) => type === 'WATERING' ? '💧' : type === 'FERTILIZING' ? '🌱' : type === 'HARVEST' ? '🧺' : '↗'
const emoji = computed(() => props.planting?.cropType.emoji || '🌱')
</script>

<template>
  <UiSheet :open="open" title="Histórico do plantio" description="Histórico completo de cuidados e ciclo" @update:open="emit('update:open', $event)">
    <div v-if="planting" class="history-drawer">
      <div class="drawer-heading"><div><span class="eyebrow">HISTÓRICO DA PLANTA</span><h2><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }}</h2><p class="muted">Célula {{ cellLabel || ('plot' in planting ? `${String.fromCharCode(64 + planting.plot.row)}${planting.plot.column}` : '—') }}</p></div><div class="drawer-heading-actions"><UiBadge :variant="planting.status === 'REMOVED' ? 'warning' : planting.status === 'HARVESTED' ? 'success' : 'default'">{{ planting.status === 'REMOVED' ? 'Removida' : planting.status === 'HARVESTED' ? 'Colhida' : 'Ativa' }}</UiBadge><UiButton class="drawer-close" variant="ghost" size="sm" aria-label="Fechar histórico" @click="emit('update:open', false)">×</UiButton></div></div>
      <div class="drawer-summary"><div><span>Plantada em</span><strong>{{ formatDate(planting.plantedAt) }}</strong></div><div><span>Tempo cultivado</span><strong>{{ duration }} dias</strong></div><div><span>Ciclo estimado</span><strong>{{ planting.cropType.defaultHarvestDays }} dias</strong></div><div><span>{{ isCompleted ? (planting.status === 'HARVESTED' ? 'Colhida em' : 'Removida em') : 'Colheita prevista' }}</span><strong>{{ formatDate(isCompleted ? endedAt : planting.expectedHarvestAt) }}</strong></div></div>
      <div class="drawer-section"><span class="eyebrow">LINHA DO TEMPO</span><h3>O que aconteceu</h3><div class="drawer-history"><div class="drawer-event"><span class="event-icon">🌱</span><div><strong>Plantio registrado</strong><small>{{ formatDate(planting.plantedAt) }}</small></div><time>{{ formatTime(planting.plantedAt) }}</time></div><div v-for="event in [...planting.events].reverse()" :key="event.id" class="drawer-event"><span class="event-icon">{{ eventEmoji(event.type) }}</span><div><strong>{{ eventLabel(event.type) }}</strong><small v-if="event.notes">{{ event.notes }}</small></div><time>{{ formatDate(event.performedAt) }} · {{ formatTime(event.performedAt) }}</time></div></div></div>
      <div class="drawer-section crop-info"><span class="eyebrow">PARÂMETROS DO CULTIVO</span><h3>Referência padrão</h3><div class="info-list"><div><span>Intervalo de irrigação</span><strong>{{ planting.cropType.defaultWateringIntervalDays }} dias</strong></div><div><span>Intervalo de adubação</span><strong>{{ planting.cropType.defaultFertilizingIntervalDays }} dias</strong></div><div><span>Ciclo estimado</span><strong>{{ planting.cropType.defaultHarvestDays }} dias</strong></div></div></div>
    </div>
  </UiSheet>
</template>

<style scoped>
.history-drawer { padding-top:3px; }
.drawer-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; padding-bottom:16px; border-bottom:1px solid var(--line); }
.drawer-heading h2 { margin:8px 0 4px; font-size:var(--text-xl); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.drawer-heading-actions { display:flex; align-items:center; gap:5px; }
.drawer-close { min-width:40px; padding:4px 8px; font-size:var(--text-xl); font-weight:var(--weight-regular); }
.drawer-summary { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:16px 0; border-bottom:1px solid var(--line); }
.drawer-summary span { display:block; color:var(--muted); font-size:var(--text-xs); }.drawer-summary strong { display:block; margin-top:3px; font-size:var(--text-md); font-weight:var(--weight-semibold); font-variant-numeric:tabular-nums; }
.drawer-section { padding-top:18px; }
.drawer-section h3 { margin:8px 0 12px; font-size:var(--text-lg); font-weight:var(--weight-semibold); line-height:var(--leading-tight); }
.drawer-history { border-top:1px solid var(--line); }
.drawer-event { display:grid; grid-template-columns:34px 1fr auto; align-items:center; gap:8px; min-height:52px; border-bottom:1px solid var(--line); }
.event-icon { display:grid; place-items:center; width:27px; height:27px; border-radius:50%; background:#eef6ec; font-size:14px; }
.drawer-event strong { display:block; font-size:var(--text-sm); font-weight:var(--weight-semibold); }.drawer-event small { display:block; margin-top:2px; color:var(--muted); font-size:var(--text-xs); }.drawer-event time { color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; text-align:right; }
.info-list { border-top:1px solid var(--line); }
.info-list div { display:flex; justify-content:space-between; gap:15px; padding:15px 0; border-bottom:1px solid var(--line); font-size:var(--text-md); }
.info-list strong { font-weight:var(--weight-semibold); font-variant-numeric:tabular-nums; text-align:right; }
@media (max-width:720px) {
  .drawer-heading { padding-bottom:25px; }
  .drawer-heading h2 { margin:12px 0 5px; font-size:var(--text-2xl); }
  .drawer-summary { gap:17px; padding:20px 0; }
  .drawer-section { padding-top:22px; }
  .drawer-event { grid-template-columns:34px 1fr; padding:9px 0; }
  .drawer-event time { grid-column:2; text-align:left; }
}
</style>
