<template>
  <div class="h-full flex flex-col">
    <!-- Tab navigation -->
    <div class="flex border-b border-ship-slate">
      <button
        v-for="(tab, idx) in tabs"
        :key="idx"
        @click="activeTab = idx"
        :class="[
          'flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors',
          activeTab === idx
            ? 'bg-ship-accent text-white'
            : 'bg-ship-navy text-gray-400 hover:text-gray-200',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="activeTab === 0" class="p-4">
        <HullEditor />
      </div>
      <div v-else-if="activeTab === 1" class="p-4">
        <SecondaryHullEditor />
      </div>
      <div v-else-if="activeTab === 2" class="p-4">
        <DeckEditor />
      </div>
      <div v-else-if="activeTab === 3" class="p-4">
        <DeckPlacementEditor ref="deckPlacementEditorRef" />
      </div>
      <div v-else-if="activeTab === 4" class="p-4">
        <ExportEditor />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useShipStore } from "@stores/shipStore";
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts";
import HullEditor from "./editors/HullEditor.vue";
import SecondaryHullEditor from "./editors/SecondaryHullEditor.vue";
import DeckEditor from "./editors/DeckEditor.vue";
import DeckPlacementEditor from "./editors/DeckPlacementEditor.vue";
import ExportEditor from "./editors/ExportEditor.vue";

const shipStore = useShipStore();
const activeTab = ref(0);
const deckPlacementEditorRef = ref<any>(null);

const tabs = [
  { label: "1. Hull" },
  { label: "1b. Secondary Hulls" },
  { label: "2. Decks" },
  { label: "3. Rooms" },
  { label: "4. Export" },
];

/**
 * Handle tab cycling via keyboard (Tab/Shift+Tab)
 */
const cycleTab = (direction: "next" | "prev") => {
  if (direction === "next") {
    activeTab.value = (activeTab.value + 1) % tabs.length;
  } else {
    activeTab.value = (activeTab.value - 1 + tabs.length) % tabs.length;
  }
};

/**
 * Handle room deletion via Delete key
 */
const deleteSelectedRoom = () => {
  // If on Rooms tab, delegate to DeckPlacementEditor to show confirmation
  if (activeTab.value === 3 && deckPlacementEditorRef.value?.deleteSelectedRoom) {
    deckPlacementEditorRef.value.deleteSelectedRoom();
  } else if (shipStore.selection.itemType === "room" && shipStore.selection.itemIds[0]) {
    // For other tabs or direct deletion
    shipStore.deleteRoom(shipStore.selection.itemIds[0]);
    shipStore.clearSelection();
  }
};

/**
 * Register keyboard shortcuts
 */
useKeyboardShortcuts({
  onCycleTab: cycleTab,
  onDelete: deleteSelectedRoom,
});

/**
 * Watch for selection changes to auto-open relevant tabs
 */
watch(
  () => [shipStore.selection.itemType, shipStore.selection.itemIds],
  ([type, ids]) => {
    if (type === 'room') {
      activeTab.value = 3; // Open Rooms tab
    } else if (type === 'deck') {
      activeTab.value = 2; // Open Decks tab
    } else if (type === 'hull' && ids && ids.length > 0) {
      // Check if it's a secondary hull
      const isSecondaryHull = shipStore.ship.secondaryHulls?.some(h => h.name === ids[0]);
      if (isSecondaryHull) {
        activeTab.value = 1; // Open Secondary Hulls tab
      } else {
        activeTab.value = 0; // Open Hull tab for primary
      }
    }
  }
);
</script>

<style scoped></style>
