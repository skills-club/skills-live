<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { SkillRow } from '../../shared/types/skill'
import {
  Calendar,
  RefreshCw,
  Upload,
  GitFork,
  Star,
  Eye,
  GitBranch,
  FileText,
  FolderOpen,
} from 'lucide-vue-next'

type Props =
  | { type: 'repo'; item: Repo; skill?: never }
  | { type: 'skill'; item: SkillRow; repo?: never }

const props = withDefaults(
  defineProps<Props & { class?: string; link?: boolean }>(),
  { link: true },
)

const LinkComponent = resolveComponent('NuxtLink')

const detailTo = computed(() =>
  props.type === 'repo'
    ? `/detail/repo/${props.item.id}`
    : `/detail/skill/${props.item.id}`,
)

const articleClass = computed(() =>
  cn(
    'rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden transition-colors',
    props.link && 'cursor-pointer hover:bg-accent/5',
    props.class,
  ),
)

const wrapperProps = computed(() => (props.link ? { to: detailTo.value } : {}))

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
</script>

<template>
  <component :is="props.link ? LinkComponent : 'div'" v-bind="wrapperProps" class="block">
    <article :class="articleClass">
    <!-- Repo 完整展示 -->
    <template v-if="type === 'repo'">
      <div class="p-5 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h3 class="text-lg font-semibold truncate" :title="item.name">
              {{ item.name }}
            </h3>
            <p class="text-sm text-muted-foreground font-mono mt-0.5">
              {{ item.repo }}
            </p>
          </div>
        </div>
        <p
          v-if="item.description"
          class="text-sm text-muted-foreground line-clamp-3"
        >
          {{ item.description }}
        </p>
        <div
          class="grid grid-cols-3 items-center text-xs text-muted-foreground"
          role="list"
          aria-label="Repo dates"
        >
          <span
            class="inline-flex items-center gap-0.5"
            role="listitem"
            :title="`创建时间：${formatDate(item.created_at)}`"
          >
            <Calendar class="size-4 shrink-0" aria-hidden />
            {{ formatDate(item.created_at) }}
          </span>
          <span
            class="inline-flex items-center gap-0.5 justify-self-center"
            role="listitem"
            :title="`更新时间：${formatDate(item.updated_at)}`"
          >
            <RefreshCw class="size-4 shrink-0" aria-hidden />
            {{ formatDate(item.updated_at) }}
          </span>
          <span
            class="inline-flex items-center gap-0.5 justify-self-center"
            role="listitem"
            :title="`上传时间：${formatDate(item.pushed_at)}`"
          >
            <Upload class="size-4 shrink-0" aria-hidden />
            {{ formatDate(item.pushed_at) }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
          <span class="inline-flex items-center gap-1">
            <Star class="size-4" aria-hidden />
            {{ item.stars }}  
          </span>
          <span class="inline-flex items-center gap-1">
            <Eye class="size-4" aria-hidden />
            {{ item.watchers }}
          </span>
          <span class="inline-flex items-center gap-1">
            <GitFork class="size-4" aria-hidden />
            {{ item.forks }}
          </span>
          <span class="inline-flex items-center gap-1">
            <GitBranch class="size-4" aria-hidden />
            {{ item.default_branch }}
          </span>
        </div>
      </div>
    </template>

    <!-- Skill 完整展示 -->
    <template v-else>
      <div class="p-5 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h3 class="text-lg font-semibold truncate" :title="item.name">
              {{ item.name }}
            </h3>
            <p
              class="text-sm text-muted-foreground font-mono mt-0.5 flex items-center gap-1 min-w-0"
              :title="item.path"
            >
              <FolderOpen class="size-3.5 shrink-0" aria-hidden />
              <span class="truncate">{{ item.path }}</span>
            </p>
          </div>
          <span
            v-if="item.is_skill_md"
            class="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            SKILL.md
          </span>
        </div>
        <div class="h-16 overflow-hidden text-sm text-muted-foreground">
          <p
            v-if="item.description"
            class="line-clamp-3"
          >
            {{ item.description }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span class="inline-flex items-center gap-1">
            <FileText class="size-4" aria-hidden />
            {{ formatSize(item.size) }}
          </span>
        </div>
        <dl class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
          <div class="inline-flex items-center gap-1">
            <dt class="sr-only">Repo</dt>
            <dd>Repo: {{ item.repo_name ?? '—' }}</dd>
          </div>
          <div class="inline-flex items-center gap-1" :title="`Created: ${formatDate(item.created_at)}`">
            <dt class="sr-only">Created</dt>
            <dd class="inline-flex items-center gap-1">
              <Calendar class="size-3.5 shrink-0" aria-hidden />
              {{ formatDate(item.created_at) }}
            </dd>
          </div>
        </dl>
      </div>
    </template>
    </article>
  </component>
</template>
