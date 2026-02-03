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

    <!-- Controls overlay -->
    <div class="absolute top-4 left-4 bg-ship-navy rounded border border-ship-slate p-3 text-sm space-y-2">
      <div>
        <label class="block text-gray-400 text-xs mb-1">Mesh Resolution</label>
        <input
          v-model.number="meshResolution"
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          @change="updateMesh"
          class="w-32"
        />
        <span class="text-gray-300">{{ meshResolution.toFixed(1) }}m</span>
      </div>
      <div class="flex gap-2 text-xs">
        <label class="flex items-center gap-1 cursor-pointer">
          <input v-model="showHull" type="checkbox" @change="updateMesh" class="w-3 h-3" />
          <span>Hull</span>
        </label>
        <label class="flex items-center gap-1 cursor-pointer">
          <input v-model="showDecks" type="checkbox" @change="updateMesh" class="w-3 h-3" />
          <span>Decks</span>
        </label>
        <label class="flex items-center gap-1 cursor-pointer">
          <input v-model="showRooms" type="checkbox" @change="updateMesh" class="w-3 h-3" />
          <span>Rooms</span>
        </label>
      </div>
    </div>

    <!-- Stats overlay -->
    <div class="absolute bottom-4 right-4 bg-ship-navy rounded border border-ship-slate p-3 text-sm max-w-xs">
      <div v-if="shipStore.derivedData" class="space-y-1 text-gray-300">
        <div>Hull: {{ hullMesh ? "Rendered" : "Loading..." }}</div>
        <div>Decks: {{ shipStore.derivedData.deckFootprints.length }}</div>
        <div>Rooms: {{ shipStore.derivedData.validatedRooms.length }}</div>
        <div class="text-gray-500 text-xs mt-2">
          Mesh vertices: {{ meshVertexCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useShipStore } from "@stores/shipStore";
import * as THREE from "three";
import { bakeHullMesh, createPolygonMesh, createRoomMesh } from "@compiler/mesh";
import { createHullVolume } from "@compiler/hull";

const shipStore = useShipStore();
const canvasContainer = ref<HTMLDivElement | null>(null);

// Rendering state
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let animationId: number | null = null;

// Mesh objects
let hullMesh: THREE.Mesh | null = null;
let deckMeshes: THREE.Mesh[] = [];
let roomMeshes: THREE.Mesh[] = [];

// UI state
const meshResolution = ref(2.0);
const showHull = ref(true);
const showDecks = ref(true);
const showRooms = ref(true);
const meshVertexCount = ref(0);

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
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
  camera.position.set(0, 40, 80);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  canvasContainer.value.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Grid helper for reference
  const gridHelper = new THREE.GridHelper(200, 20, 0x333333, 0x111111);
  scene.add(gridHelper);

  // Axes helper for reference (small, in corner)
  const axesHelper = new THREE.AxesHelper(30);
  axesHelper.position.set(-100, 0, -100);
  scene.add(axesHelper);

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

  // Slow orbit around the ship
  const time = Date.now() * 0.00005;
  const radius = 100;
  camera.position.x = Math.sin(time) * radius;
  camera.position.z = Math.cos(time) * radius;
  camera.lookAt(0, 20, 0);

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
 * Update mesh visualization
 */
function updateMesh() {
  if (!scene || !shipStore.derivedData) return;

  // Clear existing meshes
  if (hullMesh) {
    scene.remove(hullMesh);
    hullMesh.geometry.dispose();
    (hullMesh.material as THREE.Material).dispose();
    hullMesh = null;
  }

  deckMeshes.forEach((mesh) => {
    scene!.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
  deckMeshes = [];

  roomMeshes.forEach((mesh) => {
    scene!.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
  roomMeshes = [];

  // Bake hull mesh
  if (showHull.value) {
    try {
      console.log("Starting hull mesh generation...");
      const bakedHull = bakeHullMesh({
        hullVolume: createHullVolumeFromSpec(shipStore.shipSpec),
        resolution: meshResolution.value,
        maxResolution: 60,
      });

      console.log("Hull mesh generated, geometry has ", bakedHull.geometry.getAttribute("position")?.count, " vertices");

      const material = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        shininess: 100,
        side: THREE.FrontSide, // Only show front faces
        flatShading: false, // Use smooth shading
      });

      hullMesh = new THREE.Mesh(bakedHull.geometry, material);
      hullMesh.castShadow = true;
      hullMesh.receiveShadow = true;
      scene.add(hullMesh);

      meshVertexCount.value = (bakedHull.geometry.getAttribute("position").array as Float32Array).length / 3;
      console.log("Hull mesh added to scene, vertex count:", meshVertexCount.value);
    } catch (error) {
      console.error("Failed to bake hull mesh:", error);
    }
  }

  // Create deck footprint meshes
  if (showDecks.value) {
    for (const deck of shipStore.derivedData.deckFootprints) {
      try {
        const geometry = createPolygonMesh(deck.polygon, deck.yMin, 0.1);
        const material = new THREE.MeshPhongMaterial({
          color: 0x64748b,
          transparent: true,
          opacity: 0.3,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        scene.add(mesh);
        deckMeshes.push(mesh);
      } catch (error) {
        console.warn(`Failed to create deck ${deck.deckIndex} mesh:`, error);
      }
    }
  }

  // Create room meshes
  if (showRooms.value) {
    for (const room of shipStore.derivedData.validatedRooms) {
      try {
        const [width, depth] = room.shape.size;
        const geometry = createRoomMesh(room.position.x, room.position.z, width, depth, 0, 2.6); // Assuming deck height of 2.6

        const colors: Record<string, number> = {
          command: 0xff6b6b,
          crew: 0x4ecdc4,
          cargo: 0xffe66d,
          corridor: 0xa8dadc,
          engineering: 0xf4a261,
        };

        const color = colors[room.type] || 0xcccccc;
        const material = new THREE.MeshPhongMaterial({
          color,
          transparent: true,
          opacity: 0.7,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        roomMeshes.push(mesh);
      } catch (error) {
        console.warn(`Failed to create room ${room.id} mesh:`, error);
      }
    }
  }
}

/**
 * Helper: create hull volume from spec
 */
function createHullVolumeFromSpec(spec: any) {
  return createHullVolume(spec.ship.hull);
}

/**
 * Watch for ship changes
 */
watch(
  () => shipStore.derivedData,
  () => {
    updateMesh();
  }
);

watch(() => shipStore.shipSpec.ship.hull, () => {
  updateMesh();
});

onMounted(() => {
  initializeScene();
  updateMesh();
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  if (renderer && canvasContainer.value && renderer.domElement.parentNode === canvasContainer.value) {
    canvasContainer.value.removeChild(renderer.domElement);
  }

  // Clean up Three.js resources
  if (scene) {
    scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          (child.material as THREE.Material).dispose();
        }
      }
    });
    scene.clear();
  }
});
</script>

<style scoped>
/* Canvas container */
</style>

