/**
 * Tests for the deck compiler
 */

import { describe, it, expect } from "vitest";
import { compileDeckFootprints, getDeckAtY, getDeckBounds } from "@compiler/decks";
import { createHullVolume } from "@compiler/hull";
import { HullType, HullSymmetry } from "@core/index";

describe("Deck Compilation", () => {
  const createTestParams = () => {
    const hull = createHullVolume({
      type: HullType.LoftedSpine,
      symmetry: HullSymmetry.X,
      length: 100,
      maxBeam: 20,
      maxHeight: 10,
      spine: {
        points: [
          { z: 0, radius: 0.2 },
          { z: 0.5, radius: 0.9 },
          { z: 1, radius: 0.2 },
        ],
      },
    });

    return {
      deckHeight: 2,
      startY: -5,
      endY: 5,
      hullVolume: hull,
      resolution: 0.5,
    };
  };

  it("should generate correct number of decks", () => {
    const params = createTestParams();
    const footprints = compileDeckFootprints(params);

    const expectedCount = Math.floor((params.endY - params.startY) / params.deckHeight);
    expect(footprints.length).toBe(expectedCount);
  });

  it("should assign correct Y bounds to decks", () => {
    const params = createTestParams();
    const footprints = compileDeckFootprints(params);

    for (let i = 0; i < footprints.length; i++) {
      const expected = {
        yMin: params.startY + i * params.deckHeight,
        yMax: params.startY + (i + 1) * params.deckHeight,
      };

      expect(footprints[i].yMin).toBe(expected.yMin);
      expect(footprints[i].yMax).toBe(expected.yMax);
    }
  });

  it("should generate valid polygons for each deck", () => {
    const params = createTestParams();
    const footprints = compileDeckFootprints(params);

    for (const fp of footprints) {
      expect(fp.polygon.length).toBeGreaterThan(0);
      expect(fp.polygon[0]).toHaveProperty("x");
      expect(fp.polygon[0]).toHaveProperty("z");
    }
  });

  it("should correctly identify deck at Y coordinate", () => {
    const params = createTestParams();
    const deckIndex = getDeckAtY(params, 0);

    expect(deckIndex).toBeDefined();
    expect(deckIndex).toBeGreaterThanOrEqual(0);
  });

  it("should return null for Y outside range", () => {
    const params = createTestParams();
    const deckIndex = getDeckAtY(params, 100);

    expect(deckIndex).toBeNull();
  });

  it("should return deck bounds correctly", () => {
    const params = createTestParams();
    const bounds = getDeckBounds(params, 0);

    expect(bounds).toBeDefined();
    expect(bounds?.yMin).toBe(params.startY);
    expect(bounds?.yMax).toBe(params.startY + params.deckHeight);
  });
});
