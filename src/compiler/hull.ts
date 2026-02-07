/**
 * Hull compilation module
 * Responsible for converting hull spec into queryable geometry
 * Supports dual algorithms: parametric surface (high quality) and voxel marching cubes (fast)
 */

import { HullSpec, Vector3, AABB, Vector2, HullGenerationAlgorithm, SectionShape } from "@core/index";
import { createCatmullRomSpline, evaluateSuperellipse } from "@utils/parametricSurfaceUtils";

/**
 * Represents a queryable hull volume
 * Supports spatial queries needed by the compilation pipeline
 * Algorithm-independent interface
 */
export interface HullVolume {
  /**
   * Test if a 3D point is inside the hull
   */
  contains(p: Vector3): boolean;

  /**
   * Calculate signed distance from point to hull surface
   * Negative = inside, positive = outside
   */
  distance(p: Vector3): number;

  /**
   * Approximate surface normal at a point on or near the hull
   */
  normal(p: Vector3): Vector3;

  /**
   * Get axis-aligned bounding box of hull
   */
  bounds(): AABB;

  /**
   * Slice hull at given Y coordinate, returning 2D polygon in X/Z plane
   * Resolution: sampling density in meters
   */
  sliceY(y: number, resolution: number): Vector2[];

  /**
   * String identifier for algorithm type (used for debug/logging)
   */
  algorithmType(): string;
}

/**
 * Base class for hull implementations with common utilities
 */
abstract class BaseHull implements HullVolume {
  protected spec: HullSpec;

  constructor(spec: HullSpec) {
    this.spec = spec;
  }

  abstract contains(p: Vector3): boolean;
  abstract distance(p: Vector3): number;
  abstract normal(p: Vector3): Vector3;
  abstract bounds(): AABB;
  abstract sliceY(y: number, resolution: number): Vector2[];
  abstract algorithmType(): string;

  /**
   * Apply symmetry to a point's X coordinate
   * Returns the effective X for distance calculations
   */
  protected applySymmetry(x: number): number {
    switch (this.spec.symmetry) {
      case "x":
        return Math.abs(x);
      case "y":
        return x; // Y symmetry handled separately in subclass
      case "z":
        return x; // Z symmetry handled separately in subclass
      default:
        return x;
    }
  }

  /**
   * Get effective bounds considering symmetry
   */
  protected getEffectiveBounds(): AABB {
    const { length, maxBeam, maxHeight } = this.spec;

    return {
      min: {
        x: -maxBeam / 2,
        y: -maxHeight / 2,
        z: -length / 2,
      },
      max: {
        x: maxBeam / 2,
        y: maxHeight / 2,
        z: length / 2,
      },
    };
  }
}

/**
 * Catmull-Rom Spline + Parametric Surface Hull (High Quality, Default)
 * Smooth interpolation through spine control points
 * Native UV coordinate support
 */
export class ParametricSurfaceHull extends BaseHull {
  private radiusSpline: (t: number) => number;
  private zSpline: (t: number) => number;

  constructor(spec: HullSpec) {
    super(spec);
    this.radiusSpline = this.createRadiusSpline();
    this.zSpline = this.createZSpline();
  }

  private createRadiusSpline(): (t: number) => number {
    const radiusValues = this.spec.spine.points.map((p) => p.radius);
    return createCatmullRomSpline(radiusValues);
  }

  private createZSpline(): (t: number) => number {
    const zValues = this.spec.spine.points.map((p) => p.z);
    // Z values are already normalized [0..1], so we can use directly
    // Create a spline that interpolates through them
    return createCatmullRomSpline(zValues);
  }

  contains(p: Vector3): boolean {
    return this.distance(p) <= 0;
  }

  distance(p: Vector3): number {
    const { length, maxBeam, maxHeight } = this.spec;
    const topBias = this.spec.topBias ?? 1.0;

    // Normalize Z to [0, 1]
    const zNorm = (p.z + length / 2) / length;
    const zClamped = Math.max(0, Math.min(1, zNorm));

    // Get radius at this Z using Catmull-Rom spline
    let radiusNorm = this.radiusSpline(zClamped);
    if (isNaN(radiusNorm)) radiusNorm = 0.5; // Fallback

    // Calculate ellipsoid radii
    const rx = radiusNorm * (maxBeam / 2);
    const ry = radiusNorm * (maxHeight / 2) * topBias;

    // Apply symmetry to X
    const x = this.applySymmetry(p.x);

    // Evaluate cross-section shape
    let theta = Math.atan2(p.y, x);
    if (theta < 0) theta += Math.PI * 2;

    const sectionShape = (this.spec.sectionShape ?? SectionShape.Ellipse) as SectionShape;
    const shapeParams = this.spec.shapeParams;
    const n = shapeParams?.n ?? 2;
    const m = shapeParams?.m ?? 2;

    // Get point on the section boundary
    const boundaryPoint = evaluateSuperellipse(theta, rx, ry, n, m);
    const distRadius = Math.sqrt(boundaryPoint.x ** 2 + boundaryPoint.z ** 2);
    const pointRadius = Math.sqrt(x ** 2 + p.y ** 2);

    return pointRadius - distRadius;
  }

  normal(p: Vector3): Vector3 {
    // Gradient estimation via finite differences
    const eps = 0.1;
    const d0 = this.distance(p);

    const dx = this.distance({ ...p, x: p.x + eps }) - d0;
    const dy = this.distance({ ...p, y: p.y + eps }) - d0;
    const dz = this.distance({ ...p, z: p.z + eps }) - d0;

    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length < 1e-6) {
      return { x: 0, y: 1, z: 0 };
    }

    return {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };
  }

  bounds(): AABB {
    return this.getEffectiveBounds();
  }

  sliceY(y: number, resolution: number): Vector2[] {
    const { length, maxBeam } = this.spec;
    const topBias = this.spec.topBias ?? 1.0;
    const polygon: Vector2[] = [];
    const maxSamples = Math.ceil((length * 2) / resolution);

    for (let i = 0; i <= maxSamples; i++) {
      const z = (-length / 2) + (i / maxSamples) * length;

      // Binary search for X boundary at this Z
      let xMin = 0;
      let xMax = maxBeam / 2;

      for (let iter = 0; iter < 15; iter++) {
        const xMid = (xMin + xMax) / 2;
        if (this.contains({ x: xMid, y, z })) {
          xMin = xMid;
        } else {
          xMax = xMid;
        }
      }

      const xBoundary = xMin;
      polygon.push({ x: xBoundary, z });
    }

    // Add symmetry
    if (this.spec.symmetry === "x") {
      for (let i = polygon.length - 1; i >= 0; i--) {
        polygon.push({
          x: -polygon[i].x,
          z: polygon[i].z,
        });
      }
    }

    return polygon;
  }

  algorithmType(): string {
    return "parametric_surface_catmull_rom";
  }
}

/**
 * Voxel Marching Cubes Hull (Fast, Preview)
 * Existing MVP implementation kept for backward compatibility and fast iteration
 */
export class VoxelMarchingCubesHull extends BaseHull {
  private radiusFunction: (z: number) => number;

  constructor(spec: HullSpec) {
    super(spec);
    this.radiusFunction = this.createRadiusFunction();
  }

  private createRadiusFunction(): (z: number) => number {
    const points = this.spec.spine.points;

    return (z: number): number => {
      z = Math.max(0, Math.min(1, z));

      let i = 0;
      while (i < points.length - 1 && points[i + 1].z < z) {
        i++;
      }

      const p0 = points[i];
      const p1 = points[i + 1];

      if (!p1) {
        return p0.radius;
      }

      // Linear interpolation (legacy MVP behavior)
      const t = (z - p0.z) / (p1.z - p0.z);
      return p0.radius + (p1.radius - p0.radius) * t;
    };
  }

  contains(p: Vector3): boolean {
    return this.distance(p) <= 0;
  }

  distance(p: Vector3): number {
    const { length, maxBeam, maxHeight } = this.spec;
    const topBias = this.spec.topBias ?? 1.0;

    // Normalize Z to [0, 1]
    const zNorm = (p.z + length / 2) / length;
    const zNormClamped = Math.max(0, Math.min(1, zNorm));

    // Get radius at this Z (linear interpolation)
    const radiusNorm = this.radiusFunction(zNormClamped);
    const rx = radiusNorm * (maxBeam / 2);
    const ry = radiusNorm * (maxHeight / 2) * topBias;

    // Account for X symmetry
    const x = this.applySymmetry(p.x);

    // Compute normalized radial distance in X/Y plane
    const q = Math.sqrt((x / rx) ** 2 + (p.y / ry) ** 2);

    // Distance estimate (approximate SDF)
    const minR = Math.min(rx, ry);
    return (q - 1) * minR;
  }

  normal(p: Vector3): Vector3 {
    // Gradient estimation via finite differences
    const eps = 0.1;
    const d0 = this.distance(p);

    const dx = this.distance({ ...p, x: p.x + eps }) - d0;
    const dy = this.distance({ ...p, y: p.y + eps }) - d0;
    const dz = this.distance({ ...p, z: p.z + eps }) - d0;

    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length < 1e-6) {
      return { x: 0, y: 1, z: 0 };
    }

    return {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };
  }

  bounds(): AABB {
    return this.getEffectiveBounds();
  }

  sliceY(y: number, resolution: number): Vector2[] {
    const { length, maxBeam } = this.spec;
    const polygon: Vector2[] = [];
    const maxSamples = Math.ceil((length * 2) / resolution);

    for (let i = 0; i <= maxSamples; i++) {
      const z = (-length / 2) + (i / maxSamples) * length;

      // Binary search for X boundary at this Z
      let xMin = 0;
      let xMax = maxBeam / 2;

      for (let iter = 0; iter < 10; iter++) {
        const xMid = (xMin + xMax) / 2;
        if (this.contains({ x: xMid, y, z })) {
          xMin = xMid;
        } else {
          xMax = xMid;
        }
      }

      const xBoundary = xMin;
      polygon.push({ x: xBoundary, z });
    }

    // Add starboard side (mirror)
    if (this.spec.symmetry === "x") {
      for (let i = polygon.length - 1; i >= 0; i--) {
        polygon.push({
          x: -polygon[i].x,
          z: polygon[i].z,
        });
      }
    }

    return polygon;
  }

  algorithmType(): string {
    return "voxel_marching_cubes_linear";
  }
}

/**
 * Factory function to create hull volumes from spec
 * Selects algorithm based on spec.generationAlgorithm (default: parametric_surface)
 */
export function createHullVolume(spec: HullSpec): HullVolume {
  if (spec.type !== "lofted_spine") {
    throw new Error(`Unknown hull type: ${spec.type}`);
  }

  const algorithm = spec.generationAlgorithm ?? HullGenerationAlgorithm.ParametricSurface;

  switch (algorithm) {
    case HullGenerationAlgorithm.ParametricSurface:
      console.log("✓ Creating parametric surface hull (Catmull-Rom spline)");
      return new ParametricSurfaceHull(spec);

    case HullGenerationAlgorithm.VoxelMarchingCubes:
      console.log("✓ Creating voxel marching cubes hull (fast preview)");
      return new VoxelMarchingCubesHull(spec);

    default:
      throw new Error(`Unknown hull generation algorithm: ${algorithm}`);
  }
}
