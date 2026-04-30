<template>
  <AppLayout />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useReaderStore } from '@/stores/reader'
import { useTheme } from '@/composables/useTheme'
import { sampleContent, sampleToc } from '@/services/sample-content'

const readerStore = useReaderStore()
useTheme()

onMounted(() => {
  readerStore.setContent(sampleContent)
  readerStore.setToc(sampleToc)
})
</script>
