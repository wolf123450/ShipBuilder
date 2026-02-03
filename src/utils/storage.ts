/**
 * Storage utilities for persisting ship specs
 */

import { ShipSpec } from "@core/index";

const STORAGE_KEY = "ship-design-toolkit:ship-spec";
const SHIP_LIBRARY_KEY = "ship-design-toolkit:library";

/**
 * Save ship spec to localStorage
 */
export function saveShipToStorage(spec: ShipSpec): void {
  try {
    const json = JSON.stringify(spec);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error("Failed to save ship to storage:", error);
  }
}

/**
 * Load ship spec from localStorage
 */
export function loadShipFromStorage(): ShipSpec | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const spec = JSON.parse(json) as ShipSpec;
    return spec;
  } catch (error) {
    console.error("Failed to load ship from storage:", error);
    return null;
  }
}

/**
 * Clear ship from localStorage
 */
export function clearShipFromStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Save a ship to the library
 */
export function saveShipToLibrary(ship: ShipSpec): void {
  try {
    const library = loadLibrary();
    const entry = {
      id: Date.now().toString(),
      name: ship.ship.meta.name,
      timestamp: new Date().toISOString(),
      spec: ship,
    };

    library.push(entry);
    localStorage.setItem(SHIP_LIBRARY_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Failed to save ship to library:", error);
  }
}

/**
 * Load all ships from the library
 */
export function loadLibrary(): Array<{
  id: string;
  name: string;
  timestamp: string;
  spec: ShipSpec;
}> {
  try {
    const json = localStorage.getItem(SHIP_LIBRARY_KEY);
    if (!json) return [];

    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to load library:", error);
    return [];
  }
}

/**
 * Delete a ship from the library
 */
export function deleteFromLibrary(id: string): void {
  try {
    const library = loadLibrary();
    const filtered = library.filter((ship) => ship.id !== id);
    localStorage.setItem(SHIP_LIBRARY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete from library:", error);
  }
}
