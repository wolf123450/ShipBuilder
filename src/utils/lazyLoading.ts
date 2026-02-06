/**
 * Lazy loading utilities for Three.js and related libraries
 * Defers loading of heavy dependencies until needed
 */

// Cache for already loaded modules to avoid loading twice
let threeModule: any = null;
let gltfExporterModule: any = null;

/**
 * Lazy load Three.js
 */
export async function loadThree() {
  if (threeModule) {
    return threeModule;
  }
  threeModule = await import('three');
  return threeModule;
}

/**
 * Lazy load Three.js synchronously (for components that render immediately)
 * This is used when we know we need it right away
 */
export function loadThreeSync() {
  if (threeModule) {
    return threeModule;
  }
  // Dynamic require for sync loading (will still block)
  return require('three');
}

/**
 * Lazy load GLTFExporter
 */
export async function loadGLTFExporter() {
  if (gltfExporterModule) {
    return gltfExporterModule;
  }
  
  const three = await loadThree();
  const exporter = await import('three/examples/jsm/exporters/GLTFExporter.js');
  gltfExporterModule = exporter;
  return exporter;
}

/**
 * Preload critical Three.js modules in the background
 * Call this during app initialization to warm up the cache
 */
export async function preloadThreeModulesInBackground() {
  // Don't await - let these load in the background
  Promise.resolve().then(async () => {
    try {
      await loadThree();
      console.log('✓ Three.js preloaded');
      // Could also preload GLTFExporter here if needed
    } catch (error) {
      console.log('Failed to preload Three.js:', error);
    }
  });
}
