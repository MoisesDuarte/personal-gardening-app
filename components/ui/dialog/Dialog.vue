<script setup lang="ts">
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

const props = defineProps<{ open: boolean; title: string; description?: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="ui-dialog-overlay" />
      <DialogContent class="ui-dialog-content">
        <DialogTitle class="ui-dialog-title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="ui-dialog-description">{{ description }}</DialogDescription>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
:global(.ui-dialog-overlay) { position:fixed; inset:0; z-index:60; background:#20332e55; }
:global(.ui-dialog-content) { position:fixed; top:50%; left:50%; z-index:61; width:min(420px,calc(100vw - 32px)); transform:translate(-50%,-50%); border:1px solid #d6e1d7; border-radius:9px; background:#fbfcf8; padding:25px; box-shadow:0 16px 42px #20332e35; outline:none; }
:global(.ui-dialog-content:focus-visible) { outline:3px solid #347a4b; outline-offset:3px; }
:global(.ui-dialog-title) { margin:0 0 6px; font-size:var(--text-xl); font-weight:var(--weight-semibold); line-height:var(--leading-tight); letter-spacing:-.01em; }
:global(.ui-dialog-description) { margin:0 0 17px; color:var(--muted); font-size:var(--text-sm); line-height:var(--leading-relaxed); }
</style>
