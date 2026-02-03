/**
 * Deck compilation module
 * Generates deck footprints from hull geometry
 */

import { DeckFootprint, Vector2 } from "@core/index";
import { HullVolume } from "./hull";

/**
 * Parameters for deck compilation
 */
export interface DeckCompilationParams {
  deckHeight: number;
  startY: number;
  endY: number;
  hullVolume: HullVolume;
  footprintMargin?: number; // Inward margin from hull boundary
  resolution?: number; // Sampling resolution in meters
}

/**
 * Compile decks from hull specification
 * Generates individual deck footprints for room placement
 */
export function compileDeckFootprints(params: DeckCompilationParams): DeckFootprint[] {
  const {
    deckHeight,
    startY,
    endY,
    hullVolume,
    footprintMargin = 0.5,
    resolution = 0.5,
  } = params;

  const footprints: DeckFootprint[] = [];

  // Calculate number of decks
  const deckCount = Math.floor((endY - startY) / deckHeight);

  for (let i = 0; i < deckCount; i++) {
    const yMin = startY + i * deckHeight;
    const yMax = yMin + deckHeight;
    const yMid = (yMin + yMax) / 2;

    // Get hull slice at deck midpoint
    let polygon = hullVolume.sliceY(yMid, resolution);

    // Apply inward margin
    if (footprintMargin > 0) {
      polygon = shrinkPolygon(polygon, footprintMargin);
    }

    footprints.push({
      deckIndex: i,
      yMin,
      yMax,
      polygon,
    });
  }

  return footprints;
}

/**
 * Shrink a 2D polygon inward by moving vertices toward centroid
 * Simple approximation: not perfect for concave shapes, but stable
 */
function shrinkPolygon(polygon: Vector2[], margin: number): Vector2[] {
  if (polygon.length < 3) {
    return polygon;
  }

  // Compute centroid
  let cx = 0,
    cz = 0;
  for (const v of polygon) {
    cx += v.x;
    cz += v.z;
  }
  cx /= polygon.length;
  cz /= polygon.length;

  // Move each vertex toward centroid
  const result: Vector2[] = [];
  for (const v of polygon) {
    const dx = v.x - cx;
    const dz = v.z - cz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > margin) {
      const scale = 1 - margin / dist;
      result.push({
        x: cx + dx * scale,
        z: cz + dz * scale,
      });
    }
  }

  return result.length >= 3 ? result : polygon; // Fallback if too aggressive
}

/**
 * Get the deck index for a given Y coordinate
 */
export function getDeckAtY(params: DeckCompilationParams, y: number): number | null {
  const { deckHeight, startY, endY } = params;

  if (y < startY || y > endY) {
    return null;
  }

  const deckIndex = Math.floor((y - startY) / deckHeight);
  return deckIndex;
}

/**
 * Get deck bounds (Y min/max) for a given deck index
 */
export function getDeckBounds(
  params: DeckCompilationParams,
  deckIndex: number
): { yMin: number; yMax: number } | null {
  const { deckHeight, startY } = params;

  const yMin = startY + deckIndex * deckHeight;
  const yMax = yMin + deckHeight;

  return { yMin, yMax };
}
