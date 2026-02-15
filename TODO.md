# Ship Design Toolkit - Development Roadmap

## Overview

Ship Design Toolkit is a production-ready MVPshipdesign application with visual 3D feedback loop. This document tracks MVP completion and post-MVP roadmap.

---

## 📊 Implementation Status (as of Feb 15, 2026)

### MVP Phases (COMPLETE ✅)

| Phase | Focus | Status | Notes |
|-------|-------|--------|-------|
| **Phase 1** | Core MVP (mesh, preview, workflow) | ✅ COMPLETE | Dual algorithms (parametric + voxel), all geometry working |
| **Phase 2** | 2D Room Placement (editor & collision) | ✅ COMPLETE | Full drag-drop, SAT collision detection, CRUD |
| **Phase 3** | Export & Import (formats & library) | ✅ COMPLETE | JSON/YAML/GLB export + localStorage library |
| **Phase 4** | Polish & Optimization | ✅ COMPLETE | Keyboard shortcuts, tooltips, performance optimized |

### Phase 1 Enhanced Enhancements (CURRENT - Feb 2026)

| Feature | Status | Tests | Evidence |
|---------|--------|-------|----------|
| **Dual Hull Algorithms** | ✅ DONE | Phase1.1 | Catmull-Rom parametric (smooth) + voxel (fast) |
| **Superellipse Sections** | ✅ DONE | Phase1.2 | Ellipse/box/superellipse shape support |
| **Multi-Hull Support** | ✅ DONE | Phase1.3 | Multiple independent hulls with transforms |
| **Deck Sizing** | ✅ DONE | Phase1.4 | Fixed deck-to-hull alignment (`yMin` slicing) |
| **Integration Tests** | ✅ DONE | Phase1.integration | Full pipeline validation (212 tests) |

**MVP Readiness**: ✅ **PRODUCTION READY**. All core features implemented, enhanced Phase 1 complete.

---

## MVP Summary (Phases 1-4) ✅ COMPLETE

**Completed Features**:
- ✅ Phase 1: Dual hull algorithms (parametric Catmull-Rom + voxel fallback), mesh baker, 3D preview, tab-based workflow
- ✅ Phase 2: 2D room placement with drag-drop, SAT collision detection, full CRUD operations
- ✅ Phase 3: Export/Import (JSON/YAML/GLB), localStorage project library
- ✅ Phase 4: Keyboard shortcuts, confirmation dialogs, tooltips, performance optimization (7000x speedup with caching)

**Test Coverage**: 212 tests passing (72 compiler + 140 components/integration)
**Status**: Production-ready, all core features implemented

**Key Files**:
- Core compiler: `src/compiler/{hull.ts, decks.ts, mesh.ts, index.ts}` with parametric surface utils
- UI components: `src/components/{Preview3D.vue, StepEditor.vue, editors/*.vue, composables/*.ts}`
- State: `src/stores/shipStore.ts` (Pinia)
- Utils: `src/utils/{parametricSurfaceUtils.ts, export.ts, storage.ts, meshCache.ts, profiling.ts}`

---

## 🚀 Post-MVP Roadmap (Current Focus)

### Phase 5.0: Unified Multi-Hull System (CURRENT - BREAKING CHANGE)

**Architecture Shift**: Consolidating primary + secondary hulls into single `ship.hulls[]` array.
- Breaking change: Old designs with separate primary/secondary structure will migrate on load
- Backwards compatibility: Not maintained (user choice)
- Benefit: Single UI for all hull editing, support for boolean ops, extensible to multiple hull types

**Current Progress**:
- ✅ Phase 5.0a: Hierarchy + Selection system (Complete)
- ✅ Phase 5.0c: Unified hull data model & rendering (Complete) - Feb 15, 2026
- ⏳ Phase 5.0d: Boolean mesh operations
- ⏳ Phase 5.0e: Hull type flexibility (cubic, conic, etc.)

**Key UI Changes** (coming in 5.0c):
- Merge "1. Hull" + "1b. Secondary Hulls" tabs → "1. Hulls" (single tab for all)
- All hulls edited in unified HullInstanceEditor
- Boolean operation selector with 3 visual icons: 🟢 Union | 🔴 Difference | 🟡 Intersection

**Key Data Changes** (coming in 5.0c):
```typescript
// OLD: separate fields
ship.hull: HullSpec                // Primary
ship.secondaryHulls?: HullSpec[]   // Secondary

// NEW: unified array
ship.hulls: HullInstance[] = [
  { id: "primary", isPrimary: true, hullSpec, worldTransform, booleanOp: "union" },
  { id: "secondary-1", isPrimary: false, hullSpec, worldTransform, booleanOp: "union" },
  { id: "secondary-2", isPrimary: false, hullSpec, worldTransform, booleanOp: "union" },
]
```

---

#### Phase 5.0c: Unified Hull Data Model & Basic Rendering

**Goal**: Get all hulls rendering from single `ship.hulls[]` array. No boolean ops yet.

**Implementation Checkpoint 1: Update Types** ✅
- [x] Add `HullInstance` interface with fields: `id`, `name`, `isPrimary`, `hullSpec`, `worldTransform`, `booleanOp`, `enabled`
- [x] Add `HullInstanceSchema` with Zod validation
- [x] Add `hulls: HullInstance[]` to `ShipState`
- [x] File: `src/types/index.ts`, `src/types/schema.ts`
- **Verify**: No TypeScript errors, proper schema validation ✅

**Implementation Checkpoint 2: Migration & Store Methods** ✅
- [x] Add `migrateToUnifiedHulls()` called on store init
- [x] Migrate `ship.hull` → `ship.hulls[0]` (isPrimary: true, booleanOp: "union")
- [x] Migrate `ship.secondaryHulls[]` → `ship.hulls[1+]` (isPrimary: false)
- [x] Replace `addSecondaryHull()`, `updateSecondaryHull()`, `deleteSecondaryHull()` with generic versions
- [x] Add helpers: `getHullById(id)`, `getPrimaryHull()`, `getSecondaryHulls()`
- [x] File: `src/stores/shipStore.ts`
- **Verify**: Console logs show migration working, old methods forward to new ones ✅

**Implementation Checkpoint 3: Mesh Generation** ✅
- [x] Update `useMeshManagement.ts` to iterate `ship.hulls[]`
- [x] Generate mesh for each hull with `enabled === true`
- [x] Apply `worldTransform` to each mesh (position, rotation, scale)
- [x] For now: Just overlay all meshes (no boolean ops yet, ignore `booleanOp` field)
- [x] Keep deck generation using primary hull only
- [x] File: `src/components/composables/useMeshManagement.ts`
- **Verify**: Secondary hulls now render in 3D at correct positions/rotations ✅

**Implementation Checkpoint 4: Unify Editor Component** ✅
- [x] Rename `SecondaryHullEditor.vue` → `HullInstanceEditor.vue`
- [x] Update to work with `HullInstance` (not just `HullSpec`)
- [x] Add Boolean Op selector with 3 buttons showing icons + text:
  - `🟢 Union` – add this hull
  - `🔴 Difference` – subtract this hull
  - `🟡 Intersection` – keep only overlap
- [x] Add hull list selector at top of editor showing all hulls
- [x] Make all sections collapsible (metadata, spec, transform, booleanOp, actions)
- [x] Restore hull parameter editing (length, beam, height, bias, interior decks)
- [x] (UI only; no effect until Phase 5.0d)
- [x] File: `src/components/editors/HullInstanceEditor.vue`
- **Verify**: Hull selector, collapsible sections, parameter editing all functional ✅

**Implementation Checkpoint 5: Simplify Tabs** ✅
- [x] Remove "Tab 1b. Secondary Hulls" from StepEditor
- [x] Rename "Tab 1. Hull" → "Tab 1. Hulls"
- [x] Load HullInstanceEditor for any selected hull
- [x] File: `src/components/StepEditor.vue`
- **Verify**: Tab switching works, selecting secondary hull opens HullInstanceEditor ✅

**Testing Checklist** (Ready for user testing):
- [ ] Load existing ship → migration runs, hulls render in 3D
- [ ] Select secondary hull in hierarchy → HullInstanceEditor opens
- [ ] Edit position → mesh updates in real-time
- [ ] Edit hull parameters (length, beam, height) → mesh updates in real-time
- [ ] Edit name/rotation/scale → updates reflected immediately
- [ ] Add new hull → renders with unique name
- [ ] Delete hull → removed from hierarchy and 3D view
- [ ] Boolean op buttons visible and clickable (no action yet)
- [ ] Hull selector lists all hulls with proper icons and enabled toggles
- [ ] Collapsible sections expand/collapse properly
- [ ] No console errors

**Estimated Effort**: 6-8 hours

---

#### Phase 5.0d: Boolean Mesh Operations

**Goal**: Actually combine meshes using union/difference/intersection.

**Implementation**:
- Use mesh boolean library (Three.js CSG or similar)
- Process hulls in order, combining by `booleanOp`
- Real-time update as user changes operations

**Estimated Effort**: 4-6 hours

---

#### Phase 5.0e: Hull Type Flexibility

**Goal**: Support cubic, conic, and other hull shapes beyond parametric.

**Implementation**:
- Add `type: 'parametric' | 'cubic' | 'conic'` to HullInstance
- Implement generators for each type
- UI selector for hull type

**Estimated Effort**: 8-10 hours

---

#### Phase 5.0b: Visual Spline Editor (Deferred)

Visual hull profile editor. Will implement after 5.0c-e complete.

---

**OLD CONTENT (for reference, being replaced)**:

### Phase 5.0: Essential Hull Features (NEXT - Critical for Interesting Ships)

#### Phase 5.0a: Secondary Hull UI Editor & Management + Object Hierarchy Panel
- [ ] **Object Hierarchy Tree Panel**
  - [ ] New panel/sidebar showing ship structure tree:
    ```
    📦 Ship: "Enterprise-D"
    ├── ⚓ Primary Hull (saucer)
    │   └── 📋 Decks (4)
    │       ├── Deck 1
    │       ├── Deck 2
    │       ├── Deck 3
    │       └── Deck 4
    ├── 🛰️ Secondary Hulls (2)
    │   ├── Engine Pod (Port)
    │   │   └── 📋 Decks (2)
    │   │       ├── Deck E1
    │   │       └── Deck E2
    │   └── Engine Pod (Starboard)
    │       └── 📋 Decks (2)
    │           ├── Deck E1
    │           └── Deck E2
    └── 🚪 Rooms (12) [searchable/expandable]
    ```
  - [ ] Collapsible/expandable nodes (click to expand/collapse categories)
  - [ ] Visual icons for each object type (⚓ hull, 🛰️ secondary, 📋 deck, 🚪 room, 📦 ship)
  - [ ] Context-sensitive expansion (e.g., show "Decks (4)" as collapsed count, expand on click)

- [ ] **Enhanced Selection System**
  - [ ] Extend existing `selectItem()` store to support:
    - Single object selection (existing: `selectItem('room', id)`)
    - Group selection (`selectItem('all-hulls')`, `selectItem('all-decks')`, `selectItem('all-rooms')`)
    - Multi-selection support (hold Ctrl/Cmd to add to selection, Shift for range)
  - [ ] Selection state in store:
    ```typescript
    selectedItems: {
      itemType: 'hull' | 'deck' | 'room' | 'all-hulls' | 'all-decks' | 'all-rooms',
      itemIds: string[] // for multi-select
    }
    ```
  - [ ] Update store methods:
    - `selectItem(type, id, multiSelect?: boolean)` — single or add to selection
    - `selectMultiple(type, ids)` — select multiple items
    - `selectAllOfType(type)` — select all hulls/decks/rooms
    - `clearSelection()` — deselect everything
    - `toggleSelection(type, id)` — toggle individual item

- [ ] **Visual Highlighting Updates**
  - [ ] 3D Preview highlighting:
    - [ ] Single selection: current yellow glow
    - [ ] All-hulls selected: highlight all hull meshes with lighter blue wash
    - [ ] All-decks selected: highlight all deck polygons
    - [ ] All-rooms selected: highlight all room volumes
    - [ ] Multi-selection: glow each selected item with distinct color/outline
  - [ ] 2D Deck view highlighting:
    - [ ] Multi-room selection: draw outlines in group color
    - [ ] All-rooms selection: semi-transparent group highlight
  - [ ] Hierarchy panel:
    - [ ] Selected items show checkmark or highlight background
    - [ ] Group selections show partial checkbox (some children selected)

- [ ] **Secondary Hull Editor Component**
  - [ ] Panel that appears when secondary hull is selected (or inline in hierarchy)
  - [ ] Controls:
    - [ ] Hull name/description
    - [ ] Position (X, Y, Z world coordinates with sliders)
    - [ ] Rotation (pitch, yaw, roll in degrees)
    - [ ] Scale factor (0.1x to 2.0x)
    - [ ] Profile mode: "Use Primary Profile" vs "Custom Profile"
    - [ ] Visibility toggle (eye icon)
  - [ ] Quick actions:
    - [ ] Duplicate hull (copy current + auto-offset position)
    - [ ] Mirror hull (reflect across X/Y/Z plane)
    - [ ] Delete hull
    - [ ] Reset to default position (0, 0, 0)

- [ ] **Integration with Existing Selection**
  - [ ] Clicking on hierarchy items updates store selection
  - [ ] Clicking on 3D hull/deck/room updates hierarchy highlighting
  - [ ] Deck editor integration: show which deck is selected in hierarchy
  - [ ] Room editor integration: show which room is selected in hierarchy
  - [ ] Copy selection state between 3D view and hierarchy panel

- [ ] **Keyboard & Mouse Interactions**
  - [ ] Click item: select (focus)
  - [ ] Ctrl/Cmd+Click: add to selection
  - [ ] Shift+Click: range select (if applicable)
  - [ ] Right-click: context menu (duplicate, delete, rename, etc.)
  - [ ] Double-click: expand/collapse node or open properties panel
  - [ ] Drag to reorder? (future: reorder secondary hulls, decks)

- [ ] **Search/Filter in Hierarchy**
  - [ ] Text input to filter objects by name
  - [ ] Only show matching items + parents
  - [ ] Useful for large ships with 50+ rooms

  **Files to create/modify**:
  - `src/components/HierarchyPanel.vue` — Main tree hierarchy component
  - `src/components/HierarchyNode.vue` — Recursive tree node component
  - `src/components/editors/SecondaryHullEditor.vue` — Secondary hull property editor
  - `src/stores/shipStore.ts` — Enhanced selection state & methods
  - `src/components/Preview3D.vue` — Multi-selection highlighting in 3D
  - `src/components/editors/DeckPlacementEditor.vue` — Hierarchy integration in 2D
  
  **Store changes** (examples):
  ```typescript
  // New state
  selection: {
    itemType: 'room' | 'deck' | 'hull' | 'all-hulls' | 'all-decks' | 'all-rooms' | null;
    itemIds: string[] | null; // for multi-select
  }

  // New methods
  selectItem(type, id, multiSelect = false)
  selectAllOfType(type)
  clearSelection()
  toggleSelection(type, id)
  selectMultiple(type, ids)
  isSelected(type, id): boolean
  ```
  
  **Testing**: 20+ component tests for selection, hierarchy expansion, multi-select, highlighting

#### Phase 5.0b: Visual Spline Editor (Drag to Edit Hull Profile)
- [ ] **2D Spline Control Point Inspector**
  - [ ] Display spine.points as draggable nodes in 2D canvas
  - [ ] X-axis = position along ship (normalized Z, -1 to +1)
  - [ ] Y-axis = hull radius at that point
  - [ ] Drag control points to reshape hull in real-time
  - [ ] Visual feedback: show resulting hull cross-section live
  - [ ] Add/remove control points (click to add, right-click to remove)
  - [ ] Symmetric editing (double-click to toggle interpolation curve)
  - **Canvas features**:
    - [ ] Zoom/pan for precise editing
    - [ ] Grid overlay (optional)
    - [ ] Reference guides (width, height labels)
    - [ ] Snap to grid option
    - [ ] Undo support for spline dragging
  - [ ] Numeric fallback (still support entering numbers directly)
  - [ ] Export spline shape (save favorite profiles/presets)
  - [ ] Import spline shape (load from saved library)
  - [ ] Constraint system: min/max radius limits per point
  - **Files to create**: `src/components/SplineEditor.vue`, `src/utils/splineEditing.ts`
  - **Files to modify**: `HullEditor.vue` (integrate SplineEditor tab)
  - **Testing**: 15+ tests for spline manipulation, validation, constraints

**Implementation Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     ShipDesignerApp                             │
├─────────────────────────────────────────────────────────────────┤
│  Header (Title + Buttons)                                       │
├──────────────────────┬──────────────────────┬──────────────────┤
│  HierarchyPanel      │  StepEditor (Tabs)   │  Preview3D       │
│  (Left Sidebar)      │  (Center Editor)     │  (Right 3D View) │
│                      │                      │                  │
│  📦 Ship             │  ┌────────────────┐  │  [3D Canvas]     │
│  ├─ ⚓ Primary Hull  │  │ Basic Controls │  │  (shows selected │
│  │  └─ 📋 Decks(4)  │  ├─ Tab: Hull     │  │   items with     │
│  ├─ 🛰️ Secondary(2) │  ├─ Tab: Decks    │  │   highlighting)  │
│  │  ├─ Engine L     │  ├─ Tab: Rooms    │  │                  │
│  │  └─ Engine R     │  ├─ Tab: Spline   │  │  Click hull/deck/│
│  └─ 🚪 Rooms (12)   │  │  Editor         │  │  room → updates  │
│     [Expand/Filter] │  ├─ Tab: Secondary│  │  hierarchy panel │
│                      │  │  Hulls         │  │                  │
│  [Search Box]        │  └────────────────┘  │                  │
│                      │  Properties Panel    │                  │
│                      │  (shows selected     │                  │
│                      │   object details)    │                  │
└──────────────────────┴──────────────────────┴──────────────────┘

Selection Flow:
  Click in Hierarchy → shipStore.selectItem() → Redux triggers update
  → Preview3D highlights selected → 2D view updates → Details panel shows
  ↓
  Click in 3D view → shipStore.selectItem() → Hierarchy panel updates
  ↓
  Ctrl+Click → shipStore.selectMultiple() → Multi-highlight in 3D/2D
  ↓
  Select All Hulls button → shipStore.selectAllOfType('hull') → All hulls highlighted
```

**Enhanced Store Selection Model**:
```typescript
// OLD (simple single-select)
selection: { itemType: 'room' | 'deck' | 'hull'; itemId: string | null }

// NEW (supports single + group + multi-select)
selection: {
  mode: 'single' | 'group' | 'multi'; // selection mode
  itemType: 'hull' | 'deck' | 'room' | 'all-hulls' | 'all-decks' | 'all-rooms';
  itemIds: string[]; // empty for 'all-*' types
}

// Methods that handle all selection scenarios
selectItem(type, id, multiSelect?)  // single or add to selection
selectAllOfType(type)               // select all hulls/decks/rooms
clearSelection()                    // deselect all
toggleSelection(type, id)           // toggle individual item
isSelected(type, id): boolean       // check if item selected
getSelectedIds(): string[]          // get all selected item IDs
```

**Highlighting in 3D Preview**:
```
Selection           → 3D Highlight
─────────────────────────────────
Single hull         → Yellow wireframe glow
Single deck         → Blue semi-transparent plane
Single room         → Green semi-transparent box
All hulls           → All hulls with light blue pulse
All decks           → All deck outlines visible
All rooms           → All room boxes visible
Multi-select        → Each item with distinct outline color
```

**Component Hierarchy** (Updated):
```
ShipDesignerApp
├── Header (with help, export buttons)
├── MainLayout (flex container)
│   ├── HierarchyPanel (LEFT SIDEBAR)
│   │   ├── HierarchyNode (recursive tree)
│   │   │   ├── Icon + Name + [+/-]
│   │   │   ├── Click → selectItem()
│   │   │   ├── Ctrl+Click → selectMultiple()
│   │   │   └── Right-click → context menu
│   │   └── Search filter (filter items by name)
│   ├── StepEditor (CENTER)
│   │   ├── Tab: Hull Editor
│   │   │   ├── Basic Controls
│   │   │   ├── Tab: Spline Editor (NEW)
│   │   │   └── Tab: Secondary Hulls (NEW)
│   │   ├── Tab: Deck Editor
│   │   ├── Tab: Room Editor / DeckPlacementEditor
│   │   ├── Tab: Export Editor
│   │   └── Properties Panel (shows selected item details)
│   └── Preview3D (RIGHT)
│       ├── 3D Canvas (scene rendering)
│       ├── Camera controls
│       └── Multi-selection highlighting

Stores:
  shipStore
    selection: { mode, itemType, itemIds }
    selectItem(), selectAllOfType(), clearSelection(),
    toggleSelection(), isSelected(), getSelectedIds()
```

**Benefits of These Integrated Features:**
- **Hierarchy Panel + Multi-Selection**: Enables designer to quickly navigate complex ships with 50+ decks/rooms. "Select all decks" shows entire deck structure at once. Select individual room to inspect.
- **Secondary Hulls**: Unlocks iconic multi-part ships (Enterprise saucer+nacelles, Star Destroyer wedge+engines, asymmetric fighter craft)
- **Visual Spline Editor**: Makes hull design 10x faster and more intuitive than numeric input. Designers can sketch hull profiles interactively.
- **Integrated Selection**: Consistent interaction model across all views: 3D → hierarchy, hierachy → 3D, 2D deck view → hierarchy all synced in real-time.
- **Highlighting System**: Visual feedback for all selection modes helps designer understand complex multi-hull, multi-deck structures at a glance.

**Estimated Effort**:
- Phase 5.0a (Hierarchy + Selection): 12-15 hours (complex tree component + state management + 3 Views)
- Phase 5.0b (Spline Editor): 8-10 hours (canvas math + drag interaction + undo support)
- Total: ~20-25 hours for both essential features

---

### Phase 5: Advanced Room Placement & Layout Generators
- [ ] **5.1 Polygonal Room Shapes**
  - [ ] Support rectangular, L-shaped, hexagonal, and custom polygon rooms
  - [ ] Update room editor UI with shape selector
  - [ ] Implement polygon collision detection for placement validation
  - [ ] Extend SAT collision to handle arbitrary polygons
  - **Files to create**: `src/utils/polygonShapes.ts`
  - **Files to modify**: `src/compiler/decks.ts`, `DeckPlacementEditor.vue`

- [ ] **5.2 Multi-Deck Room Spans**
  - [ ] Allow rooms to span multiple decks (e.g., vertical shafts, atriums)
  - [ ] Add "deck span" property to room spec (startDeck, endDeck)
  - [ ] Update 3D mesh generation to extrude rooms across deck heights
  - [ ] Update 2D placement to show multi-deck influence
  - **Files to modify**: `src/types/index.ts`, `src/compiler/mesh.ts`, `RoomEditor.vue`

- [ ] **5.3 Frame-Aware Layout Generator**
  - [ ] Define longitudinal frames (structural elements along Z)
  - [ ] Snap room boundaries to frame positions
  - [ ] Generate rooms aligned with frame grid
  - [ ] Visualize frame overlays in 2D editor
  - **Files to create**: `src/compiler/frames.ts`, `FrameEditor.vue`

- [ ] **5.4 Layout Generators (Auto-Fill)**
  - [ ] Manual draw mode: Click-drag-release to place rooms
  - [ ] Grid-based layout: Auto-create NxM rooms on deck
  - [ ] Concentric shells: Radiate rooms outward from hull center
  - [ ] Command/bridge tower: Pre-positioned layout for command sections
  - **Files to create**: `src/utils/layoutGenerators.ts`

### Phase 6: Structural Elements & Detailing
- [ ] **6.1 Bulkheads (Transverse Walls)**
  - [ ] Define bulkhead positions (percentage along hull length)
  - [ ] Visualize in 3D as vertical planes
  - [ ] Bulkhead editor with add/delete/position controls
  - [ ] Export bulkhead data in mesh hierarchy
  - **Files to create**: `src/compiler/bulkheads.ts`, `BulkheadEditor.vue`

- [ ] **6.2 Longitudinal Frames (Internal Stiffening)**
  - [ ] Define frame spacing and orientation
  - [ ] Visualize frame girders in cross-section
  - [ ] Calculate frame weight/materials
  - [ ] Frame impact on room placement constraints
  - **Files to create**: `src/compiler/frames.ts`

- [ ] **6.3 Ribbing & Internal Structure**
  - [ ] Rib pattern definition (spacing, height, thickness)
  - [ ] 3D rib visualization on hull interior
  - [ ] Parametric rib generation from hull shape
  - **Files to create**: `src/utils/ribbing.ts`

### Phase 7: Window & Feature Placement (Rule Engine)
- [ ] **7.1 Window Placement Rules**
  - [ ] Define rule presets (uniform grid, class-based, faction-specific)
  - [ ] Rule parameters: spacing, size, offset from hull, section masks
  - [ ] Apply rules by deck/section/room type
  - [ ] Manual override system for custom placement
  - **Files to create**: `src/compiler/windowPlacement.ts`, `WindowRuleEditor.vue`

- [ ] **7.2 Hardpoint & Emitter Mounts**
  - [ ] Hardpoint database (type, size, fire arcs)
  - [ ] Mount placement rules (tip/mid/stern positioning)
  - [ ] Conflict detection (overlapping arcs, hull intersection)
  - [ ] Visual hardpoint indicators in 3D preview
  - **Files to create**: `src/compiler/hardpoints.ts`, `HardpointEditor.vue`

- [ ] **7.3 Viewport Windows & Observation Ports**
  - [ ] Bridge viewport placement (forward, 360-degree, observation decks)
  - [ ] Hangar bay door placement
  - [ ] Sensor dome/turret placement rules
  - **Files to modify**: `WindowRuleEditor.vue`

### Phase 8: Advanced Mesh & Export Features
- [ ] **8.1 Semantic Mesh Hierarchy**
  - [ ] Export mesh with scene hierarchy (hull → decks → rooms → details)
  - [ ] Material slots per component (hull material, deck, room interior)
  - [ ] Metadata tags for game engine integration (hardpoints, doors, spawns)
  - [ ] Extended GLB export with custom properties
  - **Files to modify**: `src/utils/export.ts`, `src/compiler/mesh.ts`

- [ ] **8.2 UV Mapping & Texturing Support**
  - [ ] Auto-UV hull (triplanar projection)
  - [ ] Per-room material assignment
  - [ ] Texture coordinate metadata in export
  - [ ] Livery layer support (color masks, decals)
  - **Files to create**: `src/utils/uvMapping.ts`

- [ ] **8.3 LOD (Level of Detail) Generation**
  - [ ] Automatic LOD0, LOD1, LOD2 mesh variants
  - [ ] Progressive mesh simplification
  - [ ] LOD switching thresholds
  - [ ] Export all LODs in single GLB file
  - **Files to create**: `src/utils/lodGeneration.ts`

- [ ] **8.4 Baked Lighting Prep**
  - [ ] Mark light probe positions
  - [ ] Generate ambient occlusion maps
  - [ ] Export lightmap UVs
  - [ ] Prepare for game engine static baking
  - **Files to create**: `src/utils/lightingPrep.ts`

### Phase 9: Material & Livery System
- [ ] **9.1 Material Definition**
  - [ ] Create material library (hull armor, deck plating, window materials)
  - [ ] Material properties: color, metallic, roughness, emissive
  - [ ] Material browser UI in editor
  - [ ] Save/load material presets
  - **Files to create**: `src/utils/materials.ts`, `MaterialEditor.vue`

- [ ] **9.2 Livery & Faction Customization**
  - [ ] Livery templates (Starfleet white, Klingon red, etc.)
  - [ ] Decal/stripe placement system
  - [ ] Color scheme generator
  - [ ] Per-faction default liveries
  - **Files to create**: `src/utils/liveries.ts`, `LiveryEditor.vue`

- [ ] **9.3 Paintjob & Custom Texturing**
  - [ ] Texture painting on hull surface (in 3D viewport)
  - [ ] Texture export/import
  - [ ] Multi-layer texture blending
  - **Files to create**: `src/components/TexturePainter.vue`

### Phase 10: Procedural Ship Templates & Presets
- [ ] **10.1 Template System**
  - [ ] Define ship type templates (corvette, frigate, destroyer, cruiser, capital)
  - [ ] Template inheritance and composition
  - [ ] Parameter constraints (hull length/beam/height ranges per class)
  - [ ] Auto-scaling to class parameters
  - **Files to create**: `src/compiler/templates.ts`

- [ ] **10.2 Faction Presets**
  - [ ] Federation, Klingon, Romulan, etc. design templates
  - [ ] Aesthetic rules (hull shape preferences, default colors)
  - [ ] Pre-positioned hardpoint patterns
  - [ ] Livery defaults
  - **Files to create**: `src/data/factions.ts`

- [ ] **10.3 Procedural Generation**
  - [ ] Algorithm: Generate random ship within faction aesthetic
  - [ ] Randomize hull parameters, deck counts, room layouts
  - [ ] Variance constraints (keep within faction look)
  - [ ] Seed-based reproducibility
  - **Files to create**: `src/utils/shipGenerator.ts`

### Phase 11: Advanced Editor Features
- [ ] **11.1 Undo/Redo System**
  - [ ] Command pattern history stack
  - [ ] Undo/redo for all mutations (Ctrl+Z/Ctrl+Y)
  - [ ] History visualization/branch support
  - **Files to create**: `src/utils/commandHistory.ts`

- [ ] **11.2 2D Deck Drawing Tools**
  - [ ] Bezier curve tool for complex room boundaries
  - [ ] Freehand polygon drawing on deck
  - [ ] Smart snapping to grid/frames
  - [ ] Polygon boolean operations (union, subtract, intersect rooms)
  - **Files to create**: `src/utils/polygonEditing.ts`

- [ ] **11.3 Search & Filter**
  - [ ] Global search for rooms/components by name/type
  - [ ] Filter by deck, room type, size range
  - [ ] Bulk operations on filtered results
  - **Files to modify**: `ExportEditor.vue`

- [ ] **11.4 Ship Comparison**
  - [ ] Load two ships side-by-side in 3D view
  - [ ] Highlight differences (hull shape, deck layout, room placement)
  - [ ] Export comparison report
  - **Files to create**: `ShipComparison.vue`

### Phase 12: Validation & Simulation Hooks
- [ ] **12.1 Design Validation Rules**
  - [ ] Check structural integrity (bulkhead count, frame distribution)
  - [ ] Verify crew flow (corridor connectivity, emergency egress)
  - [ ] Validate hardpoint line-of-fire (no friendly fire zones)
  - [ ] Power distribution (reactor placement, conduit routing)
  - [ ] Custom rule editor
  - **Files to create**: `src/compiler/designValidator.ts`, `ValidationEditor.vue`

- [ ] **12.2 Performance Metrics**
  - [ ] Calculate ship displacement (volume × material density)
  - [ ] Estimate heat generation (reactor + systems)
  - [ ] Power budget (systems consumption vs reactor output)
  - [ ] Acceleration/agility metrics from mass distribution
  - **Files to create**: `src/utils/shipMetrics.ts`

- [ ] **12.3 Simulation Integration Hook**
  - [ ] Export validated design to game engine format
  - [ ] Pass ship data to physics simulator
  - [ ] Quick launch to game preview (if external simulator available)
  - **Files to create**: `src/utils/simulationExport.ts`

### Phase 13: Collaborative & Version Control
- [ ] **13.1 Design Snapshots**
  - [ ] Create named save points with annotations
  - [ ] Compare snapshots (diff view)
  - [ ] Revert to any snapshot
  - [ ] Snapshot branching (alternate design paths)

- [ ] **13.2 External Storage & Cloud Sync**
  - [ ] Export to GitHub gist (version control)
  - [ ] Save to cloud storage (Google Drive, OneDrive, dropbox)
  - [ ] Load from shared drives
  - [ ] Conflict resolution for concurrent edits

- [ ] **13.3 Collaboration Mode (Future)**
  - [ ] Real-time multi-user editing (WebSocket)
  - [ ] Cursor tracking for other users
  - [ ] Chat/comments on design elements
  - [ ] Permission levels (view, edit, admin)

---

## Post-MVP Quick Wins (Low Effort, High Value)

These can be done in parallel with main roadmap phases:

- [ ] Export to Blender-compatible FBX (existing exporters available)
- [ ] "Favorite" ships (star/heart button, filter in library)
- [ ] Recent ships quick-access menu
- [ ] Drag-drop import (drop file onto viewport)
- [ ] Viewport screenshot/render (save 3D view as image)
- [ ] YouTube-style ship preview link (share design on web)
- [ ] Dark/light theme toggle
- [ ] Metric units conversion (feet/yards, lbs/kg, etc.)
- [ ] Mobile responsive layout (Phase 14+)

---

## Development Priorities (Recommended Sequencing)

### Critical First (Essential for Interesting Ship Designs)
1. **Phase 5.0b** - Visual Spline Editor (huge UX impact, enables creative designs)
2. **Phase 5.0a** - Secondary Hull Editor & Management (required for multi-part ships)

### High Value, Follow Immediately After
3. **Phase 5.1** - Polygonal rooms (unlocks design flexibility)
4. **Phase 6.1** - Bulkheads (adds structural realism)
5. **Phase 7.1** - Window placement rules (huge visual impact)

### Medium Value, Parallel Path (Alongside)
- Phase 5.2, 5.3, 5.4 (Layout generators)
- Phase 8.1 (Semantic export for game engines)
- Phase 11.1 (Undo/redo - essential UX feature)

### Polish & Specialization (Later, as Needed)
- Phase 9 (Liveries/materials - cosmetic but important)
- Phase 10 (Templates/procedural - quality-of-life)
- Phase 12 (Validation/simulation - domain-specific)

---

## Known Limitations & Future Improvements

### Critical Gaps (Phase 5.0 Priority)
- **Secondary Hulls**: Type system & compiler support exists (tested), but **NO UI editor**. Cannot add/edit/delete secondary hulls from GUI.
  - Workaround: Manual JSON editing of spec
  - Solution: Phase 5.0a secondary hull editor component
  
- **Spline Editing**: Only numeric control point input available. No visual/drag-based editing.
  - Workaround: Use numeric controls to adjust spine.points
  - Solution: Phase 5.0b visual spline editor with canvas

### Current Limitations
- Single-hull focus in UI (secondary hulls exist but limited UI)
- No curved bulkheads (only perpendicular to Z-axis)
- Window placement is manual only (no rules engine)
- No undo/redo (use browser back button)
- No design collaboration (local-only editing)

### Future Improvements
- Performance: GPU acceleration for voxel generation
- UX: Drag between tabs, split-screen editing
- Export: Add STL (3D printing), COLLADA (game assets)
- Analysis: Structural FEA, thermal simulation
- Community: Design sharing marketplace, user templates
