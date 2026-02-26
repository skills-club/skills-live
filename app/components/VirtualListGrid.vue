<script setup lang="ts" generic="T">
import { useVirtualList } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    /** 数据列表 */
    items: T[]
    /** 每行列数 */
    columns?: number
    /** 每行高度（px），需与实际渲染高度一致 */
    rowHeight?: number
    /** 容器高度，默认 100% 填满父级 */
    height?: string | number
    /** 预渲染行数，减少快速滚动时的空白 */
    overscan?: number
  }>(),
  {
    columns: 2,
    rowHeight: 220,
    height: '100%',
    overscan: 3,
  },
)

/** 将一维数组按列数分组成二维行 */
const rows = computed(() => {
  const cols = props.columns
  const result: T[][] = []
  for (let i = 0; i < props.items.length; i += cols) {
    result.push(props.items.slice(i, i + cols))
  }
  return result
})

/** 每行高度：最后一行无 margin，其余为 行高 + gap(16px) */
const getItemHeight = (index: number) => {
  const total = rows.value.length
  return index === total - 1 ? props.rowHeight : props.rowHeight + 16
}

const { list, containerProps, wrapperProps } = useVirtualList(rows, {
  itemHeight: getItemHeight,
  overscan: props.overscan,
})

const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  overflow: 'auto',
}))
</script>

<template>
  <div
    v-bind="containerProps"
    class="virtual-list-grid-container"
    :style="containerStyle"
  >
    <div v-bind="wrapperProps" class="virtual-list-grid-wrapper">
      <div
        v-for="item in list"
        :key="item.index"
        class="virtual-list-grid-row mb-4 last:mb-0"
        :style="{ minHeight: `${rowHeight}px` }"
      >
        <slot :row="item.data" :row-index="item.index" />
      </div>
    </div>
  </div>
</template>
