<script setup lang="ts">
import type { GlobalHistoricalPlanting } from '~/types/domain'
import { formatAppDate } from '~/utils/dates'

const plantings = ref<GlobalHistoricalPlanting[]>([])
const loading = ref(true)
const error = ref('')
const gardenFilter = ref('')
const cropFilter = ref('')
const resultFilter = ref<'ALL' | 'HARVESTED' | 'REMOVED'>('ALL')
const drawerOpen = ref(false)
const selectedPlanting = ref<GlobalHistoricalPlanting | null>(null)
const gardens = computed(() => [...new Map(plantings.value.map((item) => [item.garden.id, item.garden])).values()])
const crops = computed(() => [...new Map(plantings.value.map((item) => [item.cropType.id, item.cropType])).values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
const filteredPlantings = computed(() => plantings.value.filter((item) => (!gardenFilter.value || item.garden.id === gardenFilter.value) && (!cropFilter.value || item.cropType.id === cropFilter.value) && (resultFilter.value === 'ALL' || item.status === resultFilter.value)))
const cellLabel = (item: GlobalHistoricalPlanting) => `${String.fromCharCode(64 + item.plot.row)}${item.plot.column}`
async function load() {
  loading.value = true; error.value = ''
  try { plantings.value = await $fetch<GlobalHistoricalPlanting[]>('/api/plantings/history') }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível carregar o histórico.' }
  finally { loading.value = false }
}
function select(planting: GlobalHistoricalPlanting) { selectedPlanting.value = planting; drawerOpen.value = true }
function closeDrawer(open: boolean) { drawerOpen.value = open; if (!open) selectedPlanting.value = null }
onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-heading"><div><span class="eyebrow">O QUE JÁ ACONTECEU</span><h1>Histórico</h1><p class="subtitle">Cultivos concluídos em todas as suas hortas.</p></div></section>
    <div class="history-toolbar"><label><span>Horta</span><select v-model="gardenFilter"><option value="">Todas as hortas</option><option v-for="garden in gardens" :key="garden.id" :value="garden.id">{{ garden.name }}</option></select></label><label><span>Planta</span><select v-model="cropFilter"><option value="">Todas as plantas</option><option v-for="crop in crops" :key="crop.id" :value="crop.id">{{ crop.emoji }} {{ crop.name }}</option></select></label><label><span>Resultado</span><select v-model="resultFilter"><option value="ALL">Todos</option><option value="HARVESTED">Colhidas</option><option value="REMOVED">Removidas</option></select></label></div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div v-if="loading" class="loading-card">Carregando histórico…</div>
    <div v-else-if="!filteredPlantings.length" class="soft-empty history-empty">Nenhum cultivo concluído encontrado.</div>
    <section v-else class="history-list" aria-label="Histórico de cultivos"><button v-for="item in filteredPlantings" :key="item.id" class="history-list-row" @click="select(item)"><span class="crop-emoji" aria-hidden="true">{{ item.cropType.emoji }}</span><span class="history-list-main"><strong>{{ item.cropType.name }}</strong><small>{{ item.garden.name }} · {{ cellLabel(item) }}</small><small>{{ formatAppDate(item.plantedAt) }} → {{ formatAppDate(item.endedAt) }}</small></span><UiBadge :variant="item.status === 'HARVESTED' ? 'success' : 'warning'">{{ item.status === 'HARVESTED' ? '🧺 Colhida' : 'Removida' }}</UiBadge><span class="task-arrow">→</span></button></section>
    <PlantHistoryDrawer :open="drawerOpen" :planting="selectedPlanting" :cell-label="selectedPlanting ? cellLabel(selectedPlanting) : undefined" @update:open="closeDrawer" />
  </AppShell>
</template>

<style scoped>
.page-heading { display:flex; align-items:end; justify-content:space-between; gap:24px; padding:50px 0 30px; }.page-heading h1 { margin:11px 0 7px; font-size:var(--text-display); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.history-toolbar { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px; }.history-toolbar label { display:flex; align-items:center; gap:7px; color:var(--muted); font-size:var(--text-sm); font-weight:var(--weight-medium); }.history-toolbar select { min-height:34px; border:1px solid #cbd9cc; border-radius:3px; background:#fff; color:var(--ink); padding:7px 28px 7px 9px; font-size:var(--text-xs); }
.history-list { border-top:1px solid var(--line); background:#fff; }.history-list-row { display:flex; width:100%; align-items:center; gap:14px; border:0; border-bottom:1px solid var(--line); background:transparent; color:var(--ink); padding:12px 15px; text-align:left; }.history-list-row:hover { background:#f1f7f0; }.history-list-main { min-width:0; flex:1; }.history-list-main strong,.history-list-main small { display:block; }.history-list-main strong { font-size:var(--text-sm); font-weight:var(--weight-semibold); }.history-list-main small { margin-top:4px; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }.history-list-main small + small { margin-top:3px; }.task-arrow { margin-left:auto; color:#84a28b; font-size:18px; }
.history-empty { border-top:1px solid var(--line); border-bottom:1px solid var(--line); background:#fff; padding:50px 15px; text-align:center; }
@media (max-width:850px) { .page-heading { padding:38px 0 25px; } }
@media (max-width:720px) { .page-heading { align-items:flex-start; flex-direction:column; gap:18px; }.page-heading h1 { font-size:var(--text-2xl); }.history-toolbar { align-items:stretch; flex-direction:column; }.history-toolbar label { justify-content:space-between; }.history-toolbar select { flex:1; }.history-list-row { align-items:flex-start; flex-wrap:wrap; }.history-list-row :deep(.ui-badge) { margin-left:52px; } }
</style>
