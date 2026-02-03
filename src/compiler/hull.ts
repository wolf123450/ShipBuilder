/**
 * Hull compilation module
 * Responsible for converting hull spec into queryable geometry
 */

import { HullSpec, Vector3, AABB, Vector2 } from "@types/index";

/**
 * Represents a queryable hull volume
 * Supports spatial queries needed by the compilation pipeline
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
}

/**
 * Lofted spine hull implementation
 * A hull defined by a radius curve along the Z (length) axis
 */
export class LoftedSpineHull implements HullVolume {
  private spec: HullSpec;
  private radiusFunction: (z: number) => number;

  constructor(spec: HullSpec) {
    this.spec = spec;
    this.radiusFunction = this.createRadiusFunction();
  }

  /**
   * Create an interpolation function for the spine radius curve
   */
  private createRadiusFunction(): (z: number) => number {
    const points = this.spec.spine.points;

    return (z: number): number => {
      // Clamp to [0, 1]
      z = Math.max(0, Math.min(1, z));

      // Find bracketing points
      let i = 0;
      while (i < points.length - 1 && points[i + 1].z < z) {
        i++;
      }

      const p0 = points[i];
      const p1 = points[i + 1];

      if (!p1) {
        return p0.radius;
      }

      // Linear interpolation
      const t = (z - p0.z) / (p1.z - p0.z);
      return p0.radius + (p1.radius - p0.radius) * t;
    };
  }

  contains(p: Vector3): boolean {
    return this.distance(p) <= 0;
  }

  distance(p: Vector3): number {
    const { length, maxBeam, maxHeight } = this.spec;

    // Normalize Z to [0, 1]
    const zNorm = p.z / length + 0.5; // Assuming centered at origin

    // Get radius at this Z
    const radiusNorm = this.radiusFunction(zNorm);
    const rx = radiusNorm * (maxBeam / 2);
    const ry = radiusNorm * (maxHeight / 2);

    // Account for X symmetry
    const x = this.spec.symmetry === "x" ? Math.abs(p.x) : p.x;

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
      return { x: 0, y: 1, z: 0 }; // Default normal
    }

    return {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };
  }

  bounds(): AABB {
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

  sliceY(y: number, resolution: number): Vector2[] {
    const { length, maxBeam } = this.spec;

    // Build a 2D polygon by sampling the hull boundary at this Y
    const polygon: Vector2[] = [];

    // Sample around the X/Z boundary
    const maxSamples = Math.ceil((length * 2) / resolution);

    for (let i = 0; i < maxSamples; i++) {
      const z = (-length / 2) + (i / maxSamples) * length;

      // Binary search for X boundary at this Z
      let xMin = 0;
      let xMax = maxBeam / 2;

      // Find right boundary
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
}

/**
 * Factory function to create hull volumes from spec
 */
export function createHullVolume(spec: HullSpec): HullVolume {
  switch (spec.type) {
    case "lofted_spine":
      return new LoftedSpineHull(spec);
    default:
      throw new Error(`Unknown hull type: ${spec.type}`);
  }
}
