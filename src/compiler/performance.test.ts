/**
 * Performance benchmarks for ShipBuilder
 * Measures key operations to track optimization impact
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createHullVolume } from "@compiler/hull";
import { bakeHullMesh } from "@compiler/mesh";
import { compileShip } from "@compiler/index";
import { ShipSpec, HullType, HullSymmetry, ShipScale, DeckNamingScheme, RoomType, RoomShapeType, WindowStyle } from "@core/index";
import { meshCache } from "@utils/meshCache";
import { profiler } from "@utils/profiling";

// Test ship spec
function createTestShip(): ShipSpec {
  return {
    specVersion: 1,
    ship: {
      meta: {
        name: "Benchmark Test Ship",
        description: "Ship for performance benchmarking",
        role: "explorer",
        scale: ShipScale.Medium,
        units: "meters",
      },
      hull: {
        type: HullType.LoftedSpine,
        symmetry: HullSymmetry.X,
        length: 60,
        maxBeam: 18,
        maxHeight: 8,
        spine: {
          points: [
            { z: 0.0, radius: 0.2 },
            { z: 0.25, radius: 0.8 },
            { z: 0.75, radius: 0.7 },
            { z: 1.0, radius: 0.15 },
          ],
        },
      },
      decks: {
        deckHeight: 2.6,
        startY: -2.6,
        endY: 2.6,
        naming: {
          scheme: DeckNamingScheme.Index,
        },
      },
      rooms: [
        {
          id: "bridge",
          type: RoomType.Command,
          deck: 0,
          shape: { type: RoomShapeType.Rect, size: [8, 8] },
          position: { x: 0, z: 20 },
          rotationDeg: 0,
          tags: ["front", "vip"],
        },
      ],
      windows: {
        enabled: true,
        style: WindowStyle.Round,
        radius: 0.25,
        spacing: 2.5,
        includeRoomTypes: [RoomType.Crew, RoomType.Command],
        perDeckLimit: 200,
      },
    },
  };
}

describe("Performance Benchmarks", () => {
  beforeEach(() => {
    profiler.reset();
    meshCache.clear();
  });

  describe("Mesh Generation", () => {
    it("should bake hull mesh within reasonable time (first run)", () => {
      const spec = createTestShip();
      const hullVolume = createHullVolume(spec.ship.hull);

      const startTime = performance.now();
      const bakedMesh = bakeHullMesh({
        hullVolume,
        hullSpec: spec.ship.hull,
        resolution: 1.0,
        maxResolution: 60,
      });
      const duration = performance.now() - startTime;

      console.log(`First mesh generation: ${duration.toFixed(2)}ms`);
      expect(bakedMesh.geometry).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("should use cache for repeated mesh generation", () => {
      const spec = createTestShip();
      const hullVolume = createHullVolume(spec.ship.hull);

      // First generation
      const start1 = performance.now();
      const mesh1 = bakeHullMesh({
        hullVolume,
        hullSpec: spec.ship.hull,
        resolution: 1.0,
        maxResolution: 60,
      });
      const time1 = performance.now() - start1;

      // Second generation (should be cached)
      const start2 = performance.now();
      const mesh2 = bakeHullMesh({
        hullVolume,
        hullSpec: spec.ship.hull,
        resolution: 1.0,
        maxResolution: 60,
      });
      const time2 = performance.now() - start2;

      console.log(`First generation: ${time1.toFixed(2)}ms, Cached retrieval: ${time2.toFixed(2)}ms`);
      expect(time2).toBeLessThan(time1 * 0.1); // Cache hit should be at least 10x faster
    });
  });

  describe("Ship Compilation", () => {
    it("should compile full ship specification", () => {
      const spec = createTestShip();

      const startTime = performance.now();
      const derivedData = compileShip(spec);
      const duration = performance.now() - startTime;

      console.log(`Full ship compilation: ${duration.toFixed(2)}ms`);
      expect(derivedData).toBeDefined();
      expect(derivedData.deckFootprints.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe("Cache Statistics", () => {
    it("should demonstrate cache effectiveness", () => {
      const spec = createTestShip();
      const hullVolume = createHullVolume(spec.ship.hull);

      // Get stats before test
      const statsBefore = meshCache.getStats();
      const startHits = statsBefore.hits;
      const startMisses = statsBefore.misses;

      // Generate 3 times with same spec
      for (let i = 0; i < 3; i++) {
        bakeHullMesh({
          hullVolume,
          hullSpec: spec.ship.hull,
          resolution: 1.0,
          maxResolution: 60,
        });
      }

      const statsAfter = meshCache.getStats();
      console.log(`Cache stats before: hits=${startHits}, misses=${startMisses}`);
      console.log(`Cache stats after: hits=${statsAfter.hits}, misses=${statsAfter.misses}`);
      
      // Verify that caching is working: at least some requests should be cached
      const newHits = statsAfter.hits - startHits;
      const newMisses = statsAfter.misses - startMisses;
      console.log(`New hits: ${newHits}, New misses: ${newMisses}`);
      
      // With 3 generations of same spec, we should get at least 1 cache hit
      expect(newHits).toBeGreaterThanOrEqual(1);
      // And at most 1 new miss (first generation)
      expect(newMisses).toBeLessThanOrEqual(1);
    });
  });

  describe("Profiler Metrics", () => {
    it("should collect profiling metrics", () => {
      const spec = createTestShip();
      const hullVolume = createHullVolume(spec.ship.hull);

      bakeHullMesh({
        hullVolume,
        hullSpec: spec.ship.hull,
        resolution: 1.0,
        maxResolution: 60,
      });

      const metrics = profiler.getMetrics();
      console.log("Profiler metrics:", metrics);
      
      expect(metrics['bakeHullMesh']).toBeDefined();
      expect(metrics['voxelSampling']).toBeDefined();
      expect(metrics['marchingCubes']).toBeDefined();
      
      // Voxel sampling should be the largest component
      const voxelTimePercent = 
        (metrics['voxelSampling'].avgTime / metrics['bakeHullMesh'].avgTime) * 100;
      console.log(`Voxel sampling: ${voxelTimePercent.toFixed(1)}% of total time`);
    });
  });
});
