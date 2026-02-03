/**
 * Core type definitions for the Ship Design Toolkit
 * Based on the MVP design specification
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum HullType {
  LoftedSpine = "lofted_spine",
  // Reserved for future: Saucers, Nacelles, CSG operations
}

export enum HullSymmetry {
  None = "none",
  X = "x",
  Y = "y",
  Z = "z",
}

export enum RoomType {
  Command = "command",
  Corridor = "corridor",
  Crew = "crew",
  Cargo = "cargo",
  Engineering = "engineering",
}

export enum RoomShapeType {
  Rect = "rect",
  // Reserved: Poly, Circle
}

export enum ShipScale {
  Fighter = "fighter",
  Small = "small",
  Medium = "medium",
  Capital = "capital",
}

export enum WindowStyle {
  Round = "round",
  // Reserved: Rect, Slit
}

export enum DeckNamingScheme {
  Index = "index",
  Naval = "naval",
  // Reserved: Custom
}

// ============================================================================
// VECTOR & GEOMETRY
// ============================================================================

export interface Vector2 {
  x: number;
  z: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AABB {
  min: Vector3;
  max: Vector3;
}

// ============================================================================
// HULL DEFINITIONS
// ============================================================================

export interface HullSpinePoint {
  z: number; // Normalized [0..1] along ship length
  radius: number; // Normalized [0..1] relative to max_beam/2
}

export interface HullSpec {
  type: HullType;
  symmetry: HullSymmetry;
  length: number; // Meters
  maxBeam: number; // Meters (width)
  maxHeight: number; // Meters (height)
  spine: {
    points: HullSpinePoint[];
  };
}

// ============================================================================
// DECK DEFINITIONS
// ============================================================================

export interface DecksSpec {
  deckHeight: number; // Meters, floor to ceiling
  startY: number; // Meters (world coordinate)
  endY: number; // Meters (world coordinate)
  naming: {
    scheme: DeckNamingScheme;
  };
}

// ============================================================================
// ROOM DEFINITIONS
// ============================================================================

export interface RectShape {
  type: RoomShapeType.Rect;
  size: [number, number]; // [x_width, z_length] in meters
}

export type RoomShape = RectShape;
// Reserved: PolyShape, CircleShape

export interface RoomPosition {
  x: number;
  z: number;
}

export interface RoomSpec {
  id: string;
  type: RoomType;
  deck: number; // Deck index
  shape: RoomShape;
  position: RoomPosition;
  rotationDeg: number;
  tags?: string[];
}

// ============================================================================
// WINDOW DEFINITIONS
// ============================================================================

export interface WindowsSpec {
  enabled: boolean;
  style: WindowStyle;
  radius: number; // Meters
  spacing: number; // Meters between windows
  includeRoomTypes: RoomType[];
  perDeckLimit: number; // Safety cap
}

// ============================================================================
// METADATA
// ============================================================================

export interface ShipMeta {
  name: string;
  description?: string;
  role?: string; // Optional tag: explorer, fighter, freighter, etc.
  scale: ShipScale;
  units: "meters"; // MVP: always meters
}

// ============================================================================
// TOP-LEVEL SHIP SPEC
// ============================================================================

export interface ShipSpec {
  specVersion: number;
  ship: {
    meta: ShipMeta;
    hull: HullSpec;
    decks: DecksSpec;
    rooms: RoomSpec[];
    windows: WindowsSpec;
  };
}

// ============================================================================
// DERIVED / COMPILED DATA
// ============================================================================

export interface PolygonBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  area: number; // Approximate area in m²
}

export interface DeckFootprint {
  deckIndex: number;
  yMin: number;
  yMax: number;
  floorY: number; // Alias for yMin (floor level)
  ceilY: number; // Alias for yMax (ceiling level)
  polygon: Vector2[]; // 2D polygon in X/Z plane
  polygonBounds: PolygonBounds; // Cached bounds for rendering
}

export interface ValidatedRoom extends RoomSpec {
  // Marked as validated, can be queried for geometry
}

export interface DerivedShipData {
  spec: ShipSpec;
  deckFootprints: DeckFootprint[];
  validatedRooms: ValidatedRoom[];
  // Future: window points, mesh data, etc.
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export interface ExportOptions {
  format: "glb" | "gltf" | "json";
  includeCollisionMesh?: boolean;
  draco?: boolean;
}

// ============================================================================
// UI STATE (Not persisted)
// ============================================================================

export interface EditorUIState {
  selectedDeck: number;
  selectedRoom: string | null;
  displayMode: "hull" | "decks" | "rooms" | "preview";
  showGrid: boolean;
  showDeckFootprints: boolean;
}
