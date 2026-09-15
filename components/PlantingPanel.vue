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
const emoji = computed(() => planting.value?.cropType.emoji || '🌱')

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
</script>

<template>
  <UiPopover :open="Boolean(plot)" :position="position" content-class="plant-popover" labelled-by="planting-popover-title" @update:open="(open) => { if (!open) emit('close') }">
    <section v-if="plot" ref="popover" class="plant-popover-body" tabindex="-1">
      <button class="close-button" aria-label="Fechar detalhes" @click="emit('close')">×</button>
      <span class="eyebrow">CÉLULA {{ String.fromCharCode(64 + plot.row) }}{{ plot.column }}</span>
      <template v-if="!planting">
        <h2 id="planting-popover-title">Plantar nesta célula</h2><p class="muted">Escolha um cultivo e comece um novo ciclo.</p>
        <div v-if="!cropTypes.length" class="planting-empty"><strong>Nenhuma planta disponível.</strong><p>Cadastre uma planta antes de criar um plantio.</p><NuxtLink class="text-button" to="/crop-types">Gerenciar plantas →</NuxtLink></div>
        <form v-else class="stack-form" @submit.prevent="plant">
          <label>Cultivo <select v-model="selectedCrop" required><option disabled value="">Selecione…</option><option v-for="crop in cropTypes" :key="crop.id" :value="crop.id">{{ crop.emoji }} {{ crop.name }}</option></select></label>
          <label>Data do plantio <input v-model="plantedAt" type="date" required /></label>
          <p v-if="error" class="form-error">{{ error }}</p><UiButton :disabled="busy" type="submit">{{ busy ? 'Registrando…' : 'Registrar plantio' }} <span class="button-arrow">→</span></UiButton>
        </form>
      </template>
      <template v-else>
        <div class="popover-title-row"><h2 id="planting-popover-title"><span aria-hidden="true">{{ emoji }}</span> {{ planting.cropType.name }}</h2><span class="state-pill" :class="`pill-${planting.state.toLowerCase()}`">{{ stateLabel(planting.state) }}</span></div>
        <p class="muted">Plantada em {{ formatDate(planting.plantedAt) }} · {{ planting.ageInDays }} dias de vida</p>
        <div class="popover-alerts" aria-live="polite">
          <div :class="{ overdue: planting.wateringDaysUntil < 0 }"><span>💧 <strong>Próxima irrigação</strong></span><b><span>{{ formatDate(planting.nextWateringAt) }}</span><small>{{ relativeDayLabel(planting.wateringDaysUntil) }}</small></b></div>
          <div :class="{ overdue: planting.fertilizingDaysUntil < 0 }"><span>🌱 <strong>Próxima adubação</strong></span><b><span>{{ formatDate(planting.nextFertilizingAt) }}</span><small>{{ relativeDayLabel(planting.fertilizingDaysUntil) }}</small></b></div>
          <div><span>🧺 <strong>Colheita prevista</strong></span><b><span>{{ formatDate(planting.expectedHarvestAt) }}</span><small>{{ planting.daysToHarvest < 0 ? 'Pronta para colher' : relativeDayLabel(planting.daysToHarvest) }}</small></b></div>
        </div>
        <div class="popover-actions"><UiButton class="action-button" :variant="planting.needsWatering ? 'default' : 'outline'" :disabled="busy" @click="care('WATERING')">{{ busy ? '⟳ Registrando…' : '💧 Registrar irrigação' }}</UiButton><UiButton class="action-button" variant="outline" :disabled="busy" @click="care('FERTILIZING')">{{ busy ? '⟳ Registrando…' : '🌱 Registrar adubação' }}</UiButton><UiButton class="action-button harvest-button" variant="outline" :disabled="busy" @click="care('HARVEST')">🧺 Registrar colheita</UiButton></div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="details-link" @click="emit('history', planting)">Ver histórico <span>↗</span></button>
        <button v-if="!showRemoveConfirm" class="remove-link" @click="showRemoveConfirm = true">Remover/descartar planta</button>
        <UiDialog :open="showRemoveConfirm" title="Remover planta" description="Confirme o encerramento deste plantio" @update:open="showRemoveConfirm = $event">
          <div class="remove-confirm"><strong>Remover esta planta?</strong><p>O plantio será encerrado e o espaço ficará disponível. O histórico será mantido.</p><label>Motivo (opcional) <input v-model="removeReason" maxlength="200" placeholder="Ex.: planta doente" /></label><div><UiButton variant="ghost" size="sm" :disabled="busy" @click="showRemoveConfirm = false">Cancelar</UiButton><UiButton variant="destructive" size="sm" :disabled="busy" @click="removePlanting">{{ busy ? 'Removendo…' : 'Remover planta' }}</UiButton></div></div>
        </UiDialog>
      </template>
    </section>
  </UiPopover>
</template>

<style scoped>
:global(.plant-popover) { position:relative; width:360px; max-height:calc(100vh - 32px); overflow:auto; padding:18px 20px 17px; border:1px solid #cfddd0; border-radius:8px; background:#fbfcf8; box-shadow:0 14px 40px #20332e25, 0 2px 8px #20332e12; color:var(--ink); }
:global(.plant-popover:focus-visible) { outline:3px solid #347a4b; outline-offset:3px; }
:global(.plant-popover h2) { margin:12px 0 6px; font-size:var(--text-xl); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.plant-popover-body { position:relative; }
.close-button { position:absolute; top:-12px; right:-22px; z-index:1; display:grid; min-width:44px; min-height:44px; place-items:center; padding:0; border:0; background:none; color:#7e8c83; font-size:var(--text-2xl); font-weight:var(--weight-regular); line-height:1; }
.popover-title-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.popover-title-row h2 { margin-bottom:0; }
.state-pill { margin-top:7px; padding:6px 8px; border-radius:20px; font-family:var(--font-mono); font-size:var(--text-xs); font-weight:var(--weight-medium); font-variant-numeric:tabular-nums; line-height:var(--leading-normal); white-space:nowrap; }
.pill-ready { background:#f9d7c3; color:#ac6343; }
.pill-near_harvest { background:#f9ebaf; color:#90772f; }
.pill-growing { background:#d9f0dc; color:#4b8b59; }
.pill-needs_watering,.pill-needs_fertilizing { background:#dcefe3; color:#4b8b59; }
.popover-alerts { margin:14px 0 13px; border-top:1px solid var(--line); }
.popover-alerts > div { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px solid var(--line); font-size:var(--text-xs); }
.popover-alerts strong { font-weight:var(--weight-semibold); }
.popover-alerts b { color:#4d7c57; font-size:var(--text-xs); font-weight:var(--weight-semibold); font-variant-numeric:tabular-nums; text-align:right; }
.popover-alerts b > span,.popover-alerts b small { display:block; }
.popover-alerts b small { margin-top:3px; color:#76927b; font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--weight-regular); }
.popover-alerts .overdue b,.popover-alerts .overdue b small { color:#a74737; }
.popover-actions { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:7px; }
.action-button { min-height:40px; padding:8px 9px; font-size:var(--text-sm); text-align:left; }
.harvest-button { grid-column:1 / -1; justify-content:center; text-align:center; }
.details-link,.remove-link { display:block; width:100%; margin-top:13px; border:0; background:none; color:#4c8a59; font-size:var(--text-sm); font-weight:var(--weight-semibold); text-align:left; text-decoration:none; }
.details-link span { float:right; font-size:18px; }
.remove-link { margin-top:14px; color:#9a6359; font-weight:var(--weight-medium); }
.remove-confirm { margin-top:0; padding:0; border:0; background:transparent; }
.remove-confirm strong { font-size:var(--text-md); font-weight:var(--weight-semibold); }
.remove-confirm p { margin:7px 0 14px; color:#786d68; font-size:var(--text-sm); line-height:var(--leading-relaxed); }
.remove-confirm label { display:block; color:#6a6d68; font-size:var(--text-xs); font-weight:var(--weight-medium); }
.remove-confirm input { width:100%; margin-top:7px; padding:10px; border:1px solid #e2cbc1; background:#fff; font-size:var(--text-sm); }
.remove-confirm > div { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
.stack-form { margin-top:30px; }
.stack-form label { display:block; color:#5d7165; font-size:var(--text-sm); font-weight:var(--weight-medium); }
.stack-form label + label { margin-top:17px; }
.stack-form input,.stack-form select { width:100%; margin-top:8px; padding:13px; border:1px solid #cbd9cc; border-radius:2px; outline:0; background:#fff; color:var(--ink); font-size:var(--text-sm); }
.stack-form input:focus,.stack-form select:focus { border-color:#6aac77; }
.stack-form .ui-button { width:100%; margin-top:25px; }
.planting-empty { margin-top:25px; border:1px dashed #cbd9cc; background:#f4f8f1; padding:18px; }
.planting-empty strong { display:block; font-size:var(--text-sm); font-weight:var(--weight-semibold); }
.planting-empty p { margin:7px 0 12px; color:var(--muted); font-size:var(--text-xs); line-height:var(--leading-relaxed); }

@media (max-width:720px) {
  :global(.plant-popover) { right:12px; bottom:12px; left:12px !important; width:auto; max-height:calc(100vh - 24px); transform:none !important; border-radius:12px; padding:25px 21px 21px; }
  .popover-actions { grid-template-columns:1fr; }
  .harvest-button { grid-column:auto; }
}

@media (min-width:721px) {
  :global(.plant-popover h2) { margin:7px 0 4px; font-size:var(--text-xl); }
}
</style>
