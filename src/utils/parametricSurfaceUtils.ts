/**
 * Parametric Surface Utilities
 * Mathematical functions for Catmull-Rom spline interpolation and superellipse evaluation
 * Used for high-quality hull mesh generation
 */

import { Vector2, Vector3 } from "@core/index";

/**
 * Evaluate Catmull-Rom spline at parameter t ∈ [0,1]
 * Smooth curve interpolation through control points
 *
 * @param p0 Control point before start
 * @param p1 Start control point
 * @param p2 End control point
 * @param p3 Control point after end
 * @param t Parameter [0,1]
 * @returns Interpolated position
 */
export function evaluateCatmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom basis matrix
  // [ -0.5  1.5 -1.5  0.5 ] [ p0 ]
  // [  1.0 -2.5  2.0 -0.5 ] [ p1 ]
  // [ -0.5  0.0  0.5  0.0 ] [ p2 ]
  // [  0.0  1.0  0.0  0.0 ] [ p3 ]

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Create a Catmull-Rom spline interpolation function
 * Handles endpoint boundary conditions
 *
 * @param values Array of values at positions [0, 1, ..., n-1]
 * @returns Function that evaluates spline at t ∈ [0, 1]
 */
export function createCatmullRomSpline(values: number[]): (t: number) => number {
  if (values.length < 2) {
    throw new Error("Spline requires at least 2 points");
  }

  return (t: number): number => {
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));

    // Special cases for exact boundaries
    if (t === 0) return values[0];
    if (t === 1) return values[values.length - 1];

    // Scale t to segment parameter
    const segmentCount = values.length - 1;
    const scaledT = t * segmentCount;
    const segmentIndex = Math.floor(scaledT);
    const localT = scaledT - segmentIndex;

    // Get segment (clamp to valid range)
    const i = Math.min(segmentIndex, segmentCount - 1);

    // Get control points with proper boundary handling
    // For Catmull-Rom, we need 4 points. At boundaries, replicate edge points
    const p0 = i === 0 ? values[0] : values[i - 1];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = i + 2 < values.length ? values[i + 2] : values[values.length - 1];

    return evaluateCatmullRom(p0, p1, p2, p3, localT);
  };
}

/**
 * Evaluate superellipse at angle θ
 * Formula: |x/a|^n + |y/b|^m = 1
 *
 * @param theta Angle in radians [0, 2π]
 * @param a Semi-major axis (X radius)
 * @param b Semi-minor axis (Y radius)
 * @param n Exponent for X term (default 2 = ellipse)
 * @param m Exponent for Y term (default 2 = ellipse)
 * @returns Point on superellipse
 */
export function evaluateSuperellipse(
  theta: number,
  a: number,
  b: number,
  n: number = 2,
  m: number = 2
): Vector2 {
  // Normalize exponents for stability
  const nNorm = Math.max(0.1, n);
  const mNorm = Math.max(0.1, m);

  // Compute using parametric form with adjusted angles
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  // Use sign-preserving power function
  const sign_pown = (x: number, exp: number): number => {
    return x >= 0 ? Math.pow(x, exp) : -Math.pow(-x, exp);
  };

  // Parametric superellipse:
  // x = a * sign(cos θ) * |cos θ|^(2/n)
  // y = b * sign(sin θ) * |sin θ|^(2/m)
  const x = a * sign_pown(cosTheta, 2 / nNorm);
  const z = b * sign_pown(sinTheta, 2 / mNorm);

  return { x, z };
}

/**
 * Generate mesh from parametric surface
 * Creates triangle strips from spine and cross-section profiles
 *
 * @param spinePoints Spine control points with radii [z=0..1, radius=0..1]
 * @param length Ship length in meters
 * @param maxBeam Maximum width (X) in meters
 * @param maxHeight Maximum height (Y) in meters
 * @param topBias Asymmetric height factor (1.0 = symmetric)
 * @param sectionShape Shape type ("ellipse", "superellipse", "box")
 * @param shapeParams Shape parameters for superellipse
 * @param spineSampleRate Sampling density along spine (default 50)
 * @param crossSectionSamples Samples around cross-section (default 64)
 * @returns Object with vertices, normals, indices, and UVs
 */
export interface ParametricMeshData {
  vertices: Vector3[];
  normals: Vector3[];
  indices: number[];
  uvs: { u: number; v: number }[];
}

export function generateParametricMesh(
  spinePoints: { z: number; radius: number }[],
  length: number,
  maxBeam: number,
  maxHeight: number,
  topBias: number = 1.0,
  sectionShape: "ellipse" | "superellipse" | "box" = "ellipse",
  shapeParams?: { n?: number; m?: number },
  spineSampleRate: number = 50,
  crossSectionSamples: number = 64
): ParametricMeshData {
  const radiusValues = spinePoints.map((p) => p.radius);
  const zValues = spinePoints.map((p) => p.z);

  // Create spline interpolators
  const radiusSpline = createCatmullRomSpline(radiusValues);
  const zSpline = createCatmullRomSpline(zValues);

  // Shape parameters
  const shapeN = shapeParams?.n ?? 2;
  const shapeM = shapeParams?.m ?? 2;

  const vertices: Vector3[] = [];
  const normals: Vector3[] = [];
  const indices: number[] = [];
  const uvs: { u: number; v: number }[] = [];

  // Sample spine
  const spineCount = spineSampleRate;
  const crossCount = crossSectionSamples;

  // Generate mesh vertices
  let vertexIndex = 0;

  for (let i = 0; i < spineCount; i++) {
    const v = i / (spineCount - 1); // V parameter for UV [0..1]
    const zLocal = zSpline(v) ?? 0.5; // Fallback to middle
    const radiusNorm = radiusSpline(v) ?? 0.5; // Normalized radius

    // World position along Z
    const zWorld = (-length / 2) + zLocal * length;

    // Radii for this cross-section
    const rx = radiusNorm * (maxBeam / 2);
    const ry = radiusNorm * (maxHeight / 2) * topBias;

    // Generate cross-section
    for (let j = 0; j < crossCount; j++) {
      const u = j / crossCount; // U parameter for UV [0..1]
      const theta = (j / crossCount) * Math.PI * 2;

      let point: Vector2;

      if (sectionShape === "superellipse") {
        point = evaluateSuperellipse(theta, rx, ry, shapeN, shapeM);
      } else if (sectionShape === "box") {
        // Box shape (rounded corners via superellipse with high exponents)
        point = evaluateSuperellipse(theta, rx, ry, 8, 8);
      } else {
        // Default ellipse
        point = evaluateSuperellipse(theta, rx, ry, 2, 2);
      }

      // evaluateSuperellipse returns {x, z} but we use it for X-Y cross-section
      const x = point.x;
      const y = point.z;  // This is the Y coordinate of the cross-section

      vertices.push({ x, y, z: zWorld });
      uvs.push({ u, v });

      // Normals: perpendicular to radial direction in X-Y plane
      normals.push({ 
        x: point.x / Math.max(1, rx), 
        y: point.z / Math.max(1, ry), 
        z: 0  // Normal should point radially outward from spine, not along Z
      });
      vertexIndex++;
    }
  }

  // Generate triangle indices (connect cross-sections)
  for (let i = 0; i < spineCount - 1; i++) {
    for (let j = 0; j < crossCount; j++) {
      const v0 = i * crossCount + j;
      const v1 = i * crossCount + ((j + 1) % crossCount);
      const v2 = (i + 1) * crossCount + j;
      const v3 = (i + 1) * crossCount + ((j + 1) % crossCount);

      // Two triangles per quad
      indices.push(v0, v1, v2);
      indices.push(v1, v3, v2);
    }
  }

  // Add end caps (close both ends)
  // Bow cap (z- end, first cross-section)
  const bowCenterIdx = vertexIndex;
  vertices.push({ x: 0, y: 0, z: -length / 2 });
  normals.push({ x: 0, y: 0, z: -1 }); // Points backward (negative Z)
  uvs.push({ u: 0.5, v: 0 });
  vertexIndex++;

  for (let j = 0; j < crossCount; j++) {
    const v0 = 0 * crossCount + j;
    const v1 = 0 * crossCount + ((j + 1) % crossCount);
    indices.push(bowCenterIdx, v1, v0);
  }

  // Stern cap (z+ end, last cross-section)
  const sternCenterIdx = vertexIndex;
  vertices.push({ x: 0, y: 0, z: length / 2 });
  normals.push({ x: 0, y: 0, z: 1 }); // Points forward (positive Z)
  uvs.push({ u: 0.5, v: 1 });
  vertexIndex++;

  const lastRowStart = (spineCount - 1) * crossCount;
  for (let j = 0; j < crossCount; j++) {
    const v0 = lastRowStart + j;
    const v1 = lastRowStart + ((j + 1) % crossCount);
    indices.push(sternCenterIdx, v0, v1);
  }

  // Normalize normals
  for (let i = 0; i < normals.length; i++) {
    const n = normals[i];
    const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    if (len > 0) {
      normals[i] = { x: n.x / len, y: n.y / len, z: n.z / len };
    }
  }

  return { vertices, normals, indices, uvs };
}

/**
 * Compute finite difference normal at a point on parametric surface
 * Useful for validation/comparison with SDF normals
 */
export function computeParametricNormal(
  point: Vector3,
  splineFunc: (t: number) => Vector3,
  epsilon: number = 0.01
): Vector3 {
  const p0 = point;
  const p1 = { ...point, x: point.x + epsilon };
  const p2 = { ...point, z: point.z + epsilon };

  const t1 = splineFunc(point.z / 100); // Approximate
  const t2 = splineFunc((point.z + epsilon) / 100);

  // Tangent vectors
  const du = { x: epsilon, y: 0, z: 0 };
  const dv = { x: t2.x - t1.x, y: t2.y - t1.y, z: t2.z - t1.z };

  // Cross product: du × dv
  const normal = {
    x: du.y * dv.z - du.z * dv.y,
    y: du.z * dv.x - du.x * dv.z,
    z: du.x * dv.y - du.y * dv.x,
  };

  const len = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  if (len > 0) {
    return {
      x: normal.x / len,
      y: normal.y / len,
      z: normal.z / len,
    };
  }

  return { x: 0, y: 1, z: 0 };
}
