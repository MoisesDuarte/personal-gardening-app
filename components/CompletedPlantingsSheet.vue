<script setup lang="ts">
import type { HistoricalPlanting } from '~/types/domain'
import { formatAppDate } from '~/utils/dates'

defineProps<{ open: boolean; gardenName: string; plantings: HistoricalPlanting[]; loading?: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; select: [planting: HistoricalPlanting] }>()
const cellLabel = (planting: HistoricalPlanting) => `${String.fromCharCode(64 + planting.plot.row)}${planting.plot.column}`
const emoji = (name: string) => name === 'Cenoura' ? '🥕' : name === 'Alface' ? '🥬' : '🌱'
</script>

<template>
  <UiSheet :open="open" title="Histórico de cultivos" :description="`Cultivos concluídos da ${gardenName}`" @update:open="emit('update:open', $event)">
    <div class="completed-sheet">
      <div class="completed-sheet-heading">
        <div><span class="eyebrow">CULTIVOS CONCLUÍDOS</span><h2>Histórico de cultivos</h2><p class="muted">O que já passou pela {{ gardenName }}.</p></div>
        <UiButton variant="ghost" size="sm" aria-label="Fechar histórico de cultivos" @click="emit('update:open', false)">×</UiButton>
      </div>
      <div v-if="loading" class="soft-empty">Carregando histórico…</div>
      <div v-else-if="!plantings.length" class="completed-empty"><span aria-hidden="true">🌱</span><strong>Nenhum cultivo concluído ainda.</strong><p>As plantas colhidas ou removidas aparecerão aqui.</p></div>
      <div v-else class="completed-list">
        <button v-for="planting in plantings" :key="planting.id" class="completed-item" @click="emit('select', planting)">
          <span class="completed-icon" aria-hidden="true">{{ emoji(planting.cropType.name) }}</span>
          <span class="completed-main"><strong>{{ planting.cropType.name }}</strong><small>Bloco {{ cellLabel(planting) }} · Plantada {{ formatAppDate(planting.plantedAt) }}</small><small>{{ planting.status === 'HARVESTED' ? 'Colhida' : 'Removida' }} {{ formatAppDate(planting.endedAt) }} · {{ planting.durationInDays }} dias de cultivo</small></span>
          <UiBadge :variant="planting.status === 'HARVESTED' ? 'success' : 'warning'">{{ planting.status === 'HARVESTED' ? '🧺 Colhida' : 'Removida' }}</UiBadge>
        </button>
      </div>
    </div>
  </UiSheet>
</template>
