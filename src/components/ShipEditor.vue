<template>
  <div class="p-4 space-y-6">
    <!-- Meta section -->
    <section class="border-b border-ship-slate pb-4">
      <h2 class="text-lg font-semibold mb-3">Ship Info</h2>
      <div class="space-y-2">
        <input
          v-model="shipStore.shipSpec.ship.meta.name"
          type="text"
          placeholder="Ship name"
          @change="shipStore.updateMeta({ name: shipStore.shipSpec.ship.meta.name })"
          class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
        />
        <textarea
          v-model="shipStore.shipSpec.ship.meta.description"
          placeholder="Description"
          @change="shipStore.updateMeta({ description: shipStore.shipSpec.ship.meta.description })"
          class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white text-sm h-16"
        />
      </div>
    </section>

    <!-- Hull section -->
    <section class="border-b border-ship-slate pb-4">
      <h2 class="text-lg font-semibold mb-3">Hull</h2>
      <div class="space-y-2 text-sm">
        <div>
          <label class="block text-gray-400 mb-1">Length (m)</label>
          <input
            v-model.number="shipStore.shipSpec.ship.hull.length"
            type="number"
            @change="shipStore.updateHull({ length: shipStore.shipSpec.ship.hull.length })"
            class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
          />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Beam (m)</label>
          <input
            v-model.number="shipStore.shipSpec.ship.hull.maxBeam"
            type="number"
            @change="shipStore.updateHull({ maxBeam: shipStore.shipSpec.ship.hull.maxBeam })"
            class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
          />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Height (m)</label>
          <input
            v-model.number="shipStore.shipSpec.ship.hull.maxHeight"
            type="number"
            @change="shipStore.updateHull({ maxHeight: shipStore.shipSpec.ship.hull.maxHeight })"
            class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
          />
        </div>
      </div>
    </section>

    <!-- Decks section -->
    <section class="border-b border-ship-slate pb-4">
      <h2 class="text-lg font-semibold mb-3">Decks</h2>
      <div class="space-y-2 text-sm">
        <div>
          <label class="block text-gray-400 mb-1">Deck Height (m)</label>
          <input
            v-model.number="shipStore.shipSpec.ship.decks.deckHeight"
            type="number"
            @change="shipStore.updateDecks({ deckHeight: shipStore.shipSpec.ship.decks.deckHeight })"
            class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
          />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">Start Y (m)</label>
          <input
            v-model.number="shipStore.shipSpec.ship.decks.startY"
            type="number"
            @change="shipStore.updateDecks({ startY: shipStore.shipSpec.ship.decks.startY })"
            class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
          />
        </div>
        <div>
          <label class="block text-gray-400 mb-1">End Y (m)</label>
          <input
            v-model.number="shipStore.shipSpec.ship.decks.endY"
            type="number"
            @change="shipStore.updateDecks({ endY: shipStore.shipSpec.ship.decks.endY })"
            class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white"
          />
        </div>
      </div>
    </section>

    <!-- Rooms section -->
    <section class="border-b border-ship-slate pb-4">
      <h2 class="text-lg font-semibold mb-3">Rooms</h2>
      <div class="space-y-2">
        <div
          v-for="room in shipStore.shipSpec.ship.rooms"
          :key="room.id"
          class="bg-ship-dark border border-ship-slate rounded p-2 text-sm"
        >
          <div class="font-semibold">{{ room.id }}</div>
          <div class="text-gray-400">{{ room.type }} @ Deck {{ room.deck }}</div>
        </div>
      </div>
    </section>

    <!-- Compilation status -->
    <section v-if="shipStore.compilationError" class="border border-red-600 rounded bg-red-900 p-3">
      <div class="text-red-200">Compilation error:</div>
      <div class="text-sm text-red-100 mt-1">{{ shipStore.compilationError }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useShipStore } from "@stores/shipStore";

const shipStore = useShipStore();
</script>

<style scoped>
/* Component styles */
</style>
