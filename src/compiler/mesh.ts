/**
 * Mesh baking module
 * Converts hull SDF and room volumes into Three.js geometry
 */

import * as THREE from "three";
import { HullVolume } from "./hull";
import { AABB, Vector3, Vector2 } from "@core/index";
import mfc from "marching-cubes-faster";
import { profiler } from "@utils/profiling";
import { meshCache } from "@utils/meshCache";

/**
 * Parameters for mesh baking
 */
export interface MeshBakingParams {
  hullVolume: HullVolume;
  hullSpec?: any; // Optional hull spec for caching
  resolution?: number; // Voxel size in meters; smaller = more detailed but slower
  maxResolution?: number; // Cap on grid size to prevent OOM
}

/**
 * Baked mesh output
 */
export interface BakedMesh {
  geometry: THREE.BufferGeometry;
  boundingBox: AABB;
}

/**
 * Bake hull geometry using marching cubes algorithm
 */
export function bakeHullMesh(params: MeshBakingParams): BakedMesh {
  const { hullVolume, hullSpec, resolution = 1.0, maxResolution = 100 } = params;

  // Try to get from cache if hull spec is provided
  if (hullSpec) {
    const cached = meshCache.get(hullSpec);
    if (cached) {
      console.log('✓ Using cached hull mesh');
      return cached;
    }
  }

  // Measure mesh generation time
  return profiler.measure('bakeHullMesh', () => {
    const bounds = hullVolume.bounds();
    console.log("Hull bounds:", bounds);

    // Calculate grid dimensions
    const gridWidth = Math.ceil((bounds.max.x - bounds.min.x) / resolution);
    const gridHeight = Math.ceil((bounds.max.y - bounds.min.y) / resolution);
    const gridDepth = Math.ceil((bounds.max.z - bounds.min.z) / resolution);

    console.log(`Grid dimensions before cap: ${gridWidth}x${gridHeight}x${gridDepth}`);

    // Cap to prevent memory issues
    const cappedWidth = Math.min(gridWidth, maxResolution);
    const cappedHeight = Math.min(gridHeight, maxResolution);
    const cappedDepth = Math.min(gridDepth, maxResolution);

    console.log(`Grid dimensions after cap: ${cappedWidth}x${cappedHeight}x${cappedDepth}`);

    // Adjust resolution to fit within caps
    const actualResX = (bounds.max.x - bounds.min.x) / cappedWidth;
    const actualResY = (bounds.max.y - bounds.min.y) / cappedHeight;
    const actualResZ = (bounds.max.z - bounds.min.z) / cappedDepth;

    // Build a list of bricks for voxels inside the hull
    // marching-cubes-faster uses CSG primitives, so we'll add bricks for voxels inside
    const dfObjList: any[] = [];
    let filledVoxels = 0;

    profiler.start('voxelSampling');
    
    // Use standard full-resolution sampling for accurate mesh
    // Cache distance calculations to improve performance
    for (let x = 0; x <= cappedWidth; x++) {
      for (let y = 0; y <= cappedHeight; y++) {
        for (let z = 0; z <= cappedDepth; z++) {
          const worldX = bounds.min.x + x * actualResX;
          const worldY = bounds.min.y + y * actualResY;
          const worldZ = bounds.min.z + z * actualResZ;

          const point: Vector3 = { x: worldX, y: worldY, z: worldZ };
          const distance = hullVolume.distance(point);

          // Add brick for voxels inside the hull
          if (distance <= 0) {
            filledVoxels++;
            const halfResX = actualResX / 2;
            const halfResY = actualResY / 2;
            const halfResZ = actualResZ / 2;
            
            // Add a brick (AABB) for this voxel with small padding for smoothing
            const padding = 0.5;
            const color = { r: 0.5, g: 0.5, b: 0.5, a: 1.0 };
            
            mfc.dfBuilder.addBrick(
              dfObjList,
              [
                [worldX - halfResX, worldY - halfResY, worldZ - halfResZ],
                [worldX + halfResX, worldY + halfResY, worldZ + halfResZ]
              ],
              padding,
              false,
              color
            );
          }
        }
      }
    }
    const voxelTime = profiler.end('voxelSampling');
    console.log(`Voxel sampling took ${voxelTime.toFixed(2)}ms, filled: ${filledVoxels} voxels`);

    // Build distance field and R-tree from the brick list
    const dfBuilderResult = mfc.dfBuilder.buildDfFromRTreeObjs(dfObjList);

    // Run marching cubes with 5 iterations for detail
    const iters = 5;
    const renderBlock = [
      [bounds.min.x, bounds.min.y, bounds.min.z],
      [bounds.max.x, bounds.max.y, bounds.max.z]
    ] as [[number, number, number], [number, number, number]];
    
    profiler.start('marchingCubes');
    const result = mfc.meshBuilder.buildForList(dfObjList, iters, renderBlock, dfBuilderResult);
    const mcTime = profiler.end('marchingCubes');
    console.log(`Marching cubes took ${mcTime.toFixed(2)}ms`);
  
    console.log(`Generated mesh with ${result.positions.length / 3} vertices and ${result.cells.length} cells`);
    
    // Flatten positions if they're not already flat
    // marching-cubes-faster returns positions as array of [x, y, z] triplets
    let flatPositions: number[];
    if (result.positions.length > 0 && Array.isArray(result.positions[0])) {
      flatPositions = (result.positions as any[]).flat();
    } else {
      flatPositions = result.positions;
    }

    // Create Three.js geometry
    const geometry = new THREE.BufferGeometry();
    
    // Positions are in format [x, y, z, x, y, z, ...]
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(flatPositions), 3));
    
    // Build index from cells (which represent surface voxel faces)
    // Each cell provides connectivity information
    const indices: number[] = [];
    if (result.cells && result.cells.length > 0) {
      for (const cell of result.cells) {
        if (Array.isArray(cell)) {
          // Cell is an array of vertex indices forming triangles
          for (const idx of cell) {
            indices.push(idx);
          }
        }
      }
    }
    
    if (indices.length === 0) {
      // Fallback: create simple sequential index
      for (let i = 0; i < result.positions.length / 3; i++) {
        indices.push(i);
      }
    }
    
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    // Compute normals for proper lighting
    geometry.computeVertexNormals();
    geometry.normalizeNormals();

    const bakedMesh: BakedMesh = {
      geometry,
      boundingBox: bounds,
    };

    // Store in cache if hull spec is provided
    if (hullSpec) {
      meshCache.set(hullSpec, bakedMesh);
    }

    return bakedMesh;
  });
}

/**
 * Create a simple mesh for a 2D polygon (for deck visualization)
 */
export function createPolygonMesh(polygon: Vector2[], y: number, thickness = 0.1): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Create vertices for top and bottom of slab
  const positions: number[] = [];

  for (const p of polygon) {
    positions.push(p.x, y + thickness / 2, p.z); // Top
  }

  for (const p of polygon) {
    positions.push(p.x, y - thickness / 2, p.z); // Bottom
  }

  // Create indices (simple fan triangulation for top, bottom, and sides)
  const indices: number[] = [];
  const n = polygon.length;

  // Top face (fan triangulation)
  for (let i = 1; i < n - 1; i++) {
    indices.push(0, i, i + 1);
  }

  // Bottom face (reverse order)
  const offset = n;
  for (let i = 1; i < n - 1; i++) {
    indices.push(offset, offset + i + 1, offset + i);
  }

  // Side faces
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const v0 = i;
    const v1 = next;
    const v2 = offset + next;
    const v3 = offset + i;

    indices.push(v0, v1, v2);
    indices.push(v0, v2, v3);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create a simple box mesh for a room
 */
export function createRoomMesh(
  x: number,
  z: number,
  width: number,
  depth: number,
  yMin: number,
  yMax: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, yMax - yMin, depth);

  // Position it correctly
  const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const positions = positionAttr.array as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += x; // Offset X
    positions[i + 1] += (yMin + yMax) / 2; // Offset Y
    positions[i + 2] += z; // Offset Z
  }

  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}
