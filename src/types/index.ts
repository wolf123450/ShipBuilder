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

export enum HullGenerationAlgorithm {
  ParametricSurface = "parametric_surface",
  VoxelMarchingCubes = "voxel_marching_cubes",
}

export enum SectionShape {
  Ellipse = "ellipse",
  Superellipse = "superellipse",
  Box = "box",
}

export enum BooleanOperation {
  Union = "union",
  Difference = "difference",
  Intersection = "intersection",
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

/**
 * 3D transformation: position, rotation, scale
 * Used for placing secondary hulls in world space
 */
export interface WorldTransform {
  position?: Vector3; // World position relative to origin (default: {0, 0, 0})
  rotation?: { x?: number; y?: number; z?: number }; // Euler angles in degrees (default: {0, 0, 0})
  scale?: number; // Uniform scale factor (default: 1.0)
}

// ============================================================================
// HULL DEFINITIONS
// ============================================================================

export interface HullSpinePoint {
  z: number; // Normalized [0..1] along ship length
  radius: number; // Normalized [0..1] relative to max_beam/2
}

export interface HullSpec {
  name?: string; // Optional name for this hull (used for secondary hulls)
  type: HullType;
  symmetry: HullSymmetry;
  length: number; // Meters
  maxBeam: number; // Meters (width)
  maxHeight: number; // Meters (height)
  spine: {
    points: HullSpinePoint[];
  };
  // Post-MVP: Dual algorithm support + transformations
  generationAlgorithm?: HullGenerationAlgorithm; // Default: parametric_surface
  voxelResolution?: number; // Only for voxel; default 1.0m
  spineSampleRate?: number; // Only for parametric; default 50 samples
  sectionShape?: SectionShape; // Default: ellipse
  shapeParams?: {
    n?: number; // Superellipse exponent for X axis
    m?: number; // Superellipse exponent for Y axis
  };
  topBias?: number; // Asymmetry: 0.5-2.0, where 1.0 = symmetric
  sectionRotation?: number; // Yaw rotation per section in degrees
  hasInteriorDecks?: boolean; // Default: true; false for engine pods, etc.
  worldTransform?: WorldTransform; // For secondary hulls positioning
  socketConstraint?: string; // Named location hint (e.g., "engine_pod_left")
}

/**
 * Unified hull instance wrapping HullSpec with metadata
 * Consolidates primary and secondary hulls into a single array
 * Phase 5.0c: New unified data model
 */
export interface HullInstance {
  id: string; // Unique identifier (e.g., "primary", "secondary-1", "secondary-2")
  name: string; // Display name (e.g., "Primary Hull", "Engine Pod")
  isPrimary: boolean; // Whether this is the primary (structural) hull
  hullSpec: HullSpec; // The hull definition
  worldTransform: WorldTransform; // Position, rotation, scale in world space
  booleanOp: BooleanOperation; // How to combine with other hulls
  enabled: boolean; // Whether to render and include in compilation
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
    secondaryHulls?: HullSpec[]; // Post-MVP: Engine pods, saucers, nacelles, etc.
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
// HIERARCHY & SELECTION (Phase 5.0a)
// ============================================================================

/**
 * Single node in the object hierarchy tree
 * Used for displaying ship structure in a collapsible tree view
 */
export interface HierarchyTreeNode {
  id: string; // Unique identifier
  name: string; // Display name
  type: "ship" | "hull" | "secondary-hull" | "decks" | "deck" | "rooms" | "room";
  icon: string; // Emoji icon for display
  count?: number; // For heading nodes (e.g., "Decks (4)")
  itemType?: "hull" | "deck" | "room"; // For selection routing
  itemId?: string; // For selection routing (e.g., deck index, room ID)
  children?: HierarchyTreeNode[];
  nodePath?: string; // For tracking expanded state in UI
}

/**
 * Selection state supporting single, group, and multi-select
 * Replaces the old selectedItemType/selectedItemId model
 */
export interface SelectionState {
  mode: "single" | "group" | "multi"; // Selection mode
  itemType:
    | "hull"
    | "deck"
    | "room"
    | "all-hulls"
    | "all-decks"
    | "all-rooms"
    | null; // What is selected
  itemIds: string[]; // Selected item IDs (empty array for 'all-*' types)
}

/**
 * Hierarchy UI state (not persisted)
 * Tracks expanded nodes, search filter, and context menu state
 */
export interface HierarchyUIState {
  expandedNodes: Record<string, boolean>; // Track which nodes are expanded
  searchFilter: string; // Search text for filtering hierarchy
  contextMenuTarget: { type: string; itemId: string } | null; // Right-click target
  contextMenuPos: { x: number; y: number }; // Right-click position
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
