# Ship Designer Post-MVP Roadmap

**Document date**: February 6, 2026  
**Status**: Planning Phase  
**Target release**: Q2 2026+

---

## Executive Summary

This roadmap details comprehensive post-MVP feature expansion for the Ship Designer, addressing MVP gaps and enabling advanced design capabilities. The plan includes:

1. **Dual hull generation algorithms** (Catmull-Rom spline default; voxel marching cubes fallback)
2. **Multiple discrete hulls** with independent transforms (pods, saucers, nacelles)
3. **Advanced room placement** (polygonal/circular shapes, multi-deck spans, frame-aware layout)
4. **Layout generators** (manual draw, concentric onion shells, grid-based)
5. **Structural elements** (bulkheads, longitudinal frames, ribs)
6. **Window placement rule engine** with manual override
7. **Semantic mesh export** with full scene hierarchy and metadata
8. **UV mapping, LODs, material/livery system**
9. **Procedural ship templates** (faction presets)
10. **Undo/redo and keyboard shortcuts**

All features are **core to the vision** (no optional items); sequencing reflects dependency chains and technical readiness.

---

## Design Principles

- **One-way validation pipeline**: Rooms validated after structure generation; no feedback loops
- **Strategy pattern for hull algorithms**: Both methods share `HullVolume` interface
- **Frame-aware layout**: Structural elements guide room placement but don't mandate it
- **Semantic export**: Game engine consumes mesh hierarchy + metadata, not just geometry
- **User choice**: Designers select algorithm, layout mode, export structure per-ship
- **Backward compatibility**: MVP ships continue to work unchanged

---

## Phase 1: Hull Geometry Foundation & Multi-Section (Weeks 1-2)

### 1.1 Dual Hull Generation Algorithms

**Problem**: MVP voxel + marching cubes produces blocky artifacts; designers need quality option + fast iteration.

**Solution**: Two complementary algorithms per-hull designer choice.

#### Algorithm A: Catmull-Rom Spline + Parametric Surface (Default, High Quality)

- **Spine**: Catmull-Rom spline interpolation (smooth curves through control points)
- **Cross-section**: Superellipse (shape parameter controls boxy → rounded)
- **Mesh generation**: Direct parametric evaluation
  - Sample spine at fine granularity (50 points default)
  - At each spine point, evaluate superellipse rotated by spine tangent
  - Stitch profiles into triangles directly
  - No voxelization needed
- **Quality**: Smooth surfaces, correct normals, native UV support
- **Compile time**: ~300-800ms typical
- **Use**: Final export, publication-quality geometry

#### Algorithm B: Voxel Marching Cubes (Fast, Preview)

- **Approach**: Existing MVP logic (voxel grid + marching-cubes-faster)
- **Quality**: Fast (~100-300ms), works with CSG booleans
- **Disadvantage**: Blocky artifacts at low resolution
- **Use**: Real-time preview, rapid iteration testing

**Schema Changes** ([src/types/schema.ts](src/types/schema.ts)):
```typescript
HullSpec {
  generation_algorithm: "parametric_surface" | "voxel_marching_cubes",
  voxel_resolution?: number,        // only for voxel; default 1.0m
  spine_sample_rate?: number,       // only for parametric; default 50
  section_shape: "ellipse" | "superellipse" | "box",
  shape_param?: number,             // superellipse exponent
}
```

**Implementation**:
- Refactor [src/compiler/hull.ts](src/compiler/hull.ts): abstract `HullGenerationStrategy` interface
  - `ParametricSurfaceHull implements HullGenerationStrategy`
  - `VoxelMarchingCubesHull implements HullGenerationStrategy`
  - Factory method: `createHull(spec)` selects strategy
- Create [src/utils/parametricSurfaceUtils.ts](src/utils/parametricSurfaceUtils.ts)
  - `evaluateCatmullRomSpline(points[], t): Vector3`
  - `evaluateSuperellipse(u, v, rx, ry, shape_param): Vector2`
  - `generateParametricMesh(spine[], sections[], resolution): BufferGeometry`
- UI: [src/components/editors/HullEditor.vue](src/components/editors/HullEditor.vue) toggle "Algorithm: Parametric (Recommended) / Voxel (Fast Preview)"

**Testing**:
- Unit: SDF distance queries across both algorithms
- Visual: side-by-side export comparison
- Perf: compile time < 2s for typical ships
- Backward compat: MVP ships still render with voxel method

---

### 1.2 Superellipse Cross-Sections & Hull Symmetry

**Problem**: Only ellipses; cannot model boxy or asymmetric sections.

**Solution**:
- **Superellipse formula**: `|x/a|^n + |y/b|^m = 1`
  - n=m=2: circle/ellipse (default)
  - n=m=1: diamond
  - n=m=4: square with rounded corners
  - Asymmetric n≠m for boxy-on-one-axis
- **Top-bias**: `top_bias: 0.5-2.0` where 1.0 = symmetric (Galaxy saucer flattening)
- **Section rotation**: Optional yaw rotation per section (spiral hulls)

**Schema** [src/types/schema.ts](src/types/schema.ts):
```typescript
interface HullSection {
  ...existing...,
  section_shape: "ellipse" | "superellipse" | "box",
  shape_params?: { n?: number, m?: number },
  top_bias?: number,
  section_rotation?: number,
}

HullSpec {
  symmetry: "x" | "y" | "z" | "xy" | "xz" | "xyz",
}
```

**Implementation**:
- [src/utils/parametricSurfaceUtils.ts](src/utils/parametricSurfaceUtils.ts): `evaluateSuperellipse()` function
- [src/compiler/hull.ts](src/compiler/hull.ts): use shape params in `ParametricSurfaceHull`
- [src/compiler/hull.ts](src/compiler/hull.ts): apply symmetry in `.contains()` and `.distance()` methods

**UI**: Per-section shape editor in [src/components/editors/HullEditor.vue](src/components/editors/HullEditor.vue)

---

### 1.3 Multiple Discrete Hull Sections

**Problem**: Single `HullSpec`; cannot model engine pods, saucers, or nacelles as separate volumes.

**Solution**:
- Schema: `ShipSpec` adds `secondary_hulls: Hull[]` (already reserved)
- Each hull:
  - Independent mesh generation (algorithm, resolution, shape)
  - **World transform**: position, rotation, scale relative to primary
  - Deck generation flag
  - Optional `socket_constraint` naming

**Compiler** [src/compiler/index.ts](src/compiler/index.ts):
1. Resolve primary hull volume
2. Resolve each secondary hull with transform applied
3. Create `UnionHull` class wrapping all volumes (spatial query: return true if any volume contains point)
4. All downstream queries use union volume

**Classes**:
- [src/compiler/hull.ts](src/compiler/hull.ts): add `TransformedHull` (applies matrix transform) and `UnionHull` (logical OR)

**Export modes**:
- Mode A: "Merged" → single combined mesh (union)
- Mode B: "Separate" → each hull as separate glTF node (preserves identity, allows runtime toggling)
- Toggle: [src/components/editors/ExportEditor.vue](src/components/editors/ExportEditor.vue): "Export hull sections as: Merged / Separate"

**UI**: [src/components/editors/HullEditor.vue](src/components/editors/HullEditor.vue) list of secondary hulls with transform editors

---

### 1.4 Hulls Without Decks (Non-Traversible Sections)

**Problem**: Engine pods, reactor cores shouldn't have interior decks.

**Solution**:
- Schema [src/types/schema.ts](src/types/schema.ts): `HullSpec` adds `has_interior_decks: bool` (default true)
- [src/compiler/decks.ts](src/compiler/decks.ts): skip deck generation for flagged hulls
- Secondary hulls default to `has_interior_decks: false`

**UI**: Toggle checkbox in hull editor

---

## Phase 2: Advanced Room Placement & Multi-Deck Support (Weeks 3-4)

### 2.1 Polygonal & Circular Room Shapes

**Problem**: Only rectangles; `polygon` and `circle` reserved but not compiled.

**Solution**:
- Schema [src/types/schema.ts](src/types/schema.ts): Already has `RoomShape: "rect" | "polygon" | "circle"`
  - `polygon_points: Vector2[]` (for polygon shape)
  - `circle_radius: number` (for circle shape)
  - `rotation: number` (all shapes)

**Collision Detection** [src/components/editors/DeckPlacementEditor.vue](src/components/editors/DeckPlacementEditor.vue):
- Rectangle: SAT (Separating Axis Theorem)
- Polygon: GJK (Gilbert-Johnson-Keerthi) for convex/concave
- Circle: distance-to-edge tests
- Shared utility: [src/utils/collisionGeometry.ts](src/utils/collisionGeometry.ts) (new)

**Compiler Validation** [src/compiler/index.ts](src/compiler/index.ts):
- **Containment**: All vertices + edge midpoints inside deck footprint
- **Overlap detection**: GJK between all pairs on same deck
- Detailed error messages with violation specifics

**UI Editors**:
- **Rectangle**: existing (unchanged)
- **Circle**: position + radius sliders
- **Polygon**: 
  - Mode: "Draw Polygon" → click vertices, right-click/ESC to close
  - Auto-snap to deck boundary or other corners (0.5m)
  - Edit existing: drag vertices, right-click to delete

---

### 2.2 Multi-Deck Rooms (Vertical Spans)

**Problem**: Rooms are 2D per-deck; cannot create atriums or vertical shafts.

**Solution**:
- Schema [src/types/schema.ts](src/types/schema.ts): `Room` adds `span_decks: { start_index, end_index }`
- If set: room footprint occupies all decks in range
- Compiler: validate footprint inside all decks in span
- Export: extrudes room from deck[start].floorY to deck[end].ceilY

**UI**: Deck range picker (slider or dropdowns) when placing room

---

### 2.3 Frame-Aware Room Placement

**Problem**: Rooms placed arbitrarily; no structural relationship.

**Solution** (structural frames in Phase 3, but alignment here):
- Rooms can optionally **anchor to frame grid**:
  - `alignToFrames: { axis: "x"|"z", frame_spacing: number }`
  - Position + size snap to frame boundaries
  - Multiple rooms fit in one section, or room spans sections
- Validation: if `alignToFrames` set, verify alignment to frame boundaries
- UI: Toggle "Snap to Frame Grid" (visible only if frames exist)

**Utility**: [src/utils/frameGeometry.ts](src/utils/frameGeometry.ts) frame query functions

---

### 2.4 Layout Generators (Three Modes)

**Problem**: Manual placement tedious for complex layouts.

**Solution**: Three complementary modes per-deck designer choice.

#### Mode A: Manual Polygon Drawing

- Tool: "Draw Room/Corridor" button
- Click vertices on deck canvas
- Auto-snap to deck boundary or existing rooms (0.5m)
- Right-click/ESC to close
- Auto-name or name input after drawing

#### Mode B: Semi-Automated Concentric Onion Shells

- Inputs:
  - `outer_margin_pct`: % inset (default 10%)
  - `corridor_width`: absolute distance (default 3.0m)
  - `inner_margin_pct`: % further inward (default 5%)
  - `num_layers`: 1-5 concentric (default 2)
  - `room_naming`: naming scheme
- Algorithm:
  1. Shrink deck by `outer_margin_pct` → outer room boundary
  2. Shrink further by `corridor_width` → corridor boundary
  3. Shrink further by `inner_margin_pct` → inner room boundary
  4. Repeat for additional layers
  5. Each ring subdivided into 4-8 sectors (auto-named)
- Output: ~12-40 rooms ready to edit/delete

#### Mode C: Grid-Based Layout

- Inputs:
  - `grid_cell_width`, `grid_cell_depth` (e.g., 5.0m)
  - `margin_outer`, `margin_inter` (e.g., 1.0m, 0.5m)
  - `skip_pattern`: "fill" or "checkerboard"
  - `room_naming`: naming scheme
- Algorithm: Fill deck with grid-aligned rectangles
- Output: ~20-100 rooms depending on size

**Implementation**:
- Create [src/components/editors/LayoutGenerator.vue](src/components/editors/LayoutGenerator.vue): unified dialog
- Create [src/utils/layoutGeometry.ts](src/utils/layoutGeometry.ts): polygon shrinking, grid generation, sectors

**Workflow**:
1. Open deck editor
2. Select "Layout Mode" → choose generator type
3. Fill parameters + preview
4. Generate → rooms added to deck
5. Revert to manual for fine-tuning

---

### 2.5 Room-to-3D-Mesh Extrusion (Prep for Export)

**Problem**: Rooms are specification; no 3D mesh linkage until export.

**Solution**:
- Compiler [src/compiler/index.ts](src/compiler/index.ts) post-processes rooms:
  - For each room: create 3D prism (extrude 2D polygon along Y)
  - Store `CompiledRoom`:
    ```typescript
    interface CompiledRoom {
      originalRoom: Room;
      deckIndices: number[];
      footprint3D: Vector3[];
      extentsY: { min, max };
      meshGeometry?: BufferGeometry;
      name: string;
      type: RoomType;
    }
    ```
- Output: `CompiledRoom[]` in `DerivedShipData`

---

## Phase 3: Structural Elements & Window Placement (Weeks 5-6)

### 3.1 Structural Elements (Bulkheads, Frames, Ribs)

**Problem**: No internal subdivision or aesthetic detail.

**Solution**:
- Schema [src/types/schema.ts](src/types/schema.ts):
  ```typescript
  ShipSpec {
    structural_elements?: {
      transverse_bulkheads: { deck_indices, z_positions, thickness?, wall_height? }[];
      longitudinal_frames: { deck_ranges, x_positions, spacing?, thickness?, rib_height? }[];
      ribs: { deck_idx, positions, spacing?, thickness?, height? }[];
    };
  }
  ```

**Compiler** [src/compiler/structuralElements.ts](src/compiler/structuralElements.ts) (new):
- Generate 3D geometry for each element type
- Bulkheads: vertical planes
- Frames: vertical ribs extending inward from hull
- Ribs: horizontal/angled reinforcements

**Room Interaction**:
- Optional: rooms marked as "frame-aware" (see 2.3)
- Frames don't block by default, but can constrain position

**UI**: Create [src/components/editors/StructureEditor.vue](src/components/editors/StructureEditor.vue)
- List of elements with add/delete/edit
- 3D preview: render structure as thin meshes/wireframe
- Toggle visibility per element type

---

### 3.2 Window Placement Rule Engine

**Problem**: MVP has window data model but no generation logic.

**Solution**:
- Schema [src/types/schema.ts](src/types/schema.ts) enhanced `WindowRule`:
  ```typescript
  WindowRule {
    id: string;
    name?: string;
    room_type_filter?: RoomType[];
    room_name_pattern?: string;
    position_filter?: "exterior_only" | "any_wall",
    window_style: "round" | "rectangular" | "slit" | "viewport",
    size_or_radius?: number;
    spacing?: number;
    offset_from_corner?: number;
    quantity_per_wall?: number;
    override_positions?: Vector3[];
  }
  ```

**Compiler** [src/compiler/windows.ts](src/compiler/windows.ts) (new):
1. For each rule: find matching rooms (type filter + name regex)
2. Check if room has exterior faces (hull SDF: `distance(point) <= 0`)
3. Iteratively find exterior edges
4. Place windows at spacing intervals along edges
5. Compute hull surface normal: `hull.normal(point)` → orient window outward
6. Output: `CompiledWindow[]` with position, normal, size, style
7. Manual override: if `override_positions` set, use those

**Hull SDF Improvements**:
- Both algorithms provide accurate `.normal(point)` method
- Parametric surface: analytic derivative
- Voxel method: smoothed gradient

**Mesh Geometry**:
- Pre-baked per style (round, rectangular, etc.)
- Reuse instance across all windows (GPU instancing)

**UI**: Create [src/components/editors/WindowEditor.vue](src/components/editors/WindowEditor.vue)
- List of rules with add/delete/edit
- Per-rule: room type filter, spacing, size, style
- 3D preview: toggle window visibility
- Manual placement: click hull to place individual windows
- "Visualize exterior walls": show room-hull boundaries

---

## Phase 4: Semantic Mesh Export & Hierarchy (Weeks 6-7)

### 4.1 Hierarchical glTF/GLB Export

**Problem**: Current export is flat; no semantic meaning for game engine.

**Solution**: Build structured scene hierarchy, export via GLTFExporter.

**Scene Structure**:
```
Ship (Group)
  └─ Geometry (Group)
      ├─ Hulls (Group)
      │   ├─ Hull_Primary (Mesh)
      │   ├─ Hull_Engine_Pod_L (Mesh)
      │   └─ Hull_Engine_Pod_R (Mesh)
      ├─ Decks (Group)
      │   ├─ Deck_0 (Group)
      │   │   ├─ Structure (Group)
      │   │   │   ├─ Floor (Mesh)
      │   │   │   ├─ Ceiling (Mesh)
      │   │   │   └─ Bulkheads (Mesh)
      │   │   └─ Rooms (Group)
      │   │       ├─ Bridge (Mesh)
      │   │       ├─ Corridor_01 (Mesh)
      │   │       └─ ...
      │   └─ Deck_1 (Group)
      ├─ Structure (Group)
      │   ├─ Longitudinal_Frames (Mesh)
      │   └─ Ribs (Mesh)
      └─ Windows (Group)
          ├─ Round_Windows (Mesh) [instanced]
          └─ Rectangular_Windows (Mesh)
```

**Metadata per Node** (.userData):
```typescript
{
  entityType: "hull" | "deck" | "room" | "window" | "bulkhead" | "frame" | "floor" | "ceiling",
  shipName: string,
  hullIndex?: number,
  hullName?: string,
  deckIndex?: number,
  deckName?: string,
  roomId?: string,
  roomName?: string,
  roomType?: RoomType,
  windowStyle?: string,
  structureType?: string,
}
```

**Export Options** [src/components/editors/ExportEditor.vue](src/components/editors/ExportEditor.vue):
- `includeHulls: bool` (default true)
- `includeDecks: bool` (default true)
- `includeDeckSurfaces: bool` (default false)
- `includeRoomGeometry: bool` (default true)
- `includeStructure: bool` (default true)
- `includeWindows: bool` (default false)
- `hullExportMode: "merged" | "separate"`
- `exportFormat: "glb" | "gltf" | "json" | "yaml"`

**Implementation**:
- Major refactor: [src/utils/export.ts](src/utils/export.ts)
- Create [src/utils/sceneHierarchy.ts](src/utils/sceneHierarchy.ts): hierarchy building

---

### 4.2 Deck Floor/Ceiling Geometry

**Problem**: Rooms exported, but deck surfaces not; game can't identify "deck 3 floor".

**Solution**:
- Optional thin slab geometry for deck surfaces
- Per-deck: floor plane (floorY) and ceiling plane (ceilY)
- Export as separate "Floor_Deck_0", "Ceiling_Deck_0" meshes
- Toggle: `includeDeckSurfaces` option

**Implementation**: [src/compiler/decks.ts](src/compiler/decks.ts) optional surface generation

---

## Phase 5: UVs, LODs, Materials & Procedural Templates (Week 8)

### 5.1 UV Mapping for Hull

**Problem**: Exported hull untextured (no UVs).

**Solution**:
- **Parametric surface**: generates UVs natively during mesh creation
  - V = spine parameter (0-1 along length)
  - U = cross-section parameter (0-1 around circumference)
- **Voxel hull**: post-apply cubic/cylindrical projection

**Implementation**: [src/utils/parametricSurfaceUtils.ts](src/utils/parametricSurfaceUtils.ts) emit UVs during generation

---

### 5.2 Level-of-Detail (LOD) Export

**Problem**: High-resolution meshes expensive; need LOD fallbacks.

**Solution**:
- Export hull at multiple resolutions: LOD0 (high), LOD1 (medium), LOD2 (low)
- Parametric: vary `spine_sample_rate` (LOD0: 100, LOD1: 50, LOD2: 25)
- Voxel: vary `voxel_resolution` (LOD0: 0.5m, LOD1: 1.0m, LOD2: 2.0m)
- glTF LOD sequence; game engine selects by distance

**Export option**: "Export LODs: none | LOD0+1+2"

---

### 5.3 Material Assignment & Livery System

**Problem**: All geometry gray; no color/texture control or faction themes.

**Solution**:
- Schema [src/types/schema.ts](src/types/schema.ts):
  ```typescript
  MaterialAssignment {
    entity_filter: { type: "hull" | "deck" | "room" | "structure", name_pattern?: string };
    material: { name, base_color (hex), metallic?, roughness?, texture_url? };
  }
  
  ShipSpec {
    materials?: MaterialAssignment[];
    livery_preset?: "federation" | "romulan" | "klingon" | "cardassian" | "dominion" | "custom";
  }
  ```

**Livery Presets**: Built-in faction templates (federation white/gold/blue, romulan green/gray, etc.)

**UI**: Create [src/components/editors/MaterialEditor.vue](src/components/editors/MaterialEditor.vue)
- Material palette picker
- Per-entity-type color + texture
- Livery preset selector
- 3D preview with real-time update

**Export**: Apply `MaterialAssignment` rules when building scene; export with embedded materials

---

### 5.4 Procedural Ship Templates & Faction Styles

**Problem**: Hull design from scratch is time-consuming.

**Solution**:
- Pre-built templates (explorer, freighter, warbird, etc.)
- Each: preset hull profile, section shapes, decks, rooms, structure
- Faction variants: thematic tweaks

**Templates** [src/utils/shipTemplates.ts](src/utils/shipTemplates.ts) (new):
```typescript
templates: {
  "federation_explorer": { hull_params, deck_count, room_presets, structure },
  "federation_freighter": {...},
  "romulan_warbird": {...},
  ...
}
```

**UI**: New "Templates" tab in editor; dropdown + "Create from Template" button

**Implementation**: Create [src/utils/shipTemplates.ts](src/utils/shipTemplates.ts) definitions; add UI in editor

---

## Phase 6: UI Polish, Undo/Redo, Keyboard Shortcuts (Weeks 9-10)

### 6.1 Undo/Redo System

**Problem**: MVP lacks state history; mistakes costly.

**Solution**: Command pattern + state snapshots

**Architecture**:
```typescript
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

ShipStore {
  _history: Command[];
  _historyIndex: number;
  undo(): void;
  redo(): void;
  execute(cmd: Command): void;
}
```

**Common Commands** [src/utils/commands.ts](src/utils/commands.ts):
- `AddRoomCommand`, `DeleteRoomCommand`, `MoveRoomCommand`
- `AddHullCommand`, `EditHullCommand`
- `AddDeckCommand`, `EditDeckCommand`
- Per feature type

**UI**: Keyboard `Ctrl+Z` (undo) / `Ctrl+Y` (redo) or toolbar buttons

**Implementation**: Refactor [src/stores/shipStore.ts](src/stores/shipStore.ts); create [src/utils/commands.ts](src/utils/commands.ts)

---

### 6.2 Keyboard Shortcuts

**Problem**: Input handler stubs; shortcuts not wired.

**Solution**: Complete [src/components/composables/useKeyboardShortcuts.ts](src/components/composables/useKeyboardShortcuts.ts)

**Shortcuts**:
- `Ctrl+S`: Save to browser storage
- `Ctrl+E`: Export dialog
- `Ctrl+Z` / `Ctrl+Y`: Undo/redo
- `Delete`: Delete selected element
- `Ctrl+D`: Duplicate selected
- `N`: New ship
- `H`: Show help
- Arrow keys: Pan camera
- Mouse wheel: Zoom
- Right-click drag: Rotate camera

**UI**: [src/components/KeyboardShortcutsHelp.vue](src/components/KeyboardShortcutsHelp.vue) displays all; accessible via `?` key

---

### 6.3 Enhanced UI Feedback

- Tool hints / status bar
- Inline validation error messages
- Property inspector for selected element
- Drag-and-drop support
- Color-coded geometry (zones, collisions, frame grid overlay)

---

## Implementation Sequencing

```
Phase 1: Core Hull Improvements (Weeks 1-2)
├─ 1.1: Dual algorithms (parametric + voxel)
├─ 1.2: Superellipse + symmetry
├─ 1.3: Multi-hull with transforms
└─ 1.4: Hull exclusion from deck gen
    ↓
Phase 2a: Room Shape Extensions (Week 3)
├─ 2.1: Polygon + circle collision detection
├─ Compiler validation strengthening
└─ UI polygon drawing
    ↓ PARALLEL:
Phase 2b: Multi-Deck & Frame-Aware Rooms (Week 3)
├─ 2.2: Span_decks schema + validator
└─ 2.3: Frame-aware positioning
    ↓
Phase 2c: Layout Generators (Week 4)
├─ Shared geometry utilities
├─ Onion, grid, draw tools
└─ LayoutGenerator component
    ↓
Phase 3a: Structural Elements (Week 5)
├─ Bulkheads, frames, ribs schema
├─ Geometry generation
├─ UI Structure editor
└─ Frame queries
    ↓ PARALLEL:
Phase 3b: Window Placement (Week 5-6)
├─ Window rule compiler
├─ Hull normal improvements
├─ Mesh instancing
└─ UI WindowEditor
    ↓
Phase 4: Semantic Export (Week 6-7)
├─ Scene hierarchy building
├─ Metadata per node
├─ glTF export
├─ Deck floor/ceiling
└─ Export options UI
    ↓
Phase 5: LODs, UVs, Materials, Templates (Week 8)
├─ UV mapping
├─ LOD generation
├─ Material assignment + livery
├─ Procedural templates
└─ Editors for all
    ↓
Phase 6: Polish (Weeks 9-10)
├─ Undo/redo (command pattern)
├─ Keyboard shortcuts
└─ UI feedback enhancements
```

---

## Testing Strategy

### Per Phase:

| Phase | Key Tests | Success Criteria |
|-------|-----------|------------------|
| **1** | Hull SDF queries; mesh quality comparison; perf timing | Parametric smooth; backward compat; < 2s compile |
| **2a** | Polygon GJK; SAT collision; validation | Zero false negatives; clean containment |
| **2b** | Span validation; multi-deck rooms; deck range UI | Room occupies correct Y; per-deck validation |
| **2c** | Polygon shrinking; grid gen; preview | Valid layouts; no overlaps |
| **3a** | Structure visibility; frame queries; UI add/delete | Bulkheads/frames appear; frame-aware constrained |
| **3b** | Windows on exterior; normals outward; manual placement | Per-rule population; no interior windows |
| **4** | glTF import; node names + userData; hierarchy | Hierarchy preserved; metadata readable |
| **5** | UV texture wrapping; LOD visual quality; materials apply | Textures align; transparent LOD switch; colors correct |
| **6** | Undo/redo command; shortcut responsiveness | Full history; all shortcuts work |

---

## New Files to Create

- [src/utils/parametricSurfaceUtils.ts](src/utils/parametricSurfaceUtils.ts)
- [src/utils/layoutGeometry.ts](src/utils/layoutGeometry.ts)
- [src/utils/collisionGeometry.ts](src/utils/collisionGeometry.ts)
- [src/utils/frameGeometry.ts](src/utils/frameGeometry.ts)
- [src/utils/sceneHierarchy.ts](src/utils/sceneHierarchy.ts)
- [src/utils/commands.ts](src/utils/commands.ts)
- [src/utils/materials.ts](src/utils/materials.ts)
- [src/utils/shipTemplates.ts](src/utils/shipTemplates.ts)
- [src/compiler/windows.ts](src/compiler/windows.ts)
- [src/compiler/structuralElements.ts](src/compiler/structuralElements.ts)
- [src/components/editors/LayoutGenerator.vue](src/components/editors/LayoutGenerator.vue)
- [src/components/editors/WindowEditor.vue](src/components/editors/WindowEditor.vue)
- [src/components/editors/StructureEditor.vue](src/components/editors/StructureEditor.vue)
- [src/components/editors/MaterialEditor.vue](src/components/editors/MaterialEditor.vue)

---

## Major Files to Modify

- [src/types/schema.ts](src/types/schema.ts) — extensive schema extensions
- [src/compiler/hull.ts](src/compiler/hull.ts) — refactor to strategy pattern
- [src/compiler/index.ts](src/compiler/index.ts) — validation, multi-hull, windows, structure
- [src/compiler/mesh.ts](src/compiler/mesh.ts) — UV generation
- [src/compiler/decks.ts](src/compiler/decks.ts) — optional surface geometry
- [src/utils/export.ts](src/utils/export.ts) — hierarchy, semantic export
- [src/components/editors/DeckPlacementEditor.vue](src/components/editors/DeckPlacementEditor.vue) — shape modes, generators
- [src/components/editors/HullEditor.vue](src/components/editors/HullEditor.vue) — algorithm selector, secondary hulls
- [src/components/editors/ExportEditor.vue](src/components/editors/ExportEditor.vue) — expanded options
- [src/stores/shipStore.ts](src/stores/shipStore.ts) — command history
- [src/components/composables/useKeyboardShortcuts.ts](src/components/composables/useKeyboardShortcuts.ts) — full implementation

---

## Open Questions for Design Review

1. ✅ **Hull algorithm default**: Catmull-Rom spline confirmed for default
2. ✅ **Room validation strictness**: Confirmed—prevent overlaps + out-of-bounds at compile time
3. ✅ **Structural elements as gameplay**: Confirmed—align rooms to frames; multiples per section allowed
4. ✅ **Material colors**: RGB hex strings for base colors; faction presets built-in
5. **Texture resolution**: Game engine will handle; designer specifies URL paths in material assignments
6. **Performance targets**: LOD0 compile < 1s, LOD0-2 < 3s total

---

## Success Criteria (Post-MVP)

- ✅ All features listed implemented and tested
- ✅ Backward compatibility with MVP ship specs
- ✅ Parametric surface hull quality visibly superior to voxel
- ✅ Export glTF hierarchy matches scene structure; game engine can load and parse
- ✅ Designer can create complex multi-section ships with detailed interiors in < 20 minutes
- ✅ UI responsive for all editing modes; no lag in preview at typical ship sizes
- ✅ Documentation complete for game engine consumption

---

**Document Complete**: This roadmap is ready for Phase 1 implementation.
