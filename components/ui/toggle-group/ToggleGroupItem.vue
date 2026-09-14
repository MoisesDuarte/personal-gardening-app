<script setup lang="ts">
import { ToggleGroupItem } from 'reka-ui'
defineProps<{ value: string }>()
</script>

<template><ToggleGroupItem :value="value" class="ui-toggle-item"><slot /></ToggleGroupItem></template>
