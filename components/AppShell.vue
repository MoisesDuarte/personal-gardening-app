<template>
  <main class="app-shell">
    <header class="topbar">
      <NuxtLink class="brand" to="/"><span class="brand-mark">✳</span><span>cultiva<span>.</span></span></NuxtLink>
      <AppNavigation />
    </header>
    <slot />
  </main>
</template>

<style scoped>
.app-shell { max-width:1320px; min-height:100vh; margin:auto; padding:0 56px 40px; }
.topbar { height:72px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--line); }
.brand { display:flex; align-items:center; gap:10px; color:var(--ink); text-decoration:none; font-size:24px; font-weight:var(--weight-bold); letter-spacing:-.04em; }
.brand > span:last-child > span { color:#4ea361; }
.brand-mark { display:grid; place-items:center; width:28px; height:28px; color:#4ea361; font-size:28px; }

@media (max-width:850px) {
  .app-shell { padding:0 22px 40px; }
}

@media (max-width:720px) {
  .topbar { height:auto; min-height:72px; flex-wrap:wrap; gap:11px 15px; padding:10px 0; }
  .topbar .brand { font-size:21px; }
}
</style>
