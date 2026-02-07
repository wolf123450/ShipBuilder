/**
 * Hull compilation module
 * Responsible for converting hull spec into queryable geometry
 * Supports dual algorithms: parametric surface (high quality) and voxel marching cubes (fast)
 * Also supports multi-hull compositions and transformations
 */

import { HullSpec, Vector3, AABB, Vector2, HullGenerationAlgorithm, SectionShape, WorldTransform } from "@core/index";
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
 * Transformed Hull Wrapper
 * Applies a 3D transformation (position, rotation, scale) to a base hull
 * Useful for placing secondary hulls in world space
 */
export class TransformedHull extends BaseHull implements HullVolume {
  private baseHull: HullVolume;
  private transform: WorldTransform;
  private transformedBounds: AABB;

  constructor(baseHull: HullVolume, spec: HullSpec) {
    super(spec);
    this.baseHull = baseHull;
    this.transform = spec.worldTransform ?? {};
    this.transformedBounds = this.computeTransformedBounds();
  }

  private computeTransformedBounds(): AABB {
    const baseBounds = this.baseHull.bounds();
    const pos = this.transform.position ?? { x: 0, y: 0, z: 0 };
    const scale = this.transform.scale ?? 1.0;

    return {
      min: {
        x: baseBounds.min.x * scale + pos.x,
        y: baseBounds.min.y * scale + pos.y,
        z: baseBounds.min.z * scale + pos.z,
      },
      max: {
        x: baseBounds.max.x * scale + pos.x,
        y: baseBounds.max.y * scale + pos.y,
        z: baseBounds.max.z * scale + pos.z,
      },
    };
  }

  private worldToLocal(p: Vector3): Vector3 {
    const pos = this.transform.position ?? { x: 0, y: 0, z: 0 };
    const scale = this.transform.scale ?? 1.0;
    const rot = this.transform.rotation ?? { x: 0, y: 0, z: 0 };

    let local = {
      x: p.x - pos.x,
      y: p.y - pos.y,
      z: p.z - pos.z,
    };

    local.x /= scale;
    local.y /= scale;
    local.z /= scale;

    const rx = ((rot.x ?? 0) * Math.PI) / 180;
    const ry = ((rot.y ?? 0) * Math.PI) / 180;
    const rz = ((rot.z ?? 0) * Math.PI) / 180;

    let cosZ = Math.cos(-rz);
    let sinZ = Math.sin(-rz);
    let xRot = local.x * cosZ - local.z * sinZ;
    let zRot = local.x * sinZ + local.z * cosZ;
    local.x = xRot;
    local.z = zRot;

    let cosY = Math.cos(-ry);
    let sinY = Math.sin(-ry);
    xRot = local.x * cosY + local.z * sinY;
    zRot = -local.x * sinY + local.z * cosY;
    local.x = xRot;
    local.z = zRot;

    let cosX = Math.cos(-rx);
    let sinX = Math.sin(-rx);
    let yRot = local.y * cosX - local.z * sinX;
    zRot = local.y * sinX + local.z * cosX;
    local.y = yRot;
    local.z = zRot;

    return local;
  }

  contains(p: Vector3): boolean {
    return this.baseHull.contains(this.worldToLocal(p));
  }

  distance(p: Vector3): number {
    const scale = this.transform.scale ?? 1.0;
    return this.baseHull.distance(this.worldToLocal(p)) * scale;
  }

  normal(p: Vector3): Vector3 {
    return this.baseHull.normal(this.worldToLocal(p));
  }

  bounds(): AABB {
    return this.transformedBounds;
  }

  sliceY(y: number, resolution: number): Vector2[] {
    const pos = this.transform.position ?? { x: 0, y: 0, z: 0 };
    const localY = y - pos.y;
    return this.baseHull.sliceY(localY, resolution);
  }

  algorithmType(): string {
    return `transformed_${this.baseHull.algorithmType()}`;
  }
}

/**
 * Union Hull - Logical OR of multiple hull volumes
 */
export class UnionHull extends BaseHull implements HullVolume {
  private hulls: HullVolume[];

  constructor(hulls: HullVolume[], spec: HullSpec) {
    super(spec);
    this.hulls = hulls;
  }

  contains(p: Vector3): boolean {
    return this.hulls.some((hull) => hull.contains(p));
  }

  distance(p: Vector3): number {
    let minDist = Number.POSITIVE_INFINITY;
    for (const hull of this.hulls) {
      const d = hull.distance(p);
      if (d < minDist) {
        minDist = d;
      }
    }
    return minDist;
  }

  normal(p: Vector3): Vector3 {
    let closestHull = this.hulls[0];
    let minDist = Math.abs(this.hulls[0].distance(p));

    for (let i = 1; i < this.hulls.length; i++) {
      const d = Math.abs(this.hulls[i].distance(p));
      if (d < minDist) {
        minDist = d;
        closestHull = this.hulls[i];
      }
    }

    return closestHull.normal(p);
  }

  bounds(): AABB {
    if (this.hulls.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    let bounds = this.hulls[0].bounds();
    for (let i = 1; i < this.hulls.length; i++) {
      const b = this.hulls[i].bounds();
      bounds = {
        min: {
          x: Math.min(bounds.min.x, b.min.x),
          y: Math.min(bounds.min.y, b.min.y),
          z: Math.min(bounds.min.z, b.min.z),
        },
        max: {
          x: Math.max(bounds.max.x, b.max.x),
          y: Math.max(bounds.max.y, b.max.y),
          z: Math.max(bounds.max.z, b.max.z),
        },
      };
    }
    return bounds;
  }

  sliceY(y: number, resolution: number): Vector2[] {
    if (this.hulls.length === 0) return [];
    return this.hulls[0].sliceY(y, resolution);
  }

  algorithmType(): string {
    return `union_${this.hulls.length}_hulls`;
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

  let primaryHull: HullVolume;

  switch (algorithm) {
    case HullGenerationAlgorithm.ParametricSurface:
      console.log("✓ Creating parametric surface hull (Catmull-Rom spline)");
      primaryHull = new ParametricSurfaceHull(spec);
      break;

    case HullGenerationAlgorithm.VoxelMarchingCubes:
      console.log("✓ Creating voxel marching cubes hull (fast preview)");
      primaryHull = new VoxelMarchingCubesHull(spec);
      break;

    default:
      throw new Error(`Unknown hull generation algorithm: ${algorithm}`);
  }

  // If this is a primary hull with secondary hulls, wrap in Union
  // Note: Secondary hulls should be passed separately through the compiler
  // This factory only creates individual hulls
  return primaryHull;
}

/**
 * Factory function to create a multi-hull composition
 * Combines primary hull with secondary hulls into a UnionHull
 *
 * @param primarySpec Primary hull specification
 * @param secondarySpecs Optional array of secondary hull specifications
 * @returns UnionHull if secondaries provided, otherwise primary hull
 */
export function createMultiHullVolume(primarySpec: HullSpec, secondarySpecs?: HullSpec[]): HullVolume {
  const primaryHull = createHullVolume(primarySpec);

  if (!secondarySpecs || secondarySpecs.length === 0) {
    return primaryHull;
  }

  console.log(`✓ Composing ${secondarySpecs.length} secondary hull(s) with primary hull`);

  const allHulls: HullVolume[] = [primaryHull];

  for (const secondarySpec of secondarySpecs) {
    const secondaryHull = createHullVolume(secondarySpec);

    // Wrap with transform if specified
    if (secondarySpec.worldTransform) {
      console.log(
        `  - Secondary hull with transform: ${JSON.stringify(secondarySpec.worldTransform)}`
      );
      allHulls.push(new TransformedHull(secondaryHull, secondarySpec));
    } else {
      allHulls.push(secondaryHull);
    }
  }

  return new UnionHull(allHulls, primarySpec);
}
