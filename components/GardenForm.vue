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
      <div class="garden-form-actions"><button v-if="props.compact" class="button button-outline" type="button" @click="emit('cancel')">Cancelar</button><button class="button button-dark" :disabled="submitting" type="submit">{{ submitting ? 'Criando…' : props.compact ? 'Criar horta' : 'Criar minha horta' }} <span>→</span></button></div>
    </form>
  </section>
</template>
