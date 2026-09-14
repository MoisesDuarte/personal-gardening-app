<script setup lang="ts">
import type { CropType, Plot, Planting } from '~/types/domain'
const props = defineProps<{ plot: Plot | null; cropTypes: CropType[] }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const planting = computed(() => props.plot?.planting || null)
const selectedCrop = ref('')
const plantedAt = ref(new Date().toISOString().slice(0, 10))
const busy = ref(false)
const error = ref('')
const formatDate = (date?: string | null) => date ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(date)).replace('.', '') : '—'
const actionLabel = (type: string) => type === 'WATERING' ? 'Irrigação' : type === 'FERTILIZING' ? 'Adubação' : 'Colheita'
const stateLabel = (state: string) => ({ READY: 'Pronta', NEAR_HARVEST: 'Quase lá', NEEDS_WATERING: 'Precisa irrigar', NEEDS_FERTILIZING: 'Precisa adubar', GROWING: 'Em crescimento' }[state] || 'Em crescimento')

async function plant() {
  busy.value = true; error.value = ''
  try { await $fetch(`/api/plots/${props.plot!.id}/plantings`, { method: 'POST', body: { cropTypeId: selectedCrop.value, plantedAt: new Date(`${plantedAt.value}T12:00:00Z`) } }); emit('changed') }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível registrar o plantio.' }
  finally { busy.value = false }
}
async function care(type: 'WATERING' | 'FERTILIZING' | 'HARVEST') {
  busy.value = true; error.value = ''
  try { await $fetch(`/api/plantings/${planting.value!.id}/events`, { method: 'POST', body: { type } }); emit('changed') }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível registrar a ação.' }
  finally { busy.value = false }
}
</script>

<template>
  <aside v-if="plot" class="panel-overlay" @click.self="emit('close')">
    <div class="detail-panel">
      <button class="close-button" aria-label="Fechar" @click="emit('close')">×</button>
      <span class="eyebrow">CÉLULA {{ String.fromCharCode(64 + plot.row) }}{{ plot.column }}</span>
      <template v-if="!planting">
        <h2>Plantar nesta célula</h2><p class="muted">Escolha um cultivo e a data em que ele foi plantado.</p>
        <form class="stack-form" @submit.prevent="plant">
          <label>Cultivo <select v-model="selectedCrop" required><option disabled value="">Selecione…</option><option v-for="crop in cropTypes" :key="crop.id" :value="crop.id">{{ crop.name }}</option></select></label>
          <label>Data do plantio <input v-model="plantedAt" type="date" required /></label>
          <p v-if="error" class="form-error">{{ error }}</p><button class="button button-dark" :disabled="busy" type="submit">{{ busy ? 'Salvando…' : 'Registrar plantio' }} <span>→</span></button>
        </form>
      </template>
      <template v-else>
        <div class="panel-title-row"><div><h2>{{ planting.cropType.name }}</h2><p class="muted">Plantio ativo · {{ formatDate(planting.plantedAt) }}</p></div><span class="state-pill" :class="`pill-${planting.state.toLowerCase()}`">{{ stateLabel(planting.state) }}</span></div>
        <div class="age-card"><strong>{{ planting.ageInDays }}</strong><span>dias de vida</span><div class="age-bar"><i :style="{ width: `${Math.min(100, Math.round(planting.ageInDays / Math.max(1, Math.ceil((new Date(planting.expectedHarvestAt).getTime() - new Date(planting.plantedAt).getTime()) / 86400000)) * 100))}%` }" /></div></div>
        <div class="detail-list"><div><span>Previsão de colheita</span><strong>{{ formatDate(planting.expectedHarvestAt) }}</strong></div><div><span>Próxima irrigação</span><strong>{{ formatDate(planting.nextWateringAt) }}</strong></div><div><span>Próxima adubação</span><strong>{{ formatDate(planting.nextFertilizingAt) }}</strong></div></div>
        <div class="action-grid"><button class="action-button" :disabled="busy" @click="care('WATERING')"><span>💧</span> Irriguei</button><button class="action-button" :disabled="busy" @click="care('FERTILIZING')"><span>✦</span> Adubei</button><button class="action-button harvest-button" :disabled="busy" @click="care('HARVEST')"><span>✓</span> Colhi</button></div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <div class="history"><h3>Histórico recente</h3><p v-if="!planting.events.length" class="muted">Nenhum cuidado registrado ainda.</p><div v-for="event in [...planting.events].reverse().slice(0, 5)" :key="event.id" class="history-row"><span>{{ event.type === 'WATERING' ? '💧' : event.type === 'FERTILIZING' ? '✦' : '✓' }}</span><span>{{ actionLabel(event.type) }}</span><time>{{ formatDate(event.performedAt) }}</time></div></div>
      </template>
    </div>
  </aside>
</template>
