import * as THREE from 'three';
import { useShipStore } from '@stores/shipStore';

export function useInputHandlers(
  renderer: any,
  camera: any,
  cameraPos: any,
  cameraTarget: any,
  currentPresetView: any,
  raycastFromMouse: any,
  updateSelectionOutlines: any,
  focusOnSelected: any,
  showHull: any,
  showDecks: any,
  showRooms: any,
  roomMeshMap: any,
  roomMeshes: any
) {
  const shipStore = useShipStore();

  // Mouse interaction state
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let orbitStartX = 0;
  let orbitStartY = 0;
  let orbitStartPhi = 0;
  let orbitStartTheta = 0;

  /**
   * Handle canvas click for object selection
   */
  function onCanvasClick(event: MouseEvent) {
    const rendererInstance = renderer();
    if (!rendererInstance) return;

    const rect = rendererInstance.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitResult = raycastFromMouse(x, y);

    if (hitResult) {
      // Something was hit
      if (hitResult.type === 'room') {
        shipStore.selectItem('room', hitResult.id);
        focusOnSelected(hitResult.data);
        updateSelectionOutlines();
        return;
      } else if (hitResult.type === 'deck') {
        shipStore.selectItem('deck', hitResult.id.toString());
        focusOnSelected();
        updateSelectionOutlines();
        return;
      } else if (hitResult.type === 'hull') {
        // Phase 5.0c: Select hull by ID (primary or secondary)
        shipStore.selectItem('hull', hitResult.id);
        focusOnSelected();
        updateSelectionOutlines();
        return;
      }
    }

    // Deselect if nothing clicked
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
      const cameraInstance = camera();
      if (!cameraInstance) return;

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
    if (!mouseDown) return;

    const cameraInstance = camera();
    if (!cameraInstance) return;

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

        cameraInstance.getWorldDirection(new THREE.Vector3()); // Ensure matrixWorldInverse is updated
        right.set(cameraInstance.matrixWorldInverse.elements[0], cameraInstance.matrixWorldInverse.elements[4], cameraInstance.matrixWorldInverse.elements[8]).normalize();
        up.set(cameraInstance.matrixWorldInverse.elements[1], cameraInstance.matrixWorldInverse.elements[5], cameraInstance.matrixWorldInverse.elements[9]).normalize();

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

      cameraInstance.position.set(cameraPos.value.x, cameraPos.value.y, cameraPos.value.z);
      cameraInstance.lookAt(cameraTarget.value.x, cameraTarget.value.y, cameraTarget.value.z);
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
    const cameraInstance = camera();
    if (!cameraInstance) return;

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

    cameraInstance.position.set(cameraPos.value.x, cameraPos.value.y, cameraPos.value.z);
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
   * Attach event listeners to canvas
   */
  function attachEventListeners() {
    const rendererInstance = renderer();
    if (!rendererInstance) return;

    rendererInstance.domElement.addEventListener('click', onCanvasClick);
    rendererInstance.domElement.addEventListener('mousedown', onCanvasMouseDown);
    rendererInstance.domElement.addEventListener('mousemove', onCanvasMouseMove);
    rendererInstance.domElement.addEventListener('mouseup', onCanvasMouseUp);
    rendererInstance.domElement.addEventListener('wheel', onCanvasWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
  }

  /**
   * Detach event listeners from canvas
   */
  function detachEventListeners() {
    const rendererInstance = renderer();
    if (rendererInstance) {
      rendererInstance.domElement.removeEventListener('click', onCanvasClick);
      rendererInstance.domElement.removeEventListener('mousedown', onCanvasMouseDown);
      rendererInstance.domElement.removeEventListener('mousemove', onCanvasMouseMove);
      rendererInstance.domElement.removeEventListener('mouseup', onCanvasMouseUp);
      rendererInstance.domElement.removeEventListener('wheel', onCanvasWheel);
    }
    window.removeEventListener('keydown', onKeyDown);
  }

  return {
    onCanvasClick,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasWheel,
    onKeyDown,
    attachEventListeners,
    detachEventListeners,
  };
}
