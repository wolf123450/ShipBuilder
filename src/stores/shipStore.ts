/**
 * Pinia store for ship specification and derived data
 * Central state management for the application
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  ShipSpec,
  DerivedShipData,
  ShipScale,
  HullType,
  HullSymmetry,
  DeckNamingScheme,
  WindowStyle,
  RoomType,
  RoomShapeType,
} from "@core/index";
import { compileShip } from "@compiler/index";

/**
 * Default ship specification for new projects
 */
function createDefaultShip(): ShipSpec {
  return {
    specVersion: 1,
    ship: {
      meta: {
        name: "Unnamed Vessel",
        description: "",
        role: "explorer",
        scale: ShipScale.Medium,
        units: "meters",
      },
      hull: {
        type: HullType.LoftedSpine,
        symmetry: HullSymmetry.X,
        length: 60,
        maxBeam: 18,
        maxHeight: 8,
        spine: {
          points: [
            { z: 0.0, radius: 0.2 },
            { z: 0.25, radius: 0.8 },
            { z: 0.75, radius: 0.7 },
            { z: 1.0, radius: 0.15 },
          ],
        },
      },
      decks: {
        deckHeight: 2.6,
        startY: -2.6,
        endY: 2.6,
        naming: {
          scheme: DeckNamingScheme.Index,
        },
      },
      rooms: [
        {
          id: "bridge",
          type: RoomType.Command,
          deck: 0,
          shape: { type: RoomShapeType.Rect, size: [8, 8] },
          position: { x: 0, z: 20 },
          rotationDeg: 0,
          tags: ["front", "vip"],
        },
      ],
      windows: {
        enabled: true,
        style: WindowStyle.Round,
        radius: 0.25,
        spacing: 2.5,
        includeRoomTypes: [RoomType.Crew, RoomType.Command],
        perDeckLimit: 200,
      },
    },
  };
}

export const useShipStore = defineStore("ship", () => {
  // STATE
  const shipSpec = ref<ShipSpec>(createDefaultShip());
  const derivedData = ref<DerivedShipData | null>(null);
  const isCompiling = ref(false);
  const compilationError = ref<string | null>(null);
  const selectedItemType = ref<'room' | 'deck' | 'hull' | null>(null);
  const selectedItemId = ref<string | null>(null);

  // Store the last saved state to track dirty flag
  const lastSavedState = ref<string>(JSON.stringify(shipSpec.value));

  // COMPUTED
  const isDirty = computed(() => {
    // Compare current state to last saved state
    return JSON.stringify(shipSpec.value) !== lastSavedState.value;
  });

  /**
   * Computed property for easier access to ship object
   */
  const ship = computed(() => shipSpec.value.ship);

  // ACTIONS
  /**
   * Recompile ship specification into derived data
   */
  function recompileShip() {
    isCompiling.value = true;
    compilationError.value = null;

    try {
      derivedData.value = compileShip(shipSpec.value);
    } catch (error) {
      compilationError.value = error instanceof Error ? error.message : "Unknown error";
      console.error("Ship compilation error:", error);
    } finally {
      isCompiling.value = false;
    }
  }

  /**
   * Update ship metadata
   */
  function updateMeta(updates: Partial<typeof shipSpec.value.ship.meta>) {
    Object.assign(shipSpec.value.ship.meta, updates);
    recompileShip();
  }

  /**
   * Update hull specification
   */
  function updateHull(updates: Partial<typeof shipSpec.value.ship.hull>) {
    Object.assign(shipSpec.value.ship.hull, updates);
    recompileShip();
  }

  /**
   * Update deck specification
   */
  function updateDecks(updates: Partial<typeof shipSpec.value.ship.decks>) {
    Object.assign(shipSpec.value.ship.decks, updates);
    recompileShip();
  }

  /**
   * Add a new room to the specification
   */
  function addRoom(room: typeof shipSpec.value.ship.rooms[0]) {
    shipSpec.value.ship.rooms.push(room);
    recompileShip();
  }

  /**
   * Update an existing room
   */
  function updateRoom(roomId: string, updates: Partial<typeof shipSpec.value.ship.rooms[0]>) {
    const room = shipSpec.value.ship.rooms.find((r) => r.id === roomId);
    if (room) {
      Object.assign(room, updates);
      recompileShip();
    }
  }

  /**
   * Delete a room
   */
  function deleteRoom(roomId: string) {
    const index = shipSpec.value.ship.rooms.findIndex((r) => r.id === roomId);
    if (index >= 0) {
      shipSpec.value.ship.rooms.splice(index, 1);
      recompileShip();
    }
  }

  /**
   * Update windows specification
   */
  function updateWindows(updates: Partial<typeof shipSpec.value.ship.windows>) {
    Object.assign(shipSpec.value.ship.windows, updates);
    recompileShip();
  }

  /**
   * Reset ship to default
   */
  function resetShip() {
    shipSpec.value = createDefaultShip();
    lastSavedState.value = JSON.stringify(shipSpec.value);
    recompileShip();
  }

  /**
   * Load a ship specification (from file/import)
   */
  function loadShip(spec: ShipSpec) {
    shipSpec.value = spec;
    lastSavedState.value = JSON.stringify(spec);
    recompileShip();
  }

  /**
   * Select an item (room, deck, or hull)
   */
  function selectItem(itemType: 'room' | 'deck' | 'hull' | null, itemId: string | null = null) {
    selectedItemType.value = itemType;
    selectedItemId.value = itemId;
  }

  /**
   * Clear selection
   */
  function clearSelection() {
    selectedItemType.value = null;
    selectedItemId.value = null;
  }

  /**
   * Mark the current state as saved (clears dirty flag)
   */
  function markClean() {
    lastSavedState.value = JSON.stringify(shipSpec.value);
  }

  // Perform initial compilation
  recompileShip();

  return {
    // State
    shipSpec,
    derivedData,
    isCompiling,
    compilationError,
    isDirty,
    ship,
    selectedItemType,
    selectedItemId,

    // Actions
    recompileShip,
    updateMeta,
    updateHull,
    updateDecks,
    addRoom,
    updateRoom,
    deleteRoom,
    updateWindows,
    resetShip,
    loadShip,
    selectItem,
    clearSelection,
    markClean,
  };
});
