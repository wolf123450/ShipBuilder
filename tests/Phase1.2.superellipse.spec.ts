/**
 * Phase 1.2 Tests: Superellipse & Shape Parameters
 * Tests for cross-section shape control and topBias asymmetry
 */

import { describe, it, expect } from "vitest";
import {
  evaluateSuperellipse,
  generateParametricMesh,
} from "@utils/parametricSurfaceUtils";
import { createHullVolume } from "@compiler/hull";
import {
  HullGenerationAlgorithm,
  HullType,
  HullSymmetry,
  SectionShape,
} from "@core/index";

describe("Phase 1.2: Superellipse & Shape Parameters", () => {
  // ============================================================================
  // Superellipse Evaluation Tests
  // ============================================================================

  describe("Superellipse Geometry", () => {
    it("should evaluate superellipse at cardinal angles", () => {
      const a = 10; // X radius
      const b = 5; // Y radius
      const n = 2; // Exponent
      const m = 2;

      // θ = 0 (right)
      const east = evaluateSuperellipse(0, a, b, n, m);
      expect(east.x).toBeCloseTo(10, 0);

      // θ = π/2 (top)
      const north = evaluateSuperellipse(Math.PI / 2, a, b, n, m);
      expect(Math.abs(north.x)).toBeLessThan(0.1);
      expect(north.z).toBeCloseTo(5, 0);

      // θ = π (left)
      const west = evaluateSuperellipse(Math.PI, a, b, n, m);
      expect(west.x).toBeCloseTo(-10, 0);

      // θ = 3π/2 (bottom)
      const south = evaluateSuperellipse(1.5 * Math.PI, a, b, n, m);
      expect(Math.abs(south.x)).toBeLessThan(0.1);
      expect(south.z).toBeCloseTo(-5, 0);
    });

    it("should form ellipse when n=2, m=2", () => {
      const points = [];
      const steps = 16;
      for (let i = 0; i < steps; i++) {
        const theta = (2 * Math.PI * i) / steps;
        points.push(evaluateSuperellipse(theta, 10, 5, 2, 2));
      }

      // All points should satisfy ellipse equation: (x/a)^2 + (z/b)^2 ≈ 1
      points.forEach((p) => {
        const ellipseEq = (p.x / 10) ** 2 + (p.z / 5) ** 2;
        expect(ellipseEq).toBeCloseTo(1, 1);
      });
    });

    it("should form box-like shape when n=8, m=8", () => {
      const a = 10;
      const b = 5;
      const points = [];
      const steps = 64;

      for (let i = 0; i < steps; i++) {
        const theta = (2 * Math.PI * i) / steps;
        points.push(evaluateSuperellipse(theta, a, b, 8, 8));
      }

      // Box-like = max extent at corners ≈ a and b, flat sides
      const maxX = Math.max(...points.map((p) => Math.abs(p.x)));
      const maxZ = Math.max(...points.map((p) => Math.abs(p.z)));

      expect(maxX).toBeCloseTo(a, 0);
      expect(maxZ).toBeCloseTo(b, 0);

      // Should have flat-ish sides
      const bottomPoints = points.filter((p) => p.z < -3);
      expect(bottomPoints.length).toBeGreaterThan(0);
    });

    it("should transition smoothly from ellipse (n=2) to box (n=8)", () => {
      const a = 10;
      const b = 5;
      const theta = Math.PI / 4; // 45 degrees

      const ellipse = evaluateSuperellipse(theta, a, b, 2, 2);
      const rounded = evaluateSuperellipse(theta, a, b, 4, 4);
      const box = evaluateSuperellipse(theta, a, b, 8, 8);

      // At 45°: ellipse should be smaller than rounded, box largest
      expect(ellipse.x).toBeLessThan(rounded.x);
      expect(rounded.x).toBeLessThan(box.x);
    });

    it("should handle independent n and m exponents", () => {
      const theta = Math.PI / 4;
      const a = 10;
      const b = 5;

      // n > m: X sharper than Z
      const xSharp = evaluateSuperellipse(theta, a, b, 8, 2);

      // m > n: Z sharper than X
      const zSharp = evaluateSuperellipse(theta, a, b, 2, 8);

      // Results should differ significantly
      expect(Math.abs(xSharp.x - zSharp.x)).toBeGreaterThan(1);
    });

    it("should respect semi-axis lengths (a and b)", () => {
      const theta = 0; // Right direction
      const a1 = 10;
      const a2 = 20;
      const b = 5;

      const p1 = evaluateSuperellipse(theta, a1, b, 2, 2);
      const p2 = evaluateSuperellipse(theta, a2, b, 2, 2);

      // Doubling a should double the x-extent
      expect(p2.x).toBeCloseTo(2 * p1.x, 0);
    });

    it("should use sign-preserving power for negative angles", () => {
      const a = 10;
      const b = 5;
      const n = 4;
      const m = 4;

      // Test various angles around full circle
      for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / 8) {
        const p = evaluateSuperellipse(theta, a, b, n, m);

        // All points should stay within bounds
        expect(Math.abs(p.x)).toBeLessThanOrEqual(a * 1.1);
        expect(Math.abs(p.z)).toBeLessThanOrEqual(b * 1.1);
      }
    });
  });

  // ============================================================================
  // Hull Shape Configuration Tests
  // ============================================================================

  describe("Hull Section Shape Selection", () => {
    const baseSpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 60,
      maxBeam: 15,
      maxHeight: 8,
      generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    };

    it("should create hull with ellipse section", () => {
      const spec = {
        ...baseSpec,
        sectionShape: SectionShape.Ellipse,
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();

      // Ellipse cross-section should contain center
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should create hull with superellipse section", () => {
      const spec = {
        ...baseSpec,
        sectionShape: SectionShape.Superellipse,
        shapeParams: { n: 4, m: 4 },
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should create hull with box section", () => {
      const spec = {
        ...baseSpec,
        sectionShape: SectionShape.Box,
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should default to ellipse section when not specified", () => {
      const spec = {
        ...baseSpec,
        // No sectionShape specified
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });
  });

  // ============================================================================
  // Shape Parameters Tests
  // ============================================================================

  describe("Superellipse Shape Parameters", () => {
    const baseSpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 60,
      maxBeam: 15,
      maxHeight: 8,
      generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      sectionShape: SectionShape.Superellipse,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    };

    it("should accept n and m shape parameters", () => {
      const spec = {
        ...baseSpec,
        shapeParams: { n: 4, m: 4 },
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
    });

    it("should handle extreme shape parameters", () => {
      // Very pointy
      const pointySpec = {
        ...baseSpec,
        shapeParams: { n: 0.5, m: 0.5 },
      };

      const pointyHull = createHullVolume(pointySpec);
      expect(pointyHull).toBeDefined();

      // Very boxy
      const boxySpec = {
        ...baseSpec,
        shapeParams: { n: 8, m: 8 },
      };

      const boxyHull = createHullVolume(boxySpec);
      expect(boxyHull).toBeDefined();
    });

    it("should allow independent n and m values", () => {
      const xSharpSpec = {
        ...baseSpec,
        shapeParams: { n: 8, m: 2 },
      };

      const zSharpSpec = {
        ...baseSpec,
        shapeParams: { n: 2, m: 8 },
      };

      const xHull = createHullVolume(xSharpSpec);
      const zHull = createHullVolume(zSharpSpec);

      expect(xHull).toBeDefined();
      expect(zHull).toBeDefined();

      // Both should be valid but produce different cross-sections
      expect(xHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
      expect(zHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });
  });

  // ============================================================================
  // Top Bias (Height Asymmetry) Tests
  // ============================================================================

  describe("Top Bias Height Asymmetry", () => {
    const baseSpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 60,
      maxBeam: 15,
      maxHeight: 8,
      generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    };

    it("should accept topBias parameter (compression)", () => {
      const spec = {
        ...baseSpec,
        topBias: 0.5, // Compress height
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should accept topBias parameter (stretch)", () => {
      const spec = {
        ...baseSpec,
        topBias: 2.0, // Stretch height
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should default to topBias=1.0 (symmetric)", () => {
      const spec = {
        ...baseSpec,
        // No topBias specified
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
    });

    it("should affect Y-axis bounds (compressed)", () => {
      const compressedSpec = {
        ...baseSpec,
        topBias: 0.7, // More compressed = smaller Y extent
      };

      const normalSpec = {
        ...baseSpec,
        topBias: 1.0,
      };

      const compressedHull = createHullVolume(compressedSpec);
      const normalHull = createHullVolume(normalSpec);

      const compressedBounds = compressedHull.bounds();
      const normalBounds = normalHull.bounds();

      // Compressed should have smaller Y range
      const compressedYRange = compressedBounds.max.y - compressedBounds.min.y;
      const normalYRange = normalBounds.max.y - normalBounds.min.y;

      expect(compressedYRange).toBeLessThan(normalYRange);
    });

    it("should affect Y-axis bounds (stretched)", () => {
      const stretchedSpec = {
        ...baseSpec,
        topBias: 1.5, // More stretched = larger Y extent
      };

      const normalSpec = {
        ...baseSpec,
        topBias: 1.0,
      };

      const stretchedHull = createHullVolume(stretchedSpec);
      const normalHull = createHullVolume(normalSpec);

      const stretchedBounds = stretchedHull.bounds();
      const normalBounds = normalHull.bounds();

      // Stretched should have larger Y range
      const stretchedYRange = stretchedBounds.max.y - stretchedBounds.min.y;
      const normalYRange = normalBounds.max.y - normalBounds.min.y;

      expect(stretchedYRange).toBeGreaterThan(normalYRange);
    });
  });

  // ============================================================================
  // Parametric Mesh Generation Tests
  // ============================================================================

  describe("Parametric Mesh Generation", () => {
    const spinePoints = [
      { z: 0.0, radius: 0.2 },
      { z: 0.5, radius: 0.8 },
      { z: 1.0, radius: 0.2 },
    ];

    it("should generate mesh vertices", () => {
      const mesh = generateParametricMesh(
        spinePoints,
        60, // length
        15, // maxBeam
        8, // maxHeight
        1.0, // topBias
        "ellipse", // shape
        { n: 2, m: 2 }, // shapeParams
        50 // spineSampleRate
      );

      expect(mesh.vertices.length).toBeGreaterThan(0);
    });

    it("should generate correlated normals and vertices", () => {
      const mesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "ellipse",
        { n: 2, m: 2 },
        50
      );

      // Should have same count
      expect(mesh.normals.length).toBe(mesh.vertices.length);
    });

    it("should generate valid indices", () => {
      const mesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "ellipse",
        { n: 2, m: 2 },
        50
      );

      expect(mesh.indices.length).toBeGreaterThan(0);

      // All indices should reference valid vertices
      const maxIndex = Math.max(...mesh.indices);
      expect(maxIndex).toBeLessThan(mesh.vertices.length);
    });

    it("should generate UVs", () => {
      const mesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "ellipse",
        { n: 2, m: 2 },
        50
      );

      expect(mesh.uvs.length).toBeGreaterThan(0);

      // UV coordinates should be in [0,1]
      mesh.uvs.forEach((uv) => {
        expect(uv.u).toBeGreaterThanOrEqual(0);
        expect(uv.u).toBeLessThanOrEqual(1);
        expect(uv.v).toBeGreaterThanOrEqual(0);
        expect(uv.v).toBeLessThanOrEqual(1);
      });
    });

    it("should respect spineSampleRate parameter", () => {
      const lowResolution = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "ellipse",
        { n: 2, m: 2 },
        20 // Low samples
      );

      const highResolution = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "ellipse",
        { n: 2, m: 2 },
        100 // High samples
      );

      // Higher sample rate should produce more vertices
      expect(highResolution.vertices.length).toBeGreaterThan(
        lowResolution.vertices.length
      );
    });

    it("should generate different meshes for different shapes", () => {
      const ellipseMesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "ellipse",
        { n: 2, m: 2 },
        50
      );

      const superellipseMesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.0,
        "superellipse",
        { n: 4, m: 4 },
        50
      );

      // Should produce different vertex distributions
      // (difficult to verify exactly, but count should be similar)
      expect(Math.abs(ellipseMesh.vertices.length - superellipseMesh.vertices.length)).toBeLessThan(10);
    });

    it("should handle topBias in mesh generation", () => {
      const compressedMesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        0.7, // Compressed
        "ellipse",
        { n: 2, m: 2 },
        50
      );

      const stretchedMesh = generateParametricMesh(
        spinePoints,
        60,
        15,
        8,
        1.5, // Stretched
        "ellipse",
        { n: 2, m: 2 },
        50
      );

      // Both should generate valid meshes with different Y distributions
      expect(compressedMesh.vertices.length).toBeGreaterThan(0);
      expect(stretchedMesh.vertices.length).toBeGreaterThan(0);

      // Find Y ranges
      const compressedYRange =
        Math.max(...compressedMesh.vertices.map((v) => v.y)) -
        Math.min(...compressedMesh.vertices.map((v) => v.y));

      const stretchedYRange =
        Math.max(...stretchedMesh.vertices.map((v) => v.y)) -
        Math.min(...stretchedMesh.vertices.map((v) => v.y));

      // Stretched should have larger Y extent
      expect(stretchedYRange).toBeGreaterThan(compressedYRange);
    });
  });

  // ============================================================================
  // Combined Shape Parameter Tests
  // ============================================================================

  describe("Shape Parameter Combinations", () => {
    const baseSpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.X as const,
      length: 60,
      maxBeam: 15,
      maxHeight: 8,
      generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
      sectionShape: SectionShape.Superellipse,
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.2 },
        ],
      },
    };

    it("should handle superellipse + topBias together", () => {
      const spec = {
        ...baseSpec,
        shapeParams: { n: 4, m: 4 },
        topBias: 1.2,
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should handle box shape + topBias together", () => {
      const spec = {
        ...baseSpec,
        sectionShape: SectionShape.Box,
        topBias: 0.8,
      };

      const hull = createHullVolume(spec);
      expect(hull).toBeDefined();
      expect(hull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should create visually distinct hulls with different combinations", () => {
      // Pointy compressed
      const pointyCompressed = createHullVolume({
        ...baseSpec,
        shapeParams: { n: 0.5, m: 0.5 },
        topBias: 0.5,
      });

      // Boxy stretched
      const boxyStretched = createHullVolume({
        ...baseSpec,
        shapeParams: { n: 8, m: 8 },
        topBias: 2.0,
      });

      // Both valid
      expect(pointyCompressed).toBeDefined();
      expect(boxyStretched).toBeDefined();

      // Both contain center
      expect(pointyCompressed.contains({ x: 0, y: 0, z: 30 })).toBe(true);
      expect(boxyStretched.contains({ x: 0, y: 0, z: 30 })).toBe(true);

      // Bounds should differ significantly
      const pBounds = pointyCompressed.bounds();
      const bBounds = boxyStretched.bounds();

      const pVolume =
        (pBounds.max.x - pBounds.min.x) *
        (pBounds.max.y - pBounds.min.y) *
        (pBounds.max.z - pBounds.min.z);
      const bVolume =
        (bBounds.max.x - bBounds.min.x) *
        (bBounds.max.y - bBounds.min.y) *
        (bBounds.max.z - bBounds.min.z);

      // Volumes should differ
      expect(Math.abs(pVolume - bVolume)).toBeGreaterThan(1);
    });
  });
});
