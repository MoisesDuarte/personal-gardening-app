<script setup lang="ts">
import DevPanel from '~/components/dev/DevPanel.vue'
import { Toaster } from 'vue-sonner'
const config = useRuntimeConfig()
</script>

<template>
  <NuxtPage />
  <ClientOnly><Toaster position="bottom-right" rich-colors :visible-toasts="4" /></ClientOnly>
  <ClientOnly><DevPanel v-if="config.public.devModeEnabled" /></ClientOnly>
</template>
