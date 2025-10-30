<script setup lang="ts"></script>

<template>
  <router-view />
</template>

<style>
/* Modern CSS Reset for 2025 */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Modern color system using oklch */
  --color-text-primary: oklch(25% 0 0);
  --color-text-secondary: oklch(50% 0 0);
  --color-bg-primary: oklch(100% 0 0);
  --color-bg-secondary: oklch(97% 0 0);
}

html {
  /* Modern viewport units */
  block-size: 100%;
  inline-size: 100%;
}

body {
  font-family:
    system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
  text-rendering: optimizeLegibility;
  block-size: 100%;
  inline-size: 100%;
}

#app {
  min-block-size: 100vh;
  min-block-size: 100dvh; /* Modern dynamic viewport */
  inline-size: 100%;
  display: block;
}
</style>
