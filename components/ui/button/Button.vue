<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'outline' | 'ghost' | 'destructive'; size?: 'default' | 'sm' }>(), { variant: 'default', size: 'default' })
</script>

<template><button class="ui-button" :class="[`ui-button-${variant}`, `ui-button-${size}`]" v-bind="$attrs"><slot /></button></template>
