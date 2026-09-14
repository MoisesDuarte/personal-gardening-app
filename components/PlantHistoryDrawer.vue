<script setup lang="ts">
import type { Planting } from '~/types/domain'
import { formatAppDate, formatAppTime } from '~/utils/dates'
const props = defineProps<{ open: boolean; planting: Planting | null; cellLabel?: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const formatDate = (date?: string | null) => date ? formatAppDate(date) : '—'
const formatTime = (date: string) => formatAppTime(date)
const eventLabel = (type: string) => type === 'WATERING' ? 'Irrigação' : type === 'FERTILIZING' ? 'Adubação' : type === 'HARVEST' ? 'Colheita' : 'Plantio removido'
const eventEmoji = (type: string) => type === 'WATERING' ? '💧' : type === 'FERTILIZING' ? '🌱' : type === 'HARVEST' ? '🧺' : '↗'
const emoji = computed(() => props.planting?.cropType.name === 'Cenoura' ? '🥕' : props.planting?.cropType.name === 'Alface' ? '🥬' : '🌱')
</script>

<template>
  <UiSheet :open="open" title="Histórico do plantio" description="Histórico completo de cuidados e ciclo" @update:open="emit('update:open', $event)">
    <div v-if="planting" class="history-drawer">
      <div class="drawer-heading"><div><span class="eyebrow">HISTÓRICO DA PLANTA</span><h2><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }}</h2><p class="muted">Célula {{ cellLabel || '—' }}</p></div><div class="drawer-heading-actions"><UiBadge :variant="planting.status === 'REMOVED' ? 'warning' : planting.status === 'HARVESTED' ? 'success' : 'default'">{{ planting.status === 'REMOVED' ? 'Removida' : planting.status === 'HARVESTED' ? 'Colhida' : 'Ativa' }}</UiBadge><UiButton class="drawer-close" variant="ghost" size="sm" aria-label="Fechar histórico" @click="emit('update:open', false)">×</UiButton></div></div>
      <div class="drawer-summary"><div><span>Plantada em</span><strong>{{ formatDate(planting.plantedAt) }}</strong></div><div><span>Tempo cultivado</span><strong>{{ planting.ageInDays }} dias</strong></div><div><span>Ciclo estimado</span><strong>{{ planting.cropType.defaultHarvestDays }} dias</strong></div><div><span>Colheita prevista</span><strong>{{ formatDate(planting.expectedHarvestAt) }}</strong></div></div>
      <div class="drawer-section"><span class="eyebrow">LINHA DO TEMPO</span><h3>O que aconteceu</h3><div class="drawer-history"><div class="drawer-event"><span class="event-icon">🌱</span><div><strong>Plantio registrado</strong><small>{{ formatDate(planting.plantedAt) }}</small></div><time>{{ formatTime(planting.plantedAt) }}</time></div><div v-for="event in [...planting.events].reverse()" :key="event.id" class="drawer-event"><span class="event-icon">{{ eventEmoji(event.type) }}</span><div><strong>{{ eventLabel(event.type) }}</strong><small v-if="event.notes">{{ event.notes }}</small></div><time>{{ formatDate(event.performedAt) }} · {{ formatTime(event.performedAt) }}</time></div></div></div>
      <div class="drawer-section crop-info"><span class="eyebrow">PARÂMETROS DO CULTIVO</span><h3>Referência padrão</h3><div class="info-list"><div><span>Intervalo de irrigação</span><strong>{{ planting.cropType.defaultWateringIntervalDays }} dias</strong></div><div><span>Intervalo de adubação</span><strong>{{ planting.cropType.defaultFertilizingIntervalDays }} dias</strong></div><div><span>Ciclo estimado</span><strong>{{ planting.cropType.defaultHarvestDays }} dias</strong></div></div></div>
    </div>
  </UiSheet>
</template>
