# Ship Design Toolkit

A structured spaceship design toolkit for creating exportable, engine-agnostic geometry.

## Overview

The Ship Design Toolkit is a **local standalone web application** built with Vue.js that enables players and content creators to design spaceships through a constrained, domain-aware interface. Rather than exposing raw geometry editing, the toolkit guides users through a structured workflow:

```
Hull → Decks → Rooms → Export
```

## Key Features

- **Ship-aware abstractions** — Think in terms of hulls, decks, rooms, and windows, not vertices
- **Progressive constraints** — Each design step reduces degrees of freedom, preventing invalid states
- **Deterministic compilation** — Same input always produces identical geometry
- **Interactive 3D preview** — Real-time visualization with camera controls and multiple preset views
- **2D room placement editor** — Visual deck layout with drag-and-drop, collision detection, and room management
- **Multiple export formats** — Export to JSON, YAML, or GLB/GLTF for use in game engines
- **Local project library** — Save, load, and manage ship designs in your browser
- **Structured data** — All ship designs are YAML/JSON-serializable for version control and procedural generation

## Project Structure

```
ShipBuilder/
├── src/
│   ├── components/          # Vue components
│   │   ├── ShipDesignerApp.vue    # Main app container
│   │   ├── StepEditor.vue         # Tab-based editor (4 steps)
│   │   ├── Preview3D.vue          # Three.js 3D viewport with camera controls
│   │   ├── editors/               # Individual step editors
│   │   │   ├── HullEditor.vue
│   │   │   ├── DeckEditor.vue
│   │   │   ├── DeckPlacementEditor.vue
│   │   │   └── ExportEditor.vue
│   │   └── composables/           # Reusable Vue composables
│   ├── compiler/            # Core compilation modules
│   │   ├── hull.ts          # Hull volume representation
│   │   ├── decks.ts         # Deck footprint generation
│   │   ├── mesh.ts          # Mesh baking and generation
│   │   └── index.ts         # Main compilation pipeline
│   ├── stores/              # Pinia state management
│   │   └── shipStore.ts     # Ship spec and derived state
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts         # Core types and interfaces
│   │   └── schema.ts        # Zod validation schemas
│   ├── utils/               # Utility modules
│   │   ├── storage.ts       # localStorage persistence
│   │   └── export.ts        # File export/import
│   ├── App.vue              # Root component
│   ├── main.ts              # Application entry point
│   └── style.css            # Global styles (Tailwind)
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Test configuration
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will open in your browser at `http://localhost:5173`.

### Building

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Architecture

### Data Flow

The system enforces a strict **one-way data flow**:

```
ShipSpec (YAML/JSON)
    ↓
Compiler Pipeline (TypeScript)
    ├─ Hull Resolution
    ├─ Deck Resolution
    ├─ Room Resolution
    └─ Validation
    ↓
DerivedShipData (In-Memory)
    ├─ Hull queries
    ├─ Deck footprints
    ├─ Room volumes
    └─ Surface features
    ↓
3D Rendering (Three.js)
    └─ Mesh export (GLB/GLTF)
```

### Core Modules

#### `ShipSpec` (Data Model)

The canonical data representation, serializable to JSON/YAML:

- **Meta** — Ship name, role, scale
- **Hull** — Lofted spine profile with control points
- **Decks** — Stack height and vertical range
- **Rooms** — Per-deck 2D shapes and placements
- **Windows** — Rule-based window placement

#### `Compiler` (Pipeline)

Stateless modules that transform ShipSpec into queryable geometry:

- **HullVolume** — Implicit SDF-based representation with spatial queries
- **DeckFootprints** — 2D polygons per deck for room placement
- **RoomValidation** — Overlap detection (SAT algorithm) and boundary checks
- **MeshBaking** — Voxel-based hull mesh generation with configurable resolution

#### `ShipStore` (Pinia)

Reactive state management:

- Holds current ShipSpec
- Triggers recompilation on edits
- Exposes derived data to UI
- Integrates with localStorage

#### `Preview3D` (Three.js)

Advanced interactive 3D viewport:

- Renders hull meshes, deck footprints, and rooms with type-based colors
- Real-time updates as you edit
- Orbit camera with preset views (top, bottom, front, back, left, right)
- Object selection and focus controls
- Configurable mesh resolution slider
- Visibility toggles for hull, decks, and rooms
- Stats overlay (vertex/face/room counts)

## Development Workflow

### Type Safety

This project is **strict TypeScript**. Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Code Quality

- **Linting** — ESLint with Vue plugin
- **Formatting** — Prettier
- **Testing** — Vitest with unit and integration tests

Run linting:

```bash
npm run lint
```

Type-check:

```bash
npm run type-check
```

### Testing

Run all tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test
```

UI test runner:

```bash
npm run test:ui
```

Coverage report:

```bash
npm run test:coverage
```

## MVP Scope

This initial release includes:

### ✅ Core Features (Complete)

- ✅ Hull design with lofted spine profiles
- ✅ Multi-deck layout with automatic footprint generation
- ✅ Interactive 2D room placement with drag-and-drop
- ✅ Collision detection (SAT algorithm) and validation
- ✅ Real-time 3D preview with advanced camera controls
- ✅ Export to JSON, YAML, and GLB/GLTF formats
- ✅ Browser-based project library with save/load/delete
- ✅ File import with validation and error handling

### ⏳ Deferred to Phase 4 (Polish)

- ⏳ Window rule generation and placement
- ⏳ Undo/redo system
- ⏳ Keyboard shortcuts (Ctrl+S, Delete, etc.)
- ⏳ Tooltips and enhanced UX
- ⏳ Component integration tests

## Future Extensions

Reserved for Phase 4+ and beyond:

- **Window System** — Rule-based window placement and cutouts
- **Advanced Hulls** — Saucers, nacelles, CSG booleans
- **Modular Design** — Engines, weapons, attachments
- **Procedural Generation** — Batch ship creation via Node.js CLI
- **Ship Library** — Browse, save, and manage designs
- **Collaborative Editing** — Real-time multiplayer (CRDTs)
- **Faction Styles** — Pre-built design templates
- **Detailed Interiors** — Furniture, doors, wiring
- **Physics Simulation** — Basic structural validation

## Configuration Files

### `vite.config.ts`

Build tool configuration. Notable settings:

- Dev server runs on `localhost:5173`
- Sourcemaps enabled for debugging
- Chunk splitting for Three.js and vendor libraries

### `vitest.config.ts`

Test runner configuration using jsdom environment.

### `tailwind.config.cjs`

Utility-first CSS with dark theme colors:

- `ship-dark` — Main background (#0f172a)
- `ship-navy` — Card background (#1e293b)
- `ship-slate` — Border color (#334155)
- `ship-accent` — Action color (blue #3b82f6)

## Conventions

### File Naming

- Vue components: `PascalCase.vue`
- Modules: `camelCase.ts`
- Tests: `name.test.ts`
- Types: `camelCase.ts` in `types/`

### Component Structure

```vue
<template>
  <!-- Template -->
</template>

<script setup lang="ts">
// Script
</script>

<style scoped>
/* Scoped styles */
</style>
```

### TypeScript

- Prefer interfaces over types
- Use strict mode exclusively
- Avoid `any`; use `unknown` with type guards
- Export types alongside implementations

## Contributing

When adding features:

1. Keep the domain model pure (no side effects in compiler)
2. Write tests before implementation
3. Update this README if you change architecture
4. Follow existing code style (ESLint will help)
5. Commit frequently with clear messages

## License

(Add your license here)

## Resources

- [Design Document](./Ship_Design_Toolkit_MVP_FULL.md) — Full specification
- [Vue.js Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Zod Documentation](https://zod.dev/)
