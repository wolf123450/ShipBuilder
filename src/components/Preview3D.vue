<template>
  <div class="relative w-full h-full bg-ship-dark" @click="onOutsideClick">
    <!-- Canvas for Three.js -->
    <div ref="canvasContainer" class="w-full h-full"></div>

    <!-- Loading indicator -->
    <div v-if="shipStore.isCompiling" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-ship-navy rounded p-4 text-center">
        <div class="text-white mb-2">Compiling ship...</div>
        <div class="animate-spin">⚙️</div>
      </div>
    </div>

    <!-- Top Navigation Panel - Preset Views -->
    <div class="absolute top-4 left-4 bg-ship-navy rounded border border-ship-slate p-3 space-y-2">
      <div class="text-xs font-semibold text-gray-400 uppercase">Preset Views</div>
      <div class="grid grid-cols-4 gap-2">
        <button @click="cameraControls.setPresetView('top')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', cameraControls.currentPresetView.value === 'top' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>⬆</span> <span>Top (Y+)</span>
        </button>
        <button @click="cameraControls.setPresetView('bottom')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', cameraControls.currentPresetView.value === 'bottom' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>⬇</span> <span>Bottom (Y-)</span>
        </button>
        <button @click="cameraControls.setPresetView('front')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', cameraControls.currentPresetView.value === 'front' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>→</span> <span>Front (Z+)</span>
        </button>
        <button @click="cameraControls.setPresetView('back')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', cameraControls.currentPresetView.value === 'back' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>←</span> <span>Back (Z-)</span>
        </button>
        <button @click="cameraControls.setPresetView('right')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', cameraControls.currentPresetView.value === 'right' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>◀</span> <span>Right (X+)</span>
        </button>
        <button @click="cameraControls.setPresetView('left')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', cameraControls.currentPresetView.value === 'left' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>▶</span> <span>Left (X-)</span>
        </button>
        <button @click="cameraControls.resetView" class="px-2 py-1 bg-ship-slate hover:bg-ship-accent rounded text-white text-xs font-semibold flex items-center gap-1">
          <span>⟲</span> <span>Reset View</span>
        </button>
      </div>
    </div>

    <!-- Camera Controls Toggle Button (Top, next to preset views) -->
    <div class="absolute top-4 left-[28rem] bg-ship-navy rounded border border-ship-slate p-3">
      <button @click="showCameraPanel = !showCameraPanel" class="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2 cursor-pointer hover:text-ship-accent">
        <span>{{ showCameraPanel ? '▼' : '▶' }}</span> Camera Controls
      </button>
    </div>

    <!-- Camera Controls Panel (Side-mounted, expandable to the right) -->
    <div ref="cameraPanelContainer" v-if="showCameraPanel" class="absolute top-16 left-[28rem] bg-ship-navy rounded border border-ship-slate p-3 space-y-3 w-80 max-h-96 overflow-y-auto pointer-events-auto">
          <!-- Camera Target -->
          <div class="space-y-1">
            <label class="block text-xs text-gray-400 font-semibold">Camera Target (X, Y, Z)</label>
            <div class="flex gap-1">
              <input v-model.number="cameraControls.cameraTarget.value.x" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraControls.cameraTarget.value.y" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraControls.cameraTarget.value.z" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
            </div>
          </div>

          <!-- Camera Position -->
          <div class="space-y-1">
            <label class="block text-xs text-gray-400 font-semibold">Camera Position (X, Y, Z)</label>
            <div class="flex gap-1">
              <input v-model.number="cameraControls.cameraPos.value.x" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraControls.cameraPos.value.y" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraControls.cameraPos.value.z" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <button @click="cameraControls.applyCameraPosition" class="px-2 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-xs font-semibold">
                Apply
              </button>
            </div>
          </div>

          <!-- Animation Duration -->
          <div class="space-y-1">
            <label class="block text-xs text-gray-400 font-semibold">Animation Duration: {{ animationDuration.toFixed(2) }}s</label>
            <input v-model.number="animationDuration" type="range" min="0" max="5" step="0.1" class="w-full" />
          </div>
        </div>

    <!-- Selected Object Card -->
    <div class="absolute top-4 right-80 bg-ship-navy rounded border border-ship-slate p-3 w-80">
      <div class="text-xs font-semibold text-gray-400 uppercase mb-3">Selected Object</div>
      <div v-if="!shipStore.selection.itemType" class="text-xs text-gray-500 italic">
        (None - Click to select)
      </div>
      <div v-else class="space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-xs text-gray-400">Type</div>
            <div class="text-sm text-white font-semibold capitalize">{{ shipStore.selection.itemType }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">ID</div>
            <div class="text-sm text-white font-semibold">{{ shipStore.selection.itemIds[0] || 'primary' }}</div>
          </div>
        </div>
        <button 
          @click="cameraControls.focusOnSelected"
          class="w-full px-2 py-2 rounded text-white text-xs font-semibold transition-colors bg-ship-accent hover:bg-blue-600"
        >
          Focus on Selection (F)
        </button>
      </div>
    </div>

    <!-- Mesh Controls overlay -->
    <div class="absolute top-4 right-4 bg-ship-navy rounded border border-ship-slate p-3 text-sm space-y-2">
      <div>
        <label class="block text-gray-400 text-xs mb-1">Mesh Resolution</label>
        <input
          v-model.number="meshResolution"
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          @change="meshManagement.updateMesh"
          class="w-32"
        />
        <span class="text-gray-300">{{ meshResolution.toFixed(1) }}m</span>
      </div>
      <div class="flex gap-2 text-xs">
        <label class="flex items-center gap-1 cursor-pointer">
          <input v-model="showNormals" type="checkbox" @change="meshManagement.updateNormals" class="w-3 h-3" />
          <span>Normals (Debug)</span>
        </label>
      </div>
    </div>

    <!-- Stats overlay -->
    <div class="absolute bottom-4 right-4 bg-ship-navy rounded border border-ship-slate p-3 text-sm max-w-xs">
      <div v-if="shipStore.derivedData" class="space-y-1 text-gray-300">
        <div>Hull: {{ meshManagement.hullMesh() ? "Rendered" : "Loading..." }}</div>
        <div>Decks: {{ shipStore.derivedData.deckFootprints.length }}</div>
        <div>Rooms: {{ shipStore.derivedData.validatedRooms.length }}</div>
        <div class="text-gray-500 text-xs mt-2">
          Mesh vertices: {{ meshManagement.meshVertexCount.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useShipStore } from '@stores/shipStore';
import { useSceneSetup } from './composables/useSceneSetup';
import { useCameraControls } from './composables/useCameraControls';
import { useMeshManagement } from './composables/useMeshManagement';
import { useRaycasting } from './composables/useRaycasting';
import { useSelection } from './composables/useSelection';
import { useInputHandlers } from './composables/useInputHandlers';

const shipStore = useShipStore();
const canvasContainer = ref<HTMLDivElement | null>(null);
const cameraPanelContainer = ref<HTMLDivElement | null>(null);

// UI state
const meshResolution = ref(2.0);
const showHull = computed({
  get: () => shipStore.visibility.hull,
  set: (val) => { shipStore.visibility.hull = val; }
});
const showDecks = computed({
  get: () => shipStore.visibility.decks,
  set: (val) => { shipStore.visibility.decks = val; }
});
const showRooms = computed({
  get: () => shipStore.visibility.rooms,
  set: (val) => { shipStore.visibility.rooms = val; }
});
const showNormals = computed({
  get: () => shipStore.visibility.normals,
  set: (val) => { shipStore.visibility.normals = val; }
});
const showCameraPanel = ref(false);
const animationDuration = ref(1.5);

// Initialize all composables
const sceneSetup = useSceneSetup(canvasContainer);
const meshManagement = useMeshManagement(
  sceneSetup.scene,
  meshResolution,
  showHull,
  showDecks,
  showRooms,
  showNormals
);
const cameraControls = useCameraControls(sceneSetup.camera, sceneSetup.scene, animationDuration);
const raycasting = useRaycasting(
  sceneSetup.camera,
  sceneSetup.renderer,
  meshManagement.hullMesh,
  meshManagement.secondaryHullMeshes,
  meshManagement.deckMeshes,
  meshManagement.roomMeshes,
  meshManagement.roomMeshMap,
  showHull,
  showDecks,
  showRooms
);
const selection = useSelection(
  sceneSetup.scene,
  meshManagement.hullMesh,
  meshManagement.secondaryHullMeshes,
  meshManagement.deckMeshes,
  meshManagement.roomMeshes,
  meshManagement.createOutlineMesh
);
const inputHandlers = useInputHandlers(
  sceneSetup.renderer,
  sceneSetup.camera,
  cameraControls.cameraPos,
  cameraControls.cameraTarget,
  cameraControls.currentPresetView,
  raycasting.raycastFromMouse,
  selection.updateSelectionOutlines,
  cameraControls.focusOnSelected,
  showHull,
  showDecks,
  showRooms,
  meshManagement.roomMeshMap,
  meshManagement.roomMeshes
);

/**
 * Handle clicks outside the camera panel to close it
 */
function onOutsideClick(event: MouseEvent) {
  if (showCameraPanel.value && cameraPanelContainer.value) {
    const target = event.target as HTMLElement;

    const isToggleButton = (
      target.closest('[class*="text-gray-400"][class*="uppercase"]') ||
      target.closest('button')?.textContent?.includes('Camera Controls')
    );
    const isInsidePanel = cameraPanelContainer.value.contains(target);

    if (!isInsidePanel && !isToggleButton) {
      showCameraPanel.value = false;
    }
  }
}

/**
 * Animation loop
 */
function animate() {
  cameraControls.updateCameraAnimation();
}

/**
 * Watch for ship changes
 */
watch(
  () => shipStore.derivedData,
  () => {
    meshManagement.updateMesh();
    // Update mesh centers for camera controls
    cameraControls.setMeshCenters(
      meshManagement.hullCenter(),
      meshManagement.deckCenters()
    );
  }
);

watch(
  () => shipStore.shipSpec.ship.hull,
  () => {
    meshManagement.updateMesh();
  },
  { deep: true }
);

/**
 * Watch for unified hulls array changes (Phase 5.0c)
 */
watch(
  () => (shipStore.shipSpec.ship as any).hulls,
  () => {
    meshManagement.updateMesh();
  },
  { deep: true }
);

/**
 * Watch for selection changes to update outlines
 */
watch(
  () => [shipStore.selection.itemType, shipStore.selection.itemIds],
  () => {
    selection.updateSelectionOutlines();
  },
  { deep: true }
);

/**
 * Watch for visibility changes to deselect hidden items
 */
watch(
  () => showHull.value,
  (visible) => {
    if (!visible && shipStore.selection.itemType === 'hull') {
      shipStore.clearSelection();
      selection.updateSelectionOutlines();
    }
  }
);

watch(
  () => showDecks.value,
  (visible) => {
    if (!visible && shipStore.selection.itemType === 'deck') {
      shipStore.clearSelection();
      selection.updateSelectionOutlines();
    }
  }
);

watch(
  () => showRooms.value,
  (visible) => {
    if (!visible && shipStore.selection.itemType === 'room') {
      shipStore.clearSelection();
      selection.updateSelectionOutlines();
    }
  }
);

/**
 * Watch for visibility state changes to update meshes
 */
watch(
  () => shipStore.visibility,
  () => {
    meshManagement.updateMesh();
  },
  { deep: true }
);

onMounted(() => {
  // Initialize scene
  sceneSetup.initializeScene();

  // Initialize camera position
  cameraControls.cameraPos.value = { x: 0, y: 40, z: 80 };
  cameraControls.cameraTarget.value = { x: 0, y: 0, z: 0 };
  cameraControls.updateTargetIndicator();

  // Initialize meshes
  meshManagement.updateMesh();
  cameraControls.setMeshCenters(
    meshManagement.hullCenter(),
    meshManagement.deckCenters()
  );

  // Start animation loop
  sceneSetup.startAnimationLoop(animate);

  // Attach input handlers
  inputHandlers.attachEventListeners();
});

onUnmounted(() => {
  inputHandlers.detachEventListeners();
  sceneSetup.cleanup();
});
</script>

<style scoped>
/* Canvas container */
</style>
