<script setup lang="ts">
import type { Garden, Task, UpcomingHarvest } from '~/types/domain'
const router = useRouter()
const gardens = ref<Garden[]>([])
const tasks = ref<Task[]>([])
const upcomingHarvests = ref<UpcomingHarvest[]>([])
const activeCount = ref(0)
const loading = ref(true)
const showForm = ref(false)
const error = ref('')
const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(date)).replace('.', '')
const garden = computed(() => gardens.value[0])

async function load() {
  loading.value = true
  try {
    gardens.value = await $fetch<Garden[]>('/api/gardens')
    if (garden.value) { const overview = await $fetch<{ activeCount: number; tasks: Task[]; upcomingHarvests: UpcomingHarvest[] }>('/api/tasks/today'); activeCount.value = overview.activeCount; tasks.value = overview.tasks; upcomingHarvests.value = overview.upcomingHarvests }
  } catch { error.value = 'Não foi possível carregar seu jardim.' }
  finally { loading.value = false }
}
function openGarden(id: string) { router.push(`/gardens/${id}`) }
onMounted(load)
</script>

<template>
  <main class="app-shell">
    <header class="topbar"><NuxtLink class="brand" to="/"><span class="brand-mark">✳</span><span>cultiva<span>.</span></span></NuxtLink><div class="topbar-right"><span class="family-label">NÚCLEO FAMILIAR</span><span class="avatar">MF</span></div></header>
    <section class="dashboard-head"><div><span class="eyebrow">BOM DIA, FAMÍLIA</span><h1>O que vamos <em>cultivar</em> hoje?</h1><p class="subtitle">Cuide do que importa. Um pequeno passo por vez.</p></div><button v-if="garden" class="button button-outline" @click="openGarden(garden.id)">Abrir minha horta <span>→</span></button></section>
    <p v-if="error" class="form-error">{{ error }}</p>
    <template v-if="loading"><div class="loading-card">Carregando seu espaço…</div></template>
    <template v-else-if="!garden && !showForm"><section class="empty-state"><div class="empty-illustration">🌱</div><h2>Sua horta começa aqui</h2><p>Crie seu primeiro espaço de cultivo e acompanhe cada plantio de perto.</p><button class="button button-dark" @click="showForm = true">Criar uma horta <span>→</span></button></section></template>
    <template v-else-if="showForm"><GardenForm @created="openGarden" /></template>
    <template v-else><section class="summary-grid"><button class="summary-card summary-primary" @click="openGarden(garden!.id)"><span class="card-label">MINHA HORTA</span><strong>{{ garden!.name }}</strong><span class="summary-link">Ver mapa <span>↗</span></span></button><div class="summary-card"><span class="card-label">CULTIVOS ATIVOS</span><strong>{{ activeCount }}</strong><span class="summary-note">Acompanhe no mapa</span></div><div class="summary-card"><span class="card-label">TAREFAS PARA HOJE</span><strong>{{ tasks.length }}</strong><span class="summary-note">{{ tasks.length ? 'Cuidados esperando por você' : 'Tudo em dia por aqui' }}</span></div></section><section class="dashboard-columns"><div class="dashboard-section"><div class="section-heading"><div><span class="eyebrow">ROTINA DE HOJE</span><h2>Cuidados pendentes <span>{{ tasks.length }}</span></h2></div><button class="text-button" @click="openGarden(garden!.id)">Ver mapa →</button></div><div v-if="tasks.length" class="task-list"><button v-for="task in tasks" :key="task.id" class="task-row" @click="openGarden(task.garden.id)"><span class="task-icon" :class="task.type === 'WATERING' ? 'blue' : 'green'">{{ task.type === 'WATERING' ? '💧' : '✦' }}</span><span><strong>{{ task.label }}</strong><small>Célula {{ String.fromCharCode(64 + task.plot.row) }}{{ task.plot.column }}</small></span><span class="task-arrow">→</span></button></div><div v-else class="soft-empty">Nenhum cuidado pendente. <strong>Você está em dia!</strong></div></div><div class="dashboard-section harvest-section"><div class="section-heading"><div><span class="eyebrow">PRÓXIMO CICLO</span><h2>Próximas colheitas</h2></div></div><div v-if="upcomingHarvests.length" class="harvest-list"><div v-for="item in upcomingHarvests" :key="item.plantingId" class="harvest-row"><span class="harvest-dot" /><span><strong>{{ item.cropName }}</strong><small>Célula {{ String.fromCharCode(64 + item.plot.row) }}{{ item.plot.column }}</small></span><time>{{ formatDate(item.expectedHarvestAt) }}</time></div></div><div v-else class="soft-empty">Seus próximos frutos vão aparecer aqui.</div></div></section></template>
  </main>
</template>
