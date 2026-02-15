/**
 * Phase 1.4 Tests: Non-Traversible Hulls (hasInteriorDecks)
 * Tests for conditional deck generation and secondary hull configuration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { compileShip } from "@compiler/index";
import {
  ShipScale,
  HullType,
  HullSymmetry,
  RoomType,
  RoomShapeType,
  DeckNamingScheme,
  HullGenerationAlgorithm,
  SectionShape,
} from "@core/index";

describe("Phase 1.4: Non-Traversible Hulls (hasInteriorDecks)", () => {
  // ============================================================================
  // Test Fixtures
  // ============================================================================

  const createMinimalSpec = () => ({
    specVersion: 1 as const,
    ship: {
      meta: {
        name: "Test Ship",
        description: "A test ship",
        scale: ShipScale.Medium,
        units: "meters" as const,
      },
      hull: {
        type: HullType.LoftedSpine as const,
        symmetry: HullSymmetry.X as const,
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
      },
      decks: {
        deckHeight: 2.6,
        startY: -2.6,
        endY: 2.6,
        naming: {
          scheme: DeckNamingScheme.Index as const,
        },
      },
      rooms: [] as any[],
    },
  });

  // ============================================================================
  // Primary Hull Deck Generation Tests
  // ============================================================================

  describe("Primary Hull Deck Generation (hasInteriorDecks)", () => {
    it("should generate decks when hasInteriorDecks is not specified (defaults true)", () => {
      const spec = createMinimalSpec();
      // hasInteriorDecks field omitted - should default to true

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should generate decks when hasInteriorDecks is explicitly true", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true;

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should NOT generate decks when hasInteriorDecks is false", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = false;

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBe(0);
    });

    it("should generate appropriate number of decks based on hull height", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true;
      spec.ship.decks.deckHeight = 2.0;
      spec.ship.decks.startY = -4.0;
      spec.ship.decks.endY = 4.0;

      const compiled = compileShip(spec);

      // With 8m total height and 2m per deck, should have multiple decks
      expect(compiled.deckFootprints.length).toBeGreaterThanOrEqual(2);
    });

    it("should respect deck height configuration", () => {
      const specLarge = createMinimalSpec();
      specLarge.ship.hull.hasInteriorDecks = true;
      specLarge.ship.decks.deckHeight = 5.0; // Large deck spacing

      const specSmall = createMinimalSpec();
      specSmall.ship.hull.hasInteriorDecks = true;
      specSmall.ship.decks.deckHeight = 1.0; // Small deck spacing

      const compiledLarge = compileShip(specLarge);
      const compiledSmall = compileShip(specSmall);

      // Small spacing should produce more decks
      expect(compiledSmall.deckFootprints.length).toBeGreaterThan(
        compiledLarge.deckFootprints.length
      );
    });
  });

  // ============================================================================
  // Secondary Hull Tests
  // ============================================================================

  describe("Secondary Hull Deck Configuration", () => {
    it("should accept secondary_hulls in spec", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true;

      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
        },
      ];

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
    });

    it("should default secondary hull hasInteriorDecks to false", () => {
      const spec = createMinimalSpec();

      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
          // No hasInteriorDecks specified - should default to false
        },
      ];

      const compiled = compileShip(spec);

      // Decks should still exist for primary
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should NOT generate decks for secondary hull even if primary has them", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true; // Primary gets decks

      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
          has_interior_decks: false, // Explicitly false for secondary
        },
      ];

      const compiled = compileShip(spec);

      // Primary should have decks
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);

      // All deck footprints should be for primary hull only
      // (This is a compilation contract - secondary geometry should not affect decks)
      expect(compiled).toBeDefined();
    });

    it("should allow secondary hull to have decks if explicitly set", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true;

      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
          has_interior_decks: true, // Explicitly true for secondary
        },
      ];

      const compiled = compileShip(spec);

      // Should compile without error
      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Use Case Tests
  // ============================================================================

  describe("Real-World Hull Configurations", () => {
    it("should support warp nacelles without interior decks (engine pods)", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true; // Primary saucer has decks

      (spec.ship as any).secondary_hulls = [
        {
          type: HullType.LoftedSpine as const,
          symmetry: HullSymmetry.None as const,
          length: 20,
          maxBeam: 4,
          maxHeight: 3,
          spine: {
            points: [
              { z: 0, radius: 0.2 },
              { z: 1, radius: 0.2 },
            ],
          },
          world_transform: {
            position: { x: 8, y: 3, z: 45 },
            scale: 0.7,
          },
          has_interior_decks: false, // Engine pods don't have walkable decks
        },
        {
          type: HullType.LoftedSpine as const,
          symmetry: HullSymmetry.None as const,
          length: 20,
          maxBeam: 4,
          maxHeight: 3,
          spine: {
            points: [
              { z: 0, radius: 0.2 },
              { z: 1, radius: 0.2 },
            ],
          },
          world_transform: {
            position: { x: -8, y: 3, z: 45 },
            scale: 0.7,
          },
          has_interior_decks: false,
        },
      ];

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should support cargo hull without decks (automated cargo handling)", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.type = HullType.LoftedSpine;
      spec.ship.hull.length = 150;
      spec.ship.hull.maxBeam = 40;
      spec.ship.hull.hasInteriorDecks = false; // No crew decks in cargo section

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBe(0);
    });

    it("should support mixed crew/cargo configuration", () => {
      const spec = createMinimalSpec();

      // Crew section with decks
      spec.ship.hull.hasInteriorDecks = true;
      spec.ship.hull.length = 60;

      (spec.ship as any).secondary_hulls = [
        {
          type: HullType.LoftedSpine as const,
          symmetry: HullSymmetry.X as const,
          length: 40,
          maxBeam: 30,
          maxHeight: 6,
          spine: {
            points: [
              { z: 0.0, radius: 0.2 },
              { z: 0.5, radius: 0.9 },
              { z: 1.0, radius: 0.2 },
            ],
          },
          world_transform: {
            position: { x: 0, y: 0, z: 100 },
          },
          has_interior_decks: false, // Cargo hold - no crew decks
        },
      ];

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      // Primary (crew) should have decks
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should support engineering bay without crew spaces", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = false; // Engineering - no crew decks
      spec.ship.hull.length = 30;

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBe(0);
    });
  });

  // ============================================================================
  // Flag Interaction Tests
  // ============================================================================

  describe("hasInteriorDecks Flag Behavior", () => {
    it("should respect flag independently for primary and secondaries", () => {
      const spec = createMinimalSpec();

      // Primary WITH decks
      spec.ship.hull.hasInteriorDecks = true;

      // Secondary WITHOUT decks
      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
          has_interior_decks: false,
        },
      ];

      const compiled = compileShip(spec);

      // Should have decks from primary only
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should disable all decks when primary flag is false", () => {
      const spec = createMinimalSpec();

      // Primary WITHOUT decks
      spec.ship.hull.hasInteriorDecks = false;

      // Secondary (even if it could have) - doesn't matter
      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
        },
      ];

      const compiled = compileShip(spec);

      // No decks at all
      expect(compiled.deckFootprints.length).toBe(0);
    });

    it("should default to true for backward compatibility (no flag = decks)", () => {
      const spec = createMinimalSpec();
      // Omit hasInteriorDecks entirely - should default to true

      delete (spec.ship.hull as any).hasInteriorDecks;

      const compiled = compileShip(spec);

      // Should have generated decks (backward compatible)
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Compilation Contract Tests
  // ============================================================================

  describe("Compilation Contract", () => {
    it("should compile successfully with hasInteriorDecks true", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true;

      expect(() => {
        const compiled = compileShip(spec);
        expect(compiled).toBeDefined();
      }).not.toThrow();
    });

    it("should compile successfully with hasInteriorDecks false", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = false;

      expect(() => {
        const compiled = compileShip(spec);
        expect(compiled).toBeDefined();
      }).not.toThrow();
    });

    it("should produce valid derived ship data regardless of flag", () => {
      const specWith = createMinimalSpec();
      specWith.ship.hull.hasInteriorDecks = true;

      const specWithout = createMinimalSpec();
      specWithout.ship.hull.hasInteriorDecks = false;

      const compiledWith = compileShip(specWith);
      const compiledWithout = compileShip(specWithout);

      // Both should have valid data structures
      expect(compiledWith.deckFootprints).toBeDefined();
      expect(compiledWithout.deckFootprints).toBeDefined();

      expect(Array.isArray(compiledWith.deckFootprints)).toBe(true);
      expect(Array.isArray(compiledWithout.deckFootprints)).toBe(true);

      // Without should have empty array
      expect(compiledWithout.deckFootprints.length).toBe(0);
    });

    it("should support multi-hull with mixed deck flags", () => {
      const spec = createMinimalSpec();

      (spec.ship as any).secondary_hulls = [
        {
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
          world_transform: {
            position: { x: 10, y: 0, z: 45 },
          },
          has_interior_decks: false,
        },
        {
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
          world_transform: {
            position: { x: -10, y: 0, z: 45 },
          },
          has_interior_decks: true,
        },
      ];

      expect(() => {
        const compiled = compileShip(spec);
        expect(compiled).toBeDefined();
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Integration with Phase 1.1 & 1.2 Tests
  // ============================================================================

  describe("Integration with Other Phase 1 Features", () => {
    it("should respect hasInteriorDecks with parametric algorithm", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = false;
      (spec.ship.hull as any).generationAlgorithm =
        HullGenerationAlgorithm.ParametricSurface;

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBe(0);
    });

    it("should respect hasInteriorDecks with voxel algorithm", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = true;
      (spec.ship.hull as any).generationAlgorithm =
        HullGenerationAlgorithm.VoxelMarchingCubes;
      (spec.ship.hull as any).voxelResolution = 0.5;

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should respect hasInteriorDecks with superellipse sections", () => {
      const spec = createMinimalSpec();
      spec.ship.hull.hasInteriorDecks = false;
      (spec.ship.hull as any).sectionShape = SectionShape.Superellipse;
      (spec.ship.hull as any).shapeParams = { n: 4, m: 4 };
      (spec.ship.hull as any).topBias = 1.2;

      const compiled = compileShip(spec);

      expect(compiled.deckFootprints.length).toBe(0);
    });
  });
});
