<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'warning' | 'success' }>(), { variant: 'default' })
</script>

<template><span class="ui-badge" :class="`ui-badge-${variant}`"><slot /></span></template>
