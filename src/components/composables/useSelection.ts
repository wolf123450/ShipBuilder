import { ref } from 'vue';
import * as THREE from 'three';
import { useShipStore } from '@stores/shipStore';

export function useSelection(scene: any, hullMesh: any, deckMeshes: any, roomMeshes: any, createOutlineMesh: any) {
  const shipStore = useShipStore();

  let hullOutline: THREE.LineSegments | null = null;
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

    deckOutlines.forEach((outline) => sceneInstance.remove(outline));
    deckOutlines = [];

    roomOutlines.forEach((outline) => sceneInstance.remove(outline));
    roomOutlines.clear();

    // Add outlines for selected item
    const hullMeshInstance = hullMesh();
    const deckMeshesArray = deckMeshes();
    const roomMeshesArray = roomMeshes();

    if (shipStore.selectedItemType === 'hull' && hullMeshInstance) {
      hullOutline = createOutlineMesh(hullMeshInstance.geometry as THREE.BufferGeometry, 0x00ff00);
      if (hullOutline) {
        hullOutline.position.copy(hullMeshInstance.position);
        sceneInstance.add(hullOutline);
      }
    } else if (shipStore.selectedItemType === 'deck' && shipStore.selectedItemId) {
      // Find and highlight the selected deck
      const deckIndex = parseInt(shipStore.selectedItemId);
      deckMeshesArray.forEach((mesh: THREE.Mesh, idx: number) => {
        if (idx === deckIndex) {
          const outline = createOutlineMesh(mesh.geometry as THREE.BufferGeometry, 0x00ff00);
          outline.position.copy(mesh.position);
          sceneInstance.add(outline);
          deckOutlines.push(outline);
        }
      });
    } else if (shipStore.selectedItemType === 'room' && shipStore.selectedItemId) {
      // Find and highlight the selected room
      roomMeshesArray.forEach((mesh: THREE.Mesh) => {
        const outline = createOutlineMesh(mesh.geometry as THREE.BufferGeometry, 0x00ff00);
        outline.position.copy(mesh.position);
        sceneInstance.add(outline);
        roomOutlines.set(mesh, outline);
      });
    }
  }

  return {
    hullOutline,
    deckOutlines,
    roomOutlines,
    updateSelectionOutlines,
  };
}
