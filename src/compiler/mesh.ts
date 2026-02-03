/**
 * Mesh baking module
 * Converts hull SDF and room volumes into Three.js geometry
 */

import * as THREE from "three";
import { HullVolume } from "./hull";
import { AABB, Vector3, Vector2 } from "@core/index";

/**
 * Parameters for mesh baking
 */
export interface MeshBakingParams {
  hullVolume: HullVolume;
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
 * Bake hull geometry using marching cubes style voxel sampling
 * This is a simple implementation; can be optimized later with actual marching cubes library
 */
export function bakeHullMesh(params: MeshBakingParams): BakedMesh {
  const { hullVolume, resolution = 1.0, maxResolution = 100 } = params;

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

  // Create voxel grid and sample SDF
  const voxels = new Uint8Array(cappedWidth * cappedHeight * cappedDepth);
  let filledVoxels = 0;

  for (let x = 0; x < cappedWidth; x++) {
    for (let y = 0; y < cappedHeight; y++) {
      for (let z = 0; z < cappedDepth; z++) {
        const worldX = bounds.min.x + x * actualResX;
        const worldY = bounds.min.y + y * actualResY;
        const worldZ = bounds.min.z + z * actualResZ;

        const point: Vector3 = { x: worldX, y: worldY, z: worldZ };
        const inside = hullVolume.contains(point) ? 1 : 0;

        const idx = x + y * cappedWidth + z * cappedWidth * cappedHeight;
        voxels[idx] = inside;
        if (inside) filledVoxels++;
      }
    }
  }

  console.log(`Filled voxels: ${filledVoxels}/${voxels.length}`);

  // Convert voxels to mesh using simple surface extraction
  const { positions, indices } = extractSurface(
    voxels,
    cappedWidth,
    cappedHeight,
    cappedDepth,
    actualResX,
    actualResY,
    actualResZ,
    bounds.min
  );

  console.log(`Generated positions: ${positions.length / 3}, indices: ${indices.length}`);

  // Create Three.js geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();

  return {
    geometry,
    boundingBox: bounds,
  };
}

/**
 * Extract surface triangles from voxel grid
 * Uses surface extraction: check each voxel's 6 faces for inside/outside transitions
 */
function extractSurface(
  voxels: Uint8Array,
  width: number,
  height: number,
  depth: number,
  resX: number,
  resY: number,
  resZ: number,
  origin: Vector3
): { positions: number[]; indices: number[] } {
  const positions: number[] = [];
  const indices: number[] = [];
  const vertexMap = new Map<string, number>();

  /**
   * Helper: get voxel at grid coordinates
   */
  const getVoxel = (x: number, y: number, z: number): number => {
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) {
      return 0; // Outside boundary
    }
    return voxels[x + y * width + z * width * height];
  };

  /**
   * Helper: add vertex
   */
  const getOrAddVertex = (x: number, y: number, z: number): number => {
    const key = `${x},${y},${z}`;

    if (!vertexMap.has(key)) {
      const idx = positions.length / 3;
      positions.push(origin.x + x * resX, origin.y + y * resY, origin.z + z * resZ);
      vertexMap.set(key, idx);
    }

    return vertexMap.get(key)!;
  };

  /**
   * Add a quad face as two triangles
   */
  const addQuad = (corners: [number, number, number][]): void => {
    const [p0, p1, p2, p3] = corners.map(([x, y, z]) => getOrAddVertex(x, y, z));
    indices.push(p0, p1, p2, p0, p2, p3);
  };

  // Process each voxel and create surface faces
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < depth; z++) {
        const current = getVoxel(x, y, z);
        if (current === 0) continue;

        // Right face (x+1)
        if (getVoxel(x + 1, y, z) === 0) {
          addQuad([
            [x + 1, y, z],
            [x + 1, y + 1, z],
            [x + 1, y + 1, z + 1],
            [x + 1, y, z + 1],
          ]);
        }

        // Left face (x-1)
        if (getVoxel(x - 1, y, z) === 0) {
          addQuad([
            [x, y, z + 1],
            [x, y + 1, z + 1],
            [x, y + 1, z],
            [x, y, z],
          ]);
        }

        // Top face (y+1)
        if (getVoxel(x, y + 1, z) === 0) {
          addQuad([
            [x, y + 1, z],
            [x + 1, y + 1, z],
            [x + 1, y + 1, z + 1],
            [x, y + 1, z + 1],
          ]);
        }

        // Bottom face (y-1)
        if (getVoxel(x, y - 1, z) === 0) {
          addQuad([
            [x, y, z + 1],
            [x + 1, y, z + 1],
            [x + 1, y, z],
            [x, y, z],
          ]);
        }

        // Front face (z+1)
        if (getVoxel(x, y, z + 1) === 0) {
          addQuad([
            [x, y, z + 1],
            [x, y + 1, z + 1],
            [x + 1, y + 1, z + 1],
            [x + 1, y, z + 1],
          ]);
        }

        // Back face (z-1)
        if (getVoxel(x, y, z - 1) === 0) {
          addQuad([
            [x + 1, y, z],
            [x + 1, y + 1, z],
            [x, y + 1, z],
            [x, y, z],
          ]);
        }
      }
    }
  }

  return { positions, indices };
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
