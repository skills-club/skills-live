<script setup lang="ts">
import { CircuitBoard, GithubIcon, SunIcon, MoonIcon } from 'lucide-vue-next'

interface Props {
  showSearch?: boolean
  sticky?: boolean
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  showSearch: false,
  sticky: false,
  searchPlaceholder: 'Search skills,authors,org...',
})

const router = useRouter()
const route = useRoute()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const searchQuery = ref(props.showSearch ? (route.query.q as string) || '' : '')

function handleToggleTheme() {
  toggleDark()
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
  }
}

// Watch route query changes when showSearch is true
watch(() => route.query.q, (newQuery) => {
  if (props.showSearch && typeof newQuery === 'string') {
    searchQuery.value = newQuery
  }
})
</script>

<template>
  <header
    :class="[
      'border-b min-h-[72px] flex items-center',
      sticky && 'sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50'
    ]"
  >
    <div class="container mx-auto px-4 py-4 w-full">
      <div class="flex items-center gap-4 min-h-10">
        <NuxtLink to="/" class="flex items-center gap-2 text-2xl font-bold">
          <img src="/icon.png" alt="Skills Club" class="h-6 w-6" />
          <span class="text-muted-foreground">/</span>
          <span>skills club</span>
        </NuxtLink>

        <form
          v-if="showSearch"
          @submit.prevent="handleSearch"
          class="flex-1 max-w-2xl"
        >
          <div class="relative">
            <CircuitBoard class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="h-10 pl-12 pr-4"
              @keydown.enter="handleSearch"
            />
          </div>
        </form>

        <nav class="flex items-center gap-3 ml-auto">
          <a
            href="https://github.com/skills-club/skills-live"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            aria-label="GitHub"
          >
            <GithubIcon class="h-4 w-4" />
          </a>
          <div class="h-4">
            <Separator orientation="vertical" />
          </div>
          <button
            @click="handleToggleTheme"
            class="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle theme"
          >
            <SunIcon
              v-if="isDark"
              class="h-4 w-4 rotate-0 scale-100 transition-all duration-300"
            />
            <MoonIcon
              v-else
              class="h-4 w-4 rotate-0 scale-100 transition-all duration-300"
            />
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>
