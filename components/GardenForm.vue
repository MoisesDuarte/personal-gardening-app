<script setup lang="ts">
const emit = defineEmits<{ created: [id: string] }>()
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
  <section class="welcome-card">
    <div class="welcome-copy">
      <span class="eyebrow">PRIMEIRO PASSO</span>
      <h2>Comece desenhando<br><em>sua horta</em></h2>
      <p>Dê um nome e escolha o tamanho da sua área de cultivo. Você poderá preencher cada espaço ao seu ritmo.</p>
    </div>
    <form class="garden-form" @submit.prevent="createGarden">
      <label>Nome da horta <input v-model="name" placeholder="Ex.: Horta do quintal" maxlength="80" /></label>
      <div class="form-row">
        <label>Linhas <input v-model.number="rows" type="number" min="1" max="30" /></label>
        <label>Colunas <input v-model.number="columns" type="number" min="1" max="30" /></label>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <button class="button button-dark" :disabled="submitting" type="submit">{{ submitting ? 'Criando…' : 'Criar minha horta' }} <span>→</span></button>
    </form>
  </section>
</template>
