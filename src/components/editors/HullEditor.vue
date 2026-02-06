<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold mb-4">Hull Design</h2>
      <p class="text-gray-400 text-sm mb-4">
        Define the basic shape of your ship by adjusting the hull profile.
      </p>
    </div>

    <!-- Main hull parameters -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4 overflow-visible">
      <h3 class="font-semibold text-lg">Hull Dimensions</h3>

      <div class="grid grid-cols-3 gap-4 overflow-visible">
        <div>
          <Tooltip text="Front-to-back length of the ship">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Length (m)</label>
          </Tooltip>
          <input
            v-model.number="length"
            type="number"
            @change="updateHull"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <Tooltip text="Port-to-starboard width at the widest point">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Beam/Width (m)</label>
          </Tooltip>
          <input
            v-model.number="maxBeam"
            type="number"
            @change="updateHull"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <Tooltip text="Bottom-to-top height at the tallest point">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Height (m)</label>
          </Tooltip>
          <input
            v-model.number="maxHeight"
            type="number"
            @change="updateHull"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
          />
        </div>
      </div>
    </div>

    <!-- Hull spine profile -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4 overflow-visible">
      <h3 class="font-semibold text-lg">Hull Profile</h3>
      <p class="text-gray-400 text-xs">
        Adjust the radius at different points along the ship's length (0 = nose, 1 = tail).
      </p>

      <div class="space-y-2 overflow-visible">
        <div
          v-for="(point, idx) in spine.points"
          :key="idx"
          class="bg-ship-navy rounded p-3 space-y-2 overflow-visible"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Point {{ idx + 1 }}</span>
            <button
              v-if="spine.points.length > 3"
              @click="removePoint(idx)"
              class="text-red-400 hover:text-red-300 text-xs font-semibold"
            >
              Delete
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 overflow-visible">
            <div class="overflow-visible">
              <Tooltip text="Position along ship length (0=nose, 1=tail)">
                <label class="text-xs text-gray-400 block mb-1 cursor-help">Position (Z)</label>
              </Tooltip>
              <input
                v-model.number="point.z"
                type="number"
                min="0"
                max="1"
                step="0.01"
                @change="updateHull"
                class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
            </div>
            <div>
              <Tooltip text="Hull width at this point (0=point, 1=max beam)">
                <label class="text-xs text-gray-400 block mb-1 cursor-help">Radius</label>
              </Tooltip>
              <input
                v-model.number="point.radius"
                type="number"
                min="0"
                max="1"
                step="0.01"
                @change="updateHull"
                class="w-full bg-ship-dark border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
              <div class="text-xs text-gray-500 mt-1">
                {{ (point.radius * (maxBeam / 2)).toFixed(1) }}m
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="addPoint"
        class="w-full px-3 py-2 bg-ship-accent hover:bg-blue-600 rounded text-white text-sm font-semibold"
      >
        + Add Profile Point
      </button>
    </div>

    <!-- Hull presets -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <h3 class="font-semibold text-lg">Quick Presets</h3>
      <div class="grid grid-cols-2 gap-2">
        <button @click="applyPreset('fighter')" class="px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm">
          Fighter
        </button>
        <button @click="applyPreset('corvette')" class="px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm">
          Corvette
        </button>
        <button @click="applyPreset('cruiser')" class="px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm">
          Cruiser
        </button>
        <button @click="applyPreset('capital')" class="px-3 py-2 bg-ship-navy hover:bg-ship-slate rounded text-sm">
          Capital Ship
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
import { ref, reactive, watch } from "vue";
import { useShipStore } from "@stores/shipStore";
import Tooltip from "../Tooltip.vue";

const shipStore = useShipStore();

const length = ref(shipStore.shipSpec.ship.hull.length);
const maxBeam = ref(shipStore.shipSpec.ship.hull.maxBeam);
const maxHeight = ref(shipStore.shipSpec.ship.hull.maxHeight);
const spine = reactive({
  points: shipStore.shipSpec.ship.hull.spine.points.map((p) => ({ ...p })),
});

/**
 * Update hull in store
 */
function updateHull() {
  shipStore.updateHull({
    length: length.value,
    maxBeam: maxBeam.value,
    maxHeight: maxHeight.value,
    spine: {
      points: spine.points.sort((a, b) => a.z - b.z), // Keep sorted
    },
  });
}

/**
 * Add a new profile point
 */
function addPoint() {
  const lastPoint = spine.points[spine.points.length - 1];
  spine.points.push({
    z: Math.min(lastPoint.z + 0.25, 0.95),
    radius: 0.5,
  });
  updateHull();
}

/**
 * Remove a profile point
 */
function removePoint(idx: number) {
  if (spine.points.length > 3) {
    spine.points.splice(idx, 1);
    updateHull();
  }
}

/**
 * Apply hull preset
 */
function applyPreset(type: string) {
  const presets: Record<string, any> = {
    fighter: {
      length: 40,
      maxBeam: 12,
      maxHeight: 6,
      spine: {
        points: [
          { z: 0.0, radius: 0.15 },
          { z: 0.4, radius: 0.7 },
          { z: 1.0, radius: 0.1 },
        ],
      },
    },
    corvette: {
      length: 80,
      maxBeam: 20,
      maxHeight: 10,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.3, radius: 0.85 },
          { z: 0.7, radius: 0.75 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    },
    cruiser: {
      length: 150,
      maxBeam: 35,
      maxHeight: 15,
      spine: {
        points: [
          { z: 0.0, radius: 0.25 },
          { z: 0.25, radius: 0.8 },
          { z: 0.5, radius: 0.9 },
          { z: 0.75, radius: 0.7 },
          { z: 1.0, radius: 0.25 },
        ],
      },
    },
    capital: {
      length: 300,
      maxBeam: 80,
      maxHeight: 40,
      spine: {
        points: [
          { z: 0.0, radius: 0.3 },
          { z: 0.2, radius: 0.85 },
          { z: 0.5, radius: 0.95 },
          { z: 0.8, radius: 0.8 },
          { z: 1.0, radius: 0.3 },
        ],
      },
    },
  };

  const preset = presets[type];
  if (preset) {
    length.value = preset.length;
    maxBeam.value = preset.maxBeam;
    maxHeight.value = preset.maxHeight;
    spine.points = preset.spine.points.map((p: any) => ({ ...p }));
    updateHull();
  }
}

/**
 * Watch store for external changes
 */
watch(
  () => shipStore.shipSpec.ship.hull,
  (newHull) => {
    if (newHull.length !== length.value) {
      length.value = newHull.length;
      maxBeam.value = newHull.maxBeam;
      maxHeight.value = newHull.maxHeight;
      spine.points = newHull.spine.points.map((p) => ({ ...p }));
    }
  },
  { deep: true }
);
</script>

<style scoped></style>
