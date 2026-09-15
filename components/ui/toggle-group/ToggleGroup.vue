<script setup lang="ts">
import { ToggleGroupRoot } from 'reka-ui'
const model = defineModel<string>({ default: 'all' })
</script>

<template><ToggleGroupRoot v-model="model" type="single" class="ui-toggle-group" v-bind="$attrs"><slot /></ToggleGroupRoot></template>

<style scoped>
.ui-toggle-group { display:inline-flex; max-width:100%; overflow:auto; padding:2px; border:1px solid #d4ded5; border-radius:6px; background:#eef4ed; }

@media (max-width:720px) { .ui-toggle-group { width:100%; padding:3px; } }
</style>
