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
