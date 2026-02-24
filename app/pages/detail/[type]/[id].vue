<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

definePageMeta({
  layout: 'default',
  showSearch: true,
})

const route = useRoute()
const type = computed(() => route.params.type as 'repo' | 'skill')
const id = computed(() => route.params.id as string)

const apiUrl = computed(() =>
  type.value === 'repo' ? `/api/repos/${id.value}` : `/api/skills/${id.value}`,
)

const { data: item, pending, error } = await useFetch<Repo | SkillRow>(apiUrl, {
  key: `detail-${type.value}-${id.value}`,
  method: 'POST',
})

const isRepo = computed(() => type.value === 'repo' && item.value)
const isSkill = computed(() => type.value === 'skill' && item.value)

/** 用于拉取目录、文件内容的 repo id（repo 入口用路由 id，skill 入口用 skill 的 repo_id） */
const repoId = computed(() => {
  if (!item.value) return ''
  if (type.value === 'repo') return String((item.value as Repo).id)
  return String((item.value as SkillRow).repo_id ?? '')
})

const repoSlug = computed(() => {
  if (!item.value) return ''
  if (type.value === 'repo') return (item.value as Repo).repo
  return (item.value as SkillRow).repo_slug ?? ''
})

const repoName = computed(() => {
  if (!item.value) return ''
  if (type.value === 'repo') return (item.value as Repo).name
  return (item.value as SkillRow).repo_name ?? ''
})

const { data: skillsResponse } = await useAsyncData(
  () => `skills-repo-${type.value}-${repoId.value}`,
  () =>
    !repoId.value
      ? Promise.resolve({ data: [], limit: 0, offset: 0 })
      : $fetch<SkillsGetResponse>(`/api/skills?repo_id=${repoId.value}&limit=500`),
  { watch: [type, repoId] },
)
const skills = computed(() => skillsResponse.value?.data ?? [])

/** skill 入口时拉取完整 Repo，用于右侧仓库信息 */
const { data: repoBySkill } = await useAsyncData(
  () => (type.value === 'skill' && repoId.value ? `repo-${repoId.value}` : 'repo-none'),
  () =>
    type.value === 'skill' && repoId.value
      ? $fetch<Repo>(`/api/repos/${repoId.value}`, { method: 'POST' })
      : Promise.resolve(null),
  { watch: [type, repoId] },
)
/** 右侧栏展示用：repo 入口用 item，skill 入口用拉取的 repo */
const repoForSidebar = computed<Repo | null>(() => {
  if (type.value === 'repo' && item.value) return item.value as Repo
  if (type.value === 'skill' && repoBySkill.value) return repoBySkill.value
  return null
})

const selectedPath = ref<string | null>(null)

/** 默认选中：skill 入口展示对应文件，repo 入口展示第一个文件 */
watch(
  [type, item, skills],
  () => {
    if (type.value === 'skill' && item.value) {
      selectedPath.value = (item.value as SkillRow).path ?? null
      return
    }
    if (type.value === 'repo' && skills.value.length > 0) {
      const paths = new Set(skills.value.map((s) => s.path))
      const firstPath = skills.value[0]?.path ?? null
      if (selectedPath.value === null || !paths.has(selectedPath.value))
        selectedPath.value = firstPath
    }
  },
  { immediate: true },
)

/** 点击文件后通过接口拉取内容：raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path} */
const { data: contentData, pending: contentPending } = await useAsyncData(
  () =>
    selectedPath.value && repoId.value
      ? `content-${repoId.value}-${selectedPath.value}`
      : 'content-none',
  async () => {
    if (!selectedPath.value || !repoId.value) {
      return { content: '', error: undefined }
    }
    try {
      return await $fetch<{ content?: string; frontmatter?: Record<string, unknown>; raw?: string; error?: string }>('/api/file/content', {
        method: 'POST',
        body: { repo: repoId.value, path: selectedPath.value },
      })
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      const message =
        err?.data?.message ?? err?.message ?? 'Failed to load content'
      return { content: '', error: message }
    }
  },
  { watch: [selectedPath, repoId] },
)
/** 正文内容（.md 已去掉 frontmatter，供 markdown-it 解析） */
const bodyContent = computed(() => contentData.value?.content ?? '')
/** 原始完整内容（Code 模式展示 + 复制用） */
const fileContent = computed(() => contentData.value?.raw ?? contentData.value?.content ?? '')
const contentError = computed(() => contentData.value?.error)

/** frontmatter 由服务端 gray-matter 解析，避免浏览器 Buffer 未定义 */
const frontmatter = computed(() => contentData.value?.frontmatter ?? {})

/** frontmatter 转为 key-value 数组，用于表格展示；preview 模式下 string 类型的 value 解析为 HTML */
const frontmatterEntries = computed(() => {
  const data = frontmatter.value
  if (!data || Object.keys(data).length === 0) return []
  return Object.entries(data).map(([key, val]) => {
    const raw = formatFrontmatterValue(val)
    const isMarkdown = typeof val === 'string' && val.length > 0
    const valueHtml = isMarkdown ? md.render(val as string) : raw
    return { key, value: raw, valueHtml, isHtml: isMarkdown }
  })
})

function formatFrontmatterValue(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ')
  return JSON.stringify(val)
}

const previewHtml = computed(() => (bodyContent.value ? md.render(bodyContent.value) : ''))

const viewMode = ref<'preview' | 'code'>('code')
const { copy, copied } = useClipboard({ source: fileContent })
</script>

<template>
  <div
    class="container mx-auto p-4 flex flex-col min-h-0 overflow-hidden shrink-0"
    style="height: calc(100vh - 5rem); max-height: calc(100vh - 5rem);"
  >
    <div v-if="pending" class="flex justify-center py-20">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <div v-else-if="error" class="flex justify-center py-20">
      <div class="text-destructive">
        Error: {{ error.statusMessage ?? error.message }}
      </div>
    </div>

    <!-- 有数据时：上方安装组件 + 下方左中右布局 -->
    <template v-else-if="item">
      <div v-if="repoSlug" class="shrink-0 pb-4">
        <InstallCommands :repo="repoSlug" />
      </div>
      <div
        class="flex flex-1 min-h-0 w-full rounded-lg border border-border overflow-hidden"
      >
        <ResizablePanelGroup
        direction="horizontal"
        class="flex-1 min-w-0 min-h-0"
      >
        <!-- 左：上仓库名 + 下目录（repo 入口=该 repo 下所有 skill 文件，skill 入口=该 repo 下所有 skill 文件） -->
        <ResizablePanel
          v-if="isRepo || isSkill"
          :default-size="18"
          :min-size="10"
          class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
        >
          <SkillsTreeSidebar
            v-if="repoName"
            :repo-name="repoName"
            :repo-slug="repoSlug"
            :skills="skills"
            :selected-path="selectedPath"
            @update:selected-path="selectedPath = $event"
          />
        </ResizablePanel>

        <ResizableHandle v-if="isRepo || isSkill" with-handle />

        <!-- 中：主内容区（路径 + 文件内容，repo/skill 入口共用） -->
        <ResizablePanel
          :default-size="(isRepo || isSkill) ? 65 : 50"
          :min-size="25"
          class="min-w-0 min-h-0 flex flex-col overflow-hidden"
        >
          <template v-if="isRepo || isSkill">
            <Tabs v-model="viewMode" class="flex min-h-0 flex-1 flex-col gap-0">
              <div class="shrink-0 border-b border-border bg-muted/30 px-4 py-2 flex items-center justify-between gap-3">
                <TabsList class="h-7 w-fit rounded-md p-0.5 text-xs">
                  <TabsTrigger value="preview" class="px-2.5 py-1 text-xs">
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" class="px-2.5 py-1 text-xs">
                    Code
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="!fileContent"
                  :title="copied ? 'Copied' : 'Copy'"
                  @click="copy()"
                >
                  <Check v-if="copied" class="size-4" />
                  <Copy v-else class="size-4" />
                </Button>
              </div>
              <div class="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-4 bg-muted/30">
                <div v-if="!selectedPath" class="text-sm text-muted-foreground">
                  Select a file from the tree to view content.
                </div>
                <div v-else-if="contentPending" class="text-sm text-muted-foreground">
                  Loading…
                </div>
                <div v-else-if="contentError" class="text-sm text-destructive">
                  {{ contentError }}
                </div>
                <template v-else>
                  <p class="font-mono text-[10px] text-muted-foreground truncate pb-2" :title="selectedPath ?? ''">
                    {{ selectedPath }}
                  </p>
                  <TabsContent value="preview" class="mt-0 flex-1 outline-none flex min-w-0 flex-col gap-4 overflow-hidden">
                    <div
                      v-if="frontmatterEntries.length > 0"
                      class="w-full max-w-full overflow-hidden rounded-lg border border-border"
                    >
                      <Table class="w-full table-fixed border-collapse [&_tr:last-child_td]:border-b-0">
                        <TableBody>
                          <TableRow v-for="entry in frontmatterEntries" :key="entry.key">
                            <TableCell class="w-32 border-b border-r border-border font-mono text-xs text-muted-foreground align-top whitespace-nowrap p-2">
                              {{ entry.key }}
                            </TableCell>
                            <TableCell class="border-b border-border p-2 text-sm align-top wrap-break-word min-w-0 prose prose-sm dark:prose-invert max-w-none">
                              <span v-if="entry.isHtml" v-html="entry.valueHtml" />
                              <span v-else>{{ entry.value }}</span>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div
                      class="min-w-0 prose prose-sm dark:prose-invert max-w-none text-foreground wrap-break-word [&_pre]:whitespace-pre-wrap [&_pre]:wrap-break-word [&_code]:wrap-break-word"
                      v-html="previewHtml"
                    />
                  </TabsContent>
                  <TabsContent value="code" class="mt-0 flex-1 outline-none min-w-0 overflow-hidden">
                    <pre class="whitespace-pre-wrap wrap-break-word font-mono text-sm text-foreground">{{ fileContent }}</pre>
                  </TabsContent>
                </template>
              </div>
            </Tabs>
          </template>
          <div v-else class="min-h-0 flex-1 overflow-auto bg-muted/30 p-6">
            <p class="text-sm text-muted-foreground">
              Center — resize the divider to adjust layout.
            </p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <!-- 右：固定宽度侧栏 -->
      <aside
        class="w-80 shrink-0 flex flex-col min-h-0 border-l border-border bg-card overflow-hidden"
        aria-label="Sidebar"
      >
        <div class="flex-1 min-h-0 overflow-auto p-4 text-sm text-muted-foreground">
          <RepoInfo v-if="repoForSidebar" :repo="repoForSidebar" />
          <p v-else-if="repoId" class="text-muted-foreground">Loading repo…</p>
        </div>
      </aside>
      </div>
    </template>
  </div>
</template>
