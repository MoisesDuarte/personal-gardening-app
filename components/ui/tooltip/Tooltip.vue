<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

withDefaults(defineProps<{ text: string; side?: 'top' | 'right' | 'bottom' | 'left' }>(), { side: 'top' })
</script>

<template>
  <TooltipProvider>
    <TooltipRoot :delay-duration="350">
      <TooltipTrigger as-child><slot /></TooltipTrigger>
      <TooltipPortal><TooltipContent class="ui-tooltip" :side="side" :side-offset="6" :collision-padding="8">{{ text }}</TooltipContent></TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped>
:global(.ui-tooltip) { z-index:70; max-width:280px; border:1px solid #52675b; border-radius:4px; background:#101b18; padding:7px 9px; color:#f2f7ef; font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--weight-regular); line-height:var(--leading-relaxed); box-shadow:0 8px 20px #101b1866; }
</style>
