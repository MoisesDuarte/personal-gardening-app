<script setup lang="ts">
import type { DashboardData, GardenSummary } from '~/types/domain'

const router = useRouter()
const { success } = useGardenToast()
const gardens = ref<GardenSummary[]>([])
const loading = ref(true)
const error = ref('')
const createOpen = ref(false)

async function load() {
  loading.value = true; error.value = ''
  try { gardens.value = (await $fetch<DashboardData>('/api/dashboard')).gardens }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível carregar suas hortas.' }
  finally { loading.value = false }
}
function openGarden(id: string) { router.push(`/gardens/${id}`) }
function onGardenCreated(id: string) { createOpen.value = false; success('Horta criada', 'Sua nova horta está pronta para receber plantios.'); router.push(`/gardens/${id}`) }
onMounted(load)
</script>

<template>
  <AppShell>
    <section class="page-heading"><div><span class="eyebrow">SEUS ESPAÇOS</span><h1>Hortas</h1><p class="subtitle">Gerencie suas áreas de cultivo.</p></div><UiButton @click="createOpen = true">+ Nova horta</UiButton></section>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div v-if="loading" class="loading-card">Carregando suas hortas…</div>
    <section v-else-if="gardens.length" class="garden-list" aria-label="Suas hortas"><button v-for="item in gardens" :key="item.garden.id" class="garden-list-row" @click="openGarden(item.garden.id)"><span class="garden-list-main"><strong>{{ item.garden.name }}</strong><small>{{ item.garden.rows }} × {{ item.garden.columns }} blocos</small></span><span class="garden-list-stats"><b>{{ item.activeCount }}</b> ativos <span>·</span> <b>{{ item.freeCount }}</b> livres <span>·</span> <strong :class="{ 'has-care': item.careCount }">{{ item.careCount ? `${item.careCount} cuidados` : 'Tudo em dia' }}</strong></span><span class="task-arrow">→</span></button></section>
    <section v-else class="empty-state garden-list-empty"><div class="empty-illustration">🌱</div><h2>Nenhuma horta criada</h2><p>Crie uma área de cultivo para começar a organizar seus plantios.</p><UiButton @click="createOpen = true">+ Nova horta</UiButton></section>
    <UiSheet :open="createOpen" title="Nova horta" description="Crie uma nova área de cultivo" @update:open="createOpen = $event"><GardenForm compact @created="onGardenCreated" @cancel="createOpen = false" /></UiSheet>
  </AppShell>
</template>

<style scoped>
.page-heading { display:flex; align-items:end; justify-content:space-between; gap:24px; padding:50px 0 30px; }
.page-heading h1 { margin:11px 0 7px; font-size:var(--text-display); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.garden-list { border-top:1px solid var(--line); background:#fff; }
.garden-list-row { display:flex; width:100%; min-height:76px; align-items:center; gap:14px; border:0; border-bottom:1px solid var(--line); background:#fff; color:var(--ink); padding:13px 15px; text-align:left; }
.garden-list-row:hover { background:#f1f7f0; }.garden-list-main { min-width:0; flex:1; }.garden-list-main strong,.garden-list-main small { display:block; }.garden-list-main strong { font-size:var(--text-sm); font-weight:var(--weight-semibold); }.garden-list-main small { margin-top:4px; color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
.garden-list-stats { color:var(--muted); font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; white-space:nowrap; }.garden-list-stats b,.garden-list-stats strong { color:#66816d; font-weight:var(--weight-medium); }.garden-list-stats strong.has-care { color:#a05d45; }.garden-list-stats span { padding:0 5px; color:#b1beb3; }
.task-arrow { margin-left:auto; color:#84a28b; font-size:18px; }.garden-list-empty { margin-top:0; }
@media (max-width:850px) { .page-heading { padding:38px 0 25px; } }
@media (max-width:720px) { .page-heading { align-items:flex-start; flex-direction:column; gap:18px; }.page-heading h1 { font-size:var(--text-2xl); }.page-heading .ui-button { width:100%; }.garden-list-row { align-items:flex-start; flex-wrap:wrap; }.garden-list-stats { width:100%; padding-left:0; } }
</style>
