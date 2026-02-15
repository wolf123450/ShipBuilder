import { ref } from 'vue';
import * as THREE from 'three';
import { useShipStore } from '@stores/shipStore';

export function useSelection(scene: any, hullMesh: any, deckMeshes: any, roomMeshes: any, createOutlineMesh: any) {
  const shipStore = useShipStore();

  let hullOutline: THREE.LineSegments | null = null;
  let secondaryHullOutlines: Map<string, THREE.LineSegments> = new Map();
  let deckOutlines: THREE.LineSegments[] = [];
  let roomOutlines: Map<THREE.Mesh, THREE.LineSegments> = new Map();

  /**
   * Update selection outlines based on store selection
   */
  function updateSelectionOutlines() {
    const sceneInstance = scene();
    if (!sceneInstance) return;

    // Remove all existing outlines
    if (hullOutline) {
      sceneInstance.remove(hullOutline);
      hullOutline = null;
    }

    secondaryHullOutlines.forEach((outline) => sceneInstance.remove(outline));
    secondaryHullOutlines.clear();

    deckOutlines.forEach((outline) => sceneInstance.remove(outline));
    deckOutlines = [];

    roomOutlines.forEach((outline) => sceneInstance.remove(outline));
    roomOutlines.clear();

    // Add outlines for selected item(s)
    const hullMeshInstance = hullMesh();
    const deckMeshesArray = deckMeshes();
    const roomMeshesArray = roomMeshes();

    const itemType = shipStore.selection.itemType;
    const itemIds = shipStore.selection.itemIds;

    // Handle hull selection(s)
    if ((itemType === 'hull' || itemType === 'all-hulls') && hullMeshInstance && itemIds.includes('primary')) {
      hullOutline = createOutlineMesh(hullMeshInstance.geometry as THREE.BufferGeometry, 0x00ff00);
      if (hullOutline) {
        hullOutline.position.copy(hullMeshInstance.position);
        sceneInstance.add(hullOutline);
      }
    }

    // Handle deck selection(s)
    if (itemType === 'deck' || itemType === 'all-decks') {
      itemIds.forEach((id) => {
        const deckIndex = parseInt(id);
        if (!isNaN(deckIndex) && deckIndex < deckMeshesArray.length) {
          const mesh = deckMeshesArray[deckIndex];
          const outline = createOutlineMesh(mesh.geometry as THREE.BufferGeometry, 0x00ff00);
          outline.position.copy(mesh.position);
          sceneInstance.add(outline);
          deckOutlines.push(outline);
        }
      });
    }

    // Handle room selection(s)
    if (itemType === 'room' || itemType === 'all-rooms') {
      roomMeshesArray.forEach((mesh: THREE.Mesh) => {
        const roomId = mesh.userData.roomId || '';
        if (itemIds.includes(roomId)) {
          const outline = createOutlineMesh(mesh.geometry as THREE.BufferGeometry, 0x00ff00);
          outline.position.copy(mesh.position);
          sceneInstance.add(outline);
          roomOutlines.set(mesh, outline);
        }
      });
    }
  }

  return {
    hullOutline,
    secondaryHullOutlines,
    deckOutlines,
    roomOutlines,
    updateSelectionOutlines,
  };
}
