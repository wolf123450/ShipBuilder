<template>
  <div class="relative w-full h-full bg-ship-dark">
    <!-- Canvas for Three.js -->
    <div ref="canvasContainer" class="w-full h-full"></div>

    <!-- Loading indicator -->
    <div v-if="shipStore.isCompiling" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-ship-navy rounded p-4 text-center">
        <div class="text-white mb-2">Compiling ship...</div>
        <div class="animate-spin">⚙️</div>
      </div>
    </div>

    <!-- Info overlay -->
    <div class="absolute bottom-4 right-4 bg-ship-navy rounded border border-ship-slate p-3 text-sm max-w-xs">
      <div v-if="shipStore.derivedData" class="space-y-1 text-gray-300">
        <div>Decks: {{ shipStore.derivedData.deckFootprints.length }}</div>
        <div>Rooms: {{ shipStore.derivedData.validatedRooms.length }}</div>
        <div class="text-gray-500 text-xs mt-2">3D preview coming soon</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useShipStore } from "@stores/shipStore";
import * as THREE from "three";

const shipStore = useShipStore();
const canvasContainer = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let animationId: number | null = null;

/**
 * Initialize Three.js scene
 */
function initializeScene() {
  if (!canvasContainer.value) return;

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  // Camera setup
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 30, 50);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasContainer.value.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);

  // Grid helper
  const gridHelper = new THREE.GridHelper(200, 20, 0x333333, 0x111111);
  scene.add(gridHelper);

  // Animation loop
  animate();

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

/**
 * Animation loop
 */
function animate() {
  if (!renderer || !scene || !camera) return;

  animationId = requestAnimationFrame(animate);

  // Rotate camera around scene for visual interest
  const time = Date.now() * 0.0001;
  camera.position.x = Math.sin(time) * 80;
  camera.position.z = Math.cos(time) * 80;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

/**
 * Handle window resize
 */
function onWindowResize() {
  if (!camera || !renderer || !canvasContainer.value) return;

  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

/**
 * Watch for ship changes and update visualization
 */
watch(
  () => shipStore.derivedData,
  () => {
    // TODO: Update Three.js visualization based on derived data
    // This would involve creating meshes for the hull, decks, rooms, etc.
  }
);

onMounted(() => {
  initializeScene();
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  if (renderer && canvasContainer.value) {
    canvasContainer.value.removeChild(renderer.domElement);
  }

  // Clean up Three.js resources
  if (scene) {
    scene.clear();
  }
});
</script>

<style scoped>
/* Canvas container */
</style>
