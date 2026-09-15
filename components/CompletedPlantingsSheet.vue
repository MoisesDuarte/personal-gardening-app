<script setup lang="ts">
import type { HistoricalPlanting } from '~/types/domain'
import { formatAppDate } from '~/utils/dates'

defineProps<{ open: boolean; gardenName: string; plantings: HistoricalPlanting[]; loading?: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; select: [planting: HistoricalPlanting] }>()
const cellLabel = (planting: HistoricalPlanting) => `${String.fromCharCode(64 + planting.plot.row)}${planting.plot.column}`
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
          <span class="completed-icon" aria-hidden="true">{{ planting.cropType.emoji || '🌱' }}</span>
          <span class="completed-main"><strong>{{ planting.cropType.name }}</strong><small>Bloco {{ cellLabel(planting) }} · Plantada {{ formatAppDate(planting.plantedAt) }}</small><small>{{ planting.status === 'HARVESTED' ? 'Colhida' : 'Removida' }} {{ formatAppDate(planting.endedAt) }} · {{ planting.durationInDays }} dias de cultivo</small></span>
          <UiBadge :variant="planting.status === 'HARVESTED' ? 'success' : 'warning'">{{ planting.status === 'HARVESTED' ? '🧺 Colhida' : 'Removida' }}</UiBadge>
        </button>
      </div>
    </div>
  </UiSheet>
</template>

<style scoped>
.completed-sheet { min-height:100%; }
.completed-sheet-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding-bottom:16px; border-bottom:1px solid var(--line); }
.completed-sheet-heading h2 { margin:8px 0 4px; font-size:var(--text-xl); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.completed-list { border-top:1px solid var(--line); }
.completed-item { display:flex; width:100%; align-items:center; gap:10px; border:0; border-bottom:1px solid var(--line); background:transparent; padding:10px 0; color:var(--ink); text-align:left; }
.completed-item:hover { background:#f1f7f0; }
.completed-item:focus-visible { position:relative; z-index:1; outline:3px solid #347a4b; outline-offset:2px; }
.completed-icon { display:grid; width:32px; height:32px; flex:0 0 32px; place-items:center; border-radius:50%; background:#eef6ec; font-size:16px; }
.completed-main { min-width:0; flex:1; }
.completed-main strong,.completed-main small { display:block; }
.completed-main strong { font-size:var(--text-md); font-weight:var(--weight-semibold); }.completed-main small { margin-top:3px; color:var(--muted); font-size:var(--text-xs); }
.completed-empty { padding:70px 18px; color:var(--muted); text-align:center; }
.completed-empty > span { display:block; margin-bottom:15px; font-size:35px; }
.completed-empty strong { display:block; color:var(--ink); font-size:var(--text-md); font-weight:var(--weight-semibold); }.completed-empty p { margin:7px 0 0; font-size:var(--text-sm); line-height:var(--leading-relaxed); }

@media (max-width:720px) {
  .completed-sheet-heading { padding-bottom:24px; }
  .completed-sheet-heading h2 { margin:12px 0 6px; font-size:var(--text-2xl); }
  .completed-item { gap:12px; padding:16px 0; }
  .completed-icon { width:38px; height:38px; flex-basis:38px; font-size:19px; }
  .completed-item { align-items:flex-start; flex-wrap:wrap; }
  .completed-item :deep(.ui-badge) { margin-left:50px; }
}
</style>
