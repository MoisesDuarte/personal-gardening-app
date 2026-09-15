<script setup lang="ts">
import { HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'

withDefaults(defineProps<{ openDelay?: number; closeDelay?: number }>(), { openDelay: 220, closeDelay: 120 })
</script>

<template>
  <HoverCardRoot :open-delay="openDelay" :close-delay="closeDelay">
    <HoverCardTrigger as-child><slot name="trigger" /></HoverCardTrigger>
    <HoverCardPortal><HoverCardContent class="ui-hover-card" side="top" :side-offset="8"><slot /></HoverCardContent></HoverCardPortal>
  </HoverCardRoot>
</template>

<style scoped>
:global(.ui-hover-card) { z-index:25; width:250px; border:1px solid #cfddd0; border-radius:7px; background:#fbfcf8; padding:14px; color:var(--ink); box-shadow:0 10px 28px #20332e25; }
@media (max-width:720px) { :global(.ui-hover-card) { display:none; } }
</style>
