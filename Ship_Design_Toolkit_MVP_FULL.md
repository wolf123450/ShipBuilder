# 1. Goals & Non-Goals (Expanded)

## 1.1 Problem Statement

There is a gap between:

* **General-purpose 3D tools** (Blender, CAD): extremely powerful but cognitively heavy, unstructured, and not ship-aware
* **In-game ship designers** (Starfield, Space Engineers): accessible but shallow, restrictive, and visually repetitive

This project aims to create a **spaceship-specific design toolkit** that:

* Encodes *domain knowledge* about ships (hulls, decks, rooms)
* Guides users through a **structured workflow**
* Produces **exportable, engine-agnostic geometry**
* Scales from fighters to capital ships without changing tools

This is not “3D modeling made easier.”
It is **ship design made intentional**.

---

## 1.2 Target Users / Personas

### 1) Player-Designer

* Wants to *design their own ship*
* Thinks in terms of rooms, decks, bridges, hangars
* Does **not** want to think about vertices or topology
* Needs guardrails to avoid invalid designs

**UX priorities**

* Visual editors
* Immediate feedback
* Presets + sliders
* Minimal text input

---

### 2) Game Designer / Content Author

* Wants repeatable, believable ships
* Needs consistency across factions/classes
* May hand-tune key ships
* Wants exports usable in-engine

**UX priorities**

* Determinism
* Parameter control
* Reusable templates
* Scriptable / data-driven formats (YAML)

---

### 3) Procedural Generation System (non-human)

* Consumes and produces ship specs
* Needs a clean, composable data model
* Must validate constraints programmatically

**UX priorities**

* Clear schema
* Predictable compilation
* No hidden editor-only state

---

## 1.3 Core Design Goals

### G1 — Ship-Aware Abstractions

The system must operate on **ship concepts**, not generic geometry.

Allowed primitives:

* Hulls
* Decks
* Rooms
* Windows
* Anchors

Disallowed primitives (at authoring time):

* Vertices
* Edges
* Faces
* UV islands

Geometry is an *output*, not an editing medium.

---

### G2 — Progressive Constraint, Not Absolute Freedom

Each stage of the workflow **reduces degrees of freedom**:

```
Hull → Decks → Rooms → Details
```

This:

* Prevents invalid designs early
* Keeps the problem space tractable
* Makes procedural generation feasible

Freedom exists **within** constraints, not outside them.

---

### G3 — Visual-First UX, Data-First Architecture

* Primary interaction: **visual editors**
* Underlying representation: **structured data**
* YAML (or equivalent) is:

  * Canonical
  * Serializable
  * Diffable
  * Exportable

No critical state may exist *only* in editor UI.

---

### G4 — Web-Native (Vue.js-First)

The system must:

* Be implemented as a standalone local web application
* Use modern web frameworks and component patterns
* Run entirely in the browser with no server dependency

The ship designer should be:

* Accessible via any modern web browser
* Usable as a standalone tool
* Capable of headless operation via Node.js for generation/export

---

### G5 — Scales Across Ship Classes

The same tools must support:

* Single-seat fighters
* Corvettes
* Cruisers
* Multi-deck capital ships

Without:

* Mode switching
* Tool changes
* Separate pipelines

Scale is data, not architecture.

---

## 1.4 Explicit Non-Goals (MVP)

These are **intentionally excluded** to keep scope sane.

### NG1 — No Freeform Mesh Editing

* No vertex pushing
* No sculpting
* No topology editing

If a user wants that, they export to Blender.

---

### NG2 — No Full CAD / Engineering Simulation

Out of scope for MVP:

* Stress analysis
* Realistic load paths
* Structural failure modeling
* Fluid dynamics

Believability > physical accuracy.

---

### NG3 — No Fully General Node Graph

* No arbitrary math graphs
* No user-defined topology graphs
* No Turing-complete node soup

This is a **domain-specific system**, not Geometry Nodes.

---

### NG4 — No Hyper-Detail Interiors (Yet)

MVP interiors are:

* Rectangular
* Abstracted
* Semantic

Not:

* Furniture placement
* Door hinge modeling
* Wiring / piping

Those belong in later layers or separate tools.

---

## 1.5 Success Criteria (MVP)

The MVP is successful if:

### Functional

* A user can design:

  * A small fighter
  * A mid-size ship
  * A multi-deck capital ship
* Ships export cleanly to `.glb`
* No manual mesh cleanup is required post-export

---

### UX

* A non-artist can design a ship in under 30 minutes
* Invalid actions are prevented or clearly explained
* Users rarely need to touch YAML directly

---

### Technical

* Ship data can be:

  * Serialized
  * Versioned
  * Generated procedurally
* Mesh generation is deterministic
* Rebuilding the same spec yields the same mesh

---

## 1.6 Guiding Design Principles

These should influence **every** later section.

1. **Intent over geometry**
2. **Constraints are features**
3. **2D first, 3D second**
4. **Authoring ≠ baking**
5. **Ships are buildings, not props**

---

## 1.7 MVP Scope Boundary Diagram

![Image](https://www.projectrho.com/public_html/rocket/images/deckplans/spaceScout1Tb.jpg)

![Image](https://www.froggodgames.com/cdn/shop/products/Deck-plan-1-scout_6c967dab-9bd7-46bf-a45e-d95fc2604402.png?v=1666892889)

![Image](https://res.cloudinary.com/ducqxvol0/images/f_auto%2Cq_auto/v1677196857/hull_cross_section_howard16a/hull_cross_section_howard16a.gif?_i=AA)

**Inside MVP**

* Hull volume
* Deck slicing
* Room layout
* Window projection
* Mesh export

**Outside MVP**

* Damage modeling
* Structural simulation
* Detailed interiors
* Freeform modeling

---

# 2. Architectural Overview (Expanded)

## 2.1 Core Mental Model: “Ship as a Compiled Artifact”

A ship is **not** edited directly as geometry.

Instead:

> A ship is **described**, then **compiled** into geometry.

This mirrors how:

* Source code → binary
* Scene description → rendered frame
* Blueprint → constructed building

### Key Consequence

You never “edit the mesh.”
You **invalidate and rebuild** the mesh from higher-level intent.

This single decision:

* Enables procedural generation
* Enables undo/redo at semantic levels
* Prevents topology corruption
* Makes exports deterministic

---

## 2.2 One-Way Data Flow (No Cycles)

The system enforces a **strict top-down pipeline**:

```
ShipSpec (Data)
   ↓
Hull Representation
   ↓
Deck Layout
   ↓
Room Layout
   ↓
Surface Features
   ↓
Baked Mesh
```

### Rules

* Higher layers may **query** lower layers
* Lower layers may **not modify** higher layers
* No feedback loops in MVP

This avoids the classic “edit mesh → interior breaks → hull invalid” nightmare.

---

## 2.3 Canonical Data vs Derived Data

### Canonical (Persisted)

Saved to YAML, JSON, or browser storage:

* Hull parameters
* Deck parameters
* Room definitions
* Window rules
* Metadata

### Derived (Ephemeral)

Computed on demand:

* Deck footprints
* Room-to-hull intersections
* Window positions
* Meshes

Derived data:

* Is cached
* Can be invalidated
* Is never edited directly

---

## 2.4 Vue.js Application Architecture

### High-Level Component Structure

```
ShipDesignerApp (Vue App)
├── ShipSpec (Pinia Store)
├── ShipCompiler (TypeScript Module)
│   ├── HullBuilder
│   ├── DeckBuilder
│   ├── RoomBuilder
│   ├── WindowBuilder
│   └── MeshBaker
├── EditorUI (Vue Components)
│   ├── HullEditor.vue
│   ├── DeckStackView.vue
│   ├── DeckEditor2D.vue
│   └── ShipInspector.vue
└── Preview3D (Three.js Canvas)
```

### Responsibilities

#### ShipSpec (Pinia Store)

* Pure reactive data
* Serializable to JSON/YAML
* Versionable
* Framework-agnostic structure

#### ShipCompiler (TypeScript Module)

* Stateless (or lightly cached)
* Accepts ShipSpec
* Produces DerivedShipData
* Implemented as pure functions

#### EditorUI (Vue Components)

* Mutates ShipSpec via store actions
* Triggers recompilation via watchers
* Never touches meshes directly
* Reactive to store state changes

#### Preview3D (Three.js)

* Displays baked results in 3D canvas
* Read-only in MVP
* Updates on mesh recompilation

---

## 2.4.1 Implementation Status (as of Feb 2026)

This section documents the current state of implementation for reference during development.

### Architecture Alignment

| Goal | Design Specification | Implementation | Status |
|------|----------------------|-----------------|--------|
| **G1** | Ship-aware abstractions (hull, deck, room not vertices) | Full type system + UI editors | ✅ Complete |
| **G2** | Progressive constraint (Hull → Decks → Rooms → Export) | Tab-based workflow implemented | ✅ Complete |
| **G3** | Visual-first UI + data-first YAML/JSON backend | Vue components + serializable specs | ✅ Complete |
| **G4** | Web-native (Vue.js standalone app) | Vue 3 + Pinia + Vite | ✅ Complete |
| **G5** | Scale across ship classes (fighters to capitals) | Type system supports all scales | ✅ Complete |

### Compilation Pipeline Status

| Stage | Purpose | Implementation | Status | Notes |
|-------|---------|-----------------|--------|-------|
| **1** | Hull Resolution | `createHullVolume()` in `hull.ts` | ✅ Complete | Queryable SDF-based representation |
| **2** | Deck Resolution | `compileDeckFootprints()` in `decks.ts` | ✅ Complete | Generated 2D polygons per deck |
| **3** | Room Resolution | `validateRooms()` in `index.ts` | ✅ Complete | Overlap detection with SAT algorithm |
| **4** | Surface Features | Window placement rules | ⏳ Deferred | Planned for Phase 4+ |
| **5** | Mesh Baking | `bakeHullMesh()` in `mesh.ts` | ✅ Complete | Voxel-based mesh generation |

### Feature Implementation

| Feature | Design Req. | Implementation | Status |
|---------|------------|-----------------|--------|
| **Hull Editing** | Lofted spine with parameters | `HullEditor.vue` | ✅ Complete |
| **Deck Editing** | Stack height & vertical range | `DeckEditor.vue` | ✅ Complete |
| **Room Placement** | 2D editor with collision detection | `DeckPlacementEditor.vue` (1,187 lines) | ✅ Complete |
| **3D Preview** | Real-time visualization | `Preview3D.vue` with camera controls | ✅ **Exceeds Spec** |
| **Export Formats** | JSON, YAML, GLB/GLTF | `src/utils/export.ts` | ✅ Complete |
| **File Import** | Load & validate specs | `importFromFile()` with error handling | ✅ Complete |
| **Project Library** | Browser-based persistence | localStorage CRUD in `ExportEditor.vue` | ✅ Complete |

### Test Coverage

- **Compiler Tests**: 22/22 passing
- **Hull Module**: 6 tests (queries, slicing, bounds)
- **Deck Module**: 6 tests (footprints, validation)
- **Mesh Module**: 5 tests (resolution, geometry)
- **Integration Tests**: 5 tests (end-to-end compilation)
- **Vue Components**: 0 formal tests (deferred to Phase 4)

### Known Deferred Items

| Item | Reason | Planned Phase |
|------|--------|----------------|
| Window placement system | Complex rule engine, not blocking MVP | Phase 4+ |
| Undo/redo system | Requires state management refactor | Phase 4+ |
| Keyboard shortcuts | UX polish, deferred | Phase 4 |
| Component integration tests | Test infrastructure exists, low priority | Phase 4 |
| Performance optimization | Current perf acceptable for MVP | Phase 4 |

---

## 2.5 Compilation Stages (Detailed)

### Stage 1 — Hull Resolution

Input:

* Hull parameters

Output:

* Queryable hull representation

Must support:

* `contains(point)`
* `slice(z)`
* `surface_normal(point)`

This representation becomes **the authority** for all spatial validation.

---

### Stage 2 — Deck Resolution

Input:

* Hull
* Deck parameters

Output:

* Ordered deck list
* Each deck has:

  * Z bounds
  * 2D footprint polygon

Decks are **structural layers**, not geometry.

---

### Stage 3 — Room Resolution

Input:

* Decks
* Room specs

Output:

* Validated room volumes
* Room-to-deck mapping

Validation happens here:

* Overlap detection
* Out-of-hull checks
* Size constraints

Rooms remain **semantic volumes**, not meshes.

---

### Stage 4 — Surface Feature Resolution

Input:

* Rooms
* Hull surface

Output:

* Window placement data
* Cutout descriptors (future)

This stage:

* Bridges interior intent → exterior form
* Is entirely rule-driven

---

### Stage 5 — Mesh Baking

Input:

* All resolved volumes

Output:

* Triangle meshes
* Collision meshes (optional)
* Exportable geometry

Mesh baking:

* Is destructive
* Is repeatable
* Has no influence upstream

---

## 2.6 Invalidation & Rebuild Strategy

Any change triggers **partial recompilation**.

### Examples

* Change hull → rebuild everything
* Change deck height → rebuild decks, rooms, windows, mesh
* Move room → rebuild rooms, windows, mesh
* Change window spacing → rebuild windows + mesh only

This keeps performance reasonable even for large ships.

---

## 2.7 Determinism Guarantees

Given:

* Same ShipSpec
* Same version
* Same compiler settings

You must get:

* Identical geometry
* Identical window placement
* Identical deck indices

This is critical for:

* Multiplayer
* Save files
* Procedural generation
* Debugging

---

## 2.8 Web App vs Headless Modes

Same architecture, different usage:

### Web App Mode

* Full Vue.js UI enabled
* Live recompilation via Pinia watchers
* Visual overlays and 3D preview
* Browser-based interaction

### Headless/CLI Mode

* ShipSpec loaded from file
* ShipCompiler runs once via Node.js
* Mesh exported to file
* No UI rendering
* Useful for batch generation and CI/CD pipelines

No separate “tool version” of ships.

---

## 2.9 Conceptual Architecture Diagram

![Image](https://www.researchgate.net/publication/343196448/figure/fig8/AS%3A960092077826054%401605915197536/The-concept-of-our-terrain-generation-system-as-a-pipeline-model.png)

![Image](https://www.researchgate.net/publication/48446815/figure/fig1/AS%3A340570493997058%401458209741287/Modeling-and-rendering-pipeline-typically-found-in-a-3D-documentation-project-LOD-Level.png)

![Image](https://www.researchgate.net/publication/339097240/figure/fig1/AS%3A11431281371561750%401744371417539/Diagram-of-a-Building-Information-Modeling-BIM-work-process.tif)

**Key takeaway**
This system behaves more like:

* A *compiler*
* A *BIM pipeline*
* A *procedural content build step*

Than like a traditional 3D editor.

---

## 2.10 Extension Hooks (Reserved)

Architectural decisions made *now* that enable later growth:

* Hull stage can swap parametric ↔ SDF
* Room stage can add adjacency graphs
* Deck stage can support splits/double-height
* Surface stage can add:

  * Greebles
  * Damage decals
  * Modular attachments
* Mesh baker can output:

  * LODs
  * Collision layers
  * Nav meshes

None require rewriting the pipeline.

---

## 2.11 Technology Stack (MVP)

The system is implemented as a standalone local web application with the following technologies:

### Frontend

* **Vue.js 3** — reactive UI components and data binding
* **TypeScript** — type-safe development
* **Pinia** — state management for ShipSpec and derived data
* **Three.js** — 3D rendering and preview (WebGL canvas)
* **Tailwind CSS** — UI styling
* **Vite** — build tooling and dev server

### Backend / Compiler

* **TypeScript / Node.js** — ShipCompiler modules (can run in browser or Node.js)
* **Zod** — schema validation for ShipSpec
* **js-yaml** — YAML parsing and serialization

### 3D Mesh Generation

* **Three.js** — basic geometry primitives
* **marching-cubes** — SDF-based mesh extraction
* **cannon.js or Babylon.js physics** — collision mesh generation (optional)
* **three-bvh-csg** or similar — CSG operations if needed (future)

### Export

* **three-gltf-exporter** or **babylon.js** — GLB/GLTF export
* **Draco compression** — optional mesh compression for smaller files

### Storage

* **localStorage** — save/load current project
* **IndexedDB** — optional persistent library of ships (future)
* **File API** — import/export YAML and JSON files

### Development

* **Vitest** — unit testing for compiler, validation, etc.
* **Cypress/Playwright** — E2E testing
* **ESLint + Prettier** — code quality

---

# 3. Core Data Model (YAML-first, UI-driven)

## 3.1 Design Requirements for the Data Model

### DR1 — Canonical, Portable, Deterministic

The data model must be:

* The *single source of truth*
* Independent of Vue component instances or browser IDs
* Deterministic (order + defaults defined)
* Round-trip safe: load → edit → save without loss

### DR2 — UI-First Editing

Users primarily edit via UI; YAML is optional.
Therefore:

* Fields must be **discoverable** and not “magic”
* Defaults must be explicit in schema, not implicit in code
* The schema must be stable enough to build menus around

### DR3 — Extensible Without Breaking Saves

We will add features later. The spec must support:

* Schema versioning
* Forward-compatible unknown fields (preserve on load/save)
* Clear migration strategy

### DR4 — Separation of “Spec” vs “Derived”

Only persist *intent*, not computed artifacts (polygons, meshes, triangulations).

---

## 3.2 File Format & Storage Strategy

### Canonical Format

* JSON for browser-native representation and localStorage
* YAML for human-editable import/export
* Both formats are equivalent and interchangeable

**MVP path**

* In-app save: localStorage with JSON (fast, persistent)
* Export: `.yaml` or `.json` files (portable)
* Import: `.yaml` or `.json` → ShipSpec
* Optional: IndexedDB for larger ship libraries

### Round-Trip Preservation

If a YAML file includes fields not understood by the current version, they must:

* Be stored in an `extras` map per object
* Be re-emitted on save

This enables:

* Experimental branches
* Modding
* Backward/forward compatibility

---

## 3.3 Schema Versioning

### Version Field

```yaml
spec_version: 1
ship: ...
```

### Migration Policy

* Loader supports:

  * Current version
  * N-1 versions (at minimum)
* Migrators are pure functions:

  * `v0 -> v1`
  * `v1 -> v2`

### Deterministic Defaults

Defaults are defined in **one place**:

* `ShipSpecSchema.ts` TypeScript interface with Zod validation
* UI reads schema to populate forms
* Compiler reads schema to interpret missing fields

No duplicated “default” logic.

---

## 3.4 Canonical Object Identity

Every authorable entity gets:

* A stable string ID
* UI-visible name (optional)

Example:

```yaml
rooms:
  - id: "bridge_main"
    name: "Main Bridge"
```

### ID Rules

* Unique within its category
* ASCII + underscore recommended
* Never derived from list indices (indices change)

This enables:

* references
* future linking (adjacency graphs, anchor points, scripts)

---

## 3.5 Root Structure (MVP)

```yaml
spec_version: 1

ship:
  meta: ...
  hull: ...
  decks: ...
  rooms: ...
  windows: ...
```

### Why this order matters

* Consistent diff output
* Easier merges
* Human-readable

---

## 3.6 `meta` Object

Purpose:

* Human-facing identity
* Defaults for units and scaling
* Future: faction style presets

```yaml
meta:
  name: "Unnamed Vessel"
  description: ""
  role: "explorer"        # optional tag
  scale: "capital"        # fighter | small | medium | capital
  units: "meters"
```

**MVP constraints**

* `units` fixed to meters in compiler
* `scale` is a hint only (UI presets)

---

## 3.7 `hull` Object (MVP form)

The hull section defines a single hull volume as parameters.

```yaml
hull:
  type: "lofted_spine"
  symmetry: "x"            # none | x | y | z (MVP: x)
  length: 300.0            # meters
  max_beam: 120.0          # meters (width)
  max_height: 60.0         # meters (height)

  spine:
    # z is normalized 0..1 along length
    # radius is normalized 0..1 relative to max_beam/2
    points:
      - z: 0.00
        radius: 0.20
        top_bias: 0.00     # -1..1, optional (asymmetry reserved)
      - z: 0.30
        radius: 0.85
      - z: 0.70
        radius: 0.95
      - z: 1.00
        radius: 0.25
```

### MVP rules

* `points` must be sorted by `z`
* Minimum 3 points
* Linear interpolation between points (no splines yet)
* `symmetry` forced to `"x"` by UI (but schema allows future expansion)

### Extension hooks (reserved fields)

* `profile_curve`
* `section_shape` (circle/ellipse/superellipse)
* `secondary_hulls` (nacelles, saucers)
* `booleans` list (union/diff/intersection)
  These are **not used** in MVP compiler but can be preserved.

---

## 3.8 `decks` Object (MVP form)

MVP uses uniform decks.

```yaml
decks:
  deck_height: 3.0
  start_z: 0.10       # normalized along length, or actual? choose ONE (MVP: normalized)
  end_z: 0.90
  naming:
    scheme: "index"   # index | naval | custom (MVP: index)
```

### Coordinate convention

To avoid confusion later:

**MVP standard**

* Hull length axis = local `Z` (fore→aft)
* Width axis = local `X` (port→starboard)
* Height axis = local `Y` (down→up)

So:

* Deck slicing is along **Y** (height), not along hull length.
* Therefore `start_y`/`end_y` is actually more correct than `start_z`.

**Action:** pick now and be consistent.

✅ Recommendation: use `start_y` / `end_y` in meters (world-ish units), not normalized.

Revised MVP decks:

```yaml
decks:
  deck_height: 3.0
  start_y: -15.0
  end_y:  15.0
```

This removes ambiguity and makes “Galaxy class has 42 decks” not depend on hull length.

(If you prefer normalized slicing, it’s doable, but it gets weird fast.)

---

## 3.9 `rooms` List (MVP form)

Rooms are per-deck 2D shapes extruded by deck height.

```yaml
rooms:
  - id: "bridge"
    type: "command"
    deck: 8
    shape:
      type: "rect"
      size: [20.0, 15.0]    # [x_width, z_length] in meters
    position:
      x: 0.0
      z: -90.0              # relative to hull origin
    rotation_deg: 0
    tags: ["front", "vip"]  # optional
```

### MVP room types (enum)

* `command`
* `corridor`
* `crew`
* `cargo`
* `engineering`

### MVP geometry types (enum)

* `rect`
* (reserved) `poly`
* (reserved) `circle`

### MVP validation

* Must fit inside deck footprint polygon
* Must not overlap other rooms on same deck
* Must have minimum size per type

---

## 3.10 `windows` Object (MVP form)

Windows are rule-based, derived from rooms.

```yaml
windows:
  enabled: true
  style: "round"          # round (MVP), reserved: rect, slit
  radius: 0.25
  spacing: 2.5
  include_room_types: ["crew", "command"]
  per_deck_limit: 200     # safety cap for performance
```

### Future fields (reserved)

* `avoid_zones` (engines, weapons)
* `angle_constraints`
* `frame_avoidance`

---

## 3.11 Coordinate System & Units (Must be explicit)

This is the kind of thing that kills projects if it’s fuzzy.

### Local Ship Coordinate Frame (MVP)

* Origin: ship center (approx center of mass is not required)
* +Z: forward (nose)
* -Z: aft (engines)
* +X: starboard
* -X: port
* +Y: up
* -Y: down

All positions in meters.

Rooms use:

* `x,z` on the deck plane
* `deck` index determines `y` range

---

## 3.12 Example Minimal ShipSpec (MVP)

```yaml
spec_version: 1
ship:
  meta:
    name: "Test Hull"
    scale: "medium"
    units: "meters"

  hull:
    type: "lofted_spine"
    symmetry: "x"
    length: 60
    max_beam: 18
    max_height: 8
    spine:
      points:
        - z: 0.00
          radius: 0.20
        - z: 0.25
          radius: 0.80
        - z: 0.75
          radius: 0.70
        - z: 1.00
          radius: 0.15

  decks:
    deck_height: 2.6
    start_y: -2.6
    end_y: 2.6

  rooms:
    - id: cockpit
      type: command
      deck: 1
      shape: { type: rect, size: [4, 3] }
      position: { x: 0, z: 18 }

    - id: cargo_1
      type: cargo
      deck: 0
      shape: { type: rect, size: [6, 8] }
      position: { x: 0, z: 0 }

  windows:
    enabled: true
    style: round
    radius: 0.2
    spacing: 1.8
    include_room_types: [command, crew]
```

---

## 3.13 UI Mapping (How YAML becomes menus)

This matters because you explicitly want click-through UI.

### UI drives schema, not the other way around

* Each object category becomes a tab/step
* Each enum becomes a dropdown
* Each list entry has:

  * Add / duplicate / delete
  * ID and name editing
  * Validation status badge

### Suggestion: schema-driven UI

Maintain a small “schema definition” structure in code:

* field types (float/int/enum/list)
* ranges
* defaults
* tooltips

Then UI and validation can share it.

---

## 3.14 Diagram: Spec vs Derived

```
          ┌──────────────┐
          │  ShipSpec     │  (saved)
          └──────┬───────┘
                 │ compile
                 ▼
        ┌──────────────────┐
        │ DerivedShipData   │  (cached)
        │ - hull queries    │
        │ - deck polygons   │
        │ - room volumes    │
        │ - window points   │
        └──────┬───────────┘
               │ bake
               ▼
        ┌──────────────────┐
        │ Mesh Outputs      │  (export)
        │ - hull mesh       │
        │ - optional decks  │
        │ - window decals   │
        └──────────────────┘
```

---

## 3.15 Extension Opportunities (Not Implemented Yet)

Reserved now, implemented later:

* `anchors` (attachment points)
* `modules` (engines, turrets)
* `styles` (faction profiles)
* `constraints` (adjacency graphs)
* `booleans` (hangar cuts, trenches)
* multi-deck rooms (`span_decks: 2+`)

Keeping these as reserved keys prevents painful schema refactors later.

---

# 4. Hull System (MVP) — Expanded

## 4.1 Responsibilities of the Hull System

The hull system must provide:

1. **Authoring controls**

   * A small set of parameters that produce a wide design space
   * Symmetry support
   * A profile editor that feels like “ship design,” not 3D sculpting

2. **Queryable geometry**

   * “Inside/outside” tests
   * Cross-sections for deck footprints
   * Approximate surface normals (for window projection)

3. **Bakeable geometry**

   * Produce a mesh for preview/export
   * Deterministic results

**Non-goals in MVP**

* Hull booleans (union/diff)
* Multiple hull volumes (nacelles/saucers)
* Sharp creases / paneling
* Detailed exterior “greebles”

Those are extension points reserved for later.

---

## 4.2 Coordinate Frame (Restated here because it matters)

Local ship axes:

* +Z = forward (nose)
* -Z = aft (engines)
* +X = starboard
* +Y = up

Hull is centered at origin by default (you can define origin conventions later, but MVP can assume origin at hull center).

---

## 4.3 MVP Hull Type: Lofted Spine Hull

### Concept

A lofted spine hull is defined by:

* Ship length (meters)
* Max beam (width) and max height
* A 1D “spine” curve along Z with radius control
* (Optional later) cross-section shape controls

Think: “a submarine hull, but spaceship-shaped.”

### User-facing parameters

* **Length**
* **Beam**
* **Height**
* **Spine control points**

  * position along length
  * radius scale

This is intentionally limited: it’s easy to understand and hard to break.

---

## 4.4 Data Representation (MVP)

From Section 3:

```yaml
hull:
  type: "lofted_spine"
  symmetry: "x"
  length: 300.0
  max_beam: 120.0
  max_height: 60.0
  spine:
    points:
      - z: 0.00
        radius: 0.20
      - z: 0.30
        radius: 0.85
      - z: 0.70
        radius: 0.95
      - z: 1.00
        radius: 0.25
```

**Interpretation**

* Actual Z coordinate in meters:
  `Z = (z_normalized - 0.5) * length` (if centered)
  or `Z = z_normalized * length` (if nose at 0).
  Pick one; MVP recommended: **centered at origin**.

* Actual radius in meters:
  `R = radius_normalized * (max_beam / 2)`

* Height scaling is initially a simple multiplier so the hull is ellipsoid-ish in Y.

---

## 4.5 The Big MVP Choice: Implicit vs Parametric

You’ll eventually want booleans and clean slicing. For an MVP in a web-based system:

### Option A — Implicit Hull (SDF-based)

Represent hull as a signed distance function `d(p)`.

Pros:

* Easy inside/outside: `d(p) <= 0`
* Easy slicing: sample grid → polygonize
* Future booleans are trivial (min/max ops)

Cons:

* Mesh extraction is heavier
* Sharpness is hard
* Needs sampling resolution decisions

### Option B — Parametric Mesh + Queries

Build a mesh (loft), and approximate queries.

Pros:

* Simple to render
* Clean hull mesh for export
* Fast preview

Cons:

* Inside/outside and slicing are harder
* Booleans later become a headache
* “Deck footprint” generation becomes messy

✅ **Recommendation for your stated long-term goals:**
**Use an implicit hull representation internally for queries**, *even if you also generate a mesh for preview*.

That gives you the “compiler pipeline” you want.

---

## 4.6 MVP Hull SDF Definition (Concrete)

We want an SDF that:

* Feels like a lofted hull
* Is cheap enough to sample
* Supports symmetry cleanly

### Approach: “Radius field along Z”

Define a function `R(z)` by linear interpolation of control points.

Then define an ellipsoid-like distance in X/Y at each Z:

Let:

* `rx = R(z)` (half-width)
* `ry = R(z) * (max_height / max_beam)` (half-height scaling)

Then the normalized radial value:

* `q = sqrt( (x/rx)^2 + (y/ry)^2 )`

Inside hull if `q <= 1`.

Distance estimate:

* `d = (q - 1) * min(rx, ry)` (approx; good enough for sign + normals)

This is not a mathematically perfect SDF everywhere, but it’s sufficient for:

* containment
* rough normals via gradient sampling
* meshing

### Symmetry enforcement

If `symmetry: x`, then:

* treat X as `abs(x)` when evaluating `d(p)`

---

## 4.7 Queries Provided by Hull API

Create a `HullVolume` interface that all hull types implement.

```typescript
interface HullVolume {
  contains(p: Vector3): boolean;
  distance(p: Vector3): number;           // signed-ish distance
  normal(p: Vector3): Vector3;             // approximate surface normal
  bounds(): AABB;
  sliceY(y: number, resolution: number): Vector2[];
}
```

### Notes

* `sliceY` returns a 2D polygon in the X/Z plane at height `y`
* `resolution` controls sampling density (meters per sample)

---

## 4.8 Deck Footprints Depend on Hull Slicing

Because decks are horizontal layers, you need:

* Slice at deck midpoints (or bounds)
* Compute hull cross-section at that Y
* Use polygon(s) as allowed footprint region

MVP: assume one contiguous region (no disjoint shapes)

Later: allow multiple polygons (holes, disjoint sections)

---

## 4.9 Mesh Baking Strategy (MVP)

Even if your hull is implicit, your mesh can be baked via:

### Strategy 1 — Voxel sampling + Marching Cubes

* Sample SDF into a 3D grid
* Extract iso-surface

Pros:

* Simple and robust
  Cons:
* Resolution-dependent
* Might look “steppy” without smoothing

### Strategy 2 — Dual Contouring (later)

Better sharp feature retention (when you add booleans/panels).

MVP choice:

* Marching Cubes with adjustable grid size

**Performance note**

* For large ships, use adaptive resolution:

  * Low-res preview while editing
  * High-res bake for export

---

## 4.10 Hull Editor UX (MVP)

The hull editor should be a **2D profile UI**.

### UI elements

* A spine graph (control points)
* Sliders for:

  * length
  * beam
  * height
* Toggle symmetry (locked to X in MVP)
* Presets:

  * fighter / freighter / cruiser / wedge-ish

### Interaction model

* Drag points on a 2D chart:

  * x-axis: z position along length
  * y-axis: radius
* Points auto-sort by z
* Constraints:

  * min radius > 0
  * endcaps can’t exceed near max radius unless allowed

### Live preview

* Update hull mesh in 3D preview
* Update deck footprints overlays (optional)

---

## 4.11 Validation Rules (MVP)

### Hard validation (cannot export)

* Invalid spine points (unsorted, duplicates, <3 points)
* Non-positive length/beam/height
* Radius values outside [0..1]

### Soft validation (warning)

* Hull too thin to fit a deck height
* Extreme tapers that break window placement

---

## 4.12 Extension Opportunities (Reserved)

These should be accounted for in the `HullVolume` interface and schema, but not implemented.

1. **Multiple hull volumes**

   * saucer + neck + engineering hull
   * nacelles as separate volumes

2. **CSG booleans**

   * cut hangar bays
   * add trenches
   * union engine pods

3. **Section shape control**

   * superellipse / boxy / triangular
   * top/bottom asymmetry (Galaxy-class saucer flattening)

4. **Style presets**

   * faction templates that constrain profiles

---

## 4.13 Diagram: Hull as Queryable Volume in Pipeline

```
 ShipSpec.hull params
        │
        ▼
  HullVolume (SDF)
  ┌──────────────────────────┐
  │ contains(p)              │
  │ distance(p)              │
  │ normal(p)                │
  │ slice_y(y, res) -> poly  │
  └───────────┬──────────────┘
              │
              ├──> DeckBuilder uses slice_y()
              ├──> RoomBuilder uses contains()
              └──> WindowBuilder uses normal() + surface finding
```

---

# 5. Deck System (MVP) — Expanded

## 5.1 Responsibilities of the Deck System

The deck system must:

1. **Define a stack of decks** inside the hull volume
2. Produce **usable 2D footprints** per deck (for room placement)
3. Provide **deck indexing + naming** that stays stable through edits
4. Support a UX where designers can quickly:

   * change deck count/height
   * inspect deck slices
   * jump between decks
5. Produce derived deck geometry for preview/export (optional)

**Non-goals in MVP**

* Split decks (one deck becoming two partial decks)
* Variable deck heights per region
* Double-height spaces / atriums
* Structural bulkheads

Those are planned extension points.

---

## 5.2 Conceptual Model: Decks as “Sliced Usable Planes”

A deck is fundamentally:

* A **Y interval** `[y0, y1]` (floor-to-ceiling)
* A **2D usable region** on that layer = hull cross-section minus margins

MVP treats each deck as a **single contiguous polygon**.

**Key design principle**

> Rooms are placed on deck footprints, not in 3D.

This keeps the interior authoring problem 2D.

---

## 5.3 Deck Parameterization (Canonical Data)

From the spec:

```yaml
decks:
  deck_height: 3.0
  start_y: -15.0
  end_y:  15.0
  naming:
    scheme: "index"
```

### Derived Values

* `deck_count = floor((end_y - start_y) / deck_height)`
* Deck `i` floor/ceiling:

  * `floor_y = start_y + i * deck_height`
  * `ceil_y  = floor_y + deck_height`
  * `mid_y   = (floor_y + ceil_y) / 2`

### MVP Constraints

* `end_y > start_y`
* `deck_height > 0`
* `deck_count >= 1`

---

## 5.4 Coordinate & Index Conventions (Pick once, never change)

### Deck indexing

MVP: **0 is lowest deck**, increasing upward.

If a ship is symmetric around Y=0, then deck indices won’t be “negative.” That’s fine. Index is not physical coordinate.

### Deck naming scheme (MVP)

* `index` → “Deck 0”, “Deck 1”… (“D0” style can be preference)
* reserved:

  * `naval` (like Deck 1 as “Main Deck”)
  * `custom` (user-specified labels)

The important part is that **room references use deck indices**, not labels, so renaming doesn’t break links.

---

## 5.5 Deck Footprints: What They Are

A deck footprint is the **valid region for room placement** in X/Z plane at a given Y.

### Where it comes from

* Call `HullVolume.slice_y(mid_y, res)` → polygon boundary in X/Z plane
* Optionally apply an interior margin:

  * wall thickness
  * structural clearance
  * “don’t build flush with hull” padding

So the final buildable region is:

```
footprint = offset_inward(hull_slice_polygon, margin)
```

### MVP simplification

* `margin` can be a single float, default maybe 0.5–2.0m depending on scale
* footprint is assumed a single polygon (no holes)

**Extension hook**
Later, `slice_y` can return:

* multiple polygons (disjoint regions)
* polygons with holes (hangars, trenches)

---

## 5.6 Footprint Representation Type

In a web-based system, represent the footprint as:

* `PackedVector2Array` in X/Z plane (2D)
* Use `Geometry2D` for:

  * point-in-polygon tests
  * polygon offsetting (if available/robust)
  * intersection/union operations (later)

### Practical note

Polygon offsetting is notoriously tricky. For MVP:

* Prefer *simple inward scaling* for convex-ish shapes
* Or sample-based “shrink” (move vertices along normals + fix self-intersections)
* Or skip margin entirely at first

Pick stability > perfection.

---

## 5.7 Deck Derivation Algorithm (MVP)

For each deck `i`:

1. Compute `mid_y`
2. Sample hull slice polygon at that `mid_y`
3. Validate polygon:

   * must have area above a minimum threshold
   * must have enough vertices
4. Optionally apply margin shrink
5. Store as derived `DeckFootprint`

### Edge cases

* Near top/bottom decks, slices may become tiny or empty.
  MVP rule:
* Generate all decks by formula
* Mark decks as “non-usable” if footprint is too small
* UI can hide or show them with a filter

This is better than silently changing deck count.

---

## 5.8 Deck Data Structures

### Canonical

`DeckSpec` is implicit in `decks` section (height + range)

### Derived

Create a derived structure:

```typescript
interface DeckInfo {
  index: number;
  floorY: number;
  ceilY: number;
  midY: number;
  
  footprint: Vector2[];
  area: number;
  usable: boolean;
}
```

Derived data lives in `DerivedShipData` and is thrown away/recomputed as needed.

---

## 5.9 Deck UI (MVP)

### 1) Deck Stack View

A vertical list with:

* deck index
* small thumbnail of footprint
* warnings badge (tiny/invalid)
* click to open Deck Editor

Controls at top:

* deck height (slider + numeric)
* start_y / end_y (numeric + handles)
* “Auto-fit to hull” (optional: sets start/end based on hull bounds)

### 2) Deck Inspector (when selected)

Shows:

* floor/ceil/mid Y
* footprint area
* usable yes/no
* room count on this deck

### 3) Cross-section preview toggle

Optional but powerful:

* in 3D preview, show a translucent slice plane at current deck
* highlight deck outline

---

## 5.10 Validation & Feedback (MVP)

### Hard errors (export-blocking)

* `deck_height <= 0`
* `end_y <= start_y`

### Soft warnings

* fewer than N usable decks (N depends on scale)
* decks exist but many are unusable due to hull shape
* footprint area too small for any room type

UI should visualize:

* Unusable decks greyed out
* Warnings as badges with hover explanations

---

## 5.11 Performance Strategy (Important for capital ships)

Deck slicing can be expensive if it samples the hull heavily.

### MVP performance plan

* Cache footprints by `(deck_index, hull_hash, resolution, margin)`
* Recompute only when:

  * hull changes
  * deck parameters change
* Use adaptive resolution:

  * preview: coarse (e.g., 1.0–2.0m)
  * finalize/export: fine (e.g., 0.25–0.5m)

### Safety caps

* Max decks displayed at once (virtualize list)
* Max polygon vertex count per slice (simplify)

---

## 5.12 Extension Opportunities (Reserved)

These depend on the deck stage being well-defined.

1. **Variable deck heights**

   * per-region or per-deck overrides

2. **Split decks**

   * partial decks across hull sections
   * “mezzanines”

3. **Double-height volumes**

   * hangars, atriums, engine rooms spanning decks
   * requires room system to “own” a vertical range

4. **Pressure hull vs superstructure decks**

   * inner volume decks differ from outer silhouette decks

5. **Deck-based window bands**

   * windows can be placed by deck band, not rooms

---

## 5.13 Diagram: Deck Slicing Concept

```
          +Y (up)
             ^
             |
   Hull      |        slice at mid_y
  volume     |    ----------------------  Deck i (2D footprint in X/Z)
             |
             |
             +-------------------------> +Z (forward)
            /
          +X (starboard)
```

Each deck becomes a **2D map**; the hull is only used to derive the map.

---

# 6. Interior Room System (MVP) — Expanded

## 6.1 Responsibilities of the Room System

The room system must:

1. Let users **place and edit rooms** on a deck footprint
2. Enforce **basic geometric validity**

   * inside deck footprint
   * no overlap
   * minimum sizes
3. Preserve **semantic intent** (room type) for downstream stages

   * windows
   * later: adjacency, gameplay, crew systems
4. Support **repeatable patterns**

   * duplicate room
   * repeat along an axis
   * (optional MVP+) simple “fill strip with cabins”

**Non-goals in MVP**

* Automatic corridor routing
* Navmesh generation
* Door placement
* Furniture/props
* Multi-deck rooms (hangars)
* Structural bulkheads

We’ll reserve hooks so we don’t rewrite later.

---

## 6.2 Room Concept: A Typed Volume Derived from a 2D Shape

A room is author-defined as:

* A **2D shape** on a specific deck (X/Z plane)
* Extruded to deck height automatically
* Tagged with a **type** for meaning

### MVP Shape Types

* Rectangle only (`rect`)

Reserved:

* Polygon
* Circle/ellipse
* Rounded-rect

### Why rectangles first

Rectangles are:

* Easy UX (drag to size)
* Easy overlap checks (AABB + SAT later)
* Easy “repeat” tooling
* Good enough for most ship plans

---

## 6.3 Room Data Model (Canonical)

From earlier spec, refined:

```yaml
rooms:
  - id: "bridge"
    name: "Main Bridge"
    type: "command"
    deck: 8
    shape:
      type: "rect"
      size: [20.0, 15.0]   # width_x, length_z
    transform:
      position: { x: 0.0, z: 90.0 }
      rotation_deg: 0
    tags: ["front"]
```

### MVP canonical rules

* `id` unique within rooms list
* `deck` must refer to a valid deck index (even if deck is “unusable,” it’s a warning, not an error)
* `size` strictly positive

---

## 6.4 Room Types (Semantic System)

Room type determines:

* minimum size constraints
* window eligibility
* future gameplay hooks (crew capacity, cargo volume)

### MVP room types and default constraints

| Type          | Purpose         | Default min size (x,z) | Windows allowed           |
| ------------- | --------------- | ---------------------: | ------------------------- |
| `command`     | bridge, control |                4m × 4m | yes                       |
| `corridor`    | access ways     |                1m × 3m | no                        |
| `crew`        | quarters, mess  |                2m × 2m | yes                       |
| `cargo`       | storage         |                3m × 3m | usually no (configurable) |
| `engineering` | systems         |                3m × 3m | rarely                    |

These are not “physics truths,” they’re style rules.

### Extension hook (later)

Allow custom room types defined by a faction/style pack:

```yaml
room_types:
  - id: "medbay"
    min_size: [4, 6]
    windows_allowed: true
```

MVP: hardcoded enum in UI with a schema table.

---

## 6.5 Geometric Validity Rules (MVP)

### Rule R1 — Must lie inside footprint polygon

The rectangle (possibly rotated) must be fully inside the deck footprint.

Approaches:

* Conservative: sample corners + edge midpoints and require point-in-polygon
* Better later: polygon-rectangle intersection tests

MVP recommended:

* corners + a few edge samples (fast + stable)

### Rule R2 — No overlap with other rooms on same deck

MVP overlap detection options:

1. **AABB overlap** (fast but wrong with rotation)
2. **OBB overlap / Separating Axis Theorem** (correct for rotated rects)

Recommendation:

* MVP can start with **no rotation** (rotation locked to multiples of 90°)
* Then AABB overlap is accurate enough
* Add arbitrary rotation later with SAT

### Rule R3 — Minimum size by type

Enforced as:

* hard clamp in UI during resize
* or soft warning if smaller

Recommendation:

* hard clamp for corridors
* warning for other types (to keep it flexible)

### Rule R4 — Room count / performance

Safety: cap max rooms per deck (configurable).
If a user wants 1,000 cabins, they should use repetition tools or a generator.

---

## 6.6 Room Placement UX (Deck Editor)

Deck editor is a 2D view (X/Z plane), clipped to footprint.

### Interaction model

**Modes**

* Select (default)
* Add room (type chosen from palette)
* Repeat tool (optional MVP+)
* Delete

**Add room**

1. pick type from palette
2. click-drag to create rectangle
3. snap to grid
4. if invalid, show red outline + reasons

**Edit room**

* drag to move
* drag handles to resize
* rotate via:

  * buttons (0/90/180/270)
  * or Q/E keys

**Quality-of-life**

* Duplicate room (Ctrl+D)
* Align to centerline
* Mirror across X for symmetric layouts

### Grid & snapping

* Grid size default: 0.5m or 1.0m
* Snapping improves repeatability
* “Hold Alt” to temporarily disable snapping

---

## 6.7 Derived Room Volume (for downstream systems)

Rooms remain semantic, but we need derived geometric forms:

```typescript
interface RoomInfo {
  id: string;
  type: string;
  deckIndex: number;

  rect2D?: { x: number; y: number; width: number; height: number };
  polygon2D?: Vector2[];  // reserved, if rotated/polygon shapes later

  floorY: number;
  ceilY: number;
  volumeAABB: AABB;       // for fast checks
}
```

### Why keep both canonical + derived

* Canonical is simple for saving/editing
* Derived is fast for:

  * overlap checks
  * window placement
  * later adjacency graphs

---

## 6.8 Validation Feedback & Error Reporting

A room can have multiple issues.
We should standardize validation results:

```typescript
interface RoomValidationResult {
  severity: 'info' | 'warn' | 'error';
  code: string;      // "OVERLAP", "OUTSIDE_FOOTPRINT", "MIN_SIZE"
  message: string;
  relatedRoomIds: string[];
}
```

UI shows:

* Red outline = ERROR
* Yellow outline = WARN
* Tooltip / sidebar message list

This becomes extremely valuable when you add procedural generation later.

---

## 6.9 Repetition Tools (MVP-Friendly)

Because you asked for “repeatable configurable rooms,” here’s an MVP-safe subset that isn’t a full CAD array modifier.

### Tool: Duplicate + Nudge

* duplicate selected room
* nudge by grid step

### Tool: Linear Repeat (very MVP+ but doable)

Input:

* count N
* direction (X or Z)
* spacing (auto = room size + gap)

Output:

* N copies created as separate rooms
* Validation applied; invalid copies are skipped or flagged

This alone enables:

* cabin rows
* cargo pallet bays
* office strips

Keep it simple: “stamp rooms.”

---

## 6.10 Future Hooks (Reserved, not implemented)

We want the schema + architecture to make these easy later:

1. **Adjacency graph**

   * rooms connected by doors/corridors
   * pathing constraints

2. **Corridor auto-routing**

   * generate corridors connecting key rooms

3. **Multi-deck rooms**

   * hangars, engine rooms, atriums
   * requires vertical span in canonical spec:

     ```yaml
     span_decks: 3
     ```

4. **Room templates**

   * “standard cabin”
   * “cargo bay 10×20”
   * reuse across ships

5. **Functional properties**

   * crew capacity
   * power draw
   * mass
   * gameplay stats

---

## 6.11 Diagram: Room Authoring on Deck Footprint

```
 Deck footprint polygon (valid region)
 ┌───────────────────────────────────────┐
 │     ┌───────────────┐               │
 │     │   CREW CABIN   │               │
 │     └───────────────┘               │
 │   ┌──────────────────────┐          │
 │   │        CARGO          │          │
 │   └──────────────────────┘          │
 │         ┌──────┐                    │
 │         │BRIDGE│                    │
 │         └──────┘                    │
 └───────────────────────────────────────┘
  (rectangles must fit & not overlap)
```

---

# 7. Window System (MVP) — Expanded

## 7.1 Responsibilities of the Window System

The window system must:

1. Generate windows **procedurally from ship intent**

   * driven by room types and/or per-deck rules
2. Place windows on the **hull surface** in visually coherent bands
3. Provide consistent density and style controls:

   * spacing
   * size
   * which rooms/decks qualify
4. Be performant and deterministic
5. Output window placements in a form usable by:

   * mesh baking (cutouts or inset geometry later)
   * materials/decals (MVP-friendly)
   * future: lighting/visibility logic

**Non-goals in MVP**

* Per-window manual editing
* Angled windows following local normals
* Structural avoidance (frames/bulkheads)
* “Real” interior alignment (exact cabin-to-window mapping)
* Airlocks, hatches, greebles

We’ll reserve hooks for all of these.

---

## 7.2 Canonical Data Model (MVP)

```yaml
windows:
  enabled: true
  mode: "from_rooms"         # from_rooms | from_decks (reserved)
  style: "round"             # round only in MVP
  radius: 0.25               # meters
  spacing: 2.5               # meters (along hull surface band approximation)
  include_room_types: ["crew", "command"]
  per_deck_limit: 200
  global_limit: 5000
  inset_depth: 0.0           # MVP: 0 (decal) ; later: geometry inset
```

### Why include both per-deck and global limits

Big ships can have 40 decks; at 200/deck you’re at 8,000 windows. You want a hard cap to keep preview sane.

---

## 7.3 Two MVP Approaches: Cutouts vs Decals

### Option A — Decals / Material Instances (Recommended MVP)

Windows are points + orientations. Rendering uses:

* a window material on hull with “window decals” via projected quads, OR
* instanced meshes (small window frames), OR
* a second “window mask” texture baked procedurally

Pros:

* Fast, robust, no mesh boolean nightmares
* Easy to preview and export (as instances or separate mesh)
* Works with any hull meshing approach

Cons:

* Not “real holes”
* Less convincing up close unless you add inset shading tricks

✅ Recommendation: **Decals/instances in MVP**

### Option B — Boolean Cutouts

Actually subtract windows from the hull mesh.

Pros:

* “Real” windows
  Cons:
* Very hard to keep robust
* Explodes topology and baking complexity
* Makes LODs harder

Reserve for later once booleans are already in the hull pipeline.

---

## 7.4 Window Generation Strategy (MVP)

There are two conceptual sources for windows:

### Source 1 (MVP): Rooms → Windows

* Rooms signal where windows “should” exist (crew, command)
* The system creates windows on the hull near those rooms’ exterior-facing boundaries

### Source 2 (Reserved): Deck Bands → Windows

* Windows exist as continuous strips by deck, regardless of room layout
* Useful for aesthetic-driven hulls or when interior is sparse

MVP implements **rooms → windows** only, but we keep “mode” in schema for later.

---

## 7.5 How Do We Place Windows on a Curved Hull?

This is the core geometry problem.

### MVP simplification: “Window bands” on each deck

For each deck:

1. Compute deck midplane `mid_y`
2. Get deck footprint polygon in X/Z
3. Identify candidate window edges based on direction:

   * for symmetric ships: typically port/starboard edges (±X extremes)
   * optionally “front” (bridge) edges too

Then for each candidate edge:

* sample points along the edge at the desired spacing (in X/Z distance)
* for each sampled point, “push outward” until you hit the hull surface
* place window there

#### Why this works

It produces believable rows:

* aligned with deck height
* spaced consistently
* roughly on the outer wall

Even if it’s not physically perfect, it reads correctly.

---

## 7.6 Concrete Algorithm (MVP)

### Inputs per deck

* `DeckInfo.mid_y`
* `DeckInfo.footprint` polygon (X/Z)
* eligible rooms on this deck

### Step A — Collect eligible boundary segments

For each eligible room:

* Compute its rectangle boundary segments (4 edges)
* Choose “exterior-facing” edges:

  * easiest MVP: edges closest to hull footprint boundary
  * simplified heuristic:

    * for each room edge midpoint, compute distance to hull boundary
    * pick edges with smallest distance (i.e., near outside)

MVP can simplify further:

* ignore room-specific edges
* place windows along hull boundary in regions near eligible rooms (see Step B)

### Step B — Build a “window-allowed” boundary arc

We want windows only where eligible rooms exist.

Approach:

* Project each eligible room onto hull boundary by finding closest point on footprint boundary to room perimeter (2D)
* Mark boundary parameter ranges as “allowed”
* Then distribute windows along allowed boundary segments at `spacing`

This yields:

* windows appear where rooms exist
* no windows along cargo bay walls

### Step C — Project to hull surface

Given a 2D boundary point `(x, z)` on deck plane at `y = mid_y`, find a point on hull surface.

Since hull is queryable (implicit volume):

* Start at `(x, mid_y, z)`
* Move outward along an approximate normal direction until `distance(p) ≈ 0`

We need a direction. MVP uses:

* radial direction from centerline:

  * `dir = normalize(Vector3(x, 0, 0))` (port/starboard)
  * or from ship center `(x, 0, z)` if you want nose/tail windows too

A robust method:

* do a ray-march / binary search using `distance(p)`
* stop when sign changes or near zero
* compute normal via gradient sampling for orientation

### Step D — Enforce limits & culling

* skip if too close to another window (grid hashing)
* skip if local curvature too high (optional)
* enforce per-deck and global caps

---

## 7.7 Window Output Representation (Derived Data)

Windows are not meshes in the spec; they’re derived placements:

```typescript\ninterface WindowInfo {
  deckIndex: number;
  position: Vector3;
  normal: Vector3;
  radius: number;
  style: string;      // "round"
  sourceRoomId?: string; // optional, for debugging
}
```

This can render as:

* `MultiMeshInstance3D` of a “window frame” mesh aligned to normal
* or as projected decals \(browser-based rendering\)
* or baked into a secondary mesh of quads

---

## 7.8 Preview & Editing UX

### Controls in UI (MVP)

* Enable windows checkbox
* Window size (radius)
* Spacing
* Include types (multi-select)
* Per-deck limit slider
* Preview quality (low/high)

### Visual debugging tools (super helpful)

* Toggle “show window candidates”
* Color windows by deck
* List window counts by deck

### User expectation management

Users will sometimes want:

* “Windows only on the saucer rim”
* “No windows near engines”
  That’s beyond MVP, but you can add:
* simple exclusion zones later

---

## 7.9 Validation & Failure Modes

### Common problems

* Very thin hull slices → projection fails
* Edge samples project to inside faces (if hull has concavities later)
* Too many windows → performance

### MVP strategies

* If projection fails, skip that window
* Warn if <X windows placed when enabled (optional)
* Hard caps to keep preview stable

---

## 7.10 Export Strategy for Windows (MVP)

Provide 3 export options:

1. **As separate “window instances” mesh**

   * Export each window as a tiny quad/mesh
   * Most portable across engines

2. **As “window points” metadata**

   * JSON/YAML sidecar: list of transforms
   * Game engine can render windows procedurally

3. **As baked vertex colors / mask texture** (reserved)

   * Useful for fancy shading
   * Defer until you have stable UV/unwrapping strategy

MVP recommended:

* Export option 1 + 2.

---

## 7.11 Extension Opportunities (Reserved)

1. **Deck-band windows mode**

   * generate continuous bands per deck regardless of rooms

2. **Exclusion zones**

   * avoid engines, weapons, hangars
   * defined by volumes or tags

3. **Window styles**

   * rectangular, slit, panoramic
   * bridge viewport arrays

4. **Inset geometry**

   * actual window recesses
   * emissive interior panes

5. **Manual overrides**

   * add/remove windows locally
   * “window brush”

6. **Lighting integration**

   * window emission tied to room occupancy
   * nighttime city-ship look

---

## 7.12 Diagram: Rooms → Windows → Hull Surface

```
Deck i (2D plan)                     Hull surface (3D)
┌───────────────────────┐            ┌───────────────────────┐
│ [CREW]  [CREW] [CREW] │  project   │   o  o  o  o  o       │
│                       │   ----->   │   o  o  o  o  o       │
│     [CARGO BAY]       │            │                       │
│                       │            │ (no windows here)     │
└───────────────────────┘            └───────────────────────┘
Only eligible rooms produce window segments.
```

---

# 8. Mesh Generation & Export (MVP) — Expanded

## 8.1 Responsibilities of the Mesh Stage

The mesh stage must:

1. Convert derived ship data into **renderable meshes**

   * hull mesh (required)
   * deck floor meshes (optional)
   * window geometry (optional but recommended)
2. Support **two quality levels**

   * fast preview while editing
   * higher quality for export
3. Produce deterministic results given the same ShipSpec + settings
4. Export to portable formats (GLB first)
5. Optionally generate collision meshes

**Non-goals in MVP**

* Auto-UV unwrapping with production quality
* Panel line geometry, bevels
* Boolean cutouts for windows
* Complex materials/texture baking

---

## 8.2 Mesh Outputs (What Exists)

### Output A — Hull Mesh (Required)

A closed surface mesh representing the hull volume boundary.

### Output B — Deck Floors (Optional)

Simple flat or slightly conformed planes per usable deck.

* Useful for interior visualization
* Useful for verifying deck stack

MVP: flat planes clipped to deck footprint polygon.

### Output C — Windows (Optional but recommended)

As one of:

* instanced meshes (preferred for preview)
* baked mesh of window quads (preferred for export)

MVP recommended:

* Preview: MultiMesh instances
* Export: bake to a single mesh (or separate node mesh)

### Output D — Collision Mesh (Optional)

* Simplified hull collision (convex decomposition later; MVP can do simple concave trimesh)
* Separate collision layers per category reserved

---

## 8.3 Mesh Baking Inputs

Mesh baking takes `DerivedShipData` + `BakeSettings`.

### BakeSettings (not persisted in ShipSpec by default)

```yaml
bake_settings:
  preview:
    grid_resolution: 1.5
    simplify_target_tris: 20000
  export:
    grid_resolution: 0.35
    simplify_target_tris: 200000
  generate_collision: true
  include_decks: true
  include_windows: true
```

**Why separate bake settings from ship spec**

* Keeps ship spec portable + deterministic
* Prevents “one ship saved with insane 8M triangles”

You *can* optionally store bake presets as part of tool config.

---

## 8.4 Hull Meshing Approach (MVP)

Because we recommended an implicit hull volume, the simplest extraction is:

### Marching Cubes on an SDF grid

Inputs:

* hull SDF function `distance(p)`
* AABB bounds
* 3D grid resolution (meters per cell)
* iso-level = 0

Outputs:

* triangle mesh approximating surface

#### Determinism note

Determinism requires:

* fixed grid origin alignment
* fixed sampling order
* fixed triangulation table
* fixed float tolerance rules

So define:

* AABB bounds snapping to grid
* Grid index ordering
* Always sample in (x-major, y, z) order

---

## 8.5 Bounds & Grid Alignment (Critical Detail)

If you don’t standardize this, “same ship spec” can produce different meshes.

### MVP policy

* Compute hull AABB from hull parameters (analytic) or conservative estimate
* Expand by padding (e.g., 1 grid cell)
* Snap min corner to grid:

  * `min = floor(min / res) * res`
* Snap max corner:

  * `max = ceil(max / res) * res`

This ensures:

* stable cell boundaries
* stable vertex locations

---

## 8.6 Mesh Post-Processing (MVP)

Marching Cubes output is often:

* high triangle count
* somewhat lumpy

MVP post steps (in this order):

1. **Weld vertices** within epsilon

2. **Recompute normals**

3. Optional: **Simplify**

   * Use a quadric error metric simplifier if available
   * If not, keep triangles and rely on resolution/preview toggles

4. Optional: **Smoothing pass** (very light, preview-only)

   * Avoid destroying shape silhouette

### Practical suggestion

Don’t over-invest in perfect meshing MVP.
The MVP win is *pipeline + ship-aware authoring*, not AAA hull topology.

---

## 8.7 Deck Floor Mesh Generation (Optional MVP)

### Inputs

* For each usable deck:

  * footprint polygon (2D)
  * mid_y

### Output geometry

* Triangulate polygon in 2D (X/Z)
* Emit vertices at `y = floor_y` or `mid_y`
* Optionally extrude slightly for thickness

### Rendering structure

* Either:

  * one mesh per deck (easy toggles)
  * one combined mesh with per-deck groups (faster)

MVP: one mesh per deck is easiest for UI (“show deck 7 only”).

---

## 8.8 Window Mesh Generation (MVP)

Recommended:

* Preview uses a `MultiMeshInstance3D` (fast)
* Export bakes them into a mesh

### Option 1 — Window Quads

Each window becomes:

* a small quad oriented by window normal
* optionally slightly offset outward from hull to prevent z-fighting

Pros:

* simple
* portable
  Cons:
* looks like stickers unless shader does magic

### Option 2 — Window Frames (tiny low-poly ring)

Still exportable, more depth.

MVP suggestion:

* Use a simple low-poly frame mesh with emissive interior plane

---

## 8.9 Material & UV Strategy (MVP)

MVP doesn’t need full UVs, but you should plan for them.

### MVP minimum

* Hull mesh can ship with:

  * vertex normals
  * optional vertex colors (reserved: window masks, panel masks)
  * no UVs required

For export to other tools, UVs are useful. But automatic UV unwrapping is a rabbit hole.

**Recommendation**

* For MVP export, allow “no UV” or trivial planar UVs.
* Later: add UV generation strategies.

---

## 8.10 Export Formats & Conventions (MVP)

### Supported exports

* `.glb` (glTF binary): primary
* `.obj`: optional
* YAML spec sidecar: optional (for metadata)

### Export coordinate convention

glTF expects Y-up, which is standard for 3D web applications.
So your ship coordinates map cleanly:

* +Y up
* +Z forward

Make sure your “forward” convention matches your game.
If your game uses -Z forward (common in some engines), provide an export option.

### Export packaging

Export as a scene-like bundle:

* root node: ShipName
* children:

  * HullMesh
  * DeckMeshes (optional)
  * WindowsMesh (optional)

This makes importing into other engines easier.

---

## 8.11 Caching, Rebuilds, and Live Preview

### Caching policy

Cache derived meshes keyed by:

* ship spec hash
* bake settings (preview/export)
* hull sampling resolution
* toggles (include decks/windows)

### Live preview plan

While editing:

* use coarse resolution + no simplification
* update on debounce (e.g., 100–300ms after last change)
* allow manual “Rebuild High Quality” button

Capital ships otherwise will hitch.

---

## 8.12 Validation & Safety Limits

### Mesh stage hard errors

* hull meshing returns non-manifold or open mesh (can still export, but warn)
* triangle count exceeds hard cap (abort export)
* memory blow-up risk at too fine grid resolution

### Safety caps

* maximum grid cells per axis (e.g., 256 or 384)
* maximum triangle count per export preset
* maximum window instances

UI should show estimated triangle count:

* based on grid resolution and bounds volume

---

## 8.13 Extension Opportunities (Reserved)

1. **Dual Contouring**

   * improved sharp features once you add booleans/panels

2. **LOD generation**

   * bake multiple resolutions automatically

3. **Collision generation upgrades**

   * convex decomposition
   * separate interior collision

4. **UV unwrapping / texture baking**

   * panel line masks
   * window emissive masks

5. **Boolean cutouts**

   * windows as actual holes
   * hangar bays cut from hull

6. **Interior wall geometry**

   * rooms as actual meshes with doors

---

## 8.14 Diagram: Bake Outputs

```
DerivedShipData
  ├── HullVolume (SDF)
  ├── DeckInfo[] (footprints)
  ├── RoomInfo[]
  └── WindowInfo[]
        │
        ▼
MeshBaker
  ├── HullMesh (required)
  ├── DeckMeshes (optional)
  └── WindowsMesh (optional)
        │
        ▼
Exporter
  └── GLB / OBJ (+ optional spec sidecar)
```

---

# 9. User Interface (MVP) — Expanded

## 9.1 UI Goals

The UI must:

1. Guide users through a **ship-building workflow**
2. Provide **fast iteration** with immediate visual feedback
3. Keep editing **2D where possible** (simpler + more precise)
4. Provide **clear validation** and avoid “silent failures”
5. Support both:

   * novice “click-through” usage
   * advanced YAML editing (optional) without forking the data model

**Non-goals in MVP**

* Full node graph authoring
* Freeform 3D modeling in viewport
* Complex asset/material authoring

---

## 9.2 Navigation Model: Step-Based with Free Jumping

MVP should feel like:

* a “wizard” that you can jump around in
* not a rigid linear wizard

### Primary navigation: Left sidebar steps

1. Overview
2. Hull
3. Decks
4. Rooms
5. Windows
6. Bake & Export

You can click any step at any time, but each step shows warnings if earlier prerequisites are invalid.

---

## 9.3 Global Layout

A solid default layout for desktop:

```
┌───────────────────────────────────────────────────────────────┐
│ Top Bar: Ship Name | Undo | Redo | Save | Export | Preview Q  │
├───────────────┬───────────────────────────────┬───────────────┤
│ Left Sidebar  │ Main Editor Panel             │ Right Inspector│
│ (steps)       │ (context-specific UI)         │ (selected item)│
│               │                               │                │
├───────────────┴───────────────────────────────┴───────────────┤
│ Bottom Status Bar: warnings/errors summary + progress + stats  │
└───────────────────────────────────────────────────────────────┘
```

### Where the 3D preview lives

Two viable MVP options:

**Option A (recommended): Docked 3D preview panel**

* The main editor panel can swap between 2D/3D depending on step
* Or split: left = 2D editor, right = 3D preview

**Option B: Separate “Preview” tab**

* simpler UI
* slightly worse iteration speed

Given you want a designer tool, Option A is better.

---

## 9.4 View 1 — Overview

Purpose:

* Establish ship identity and high-level stats
* Provide a “health” summary of the spec

### Controls

* Ship name
* Ship scale preset (fighter/small/medium/capital)
* Optional description
* Global settings (units fixed to meters in MVP)

### Displays

* Length, beam, height (derived from hull params)
* Deck count (derived)
* Usable decks count
* Room count
* Window count (preview estimate)
* Triangle count estimate (preview / export settings)

### Actions

* “New from template”

  * Fighter
  * Freighter
  * Wedge (Star Destroyer-ish)
  * Saucer + hull (Galaxy-ish) — can be faked with spine hull MVP but later becomes multi-hull

---

## 9.5 View 2 — Hull Editor

Purpose:

* Edit the hull silhouette in a ship-friendly way

### Main panel contents

* 2D graph editor:

  * X axis = position along length (Z normalized 0..1)
  * Y axis = radius (0..1)
  * Drag points, add/remove points
* Sliders / numeric fields:

  * length
  * max_beam
  * max_height
* Preset buttons:

  * “sleek”
  * “bulky”
  * “needle”
  * “stubby”
* Symmetry toggle (locked to X in MVP, but UI shows it for future)

### 3D preview overlay

* Show hull mesh live
* Show bounding box
* Optional: show deck slice lines (thin bands)

### UX constraints

* Control points auto-sort by Z
* Clamp radius [0..1]
* Prevent fewer than 3 points
* Snap-to grid for Z positions optional

---

## 9.6 View 3 — Deck System Editor

Purpose:

* Define deck height and vertical range
* Inspect deck footprints quickly

### Main panel contents

* Numeric controls:

  * deck_height
  * start_y, end_y
* “Auto-fit to hull” button:

  * sets start/end based on hull bounds with margin
* Deck list (“stack view”):

  * deck index
  * small footprint thumbnail (mini-map)
  * usable badge
  * room count badge
  * click to open deck

### 3D preview integration

* Highlight selected deck slice plane
* Option to show all deck planes faintly

---

## 9.7 View 4 — Rooms Editor (Deck-by-Deck)

Purpose:

* Place rooms in 2D (fast, precise)
* Keep room semantics (types) front-and-center

### Main panel contents

* Deck selector:

  * dropdown or stack list
  * next/prev deck hotkeys
* 2D deck canvas:

  * shows deck footprint polygon
  * shows grid + snapping
  * shows rectangles for rooms
* Tool palette:

  * Select
  * Add room (type picker)
  * Duplicate
  * Delete
  * Repeat (optional MVP+)

### Interaction model

* Click-drag to create rectangle
* Drag to move
* Handles to resize
* Rotation buttons (0/90/180/270)
* Live validity coloring:

  * red = invalid (outside footprint, overlap)
  * yellow = warning (too small, on unusable deck)
  * normal = valid

### Right inspector (for selected room)

* ID + name
* type dropdown
* deck index (read-only in MVP; change deck via “Move to deck…” button)
* size + position numeric edits
* tags list
* “Duplicate” / “Delete”

---

## 9.8 View 5 — Windows Editor

Purpose:

* Rule-driven window generation controls
* Visualize where windows land

### Controls

* Enabled toggle
* Style (round only MVP)
* Radius
* Spacing
* Eligible room types multi-select
* Caps (per-deck, global)
* Preview quality (low/high)

### Displays

* Count by deck (small table)
* Warnings (skipped projections, caps hit)

### 3D preview integration

* Toggle windows overlay
* Color by deck option
* Option: “show candidate boundary segments” (debug)

---

## 9.9 View 6 — Bake & Export

Purpose:

* Provide deterministic final outputs

### Bake controls

* Preview quality preset:

  * fast / medium / high
* Export quality preset:

  * game-ready / high-res

### Export controls

* Format: GLB (default), OBJ optional
* Include:

  * hull
  * decks
  * windows (as mesh or instances)
  * collision mesh

### Displays

* Estimated triangle count
* Estimated bake time risk indicator (no time estimates shown as a promise; just a complexity indicator)
* Last bake status/errors

### Actions

* “Bake preview”
* “Bake export”
* “Export…”

---

## 9.10 YAML Editor (Optional, but supported)

This should be a secondary view, not the primary workflow.

### Features

* Read-only by default with “Enable editing” toggle
* Validate on save
* Show schema tooltips / autocompletion if you feel like it

### Critical rule

Manual YAML edits must go through the same validation + recompilation pipeline.

---

## 9.11 Validation UX: Error Panel + Inline Highlights

You’ll want a unified validation system surfaced consistently:

### Bottom status bar

* “0 errors, 3 warnings”
* click opens validation panel

### Validation panel

Each issue shows:

* severity
* message
* “jump to location” action:

  * opens deck + selects room
  * or opens hull editor
  * or opens windows editor

### Inline highlights

* rooms outline colors
* deck list badges
* step sidebar badges

This makes the tool feel professional.

---

## 9.12 Undo/Redo Expectations (MVP)

Undo/redo should be **semantic**:

* moving a room is one action
* resizing is one action
* adding a room is one action
* adjusting hull point is one action

Implementation approach in Vue.js + TypeScript:

* Command pattern over Pinia store mutations
* Or snapshot diffs stored in Pinia store history
* Libraries like `vundo` can simplify this

MVP-friendly approach:

* record actions as commands that mutate Pinia store state and maintain a history stack

---

## 9.13 Keyboard Shortcuts (Small but huge value)

Minimum set:

* Ctrl+Z / Ctrl+Y
* Delete (remove room)
* Ctrl+D (duplicate room)
* Arrow keys (nudge)
* PageUp/PageDown (deck navigation)
* 1/2/3 (tool modes in room editor)

---

## 9.14 Extension Opportunities (Reserved)

1. **Blueprint views**

   * orthographic front/side/top
   * printable schematics

2. **Module attach UI**

   * engines/weapons on anchors

3. **Style packs**

   * faction templates that constrain available shapes/types

4. **Multi-user**

   * diff/merge of YAML for collaboration

5. **Procedural generation integration**

   * “Generate variant” button that creates ShipSpec variants from the current one

---

## 9.15 Diagram: UI Flow

```
Overview
  └─> Hull Editor
        └─> Deck Editor
              └─> Rooms Editor
                    └─> Windows Editor
                          └─> Bake & Export
(You can jump back to any step; validation guides you forward.)
```

---

# 10. Validation & Feedback (MVP) — Expanded

## 10.1 Purpose of Validation in This System

Validation is **not** just about preventing crashes or bad exports.

In this toolkit, validation must:

1. **Guide users toward valid ship designs**
2. Surface problems **early and locally**
3. Support **procedural generation** (machine-readable errors)
4. Be **deterministic and reproducible**
5. Avoid “mystery failures” (every issue must be explainable)

Key philosophy:

> Validation is a *first-class system*, not a side effect.

---

## 10.2 Validation Categories

Validation issues are grouped by **system layer**, matching your pipeline.

### V1 — Spec-Level Validation

Checks that the ShipSpec is structurally valid.

Examples:

* Missing required fields
* Invalid enum values
* Duplicate IDs
* Invalid references (room refers to nonexistent deck)

These errors:

* Are detected immediately on load/edit
* Block compilation if severe

---

### V2 — Hull Validation

Checks hull parameters before any slicing.

Examples:

* Less than 3 spine points
* Unsorted or duplicate `z` values
* Zero or negative length/beam/height
* Radius values outside `[0, 1]`

Severity:

* Mostly **ERROR**
* Hull errors block all downstream stages

---

### V3 — Deck Validation

Checks that deck parameters produce meaningful decks.

Examples:

* `deck_height <= 0`
* `end_y <= start_y`
* All decks have unusably small footprints
* Many decks are unusable (soft warning)

Severity:

* Structural problems → **ERROR**
* Design-quality issues → **WARN**

---

### V4 — Room Validation

Checks per-room geometry and semantics.

Examples:

* Room outside deck footprint
* Room overlaps another room
* Room smaller than type minimum
* Room placed on unusable deck
* Too many rooms on one deck (cap exceeded)

Severity:

* Outside footprint / overlap → **ERROR**
* Too small / unusual placement → **WARN**

---

### V5 — Window Validation

Checks window generation logic.

Examples:

* Windows enabled but zero placed
* Projection failures
* Per-deck or global caps exceeded
* Windows on disallowed room types

Severity:

* Mostly **WARN**
* Rarely **ERROR** (e.g., infinite loop or NaN)

---

### V6 — Mesh/Bake Validation

Checks that outputs are safe to generate/export.

Examples:

* Grid resolution too fine (memory risk)
* Triangle count exceeds hard cap
* Non-manifold hull mesh detected
* Export format unavailable

Severity:

* Export-blocking issues → **ERROR**
* Performance risks → **WARN**

---

## 10.3 Validation Severity Levels

Use a **small, consistent set**:

```typescript
type ValidationSeverity = 'info' | 'warn' | 'error';
```

### Semantics

* **INFO**

  * Design hints
  * Suggestions
  * Never blocks anything

* **WARN**

  * Design may be unintended
  * Export allowed
  * User should be informed

* **ERROR**

  * Invalid or unsafe state
  * Export blocked
  * Downstream compilation may stop

---

## 10.4 Validation Result Object (Canonical)

All validators emit a shared structure:

```typescript
interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;                  // e.g. "ROOM_OVERLAP"
  message: string;               // human-readable
  context: Record<string, any>;  // machine-readable details
  location: Record<string, any>; // where to jump in UI
}
```

### Example

```typescript
const issue: ValidationIssue = {
  severity: 'error',
  code: "ROOM_OUTSIDE_FOOTPRINT",
  message: "Room 'crew_12' extends outside deck footprint.",
  context: { room_id: "crew_12", deck: 4 },
  location: { view: "rooms", deck: 4, room_id: "crew_12" }
}
```

This structure supports:

* UI navigation
* Logging
* Procedural generation feedback
* Unit testing

---

## 10.5 Validation Pipeline & Ordering

Validation is **incremental and layered**, just like compilation.

### Order of execution

1. Spec validation
2. Hull validation
3. Deck validation
4. Room validation
5. Window validation
6. Mesh/bake validation

Rules:

* Later validators can assume earlier layers are valid
* If hull validation fails, skip deck/room/window checks
* Always return *all* issues found at that stage (don’t fail-fast unless unsafe)

---

## 10.6 Live Validation vs Export Validation

### Live (Editor-Time) Validation

* Runs incrementally
* Debounced (e.g., 100–300 ms)
* Provides immediate visual feedback
* Never blocks editing

### Export-Time Validation

* Runs full pipeline
* Uses stricter rules
* Must pass with **zero ERRORs**

This distinction avoids frustrating the user while still guaranteeing valid exports.

---

## 10.7 Validation Caching Strategy

Validation can be expensive on large ships.

### MVP caching rules

* Cache validation results per stage
* Invalidate only when relevant data changes:

  * room validation invalidated only if rooms or decks change
  * window validation invalidated only if rooms/windows/hull change
* Store hash of relevant inputs per stage

This keeps the editor responsive on capital ships.

---

## 10.8 UI Presentation of Validation

### Global Summary

Bottom status bar:

* `✔ 0 errors, ⚠ 3 warnings`
* Click opens Validation Panel

### Validation Panel

* Grouped by category (Hull, Decks, Rooms, Windows, Bake)
* Sorted by severity
* Each entry has:

  * icon
  * message
  * “Go to issue” button

### Inline Feedback

* Rooms outlined:

  * red = ERROR
  * yellow = WARN
* Deck list badges
* Sidebar step icons highlighted if that step contains errors

### UX Rule

**No validation issue should require guesswork to fix.**
Every issue must either:

* highlight itself visually, or
* provide a navigation jump.

---

## 10.9 Validation for Procedural Generation

Because this tool may be used headless:

### Machine-readable guarantees

* `code` field is stable
* `context` contains enough data to react programmatically
* Validation can be run without UI

### Example use

A generator can:

* attempt layout
* run validation
* if `ROOM_OVERLAP`, retry placement
* if `DECK_UNUSABLE`, adjust deck range

This turns validation into a **constraint solver feedback loop** later.

---

## 10.10 Hard Limits & Safety Guards (MVP)

These are *non-negotiable* safeguards.

### Examples

* Max decks: configurable (e.g., 200)
* Max rooms per deck: configurable (e.g., 500)
* Max window instances: hard cap (e.g., 10,000)
* Max marching-cubes grid cells per axis
* Max triangle count for export

Violations produce:

* WARN during editing
* ERROR during export

---

## 10.11 Logging & Debugging Support

Every validation pass should optionally emit:

* structured logs (JSON)
* timing info per stage
* counts per category

This helps:

* optimize performance
* debug procedural generation
* support modders later

---

## 10.12 Extension Opportunities (Reserved)

Validation becomes more powerful as systems grow:

1. **Adjacency validation**

   * rooms must be reachable
   * bridge must connect to corridors

2. **Gameplay validation**

   * ship must have command room
   * crew capacity ≥ minimum

3. **Structural validation**

   * engines require reinforcement
   * large hangars require clearance

4. **Style validation**

   * faction rules (e.g., no windows on military hulls)

Because validation is centralized, these can be added cleanly.

---

## 10.13 Diagram: Validation in the Pipeline

```
ShipSpec
   │
   ├─ SpecValidator
   │
   ├─ HullValidator
   │
   ├─ DeckValidator
   │
   ├─ RoomValidator
   │
   ├─ WindowValidator
   │
   └─ BakeValidator
        │
        ▼
 ValidationReport
   ├─ errors[]
   ├─ warnings[]
   └─ infos[]
```

---

## 10.14 MVP Completion Criteria (Revisited)

At this point, your MVP is *done* if:

* A user can design a ship end-to-end
* Validation catches all common mistakes
* Errors are explainable and navigable
* Export produces deterministic geometry
* Procedural systems can consume the same pipeline

You now have:

* A ship-aware modeling system
* A compiler-style pipeline
* A UX that scales from players to generators

---


















