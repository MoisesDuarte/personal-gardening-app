<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'warning' | 'success' }>(), { variant: 'default' })
</script>

<template><span class="ui-badge" :class="`ui-badge-${variant}`"><slot /></span></template>

<style scoped>
.ui-badge { display:inline-flex; min-height:28px; align-items:center; border-radius:999px; padding:5px 9px; font-size:var(--text-xs); font-weight:var(--weight-semibold); line-height:var(--leading-normal); white-space:nowrap; }
.ui-badge-default { background:#dceedd; color:#467850; }
.ui-badge-warning { background:#f9dfc7; color:#99553c; }
.ui-badge-success { background:#d9edf0; color:#39717a; }
</style>
