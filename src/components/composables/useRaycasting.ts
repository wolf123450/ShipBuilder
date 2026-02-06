import * as THREE from 'three';

export interface HitResult {
  type: 'hull' | 'deck' | 'room';
  id?: string | number;
  mesh: THREE.Mesh;
  data?: any;
}

export function useRaycasting(
  camera: any,
  renderer: any,
  hullMesh: any,
  deckMeshes: any,
  roomMeshes: any,
  roomMeshMap: any,
  showHull: any,
  showDecks: any,
  showRooms: any
) {
  let raycaster: THREE.Raycaster | null = null;

  /**
   * Raycast from mouse position and return hit object information
   */
  function raycastFromMouse(x: number, y: number): HitResult | null {
    const cameraInstance = camera();
    const rendererInstance = renderer();

    if (!cameraInstance || !rendererInstance) return null;

    if (!raycaster) {
      raycaster = new THREE.Raycaster();
    }

    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraInstance);

    // Collect all possible objects in raycaster, respecting visibility
    const allObjects: THREE.Object3D[] = [];
    const hullMeshInstance = hullMesh();
    const deckMeshesArray = deckMeshes();
    const roomMeshesArray = roomMeshes();

    if (hullMeshInstance && showHull.value) allObjects.push(hullMeshInstance);
    if (showDecks.value) allObjects.push(...deckMeshesArray);
    if (showRooms.value) allObjects.push(...roomMeshesArray);

    // Get intersections sorted by distance
    const intersects = raycaster.intersectObjects(allObjects);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object as THREE.Mesh;
      const roomMeshMapInstance = roomMeshMap();

      // Determine what was hit
      if (roomMeshesArray.includes(hitObject)) {
        // Room was hit
        const room = roomMeshMapInstance.get(hitObject);
        if (room) {
          return {
            type: 'room',
            id: room.id,
            mesh: hitObject,
            data: room,
          };
        }
      } else if (deckMeshesArray.includes(hitObject)) {
        // Deck was hit
        const deckIndex = deckMeshesArray.indexOf(hitObject);
        if (deckIndex >= 0) {
          return {
            type: 'deck',
            id: deckIndex,
            mesh: hitObject,
          };
        }
      } else if (hitObject === hullMeshInstance) {
        // Hull was hit
        return {
          type: 'hull',
          mesh: hitObject,
        };
      }
    }

    return null;
  }

  return {
    raycastFromMouse,
  };
}
