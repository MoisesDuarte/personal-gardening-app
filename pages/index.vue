<script setup lang="ts">
import type { Garden, Task, UpcomingHarvest } from '~/types/domain'
import { formatAppDate } from '~/utils/dates'

const router = useRouter()
const gardens = ref<Garden[]>([])
const selectedGardenId = ref('')
const { revision } = useDevMode()
const { success } = useGardenToast()
const tasks = ref<Task[]>([])
const upcomingHarvests = ref<UpcomingHarvest[]>([])
const activeCountByGarden = ref<Record<string, number>>({})
const loading = ref(true)
const showForm = ref(false)
const error = ref('')
const formatDate = (date: string) => formatAppDate(date, { day: '2-digit', month: 'short' }).replace('.', '')
const garden = computed(() => gardens.value.find((item) => item.id === selectedGardenId.value) || gardens.value[0])
const visibleTasks = computed(() => garden.value ? tasks.value.filter((task) => task.garden.id === garden.value.id) : [])
const visibleHarvests = computed(() => garden.value ? upcomingHarvests.value.filter((item) => item.garden.id === garden.value.id) : [])
const activeCount = computed(() => garden.value ? activeCountByGarden.value[garden.value.id] || 0 : 0)

async function load() {
  loading.value = true; error.value = ''
  try {
    gardens.value = await $fetch<Garden[]>('/api/gardens')
    const storedId = import.meta.client ? localStorage.getItem('cultiva-selected-garden') : null
    if (storedId && gardens.value.some((item) => item.id === storedId)) selectedGardenId.value = storedId
    else if (!garden.value && gardens.value[0]) selectedGardenId.value = gardens.value[0].id
    if (garden.value) {
      const overview = await $fetch<{ activeCountByGarden?: Record<string, number>; tasks: Task[]; upcomingHarvests: UpcomingHarvest[] }>('/api/tasks/today')
      tasks.value = overview.tasks; upcomingHarvests.value = overview.upcomingHarvests; activeCountByGarden.value = overview.activeCountByGarden || { [garden.value.id]: 0 }
    }
  } catch { error.value = 'Não foi possível carregar suas hortas.' }
  finally { loading.value = false }
}
function openGarden(id: string) {
  selectedGardenId.value = id
  if (import.meta.client) localStorage.setItem('cultiva-selected-garden', id)
  router.push(`/gardens/${id}`)
}
function onGardenChange(event: Event) { const id = (event.target as HTMLSelectElement).value; if (id) selectedGardenId.value = id }
function createGarden() { showForm.value = true }
function onGardenCreated(id: string) { success('Horta criada', 'Sua nova horta está pronta para receber plantios.'); openGarden(id) }
watch(selectedGardenId, (id) => { if (id && import.meta.client) localStorage.setItem('cultiva-selected-garden', id) })
watch(revision, load)
onMounted(load)
</script>

<template>
  <main class="app-shell">
    <header class="topbar"><NuxtLink class="brand" to="/"><span class="brand-mark">✳</span><span>cultiva<span>.</span></span></NuxtLink><div class="topbar-right"><span class="family-label">NÚCLEO FAMILIAR</span><span class="avatar">MF</span></div></header>
    <section class="dashboard-head"><div><span class="eyebrow">BOM DIA, FAMÍLIA</span><h1>O que vamos <em>cultivar</em> hoje?</h1><p class="subtitle">Cuide do que importa. Um pequeno passo por vez.</p></div><div class="dashboard-head-actions"><UiButton v-if="garden" variant="outline" @click="openGarden(garden.id)">Abrir horta <span>→</span></UiButton><UiButton class="button button-dark" @click="createGarden">+ Nova horta</UiButton></div></section>
    <p v-if="error" class="form-error">{{ error }}</p>
    <template v-if="loading"><div class="loading-card">Carregando suas hortas…</div></template>
    <template v-else-if="!gardens.length && !showForm"><section class="empty-state"><div class="empty-illustration">🌱</div><h2>Nenhuma horta criada</h2><p>Crie seu primeiro espaço de cultivo e acompanhe cada plantio de perto.</p><button class="button button-dark" @click="createGarden">Criar primeira horta <span>→</span></button></section></template>
    <template v-else-if="showForm"><GardenForm @created="onGardenCreated" /></template>
    <template v-else-if="garden"><section class="dashboard-garden-selector"><label for="dashboard-garden">Horta selecionada</label><select id="dashboard-garden" :value="garden.id" aria-label="Selecionar horta" @change="onGardenChange"><option v-for="item in gardens" :key="item.id" :value="item.id">{{ item.name }}</option></select><span>{{ gardens.length }} {{ gardens.length === 1 ? 'horta' : 'hortas' }} cadastrada{{ gardens.length === 1 ? '' : 's' }}</span></section><section class="summary-grid"><button class="summary-card summary-primary" @click="openGarden(garden.id)"><span class="card-label">HORTA SELECIONADA</span><strong>{{ garden.name }}</strong><span class="summary-link">Ver mapa <span>↗</span></span></button><div class="summary-card"><span class="card-label">CULTIVOS ATIVOS</span><strong>{{ activeCount }}</strong><span class="summary-note">Acompanhe no mapa</span></div><div class="summary-card"><span class="card-label">TAREFAS PARA HOJE</span><strong>{{ visibleTasks.length }}</strong><span class="summary-note">{{ visibleTasks.length ? 'Cuidados esperando por você' : 'Tudo em dia por aqui' }}</span></div></section><section class="dashboard-columns"><div class="dashboard-section"><div class="section-heading"><div><span class="eyebrow">ROTINA DE HOJE</span><h2>Cuidados pendentes <span>{{ visibleTasks.length }}</span></h2></div><button class="text-button" @click="openGarden(garden.id)">Ver mapa →</button></div><div v-if="visibleTasks.length" class="task-list"><button v-for="task in visibleTasks" :key="task.id" class="task-row" @click="openGarden(task.garden.id)"><span class="task-icon" :class="task.type === 'WATERING' ? 'blue' : 'green'">{{ task.type === 'WATERING' ? '💧' : '✦' }}</span><span><strong>{{ task.label }}</strong><small>Célula {{ String.fromCharCode(64 + task.plot.row) }}{{ task.plot.column }}</small></span><span class="task-arrow">→</span></button></div><div v-else class="soft-empty">Nenhum cuidado pendente. <strong>Você está em dia!</strong></div></div><div class="dashboard-section harvest-section"><div class="section-heading"><div><span class="eyebrow">PRÓXIMO CICLO</span><h2>Próximas colheitas</h2></div></div><div v-if="visibleHarvests.length" class="harvest-list"><div v-for="item in visibleHarvests" :key="item.plantingId" class="harvest-row"><span class="harvest-dot" /><span><strong>{{ item.cropName }}</strong><small>Célula {{ String.fromCharCode(64 + item.plot.row) }}{{ item.plot.column }}</small></span><time>{{ formatDate(item.expectedHarvestAt) }}</time></div></div><div v-else class="soft-empty">Seus próximos frutos vão aparecer aqui.</div></div></section></template>
  </main>
</template>
