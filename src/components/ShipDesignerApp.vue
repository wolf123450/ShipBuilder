<template>
  <div class="h-screen w-full flex flex-col bg-ship-dark text-white">
    <!-- Header -->
    <header class="bg-ship-navy border-b border-ship-slate px-4 py-3">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Ship Design Toolkit</h1>
        <div class="flex items-center gap-2">
          <!-- Save status indicator -->
          <span 
            v-if="shipStore.isDirty" 
            class="text-yellow-400 text-sm flex items-center gap-1"
          >
            ⚠️ Unsaved changes
          </span>
          <span 
            v-else-if="saveStatus === 'saving'" 
            class="text-blue-400 text-sm flex items-center gap-1"
          >
            💾 Saving...
          </span>
          <span 
            v-else-if="saveStatus === 'saved'" 
            class="text-green-400 text-sm flex items-center gap-1"
          >
            ✓ Saved
          </span>
          
          <!-- Keyboard shortcut hint -->
          <div class="text-xs text-gray-500 ml-4">
            (Ctrl+S to save)
          </div>
          
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
import { ref } from "vue";
import { useShipStore } from "@stores/shipStore";
import { useKeyboardShortcuts } from "@components/composables/useKeyboardShortcuts";
import { saveShipToLibrary } from "@utils/storage";
import StepEditor from "@components/StepEditor.vue";
import Preview3D from "@components/Preview3D.vue";

const shipStore = useShipStore();
const saveStatus = ref<"idle" | "saving" | "saved">("idle");

/**
 * Save project to localStorage with Ctrl+S
 */
function saveProject() {
  try {
    saveStatus.value = "saving";
    saveShipToLibrary(shipStore.shipSpec);
    shipStore.markClean();
    
    // Show brief "Saved" feedback
    saveStatus.value = "saved";
    setTimeout(() => {
      saveStatus.value = "idle";
    }, 2000);
  } catch (error) {
    console.error("Failed to save project:", error);
    saveStatus.value = "idle";
  }
}

/**
 * Register keyboard shortcuts (Ctrl+S to save)
 */
useKeyboardShortcuts({
  onSave: saveProject,
});

function handleExport() {
  // Export button is now handled via the ExportEditor step 4
  // This can be removed or used as a quick export shortcut
  console.log("Export button clicked - use Step 4 in the editor");
}
</script>

<style scoped>
/* Component styles here if needed */
</style>
