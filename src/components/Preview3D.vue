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
        <button @click="setPresetView('top')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', currentPresetView === 'top' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>⬆</span> <span>Top (Y+)</span>
        </button>
        <button @click="setPresetView('bottom')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', currentPresetView === 'bottom' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>⬇</span> <span>Bottom (Y-)</span>
        </button>
        <button @click="setPresetView('front')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', currentPresetView === 'front' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>→</span> <span>Front (Z+)</span>
        </button>
        <button @click="setPresetView('back')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', currentPresetView === 'back' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>←</span> <span>Back (Z-)</span>
        </button>
        <button @click="setPresetView('right')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', currentPresetView === 'right' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>◀</span> <span>Right (X+)</span>
        </button>
        <button @click="setPresetView('left')" :class="['px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1', currentPresetView === 'left' ? 'bg-ship-accent border-2 border-yellow-300' : 'bg-ship-slate hover:bg-ship-accent']">
          <span>▶</span> <span>Left (X-)</span>
        </button>
        <button @click="resetView" class="px-2 py-1 bg-ship-slate hover:bg-ship-accent rounded text-white text-xs font-semibold flex items-center gap-1">
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
              <input v-model.number="cameraTarget.x" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraTarget.y" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraTarget.z" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
            </div>
          </div>

          <!-- Camera Position -->
          <div class="space-y-1">
            <label class="block text-xs text-gray-400 font-semibold">Camera Position (X, Y, Z)</label>
            <div class="flex gap-1">
              <input v-model.number="cameraPos.x" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraPos.y" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <input v-model.number="cameraPos.z" type="number" step="1" class="w-16 bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-xs" />
              <button @click="applyCameraPosition" class="px-2 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-xs font-semibold">
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
      <div v-if="!shipStore.selectedItemType" class="text-xs text-gray-500 italic">
        (None - Click to select)
      </div>
      <div v-else class="space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-xs text-gray-400">Type</div>
            <div class="text-sm text-white font-semibold capitalize">{{ shipStore.selectedItemType }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">ID</div>
            <div class="text-sm text-white font-semibold">{{ shipStore.selectedItemId }}</div>
          </div>
        </div>
        <button 
          @click="focusOnSelected"
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
        <label class="flex items-center gap-1 cursor-pointer">
          <input v-model="showNormals" type="checkbox" @change="updateNormals" class="w-3 h-3" />
          <span>Normals (Debug)</span>
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
const cameraPanelContainer = ref<HTMLDivElement | null>(null);

// Rendering state
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let animationId: number | null = null;
let raycaster: THREE.Raycaster | null = null;

// Mesh objects
let hullMesh: THREE.Mesh | null = null;
let hullOutline: THREE.LineSegments | null = null;
let hullCenter: THREE.Vector3 | null = null;
let deckMeshes: THREE.Mesh[] = [];
let deckOutlines: THREE.LineSegments[] = [];
let deckCenters: THREE.Vector3[] = [];
let roomMeshes: THREE.Mesh[] = [];
let roomOutlines: Map<THREE.Mesh, THREE.LineSegments> = new Map(); // Map room mesh to outline mesh
let roomMeshMap: Map<THREE.Mesh, any> = new Map(); // Map meshes to room data
let normalHelper: THREE.LineSegments | null = null;

// Target indicator
let targetIndicator: THREE.Mesh | null = null;

// UI state
const meshResolution = ref(2.0);
const showHull = ref(true);
const showDecks = ref(true);
const showRooms = ref(true);
const showNormals = ref(false);
const meshVertexCount = ref(0);

// Camera control state
const showCameraPanel = ref(false);
const cameraTarget = ref({ x: 0, y: 0, z: 0 });
const cameraPos = ref({ x: 0, y: 40, z: 80 });
const cameraRotation = ref({ x: 0, y: 0, z: 0 });
const animationDuration = ref(1.5);
const selectedObject = ref<any>(null);

// Watch store selection and update selectedObject
watch(
  () => [shipStore.selectedItemType, shipStore.selectedItemId],
  () => {
    if (shipStore.selectedItemType === 'room' && shipStore.selectedItemId) {
      selectedObject.value = { id: `Room ${shipStore.selectedItemId}` };
    } else if (shipStore.selectedItemType === 'hull') {
      selectedObject.value = { id: 'Hull' };
    } else if (shipStore.selectedItemType === 'deck') {
      selectedObject.value = { id: `Deck ${shipStore.selectedItemId}` };
    } else {
      selectedObject.value = null;
    }
  }
);
const currentPresetView = ref<string | null>(null);

// Camera animation state
let isAnimating = false;
let animationStartTime = 0;
let animationStartPos = { x: 0, y: 0, z: 0 };
let animationStartTarget = { x: 0, y: 0, z: 0 };
let animationEndPos = { x: 0, y: 0, z: 0 };
let animationEndTarget = { x: 0, y: 0, z: 0 };
let animationStartIsometric = false;
let animationEndIsometric = false;

// Mouse interaction state
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let orbitStartX = 0;
let orbitStartY = 0;
let orbitStartPhi = 0;
let orbitStartTheta = 0;

/**
 * Handle clicks outside the camera panel to close it
 */
function onOutsideClick(event: MouseEvent) {
  // Check if cameraPanelContainer exists and if the click is outside it
  if (showCameraPanel.value && cameraPanelContainer.value) {
    const target = event.target as HTMLElement;
    
    // Check if click is on the toggle button or inside the panel
    const isToggleButton = (target.closest('[class*="text-gray-400"][class*="uppercase"]') || target.closest('button')?.textContent?.includes('Camera Controls'));
    const isInsidePanel = cameraPanelContainer.value.contains(target);
    
    // Close if clicked outside both the panel and toggle button
    if (!isInsidePanel && !isToggleButton) {
      showCameraPanel.value = false;
    }
  }
}

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

  // Create target indicator
  updateTargetIndicator();

  // Animation loop
  animate();

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
  
  // Add mouse and keyboard event listeners
  renderer.domElement.addEventListener("click", onCanvasClick);
  renderer.domElement.addEventListener("mousedown", onCanvasMouseDown);
  renderer.domElement.addEventListener("mousemove", onCanvasMouseMove);
  renderer.domElement.addEventListener("mouseup", onCanvasMouseUp);
  renderer.domElement.addEventListener("wheel", onCanvasWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
}

/**
 * Animation loop
 */
function animate() {
  if (!renderer || !scene || !camera) return;

  animationId = requestAnimationFrame(animate);

  // Update camera animation if active
  if (isAnimating) {
    updateCameraAnimation();
  }

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
  roomMeshMap.clear();
  deckCenters = [];

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
      
      // Calculate and store hull center from geometry positions
      const posAttr = bakedHull.geometry.getAttribute("position");
      if (posAttr) {
        const bbox = new THREE.Box3();
        const vertex = new THREE.Vector3();
        let validVertices = 0;
        for (let i = 0; i < posAttr.count; i++) {
          vertex.fromBufferAttribute(posAttr, i);
          // Skip NaN values
          if (!isNaN(vertex.x) && !isNaN(vertex.y) && !isNaN(vertex.z)) {
            bbox.expandByPoint(vertex);
            validVertices++;
          }
        }
        // Only store center if we had valid vertices
        if (validVertices > 0) {
          hullCenter = bbox.getCenter(new THREE.Vector3());
        } else {
          hullCenter = null;
        }
      }
      
      // Update normal visualization if enabled
      updateNormals();
      
      // Recalculate outlines if hull is selected
      if (shipStore.selectedItemType === 'hull') {
        updateSelectionOutlines();
      }
    } catch (error) {
      console.error("Failed to bake hull mesh:", error);
    }
  } else {
    hullMesh = null;
    hullCenter = null;
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
        
        // Calculate and store deck center from geometry positions
        const posAttr = geometry.getAttribute("position");
        if (posAttr) {
          const bbox = new THREE.Box3();
          const vertex = new THREE.Vector3();
          let validVertices = 0;
          for (let i = 0; i < posAttr.count; i++) {
            vertex.fromBufferAttribute(posAttr, i);
            // Skip NaN values
            if (!isNaN(vertex.x) && !isNaN(vertex.y) && !isNaN(vertex.z)) {
              bbox.expandByPoint(vertex);
              validVertices++;
            }
          }
          // Only store center if we had valid vertices
          if (validVertices > 0) {
            deckCenters.push(bbox.getCenter(new THREE.Vector3()));
          } else {
            deckCenters.push(new THREE.Vector3(0, 0, 0)); // Fallback to origin
          }
        } else {
          deckCenters.push(new THREE.Vector3(0, 0, 0)); // Fallback to origin
        }
      } catch (error) {
        console.warn(`Failed to create deck ${deck.deckIndex} mesh:`, error);
      }
    }
  }

  // Create room meshes
  if (showRooms.value) {
    for (const room of shipStore.derivedData.validatedRooms) {
      try {
        // Get the deck for this room to determine Y position
        const deck = shipStore.derivedData.deckFootprints.find((d) => d.deckIndex === room.deck);
        if (!deck) {
          console.warn(`Room ${room.id} references non-existent deck ${room.deck}`);
          continue;
        }

        const [width, depth] = room.shape.size;
        const geometry = createRoomMesh(room.position.x, room.position.z, width, depth, deck.yMin, deck.yMax);

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
        
        // Store room data with mesh for selection
        const roomWithDeckY = {
          ...room,
          deck_y_min: deck.yMin,
          deck_y_max: deck.yMax,
          position: {
            ...room.position,
            y: (deck.yMin + deck.yMax) / 2,
          },
        };
        roomMeshMap.set(mesh, roomWithDeckY);
      } catch (error) {
        console.warn(`Failed to create room ${room.id} mesh:`, error);
      }
    }
  }
}

/**
 * Update normal visualization
 */
function updateNormals() {
  if (!scene || !hullMesh) return;

  // Remove existing normal helper
  if (normalHelper) {
    scene.remove(normalHelper);
    normalHelper = null;
  }

  // Add new normal helper if enabled
  if (showNormals.value && hullMesh.geometry) {
    // Create normal visualization using line segments
    const geometry = hullMesh.geometry;
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");

    if (positions && normals) {
      const normalLength = 1.0; // Length of normal vectors to display
      const lines = new THREE.BufferGeometry();
      const linePositions: number[] = [];

      // For each vertex, draw a line from vertex to vertex+normal
      for (let i = 0; i < positions.count; i++) {
        const px = positions.getX(i);
        const py = positions.getY(i);
        const pz = positions.getZ(i);

        const nx = normals.getX(i);
        const ny = normals.getY(i);
        const nz = normals.getZ(i);

        // Start point
        linePositions.push(px, py, pz);
        // End point
        linePositions.push(px + nx * normalLength, py + ny * normalLength, pz + nz * normalLength);
      }

      lines.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));

      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      normalHelper = new THREE.LineSegments(lines, material);
      scene.add(normalHelper);

      console.log(`Added normal visualization for ${positions.count} vertices`);
    }
  }
}

/**
 * Create outline mesh from geometry
 */
function createOutlineMesh(geometry: THREE.BufferGeometry, color: number = 0xffff00): THREE.LineSegments {
  const outlineGeometry = new THREE.BufferGeometry();
  const positions = geometry.getAttribute("position");
  
  if (positions) {
    // Create a cleaned copy of positions, filtering out NaN values
    const posArray = positions.array as Float32Array;
    const cleanedPositions: number[] = [];
    const indexMap: Map<number, number> = new Map();
    let cleanIndex = 0;
    
    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i];
      const y = posArray[i + 1];
      const z = posArray[i + 2];
      
      // Check if vertex is valid (not NaN)
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        cleanedPositions.push(x, y, z);
        indexMap.set(i / 3, cleanIndex);
        cleanIndex++;
      }
    }
    
    outlineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cleanedPositions), 3));
  }

  const wireframeGeometry = new THREE.WireframeGeometry(outlineGeometry);
  
  // Prevent bounding sphere computation errors for geometries with potential NaN values
  wireframeGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
  
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 3,
  });

  const outline = new THREE.LineSegments(wireframeGeometry, outlineMaterial);
  return outline;
}

/**
 * Helper: create hull volume from spec
 */
function createHullVolumeFromSpec(spec: any) {
  return createHullVolume(spec.ship.hull);
}

/**
 * Update selection outlines based on store selection
 */
function updateSelectionOutlines() {
  if (!scene) return;

  // Remove all existing outlines
  hullOutline && scene.remove(hullOutline);
  hullOutline = null;
  
  deckOutlines.forEach(outline => scene!.remove(outline));
  deckOutlines = [];
  
  roomOutlines.forEach(outline => scene!.remove(outline));
  roomOutlines.clear();

  // Add outlines for selected item
  if (shipStore.selectedItemType === 'hull' && hullMesh) {
    hullOutline = createOutlineMesh(hullMesh.geometry as THREE.BufferGeometry, 0x00ff00);
    hullOutline.position.copy(hullMesh.position);
    scene.add(hullOutline);
  } else if (shipStore.selectedItemType === 'deck' && shipStore.selectedItemId) {
    // Find and highlight the selected deck
    const deckIndex = parseInt(shipStore.selectedItemId);
    deckMeshes.forEach((mesh, idx) => {
      if (idx === deckIndex) {
        const outline = createOutlineMesh(mesh.geometry as THREE.BufferGeometry, 0x00ff00);
        outline.position.copy(mesh.position);
        scene!.add(outline);
        deckOutlines.push(outline);
      }
    });
  } else if (shipStore.selectedItemType === 'room' && shipStore.selectedItemId) {
    // Find and highlight the selected room
    roomMeshes.forEach((mesh) => {
      const room = roomMeshMap.get(mesh);
      if (room && room.id === shipStore.selectedItemId) {
        const outline = createOutlineMesh(mesh.geometry as THREE.BufferGeometry, 0x00ff00);
        outline.position.copy(mesh.position);
        scene!.add(outline);
        roomOutlines.set(mesh, outline);
      }
    });
  }
}

/**
 * Create or update target indicator sphere
 */
function updateTargetIndicator() {
  if (!scene) return;

  // Remove existing indicator
  if (targetIndicator) {
    scene.remove(targetIndicator);
    targetIndicator.geometry.dispose();
    (targetIndicator.material as THREE.Material).dispose();
    targetIndicator = null;
  }

  // Create new indicator
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff6b6b, wireframe: true });
  targetIndicator = new THREE.Mesh(geometry, material);
  targetIndicator.position.set(cameraTarget.value.x, cameraTarget.value.y, cameraTarget.value.z);
  scene.add(targetIndicator);
}

/**
 * Animate camera to target position and look-at point
 */
function animateCameraTo(newPos: any, newTarget: any) {
  if (!camera) return;

  isAnimating = true;
  animationStartTime = Date.now();
  animationStartPos = { ...cameraPos.value };
  animationStartTarget = { ...cameraTarget.value };
  animationEndPos = newPos;
  animationEndTarget = newTarget;
}

/**
 * Update camera animation
 */
function updateCameraAnimation() {
  if (!isAnimating || !camera) return;

  const elapsed = (Date.now() - animationStartTime) / 1000;
  const progress = Math.min(elapsed / animationDuration.value, 1);

  // Easing function (ease-in-out)
  const t = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

  cameraPos.value.x = animationStartPos.x + (animationEndPos.x - animationStartPos.x) * t;
  cameraPos.value.y = animationStartPos.y + (animationEndPos.y - animationStartPos.y) * t;
  cameraPos.value.z = animationStartPos.z + (animationEndPos.z - animationStartPos.z) * t;

  cameraTarget.value.x = animationStartTarget.x + (animationEndTarget.x - animationStartTarget.x) * t;
  cameraTarget.value.y = animationStartTarget.y + (animationEndTarget.y - animationStartTarget.y) * t;
  cameraTarget.value.z = animationStartTarget.z + (animationEndTarget.z - animationStartTarget.z) * t;

  camera.position.set(cameraPos.value.x, cameraPos.value.y, cameraPos.value.z);
  camera.lookAt(cameraTarget.value.x, cameraTarget.value.y, cameraTarget.value.z);
  updateTargetIndicator();

  if (progress >= 1) {
    isAnimating = false;
  }
}

/**
 * Set preset view
 */
function setPresetView(view: string) {
  const distance = 100;
  const viewConfigs: Record<string, any> = {
    top: { pos: { x: 0, y: distance, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    bottom: { pos: { x: 0, y: -distance, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    front: { pos: { x: 0, y: 0, z: distance }, target: { x: 0, y: 0, z: 0 } },
    back: { pos: { x: 0, y: 0, z: -distance }, target: { x: 0, y: 0, z: 0 } },
    right: { pos: { x: distance, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    left: { pos: { x: -distance, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    isometric: { pos: { x: 70, y: 70, z: 70 }, target: { x: 0, y: 0, z: 0 } },
  };

  const config = viewConfigs[view];
  if (config) {
    currentPresetView.value = view;
    // Always animate camera to position for preset views (isometric is just a position, not a projection mode)
    animateCameraTo(config.pos, config.target);
  }
}


/**
 * Reset view to default
 */
function resetView() {
  if (shipStore.selectedItemType) {
    focusOnSelected();
  } else {
    setPresetView("top");
  }
}

/**
 * Focus on selected object
 */
function focusOnSelected() {
  const distance = 30;
  let center = { x: 0, y: 0, z: 0 };

  // Determine which object is selected and get its center
  if (shipStore.selectedItemType === 'room' && selectedObject.value) {
    // For rooms, use stored center
    center = {
      x: selectedObject.value.position.x,
      y: (selectedObject.value.deck_y_min + selectedObject.value.deck_y_max) / 2 || 0,
      z: selectedObject.value.position.z,
    };
  } else if (shipStore.selectedItemType === 'hull' && hullCenter) {
    // For hull, use calculated center
    center = {
      x: hullCenter.x,
      y: hullCenter.y,
      z: hullCenter.z,
    };
  } else if (shipStore.selectedItemType === 'deck' && shipStore.selectedItemId) {
    // For decks, use calculated center
    const deckIndex = parseInt(shipStore.selectedItemId);
    if (deckCenters[deckIndex]) {
      const deckCenter = deckCenters[deckIndex];
      center = {
        x: deckCenter.x,
        y: deckCenter.y,
        z: deckCenter.z,
      };
    }
  } else {
    return;
  }

  let newPos = {
    x: center.x + distance * 0.7,
    y: center.y + distance * 0.7,
    z: center.z + distance * 0.7,
  };

  // If we have a preset view, maintain its orientation but focus on the object
  if (currentPresetView.value) {
    const distance = 100;
    const viewDirections: Record<string, any> = {
      top: { x: 0, y: 1, z: 0 },
      bottom: { x: 0, y: -1, z: 0 },
      front: { x: 0, y: 0, z: 1 },
      back: { x: 0, y: 0, z: -1 },
      right: { x: 1, y: 0, z: 0 },
      left: { x: -1, y: 0, z: 0 },
      isometric: { x: 0.707, y: 0.707, z: 0.707 },
    };

    const direction = viewDirections[currentPresetView.value];
    if (direction) {
      newPos = {
        x: center.x + direction.x * distance,
        y: center.y + direction.y * distance,
        z: center.z + direction.z * distance,
      };
    }
  }

  // Look at object center
  const newTarget = center;

  animateCameraTo(newPos, newTarget);
}

/**
 * Apply camera position
 */
function applyCameraPosition() {
  animateCameraTo(cameraPos.value, cameraTarget.value);
}

/**
 * Apply camera rotation (convert Euler angles to position around target)
 */
function applyCameraRotation() {
  if (!camera) return;

  // Convert Euler angles to direction vector
  const euler = new THREE.Euler(
    (cameraRotation.value.x * Math.PI) / 180,
    (cameraRotation.value.y * Math.PI) / 180,
    (cameraRotation.value.z * Math.PI) / 180,
    'YXZ'
  );

  const direction = new THREE.Vector3(0, 0, 1);
  direction.applyEuler(euler);

  // Calculate new position based on distance from target
  const distance = Math.sqrt(
    Math.pow(cameraPos.value.x - cameraTarget.value.x, 2) +
    Math.pow(cameraPos.value.y - cameraTarget.value.y, 2) +
    Math.pow(cameraPos.value.z - cameraTarget.value.z, 2)
  );

  const newPos = {
    x: cameraTarget.value.x + direction.x * distance,
    y: cameraTarget.value.y + direction.y * distance,
    z: cameraTarget.value.z + direction.z * distance,
  };

  animateCameraTo(newPos, cameraTarget.value);
}

/**
 * Handle canvas click for object selection
 */
function onCanvasClick(event: MouseEvent) {
  if (!camera || !renderer || !scene) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  if (!raycaster) {
    raycaster = new THREE.Raycaster();
  }

  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

  // Collect all possible objects in raycaster, respecting visibility
  const allObjects: THREE.Object3D[] = [];
  if (hullMesh && showHull.value) allObjects.push(hullMesh);
  if (showDecks.value) allObjects.push(...deckMeshes);
  if (showRooms.value) allObjects.push(...roomMeshes);

  // Get intersections sorted by distance
  const intersects = raycaster.intersectObjects(allObjects);

  if (intersects.length > 0) {
    const hitObject = intersects[0].object as THREE.Mesh;

    // Determine what was hit
    if (roomMeshes.includes(hitObject)) {
      // Room was hit
      const room = roomMeshMap.get(hitObject);
      if (room) {
        selectedObject.value = room;
        shipStore.selectItem('room', room.id);
        focusOnSelected();
        updateSelectionOutlines();
        return;
      }
    } else if (deckMeshes.includes(hitObject)) {
      // Deck was hit
      const deckIndex = deckMeshes.indexOf(hitObject);
      if (deckIndex >= 0) {
        shipStore.selectItem('deck', deckIndex.toString());
        focusOnSelected();
        updateSelectionOutlines();
        return;
      }
    } else if (hitObject === hullMesh) {
      // Hull was hit
      shipStore.selectItem('hull');
      focusOnSelected();
      updateSelectionOutlines();
      return;
    }
  }

  // Deselect if nothing clicked
  selectedObject.value = null;
  shipStore.clearSelection();
  updateSelectionOutlines();
}

/**
 * Handle canvas mouse down for orbit/pan
 */
function onCanvasMouseDown(event: MouseEvent) {
  mouseDown = true;
  mouseX = event.clientX;
  mouseY = event.clientY;

  if (event.button === 1) {
    // Middle mouse button - orbit or pan
    orbitStartX = mouseX;
    orbitStartY = mouseY;

    // Calculate initial spherical coordinates
    const dx = cameraPos.value.x - cameraTarget.value.x;
    const dy = cameraPos.value.y - cameraTarget.value.y;
    const dz = cameraPos.value.z - cameraTarget.value.z;

    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    orbitStartTheta = Math.atan2(dx, dz);
    orbitStartPhi = Math.acos(dy / r);
  }
}

/**
 * Handle canvas mouse move for orbit/pan
 */
function onCanvasMouseMove(event: MouseEvent) {
  if (!mouseDown || !camera) return;

  const deltaX = event.clientX - mouseX;
  const deltaY = event.clientY - mouseY;

  if (event.button === 1 || (mouseDown && event.buttons === 4)) {
    // Middle mouse button - orbit or pan
    const shiftKey = event.shiftKey;

    if (shiftKey) {
      // Shift + middle mouse - pan
      // Panning does NOT change preset view
      
      const distance = Math.sqrt(
        Math.pow(cameraPos.value.x - cameraTarget.value.x, 2) +
        Math.pow(cameraPos.value.y - cameraTarget.value.y, 2) +
        Math.pow(cameraPos.value.z - cameraTarget.value.z, 2)
      );

      // Get camera right and up vectors from camera's view matrix
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      
      camera.getWorldDirection(new THREE.Vector3()); // Ensure matrixWorldInverse is updated
      right.set(camera.matrixWorldInverse.elements[0], camera.matrixWorldInverse.elements[4], camera.matrixWorldInverse.elements[8]).normalize();
      up.set(camera.matrixWorldInverse.elements[1], camera.matrixWorldInverse.elements[5], camera.matrixWorldInverse.elements[9]).normalize();

      const panSpeed = distance / 500;
      const panX = -deltaX * panSpeed;
      const panY = deltaY * panSpeed;

      cameraPos.value.x += right.x * panX + up.x * panY;
      cameraPos.value.y += right.y * panX + up.y * panY;
      cameraPos.value.z += right.z * panX + up.z * panY;

      cameraTarget.value.x += right.x * panX + up.x * panY;
      cameraTarget.value.y += right.y * panX + up.y * panY;
      cameraTarget.value.z += right.z * panX + up.z * panY;
    } else {
      // Middle mouse - orbit
      // Orbiting CLEARS preset view
      currentPresetView.value = null;
      
      const dx = cameraPos.value.x - cameraTarget.value.x;
      const dy = cameraPos.value.y - cameraTarget.value.y;
      const dz = cameraPos.value.z - cameraTarget.value.z;

      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const orbitSpeed = 0.01;

      // Use delta from orbit start position
      const deltaFromStart = {
        x: event.clientX - orbitStartX,
        y: event.clientY - orbitStartY,
      };

      let theta = orbitStartTheta - deltaFromStart.x * orbitSpeed;
      let phi = orbitStartPhi - deltaFromStart.y * orbitSpeed;

      // Clamp phi to avoid gimbal lock
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

      cameraPos.value.x = cameraTarget.value.x + r * Math.sin(phi) * Math.sin(theta);
      cameraPos.value.y = cameraTarget.value.y + r * Math.cos(phi);
      cameraPos.value.z = cameraTarget.value.z + r * Math.sin(phi) * Math.cos(theta);
    }

    camera.position.set(cameraPos.value.x, cameraPos.value.y, cameraPos.value.z);
    camera.lookAt(cameraTarget.value.x, cameraTarget.value.y, cameraTarget.value.z);
    updateTargetIndicator();
  }

  mouseX = event.clientX;
  mouseY = event.clientY;
}

/**
 * Handle canvas mouse up
 */
function onCanvasMouseUp() {
  mouseDown = false;
}

/**
 * Handle canvas wheel for zoom
 */
function onCanvasWheel(event: WheelEvent) {
  if (!camera) return;

  event.preventDefault();

  // Zoom by moving camera closer/farther
  const direction = new THREE.Vector3(
    cameraPos.value.x - cameraTarget.value.x,
    cameraPos.value.y - cameraTarget.value.y,
    cameraPos.value.z - cameraTarget.value.z
  );

  const distance = direction.length();
  const zoomSpeed = 0.1;
  const newDistance = event.deltaY > 0 ? distance * (1 + zoomSpeed) : distance * (1 - zoomSpeed);

  const ratio = newDistance / distance;
  cameraPos.value.x = cameraTarget.value.x + direction.x * ratio;
  cameraPos.value.y = cameraTarget.value.y + direction.y * ratio;
  cameraPos.value.z = cameraTarget.value.z + direction.z * ratio;

  camera.position.set(cameraPos.value.x, cameraPos.value.y, cameraPos.value.z);
  
  updateTargetIndicator();
}

/**
 * Handle keyboard shortcuts
 */
function onKeyDown(event: KeyboardEvent) {
  if (event.key.toLowerCase() === 'f') {
    event.preventDefault();
    focusOnSelected();
  }
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

/**
 * Watch for selection changes to update outlines
 */
watch(
  () => [shipStore.selectedItemType, shipStore.selectedItemId],
  () => {
    updateSelectionOutlines();
  }
);

/**
 * Watch for visibility changes to deselect hidden items
 */
watch(
  () => showHull.value,
  (visible) => {
    if (!visible && shipStore.selectedItemType === 'hull') {
      shipStore.clearSelection();
      updateSelectionOutlines();
    }
  }
);

watch(
  () => showDecks.value,
  (visible) => {
    if (!visible && shipStore.selectedItemType === 'deck') {
      shipStore.clearSelection();
      updateSelectionOutlines();
    }
  }
);

watch(
  () => showRooms.value,
  (visible) => {
    if (!visible && shipStore.selectedItemType === 'room') {
      shipStore.clearSelection();
      updateSelectionOutlines();
    }
  }
);

onMounted(() => {
  // Initialize camera state
  cameraPos.value = { x: 0, y: 40, z: 80 };
  cameraTarget.value = { x: 0, y: 0, z: 0 };
  
  initializeScene();
  updateMesh();
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
  
  if (renderer) {
    renderer.domElement.removeEventListener("click", onCanvasClick);
    renderer.domElement.removeEventListener("mousedown", onCanvasMouseDown);
    renderer.domElement.removeEventListener("mousemove", onCanvasMouseMove);
    renderer.domElement.removeEventListener("mouseup", onCanvasMouseUp);
    renderer.domElement.removeEventListener("wheel", onCanvasWheel);
  }
  window.removeEventListener("keydown", onKeyDown);

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

