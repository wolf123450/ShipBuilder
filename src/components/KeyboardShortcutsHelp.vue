<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-ship-dark border border-ship-slate rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 bg-ship-navy border-b border-ship-slate px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-bold text-white">⌨️ Keyboard Shortcuts</h2>
            <button
              @click="close"
              class="text-gray-400 hover:text-white transition-colors p-1 rounded"
              title="Close (Esc)"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-8">
            <!-- Editing Shortcuts -->
            <div>
              <h3 class="text-lg font-semibold text-ship-accent mb-4">Editing</h3>
              <div class="space-y-3">
                <ShortcutRow
                  keys="Delete"
                  description="Delete selected room"
                  icon="🗑️"
                />
                <ShortcutRow
                  keys="Esc"
                  description="Clear selection"
                  icon="✖️"
                />
              </div>
            </div>

            <!-- Navigation Shortcuts -->
            <div>
              <h3 class="text-lg font-semibold text-ship-accent mb-4">Navigation</h3>
              <div class="space-y-3">
                <ShortcutRow
                  keys="Tab"
                  description="Next tab"
                  icon="→"
                />
                <ShortcutRow
                  keys="Shift + Tab"
                  description="Previous tab"
                  icon="←"
                />
              </div>
            </div>

            <!-- File Shortcuts -->
            <div>
              <h3 class="text-lg font-semibold text-ship-accent mb-4">File</h3>
              <div class="space-y-3">
                <ShortcutRow
                  keys="Ctrl+S"
                  description="Save project to library"
                  icon="💾"
                  macKeys="Cmd+S"
                />
              </div>
            </div>

            <!-- Help Shortcuts -->
            <div>
              <h3 class="text-lg font-semibold text-ship-accent mb-4">Help</h3>
              <div class="space-y-3">
                <ShortcutRow
                  keys="?"
                  description="Show this keyboard shortcuts dialog"
                  icon="❓"
                />
              </div>
            </div>

            <!-- 3D Preview Controls -->
            <div>
              <h3 class="text-lg font-semibold text-ship-accent mb-4">3D Preview</h3>
              <div class="space-y-3">
                <ShortcutRow
                  keys="Left Click"
                  description="Select hull, deck, or room"
                  icon="🖱️"
                />
                <ShortcutRow
                  keys="Middle Drag"
                  description="Orbit camera around target"
                  icon="🔄"
                />
                <ShortcutRow
                  keys="Shift + Middle Drag"
                  description="Pan camera (move view)"
                  icon="↔️"
                />
                <ShortcutRow
                  keys="Scroll Wheel"
                  description="Zoom in/out"
                  icon="🔍"
                />
                <ShortcutRow
                  keys="F"
                  description="Focus on selected object (fit view)"
                  icon="📍"
                />
              </div>
            </div>

            <!-- Tips -->
            <div class="bg-ship-navy border border-ship-slate rounded p-4 mt-8">
              <p class="text-sm text-gray-400 mb-3">
                <strong>💡 Tip:</strong> You can use Tab and Shift+Tab to navigate between editor tabs quickly. Select a room in the Rooms tab and press Delete to remove it (with confirmation).
              </p>
              <p class="text-sm text-gray-400">
                <strong>🎮 3D Preview:</strong> Click and drag with the middle mouse button to orbit the ship. Hold Shift while dragging to pan. Use the mouse wheel to zoom. Press F to focus on a selected object.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 bg-ship-navy border-t border-ship-slate px-6 py-4 flex items-center justify-between">
            <span class="text-xs text-gray-500">Press <kbd class="inline-block bg-ship-dark border border-ship-slate px-2 py-1 rounded text-white">Esc</kbd> or click close to dismiss</span>
            <button
              @click="close"
              class="px-4 py-2 bg-ship-accent hover:bg-blue-600 rounded text-white font-semibold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import ShortcutRow from "./ShortcutRow.vue";

const isOpen = ref(false);

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

// Handle keyboard shortcut to toggle help
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "?" && event.shiftKey === false) {
    event.preventDefault();
    toggle();
  }

  // Also allow Escape to close
  if (event.key === "Escape" && isOpen.value) {
    event.preventDefault();
    close();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

defineExpose({
  open,
  close,
  toggle,
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

kbd {
  font-family: monospace;
}
</style>
