<script setup lang="ts">
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
const props = defineProps<{ open: boolean; title: string; description?: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
</script>

<template><DialogRoot :open="props.open" @update:open="emit('update:open', $event)"><DialogPortal><DialogOverlay class="ui-sheet-overlay" /><DialogContent class="ui-sheet-content"><DialogTitle class="sr-only">{{ title }}</DialogTitle><DialogDescription v-if="description" class="sr-only">{{ description }}</DialogDescription><slot /></DialogContent></DialogPortal></DialogRoot></template>

<style scoped>
:global(.ui-sheet-overlay) { position:fixed; inset:0; z-index:30; background:#20332e30; }
:global(.ui-sheet-content) { position:fixed; top:0; right:0; bottom:0; z-index:31; width:min(470px,100vw); overflow:auto; padding:20px 24px 32px; border-left:1px solid #d6e1d7; background:#fbfcf8; box-shadow:-12px 0 35px #20332e20; outline:none; }
:global(.ui-sheet-content:focus-visible) { outline:3px solid #347a4b; outline-offset:-3px; }

@media (max-width:720px) {
  :global(.ui-sheet-content) { top:auto; right:0; bottom:0; width:100%; max-height:88vh; border-top:1px solid #d6e1d7; border-left:0; border-radius:13px 13px 0 0; padding:23px 21px 30px; }
}
</style>
