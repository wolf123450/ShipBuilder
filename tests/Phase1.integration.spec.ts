/**
 * Phase 1 Integration Tests
 * End-to-end tests combining all Phase 1.1-1.4 features
 */

import { describe, it, expect } from "vitest";
import { compileShip } from "@compiler/index";
import {
  ShipScale,
  HullType,
  HullSymmetry,
  DeckNamingScheme,
  HullGenerationAlgorithm,
  SectionShape,
} from "@core/index";

describe("Phase 1 Integration Tests", () => {
  // ============================================================================
  // Full Feature Integration Tests
  // ============================================================================

  describe("Complete Phase 1 Feature Set", () => {
    it("should compile ship with all Phase 1 features enabled", () => {
      const spec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Advanced Starship",
            description: "Testing all Phase 1 features",
            scale: ShipScale.Medium,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 80,
            maxBeam: 20,
            maxHeight: 10,
            // Phase 1.1: Dual algorithms
            generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
            spineSampleRate: 75,
            // Phase 1.2: Superellipse + topBias
            sectionShape: SectionShape.Superellipse,
            shapeParams: { n: 4, m: 3.5 },
            topBias: 1.1,
            // Phase 1.4: Interior decks
            hasInteriorDecks: true,
            spine: {
              points: [
                { z: 0.0, radius: 0.2 },
                { z: 0.5, radius: 0.85 },
                { z: 1.0, radius: 0.2 },
              ],
            },
          },
          // Phase 1.3: Secondary hulls
          secondary_hulls: [
            {
              type: HullType.LoftedSpine as const,
              symmetry: HullSymmetry.None as const,
              length: 25,
              maxBeam: 6,
              maxHeight: 4,
              generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
              sectionShape: SectionShape.Box,
              hasInteriorDecks: false,
              world_transform: {
                position: { x: 12, y: 2, z: 60 },
                rotation: { x: 0, y: 0, z: -20 },
                scale: 0.8,
              },
              spine: {
                points: [
                  { z: 0, radius: 0.3 },
                  { z: 1, radius: 0.3 },
                ],
              },
            },
            {
              type: HullType.LoftedSpine as const,
              symmetry: HullSymmetry.None as const,
              length: 25,
              maxBeam: 6,
              maxHeight: 4,
              generationAlgorithm: HullGenerationAlgorithm.ParametricSurface,
              sectionShape: SectionShape.Box,
              hasInteriorDecks: false,
              world_transform: {
                position: { x: -12, y: 2, z: 60 },
                rotation: { x: 0, y: 0, z: 20 },
                scale: 0.8,
              },
              spine: {
                points: [
                  { z: 0, radius: 0.3 },
                  { z: 1, radius: 0.3 },
                ],
              },
            },
          ],
          decks: {
            deckHeight: 2.5,
            startY: -3.0,
            endY: 3.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      expect(() => {
        const compiled = compileShip(spec);

        // Verify all components compiled successfully
        expect(compiled).toBeDefined();
        expect(compiled.hullVolume).toBeDefined();
        expect(compiled.deckFootprints.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Algorithm Switching Tests (1.1 + others)
  // ============================================================================

  describe("Algorithm Switching with Multi-Hull", () => {
    const baseSpec = ({
      algo,
      secondaryAlgo,
    }: {
      algo: HullGenerationAlgorithm;
      secondaryAlgo: HullGenerationAlgorithm;
    }) => ({
      specVersion: 1 as const,
      ship: {
        meta: {
          name: "Hybrid Algorithm Ship",
          description: "Test different algorithms for primary/secondary",
          scale: ShipScale.Medium,
          units: "meters" as const,
        },
        hull: {
          type: HullType.LoftedSpine as const,
          symmetry: HullSymmetry.X as const,
          length: 60,
          maxBeam: 15,
          maxHeight: 8,
          generationAlgorithm: algo,
          voxelResolution: 0.5,
          hasInteriorDecks: true,
          spine: {
            points: [
              { z: 0.0, radius: 0.2 },
              { z: 0.5, radius: 0.8 },
              { z: 1.0, radius: 0.2 },
            ],
          },
        },
        secondary_hulls: [
          {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.None as const,
            length: 10,
            maxBeam: 3,
            maxHeight: 2,
            generationAlgorithm: secondaryAlgo,
            voxelResolution: 0.3,
            hasInteriorDecks: false,
            world_transform: {
              position: { x: 10, y: 0, z: 45 },
            },
            spine: {
              points: [
                { z: 0, radius: 0.3 },
                { z: 1, radius: 0.3 },
              ],
            },
          },
        ],
        decks: {
          deckHeight: 2.5,
          startY: -3.0,
          endY: 3.0,
          naming: {
            scheme: DeckNamingScheme.Index as const,
          },
        },
        rooms: [],
      },
    });

    it("should compile with parametric primary + parametric secondary", () => {
      const spec = baseSpec({
        algo: HullGenerationAlgorithm.ParametricSurface,
        secondaryAlgo: HullGenerationAlgorithm.ParametricSurface,
      });

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should compile with parametric primary + voxel secondary", () => {
      const spec = baseSpec({
        algo: HullGenerationAlgorithm.ParametricSurface,
        secondaryAlgo: HullGenerationAlgorithm.VoxelMarchingCubes,
      });

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should compile with voxel primary + parametric secondary", () => {
      const spec = baseSpec({
        algo: HullGenerationAlgorithm.VoxelMarchingCubes,
        secondaryAlgo: HullGenerationAlgorithm.ParametricSurface,
      });

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should compile with voxel primary + voxel secondary", () => {
      const spec = baseSpec({
        algo: HullGenerationAlgorithm.VoxelMarchingCubes,
        secondaryAlgo: HullGenerationAlgorithm.VoxelMarchingCubes,
      });

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Shape Parameter + Multi-Hull Tests (1.2 + 1.3)
  // ============================================================================

  describe("Shape Parameters with Multi-Hull Configuration", () => {
    it("should support different cross-section shapes across hulls", () => {
      const spec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Mixed Shape Ship",
            description: "Primary ellipse, secondary box",
            scale: ShipScale.Medium,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 60,
            maxBeam: 15,
            maxHeight: 8,
            sectionShape: SectionShape.Ellipse,
            hasInteriorDecks: true,
            spine: {
              points: [
                { z: 0.0, radius: 0.2 },
                { z: 0.5, radius: 0.8 },
                { z: 1.0, radius: 0.2 },
              ],
            },
          },
          secondary_hulls: [
            {
              type: HullType.LoftedSpine as const,
              symmetry: HullSymmetry.None as const,
              length: 10,
              maxBeam: 3,
              maxHeight: 2,
              sectionShape: SectionShape.Box,
              hasInteriorDecks: false,
              world_transform: {
                position: { x: 10, y: 0, z: 45 },
              },
              spine: {
                points: [
                  { z: 0, radius: 0.3 },
                  { z: 1, radius: 0.3 },
                ],
              },
            },
          ],
          decks: {
            deckHeight: 2.5,
            startY: -3.0,
            endY: 3.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });

    it("should support superellipse parameters with transforms and asymmetry", () => {
      const spec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Advanced Shape Ship",
            description: "Superellipse with topBias and secondary pods",
            scale: ShipScale.Medium,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 60,
            maxBeam: 15,
            maxHeight: 8,
            sectionShape: SectionShape.Superellipse,
            shapeParams: { n: 3.5, m: 4.0 },
            topBias: 0.9,
            hasInteriorDecks: true,
            spine: {
              points: [
                { z: 0.0, radius: 0.2 },
                { z: 0.5, radius: 0.8 },
                { z: 1.0, radius: 0.2 },
              ],
            },
          },
          secondary_hulls: [
            {
              type: HullType.LoftedSpine as const,
              symmetry: HullSymmetry.None as const,
              length: 15,
              maxBeam: 4,
              maxHeight: 3,
              sectionShape: SectionShape.Superellipse,
              shapeParams: { n: 6, m: 2 },
              topBias: 1.3,
              hasInteriorDecks: false,
              world_transform: {
                position: { x: 12, y: 1, z: 45 },
                rotation: { x: 0, y: 0, z: -15 },
                scale: 0.75,
              },
              spine: {
                points: [
                  { z: 0, radius: 0.3 },
                  { z: 1, radius: 0.3 },
                ],
              },
            },
            {
              type: HullType.LoftedSpine as const,
              symmetry: HullSymmetry.None as const,
              length: 15,
              maxBeam: 4,
              maxHeight: 3,
              sectionShape: SectionShape.Superellipse,
              shapeParams: { n: 6, m: 2 },
              topBias: 1.3,
              hasInteriorDecks: false,
              world_transform: {
                position: { x: -12, y: 1, z: 45 },
                rotation: { x: 0, y: 0, z: 15 },
                scale: 0.75,
              },
              spine: {
                points: [
                  { z: 0, radius: 0.3 },
                  { z: 1, radius: 0.3 },
                ],
              },
            },
          ],
          decks: {
            deckHeight: 2.5,
            startY: -3.0,
            endY: 3.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      const compiled = compileShip(spec);

      expect(compiled).toBeDefined();
      expect(compiled.deckFootprints.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Backward Compatibility Tests
  // ============================================================================

  describe("Backward Compatibility with MVP", () => {
    it("should compile MVP-style ship without new Phase 1 fields", () => {
      const mvpSpec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Legacy Ship",
            description: "MVP-style spec without Phase 1 features",
            scale: ShipScale.Medium,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 60,
            maxBeam: 15,
            maxHeight: 8,
            // No generationAlgorithm, sectionShape, shapeParams, topBias, or hasInteriorDecks
            spine: {
              points: [
                { z: 0.0, radius: 0.2 },
                { z: 0.5, radius: 0.8 },
                { z: 1.0, radius: 0.2 },
              ],
            },
          },
          decks: {
            deckHeight: 2.5,
            startY: -3.0,
            endY: 3.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      expect(() => {
        const compiled = compileShip(mvpSpec);

        // Should apply defaults and compile successfully
        expect(compiled).toBeDefined();
        expect(compiled.deckFootprints.length).toBeGreaterThan(0); // Decks enabled by default
      }).not.toThrow();
    });

    it("should round-trip MVP spec with new defaults applied", () => {
      const mvpSpec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Legacy Ship",
            description: "MVP spec",
            scale: ShipScale.Medium,
            units: "meters" as const,
          },
          hull: {
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
          },
          decks: {
            deckHeight: 2.5,
            startY: -3.0,
            endY: 3.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      const compiled1 = compileShip(mvpSpec);
      const compiled2 = compileShip(mvpSpec);

      // Should produce consistent results
      expect(compiled1.deckFootprints.length).toBe(compiled2.deckFootprints.length);
    });
  });

  // ============================================================================
  // Extreme Configuration Tests
  // ============================================================================

  describe("Extreme Configurations (Stress Tests)", () => {
    it("should handle many secondary hulls", () => {
      const spec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Massive Fleet",
            description: "Many secondary hulls",
            scale: ShipScale.Capital,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 200,
            maxBeam: 50,
            maxHeight: 30,
            hasInteriorDecks: true,
            spine: {
              points: [
                { z: 0.0, radius: 0.1 },
                { z: 0.5, radius: 0.95 },
                { z: 1.0, radius: 0.1 },
              ],
            },
          },
          secondary_hulls: Array.from({ length: 10 }, (_, i) => ({
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.None as const,
            length: 20,
            maxBeam: 5,
            maxHeight: 3,
            hasInteriorDecks: false,
            world_transform: {
              position: {
                x: (i % 2 === 0 ? 1 : -1) * (10 + i * 5),
                y: 0,
                z: 100 + (i % 5) * 20,
              },
            },
            spine: {
              points: [
                { z: 0, radius: 0.2 },
                { z: 1, radius: 0.2 },
              ],
            },
          })),
          decks: {
            deckHeight: 3.0,
            startY: -10.0,
            endY: 10.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      expect(() => {
        const compiled = compileShip(spec);
        expect(compiled).toBeDefined();
        expect(compiled.deckFootprints.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it("should handle extreme shape parameters", () => {
      const spec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Extreme Shapes",
            description: "Very pointy or very boxy",
            scale: ShipScale.Medium,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 60,
            maxBeam: 15,
            maxHeight: 8,
            sectionShape: SectionShape.Superellipse,
            shapeParams: { n: 0.3, m: 8.5 },
            topBias: 0.2,
            hasInteriorDecks: true,
            spine: {
              points: [
                { z: 0.0, radius: 0.2 },
                { z: 0.5, radius: 0.8 },
                { z: 1.0, radius: 0.2 },
              ],
            },
          },
          decks: {
            deckHeight: 2.5,
            startY: -3.0,
            endY: 3.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      expect(() => {
        const compiled = compileShip(spec);
        expect(compiled).toBeDefined();
      }).not.toThrow();
    });

    it("should handle combined extreme transforms and scales", () => {
      const spec = {
        specVersion: 1 as const,
        ship: {
          meta: {
            name: "Extreme Transforms",
            description: "Large offsets, rotations, scales",
            scale: ShipScale.Capital,
            units: "meters" as const,
          },
          hull: {
            type: HullType.LoftedSpine as const,
            symmetry: HullSymmetry.X as const,
            length: 100,
            maxBeam: 30,
            maxHeight: 20,
            hasInteriorDecks: true,
            spine: {
              points: [
                { z: 0.0, radius: 0.15 },
                { z: 0.5, radius: 0.9 },
                { z: 1.0, radius: 0.15 },
              ],
            },
          },
          secondary_hulls: [
            {
              type: HullType.LoftedSpine as const,
              symmetry: HullSymmetry.None as const,
              length: 50,
              maxBeam: 15,
              maxHeight: 10,
              hasInteriorDecks: false,
              world_transform: {
                position: { x: 100, y: 50, z: 150 },
                rotation: { x: 45, y: 60, z: 90 },
                scale: 3.0,
              },
              spine: {
                points: [
                  { z: 0, radius: 0.3 },
                  { z: 1, radius: 0.3 },
                ],
              },
            },
          ],
          decks: {
            deckHeight: 3.0,
            startY: -8.0,
            endY: 8.0,
            naming: {
              scheme: DeckNamingScheme.Index as const,
            },
          },
          rooms: [],
        },
      };

      expect(() => {
        const compiled = compileShip(spec);
        expect(compiled).toBeDefined();
      }).not.toThrow();
    });
  });
});
