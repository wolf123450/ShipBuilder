<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold mb-4">Room Placement</h2>
      <p class="text-gray-400 text-sm mb-4">
        Define the functional spaces inside your ship. Rooms are placed on decks and contribute to the ship's purpose. Drag rooms to place them on the deck. The view shows a top-down perspective of the selected deck.
      </p>
    </div>

    <!-- Deck selector -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4">
      <label class="block text-gray-400 text-sm mb-2">Select Deck</label>
      <select
        v-model.number="selectedDeckIndex"
        class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
      >
        <option v-for="(deck, idx) in deckList" :key="idx" :value="deck.deckIndex">
          Deck {{ deck.deckIndex }} (Y: {{ deck.floorY.toFixed(1) }}m - {{ deck.ceilY.toFixed(1) }}m)
        </option>
      </select>
    </div>

    <!-- 2D Canvas Container -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="text-sm text-gray-400">
          <span v-if="currentDeck"
            >Footprint Area: {{ currentDeck.polygonBounds.area.toFixed(1) }}m²</span
          >
        </div>
        <div class="flex gap-2 overflow-visible">
          <Tooltip text="Center view on entire deck">
            <button
              @click="resetZoom"
              class="px-3 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-xs font-semibold cursor-help"
            >
              Fit View
            </button>
          </Tooltip>
          <Tooltip text="Show/hide alignment grid">
            <button
              @click="toggleGrid"
              class="px-3 py-1"
              :class="showGrid ? 'bg-ship-accent' : 'bg-ship-slate'"
            >
              {{ showGrid ? "Grid: On" : "Grid: Off" }}
            </button>
          </Tooltip>
        </div>
      </div>

      <!-- Canvas -->
      <canvas
        ref="canvas"
        class="w-full border border-ship-slate rounded bg-black cursor-crosshair"
        :width="canvasWidth"
        :height="canvasHeight"
        @mousemove="onCanvasMouseMove"
        @mousedown="onCanvasMouseDown"
        @mouseup="onCanvasMouseUp"
        @mouseleave="onCanvasMouseLeave"
        @wheel.prevent="onCanvasWheel"
      />

      <!-- Coordinate display -->
      <div class="mt-2 text-xs text-gray-400 space-y-1">
        <span v-if="mouseWorldPos">
          Position: X={{ mouseWorldPos.x.toFixed(1) }}m, Z={{ mouseWorldPos.z.toFixed(1) }}m
        </span>
        <span v-if="currentDeck" class="block">
          Viewport: ({{ viewportX.toFixed(1) }}, {{ viewportY.toFixed(1) }}) | Zoom: {{ zoom.toFixed(2) }}x
        </span>
      </div>
    </div>

    <!-- Room list for selected deck -->
    <div v-if="currentDeck" class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-lg">Rooms on Deck {{ selectedDeckIndex }}</h3>
        <button
          @click="showRoomForm = !showRoomForm"
          class="px-3 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-sm font-semibold"
        >
          + Add Room
        </button>
      </div>

      <!-- Room list -->
      <div v-if="roomsOnDeck.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="room in roomsOnDeck"
          :key="room.id"
          class="bg-ship-navy rounded p-3 border-l-4 cursor-pointer hover:bg-opacity-75"
          :style="{ borderColor: getRoomColor(room.type), backgroundColor: getRoomColor(room.type) + '20' }"
          @click="selectRoom(room.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <strong class="block text-white">{{ room.id }}</strong>
              <span class="text-xs text-gray-400 capitalize">{{ room.type }}</span>
            </div>
            <div class="flex gap-1">
              <button
                @click.stop="openEditRoom(room.id)"
                class="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                title="Edit room"
              >
                Edit
              </button>
              <button
                @click.stop="duplicateRoom(room.id)"
                class="text-green-400 hover:text-green-300 text-xs font-semibold"
                title="Duplicate room"
              >
                Copy
              </button>
              <button
                @click.stop="deleteRoom(room.id)"
                class="text-red-400 hover:text-red-300 text-xs font-semibold"
                title="Delete room"
              >
                Delete
              </button>
            </div>
          </div>
          <div class="text-xs text-gray-300 space-y-1 mt-2">
            <div>Pos: ({{ room.position.x.toFixed(1) }}, {{ room.position.z.toFixed(1) }})</div>
            <div>Size: {{ room.shape.size[0] }}m × {{ room.shape.size[1] }}m</div>
            <div v-if="room.rotationDeg !== 0">Rotation: {{ room.rotationDeg }}°</div>
          </div>
        </div>
      </div>

      <div v-else class="text-gray-400 text-sm py-4 text-center">
        No rooms on this deck. Add one or drag a room from another deck.
      </div>
    </div>

    <!-- Add room form -->
    <div v-if="showRoomForm && currentDeck" class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4 overflow-visible">
      <h3 class="font-semibold text-lg">New Room on Deck {{ selectedDeckIndex }}</h3>

      <div class="grid grid-cols-2 gap-4 overflow-visible">
        <div>
          <Tooltip text="Unique identifier for this room (e.g., cargo_1, bridge_main)">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Room ID</label>
          </Tooltip>
          <input
            v-model="newRoom.id"
            type="text"
            placeholder="e.g., cargo_1"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <Tooltip text="What purpose this room serves (affects color in 3D view)">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Type</label>
          </Tooltip>
          <select
            v-model="newRoom.type"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          >
            <option value="command">Command</option>
            <option value="corridor">Corridor</option>
            <option value="crew">Crew</option>
            <option value="cargo">Cargo</option>
            <option value="engineering">Engineering</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 overflow-visible">
        <div class="overflow-visible">
          <Tooltip text="X-axis dimension (port-to-starboard)">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Width (m)</label>
          </Tooltip>
          <input
            v-model.number="newRoom.width"
            type="number"
            min="1"
            step="0.5"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div class="overflow-visible">
          <Tooltip text="Z-axis dimension (bow-to-stern)">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Depth (m)</label>
          </Tooltip>
          <input
            v-model.number="newRoom.depth"
            type="number"
            min="1"
            step="0.5"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div class="overflow-visible">
          <Tooltip text="Rotate room to orient interior layout (0-360 degrees)">
            <label class="block text-gray-400 text-sm mb-2 cursor-help">Rotation (°)</label>
          </Tooltip>
          <input
            v-model.number="newRoom.rotation"
            type="number"
            min="0"
            max="360"
            step="15"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      <div>
        <label class="block text-gray-400 text-sm mb-2">Position (click on canvas to set)</label>
        <div class="grid grid-cols-2 gap-4 overflow-visible">
          <div>
            <label class="text-xs text-gray-500">X</label>
            <input
              v-model.number="newRoom.posX"
              type="number"
              step="0.5"
              class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500">Z</label>
            <input
              v-model.number="newRoom.posZ"
              type="number"
              step="0.5"
              class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="addRoomToCurrentDeck"
          class="flex-1 px-4 py-2 bg-ship-accent hover:bg-blue-600 rounded text-white font-semibold"
        >
          Add Room
        </button>
        <button
          @click="showRoomForm = false"
          class="flex-1 px-4 py-2 bg-ship-slate hover:bg-opacity-75 rounded text-white font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Edit room modal -->
    <div v-if="showEditModal && editingRoomId" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-ship-dark border border-ship-slate rounded p-6 max-w-md w-full mx-4 space-y-4">
        <h3 class="font-semibold text-lg text-white">Edit Room</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-400 text-sm mb-2">Room ID</label>
            <input
              v-model="editRoom.id"
              type="text"
              class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label class="block text-gray-400 text-sm mb-2">Type</label>
            <select
              v-model="editRoom.type"
              class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
            >
              <option value="command">Command</option>
              <option value="corridor">Corridor</option>
              <option value="crew">Crew</option>
              <option value="cargo">Cargo</option>
              <option value="engineering">Engineering</option>
            </select>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-gray-400 text-xs mb-1">Width (m)</label>
              <input
                v-model.number="editRoom.width"
                type="number"
                min="1"
                step="0.5"
                class="w-full bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
            </div>
            <div>
              <label class="block text-gray-400 text-xs mb-1">Depth (m)</label>
              <input
                v-model.number="editRoom.depth"
                type="number"
                min="1"
                step="0.5"
                class="w-full bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
            </div>
            <div>
              <label class="block text-gray-400 text-xs mb-1">Rotation (°)</label>
              <input
                v-model.number="editRoom.rotation"
                type="number"
                min="0"
                max="360"
                step="15"
                class="w-full bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-400 text-xs mb-1">X Position (m)</label>
              <input
                v-model.number="editRoom.posX"
                type="number"
                step="0.5"
                class="w-full bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
            </div>
            <div>
              <label class="block text-gray-400 text-xs mb-1">Z Position (m)</label>
              <input
                v-model.number="editRoom.posZ"
                type="number"
                step="0.5"
                class="w-full bg-ship-navy border border-ship-slate rounded px-2 py-1 text-white text-sm"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-4">
          <button
            @click="saveEditRoom"
            class="flex-1 px-4 py-2 bg-ship-accent hover:bg-blue-600 rounded text-white font-semibold"
          >
            Save
          </button>
          <button
            @click="showEditModal = false"
            class="flex-1 px-4 py-2 bg-ship-slate hover:bg-opacity-75 rounded text-white font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete confirmation dialog -->
  <ConfirmDialog
    v-if="showDeleteConfirm"
    title="Delete Room?"
    message="Are you sure you want to delete this room? This action cannot be undone."
    confirmText="Delete"
    cancelText="Cancel"
    isDangerous
    @confirm="confirmDeleteRoom"
    @cancel="cancelDeleteRoom"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useShipStore } from "@/stores/shipStore";
import { RoomType, RoomShapeType } from "@core/index";
import ConfirmDialog from "../ConfirmDialog.vue";
import Tooltip from "../Tooltip.vue";

// ============================================================================
// STATE
// ============================================================================

const shipStore = useShipStore();
const canvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(800);
const canvasHeight = ref(600);

const selectedDeckIndex = ref(0);
const selectedRoomId = ref<string | null>(null);
const showRoomForm = ref(false);
const showGrid = ref(true);

// Viewport state (pan/zoom)
const viewportX = ref(0);
const viewportY = ref(0);
const zoom = ref(1.0);

// Mouse interaction state
const isDragging = ref(false);
const draggedRoomId = ref<string | null>(null);
const dragOffsetX = ref(0);
const dragOffsetZ = ref(0);
const mouseWorldPos = ref<{ x: number; z: number } | null>(null);

// Panning state
const isPanning = ref(false);
const panStartX = ref(0);
const panStartY = ref(0);
const panStartViewportX = ref(0);
const panStartViewportY = ref(0);

// Edit room modal
const editingRoomId = ref<string | null>(null);
const showEditModal = ref(false);
const editRoom = ref({
  id: "",
  type: "crew",
  width: 6,
  depth: 6,
  rotation: 0,
  posX: 0,
  posZ: 0,
});

// Delete confirmation
const showDeleteConfirm = ref(false);
const roomToDelete = ref<string | null>(null);

// New room form
const newRoom = ref({
  id: "",
  type: "crew",
  width: 6,
  depth: 6,
  rotation: 0,
  posX: 0,
  posZ: 0,
});

// ============================================================================
// COMPUTED
// ============================================================================

const deckList = computed(() => {
  if (!shipStore.derivedData?.deckFootprints) return [];
  return shipStore.derivedData.deckFootprints;
});

const currentDeck = computed(() => {
  return deckList.value.find((d) => d.deckIndex === selectedDeckIndex.value);
});

// Auto-fit view when deck changes (but not while dragging)
watch(currentDeck, () => {
  // Don't reset zoom while dragging
  if (isDragging.value) return;
  
  // Defer fitView until next frame so canvas is ready
  requestAnimationFrame(() => {
    resetZoom();
  });
});

const roomsOnDeck = computed(() => {
  if (!shipStore.shipSpec.ship.rooms) return [];
  return shipStore.shipSpec.ship.rooms.filter((r) => r.deck === selectedDeckIndex.value);
});

// ============================================================================
// METHODS
// ============================================================================

/**
 * Convert mouse event coordinates to canvas backing-store pixel space
 * Accounts for CSS scaling and devicePixelRatio differences
 */
function eventToCanvasPixels(event: MouseEvent, canvasEl: HTMLCanvasElement) {
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = canvasEl.width / rect.width;
  const scaleY = canvasEl.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

/**
 * Convert world coordinates to canvas coordinates
 */
function worldToCanvas(worldX: number, worldZ: number): { x: number; y: number } {
  const canvasX = (worldX - viewportX.value) * zoom.value + canvasWidth.value / 2;
  const canvasY = (worldZ - viewportY.value) * zoom.value + canvasHeight.value / 2;
  return { x: canvasX, y: canvasY };
}

/**
 * Convert canvas coordinates to world coordinates
 */
function canvasToWorld(canvasX: number, canvasY: number): { x: number; z: number } {
  const worldX = (canvasX - canvasWidth.value / 2) / zoom.value + viewportX.value;
  const worldZ = (canvasY - canvasHeight.value / 2) / zoom.value + viewportY.value;
  return { x: worldX, z: worldZ };
}

/**
 * Draw the 2D deck view
 */
function drawCanvas() {
  const ctx = canvas.value?.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

  // Draw grid
  if (showGrid.value) {
    drawGrid(ctx);
  }

  // Draw deck footprint if available
  if (currentDeck.value) {
    drawDeckFootprint(ctx);
  }

  // Draw rooms
  for (const room of roomsOnDeck.value) {
    drawRoom(ctx, room, room.id === selectedRoomId.value);
  }

  // Draw coordinate axes
  drawAxes(ctx);
}

/**
 * Draw the grid
 */
function drawGrid(ctx: CanvasRenderingContext2D) {
  const gridSpacing = 5; // 5m grid
  const canvasPos = worldToCanvas(0, 0);

  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;

  // Vertical lines (X axis)
  for (let x = -100; x <= 100; x += gridSpacing) {
    const pos = worldToCanvas(x, 0);
    ctx.beginPath();
    ctx.moveTo(pos.x, 0);
    ctx.lineTo(pos.x, canvasHeight.value);
    ctx.stroke();
  }

  // Horizontal lines (Z axis)
  for (let z = -100; z <= 100; z += gridSpacing) {
    const pos = worldToCanvas(0, z);
    ctx.beginPath();
    ctx.moveTo(0, pos.y);
    ctx.lineTo(canvasWidth.value, pos.y);
    ctx.stroke();
  }
}

/**
 * Draw deck footprint polygon
 */
function drawDeckFootprint(ctx: CanvasRenderingContext2D) {
  if (!currentDeck.value) return;

  const polygon = currentDeck.value.polygon;
  if (polygon.length === 0) return;

  // Draw boundary
  ctx.strokeStyle = "#4a9eff";
  ctx.lineWidth = 2;
  ctx.beginPath();

  const firstPos = worldToCanvas(polygon[0].x, polygon[0].z);
  ctx.moveTo(firstPos.x, firstPos.y);

  for (let i = 1; i < polygon.length; i++) {
    const pos = worldToCanvas(polygon[i].x, polygon[i].z);
    ctx.lineTo(pos.x, pos.y);
  }

  ctx.closePath();
  ctx.stroke();

  // Draw fill
  ctx.fillStyle = "#1a3a52";
  ctx.fill();
}

/**
 * Draw a room
 */
function drawRoom(ctx: CanvasRenderingContext2D, room: any, isSelected: boolean) {
  const [width, depth] = room.shape.size;
  const { x, z } = room.position;

  // Check for collisions with other rooms on this deck
  let hasOverlap = false;
  let isOutside = false;

  for (const otherRoom of roomsOnDeck.value) {
    if (otherRoom.id !== room.id && doRoomsOverlap(room, otherRoom)) {
      hasOverlap = true;
      break;
    }
  }

  if (currentDeck.value) {
    isOutside = isRoomOutsideFootprint(room, currentDeck.value);
  }

  // Get room color based on type
  let color = getRoomColor(room.type);

  // Get room color based on type
  const baseColor = getRoomColor(room.type);

  // Calculate corners (before rotation)
  const halfW = width / 2;
  const halfD = depth / 2;
  const corners = [
    { x: x - halfW, z: z - halfD },
    { x: x + halfW, z: z - halfD },
    { x: x + halfW, z: z + halfD },
    { x: x - halfW, z: z + halfD },
  ];

  // Apply rotation if needed
  const rotRad = (room.rotationDeg * Math.PI) / 180;
  if (room.rotationDeg !== 0) {
    for (const corner of corners) {
      const dx = corner.x - x;
      const dz = corner.z - z;
      corner.x = x + dx * Math.cos(rotRad) - dz * Math.sin(rotRad);
      corner.z = z + dx * Math.sin(rotRad) + dz * Math.cos(rotRad);
    }
  }

  // Convert to canvas coords and draw
  const fillColor = hasOverlap ? "#ff4444" : isOutside ? "#ff8800" : baseColor;
  ctx.fillStyle = isSelected ? fillColor + "cc" : fillColor + "88";
  ctx.strokeStyle = isSelected
    ? "#ffffff"
    : hasOverlap
      ? "#ff0000"
      : isOutside
        ? "#ff8800"
        : fillColor;
  ctx.lineWidth = isSelected ? 3 : hasOverlap || isOutside ? 2.5 : 2;

  ctx.beginPath();
  const first = worldToCanvas(corners[0].x, corners[0].z);
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < corners.length; i++) {
    const pos = worldToCanvas(corners[i].x, corners[i].z);
    ctx.lineTo(pos.x, pos.y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw room ID label
  const centerPos = worldToCanvas(x, z);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(room.id, centerPos.x, centerPos.y);

  // Draw collision indicator
  if (hasOverlap) {
    ctx.fillStyle = "#ff0000";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("✕", centerPos.x + 20, centerPos.y - 15);
  }

  if (isOutside) {
    ctx.fillStyle = "#ff8800";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("!", centerPos.x - 20, centerPos.y - 15);
  }
}

/**
 * Draw origin axes
 */
function drawAxes(ctx: CanvasRenderingContext2D) {
  const origin = worldToCanvas(0, 0);
  const axisLength = 50;

  // X axis (red)
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(origin.x + axisLength, origin.y);
  ctx.stroke();

  // Z axis (blue)
  ctx.strokeStyle = "#0000ff";
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(origin.x, origin.y + axisLength);
  ctx.stroke();

  // Labels
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px sans-serif";
  ctx.fillText("X", origin.x + axisLength + 10, origin.y);
  ctx.fillText("Z", origin.x, origin.y + axisLength + 10);
}

/**
 * Get room color based on type
 */
function getRoomColor(type: string): string {
  const colors: Record<string, string> = {
    command: "#FFD700",
    crew: "#4169E1",
    cargo: "#DC143C",
    engineering: "#FF8C00",
    corridor: "#808080",
  };
  return colors[type] || "#999999";
}

/**
 * Mouse move - update world position, handle dragging and panning
 */
function onCanvasMouseMove(event: MouseEvent) {
  if (!canvas.value) return;

  const { x: canvasX, y: canvasY } = eventToCanvasPixels(event, canvas.value);

  // Update world position display
  const worldPos = canvasToWorld(canvasX, canvasY);
  mouseWorldPos.value = worldPos;

  // Handle panning
  if (isPanning.value) {
    const deltaX = canvasX - panStartX.value;
    const deltaY = canvasY - panStartY.value;

    viewportX.value = panStartViewportX.value - deltaX / zoom.value;
    viewportY.value = panStartViewportY.value - deltaY / zoom.value;

    drawCanvas();
    return;
  }

  // Handle dragging
  if (isDragging.value && draggedRoomId.value) {
    const draggedRoom = roomsOnDeck.value.find((r) => r.id === draggedRoomId.value);
    if (!draggedRoom) return;

    const newX = worldPos.x + dragOffsetX.value;
    const newZ = worldPos.z + dragOffsetZ.value;

    shipStore.updateRoom(draggedRoomId.value, {
      position: { x: newX, z: newZ },
    });

    drawCanvas();
  }
}

/**
 * Mouse down - start dragging, panning, or update position form
 */
function onCanvasMouseDown(event: MouseEvent) {
  if (!canvas.value) return;

  const { x: canvasX, y: canvasY } = eventToCanvasPixels(event, canvas.value);
  const worldPos = canvasToWorld(canvasX, canvasY);

  // Check if clicking on a room
  const clickedRoom = roomsOnDeck.value.find((room) => {
    const corners = getRoomCorners(room);
    return isPointInPolygon(worldPos, corners);
  });

  if (clickedRoom) {
    isDragging.value = true;
    draggedRoomId.value = clickedRoom.id;
    dragOffsetX.value = clickedRoom.position.x - worldPos.x;
    dragOffsetZ.value = clickedRoom.position.z - worldPos.z;
    selectRoom(clickedRoom.id);
  } else if (showRoomForm.value) {
    // Update form position if adding a new room
    newRoom.value.posX = worldPos.x;
    newRoom.value.posZ = worldPos.z;
  } else {
    // Start panning if not adding a room
    isPanning.value = true;
    panStartX.value = canvasX;
    panStartY.value = canvasY;
    panStartViewportX.value = viewportX.value;
    panStartViewportY.value = viewportY.value;
  }
}

/**
 * Mouse up - stop dragging and panning
 */
function onCanvasMouseUp() {
  isDragging.value = false;
  draggedRoomId.value = null;
  isPanning.value = false;
}

/**
 * Mouse leave - stop dragging and panning
 */
function onCanvasMouseLeave() {
  isDragging.value = false;
  draggedRoomId.value = null;
  isPanning.value = false;
}

/**
 * Mouse wheel - zoom
 */
function onCanvasWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  zoom.value *= delta;
  zoom.value = Math.max(0.1, Math.min(10, zoom.value));
  drawCanvas();
}

/**
 * Check if two rooms (represented as rotated rectangles) overlap
 */
function doRoomsOverlap(room1: any, room2: any): boolean {
  // Get corners for room1
  const corners1 = getRoomCorners(room1);
  const corners2 = getRoomCorners(room2);

  // Use SAT (Separating Axis Theorem) for rotated rectangle collision
  // Check projections on both X and Z axes
  return satCollision(corners1, corners2);
}

/**
 * Get the four corners of a room in world coordinates
 */
function getRoomCorners(room: any): Array<{ x: number; z: number }> {
  const [width, depth] = room.shape.size;
  const { x, z } = room.position;
  const rotRad = (room.rotationDeg * Math.PI) / 180;

  const halfW = width / 2;
  const halfD = depth / 2;

  const corners = [
    { x: -halfW, z: -halfD },
    { x: halfW, z: -halfD },
    { x: halfW, z: halfD },
    { x: -halfW, z: halfD },
  ];

  // Rotate and translate
  const rotated = corners.map((c) => ({
    x: x + c.x * Math.cos(rotRad) - c.z * Math.sin(rotRad),
    z: z + c.x * Math.sin(rotRad) + c.z * Math.cos(rotRad),
  }));

  return rotated;
}

/**
 * Separating Axis Theorem collision detection
 */
function satCollision(
  corners1: Array<{ x: number; z: number }>,
  corners2: Array<{ x: number; z: number }>
): boolean {
  const allCorners = [...corners1, ...corners2];

  // Get all potential separating axes
  const axes: Array<{ x: number; z: number }> = [];

  // Add axes from both shapes
  for (const corners of [corners1, corners2]) {
    for (let i = 0; i < corners.length; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % corners.length];
      const edge = { x: p2.x - p1.x, z: p2.z - p1.z };
      const axis = { x: -edge.z, z: edge.x };
      const len = Math.sqrt(axis.x * axis.x + axis.z * axis.z);
      if (len > 0.001) {
        axes.push({ x: axis.x / len, z: axis.z / len });
      }
    }
  }

  // Check each axis
  for (const axis of axes) {
    const proj1 = corners1.map((c) => c.x * axis.x + c.z * axis.z);
    const proj2 = corners2.map((c) => c.x * axis.x + c.z * axis.z);

    const min1 = Math.min(...proj1);
    const max1 = Math.max(...proj1);
    const min2 = Math.min(...proj2);
    const max2 = Math.max(...proj2);

    // If projections don't overlap, shapes don't collide
    if (max1 < min2 || max2 < min1) {
      return false;
    }
  }

  // All axes show overlap
  return true;
}

/**
 * Check if a room is outside the deck footprint
 */
function isRoomOutsideFootprint(room: any, footprint: any): boolean {
  const corners = getRoomCorners(room);
  const polygon = footprint.polygon;

  // Simple check: all corners must be inside the polygon
  return corners.some((corner) => !isPointInPolygon(corner, polygon));
}

/**
 * Point-in-polygon test using ray casting
 */
function isPointInPolygon(point: { x: number; z: number }, polygon: any[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  let p1 = polygon[polygon.length - 1];

  for (let i = 0; i < polygon.length; i++) {
    const p2 = polygon[i];

    if (
      point.z > Math.min(p1.z, p2.z) &&
      point.z <= Math.max(p1.z, p2.z) &&
      point.x <= Math.max(p1.x, p2.x)
    ) {
      if (p1.z !== p2.z) {
        const xinters = ((point.z - p1.z) * (p2.x - p1.x)) / (p2.z - p1.z) + p1.x;
        if (p1.x === p2.x || point.x <= xinters) {
          inside = !inside;
        }
      }
    }
    p1 = p2;
  }

  return inside;
}

/**
 * Reset zoom and pan to fit deck
 */
function resetZoom() {
  if (!currentDeck.value) return;

  const bounds = currentDeck.value.polygonBounds;
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxZ - bounds.minZ, 1);

  // Set viewport to center of visible deck
  viewportX.value = (bounds.minX + bounds.maxX) / 2;
  viewportY.value = (bounds.minZ + bounds.maxZ) / 2;

  // Calculate zoom to fit with margin
  zoom.value = Math.min(
    (canvasWidth.value * 0.8) / width,
    (canvasHeight.value * 0.8) / height
  );

  // Clamp zoom to reasonable range
  zoom.value = Math.max(0.1, Math.min(10, zoom.value));

  drawCanvas();
}

/**
 * Toggle grid visibility
 */
function toggleGrid() {
  showGrid.value = !showGrid.value;
  drawCanvas();
}

/**
 * Select a room
 */
function selectRoom(roomId: string) {
  selectedRoomId.value = selectedRoomId.value === roomId ? null : roomId;
  // Sync with store
  if (selectedRoomId.value) {
    shipStore.selectItem('room', selectedRoomId.value);
  } else {
    shipStore.clearSelection();
  }
  drawCanvas();
}

/**
 * Delete a room (show confirmation first)
 */
function deleteRoom(roomId: string) {
  roomToDelete.value = roomId;
  showDeleteConfirm.value = true;
}

/**
 * Confirm deletion of a room
 */
function confirmDeleteRoom() {
  if (!roomToDelete.value) return;
  
  const roomId = roomToDelete.value;
  shipStore.deleteRoom(roomId);
  if (selectedRoomId.value === roomId) {
    selectedRoomId.value = null;
    shipStore.clearSelection();
  }
  
  roomToDelete.value = null;
  showDeleteConfirm.value = false;
}

/**
 * Cancel deletion
 */
function cancelDeleteRoom() {
  roomToDelete.value = null;
  showDeleteConfirm.value = false;
}

/**
 * Open edit modal for a room
 */
function openEditRoom(roomId: string) {
  const room = roomsOnDeck.value.find((r) => r.id === roomId);
  if (!room) return;

  editingRoomId.value = roomId;
  editRoom.value = {
    id: room.id,
    type: room.type,
    width: room.shape.size[0],
    depth: room.shape.size[1],
    rotation: room.rotationDeg,
    posX: room.position.x,
    posZ: room.position.z,
  };
  showEditModal.value = true;
}

/**
 * Save edited room
 */
function saveEditRoom() {
  if (!editingRoomId.value) return;

  const room = roomsOnDeck.value.find((r) => r.id === editingRoomId.value);
  if (!room) return;

  // Check if ID changed and is unique
  if (editRoom.value.id !== room.id) {
    if (shipStore.shipSpec.ship.rooms.some((r) => r.id === editRoom.value.id)) {
      alert("Room ID already exists");
      return;
    }
  }

  shipStore.updateRoom(editingRoomId.value, {
    id: editRoom.value.id,
    type: editRoom.value.type as any,
    shape: {
      type: RoomShapeType.Rect,
      size: [editRoom.value.width, editRoom.value.depth],
    },
    position: { x: editRoom.value.posX, z: editRoom.value.posZ },
    rotationDeg: editRoom.value.rotation,
  });

  showEditModal.value = false;
  editingRoomId.value = null;
}

/**
 * Duplicate a room
 */
function duplicateRoom(roomId: string) {
  const room = roomsOnDeck.value.find((r) => r.id === roomId);
  if (!room) return;

  // Generate unique ID
  let newId = `${room.id}_copy`;
  let counter = 1;
  while (shipStore.shipSpec.ship.rooms.some((r) => r.id === newId)) {
    newId = `${room.id}_copy${counter}`;
    counter++;
  }

  // Offset position slightly
  const newRoom = {
    ...room,
    id: newId,
    position: {
      x: room.position.x + 2,
      z: room.position.z + 2,
    },
  };

  shipStore.addRoom(newRoom);
}

/**
 * Add a new room to the current deck
 */
function addRoomToCurrentDeck() {
  if (!newRoom.value.id.trim()) {
    alert("Room ID is required");
    return;
  }

  const room = {
    id: newRoom.value.id,
    type: newRoom.value.type as any,
    deck: selectedDeckIndex.value,
    shape: { type: RoomShapeType.Rect, size: [newRoom.value.width, newRoom.value.depth] as [number, number] },
    position: { x: newRoom.value.posX, z: newRoom.value.posZ },
    rotationDeg: newRoom.value.rotation,
    tags: [],
  };

  shipStore.addRoom(room);

  // Reset form
  newRoom.value = {
    id: "",
    type: "crew",
    width: 6,
    depth: 6,
    rotation: 0,
    posX: 0,
    posZ: 0,
  };
  showRoomForm.value = false;
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  // Set canvas size based on container
  const container = canvas.value?.parentElement;
  if (container) {
    const computedStyle = window.getComputedStyle(container);
    const containerWidth = container.clientWidth - 32; // Account for padding
    canvasWidth.value = Math.min(800, containerWidth);
    canvasHeight.value = Math.min(600, Math.max(400, containerWidth * 0.75));
  }

  // Debug: verify coordinate space consistency
  if (canvas.value) {
    const rect = canvas.value.getBoundingClientRect();
    console.log("Canvas coordinate space check:", {
      rectW: rect.width,
      rectH: rect.height,
      canvasW: canvas.value.width,
      canvasH: canvas.value.height,
      canvasWidthRef: canvasWidth.value,
      canvasHeightRef: canvasHeight.value,
      dpr: window.devicePixelRatio,
      scaleX: canvas.value.width / rect.width,
      scaleY: canvas.value.height / rect.height,
    });
  }

  // Initial draw setup
  if (deckList.value.length > 0) {
    selectedDeckIndex.value = deckList.value[0].deckIndex;
  }

  // Set up animation loop
  let animationId: number;
  let isFirstFrame = true;
  
  const renderFrame = () => {
    // On first frame after deck is set, auto-fit
    if (isFirstFrame && currentDeck.value) {
      isFirstFrame = false;
      resetZoom();
    } else {
      drawCanvas();
    }
    animationId = requestAnimationFrame(renderFrame);
  };

  animationId = requestAnimationFrame(renderFrame);

  /**
   * Watch for store selection changes to sync with local state
   */
  watch(
    () => [shipStore.selection.itemType, shipStore.selection.itemIds],
    ([type, ids]) => {
      if (type === 'room' && Array.isArray(ids) && ids[0]) {
        selectedRoomId.value = ids[0];
        drawCanvas();
      } else if (type !== 'room' && selectedRoomId.value) {
        // Clear local selection if another type is selected
        selectedRoomId.value = null;
        drawCanvas();
      }
    },
    { deep: true }
  );

  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
});

/**
 * Expose deleteSelectedRoom method for keyboard shortcuts
 */
function deleteSelectedRoom() {
  if (selectedRoomId.value) {
    deleteRoom(selectedRoomId.value);
  }
}

defineExpose({
  deleteSelectedRoom,
});
</script>

<style scoped>
canvas {
  display: block;
  background-color: #000000;
  aspect-ratio: 4 / 3;
  max-width: 100%;
  height: auto;
}
</style>
