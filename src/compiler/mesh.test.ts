/**
 * Tests for mesh baking
 */

import { describe, it, expect } from "vitest";
import { bakeHullMesh, createPolygonMesh, createRoomMesh } from "@compiler/mesh";
import { createHullVolume } from "@compiler/hull";
import { HullType, HullSymmetry } from "@core/index";
import * as THREE from "three";

describe("Mesh Baking", () => {
  const createTestHull = () => {
    return createHullVolume({
      type: HullType.LoftedSpine,
      symmetry: HullSymmetry.X,
      length: 60,
      maxBeam: 18,
      maxHeight: 8,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    });
  };

  it("should bake hull mesh with default resolution", () => {
    const hull = createTestHull();
    const baked = bakeHullMesh({ hullVolume: hull });

    expect(baked.geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(baked.geometry.getAttribute("position")).toBeDefined();
    expect(baked.geometry.getIndex()).toBeDefined();
    expect(baked.boundingBox).toBeDefined();
  });

  it("should have valid vertex positions", () => {
    const hull = createTestHull();
    const baked = bakeHullMesh({ hullVolume: hull, resolution: 2.0 });

    const positions = baked.geometry.getAttribute("position").array as Float32Array;
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.length % 3).toBe(0); // Should be multiple of 3

    // All positions should be within bounds
    const bounds = baked.boundingBox;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      expect(x).toBeGreaterThanOrEqual(bounds.min.x - 1);
      expect(x).toBeLessThanOrEqual(bounds.max.x + 1);
      expect(y).toBeGreaterThanOrEqual(bounds.min.y - 1);
      expect(y).toBeLessThanOrEqual(bounds.max.y + 1);
      expect(z).toBeGreaterThanOrEqual(bounds.min.z - 1);
      expect(z).toBeLessThanOrEqual(bounds.max.z + 1);
    }
  });

  it("should respect resolution parameter", () => {
    const hull = createTestHull();

    const coarse = bakeHullMesh({ hullVolume: hull, resolution: 5.0 });
    const fine = bakeHullMesh({ hullVolume: hull, resolution: 1.0 });

    const coarseVertexCount = (coarse.geometry.getAttribute("position").array as Float32Array).length / 3;
    const fineVertexCount = (fine.geometry.getAttribute("position").array as Float32Array).length / 3;

    // Finer resolution should have more vertices
    expect(fineVertexCount).toBeGreaterThan(coarseVertexCount);
  });

  it("should create polygon mesh", () => {
    const polygon = [
      { x: 0, z: -10 },
      { x: 5, z: -10 },
      { x: 5, z: 0 },
      { x: 0, z: 0 },
    ];

    const geometry = createPolygonMesh(polygon, 0);

    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(geometry.getAttribute("position")).toBeDefined();
    expect(geometry.getIndex()).toBeDefined();
  });

  it("should create room mesh", () => {
    const geometry = createRoomMesh(0, 0, 10, 10, 0, 3);

    expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(geometry.getAttribute("position")).toBeDefined();
  });
});
