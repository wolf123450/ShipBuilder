import { ref, onUnmounted } from 'vue';
import * as THREE from 'three';

export function useSceneSetup(canvasContainer: any) {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let animationId: number | null = null;

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

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
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
   * Start animation loop
   */
  function startAnimationLoop(renderCallback: () => void) {
    function animate() {
      animationId = requestAnimationFrame(animate);
      renderCallback();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }
    animate();
  }

  /**
   * Stop animation loop
   */
  function stopAnimationLoop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * Cleanup
   */
  function cleanup() {
    window.removeEventListener('resize', onWindowResize);
    stopAnimationLoop();

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

    renderer?.dispose();
  }

  onUnmounted(() => {
    cleanup();
  });

  return {
    scene: () => scene,
    camera: () => camera,
    renderer: () => renderer,
    initializeScene,
    startAnimationLoop,
    stopAnimationLoop,
    onWindowResize,
    cleanup,
  };
}
