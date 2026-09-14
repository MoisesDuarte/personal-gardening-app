<script setup lang="ts">
import type { CropType, Planting, Plot } from '~/types/domain'
import { formatAppDate, relativeDayLabel } from '~/utils/dates'

const props = defineProps<{ plot: Plot | null; cropTypes: CropType[]; position?: { top: number; left: number } }>()
const emit = defineEmits<{ close: []; changed: [action: 'WATERING' | 'FERTILIZING' | 'HARVEST' | 'REMOVAL', planting: Planting]; sync: [plotId: string]; history: [planting: NonNullable<Plot['planting']>] }>()
const planting = computed(() => props.plot?.planting || null)
const selectedCrop = ref('')
const plantedAt = ref(new Date().toISOString().slice(0, 10))
const busy = ref(false)
const error = ref('')
const { success, error: notifyError } = useGardenToast()
const showRemoveConfirm = ref(false)
const formatDate = (date?: string | null) => date ? formatAppDate(date) : '—'
const stateLabel = (state: string) => ({ READY: 'Pronta para colher', NEAR_HARVEST: 'Quase lá', NEEDS_WATERING: 'Precisa irrigar', NEEDS_FERTILIZING: 'Precisa adubar', GROWING: 'Em crescimento' }[state] || 'Em crescimento')
const emoji = computed(() => planting.value?.cropType.name === 'Cenoura' ? '🥕' : planting.value?.cropType.name === 'Alface' ? '🥬' : '🌱')
const positionStyle = computed(() => props.position ? { top: `${props.position.top}px`, left: `${props.position.left}px` } : undefined)

function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
async function plant() {
  busy.value = true; error.value = ''
  try { const created = await $fetch<Planting>(`/api/plots/${props.plot!.id}/plantings`, { method: 'POST', body: { cropTypeId: selectedCrop.value, plantedAt: new Date(`${plantedAt.value}T12:00:00Z`) } }); success('Plantio registrado', `A célula ${String.fromCharCode(64 + props.plot!.row)}${props.plot!.column} está em acompanhamento.`); emit('changed', 'WATERING', created) }
  catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'Não foi possível registrar o plantio.'
    notifyError('Não foi possível registrar o plantio', error.value)
    if (cause?.statusCode === 409 || cause?.data?.statusCode === 409) emit('sync', props.plot!.id)
  }
  finally { busy.value = false }
}
async function care(type: 'WATERING' | 'FERTILIZING' | 'HARVEST') {
  busy.value = true; error.value = ''
  try {
    const updated = await $fetch<Planting>(`/api/plantings/${planting.value!.id}/events`, { method: 'POST', body: { type } })
    const name = planting.value!.cropType.name
    const label = type === 'WATERING' ? 'Irrigação registrada' : type === 'FERTILIZING' ? 'Adubação registrada' : 'Colheita registrada'
    const next = type === 'WATERING' ? `Próxima irrigação: ${relativeDayLabel(updated.wateringDaysUntil)}.` : type === 'FERTILIZING' ? `Próxima adubação: ${relativeDayLabel(updated.fertilizingDaysUntil)}.` : 'O bloco está disponível novamente.'
    success(label, type === 'HARVEST' ? next : `${name} foi atualizada. ${next}`)
    emit('changed', type, updated)
  }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível registrar a ação.'; notifyError('Não foi possível concluir a ação', error.value) }
  finally { busy.value = false }
}
async function removePlanting() {
  busy.value = true; error.value = ''
  try { const updated = await $fetch<Planting>(`/api/plantings/${planting.value!.id}/events`, { method: 'POST', body: { type: 'REMOVAL', notes: removeReason.value || undefined } }); success('Planta removida', 'O bloco está disponível para um novo plantio.'); emit('changed', 'REMOVAL', updated) }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível remover o plantio.'; notifyError('Não foi possível remover a planta', error.value) }
  finally { busy.value = false; showRemoveConfirm.value = false }
}
const removeReason = ref('')
const popover = ref<HTMLElement | null>(null)
watch(() => [props.plot?.id, props.plot?.planting?.id], async ([id]) => { if (id) { error.value = ''; showRemoveConfirm.value = false; await nextTick(); popover.value?.focus() } }, { immediate: true })
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="plot" class="popover-layer" @click.self="emit('close')">
    <section ref="popover" class="plant-popover" :style="positionStyle" role="dialog" aria-modal="false" aria-labelledby="planting-popover-title" tabindex="-1">
      <button class="close-button" aria-label="Fechar detalhes" @click="emit('close')">×</button>
      <span class="eyebrow">CÉLULA {{ String.fromCharCode(64 + plot.row) }}{{ plot.column }}</span>
      <template v-if="!planting">
        <h2 id="planting-popover-title">Plantar nesta célula</h2><p class="muted">Escolha um cultivo e comece um novo ciclo.</p>
        <form class="stack-form" @submit.prevent="plant">
          <label>Cultivo <select v-model="selectedCrop" required><option disabled value="">Selecione…</option><option v-for="crop in cropTypes" :key="crop.id" :value="crop.id">{{ crop.name }}</option></select></label>
          <label>Data do plantio <input v-model="plantedAt" type="date" required /></label>
          <p v-if="error" class="form-error">{{ error }}</p><UiButton class="button button-dark" :disabled="busy" type="submit">{{ busy ? 'Registrando…' : 'Registrar plantio' }} <span>→</span></UiButton>
        </form>
      </template>
      <template v-else>
        <div class="popover-title-row"><h2 id="planting-popover-title"><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }}</h2><span class="state-pill" :class="`pill-${planting.state.toLowerCase()}`">{{ stateLabel(planting.state) }}</span></div>
        <p class="muted">Plantada em {{ formatDate(planting.plantedAt) }} · {{ planting.ageInDays }} dias de vida</p>
        <div class="popover-alerts" aria-live="polite">
          <div :class="{ overdue: planting.wateringDaysUntil < 0 }"><span>💧 <strong>Próxima irrigação</strong></span><b>{{ relativeDayLabel(planting.wateringDaysUntil) }}</b></div>
          <div :class="{ overdue: planting.fertilizingDaysUntil < 0 }"><span>🌱 <strong>Próxima adubação</strong></span><b>{{ relativeDayLabel(planting.fertilizingDaysUntil) }}</b></div>
          <div><span>🧺 <strong>Colheita prevista</strong></span><b>{{ planting.daysToHarvest < 0 ? 'Pronta para colher' : relativeDayLabel(planting.daysToHarvest) }}</b></div>
        </div>
        <div class="popover-actions"><UiButton class="action-button" :variant="planting.needsWatering ? 'default' : 'outline'" :disabled="busy" @click="care('WATERING')">{{ busy ? '⟳ Registrando…' : '💧 Registrar irrigação' }}</UiButton><UiButton class="action-button" variant="outline" :disabled="busy" @click="care('FERTILIZING')">{{ busy ? '⟳ Registrando…' : '🌱 Registrar adubação' }}</UiButton><UiButton class="action-button harvest-button" variant="outline" :disabled="busy" @click="care('HARVEST')">🧺 Registrar colheita</UiButton></div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="details-link" @click="emit('history', planting)">Ver histórico <span>↗</span></button>
        <button v-if="!showRemoveConfirm" class="remove-link" @click="showRemoveConfirm = true">Remover/descartar planta</button>
        <div v-else class="remove-confirm"><strong>Remover esta planta?</strong><p>O plantio será encerrado e o espaço ficará disponível. O histórico será mantido.</p><label>Motivo (opcional) <input v-model="removeReason" maxlength="200" placeholder="Ex.: planta doente" /></label><div><UiButton variant="ghost" size="sm" :disabled="busy" @click="showRemoveConfirm = false">Cancelar</UiButton><UiButton variant="destructive" size="sm" :disabled="busy" @click="removePlanting">{{ busy ? 'Removendo…' : 'Remover planta' }}</UiButton></div></div>
      </template>
    </section>
  </div>
</template>
