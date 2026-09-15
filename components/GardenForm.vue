<script setup lang="ts">
const props = defineProps<{ compact?: boolean }>()
const emit = defineEmits<{ created: [id: string]; cancel: [] }>()
const name = ref('Horta do quintal')
const rows = ref(5)
const columns = ref(8)
const submitting = ref(false)
const error = ref('')

async function createGarden() {
  if (!name.value.trim()) return
  submitting.value = true; error.value = ''
  try {
    const garden = await $fetch<{ id: string }>('/api/gardens', { method: 'POST', body: { name: name.value, rows: rows.value, columns: columns.value } })
    emit('created', garden.id)
  } catch (cause: any) { error.value = cause?.data?.statusMessage || 'Não foi possível criar a horta.' }
  finally { submitting.value = false }
}
</script>

<template>
  <section class="welcome-card" :class="{ 'garden-form-compact': props.compact }">
    <div class="welcome-copy">
      <span class="eyebrow">{{ props.compact ? 'NOVA HORTA' : 'PRIMEIRO PASSO' }}</span>
      <h2 v-if="props.compact">Crie uma nova horta</h2><h2 v-else>Comece desenhando<br><em>sua horta</em></h2>
      <p>{{ props.compact ? 'Dê um nome e escolha o tamanho desta nova área de cultivo.' : 'Dê um nome e escolha o tamanho da sua área de cultivo. Você poderá preencher cada espaço ao seu ritmo.' }}</p>
    </div>
    <form class="garden-form" @submit.prevent="createGarden">
      <label>Nome da horta <input v-model="name" placeholder="Ex.: Horta do quintal" maxlength="80" /></label>
      <div class="form-row">
        <label>Linhas <input v-model.number="rows" type="number" min="1" max="30" /></label>
        <label>Colunas <input v-model.number="columns" type="number" min="1" max="30" /></label>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <div class="garden-form-actions"><UiButton v-if="props.compact" variant="outline" type="button" @click="emit('cancel')">Cancelar</UiButton><UiButton :disabled="submitting" type="submit">{{ submitting ? 'Criando…' : props.compact ? 'Criar horta' : 'Criar minha horta' }} <span class="button-arrow">→</span></UiButton></div>
    </form>
  </section>
</template>

<style scoped>
.welcome-card { margin-top:15px; padding:56px 65px; border:0; background:#d8f0d9; text-align:left; }
.welcome-card:not(.garden-form-compact) { display:grid; grid-template-columns:1fr 1fr; gap:75px; }
.welcome-copy h2 { margin:15px 0; font-size:var(--text-2xl); font-weight:var(--weight-bold); line-height:var(--leading-tight); letter-spacing:-.02em; }
.welcome-copy h2 em { color:#51955f; font-family:inherit; font-style:italic; font-weight:var(--weight-regular); }
.welcome-copy p { max-width:410px; color:#5a7960; font-size:var(--text-sm); line-height:var(--leading-relaxed); }
.garden-form { max-width:420px; align-self:center; }
.garden-form label { display:block; color:#5d7165; font-size:var(--text-sm); font-weight:var(--weight-medium); }.garden-form input { width:100%; margin-top:8px; padding:13px; border:1px solid #cbd9cc; border-radius:2px; outline:0; background:#fff; color:var(--ink); font-size:var(--text-sm); }
.garden-form input:focus { border-color:#6aac77; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:15px 0 25px; }
.garden-form-actions { display:flex; gap:9px; }
.garden-form-actions .ui-button { flex:1; }
.garden-form-compact { display:block; margin:0; padding:0; background:transparent; }
.garden-form-compact .welcome-copy { margin-bottom:22px; }
.garden-form-compact .welcome-copy h2 { margin:12px 0 8px; font-size:var(--text-2xl); letter-spacing:-.02em; }.garden-form-compact .welcome-copy p { margin:0; font-size:var(--text-sm); line-height:var(--leading-relaxed); }

@media (max-width:850px) {
  .welcome-card:not(.garden-form-compact) { grid-template-columns:1fr; gap:25px; padding:35px 25px; }
  .welcome-copy h2 { font-size:var(--text-2xl); }
}
</style>
