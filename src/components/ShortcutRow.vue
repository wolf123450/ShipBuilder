<template>
  <div class="flex items-start gap-4 p-3 rounded bg-ship-navy bg-opacity-50 border border-ship-slate border-opacity-30 hover:border-opacity-60 transition-colors">
    <!-- Icon -->
    <div class="text-2xl flex-shrink-0">{{ icon }}</div>

    <!-- Description -->
    <div class="flex-1 min-w-0">
      <p class="text-white font-medium">{{ description }}</p>
    </div>

    <!-- Keys -->
    <div class="flex-shrink-0 text-right">
      <div class="space-y-1">
        <div class="inline-block">
          <kbd class="bg-ship-dark border border-ship-slate px-3 py-1.5 rounded text-white text-sm font-mono whitespace-nowrap">
            {{ keys }}
          </kbd>
        </div>
        <div v-if="macKeys" class="text-xs text-gray-500 block">
          <span class="text-gray-600">macOS:</span> {{ macKeys }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  keys: string;
  description: string;
  icon: string;
  macKeys?: string;
}>();
</script>

<style scoped>
kbd {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  letter-spacing: 0.5px;
}
</style>
