<script setup lang="ts">
import { ToggleGroupRoot } from 'reka-ui'
const model = defineModel<string>({ default: 'all' })
</script>

<template><ToggleGroupRoot v-model="model" type="single" class="ui-toggle-group" v-bind="$attrs"><slot /></ToggleGroupRoot></template>
