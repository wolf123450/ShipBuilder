<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold mb-4">Room Placement</h2>
      <p class="text-gray-400 text-sm mb-4">
        Define the functional spaces inside your ship. Rooms are placed on decks and contribute to the ship's purpose.
      </p>
    </div>

    <!-- Room list -->
    <div class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-lg">Rooms</h3>
        <button
          @click="showAddForm = !showAddForm"
          class="px-3 py-1 bg-ship-accent hover:bg-blue-600 rounded text-white text-sm font-semibold"
        >
          + Add Room
        </button>
      </div>

      <div v-if="shipStore.derivedData?.validatedRooms" class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="room in shipStore.derivedData.validatedRooms"
          :key="room.id"
          class="bg-ship-navy rounded p-3 border-l-4"
          :style="{ borderColor: getRoomColor(room.type) }"
        >
          <div class="flex items-start justify-between mb-1">
            <div>
              <strong class="block text-white">{{ room.id }}</strong>
              <span class="text-xs text-gray-400 capitalize">{{ room.type }}</span>
            </div>
            <button
              @click="deleteRoom(room.id)"
              class="text-red-400 hover:text-red-300 text-xs font-semibold"
            >
              Delete
            </button>
          </div>
          <div class="text-xs text-gray-400 space-y-1 mt-2">
            <div>Deck: {{ room.deck }}</div>
            <div>Position: {{ room.position.x.toFixed(1) }}, {{ room.position.z.toFixed(1) }}</div>
            <div>Size: {{ room.shape.size[0] }}m × {{ room.shape.size[1] }}m</div>
          </div>
        </div>

        <div v-if="shipStore.derivedData.validatedRooms.length === 0" class="text-gray-400 text-sm py-4 text-center">
          No rooms yet. Add one to get started!
        </div>
      </div>
    </div>

    <!-- Add room form -->
    <div v-if="showAddForm" class="bg-ship-dark border border-ship-slate rounded p-4 space-y-4">
      <h3 class="font-semibold text-lg">New Room</h3>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-400 text-sm mb-2">Room ID</label>
          <input
            v-model="newRoom.id"
            type="text"
            placeholder="e.g., cargo_1"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label class="block text-gray-400 text-sm mb-2">Type</label>
          <select v-model="newRoom.type" class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm">
            <option value="command">Command</option>
            <option value="corridor">Corridor</option>
            <option value="crew">Crew</option>
            <option value="cargo">Cargo</option>
            <option value="engineering">Engineering</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-400 text-sm mb-2">Deck</label>
          <select v-model.number="newRoom.deck" class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm">
            <option
              v-for="(_, idx) in shipStore.derivedData?.deckFootprints || []"
              :key="idx"
              :value="idx"
            >
              Deck {{ idx }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-gray-400 text-sm mb-2">Width (m)</label>
          <input
            v-model.number="newRoom.width"
            type="number"
            step="0.5"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-400 text-sm mb-2">X Position</label>
          <input
            v-model.number="newRoom.x"
            type="number"
            step="0.5"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label class="block text-gray-400 text-sm mb-2">Z Position</label>
          <input
            v-model.number="newRoom.z"
            type="number"
            step="0.5"
            class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      <div>
        <label class="block text-gray-400 text-sm mb-2">Depth (m)</label>
        <input
          v-model.number="newRoom.depth"
          type="number"
          step="0.5"
          class="w-full bg-ship-navy border border-ship-slate rounded px-3 py-2 text-white text-sm"
        />
      </div>

      <div class="flex gap-2">
        <button
          @click="addRoom"
          class="flex-1 px-3 py-2 bg-ship-accent hover:bg-blue-600 rounded text-white font-semibold"
        >
          Create Room
        </button>
        <button
          @click="showAddForm = false"
          class="flex-1 px-3 py-2 bg-ship-slate hover:bg-gray-600 rounded text-white font-semibold"
        >
          Cancel
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
import { ref, reactive } from "vue";
import { useShipStore } from "@stores/shipStore";
import { RoomType, RoomShapeType } from "@core/index";

const shipStore = useShipStore();
const showAddForm = ref(false);

const newRoom = reactive({
  id: "room_",
  type: RoomType.Cargo,
  deck: 0,
  x: 0,
  z: 0,
  width: 10,
  depth: 10,
});

/**
 * Get color for room type
 */
function getRoomColor(type: string): string {
  const colors: Record<string, string> = {
    command: "#ff6b6b",
    crew: "#4ecdc4",
    cargo: "#ffe66d",
    corridor: "#a8dadc",
    engineering: "#f4a261",
  };
  return colors[type] || "#cccccc";
}

/**
 * Add a new room
 */
function addRoom() {
  if (!newRoom.id.trim()) {
    alert("Room ID is required");
    return;
  }

  shipStore.addRoom({
    id: newRoom.id,
    type: newRoom.type as RoomType,
    deck: newRoom.deck,
    shape: {
      type: RoomShapeType.Rect,
      size: [newRoom.width, newRoom.depth],
    },
    position: {
      x: newRoom.x,
      z: newRoom.z,
    },
    rotationDeg: 0,
  });

  // Reset form
  newRoom.id = "room_";
  newRoom.type = RoomType.Cargo;
  newRoom.deck = 0;
  newRoom.x = 0;
  newRoom.z = 0;
  newRoom.width = 10;
  newRoom.depth = 10;
  showAddForm.value = false;
}

/**
 * Delete a room
 */
function deleteRoom(roomId: string) {
  if (confirm(`Delete room "${roomId}"?`)) {
    shipStore.deleteRoom(roomId);
  }
}
</script>

<style scoped></style>
