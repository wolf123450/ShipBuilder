<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold mb-4">Export & Save</h2>
      <p class="text-gray-400 text-sm mb-4">
        Save your ship design or export it for use in other applications.
      </p>
    </div>

    <!-- Current project info -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-2">
      <div class="text-sm">
        <strong class="block text-white mb-1">Project Name</strong>
        <input
          v-model="shipName"
          type="text"
          @change="updateName"
          class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white"
        />
      </div>
      <div class="text-sm">
        <strong class="block text-white mb-1">Description</strong>
        <textarea
          v-model="shipDescription"
          @change="updateDescription"
          class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white h-20"
        />
      </div>
    </div>

    <!-- Export formats -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <h3 class="font-semibold text-lg">Export Formats</h3>

      <div class="space-y-2">
        <button
          @click="exportJSON"
          class="w-full px-4 py-3 bg-ship-navy hover:bg-ship-slate rounded border border-ship-slate text-left"
        >
          <strong class="block">📄 JSON Export</strong>
          <span class="text-xs text-gray-400">Portable, machine-readable format</span>
        </button>

        <button
          @click="exportYAML"
          class="w-full px-4 py-3 bg-ship-navy hover:bg-ship-slate rounded border border-ship-slate text-left"
        >
          <strong class="block">📝 YAML Export</strong>
          <span class="text-xs text-gray-400">Human-readable, version control friendly</span>
        </button>

        <button
          @click="exportGLB"
          :disabled="!canExportGLB"
          :class="[
            'w-full px-4 py-3 rounded border',
            canExportGLB
              ? 'bg-ship-navy hover:bg-ship-slate border-ship-slate cursor-pointer'
              : 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50',
          ]"
        >
          <strong class="block">🎨 GLB Export</strong>
          <span class="text-xs text-gray-400">
            {{ canExportGLB ? "3D model, game engine ready" : "Coming soon" }}
          </span>
        </button>
      </div>
    </div>

    <!-- Local saves -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-lg">Local Saves</h3>
        <div class="flex gap-2">
          <button
            @click="importShip"
            class="px-3 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-sm font-semibold"
          >
            Import
          </button>
          <button
            @click="saveLocal"
            class="px-3 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-sm font-semibold"
          >
            Save Current
          </button>
        </div>
      </div>

      <div v-if="importError" class="bg-red-900 border border-red-700 rounded p-3 text-red-200 text-sm">
        {{ importError }}
      </div>

      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="save in saves"
          :key="save.id"
          class="bg-ship-navy rounded p-3 flex items-start justify-between"
        >
          <div>
            <strong class="block">{{ save.name }}</strong>
            <span class="text-xs text-gray-500">{{ formatDate(save.timestamp) }}</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="loadLocal(save.id)"
              class="text-ship-accent hover:text-blue-300 text-sm font-semibold"
            >
              Load
            </button>
            <button
              @click="deleteLocal(save.id)"
              class="text-red-400 hover:text-red-300 text-sm font-semibold"
            >
              Delete
            </button>
          </div>
        </div>

        <div v-if="saves.length === 0" class="text-gray-400 text-sm py-4 text-center">
          No local saves yet.
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="shipStore.derivedData" class="bg-ship-dark border border-ship-slate rounded p-4">
      <h3 class="font-semibold text-lg mb-3">Ship Statistics</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-400">Hull Length</span>
          <div class="text-white">{{ shipStore.shipSpec.ship.hull.length }}m</div>
        </div>
        <div>
          <span class="text-gray-400">Hull Beam</span>
          <div class="text-white">{{ shipStore.shipSpec.ship.hull.maxBeam }}m</div>
        </div>
        <div>
          <span class="text-gray-400">Decks</span>
          <div class="text-white">{{ shipStore.derivedData.deckFootprints.length }}</div>
        </div>
        <div>
          <span class="text-gray-400">Rooms</span>
          <div class="text-white">{{ shipStore.derivedData.validatedRooms.length }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useShipStore } from "@stores/shipStore";
import { exportAsJSON, exportAsYAML, downloadFile, exportAsGLB, triggerFileInput, importFromFile } from "@utils/export";
import { saveShipToLibrary, loadLibrary, loadShipFromStorage, deleteFromLibrary } from "@utils/storage";
import * as THREE from "three";

const shipStore = useShipStore();
const shipName = ref(shipStore.shipSpec.ship.meta.name);
const shipDescription = ref(shipStore.shipSpec.ship.meta.description || "");
const saves = ref<Array<{ id: string; name: string; timestamp: string }>>([]);
const isExporting = ref(false);
const importError = ref("");

const canExportGLB = computed(() => true); // GLB export now available

/**
 * Update ship name
 */
function updateName() {
  shipStore.updateMeta({ name: shipName.value });
}

/**
 * Update ship description
 */
function updateDescription() {
  shipStore.updateMeta({ description: shipDescription.value });
}

/**
 * Export as JSON
 */
function exportJSON() {
  const json = exportAsJSON(shipStore.shipSpec);
  const filename = `${shipStore.shipSpec.ship.meta.name.replace(/\s+/g, "_")}.json`;
  downloadFile(json, filename, "application/json");
}

/**
 * Export as YAML
 */
async function exportYAML() {
  const yaml = await exportAsYAML(shipStore.shipSpec);
  const filename = `${shipStore.shipSpec.ship.meta.name.replace(/\s+/g, "_")}.yaml`;
  downloadFile(yaml, filename, "application/x-yaml");
}

/**
 * Export as GLB (three.js binary format)
 * Note: For now, exports a simple hull mesh. Full export (decks/rooms) requires Preview3D integration.
 */
async function exportGLB() {
  try {
    isExporting.value = true;
    
    const scene = new THREE.Scene();
    scene.name = shipStore.shipSpec.ship.meta.name;

    // Import mesh compilation functions
    const { bakeHullMesh } = await import("@compiler/mesh");
    const { createHullVolume } = await import("@compiler/hull");

    // Create hull volume from current spec
    const hullVolume = createHullVolume(shipStore.shipSpec.ship.hull);

    if (!hullVolume) {
      alert("Failed to create hull volume. Check ship hull parameters.");
      return;
    }

    // Bake hull mesh
    const bakedHull = bakeHullMesh({
      hullVolume,
      resolution: 2.0,
      maxResolution: 60,
    });

    if (!bakedHull?.geometry) {
      alert("Failed to create hull geometry for export.");
      return;
    }

    const hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      shininess: 100,
      side: THREE.FrontSide,
    });

    const hullMesh = new THREE.Mesh(bakedHull.geometry, hullMaterial);
    hullMesh.name = "Hull";
    scene.add(hullMesh);

    const filename = `${shipStore.shipSpec.ship.meta.name.replace(/\s+/g, "_")}.glb`;
    await exportAsGLB(scene, filename);
    alert(`✓ Exported "${filename}"`);
  } catch (error) {
    console.error("GLB export failed:", error);
    alert("Failed to export GLB: " + String(error));
  } finally {
    isExporting.value = false;
  }
}

/**
 * Save to local library
 */
function saveLocal() {
  saveShipToLibrary(shipStore.shipSpec);
  loadSaves();
  alert(`Saved "${shipStore.shipSpec.ship.meta.name}"`);
}

/**
 * Load from local library
 */
function loadLocal(id: string) {
  const library = loadLibrary();
  const save = library.find((s) => s.id === id);
  if (save) {
    shipStore.loadShip(save.spec);
    shipName.value = save.spec.ship.meta.name;
    shipDescription.value = save.spec.ship.meta.description || "";
  }
}

/**
 * Delete from local library
 */
function deleteLocal(id: string) {
  if (confirm("Are you sure you want to delete this save?")) {
    deleteFromLibrary(id);
    loadSaves();
  }
}

/**
 * Import ship from file
 */
function importShip() {
  triggerFileInput(async (file) => {
    try {
      importError.value = "";
      const spec = await importFromFile(file);
      if (spec) {
        shipStore.loadShip(spec);
        shipName.value = spec.ship.meta.name;
        shipDescription.value = spec.ship.meta.description || "";
      } else {
        importError.value = "Failed to parse file. Ensure it's valid JSON or YAML format.";
      }
    } catch (error) {
      importError.value = "Import error: " + String(error);
    }
  });
}

/**
 * Load saves list
 */
function loadSaves() {
  const library = loadLibrary();
  saves.value = library.map((s) => ({
    id: s.id,
    name: s.name,
    timestamp: s.timestamp,
  }));
}

/**
 * Format date
 */
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

onMounted(() => {
  loadSaves();
});
</script>

<style scoped></style>
