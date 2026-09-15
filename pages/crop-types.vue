<script setup lang="ts">
import type { CropType } from '~/types/domain'

type CropForm = {
  emoji: string
  name: string
  defaultWateringIntervalDays: number
  defaultFertilizingIntervalDays: number
  defaultHarvestDays: number
}

const { success, error: notifyError } = useGardenToast()
const cropTypes = ref<CropType[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const filter = ref<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE')
const formOpen = ref(false)
const formError = ref('')
const saving = ref(false)
const editing = ref<CropType | null>(null)
const form = reactive<CropForm>({ emoji: '🌱', name: '', defaultWateringIntervalDays: 2, defaultFertilizingIntervalDays: 7, defaultHarvestDays: 45 })
const impactOpen = ref(false)
const pendingSave = ref<CropForm | null>(null)
const deactivateOpen = ref(false)
const selectedCrop = ref<CropType | null>(null)
const actionBusyId = ref<string | null>(null)

const filteredCropTypes = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  return cropTypes.value.filter((crop) => {
    const matchesFilter = filter.value === 'ALL' || (filter.value === 'ACTIVE' ? crop.isActive : !crop.isActive)
    const matchesSearch = !term || crop.name.toLocaleLowerCase('pt-BR').includes(term)
    return matchesFilter && matchesSearch
  })
})
const activeCount = (crop?: CropType | null) => crop?.activePlantingCount || 0
const formTitle = computed(() => editing.value ? `Editar ${editing.value.name}` : 'Nova planta')
const formDescription = computed(() => editing.value ? 'Atualize a configuração reutilizada pelos plantios.' : 'Crie um tipo disponível para todas as suas hortas.')

function resetForm() {
  form.emoji = '🌱'; form.name = ''; form.defaultWateringIntervalDays = 2; form.defaultFertilizingIntervalDays = 7; form.defaultHarvestDays = 45
  formError.value = ''
}
function openCreate() { editing.value = null; resetForm(); formOpen.value = true }
function openEdit(crop: CropType) {
  editing.value = crop
  form.emoji = crop.emoji; form.name = crop.name; form.defaultWateringIntervalDays = crop.defaultWateringIntervalDays; form.defaultFertilizingIntervalDays = crop.defaultFertilizingIntervalDays; form.defaultHarvestDays = crop.defaultHarvestDays
  formError.value = ''; formOpen.value = true
}
function validateForm() {
  const name = form.name.trim()
  const emoji = form.emoji.trim()
  if (name.length < 2 || name.length > 80) return 'O nome deve ter entre 2 e 80 caracteres.'
  if (!emoji || emoji.length > 8) return 'Informe um emoji curto.'
  if (![form.defaultWateringIntervalDays, form.defaultFertilizingIntervalDays].every((value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 365)) return 'Os intervalos devem ser inteiros entre 1 e 365 dias.'
  if (!Number.isInteger(Number(form.defaultHarvestDays)) || Number(form.defaultHarvestDays) < 1 || Number(form.defaultHarvestDays) > 730) return 'O ciclo deve ser um inteiro entre 1 e 730 dias.'
  return ''
}
function formPayload(): CropForm {
  return { emoji: form.emoji.trim(), name: form.name.trim(), defaultWateringIntervalDays: Number(form.defaultWateringIntervalDays), defaultFertilizingIntervalDays: Number(form.defaultFertilizingIntervalDays), defaultHarvestDays: Number(form.defaultHarvestDays) }
}
function parametersChanged(payload: CropForm) {
  const crop = editing.value
  return Boolean(crop && (payload.defaultWateringIntervalDays !== crop.defaultWateringIntervalDays || payload.defaultFertilizingIntervalDays !== crop.defaultFertilizingIntervalDays || payload.defaultHarvestDays !== crop.defaultHarvestDays))
}
async function save() {
  formError.value = validateForm()
  if (formError.value) return
  const payload = formPayload()
  if (editing.value && activeCount(editing.value) > 0 && parametersChanged(payload)) { pendingSave.value = payload; impactOpen.value = true; return }
  await performSave(payload)
}
async function performSave(payload: CropForm) {
  saving.value = true; formError.value = ''
  try {
    if (editing.value) await $fetch(`/api/crop-types/${editing.value.id}`, { method: 'PATCH', body: payload })
    else await $fetch('/api/crop-types', { method: 'POST', body: payload })
    await load()
    success(editing.value ? 'Planta atualizada' : 'Planta criada', editing.value ? `${payload.name} foi atualizada.` : `${payload.name} já está disponível para novos plantios.`)
    formOpen.value = false
  } catch (cause: any) {
    formError.value = cause?.data?.statusMessage || 'Não foi possível salvar a planta.'
    notifyError('Não foi possível atualizar a planta', formError.value)
  } finally { saving.value = false }
}
async function confirmImpactSave() {
  impactOpen.value = false
  if (pendingSave.value) { const payload = pendingSave.value; pendingSave.value = null; await performSave(payload) }
}
function askDeactivate(crop: CropType) { selectedCrop.value = crop; deactivateOpen.value = true }
async function deactivate() {
  if (!selectedCrop.value) return
  actionBusyId.value = selectedCrop.value.id
  try {
    await $fetch(`/api/crop-types/${selectedCrop.value.id}/deactivate`, { method: 'POST' })
    success('Planta desativada', 'Ela não aparecerá em novos plantios.')
    deactivateOpen.value = false; await load()
  } catch (cause: any) { notifyError('Não foi possível desativar a planta', cause?.data?.statusMessage || 'Tente novamente em instantes.') }
  finally { actionBusyId.value = null }
}
async function reactivate(crop: CropType) {
  actionBusyId.value = crop.id
  try { await $fetch(`/api/crop-types/${crop.id}/reactivate`, { method: 'POST' }); success('Planta reativada', `${crop.name} voltou a aparecer em novos plantios.`); await load() }
  catch (cause: any) { notifyError('Não foi possível reativar a planta', cause?.data?.statusMessage || 'Tente novamente em instantes.') }
  finally { actionBusyId.value = null }
}
async function load() {
  loading.value = true; error.value = ''
  try { cropTypes.value = await $fetch<CropType[]>('/api/crop-types?includeInactive=true') }
  catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível carregar as plantas.' }
  finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <AppShell class="crop-page">

    <section class="crop-heading"><div><span class="eyebrow">CONFIGURAÇÃO DO SISTEMA</span><h1>Plantas</h1><p class="subtitle">Gerencie os tipos de cultivo disponíveis nas suas hortas.</p></div><UiButton @click="openCreate">+ Nova planta</UiButton></section>
    <div class="crop-toolbar"><label class="crop-search"><span class="sr-only">Buscar plantas</span><input v-model="search" type="search" placeholder="Buscar plantas…" /></label><div class="crop-filters" role="group" aria-label="Filtrar plantas"><button :class="{ active: filter === 'ACTIVE' }" @click="filter = 'ACTIVE'">Ativas</button><button :class="{ active: filter === 'INACTIVE' }" @click="filter = 'INACTIVE'">Inativas</button><button :class="{ active: filter === 'ALL' }" @click="filter = 'ALL'">Todas</button></div></div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div v-if="loading" class="loading-card">Carregando plantas…</div>
    <div v-else-if="!filteredCropTypes.length" class="soft-empty crop-empty">Nenhuma planta encontrada.</div>
    <section v-else class="crop-list" aria-label="Tipos de planta">
      <article v-for="crop in filteredCropTypes" :key="crop.id" class="crop-row" :class="{ 'crop-row-inactive': !crop.isActive }">
        <div class="crop-identity"><span class="crop-emoji" aria-hidden="true">{{ crop.emoji }}</span><div><div class="crop-name-line"><h2>{{ crop.name }}</h2><UiBadge v-if="!crop.isActive" variant="warning">Inativa</UiBadge></div><p>{{ crop.defaultWateringIntervalDays }}d irrigação · {{ crop.defaultFertilizingIntervalDays }}d adubação · {{ crop.defaultHarvestDays }}d ciclo</p><small v-if="activeCount(crop)">{{ activeCount(crop) }} {{ activeCount(crop) === 1 ? 'plantio ativo' : 'plantios ativos' }}</small><small v-else>Nenhum plantio ativo</small></div></div>
        <div class="crop-actions"><UiButton variant="outline" size="sm" :disabled="actionBusyId === crop.id" @click="openEdit(crop)">Editar</UiButton><UiButton v-if="crop.isActive" variant="ghost" size="sm" :disabled="actionBusyId === crop.id" @click="askDeactivate(crop)">Desativar</UiButton><UiButton v-else variant="outline" size="sm" :disabled="actionBusyId === crop.id" @click="reactivate(crop)">{{ actionBusyId === crop.id ? 'Reativando…' : 'Reativar' }}</UiButton></div>
      </article>
    </section>

    <UiDialog :open="formOpen" :title="formTitle" :description="formDescription" @update:open="formOpen = $event">
      <form class="crop-form" @submit.prevent="save">
        <div class="crop-form-preview"><span class="crop-emoji crop-emoji-large" aria-hidden="true">{{ form.emoji.trim() || '🌱' }}</span><span><small>PREVIEW</small><strong>{{ form.name.trim() || 'Nome da planta' }}</strong></span></div>
        <label>Emoji<input v-model="form.emoji" maxlength="8" placeholder="🥬" /></label>
        <label>Nome<input v-model="form.name" maxlength="80" required placeholder="Alface" /></label>
        <div class="crop-form-grid"><label>Irrigar a cada<div class="unit-input"><input v-model.number="form.defaultWateringIntervalDays" type="number" min="1" max="365" required /><span>dias</span></div></label><label>Adubar a cada<div class="unit-input"><input v-model.number="form.defaultFertilizingIntervalDays" type="number" min="1" max="365" required /><span>dias</span></div></label><label>Ciclo estimado<div class="unit-input"><input v-model.number="form.defaultHarvestDays" type="number" min="1" max="730" required /><span>dias</span></div></label></div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="crop-form-actions"><UiButton variant="ghost" type="button" :disabled="saving" @click="formOpen = false">Cancelar</UiButton><UiButton type="submit" :disabled="saving">{{ saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar planta' }}</UiButton></div>
      </form>
    </UiDialog>
    <UiDialog :open="impactOpen" title="Alterar parâmetros?" description="Esta alteração usa os parâmetros atuais dos plantios." @update:open="impactOpen = $event">
      <div class="crop-confirm"><p>Existem <strong>{{ activeCount(editing!) }} {{ activeCount(editing!) === 1 ? 'plantio ativo' : 'plantios ativos' }}</strong> de {{ editing?.name }}.</p><p>As próximas datas de irrigação, adubação ou colheita podem ser recalculadas usando os novos valores.</p><div><UiButton variant="ghost" :disabled="saving" @click="impactOpen = false">Cancelar</UiButton><UiButton :disabled="saving" @click="confirmImpactSave">Salvar alterações</UiButton></div></div>
    </UiDialog>
    <UiDialog :open="deactivateOpen" :title="`Desativar ${selectedCrop?.name || 'planta'}?`" description="Ela não ficará disponível para novos plantios." @update:open="deactivateOpen = $event">
      <div class="crop-confirm"><p v-if="selectedCrop && activeCount(selectedCrop)">Existem <strong>{{ activeCount(selectedCrop) }} {{ activeCount(selectedCrop) === 1 ? 'plantio ativo' : 'plantios ativos' }}</strong> desta planta em suas hortas.</p><p>Desativar impedirá novos plantios, mas não removerá nem alterará os cultivos existentes. Plantios históricos continuarão preservados.</p><div><UiButton variant="ghost" :disabled="actionBusyId === selectedCrop?.id" @click="deactivateOpen = false">Cancelar</UiButton><UiButton variant="destructive" :disabled="actionBusyId === selectedCrop?.id" @click="deactivate">{{ actionBusyId === selectedCrop?.id ? 'Desativando…' : 'Desativar planta' }}</UiButton></div></div>
    </UiDialog>
  </AppShell>
</template>

<style scoped>
.crop-page { max-width:1080px; }
.crop-heading { display:flex; align-items:end; justify-content:space-between; gap:24px; padding:50px 0 28px; }.crop-heading h1 { margin:11px 0 7px; font-size:var(--text-display); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.crop-toolbar { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:12px; }.crop-search { flex:1; max-width:360px; }.crop-search input { width:100%; min-height:38px; border:1px solid #cbd9cc; border-radius:3px; background:#fff; color:var(--ink); padding:9px 11px; font-size:var(--text-sm); outline:0; }.crop-search input:focus { border-color:#6aac77; box-shadow:0 0 0 2px #d8f0d9; }
.crop-filters { display:flex; gap:3px; border:1px solid #d5e1d5; border-radius:4px; background:#eef5ec; padding:3px; }.crop-filters button { min-height:31px; border:0; border-radius:2px; background:transparent; color:#6f8375; padding:6px 12px; font-size:var(--text-xs); font-weight:var(--weight-semibold); }.crop-filters button.active { background:#fff; color:var(--ink); box-shadow:0 1px 3px #20332e12; }
.crop-list { border-top:1px solid var(--line); background:#fff; }.crop-row { display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:84px; border-bottom:1px solid var(--line); padding:13px 15px; }.crop-row-inactive { background:#fafbf8; }.crop-identity { display:flex; min-width:0; align-items:center; gap:13px; }.crop-emoji { display:grid; width:40px; height:40px; flex:0 0 40px; place-items:center; border-radius:50%; background:#eef6ec; font-size:21px; }.crop-emoji-large { width:42px; height:42px; flex-basis:42px; font-size:23px; }.crop-name-line { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }.crop-name-line h2 { margin:0; font-size:var(--text-md); font-weight:var(--weight-semibold); letter-spacing:0; }.crop-identity p { margin:5px 0 0; color:#68806e; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }.crop-identity small { display:block; margin-top:5px; color:var(--muted); font-size:var(--text-xs); }.crop-actions { display:flex; flex:0 0 auto; align-items:center; gap:6px; }.crop-empty { border-top:1px solid var(--line); border-bottom:1px solid var(--line); background:#fff; padding:48px 15px; text-align:center; }
.crop-form { display:grid; gap:13px; }.crop-form > label,.crop-form-grid label { display:block; color:#5d7165; font-size:var(--text-sm); font-weight:var(--weight-medium); }.crop-form input { width:100%; min-height:38px; margin-top:6px; border:1px solid #cbd9cc; border-radius:3px; outline:0; background:#fff; color:var(--ink); padding:9px 10px; font-size:var(--text-sm); }.crop-form input:focus { border-color:#6aac77; }.crop-form-preview { display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--line); padding-bottom:13px; }.crop-form-preview small,.crop-form-preview strong { display:block; }.crop-form-preview small { color:#809088; font-size:var(--text-xs); font-weight:var(--weight-semibold); letter-spacing:.08em; }.crop-form-preview strong { margin-top:3px; font-size:var(--text-md); font-weight:var(--weight-semibold); }.crop-form-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }.unit-input { display:flex; align-items:center; margin-top:6px; border:1px solid #cbd9cc; border-radius:3px; background:#fff; }.unit-input input { min-width:0; margin:0; border:0; }.unit-input span { padding-right:9px; color:var(--muted); font-size:var(--text-xs); }.crop-form-actions,.crop-confirm > div { display:flex; justify-content:flex-end; gap:7px; margin-top:3px; }.crop-confirm p { margin:0 0 12px; color:var(--ink); font-size:var(--text-sm); line-height:var(--leading-relaxed); }.crop-confirm p + p { color:var(--muted); }
@media (max-width:720px) { .crop-heading { align-items:flex-start; flex-direction:column; padding:35px 0 24px; }.crop-heading h1 { font-size:var(--text-2xl); }.crop-heading .ui-button { width:100%; }.crop-toolbar { align-items:stretch; flex-direction:column; }.crop-search { max-width:none; }.crop-filters { width:100%; }.crop-filters button { flex:1; }.crop-row { align-items:flex-start; flex-direction:column; gap:11px; }.crop-actions { width:100%; justify-content:flex-end; }.crop-form-grid { grid-template-columns:1fr; } }
</style>
