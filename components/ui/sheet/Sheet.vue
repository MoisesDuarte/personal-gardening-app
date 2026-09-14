<script setup lang="ts">
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
const props = defineProps<{ open: boolean; title: string; description?: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
</script>

<template><DialogRoot :open="props.open" @update:open="emit('update:open', $event)"><DialogPortal><DialogOverlay class="ui-sheet-overlay" /><DialogContent class="ui-sheet-content"><DialogTitle class="sr-only">{{ title }}</DialogTitle><DialogDescription v-if="description" class="sr-only">{{ description }}</DialogDescription><slot /></DialogContent></DialogPortal></DialogRoot></template>
