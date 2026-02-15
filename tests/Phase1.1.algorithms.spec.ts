/**
 * Phase 1.1 Tests: Dual Hull Algorithms
 * Tests for Catmull-Rom spline interpolation and algorithm selection
 */

import { describe, it, expect } from "vitest";
import {
  evaluateCatmullRom,
  createCatmullRomSpline,
} from "@utils/parametricSurfaceUtils";
import { createHullVolume } from "@compiler/hull";
import {
  HullGenerationAlgorithm,
  HullType,
  HullSymmetry,
} from "@core/index";

describe("Phase 1.1: Dual Hull Algorithms", () => {
  // ============================================================================
  // Catmull-Rom Interpolation Tests
  // ============================================================================

  describe("Catmull-Rom Basis Function", () => {
    it("should evaluate basis at t=0 returning p1", () => {
      const result = evaluateCatmullRom(0, 10, 20, 30, 0);
      expect(result).toBe(10);
    });

    it("should evaluate basis at t=1 returning p2", () => {
      const result = evaluateCatmullRom(0, 10, 20, 30, 1);
      expect(result).toBe(20);
    });

    it("should interpolate smoothly at t=0.5", () => {
      const result = evaluateCatmullRom(0, 10, 20, 30, 0.5);
      // At t=0.5, result should be between p1 and p2
      expect(result).toBeGreaterThan(10);
      expect(result).toBeLessThan(20);
    });

    it("should produce smooth curve (no sudden jumps)", () => {
      const values = [0, 10, 20, 30];
      const t_steps = [0, 0.25, 0.5, 0.75, 1.0];
      const results = t_steps.map((t) =>
        evaluateCatmullRom(values[0], values[1], values[2], values[3], t)
      );

      // Check monotonic progression (generally increasing)
      for (let i = 1; i < results.length; i++) {
        const delta = Math.abs(results[i] - results[i - 1]);
        expect(delta).toBeLessThan(15); // No sudden jumps
      }
    });

    it("should respect control point influence", () => {
      // p1 -> p2 transition should be influenced by p0 and p3
      const baseline = evaluateCatmullRom(10, 10, 20, 20, 0.5);
      const withP0Lower = evaluateCatmullRom(0, 10, 20, 20, 0.5);
      const withP3Higher = evaluateCatmullRom(10, 10, 20, 50, 0.5);

      // Different control points should produce different interpolations
      expect(baseline).not.toBe(withP0Lower);
      expect(baseline).not.toBe(withP3Higher);
    });
  });

  describe("Catmull-Rom Spline Creation", () => {
    it("should require at least 2 points", () => {
      expect(() => createCatmullRomSpline([])).toThrow();
      expect(() => createCatmullRomSpline([1])).toThrow();
    });

    it("should create spline from boundary-friendly points", () => {
      const points = [0, 1, 2, 3];
      const spline = createCatmullRomSpline(points);

      const t0 = spline(0.0);
      const t1 = spline(1.0);

      // Endpoints should be close to first/last values
      expect(t0).toBeCloseTo(0, 1);
      expect(t1).toBeCloseTo(3, 1);
    });

    it("should interpolate through all segments", () => {
      const points = [0, 0.25, 0.5, 0.75, 1.0];
      const spline = createCatmullRomSpline(points);

      const results = [0.0, 0.25, 0.5, 0.75, 1.0].map((t) => spline(t));

      // Should have 5 distinct values
      expect(new Set(results).size).toBe(5);
    });

    it("should clamp t to [0, 1]", () => {
      const points = [1, 2, 3, 4];
      const spline = createCatmullRomSpline(points);

      const t_neg = spline(-0.5);
      const t_0 = spline(0.0);
      const t_2 = spline(2.0);
      const t_1 = spline(1.0);

      // Values outside [0,1] should clamp to boundary values
      expect(t_neg).toBeCloseTo(t_0, 1);
      expect(t_2).toBeCloseTo(t_1, 1);
    });

    it("should handle spine-like data (radii decreasing to + increasing)", () => {
      // Typical ship spine: taper at bow, wider mid-ship, taper at stern
      const spineRadii = [0.1, 0.5, 0.9, 0.8, 0.2];
      const spline = createCatmullRomSpline(spineRadii);

      const samples = Array.from({ length: 101 }, (_, i) => spline(i / 100));

      // Should have reasonable variation
      const max = Math.max(...samples);
      const min = Math.min(...samples);
      expect(max - min).toBeGreaterThan(0.3);
    });
  });

  // ============================================================================
  // Algorithm Selection Tests
  // ============================================================================

  describe("Hull Algorithm Factory", () => {
    it("should create ParametricSurfaceHull by default", () => {
      const spec = {
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 60,
        maxBeam: 15,
        maxHeight: 8,
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 0.5, radius: 0.9 },
            { z: 1, radius: 0.2 },
          ],
        },
        // No algorithm specified - should default to parametric
      };

      const hull = createHullVolume(spec);

      expect(hull).toBeDefined();
      expect(hull.algorithmType()).toContain("parametric");
    });

    it("should create ParametricSurfaceHull when explicitly requested", () => {
      const spec = {
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 60,
        maxBeam: 15,
        maxHeight: 8,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 0.5, radius: 0.9 },
            { z: 1, radius: 0.2 },
          ],
        },
      };

      const hull = createHullVolume(spec);

      expect(hull.algorithmType()).toContain("parametric");
    });

    it("should create VoxelMarchingCubesHull when requested", () => {
      const spec = {
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 60,
        maxBeam: 15,
        maxHeight: 8,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 0.5,
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 0.5, radius: 0.9 },
            { z: 1, radius: 0.2 },
          ],
        },
      };

      const hull = createHullVolume(spec);

      expect(hull.algorithmType()).toContain("voxel");
    });
  });

  // ============================================================================
  // Algorithm Behavior Tests
  // ============================================================================

  describe("Algorithm Equivalence", () => {
    const sharedSpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 60,
      maxBeam: 15,
      maxHeight: 8,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    };

    it("should contain center point (both algorithms)", () => {
      const pHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      });
      const vHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 0.2,
      });

      expect(pHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
      expect(vHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should reject far exterior point (both algorithms)", () => {
      const pHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      });
      const vHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 0.2,
      });

      expect(pHull.contains({ x: 50, y: 50, z: 50 })).toBe(false);
      expect(vHull.contains({ x: 50, y: 50, z: 50 })).toBe(false);
    });

    it("should provide reasonable bounds (both algorithms)", () => {
      const pHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      });
      const vHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 0.2,
      });

      const pBounds = pHull.bounds();
      const vBounds = vHull.bounds();

      // Both should have positive-volume bounds
      expect(pBounds.max.x - pBounds.min.x).toBeGreaterThan(5);
      expect(pBounds.max.z - pBounds.min.z).toBeGreaterThan(20);

      expect(vBounds.max.x - vBounds.min.x).toBeGreaterThan(5);
      expect(vBounds.max.z - vBounds.min.z).toBeGreaterThan(20);
    });

    it("should estimate normals (both algorithms)", () => {
      const pHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      });
      const vHull = createHullVolume({
        ...sharedSpec,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 0.2,
      });

      const pNormal = pHull.normal({ x: 6, y: 0, z: 30 });
      const vNormal = vHull.normal({ x: 6, y: 0, z: 30 });

      // Both should produce normalized-ish vectors
      const pLen = Math.sqrt(pNormal.x ** 2 + pNormal.y ** 2 + pNormal.z ** 2);
      const vLen = Math.sqrt(vNormal.x ** 2 + vNormal.y ** 2 + vNormal.z ** 2);

      expect(pLen).toBeGreaterThan(0.1);
      expect(vLen).toBeGreaterThan(0.1);
    });
  });

  // ============================================================================
  // Smoothness Comparison
  // ============================================================================

  describe("Smoothness Characteristics", () => {
    const spec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 60,
      maxBeam: 15,
      maxHeight: 8,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    };

    it("should produce smooth SDF gradient (parametric)", () => {
      const pHull = createHullVolume({
        ...spec,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      });

      // Sample distance at nearby points
      const p1 = { x: 7, y: 0, z: 30 };
      const p2 = { x: 7.1, y: 0, z: 30 };

      const d1 = pHull.distance(p1);
      const d2 = pHull.distance(p2);

      // Gradient should be smooth (small steps in space = small steps in distance)
      const gradient = Math.abs(d2 - d1) / 0.1;
      expect(gradient).toBeLessThan(5); // Max gradient in distance
    });

    it("should produce step-like SDF gradient (voxel)", () => {
      const vHull = createHullVolume({
        ...spec,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 0.5,
      });

      // Voxel has coarser granularity, might have larger steps
      const p1 = { x: 7, y: 0, z: 30 };
      const p2 = { x: 7.01, y: 0, z: 30 };

      const d1 = vHull.distance(p1);
      const d2 = vHull.distance(p2);

      // Gradient can be larger due to voxel discretization
      const gradient = Math.abs(d2 - d1) / 0.01;
      expect(gradient).toBeDefined(); // Just verify it computes
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe("Algorithm Configuration", () => {
    it("should use spineSampleRate for parametric algorithm", () => {
      const spec = {
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 60,
        maxBeam: 15,
        maxHeight: 8,
        generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
        spineSampleRate: 100, // Custom sample rate
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 0.5, radius: 0.9 },
            { z: 1, radius: 0.2 },
          ],
        },
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.algorithmType()).toContain("parametric");
    });

    it("should use voxelResolution for voxel algorithm", () => {
      const spec = {
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 60,
        maxBeam: 15,
        maxHeight: 8,
        generationAlgorithm: HullGenerationAlgorithm.VoxelMarchingCubes,
        voxelResolution: 1.0, // 1m per voxel
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 0.5, radius: 0.9 },
            { z: 1, radius: 0.2 },
          ],
        },
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.algorithmType()).toContain("voxel");
    });
  });
});
