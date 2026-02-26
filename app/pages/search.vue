<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="flex items-center justify-center py-20">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-20">
      <div class="text-destructive">Error: {{ error }}</div>
    </div>

    <div v-else-if="hasResults" class="flex gap-6">
      <!-- 左侧：Skills，虚拟列表优化性能 -->
      <section class="min-w-0 flex-4 flex flex-col min-h-0">
        <h2 class="text-sm font-medium text-muted-foreground mb-3 shrink-0">
          Skills
          <span v-if="skills.length" class="ml-1">({{ skills.length }})</span>
        </h2>
        <div v-if="skills.length" class="flex-1 min-h-0">
          <VirtualListGrid
            :items="skills"
            :row-height="220"
            height="calc(100vh - 200px)"
            class="w-full"
          >
            <template #default="{ row }">
              <div class="grid grid-cols-2 gap-4">
                <Card
                  v-for="skill in row"
                  :key="`skill-${skill.id}`"
                  type="skill"
                  :item="skill"
                />
              </div>
            </template>
          </VirtualListGrid>
        </div>
        <p v-else class="text-sm text-muted-foreground py-8">
          No skills found for "{{ query }}"
        </p>
      </section>

      <!-- 右侧：Repos，虚拟列表优化性能 -->
      <section class="w-[400px] shrink-0 flex flex-col min-h-0">
        <h2 class="text-sm font-medium text-muted-foreground mb-3 shrink-0">
          Repos
          <span v-if="repos.length" class="ml-1">({{ repos.length }})</span>
        </h2>
        <div v-if="repos.length" class="flex-1 min-h-0">
          <VirtualListGrid
            :items="repos"
            :columns="1"
            :row-height="260"
            height="calc(100vh - 200px)"
            class="w-full"
          >
            <template #default="{ row }">
              <Card
                v-for="repo in row"
                :key="`repo-${repo.id}`"
                type="repo"
                :item="repo"
              />
            </template>
          </VirtualListGrid>
        </div>
        <p v-else class="text-sm text-muted-foreground py-8">
          No repos found for "{{ query }}"
        </p>
      </section>
    </div>

    <div v-else class="flex items-center justify-center py-20">
      <div class="text-center">
        <p class="text-muted-foreground mb-4">No results found for "{{ query }}"</p>
        <NuxtLink to="/" class="text-primary hover:underline">
          Go back to homepage
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Repo } from '#shared/types/repos'
import type { Skill } from '#shared/types/skill'

definePageMeta({
  layout: 'default',
  showSearch: true,
  sticky: true,
  searchPlaceholder: 'Search skills, authors, org...',
})

const route = useRoute()
const query = computed(() => (route.query.q as string) || '')

const { data: searchData, pending, error } = useLazyAsyncData(
  `search-${query.value}`,
  async (): Promise<{ skills: Skill[]; repos: Repo[] }> => {
    if (!query.value) return { skills: [], repos: [] }
    const [reposRes, skillsRes] = await Promise.all([
      $fetch<{ data: Repo[] }>('/api/repos', {
        query: { q: query.value },
      }),
      $fetch<{ data: Skill[] }>('/api/skills', {
        query: { q: query.value },
      }),
    ])
    return {
      skills: skillsRes?.data ?? [],
      repos: reposRes?.data ?? [],
    }
  },
  { watch: [query] },
)

const skills = computed(() => searchData.value?.skills ?? [])
const repos = computed(() => searchData.value?.repos ?? [])
const hasResults = computed(
  () => (skills.value.length > 0 || repos.value.length > 0) && !error.value,
)
</script>
