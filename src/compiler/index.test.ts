/**
 * Tests for the main ship compiler
 */

import { describe, it, expect } from "vitest";
import { compileShip } from "@compiler/index";
import {
  ShipScale,
  HullType,
  HullSymmetry,
  RoomType,
  RoomShapeType,
  WindowStyle,
  DeckNamingScheme,
} from "@core/index";

describe("Ship Compiler", () => {
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
        type: HullType.LoftedSpine,
        symmetry: HullSymmetry.X,
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
          scheme: DeckNamingScheme.Index,
        },
      },
      rooms: [
        {
          id: "bridge",
          type: RoomType.Command,
          deck: 0,
          shape: { type: RoomShapeType.Rect, size: [8, 8] as [number, number] },
          position: { x: 0, z: 20 },
          rotationDeg: 0,
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
  });

  it("should compile a minimal ship spec", () => {
    const spec = createMinimalSpec();
    const derived = compileShip(spec);

    expect(derived).toBeDefined();
    expect(derived.spec).toEqual(spec);
    expect(derived.deckFootprints).toBeDefined();
    expect(derived.validatedRooms).toBeDefined();
  });

  it("should generate deck footprints", () => {
    const spec = createMinimalSpec();
    const derived = compileShip(spec);

    expect(derived.deckFootprints.length).toBeGreaterThan(0);

    for (const deck of derived.deckFootprints) {
      expect(deck.deckIndex).toBeDefined();
      expect(deck.yMin).toBeDefined();
      expect(deck.yMax).toBeDefined();
      expect(deck.polygon.length).toBeGreaterThan(0);
    }
  });

  it("should validate rooms", () => {
    const spec = createMinimalSpec();
    const derived = compileShip(spec);

    // Should have at least attempted validation
    expect(derived.validatedRooms).toBeDefined();
    expect(Array.isArray(derived.validatedRooms)).toBe(true);
  });

  it("should handle empty room list", () => {
    const spec = createMinimalSpec();
    spec.ship.rooms = [];

    const derived = compileShip(spec);
    expect(derived.validatedRooms.length).toBe(0);
  });

  it("should preserve spec unchanged", () => {
    const spec = createMinimalSpec();
    const derived = compileShip(spec);

    expect(derived.spec).toEqual(spec);
  });
});
