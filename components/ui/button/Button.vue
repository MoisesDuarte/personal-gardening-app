<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'outline' | 'ghost' | 'destructive'; size?: 'default' | 'sm' }>(), { variant: 'default', size: 'default' })
</script>

<template><button class="ui-button" :class="[`ui-button-${variant}`, `ui-button-${size}`]" v-bind="$attrs"><slot /></button></template>

<style scoped>
.ui-button { display:inline-flex; min-height:44px; align-items:center; justify-content:center; gap:8px; border:1px solid transparent; border-radius:4px; padding:10px 15px; font-size:var(--text-sm); font-weight:var(--weight-semibold); line-height:var(--leading-normal); transition:background .15s, border-color .15s, opacity .15s; }
.ui-button:focus-visible { outline:3px solid #347a4b; outline-offset:2px; }
.ui-button:disabled { cursor:wait; opacity:.55; }
.ui-button-default { background:var(--ink); color:#fff; }
.ui-button-default:hover { background:#2d4a42; }
.ui-button-outline { border-color:#b9cbbb; background:#fff; color:#365c40; }
.ui-button-outline:hover { background:#eaf5e9; }
.ui-button-ghost { background:transparent; color:#6d766f; }
.ui-button-destructive { background:#a95645; color:#fff; }
.ui-button-sm { min-height:40px; padding:8px 12px; font-size:var(--text-xs); }
:slotted(.button-arrow) { margin-left:19px; font-size:18px; }
</style>
