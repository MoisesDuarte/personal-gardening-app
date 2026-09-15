<script setup lang="ts">
import type { DashboardAttentionItem, DashboardData } from '~/types/domain'
import { formatAppDate } from '~/utils/dates'

const router = useRouter()
const { revision } = useDevMode()
const { success } = useGardenToast()
const dashboard = ref<DashboardData | null>(null)
const loading = ref(true)
const showForm = ref(false)
const error = ref('')
const formatDate = (date: string) => formatAppDate(date, { day: '2-digit', month: 'short' }).replace('.', '')
const attentionItems = computed(() => dashboard.value?.attentionItems || [])
const gardenSummaries = computed(() => dashboard.value?.gardens || [])
const upcomingHarvests = computed(() => dashboard.value?.upcomingHarvests || [])

async function load() {
  loading.value = true; error.value = ''
  try { dashboard.value = await $fetch<DashboardData>('/api/dashboard') }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível carregar o resumo.' }
  finally { loading.value = false }
}
function openGarden(item: { gardenId?: string; garden?: { id: string }; plotId?: string; plot?: { id: string } }) {
  const gardenId = item.gardenId || item.garden?.id
  const plotId = item.plotId || item.plot?.id
  if (gardenId) router.push({ path: `/gardens/${gardenId}`, query: plotId ? { plotId } : undefined })
}
function attentionLabel(item: DashboardAttentionItem) {
  if (item.kind === 'HARVEST') return 'Pronta para colher'
  if (item.daysUntil < 0) return `Atrasada há ${Math.abs(item.daysUntil)} ${Math.abs(item.daysUntil) === 1 ? 'dia' : 'dias'}`
  return 'Hoje'
}
function attentionTitle(item: DashboardAttentionItem) {
  return item.kind === 'WATERING' ? `Irrigar ${item.cropType.name}` : item.kind === 'FERTILIZING' ? `Adubar ${item.cropType.name}` : `Colher ${item.cropType.name}`
}
function onGardenCreated(id: string) { success('Horta criada', 'Sua nova horta está pronta para receber plantios.'); router.push(`/gardens/${id}`) }
watch(revision, load)
onMounted(load)
</script>

<template>
  <AppShell>
    <section class="dashboard-head"><div><span class="eyebrow">VISÃO GERAL</span><h1>O que precisa da sua <em>atenção</em>?</h1><p class="subtitle">Cuidados de todas as suas hortas em um só lugar.</p></div><UiButton @click="showForm = true">+ Nova horta</UiButton></section>
    <p v-if="error" class="form-error">{{ error }}</p>
    <template v-if="loading"><div class="loading-card">Carregando seu resumo…</div></template>
    <template v-else-if="!gardenSummaries.length && !showForm"><section class="empty-state"><div class="empty-illustration">🌱</div><h2>Comece criando sua primeira horta</h2><p>Uma horta representa uma área de cultivo onde você poderá organizar e acompanhar seus plantios.</p><UiButton @click="showForm = true">+ Criar horta</UiButton></section></template>
    <template v-else-if="showForm"><GardenForm @created="onGardenCreated" @cancel="showForm = false" /></template>
    <template v-else>
      <p class="dashboard-overview-line"><strong>{{ dashboard?.gardens.length }}</strong> {{ dashboard?.gardens.length === 1 ? 'horta' : 'hortas' }} <span>·</span> <strong>{{ dashboard?.activePlantingsCount }}</strong> {{ dashboard?.activePlantingsCount === 1 ? 'plantio ativo' : 'plantios ativos' }} <span>·</span> <strong>{{ dashboard?.careCount }}</strong> {{ dashboard?.careCount === 1 ? 'precisa' : 'precisam' }} de atenção</p>
      <section class="dashboard-section attention-section"><div class="section-heading"><div><span class="eyebrow">AGORA</span><h2>Precisa de atenção <span>{{ dashboard?.attentionTotal }}</span></h2></div></div><div v-if="attentionItems.length" class="task-list"><button v-for="item in attentionItems" :key="`${item.plantingId}-${item.kind}`" class="task-row dashboard-attention-row" @click="openGarden(item)"><span class="task-icon" :class="item.kind === 'WATERING' ? 'blue' : item.kind === 'FERTILIZING' ? 'green' : 'peach'">{{ item.kind === 'WATERING' ? '💧' : item.kind === 'FERTILIZING' ? '🌱' : '🧺' }}</span><span><strong>{{ attentionTitle(item) }}</strong><small>{{ item.garden.name }} · {{ String.fromCharCode(64 + item.plot.row) }}{{ item.plot.column }}</small></span><span class="attention-status">{{ attentionLabel(item) }}</span><span class="task-arrow">→</span></button></div><div v-else class="soft-empty">Nenhum cuidado pendente. <strong>Você está em dia!</strong></div></section>
      <section class="dashboard-section dashboard-gardens-section"><div class="section-heading"><div><span class="eyebrow">SEUS ESPAÇOS</span><h2>Hortas</h2></div><NuxtLink class="text-button" to="/gardens">Gerenciar hortas →</NuxtLink></div><div class="dashboard-garden-list"><NuxtLink v-for="item in gardenSummaries" :key="item.garden.id" class="dashboard-garden-row" :to="`/gardens/${item.garden.id}`"><span><strong>{{ item.garden.name }}</strong><small>{{ item.garden.rows }} × {{ item.garden.columns }} blocos</small></span><span class="dashboard-garden-stats">{{ item.activeCount }} ativos · {{ item.freeCount }} livres · <b :class="{ 'has-care': item.careCount }">{{ item.careCount ? `${item.careCount} cuidados` : 'Tudo em dia' }}</b></span><span class="task-arrow">→</span></NuxtLink></div></section>
      <section v-if="upcomingHarvests.length" class="dashboard-section"><div class="section-heading"><div><span class="eyebrow">PRÓXIMO CICLO</span><h2>Próximas colheitas</h2></div></div><div class="harvest-list"><div v-for="item in upcomingHarvests" :key="item.plantingId" class="harvest-row"><span class="harvest-dot" /><span><strong>{{ item.cropEmoji || '🌱' }} {{ item.cropName }}</strong><small>{{ item.garden.name }} · {{ String.fromCharCode(64 + item.plot.row) }}{{ item.plot.column }}</small></span><time>{{ formatDate(item.expectedHarvestAt) }}</time></div></div></section>
    </template>
  </AppShell>
</template>

<style scoped>
.dashboard-head { display:flex; align-items:end; justify-content:space-between; padding:42px 0 28px; }
.dashboard-head h1 { margin:13px 0 9px; font-size:var(--text-display); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.dashboard-head h1 em { color:#5aa36a; font-family:inherit; font-style:italic; font-weight:var(--weight-regular); }
.dashboard-head-actions { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
.dashboard-overview-line { margin:0 0 30px; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
.dashboard-overview-line strong { color:var(--ink); }
.dashboard-overview-line span { padding:0 8px; color:#b1beb3; }
.attention-section,.dashboard-gardens-section { margin-bottom:32px; }
.section-heading { display:flex; justify-content:space-between; align-items:end; margin-bottom:14px; }
.section-heading h2 { margin:11px 0 0; font-size:var(--text-xl); font-weight:var(--weight-semibold); line-height:var(--leading-tight); letter-spacing:-.01em; }
.section-heading h2 span { display:inline-grid; place-items:center; width:24px; height:24px; margin-left:7px; border-radius:50%; background:#e3f3e4; color:#4d9760; font-family:var(--font-mono); font-size:var(--text-xs); font-weight:var(--weight-medium); font-variant-numeric:tabular-nums; }
.task-list,.harvest-list { border-top:1px solid var(--line); }
.task-row,.harvest-row { display:flex; width:100%; align-items:center; gap:14px; padding:15px 2px; border:0; border-bottom:1px solid var(--line); background:transparent; color:var(--ink); text-align:left; }
.task-row strong,.harvest-row strong { display:block; font-size:var(--text-sm); font-weight:var(--weight-semibold); }
.task-row small,.harvest-row small { display:block; margin-top:5px; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
.task-icon { display:grid; place-items:center; width:35px; height:35px; border-radius:50%; font-size:16px; }
.task-icon.blue { background:#dff4f7; }.task-icon.green { background:#e0f1dd; }.task-icon.peach { background:#fce8dc; }
.task-arrow { margin-left:auto; color:#84a28b; font-size:18px; }
.dashboard-attention-row { padding:10px 2px; }
.attention-status { margin-left:auto; color:#6d8d74; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; white-space:nowrap; }
.dashboard-garden-list { border-top:1px solid var(--line); }
.dashboard-garden-row { display:flex; width:100%; align-items:center; gap:14px; border-bottom:1px solid var(--line); background:transparent; color:var(--ink); text-align:left; text-decoration:none; padding:12px 2px; }
.dashboard-garden-row:hover { background:#f1f7f0; }
.dashboard-garden-row > span:first-child { min-width:0; flex:1; }
.dashboard-garden-row strong,.dashboard-garden-row small { display:block; }.dashboard-garden-row strong { font-size:var(--text-sm); font-weight:var(--weight-semibold); }.dashboard-garden-row small { margin-top:4px; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
.dashboard-garden-stats { color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; white-space:nowrap; }.dashboard-garden-stats b { color:#66816d; font-weight:var(--weight-medium); }.dashboard-garden-stats b.has-care { color:#a05d45; }
.harvest-row time { margin-left:auto; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }.harvest-dot { width:9px; height:9px; border-radius:50%; background:var(--yellow); }

@media (max-width:720px) {
  .dashboard-head { display:block; padding:45px 0 30px; }
  .dashboard-head h1 { font-size:var(--text-2xl); }
  .dashboard-head .ui-button { width:100%; margin-top:18px; }
  .dashboard-overview-line { margin-bottom:22px; line-height:var(--leading-relaxed); }.dashboard-overview-line span { padding:0 3px; }
  .dashboard-attention-row { align-items:flex-start; flex-wrap:wrap; }.attention-status { margin-left:49px; }
  .section-heading { margin-bottom:20px; }
  .dashboard-garden-row { flex-wrap:wrap; }.dashboard-garden-stats { width:100%; padding-left:49px; }
}
</style>
