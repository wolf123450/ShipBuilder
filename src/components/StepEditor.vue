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
        <DeckEditor />
      </div>
      <div v-else-if="activeTab === 2" class="p-4">
        <DeckPlacementEditor />
      </div>
      <div v-else-if="activeTab === 3" class="p-4">
        <ExportEditor />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import HullEditor from "./editors/HullEditor.vue";
import DeckEditor from "./editors/DeckEditor.vue";
import DeckPlacementEditor from "./editors/DeckPlacementEditor.vue";
import ExportEditor from "./editors/ExportEditor.vue";

const activeTab = ref(0);

const tabs = [
  { label: "1. Hull" },
  { label: "2. Decks" },
  { label: "3. Rooms" },
  { label: "4. Export" },
];
</script>

<style scoped></style>
