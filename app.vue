<script setup lang="ts">
import DevPanel from '~/components/dev/DevPanel.vue'
const config = useRuntimeConfig()
</script>

<template>
  <NuxtPage />
  <ClientOnly><UiToaster /></ClientOnly>
  <ClientOnly><DevPanel v-if="config.public.devModeEnabled" /></ClientOnly>
</template>
