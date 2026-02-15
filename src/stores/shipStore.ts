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
  SelectionState,
  HierarchyUIState,
  HullSpec,
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

  // Enhanced selection system (Phase 5.0a)
  const selection = ref<SelectionState>({
    mode: "single",
    itemType: null,
    itemIds: [],
  });

  // Hierarchy UI state (Phase 5.0a)
  const hierarchyUI = ref<HierarchyUIState>({
    expandedNodes: {
      "primary-hull": true,
      "secondary-hulls": false,
      decks: true,
      rooms: false,
    },
    searchFilter: "",
    contextMenuTarget: null,
    contextMenuPos: { x: 0, y: 0 },
  });

  // Visibility state for 3D objects
  const visibility = ref({
    hull: true,
    decks: true,
    rooms: true,
    normals: false,
    hiddenDeckIndices: [] as number[],
    hiddenRoomIds: [] as string[],
  });

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
   * Overall selection getter
   */
  const getSelectedObject = computed(() => {
    if (!selection.value.itemIds.length) return null;
    const itemId = selection.value.itemIds[0];
    const itemType = selection.value.itemType;

    if (itemType === "room") {
      return {
        type: "room",
        id: itemId,
        object: shipSpec.value.ship.rooms.find((r) => r.id === itemId),
      };
    } else if (itemType === "deck") {
      return {
        type: "deck",
        id: itemId,
        // Deck index as string
      };
    } else if (itemType === "hull" && itemId === "primary") {
      return {
        type: "hull",
        id: itemId,
        object: shipSpec.value.ship.hull,
      };
    } else if (itemType === "hull") {
      // Secondary hull
      return {
        type: "secondary-hull",
        id: itemId,
        object: shipSpec.value.ship.secondaryHulls?.find((h) => h.name === itemId),
      };
    }
    return null;
  });

  // SELECTION METHODS (Phase 5.0a)

  /**
   * Select a single item or add to multi-select
   * For hull: don't need itemId, it defaults to "primary"
   */
  function selectItem(
    itemType: "hull" | "deck" | "room" | null,
    itemId?: string | null,
    multiSelect: boolean = false
  ) {
    if (!itemType) {
      clearSelection();
      return;
    }

    // For hull, use "primary" as the default ID if not provided
    const resolvedId = itemType === "hull" && !itemId ? "primary" : itemId;
    
    if (!resolvedId && itemType !== "hull") {
      clearSelection();
      return;
    }

    if (multiSelect && selection.value.mode === "multi" && selection.value.itemType === itemType) {
      // Add to multi-select if same type
      if (!selection.value.itemIds.includes(resolvedId!)) {
        selection.value.itemIds.push(resolvedId!);
      }
    } else {
      // Single select
      selection.value = {
        mode: "single",
        itemType,
        itemIds: [resolvedId!],
      };
    }
  }

  /**
   * Select all items of a given type
   */
  function selectAllOfType(itemType: "hull" | "deck" | "room") {
    const itemIds: string[] = [];

    if (itemType === "hull") {
      itemIds.push("primary");
      if (shipSpec.value.ship.secondaryHulls) {
        itemIds.push(...shipSpec.value.ship.secondaryHulls.map((h) => h.name || "unnamed"));
      }
    } else if (itemType === "deck") {
      const deckCount = Math.ceil(
        (shipSpec.value.ship.decks.endY - shipSpec.value.ship.decks.startY) /
          shipSpec.value.ship.decks.deckHeight
      );
      for (let i = 0; i < deckCount; i++) {
        itemIds.push(String(i));
      }
    } else if (itemType === "room") {
      itemIds.push(...shipSpec.value.ship.rooms.map((r) => r.id));
    }

    selection.value = {
      mode: "group",
      itemType: `all-${itemType}s` as any,
      itemIds,
    };
  }

  /**
   * Clear all selections
   */
  function clearSelection() {
    selection.value = {
      mode: "single",
      itemType: null,
      itemIds: [],
    };
  }

  /**
   * Toggle selection of an individual item
   */
  function toggleSelection(itemType: "hull" | "deck" | "room", itemId: string) {
    if (selection.value.itemType !== itemType || selection.value.mode !== "multi") {
      // Starting fresh multi-select
      selectItem(itemType, itemId, false);
      selection.value.mode = "multi";
    } else {
      // Toggle item in existing multi-select
      const idx = selection.value.itemIds.indexOf(itemId);
      if (idx >= 0) {
        selection.value.itemIds.splice(idx, 1);
        if (selection.value.itemIds.length === 0) {
          clearSelection();
        }
      } else {
        selection.value.itemIds.push(itemId);
      }
    }
  }

  /**
   * Select multiple items of the same type
   */
  function selectMultiple(itemType: "hull" | "deck" | "room", itemIds: string[]) {
    if (itemIds.length === 0) {
      clearSelection();
    } else if (itemIds.length === 1) {
      selectItem(itemType, itemIds[0], false);
    } else {
      selection.value = {
        mode: "multi",
        itemType,
        itemIds,
      };
    }
  }

  /**
   * Check if item is selected
   */
  function isSelected(itemType: string, itemId: string): boolean {
    return (
      selection.value.itemIds.includes(itemId) &&
      (selection.value.itemType === itemType ||
        (selection.value.itemType !== null && selection.value.itemType.includes("all")))
    );
  }

  /**
   * Get all selected item IDs
   */
  function getSelectedIds(): string[] {
    return [...selection.value.itemIds];
  }

  // HIERARCHY UI METHODS (Phase 5.0a)

  /**
   * Toggle expanded state of a hierarchy node
   */
  function toggleExpandedNode(nodePath: string) {
    hierarchyUI.value.expandedNodes[nodePath] = !hierarchyUI.value.expandedNodes[nodePath];
  }

  /**
   * Set hierarchy search filter
   */
  function setHierarchyFilter(filter: string) {
    hierarchyUI.value.searchFilter = filter;
  }

  /**
   * Expand all hierarchy nodes
   */
  function expandAllNodes() {
    hierarchyUI.value.expandedNodes = {
      "primary-hull": true,
      "secondary-hulls": true,
      decks: true,
      rooms: true,
    };
  }

  /**
   * Collapse all hierarchy nodes
   */
  function collapseAllNodes() {
    hierarchyUI.value.expandedNodes = {
      "primary-hull": false,
      "secondary-hulls": false,
      decks: false,
      rooms: false,
    };
  }

  // VISIBILITY TOGGLE METHODS

  /**
   * Toggle visibility of hull
   */
  function toggleHullVisibility() {
    visibility.value.hull = !visibility.value.hull;
  }

  /**
   * Toggle visibility of decks
   */
  function toggleDecksVisibility() {
    visibility.value.decks = !visibility.value.decks;
  }

  /**
   * Toggle visibility of rooms
   */
  function toggleRoomsVisibility() {
    visibility.value.rooms = !visibility.value.rooms;
  }

  /**
   * Toggle visibility of a specific deck
   */
  function toggleDeckVisibility(deckIndex: number) {
    const idx = visibility.value.hiddenDeckIndices.indexOf(deckIndex);
    if (idx >= 0) {
      visibility.value.hiddenDeckIndices.splice(idx, 1);
    } else {
      visibility.value.hiddenDeckIndices.push(deckIndex);
    }
  }

  /**
   * Toggle visibility of a specific room
   */
  function toggleRoomVisibility(roomId: string) {
    const idx = visibility.value.hiddenRoomIds.indexOf(roomId);
    if (idx >= 0) {
      visibility.value.hiddenRoomIds.splice(idx, 1);
    } else {
      visibility.value.hiddenRoomIds.push(roomId);
    }
  }

  /**
   * Check if a deck is visible
   */
  function isDeckVisible(deckIndex: number): boolean {
    return visibility.value.decks && !visibility.value.hiddenDeckIndices.includes(deckIndex);
  }

  /**
   * Check if a room is visible
   */
  function isRoomVisible(roomId: string): boolean {
    return visibility.value.rooms && !visibility.value.hiddenRoomIds.includes(roomId);
  }

  // SECONDARY HULL CRUD METHODS (Phase 5.0a)

  /**
   * Add a new secondary hull
   */
  function addSecondaryHull(hull: HullSpec) {
    if (!shipSpec.value.ship.secondaryHulls) {
      shipSpec.value.ship.secondaryHulls = [];
    }
    shipSpec.value.ship.secondaryHulls.push(hull);
    recompileShip();
  }

  /**
   * Update an existing secondary hull
   */
  function updateSecondaryHull(hullId: string, updates: Partial<HullSpec>) {
    const hull = shipSpec.value.ship.secondaryHulls?.find((h) => h.name === hullId);
    if (hull) {
      Object.assign(hull, updates);
      recompileShip();
    }
  }

  /**
   * Delete a secondary hull
   */
  function deleteSecondaryHull(hullId: string) {
    const index = shipSpec.value.ship.secondaryHulls?.findIndex((h) => h.name === hullId);
    if (index !== undefined && index >= 0) {
      shipSpec.value.ship.secondaryHulls?.splice(index, 1);
      recompileShip();
    }
  }

  /**
   * Duplicate a secondary hull with auto-offset position
   */
  function duplicateSecondaryHull(hullId: string) {
    const original = shipSpec.value.ship.secondaryHulls?.find((h) => h.name === hullId);
    if (!original) return;

    const copy = JSON.parse(JSON.stringify(original));
    copy.name = `${original.name} (copy)`;
    if (copy.worldTransform?.position) {
      copy.worldTransform.position.x += 10; // Offset by 10 meters
    }

    addSecondaryHull(copy);
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
    selection,
    hierarchyUI,
    visibility,

    // Computed
    getSelectedObject,

    // Ship update actions
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
    markClean,

    // Selection methods
    selectItem,
    selectAllOfType,
    clearSelection,
    toggleSelection,
    selectMultiple,
    isSelected,
    getSelectedIds,

    // Hierarchy UI methods
    toggleExpandedNode,
    setHierarchyFilter,
    expandAllNodes,
    collapseAllNodes,

    // Visibility toggle methods
    toggleHullVisibility,
    toggleDecksVisibility,
    toggleRoomsVisibility,
    toggleDeckVisibility,
    toggleRoomVisibility,
    isDeckVisible,
    isRoomVisible,

    // Secondary hull CRUD methods
    addSecondaryHull,
    updateSecondaryHull,
    deleteSecondaryHull,
    duplicateSecondaryHull,
  };
});
