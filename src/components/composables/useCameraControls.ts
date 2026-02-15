import { ref, watch, computed } from 'vue';
import * as THREE from 'three';
import { useShipStore } from '@stores/shipStore';

export function useCameraControls(camera: any, scene: any, animationDuration: any) {
  const shipStore = useShipStore();

  // Camera state
  const cameraPos = ref({ x: 0, y: 40, z: 80 });
  const cameraTarget = ref({ x: 0, y: 0, z: 0 });
  const currentPresetView = ref<string | null>(null);

  // Animation state
  let isAnimating = false;
  let animationStartTime = 0;
  let animationStartPos = { x: 0, y: 0, z: 0 };
  let animationStartTarget = { x: 0, y: 0, z: 0 };
  let animationEndPos = { x: 0, y: 0, z: 0 };
  let animationEndTarget = { x: 0, y: 0, z: 0 };

  // Mesh centers (provided by caller)
  let hullCenter: THREE.Vector3 | null = null;
  let deckCenters: THREE.Vector3[] = [];

  let targetIndicator: THREE.Mesh | null = null;

  /**
   * Set mesh center references (called by Preview3D after useMeshManagement)
   */
  function setMeshCenters(hull: THREE.Vector3 | null, decks: THREE.Vector3[]) {
    hullCenter = hull;
    deckCenters = decks;
  }

  /**
   * Create or update target indicator sphere
   */
  function updateTargetIndicator() {
    if (!scene()) return;

    const sceneInstance = scene();

    // Remove existing indicator
    if (targetIndicator) {
      sceneInstance.remove(targetIndicator);
      targetIndicator.geometry.dispose();
      (targetIndicator.material as THREE.Material).dispose();
      targetIndicator = null;
    }

    // Create new indicator
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff6b6b, wireframe: true });
    targetIndicator = new THREE.Mesh(geometry, material);
    targetIndicator.position.set(cameraTarget.value.x, cameraTarget.value.y, cameraTarget.value.z);
    sceneInstance.add(targetIndicator);
  }

  /**
   * Animate camera to target position and look-at point
   */
  function animateCameraTo(newPos: any, newTarget: any) {
    const cameraInstance = camera();
    if (!cameraInstance) return;

    isAnimating = true;
    animationStartTime = Date.now();
    animationStartPos = { ...cameraPos.value };
    animationStartTarget = { ...cameraTarget.value };
    animationEndPos = newPos;
    animationEndTarget = newTarget;
  }

  /**
   * Update camera animation (called each frame)
   */
  function updateCameraAnimation() {
    if (!isAnimating || !camera()) return;

    const cameraInstance = camera();
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

    cameraInstance.position.set(cameraPos.value.x, cameraPos.value.y, cameraPos.value.z);
    cameraInstance.lookAt(cameraTarget.value.x, cameraTarget.value.y, cameraTarget.value.z);
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
      animateCameraTo(config.pos, config.target);
    }
  }

  /**
   * Reset view to default
   */
  function resetView() {
    if (shipStore.selection.itemType) {
      focusOnSelected();
    } else {
      setPresetView('top');
    }
  }

  /**
   * Focus on selected object
   */
  function focusOnSelected(roomData?: any) {
    const distance = 30;
    let center = { x: 0, y: 0, z: 0 };

    const selectedObject = shipStore.getSelectedObject;

    // Determine which object is selected and get its center
    if (selectedObject?.type === 'room' && roomData) {
      // For rooms, use provided data
      center = {
        x: roomData.position.x,
        y: (roomData.deck_y_min + roomData.deck_y_max) / 2 || 0,
        z: roomData.position.z,
      };
    } else if (selectedObject?.type === 'hull' && hullCenter) {
      // For hull, use calculated center
      center = {
        x: hullCenter.x,
        y: hullCenter.y,
        z: hullCenter.z,
      };
    } else if (selectedObject?.type === 'deck') {
      // For decks, use calculated center
      const deckIndex = parseInt(selectedObject.id);
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
  function applyCameraRotation(rotation: { x: number; y: number; z: number }) {
    const cameraInstance = camera();
    if (!cameraInstance) return;

    // Convert Euler angles to direction vector
    const euler = new THREE.Euler(
      (rotation.x * Math.PI) / 180,
      (rotation.y * Math.PI) / 180,
      (rotation.z * Math.PI) / 180,
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

  return {
    cameraPos,
    cameraTarget,
    currentPresetView,
    targetIndicator,
    setMeshCenters,
    updateTargetIndicator,
    animateCameraTo,
    updateCameraAnimation,
    setPresetView,
    resetView,
    focusOnSelected,
    applyCameraPosition,
    applyCameraRotation,
  };
}
