<script setup lang="ts">
import type { Repo } from '#shared/types/repos'
import { Star, GitFork, Eye } from 'lucide-vue-next'

const props = defineProps<{
  repo: Repo
}>()

const descriptionSingleLine = computed(() =>
  props.repo.description?.replace(/\s+/g, ' ').trim() ?? '',
)
</script>

<template>
  <div class="w-full min-w-0 space-y-4 text-sm">
    <div class="min-w-0">
      <h3 class="text-sm font-semibold text-foreground truncate" :title="repo.name">
        {{ repo.name }}
      </h3>
      <p class="text-xs font-mono text-muted-foreground truncate mt-0.5" :title="repo.repo">
        {{ repo.repo }}
      </p>
    </div>
    <p
      v-if="descriptionSingleLine"
      class="block w-full min-w-0 text-xs text-muted-foreground line-clamp-4 whitespace-normal wrap-break-word"
      :title="repo.description"
    >
      {{ descriptionSingleLine }}
    </p>
    <p v-else class="block w-full min-w-0 text-xs text-muted-foreground italic">
      No description
    </p>
    <dl class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <div class="inline-flex items-center gap-1.5">
        <Star class="size-4 shrink-0" aria-hidden />
        <dt class="sr-only">Stars</dt>
        <dd>{{ repo.stars }}</dd>
      </div>
      <div class="inline-flex items-center gap-1.5">
        <GitFork class="size-4 shrink-0" aria-hidden />
        <dt class="sr-only">Forks</dt>
        <dd>{{ repo.forks }}</dd>
      </div>
      <div class="inline-flex items-center gap-1.5">
        <Eye class="size-4 shrink-0" aria-hidden />
        <dt class="sr-only">Watchers</dt>
        <dd>{{ repo.watchers }}</dd>
      </div>
    </dl>
  </div>
</template>
