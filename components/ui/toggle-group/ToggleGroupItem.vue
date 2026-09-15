<script setup lang="ts">
import { ToggleGroupItem } from 'reka-ui'
defineProps<{ value: string }>()
</script>

<template><ToggleGroupItem :value="value" class="ui-toggle-item"><slot /></ToggleGroupItem></template>

<style scoped>
.ui-toggle-item { min-height:36px; padding:7px 12px; border:0; border-radius:4px; background:transparent; color:#5c7061; font-size:var(--text-sm); font-weight:var(--weight-semibold); line-height:var(--leading-normal); white-space:nowrap; }
.ui-toggle-item span { margin-left:4px; color:#829787; font-family:var(--font-mono); font-size:var(--text-xs); font-variant-numeric:tabular-nums; }
.ui-toggle-item:hover { background:#e0ebdf; color:var(--ink); }
.ui-toggle-item:focus-visible { position:relative; z-index:1; outline:3px solid #347a4b; outline-offset:2px; }
.ui-toggle-item[data-state='on'] { background:#fff; color:var(--ink); box-shadow:0 1px 4px #20332e18; }
.ui-toggle-item[data-state='on'] span { color:#4d8d5b; }

@media (max-width:720px) { .ui-toggle-item { min-height:42px; flex:1; padding-inline:11px; } }
</style>
