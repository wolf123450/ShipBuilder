/**
 * Tests for the hull compiler
 */

import { describe, it, expect } from "vitest";
import { LoftedSpineHull, createHullVolume } from "@compiler/hull";
import { HullType, HullSymmetry } from "@core/index";

describe("LoftedSpineHull", () => {
  const createTestHull = () => {
    return new LoftedSpineHull({
      type: HullType.LoftedSpine,
      symmetry: HullSymmetry.X,
      length: 100,
      maxBeam: 20,
      maxHeight: 10,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.9 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    });
  };

  it("should contain center point", () => {
    const hull = createTestHull();
    const result = hull.contains({ x: 0, y: 0, z: 0 });
    expect(result).toBe(true);
  });

  it("should not contain far exterior point", () => {
    const hull = createTestHull();
    const result = hull.contains({ x: 100, y: 100, z: 100 });
    expect(result).toBe(false);
  });

  it("should provide bounds", () => {
    const hull = createTestHull();
    const bounds = hull.bounds();

    expect(bounds.min.x).toBeLessThan(bounds.max.x);
    expect(bounds.min.y).toBeLessThan(bounds.max.y);
    expect(bounds.min.z).toBeLessThan(bounds.max.z);
  });

  it("should generate hull slice polygon", () => {
    const hull = createTestHull();
    const polygon = hull.sliceY(0, 1);

    expect(polygon.length).toBeGreaterThan(0);
    expect(polygon[0]).toHaveProperty("x");
    expect(polygon[0]).toHaveProperty("z");
  });

  it("should create hull from factory", () => {
    const spec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 50,
      maxBeam: 15,
      maxHeight: 8,
      spine: {
        points: [
          { z: 0, radius: 0.2 },
          { z: 1, radius: 0.2 },
        ],
      },
    };

    const hull = createHullVolume(spec);
    expect(hull).toBeDefined();
    expect(hull.contains({ x: 0, y: 0, z: 0 })).toBe(true);
  });

  it("should estimate surface normal", () => {
    const hull = createTestHull();
    const normal = hull.normal({ x: 8, y: 0, z: 0 });

    expect(normal).toHaveProperty("x");
    expect(normal).toHaveProperty("y");
    expect(normal).toHaveProperty("z");

    // Check that it's roughly normalized (length ~1)
    const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    expect(length).toBeGreaterThan(0.1);
  });
});
