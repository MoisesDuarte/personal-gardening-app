<script setup lang="ts">
const route = useRoute()
const items = [
  { label: 'Dashboard', to: '/' },
  { label: 'Hortas', to: '/gardens' },
  { label: 'Plantas', to: '/crop-types' },
  { label: 'Histórico', to: '/history' }
]
function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <nav class="primary-nav" aria-label="Navegação principal">
    <NuxtLink v-for="item in items" :key="item.to" class="primary-nav-link" :class="{ 'primary-nav-link-active': isActive(item.to) }" :to="item.to" :aria-current="isActive(item.to) ? 'page' : undefined">{{ item.label }}</NuxtLink>
  </nav>
</template>

<style scoped>
.primary-nav { display:flex; align-items:center; gap:20px; margin-left:auto; }
.primary-nav-link { position:relative; color:var(--muted); text-decoration:none; font-size:var(--text-xs); font-weight:var(--weight-semibold); }
.primary-nav-link:hover,.primary-nav-link-active { color:var(--ink); }
.primary-nav-link-active::after { position:absolute; right:0; bottom:-10px; left:0; height:2px; background:var(--green-deep); content:''; }

@media (max-width:850px) {
  .primary-nav { gap:14px; }
}

@media (max-width:720px) {
  .primary-nav { width:100%; order:3; justify-content:space-between; margin:0; border-top:1px solid var(--line); padding-top:9px; }
  .primary-nav-link { font-size:var(--text-xs); }
  .primary-nav-link-active::after { bottom:-9px; }
}
</style>
