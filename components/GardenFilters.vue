<script setup lang="ts">
const props = defineProps<{ total: number; free: number; care: number }>()
const model = defineModel<'all' | 'empty' | 'NEEDS_WATERING'>({ default: 'all' })
</script>

<template>
  <div class="garden-filters" aria-label="Filtros do mapa">
    <UiToggleGroup v-model="model" aria-label="Filtrar células da horta">
      <UiToggleGroupItem value="all">Todas <span>{{ props.total }}</span></UiToggleGroupItem>
      <UiToggleGroupItem value="empty">Livres <span>{{ props.free }}</span></UiToggleGroupItem>
      <UiToggleGroupItem value="NEEDS_WATERING">Precisam de cuidado <span>{{ props.care }}</span></UiToggleGroupItem>
    </UiToggleGroup>
  </div>
</template>
