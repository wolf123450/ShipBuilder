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
- **Multiple export formats** — Export to GLB/GLTF for use in game engines
- **Structured data** — All ship designs are YAML/JSON-serializable for version control and procedural generation

## Project Structure

```
ShipBuilder/
├── src/
│   ├── components/          # Vue components
│   │   ├── ShipDesignerApp.vue    # Main app container
│   │   ├── ShipEditor.vue          # Sidebar editor
│   │   └── Preview3D.vue           # Three.js 3D viewport
│   ├── compiler/            # Core compilation modules
│   │   ├── hull.ts          # Hull volume representation
│   │   ├── decks.ts         # Deck footprint generation
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

- **HullVolume** — Implicit SDF-based representation with queries
- **DeckFootprints** — 2D polygons per deck for room placement
- **RoomValidation** — Overlap detection and boundary checks
- **MeshBaking** (future) — Triangle mesh generation

#### `ShipStore` (Pinia)

Reactive state management:

- Holds current ShipSpec
- Triggers recompilation on edits
- Exposes derived data to UI
- Integrates with localStorage

#### `Preview3D` (Three.js)

Interactive 3D viewport:

- Renders hull, decks, rooms
- Real-time updates as you edit
- Camera controls and visualization modes

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

This initial release focuses on:

- ✅ Basic hull design (lofted spine)
- ✅ Deck layout
- ✅ Room placement
- ✅ Window rule generation
- ✅ Export to JSON/YAML
- 🚧 3D preview (basic visualization)
- ⏳ GLB/GLTF mesh export
- ⏳ Undo/redo system
- ⏳ Procedural generation API

## Future Extensions

Reserved for future versions:

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
