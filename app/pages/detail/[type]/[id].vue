<script setup lang="ts">
import type { Repo } from '#shared/types/repos'
import type { SkillRow } from '#shared/types/skill'
import type { SkillsGetResponse } from '#shared/types/skill'
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
  ArrowLeft,
  ChevronRight,
  Folder,
} from 'lucide-vue-next'

definePageMeta({
  layout: 'default',
  showSearch: true,
})

interface TreeNode {
  name: string
  type: 'folder' | 'file'
  path?: string
  children?: TreeNode[]
}

const route = useRoute()
const type = computed(() => route.params.type as 'repo' | 'skill')
const id = computed(() => route.params.id as string)

const apiUrl = computed(() =>
  type.value === 'repo' ? `/api/repos/${id.value}` : `/api/skills/${id.value}`,
)

const { data: item, pending, error } = await useFetch<Repo | SkillRow>(apiUrl, {
  key: `detail-${type.value}-${id.value}`,
})

const isRepo = computed(() => type.value === 'repo' && item.value)
const isSkill = computed(() => type.value === 'skill' && item.value)

const { data: skillsResponse } = await useAsyncData(
  () => `skills-repo-${id.value}`,
  () =>
    type.value === 'repo' && id.value
      ? $fetch<SkillsGetResponse>(`/api/skills?repo_id=${id.value}&limit=500`)
      : Promise.resolve({ data: [], limit: 0, offset: 0 }),
  { watch: [type, id] },
)
const skills = computed(() => skillsResponse.value?.data ?? [])

function buildTree(skillList: SkillRow[]): TreeNode[] {
  const root: TreeNode[] = []
  const getOrCreateFolder = (parent: TreeNode[], segment: string): TreeNode[] => {
    let node = parent.find((n) => n.type === 'folder' && n.name === segment)
    if (!node) {
      node = { name: segment, type: 'folder', children: [] }
      parent.push(node)
    }
    return node.children!
  }
  for (const skill of skillList) {
    const parts = skill.path.split('/').filter(Boolean)
    if (parts.length === 0) continue
    if (parts.length === 1) {
      root.push({
        name: parts[0]!,
        type: 'file',
        path: skill.path,
      })
    } else {
      let current = root
      for (let i = 0; i < parts.length - 1; i++) {
        current = getOrCreateFolder(current, parts[i]!)
      }
      current.push({
        name: parts[parts.length - 1]!,
        type: 'file',
        path: skill.path,
      })
    }
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    nodes.forEach((n) => n.children && sort(n.children))
  }
  sort(root)
  return root
}

const tree = computed(() => buildTree(skills.value))

interface FlatNode {
  depth: number
  node: TreeNode
  folderPath: string
}
function flattenTree(nodes: TreeNode[], depth: number, prefix: string): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    const folderPath = prefix ? `${prefix}/${node.name}` : node.name
    result.push({ depth, node, folderPath: node.type === 'folder' ? folderPath : '' })
    if (node.type === 'folder' && node.children?.length) {
      const expanded = expandedFolders.value.has(folderPath)
      if (expanded) {
        result.push(...flattenTree(node.children, depth + 1, folderPath))
      }
    }
  }
  return result
}
const flatTree = computed(() => flattenTree(tree.value, 0, ''))

const selectedPath = ref<string | null>(null)
const expandedFolders = ref<Set<string>>(new Set())

function toggleFolder(path: string) {
  const next = new Set(expandedFolders.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedFolders.value = next
}

function isExpanded(path: string) {
  return expandedFolders.value.has(path)
}

const { data: contentData, pending: contentPending } = await useAsyncData(
  () =>
    selectedPath.value && type.value === 'repo' && id.value
      ? `content-${id.value}-${selectedPath.value}`
      : 'content-none',
  () =>
    selectedPath.value && type.value === 'repo' && id.value
      ? $fetch<{ content?: string; error?: string }>(
          `/api/repos/${id.value}/content?path=${encodeURIComponent(selectedPath.value)}`,
        )
      : Promise.resolve({ content: '', error: undefined }),
  { watch: [selectedPath, type, id] },
)
const fileContent = computed(() => contentData.value?.content ?? '')
const contentError = computed(() => contentData.value?.error)

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
  <div
    class="container mx-auto px-4 py-8 flex flex-col min-h-0 overflow-hidden shrink-0"
    style="height: calc(100vh - 5rem); max-height: calc(100vh - 5rem);"
  >
    <NuxtLink
      to="/search"
      class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 shrink-0"
    >
      <ArrowLeft class="size-4" aria-hidden />
      Back to search
    </NuxtLink>

    <div v-if="pending" class="flex justify-center py-20">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <div v-else-if="error" class="flex justify-center py-20">
      <div class="text-destructive">
        Error: {{ error.statusMessage ?? error.message }}
      </div>
    </div>

    <ResizablePanelGroup
      v-else-if="item"
      direction="horizontal"
      class="flex-1 min-h-0 w-full rounded-lg border border-border overflow-hidden"
    >
      <!-- Repo: 左侧 skills 文件夹树 -->
      <ResizablePanel
        v-if="isRepo"
        :default-size="35"
        :min-size="20"
        class="min-w-0 min-h-0 flex flex-col overflow-hidden"
      >
        <div class="shrink-0 border-b border-border bg-card px-4 py-3">
          <h2 class="font-semibold truncate" :title="(item as Repo).name">
            {{ (item as Repo).name }}
          </h2>
          <p class="text-xs text-muted-foreground font-mono truncate mt-0.5">
            {{ (item as Repo).repo }}
          </p>
        </div>
        <nav
          class="flex-1 min-h-0 overflow-auto p-2 rounded-l-lg border-r border-border bg-card text-card-foreground"
          aria-label="Skills tree"
        >
          <template v-if="flatTree.length">
            <button
              v-for="({ depth, node, folderPath }) in flatTree"
              :key="node.path ?? folderPath"
              type="button"
              class="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/80 focus:bg-muted/80 focus:outline-none"
              :class="[
                node.type === 'file' && selectedPath === node.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground',
              ]"
              :style="{ paddingLeft: `${depth * 12 + 8}px` }"
              @click="node.type === 'folder' ? toggleFolder(folderPath) : (selectedPath = node.path ?? null)"
            >
              <ChevronRight
                v-if="node.type === 'folder'"
                class="size-4 shrink-0 transition-transform"
                :class="isExpanded(folderPath) && 'rotate-90'"
                aria-hidden
              />
              <span v-else class="w-4 shrink-0" aria-hidden />
              <Folder
                v-if="node.type === 'folder'"
                class="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <FileText
                v-else
                class="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span class="min-w-0 truncate">{{ node.name }}</span>
            </button>
          </template>
          <p v-else class="py-4 text-center text-sm text-muted-foreground">
            No skills in this repo
          </p>
        </nav>
      </ResizablePanel>

      <!-- Skill 详情：非 repo 时左侧仍为详情卡片 -->
      <ResizablePanel
        v-else
        :default-size="50"
        :min-size="25"
        class="min-w-0 min-h-0 overflow-hidden"
      >
        <article
          class="h-full min-h-0 overflow-auto rounded-l-lg border-r border-border bg-card text-card-foreground shadow-sm p-6"
        >
          <template v-if="isSkill">
            <div class="space-y-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <h1 class="text-2xl font-semibold truncate" :title="(item as SkillRow).name">
                    {{ (item as SkillRow).name }}
                  </h1>
                  <p
                    class="text-muted-foreground font-mono mt-1 flex items-center gap-1.5 min-w-0"
                    :title="(item as SkillRow).path"
                  >
                    <FolderOpen class="size-4 shrink-0" aria-hidden />
                    <span class="truncate">{{ (item as SkillRow).path }}</span>
                  </p>
                </div>
                <span
                  v-if="(item as SkillRow).is_skill_md"
                  class="shrink-0 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  SKILL.md
                </span>
              </div>
              <div v-if="(item as SkillRow).description" class="text-muted-foreground">
                <p class="whitespace-pre-wrap">{{ (item as SkillRow).description }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span class="inline-flex items-center gap-1.5">
                  <FileText class="size-4" aria-hidden />
                  {{ formatSize((item as SkillRow).size) }}
                </span>
              </div>
              <dl class="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground border-t border-border pt-4">
                <div class="inline-flex items-center gap-1.5">
                  <dt class="sr-only">Repo</dt>
                  <dd>Repo: {{ (item as SkillRow).repo_name ?? '—' }}</dd>
                </div>
                <div class="inline-flex items-center gap-1.5">
                  <dt class="sr-only">Created</dt>
                  <dd class="inline-flex items-center gap-1.5">
                    <Calendar class="size-4 shrink-0" aria-hidden />
                    {{ formatDate((item as SkillRow).created_at) }}
                  </dd>
                </div>
              </dl>
            </div>
          </template>
        </article>
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- 右侧：Repo 时为路径 + 文件内容，否则占位 -->
      <ResizablePanel
        :default-size="isRepo ? 65 : 50"
        :min-size="25"
        class="min-w-0 min-h-0 flex flex-col overflow-hidden"
      >
        <template v-if="isRepo">
          <div class="shrink-0 border-b border-border bg-muted/30 px-4 py-2">
            <p class="font-mono text-sm text-muted-foreground truncate" :title="selectedPath ?? ''">
              {{ selectedPath ?? 'Select a file' }}
            </p>
          </div>
          <div class="flex-1 min-h-0 overflow-auto p-4 rounded-r-lg bg-muted/30">
            <div v-if="!selectedPath" class="text-sm text-muted-foreground">
              Select a file from the tree to view content.
            </div>
            <div v-else-if="contentPending" class="text-sm text-muted-foreground">
              Loading…
            </div>
            <div v-else-if="contentError" class="text-sm text-destructive">
              {{ contentError }}
            </div>
            <pre
              v-else
              class="whitespace-pre-wrap wrap-break-word font-mono text-sm text-foreground"
            >{{ fileContent }}</pre>
          </div>
        </template>
        <div v-else class="min-h-0 flex-1 overflow-auto rounded-r-lg bg-muted/30 p-6">
          <p class="text-sm text-muted-foreground">
            Right panel — resize the divider to adjust layout.
          </p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
