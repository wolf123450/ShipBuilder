/**
 * Main ship compiler
 * Orchestrates the full compilation pipeline from ShipSpec to DerivedShipData
 */

import { ShipSpec, DerivedShipData, ValidatedRoom } from "@core/index";
import { createHullVolume, createMultiHullVolume } from "./hull";
import { compileDeckFootprints, DeckCompilationParams } from "./decks";

// Re-export mesh baker for convenience
export { bakeHullMesh, createPolygonMesh, createRoomMesh, type BakedMesh } from "./mesh";

/**
 * Compile a ship specification into derived data
 * This is the main entry point for the compilation pipeline
 */
export function compileShip(spec: ShipSpec): DerivedShipData {
  // Stage 1: Hull resolution - supports both primary and secondary hulls
  const hullVolume = createMultiHullVolume(spec.ship.hull, spec.ship.secondaryHulls);

  // Stage 2: Deck resolution
  // Only generate decks if primary hull has interior decks enabled
  let deckFootprints: DerivedShipData["deckFootprints"] = [];
  const primaryHullHasDecks = spec.ship.hull.hasInteriorDecks !== false; // Default: true

  if (primaryHullHasDecks) {
    // Use only the primary hull for deck generation (not the union of all hulls)
    // This ensures secondary hulls (engines, pods) don't affect deck footprints
    const primaryHullVolume = createHullVolume(spec.ship.hull);

    const deckParams: DeckCompilationParams = {
      deckHeight: spec.ship.decks.deckHeight,
      startY: spec.ship.decks.startY,
      endY: spec.ship.decks.endY,
      hullVolume: primaryHullVolume,
    };

    deckFootprints = compileDeckFootprints(deckParams);
  } else {
    console.log("✓ Skipping deck generation (hasInteriorDecks: false)");
  }

  // Stage 3: Room resolution (validation only for MVP)
  const validatedRooms = validateRooms(spec, deckFootprints);

  // Stage 4 & 5: Surface features and mesh baking are deferred to rendering

  return {
    spec,
    deckFootprints,
    validatedRooms,
  };
}

/**
 * Validate rooms against deck footprints
 * Checks for overlaps, out-of-bounds, etc.
 */
function validateRooms(spec: ShipSpec, deckFootprints: DerivedShipData["deckFootprints"]): ValidatedRoom[] {
  const validated: ValidatedRoom[] = [];

  for (const room of spec.ship.rooms) {
    const deckFootprint = deckFootprints.find((fp) => fp.deckIndex === room.deck);

    if (!deckFootprint) {
      console.warn(`Room ${room.id} references non-existent deck ${room.deck}`);
      continue;
    }

    // Check if room fits within footprint
    // MVP: Simple AABB check
    const [roomX, roomZ] = room.shape.size;
    const minX = room.position.x - roomX / 2;
    const maxX = room.position.x + roomX / 2;
    const minZ = room.position.z - roomZ / 2;
    const maxZ = room.position.z + roomZ / 2;

    // Very basic validation: room must fit in bounding box of footprint
    // TODO: Implement proper polygon containment check
    const footprintBounds = getPolygonBounds(deckFootprint.polygon);

    if (
      minX >= footprintBounds.minX &&
      maxX <= footprintBounds.maxX &&
      minZ >= footprintBounds.minZ &&
      maxZ <= footprintBounds.maxZ
    ) {
      validated.push(room as ValidatedRoom);
    } else {
      console.warn(
        `Room ${room.id} does not fit in deck ${room.deck} footprint`
      );
    }
  }

  return validated;
}

/**
 * Get bounding box of a 2D polygon
 */
function getPolygonBounds(polygon: { x: number; z: number }[]) {
  let minX = Infinity,
    maxX = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  for (const v of polygon) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minZ = Math.min(minZ, v.z);
    maxZ = Math.max(maxZ, v.z);
  }

  return { minX, maxX, minZ, maxZ };
}
