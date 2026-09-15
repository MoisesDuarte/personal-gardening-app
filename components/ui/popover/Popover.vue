<script setup lang="ts">
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from 'reka-ui'

const props = withDefaults(defineProps<{ open: boolean; position?: { top: number; left: number }; contentClass?: string; labelledBy?: string; modal?: boolean }>(), { modal: false })
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
const anchorStyle = computed(() => props.position ? { top: `${props.position.top}px`, left: `${props.position.left}px` } : { top: '80px', left: '24px' })
</script>

<template>
  <PopoverRoot :open="open" :modal="modal" @update:open="emit('update:open', $event)">
    <PopoverAnchor class="ui-popover-anchor" :style="anchorStyle" />
    <PopoverPortal><PopoverContent :class="contentClass" :aria-labelledby="labelledBy" side="right" align="start" :side-offset="8" :collision-padding="16" sticky="always" :prioritize-position="true"><slot /></PopoverContent></PopoverPortal>
  </PopoverRoot>
</template>
