<template>
  <div class="h-screen w-full flex flex-col bg-ship-dark text-white">
    <!-- Header -->
    <header class="bg-ship-navy border-b border-ship-slate px-4 py-3">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Ship Design Toolkit</h1>
        <div class="flex items-center gap-2">
          <span v-if="shipStore.isDirty" class="text-yellow-400 text-sm">Unsaved changes</span>
          <button
            @click="handleExport"
            class="px-4 py-2 bg-ship-accent hover:bg-blue-600 rounded text-white font-semibold"
          >
            Export
          </button>
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar editor -->
      <aside class="w-96 bg-ship-navy border-r border-ship-slate overflow-y-auto flex flex-col">
        <StepEditor />
      </aside>

      <!-- 3D preview canvas -->
      <main class="flex-1 flex flex-col">
        <Preview3D />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useShipStore } from "@stores/shipStore";
import StepEditor from "@components/StepEditor.vue";
import Preview3D from "@components/Preview3D.vue";

const shipStore = useShipStore();

function handleExport() {
  // Export button is now handled via the ExportEditor step 4
  // This can be removed or used as a quick export shortcut
  console.log("Export button clicked - use Step 4 in the editor");
}
</script>

<style scoped>
/* Component styles here if needed */
</style>
