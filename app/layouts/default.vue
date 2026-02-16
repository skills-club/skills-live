<template>
  <div class="min-h-screen flex flex-col">
    <Header
      :show-search="showSearch"
      :sticky="sticky"
      :search-placeholder="searchPlaceholder"
    />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const showSearch = computed(() => {
  const value = route.meta.showSearch
  return typeof value === 'boolean' ? value : false
})
const sticky = computed(() => {
  const value = route.meta.sticky
  return typeof value === 'boolean' ? value : false
})
const searchPlaceholder = computed(() => {
  const value = route.meta.searchPlaceholder
  return typeof value === 'string' ? value : 'Search skills,authors,org...'
})
</script>
