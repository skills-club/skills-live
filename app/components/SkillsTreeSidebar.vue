<script setup lang="ts">
import { ChevronRight, FileText, Folder } from 'lucide-vue-next'

interface TreeNode {
  name: string
  type: 'folder' | 'file'
  path?: string
  children?: TreeNode[]
}

interface FlatNode {
  depth: number
  node: TreeNode
  folderPath: string
}

const props = defineProps<{
  repoName: string
  repoSlug: string
  skills: SkillRow[]
  selectedPath: string | null
}>()

const emit = defineEmits<{
  'update:selectedPath': [value: string | null]
}>()

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

const tree = computed(() => buildTree(props.skills))

const expandedFolders = ref<Set<string>>(new Set())

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

function toggleFolder(path: string) {
  const next = new Set(expandedFolders.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedFolders.value = next
}

function isExpanded(path: string) {
  return expandedFolders.value.has(path)
}

function selectPath(path: string | null) {
  emit('update:selectedPath', path)
}
</script>

<template>
  <div class="min-w-0 min-h-0 flex flex-col overflow-hidden">
    <div class="shrink-0 border-b border-border bg-card px-4 py-3">
      <h2 class="font-semibold truncate" :title="repoName">
        {{ repoName }}
      </h2>
      <p class="text-xs text-muted-foreground font-mono truncate mt-0.5">
        {{ repoSlug }}
      </p>
    </div>
    <nav
      class="flex-1 min-h-0 overflow-auto p-2 rounded-l-lg bg-card text-card-foreground"
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
          @click="node.type === 'folder' ? toggleFolder(folderPath) : selectPath(node.path ?? null)"
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
  </div>
</template>
