import { ref, watch } from 'vue';
import * as THREE from 'three';
import { useShipStore } from '@stores/shipStore';
import { bakeHullMesh, createPolygonMesh, createRoomMesh } from '@compiler/mesh';
import { createHullVolume } from '@compiler/hull';

export function useMeshManagement(
  scene: any,
  meshResolution: any,
  showHull: any,
  showDecks: any,
  showRooms: any,
  showNormals: any
) {
  const shipStore = useShipStore();

  // Mesh objects
  let hullMesh: THREE.Mesh | null = null;
  let hullOutline: THREE.LineSegments | null = null;
  let hullCenter: THREE.Vector3 | null = null;
  let deckMeshes: THREE.Mesh[] = [];
  let deckOutlines: THREE.LineSegments[] = [];
  let deckCenters: THREE.Vector3[] = [];
  let roomMeshes: THREE.Mesh[] = [];
  let roomOutlines: Map<THREE.Mesh, THREE.LineSegments> = new Map();
  let roomMeshMap: Map<THREE.Mesh, any> = new Map();
  let normalHelper: THREE.LineSegments | null = null;

  const meshVertexCount = ref(0);

  /**
   * Helper: create hull volume from spec
   */
  function createHullVolumeFromSpec(spec: any) {
    return createHullVolume(spec.ship.hull);
  }

  /**
   * Create outline mesh from geometry
   */
  function createOutlineMesh(geometry: THREE.BufferGeometry, color: number = 0xffff00): THREE.LineSegments {
    const outlineGeometry = new THREE.BufferGeometry();
    const positions = geometry.getAttribute('position');

    if (positions) {
      // Create a cleaned copy of positions, filtering out NaN values
      const posArray = positions.array as Float32Array;
      const cleanedPositions: number[] = [];
      const indexMap: Map<number, number> = new Map();
      let cleanIndex = 0;

      for (let i = 0; i < posArray.length; i += 3) {
        const x = posArray[i];
        const y = posArray[i + 1];
        const z = posArray[i + 2];

        // Check if vertex is valid (not NaN)
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          cleanedPositions.push(x, y, z);
          indexMap.set(i / 3, cleanIndex);
          cleanIndex++;
        }
      }

      outlineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cleanedPositions), 3));
    }

    const wireframeGeometry = new THREE.WireframeGeometry(outlineGeometry);

    // Prevent bounding sphere computation errors for geometries with potential NaN values
    wireframeGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);

    const outlineMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 3,
    });

    const outline = new THREE.LineSegments(wireframeGeometry, outlineMaterial);
    return outline;
  }

  /**
   * Update mesh visualization
   */
  function updateMesh() {
    const sceneInstance = scene();
    if (!sceneInstance || !shipStore.derivedData) return;

    // Clear existing meshes
    if (hullMesh) {
      sceneInstance.remove(hullMesh);
      hullMesh.geometry.dispose();
      (hullMesh.material as THREE.Material).dispose();
      hullMesh = null;
    }

    deckMeshes.forEach((mesh) => {
      sceneInstance.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    deckMeshes = [];

    roomMeshes.forEach((mesh) => {
      sceneInstance.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    roomMeshes = [];
    roomMeshMap.clear();
    deckCenters = [];

    // Bake hull mesh
    if (showHull.value) {
      try {
        console.log('Starting hull mesh generation...');
        const bakedHull = bakeHullMesh({
          hullVolume: createHullVolumeFromSpec(shipStore.shipSpec),
          hullSpec: shipStore.shipSpec.ship.hull, // Pass hull spec for caching
          resolution: meshResolution.value,
          maxResolution: 60,
        });

        console.log('Hull mesh generated, geometry has ', bakedHull.geometry.getAttribute('position')?.count, ' vertices');

        const material = new THREE.MeshPhongMaterial({
          color: 0x3b82f6,
          shininess: 100,
          side: THREE.FrontSide,
          flatShading: false,
        });

        hullMesh = new THREE.Mesh(bakedHull.geometry, material);
        hullMesh.castShadow = true;
        hullMesh.receiveShadow = true;
        sceneInstance.add(hullMesh);

        meshVertexCount.value = (bakedHull.geometry.getAttribute('position').array as Float32Array).length / 3;
        console.log('Hull mesh added to scene, vertex count:', meshVertexCount.value);

        // Calculate and store hull center from geometry positions
        const posAttr = bakedHull.geometry.getAttribute('position');
        if (posAttr) {
          const bbox = new THREE.Box3();
          const vertex = new THREE.Vector3();
          let validVertices = 0;
          for (let i = 0; i < posAttr.count; i++) {
            vertex.fromBufferAttribute(posAttr, i);
            // Skip NaN values
            if (!isNaN(vertex.x) && !isNaN(vertex.y) && !isNaN(vertex.z)) {
              bbox.expandByPoint(vertex);
              validVertices++;
            }
          }
          // Only store center if we had valid vertices
          if (validVertices > 0) {
            hullCenter = bbox.getCenter(new THREE.Vector3());
          } else {
            hullCenter = null;
          }
        }

        // Update normal visualization if enabled
        updateNormals();
      } catch (error) {
        console.error('Failed to bake hull mesh:', error);
      }
    } else {
      hullMesh = null;
      hullCenter = null;
    }

    // Create deck footprint meshes
    if (showDecks.value) {
      for (const deck of shipStore.derivedData.deckFootprints) {
        try {
          const geometry = createPolygonMesh(deck.polygon, deck.yMin, 0.1);
          const material = new THREE.MeshPhongMaterial({
            color: 0x64748b,
            transparent: true,
            opacity: 0.3,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.receiveShadow = true;
          sceneInstance.add(mesh);
          deckMeshes.push(mesh);

          // Calculate and store deck center from geometry positions
          const posAttr = geometry.getAttribute('position');
          if (posAttr) {
            const bbox = new THREE.Box3();
            const vertex = new THREE.Vector3();
            let validVertices = 0;
            for (let i = 0; i < posAttr.count; i++) {
              vertex.fromBufferAttribute(posAttr, i);
              // Skip NaN values
              if (!isNaN(vertex.x) && !isNaN(vertex.y) && !isNaN(vertex.z)) {
                bbox.expandByPoint(vertex);
                validVertices++;
              }
            }
            // Only store center if we had valid vertices
            if (validVertices > 0) {
              deckCenters.push(bbox.getCenter(new THREE.Vector3()));
            } else {
              deckCenters.push(new THREE.Vector3(0, 0, 0));
            }
          } else {
            deckCenters.push(new THREE.Vector3(0, 0, 0));
          }
        } catch (error) {
          console.warn(`Failed to create deck ${deck.deckIndex} mesh:`, error);
        }
      }
    }

    // Create room meshes
    if (showRooms.value) {
      for (const room of shipStore.derivedData.validatedRooms) {
        try {
          // Get the deck for this room to determine Y position
          const deck = shipStore.derivedData.deckFootprints.find((d) => d.deckIndex === room.deck);
          if (!deck) {
            console.warn(`Room ${room.id} references non-existent deck ${room.deck}`);
            continue;
          }

          const [width, depth] = room.shape.size;
          const geometry = createRoomMesh(room.position.x, room.position.z, width, depth, deck.yMin, deck.yMax);

          const colors: Record<string, number> = {
            command: 0xff6b6b,
            crew: 0x4ecdc4,
            cargo: 0xffe66d,
            corridor: 0xa8dadc,
            engineering: 0xf4a261,
          };

          const color = colors[room.type] || 0xcccccc;
          const material = new THREE.MeshPhongMaterial({
            color,
            transparent: true,
            opacity: 0.7,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          sceneInstance.add(mesh);
          roomMeshes.push(mesh);

          // Store room data with mesh for selection
          const roomWithDeckY = {
            ...room,
            deck_y_min: deck.yMin,
            deck_y_max: deck.yMax,
            position: {
              ...room.position,
              y: (deck.yMin + deck.yMax) / 2,
            },
          };
          roomMeshMap.set(mesh, roomWithDeckY);
        } catch (error) {
          console.warn(`Failed to create room ${room.id} mesh:`, error);
        }
      }
    }
  }

  /**
   * Update normal visualization
   */
  function updateNormals() {
    const sceneInstance = scene();
    if (!sceneInstance || !hullMesh) return;

    // Remove existing normal helper
    if (normalHelper) {
      sceneInstance.remove(normalHelper);
      normalHelper = null;
    }

    // Add new normal helper if enabled
    if (showNormals.value && hullMesh.geometry) {
      // Create normal visualization using line segments
      const geometry = hullMesh.geometry;
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');

      if (positions && normals) {
        const normalLength = 1.0; // Length of normal vectors to display
        const lines = new THREE.BufferGeometry();
        const linePositions: number[] = [];

        // For each vertex, draw a line from vertex to vertex+normal
        for (let i = 0; i < positions.count; i++) {
          const px = positions.getX(i);
          const py = positions.getY(i);
          const pz = positions.getZ(i);

          const nx = normals.getX(i);
          const ny = normals.getY(i);
          const nz = normals.getZ(i);

          // Start point
          linePositions.push(px, py, pz);
          // End point
          linePositions.push(px + nx * normalLength, py + ny * normalLength, pz + nz * normalLength);
        }

        lines.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));

        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        normalHelper = new THREE.LineSegments(lines, material);
        sceneInstance.add(normalHelper);

        console.log(`Added normal visualization for ${positions.count} vertices`);
      }
    }
  }

  return {
    hullMesh: () => hullMesh,
    hullCenter: () => hullCenter,
    deckMeshes: () => deckMeshes,
    deckCenters: () => deckCenters,
    roomMeshes: () => roomMeshes,
    roomMeshMap: () => roomMeshMap,
    meshVertexCount,
    updateMesh,
    updateNormals,
    createOutlineMesh,
  };
}
