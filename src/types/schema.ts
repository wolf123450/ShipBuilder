import { z } from "zod";
import {
  HullType,
  HullSymmetry,
  RoomType,
  RoomShapeType,
  ShipScale,
  WindowStyle,
  DeckNamingScheme,
  HullGenerationAlgorithm,
  SectionShape,
} from "./index";

/**
 * Zod schemas for validation of ShipSpec and its components
 * These schemas are the single source of truth for:
 * - Field types
 * - Allowed values
 * - Default values
 * - Constraints
 */

// ============================================================================
// HULL SCHEMA
// ============================================================================

export const HullSpinePointSchema = z.object({
  z: z.number().min(0).max(1).describe("Normalized position along hull length"),
  radius: z.number().min(0).max(1).describe("Normalized radius scale"),
});

export const HullSpecSchema = z.object({
  type: z.nativeEnum(HullType).describe("Hull type"),
  symmetry: z.nativeEnum(HullSymmetry).describe("Symmetry axis"),
  length: z.number().positive().describe("Hull length in meters"),
  maxBeam: z.number().positive().describe("Maximum width in meters"),
  maxHeight: z.number().positive().describe("Maximum height in meters"),
  spine: z.object({
    points: z
      .array(HullSpinePointSchema)
      .min(3)
      .refine((points) => {
        // Ensure points are sorted by z
        for (let i = 1; i < points.length; i++) {
          if (points[i].z <= points[i - 1].z) {
            return false;
          }
        }
        return true;
      }, "Spine points must be sorted by z coordinate"),
  }),
  // Post-MVP: Dual generation algorithms
  generationAlgorithm: z.nativeEnum(HullGenerationAlgorithm).optional().describe("Mesh generation algorithm"),
  voxelResolution: z.number().positive().optional().describe("Voxel grid resolution in meters (for voxel mode)"),
  spineSampleRate: z.number().int().positive().optional().describe("Spine sampling rate (for parametric mode)"),
  sectionShape: z.nativeEnum(SectionShape).optional().describe("Cross-section shape profile"),
  shapeParams: z.object({
    n: z.number().positive().optional(),
    m: z.number().positive().optional(),
  }).optional().describe("Superellipse shape parameters"),
  topBias: z.number().min(0.5).max(2.0).optional().describe("Asymmetric height bias (0.5-2.0)"),
  sectionRotation: z.number().optional().describe("Yaw rotation per section in degrees"),
  hasInteriorDecks: z.boolean().optional().describe("Enable deck generation for this hull"),
});

// ============================================================================
// DECK SCHEMA
// ============================================================================

export const DecksSpecSchema = z.object({
  deckHeight: z.number().positive().describe("Deck height in meters"),
  startY: z.number().describe("Deck stack start Y in meters"),
  endY: z.number().describe("Deck stack end Y in meters"),
  naming: z.object({
    scheme: z.nativeEnum(DeckNamingScheme).describe("Naming scheme for decks"),
  }),
}).refine((decks) => decks.endY > decks.startY, {
  message: "endY must be greater than startY",
  path: ["endY"],
});

// ============================================================================
// ROOM SCHEMA
// ============================================================================

export const RectShapeSchema = z.object({
  type: z.literal(RoomShapeType.Rect),
  size: z.tuple([z.number().positive(), z.number().positive()]),
});

export const RoomPositionSchema = z.object({
  x: z.number(),
  z: z.number(),
});

export const RoomSpecSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z0-9_]+$/, "ID must be alphanumeric with underscores"),
  type: z.nativeEnum(RoomType),
  deck: z.number().int().nonnegative(),
  shape: RectShapeSchema, // Can be extended with union type
  position: RoomPositionSchema,
  rotationDeg: z.number().min(0).max(360),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// WINDOW SCHEMA
// ============================================================================

export const WindowsSpecSchema = z.object({
  enabled: z.boolean(),
  style: z.nativeEnum(WindowStyle),
  radius: z.number().positive(),
  spacing: z.number().positive(),
  includeRoomTypes: z.array(z.nativeEnum(RoomType)).min(1),
  perDeckLimit: z.number().int().positive(),
});

// ============================================================================
// METADATA SCHEMA
// ============================================================================

export const ShipMetaSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  role: z.string().optional(),
  scale: z.nativeEnum(ShipScale),
  units: z.literal("meters"),
});

// ============================================================================
// TOP-LEVEL SCHEMA
// ============================================================================

export const ShipSpecSchema = z.object({
  specVersion: z.literal(1),
  ship: z.object({
    meta: ShipMetaSchema,
    hull: HullSpecSchema,
    decks: DecksSpecSchema,
    rooms: z.array(RoomSpecSchema),
    windows: WindowsSpecSchema,
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type HullSpecValidated = z.infer<typeof HullSpecSchema>;
export type DecksSpecValidated = z.infer<typeof DecksSpecSchema>;
export type RoomSpecValidated = z.infer<typeof RoomSpecSchema>;
export type WindowsSpecValidated = z.infer<typeof WindowsSpecSchema>;
export type ShipMetaValidated = z.infer<typeof ShipMetaSchema>;
export type ShipSpecValidated = z.infer<typeof ShipSpecSchema>;
