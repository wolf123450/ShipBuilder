/**
 * Phase 1.3 Tests: Multi-Hull Support & Transforms
 * Tests for secondary hulls, world transforms, and union geometry
 */

import { describe, it, expect } from "vitest";
import { createHullVolume, createMultiHullVolume } from "@compiler/hull";
import {
  HullGenerationAlgorithm,
  HullType,
  HullSymmetry,
  Vector3,
  WorldTransform,
} from "@core/index";
import * as THREE from "three";

describe("Phase 1.3: Multi-Hull Support & Transforms", () => {
  // ============================================================================
  // Basic Multi-Hull Creation Tests
  // ============================================================================

  describe("Multi-Hull Volume Creation", () => {
    const primarySpec = {
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

    const secondarySpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.None as const,
      length: 15,
      maxBeam: 5,
      maxHeight: 4,
      spine: {
        points: [
          { z: 0, radius: 0.3 },
          { z: 1, radius: 0.3 },
        ],
      },
      worldTransform: {
        position: { x: 10, y: 0, z: 30 },
      } as WorldTransform,
    };

    it("should create multi-hull volume from primary + secondary", () => {
      const primary = createHullVolume(primarySpec);
      const secondary = createHullVolume(secondarySpec);

      const multiHull = createMultiHullVolume(primary, [secondary]);

      expect(multiHull).toBeDefined();
      expect(multiHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should accept multiple secondary hulls", () => {
      const primary = createHullVolume(primarySpec);

      const secondary1 = createHullVolume({
        ...secondarySpec,
        worldTransform: {
          position: { x: 10, y: 0, z: 30 },
        } as WorldTransform,
      });

      const secondary2 = createHullVolume({
        ...secondarySpec,
        worldTransform: {
          position: { x: -10, y: 0, z: 30 },
        } as WorldTransform,
      });

      const multiHull = createMultiHullVolume(primary, [secondary1, secondary2]);

      expect(multiHull).toBeDefined();
      expect(multiHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should handle empty secondary hull array", () => {
      const primary = createHullVolume(primarySpec);

      const multiHull = createMultiHullVolume(primary, []);

      expect(multiHull).toBeDefined();
      expect(multiHull.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });
  });

  // ============================================================================
  // World Transform Tests
  // ============================================================================

  describe("World Transforms", () => {
    const baseSpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.None as const,
      length: 10,
      maxBeam: 4,
      maxHeight: 2,
      spine: {
        points: [
          { z: 0, radius: 0.5 },
          { z: 1, radius: 0.5 },
        ],
      },
    };

    describe("Position Transform", () => {
      it("should create transformed hull at specified position", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {
            position: { x: 10, y: 0, z: 20 },
          } as WorldTransform,
        };

        const hull = createHullVolume(spec);

        // Should contain point near transformed center
        expect(hull.contains({ x: 10, y: 0, z: 20 })).toBe(true);
      });

      it("should offset hull geometry along X axis", () => {
        const posX0 = createHullVolume({
          ...baseSpec,
          worldTransform: { position: { x: 0, y: 0, z: 0 } } as WorldTransform,
        });

        const posX10 = createHullVolume({
          ...baseSpec,
          worldTransform: { position: { x: 10, y: 0, z: 0 } } as WorldTransform,
        });

        // At origin, first hull should contain, second should not
        expect(posX0.contains({ x: 0, y: 0, z: 5 })).toBe(true);
        // Near offset position, second should contain
        expect(posX10.contains({ x: 10, y: 0, z: 5 })).toBe(true);
      });

      it("should offset hull geometry along Y axis", () => {
        const posY0 = createHullVolume({
          ...baseSpec,
          worldTransform: { position: { x: 0, y: 0, z: 0 } } as WorldTransform,
        });

        const posY5 = createHullVolume({
          ...baseSpec,
          worldTransform: { position: { x: 0, y: 5, z: 0 } } as WorldTransform,
        });

        // Y offset should be reflected in vertical position
        expect(posY0.contains({ x: 0, y: 0, z: 5 })).toBe(true);
        expect(posY5.contains({ x: 0, y: 5, z: 5 })).toBe(true);
      });

      it("should offset hull geometry along Z axis", () => {
        const posZ0 = createHullVolume({
          ...baseSpec,
          worldTransform: { position: { x: 0, y: 0, z: 0 } } as WorldTransform,
        });

        const posZ30 = createHullVolume({
          ...baseSpec,
          worldTransform: { position: { x: 0, y: 0, z: 30 } } as WorldTransform,
        });

        expect(posZ0.contains({ x: 0, y: 0, z: 5 })).toBe(true);
        expect(posZ30.contains({ x: 0, y: 0, z: 35 })).toBe(true);
      });

      it("should support 3D position offsets", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {
            position: { x: 10, y: 5, z: 20 },
          } as WorldTransform,
        };

        const hull = createHullVolume(spec);

        // Should contain point at transformed center
        expect(hull.contains({ x: 10, y: 5, z: 20 })).toBe(true);

        // Should not contain point far away
        expect(hull.contains({ x: -10, y: -5, z: -20 })).toBe(false);
      });
    });

    describe("Rotation Transform", () => {
      it("should rotate hull around Z axis (most common for ships)", () => {
        const spec0 = {
          ...baseSpec,
          worldTransform: {
            rotation: { x: 0, y: 0, z: 0 },
          } as WorldTransform,
        };

        const spec45 = {
          ...baseSpec,
          worldTransform: {
            rotation: { x: 0, y: 0, z: 45 },
          } as WorldTransform,
        };

        const hull0 = createHullVolume(spec0);
        const hull45 = createHullVolume(spec45);

        // Both should contain origin
        expect(hull0.contains({ x: 0, y: 0, z: 5 })).toBe(true);
        expect(hull45.contains({ x: 0, y: 0, z: 5 })).toBe(true);
      });

      it("should rotate hull around X axis", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {
            rotation: { x: 90, y: 0, z: 0 },
          } as WorldTransform,
        };

        const hull = createHullVolume(spec);

        expect(hull).toBeDefined();
        expect(hull.contains({ x: 0, y: 0, z: 5 })).toBeDefined();
      });

      it("should rotate hull around Y axis", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {
            rotation: { x: 0, y: 90, z: 0 },
          } as WorldTransform,
        };

        const hull = createHullVolume(spec);

        expect(hull).toBeDefined();
        expect(hull.contains({ x: 0, y: 0, z: 5 })).toBeDefined();
      });

      it("should support combined rotations", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {
            rotation: { x: 30, y: 45, z: 60 },
          } as WorldTransform,
        };

        const hull = createHullVolume(spec);

        expect(hull).toBeDefined();
        expect(hull.contains({ x: 0, y: 0, z: 5 })).toBeDefined();
      });
    });

    describe("Scale Transform", () => {
      it("should enlarge hull with scale > 1", () => {
        const scale1 = createHullVolume({
          ...baseSpec,
          worldTransform: { scale: 1.0 } as WorldTransform,
        });

        const scale2 = createHullVolume({
          ...baseSpec,
          worldTransform: { scale: 2.0 } as WorldTransform,
        });

        const bounds1 = scale1.bounds();
        const bounds2 = scale2.bounds();

        const volume1 =
          (bounds1.max.x - bounds1.min.x) *
          (bounds1.max.y - bounds1.min.y) *
          (bounds1.max.z - bounds1.min.z);

        const volume2 =
          (bounds2.max.x - bounds2.min.x) *
          (bounds2.max.y - bounds2.min.y) *
          (bounds2.max.z - bounds2.min.z);

        // Scaled by 2 should have roughly 8× volume
        expect(volume2).toBeGreaterThan(volume1 * 4);
      });

      it("should shrink hull with scale < 1", () => {
        const scale1 = createHullVolume({
          ...baseSpec,
          worldTransform: { scale: 1.0 } as WorldTransform,
        });

        const scale0_5 = createHullVolume({
          ...baseSpec,
          worldTransform: { scale: 0.5 } as WorldTransform,
        });

        const bounds1 = scale1.bounds();
        const bounds05 = scale0_5.bounds();

        const volume1 =
          (bounds1.max.x - bounds1.min.x) *
          (bounds1.max.y - bounds1.min.y) *
          (bounds1.max.z - bounds1.min.z);

        const volume05 =
          (bounds05.max.x - bounds05.min.x) *
          (bounds05.max.y - bounds05.min.y) *
          (bounds05.max.z - bounds05.min.z);

        // Scaled by 0.5 should have roughly 1/8× volume
        expect(volume05).toBeLessThan(volume1 * 0.25);
      });

      it("should default to scale=1.0", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {} as WorldTransform,
        };

        const hull = createHullVolume(spec);
        expect(hull).toBeDefined();
      });
    });

    describe("Combined Transforms (Position + Rotation + Scale)", () => {
      it("should apply all three transforms together", () => {
        const spec = {
          ...baseSpec,
          worldTransform: {
            position: { x: 10, y: 5, z: 20 },
            rotation: { x: 0, y: 0, z: 45 },
            scale: 0.8,
          } as WorldTransform,
        };

        const hull = createHullVolume(spec);

        expect(hull).toBeDefined();
        // Should contain point near transformed center
        expect(hull.contains({ x: 10, y: 5, z: 20 })).toBe(true);
      });

      it("should handle engine pod configuration (common use case)", () => {
        // Starboard engine pod: offset X, positioned aft, small scale
        const spec = {
          ...baseSpec,
          length: 8,
          maxBeam: 3,
          maxHeight: 2,
          worldTransform: {
            position: { x: 12, y: 0, z: 45 }, // Starboard, aft
            rotation: { x: 0, y: 0, z: 0 },
            scale: 0.6,
          } as WorldTransform,
        };

        const pod = createHullVolume(spec);

        expect(pod).toBeDefined();
        expect(pod.contains({ x: 12, y: 0, z: 45 })).toBe(true);
      });

      it("should handle port + starboard symmetric engine pods", () => {
        const starboardPod = createHullVolume({
          ...baseSpec,
          length: 8,
          maxBeam: 3,
          maxHeight: 2,
          worldTransform: {
            position: { x: 12, y: 0, z: 45 },
            scale: 0.6,
          } as WorldTransform,
        });

        const portPod = createHullVolume({
          ...baseSpec,
          length: 8,
          maxBeam: 3,
          maxHeight: 2,
          worldTransform: {
            position: { x: -12, y: 0, z: 45 },
            scale: 0.6,
          } as WorldTransform,
        });

        expect(starboardPod.contains({ x: 12, y: 0, z: 45 })).toBe(true);
        expect(portPod.contains({ x: -12, y: 0, z: 45 })).toBe(true);

        // Pods should not contain each other's positions
        expect(starboardPod.contains({ x: -12, y: 0, z: 45 })).toBe(false);
        expect(portPod.contains({ x: 12, y: 0, z: 45 })).toBe(false);
      });
    });
  });

  // ============================================================================
  // Union Hull Query Tests
  // ============================================================================

  describe("Union Hull Geometry", () => {
    const primarySpec = {
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

    const secondarySpec = {
      type: HullType.LoftedSpine as const,
      symmetry: HullSymmetry.None as const,
      length: 10,
      maxBeam: 3,
      maxHeight: 2,
      spine: {
        points: [
          { z: 0, radius: 0.3 },
          { z: 1, radius: 0.3 },
        ],
      },
      worldTransform: {
        position: { x: 10, y: 0, z: 30 },
      } as WorldTransform,
    };

    it("should contain primary hull center", () => {
      const primary = createHullVolume(primarySpec);
      const secondary = createHullVolume(secondarySpec);
      const union = createMultiHullVolume(primary, [secondary]);

      expect(union.contains({ x: 0, y: 0, z: 30 })).toBe(true);
    });

    it("should contain secondary hull center", () => {
      const primary = createHullVolume(primarySpec);
      const secondary = createHullVolume(secondarySpec);
      const union = createMultiHullVolume(primary, [secondary]);

      expect(union.contains({ x: 10, y: 0, z: 30 })).toBe(true);
    });

    it("should use OR logic for containment", () => {
      const primary = createHullVolume(primarySpec);
      const secondary = createHullVolume(secondarySpec);
      const union = createMultiHullVolume(primary, [secondary]);

      // Point in primary but not secondary
      expect(union.contains({ x: 0, y: 0, z: 15 })).toBe(true);

      // Point in secondary but not primary (offset at X=10)
      expect(union.contains({ x: 10, y: 0, z: 30 })).toBe(true);

      // Point in neither
      expect(union.contains({ x: 50, y: 50, z: 50 })).toBe(false);
    });

    it("should return minimum distance (most negative for any hull)", () => {
      const primary = createHullVolume(primarySpec);
      const secondary = createHullVolume(secondarySpec);
      const union = createMultiHullVolume(primary, [secondary]);

      // Inside union, distances should be negative
      const inside = union.distance({ x: 0, y: 0, z: 30 });
      expect(inside).toBeLessThan(0);

      // Outside union, distances should be positive
      const outside = union.distance({ x: 50, y: 50, z: 50 });
      expect(outside).toBeGreaterThan(0);
    });

    it("should compute bounds encompassing all sub-hulls", () => {
      const primary = createHullVolume(primarySpec);
      const secondary = createHullVolume(secondarySpec);
      const union = createMultiHullVolume(primary, [secondary]);

      const bounds = union.bounds();

      // Bounds should encompass both primary (centered) and secondary (offset)
      expect(bounds.min.x).toBeLessThan(0);
      expect(bounds.max.x).toBeGreaterThan(10);

      expect(bounds.min.z).toBeLessThan(0);
      expect(bounds.max.z).toBeGreaterThan(30);
    });

    it("should handle multiple secondary hulls (port + starboard)", () => {
      const primary = createHullVolume(primarySpec);

      const starboard = createHullVolume({
        ...secondarySpec,
        worldTransform: {
          position: { x: 10, y: 0, z: 30 },
        } as WorldTransform,
      });

      const port = createHullVolume({
        ...secondarySpec,
        worldTransform: {
          position: { x: -10, y: 0, z: 30 },
        } as WorldTransform,
      });

      const union = createMultiHullVolume(primary, [starboard, port]);

      // All three should be contained
      expect(union.contains({ x: 0, y: 0, z: 30 })).toBe(true); // Primary center
      expect(union.contains({ x: 10, y: 0, z: 30 })).toBe(true); // Starboard
      expect(union.contains({ x: -10, y: 0, z: 30 })).toBe(true); // Port

      // Envelope should encompass all
      const bounds = union.bounds();
      expect(bounds.min.x).toBeLessThan(-10);
      expect(bounds.max.x).toBeGreaterThan(10);
    });
  });

  // ============================================================================
  // Real-World Configuration Tests
  // ============================================================================

  describe("Real-World Multi-Hull Configurations", () => {
    it("should support flagship with dual nacelles", () => {
      const primary = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 100,
        maxBeam: 20,
        maxHeight: 15,
        spine: {
          points: [
            { z: 0.0, radius: 0.15 },
            { z: 0.5, radius: 0.9 },
            { z: 1.0, radius: 0.15 },
          ],
        },
      });

      const nacelle1 = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.None as const,
        length: 40,
        maxBeam: 8,
        maxHeight: 6,
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 1, radius: 0.2 },
          ],
        },
        worldTransform: {
          position: { x: 15, y: 5, z: 70 },
          rotation: { x: 0, y: 0, z: -15 },
          scale: 1.0,
        } as WorldTransform,
      });

      const nacelle2 = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.None as const,
        length: 40,
        maxBeam: 8,
        maxHeight: 6,
        spine: {
          points: [
            { z: 0, radius: 0.2 },
            { z: 1, radius: 0.2 },
          ],
        },
        worldTransform: {
          position: { x: -15, y: 5, z: 70 },
          rotation: { x: 0, y: 0, z: 15 },
          scale: 1.0,
        } as WorldTransform,
      });

      const ship = createMultiHullVolume(primary, [nacelle1, nacelle2]);

      expect(ship).toBeDefined();
      expect(ship.contains({ x: 0, y: 0, z: 50 })).toBe(true); // Primary
      expect(ship.contains({ x: 15, y: 5, z: 70 })).toBe(true); // Nacelle 1
      expect(ship.contains({ x: -15, y: 5, z: 70 })).toBe(true); // Nacelle 2
    });

    it("should support cargo ship with engineering pod", () => {
      const primary = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 150,
        maxBeam: 35,
        maxHeight: 20,
        spine: {
          points: [
            { z: 0.0, radius: 0.1 },
            { z: 0.5, radius: 1.0 },
            { z: 1.0, radius: 0.1 },
          ],
        },
      });

      const engineRoom = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.None as const,
        length: 30,
        maxBeam: 10,
        maxHeight: 8,
        spine: {
          points: [
            { z: 0, radius: 0.4 },
            { z: 1, radius: 0.4 },
          ],
        },
        worldTransform: {
          position: { x: 0, y: -8, z: 130 },
          scale: 1.2,
        } as WorldTransform,
      });

      const ship = createMultiHullVolume(primary, [engineRoom]);

      expect(ship).toBeDefined();
      expect(ship.contains({ x: 0, y: 0, z: 75 })).toBe(true); // Main hull
      expect(ship.contains({ x: 0, y: -8, z: 130 })).toBe(true); // Engine room
    });

    it("should support combat ship with turret pods", () => {
      const primary = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
        length: 80,
        maxBeam: 25,
        maxHeight: 12,
        spine: {
          points: [
            { z: 0.0, radius: 0.2 },
            { z: 0.5, radius: 0.8 },
            { z: 1.0, radius: 0.2 },
          ],
        },
      });

      const turrets = [
        { pos: { x: 8, y: 4, z: 20 } },
        { pos: { x: -8, y: 4, z: 20 } },
        { pos: { x: 0, y: 0, z: 40 } },
      ];

      const turretPods = turrets.map((t) =>
        createHullVolume({
          type: HullType.LoftedSpine as const,
          symmetry: HullSymmetry.None as const,
          length: 6,
          maxBeam: 4,
          maxHeight: 3,
          spine: {
            points: [
              { z: 0, radius: 0.25 },
              { z: 1, radius: 0.25 },
            ],
          },
          worldTransform: {
            position: t.pos,
            scale: 0.5,
          } as WorldTransform,
        })
      );

      const ship = createMultiHullVolume(primary, turretPods);

      expect(ship).toBeDefined();
      turrets.forEach((t) => {
        expect(ship.contains(t.pos)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Bounds and Spatial Tests
  // ============================================================================

  describe("Spatial Consistency", () => {
    it("should maintain bounds consistency with multiple hulls", () => {
      const primary = createHullVolume({
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
      });

      const secondary = createHullVolume({
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.None as const,
        length: 10,
        maxBeam: 3,
        maxHeight: 2,
        spine: {
          points: [
            { z: 0, radius: 0.3 },
            { z: 1, radius: 0.3 },
          ],
        },
        worldTransform: {
          position: { x: 20, y: 0, z: 50 },
        } as WorldTransform,
      });

      const union = createMultiHullVolume(primary, [secondary]);
      const bounds = union.bounds();

      // Bounds should encompass both
      const pBounds = primary.bounds();
      const sBounds = secondary.bounds();

      expect(bounds.min.x).toBeLessThanOrEqual(
        Math.min(pBounds.min.x, sBounds.min.x)
      );
      expect(bounds.max.x).toBeGreaterThanOrEqual(
        Math.max(pBounds.max.x, sBounds.max.x)
      );
    });
  });
});
