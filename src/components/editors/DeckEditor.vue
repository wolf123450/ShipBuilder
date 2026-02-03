<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold mb-4">Deck Layout</h2>
      <p class="text-gray-400 text-sm mb-4">
        Define the deck stack inside your hull. Each deck is a horizontal layer where rooms are placed.
      </p>
    </div>

    <!-- Deck parameters -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <h3 class="font-semibold text-lg">Configuration</h3>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-gray-400 text-sm mb-2">Deck Height (m)</label>
          <input
            v-model.number="deckHeight"
            type="number"
            step="0.1"
            @change="updateDecks"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
          />
          <div class="text-xs text-gray-500 mt-1">Floor to ceiling</div>
        </div>
        <div>
          <label class="block text-gray-400 text-sm mb-2">Stack Start (m)</label>
          <input
            v-model.number="startY"
            type="number"
            step="0.1"
            @change="updateDecks"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label class="block text-gray-400 text-sm mb-2">Stack End (m)</label>
          <input
            v-model.number="endY"
            type="number"
            step="0.1"
            @change="updateDecks"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
          />
        </div>
      </div>
    </div>

    <!-- Deck summary -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4">
      <h3 class="font-semibold text-lg mb-3">Deck Summary</h3>

      <div v-if="shipStore.derivedData" class="space-y-2">
        <div class="text-gray-400 text-sm mb-3">
          <strong>Total Decks:</strong> {{ deckCount }}
        </div>

        <div class="space-y-1 max-h-64 overflow-y-auto">
          <div
            v-for="(deck, idx) in shipStore.derivedData.deckFootprints"
            :key="idx"
            class="bg-ship-navy rounded p-3 text-sm"
          >
            <div class="flex items-center justify-between mb-1">
              <strong>Deck {{ idx }}</strong>
              <span class="text-xs text-gray-500">{{ deck.polygon.length }} vertices</span>
            </div>
            <div class="text-xs text-gray-400">
              Y: {{ deck.yMin.toFixed(1) }} - {{ deck.yMax.toFixed(1) }} m
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick presets -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <h3 class="font-semibold text-lg">Quick Presets</h3>
      <div class="space-y-2">
        <button
          @click="applyPreset('spacious')"
          class="w-full px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm text-left"
        >
          <strong>Spacious</strong>
          <div class="text-xs text-gray-400">3.5m high, fewer decks</div>
        </button>
        <button
          @click="applyPreset('compact')"
          class="w-full px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm text-left"
        >
          <strong>Compact</strong>
          <div class="text-xs text-gray-400">2.6m high, more decks</div>
        </button>
        <button
          @click="applyPreset('tall')"
          class="w-full px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm text-left"
        >
          <strong>Tall & Narrow</strong>
          <div class="text-xs text-gray-400">2.0m high, many decks</div>
        </button>
      </div>
    </div>

    <!-- Validation -->
    <div v-if="shipStore.compilationError" class="border border-red-600 rounded bg-red-900 p-3">
      <div class="text-red-200 font-semibold">Validation Error</div>
      <div class="text-sm text-red-100 mt-1">{{ shipStore.compilationError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useShipStore } from "@stores/shipStore";

const shipStore = useShipStore();

const deckHeight = ref(shipStore.shipSpec.ship.decks.deckHeight);
const startY = ref(shipStore.shipSpec.ship.decks.startY);
const endY = ref(shipStore.shipSpec.ship.decks.endY);

const deckCount = computed(() => {
  return Math.floor((endY.value - startY.value) / deckHeight.value);
});

/**
 * Update decks in store
 */
function updateDecks() {
  shipStore.updateDecks({
    deckHeight: deckHeight.value,
    startY: startY.value,
    endY: endY.value,
  });
}

/**
 * Apply deck preset
 */
function applyPreset(type: string) {
  const presets: Record<string, any> = {
    spacious: {
      deckHeight: 3.5,
      startY: -7,
      endY: 7,
    },
    compact: {
      deckHeight: 2.6,
      startY: -10.4,
      endY: 10.4,
    },
    tall: {
      deckHeight: 2.0,
      startY: -15,
      endY: 15,
    },
  };

  const preset = presets[type];
  if (preset) {
    deckHeight.value = preset.deckHeight;
    startY.value = preset.startY;
    endY.value = preset.endY;
    updateDecks();
  }
}

/**
 * Watch store for external changes
 */
watch(
  () => shipStore.shipSpec.ship.decks,
  (newDecks) => {
    if (newDecks.deckHeight !== deckHeight.value) {
      deckHeight.value = newDecks.deckHeight;
      startY.value = newDecks.startY;
      endY.value = newDecks.endY;
    }
  },
  { deep: true }
);
</script>

<style scoped></style>
