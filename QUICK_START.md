# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Your browser will open at `http://localhost:5173`.

### 3. Design Your First Ship

The application opens with a default medium-sized explorer ship. Try:

- **Change the name** in the "Ship Info" section
- **Adjust the hull** — modify length, beam (width), and height
- **Adjust deck height** — more decks with smaller heights
- **Add rooms** — (UI controls coming soon)
- **See changes in real-time** — the 3D view updates automatically

### 4. Export Your Design

Click the **Export** button to save your ship as:

- JSON format (easy to edit programmatically)
- YAML format (human-friendly, diffable)

### 5. Load a Previous Design

Use the browser's localStorage or import a saved JSON/YAML file.

---

## Development

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test -- --run` | Run tests once and exit |
| `npm run lint` | Lint and fix code style |

### Project Structure Quick Ref

```
src/
├── components/       Vue UI components
├── compiler/        Ship compilation pipeline
├── stores/          Pinia state management
├── types/           TypeScript type definitions
├── utils/           Utility functions
└── main.ts          Application entry point
```

---

## Architecture Overview

The system works in **stages**:

```
1. ShipSpec (YAML-like data)
   ↓
2. Compiler (process hull → decks → rooms)
   ↓
3. DerivedShipData (queryable geometry)
   ↓
4. 3D Render (Three.js viewport)
```

**Key principle:** Never edit geometry directly. Always go through the data model.

---

## Common Tasks

### Add a New Component

1. Create a new `.vue` file in `src/components/`
2. Import it in the parent component
3. Add to template

### Add a Compiler Stage

1. Create a new module in `src/compiler/`
2. Export functions that accept a spec and return derived data
3. Call from `src/compiler/index.ts` in the pipeline
4. Add tests in a `.test.ts` file

### Add a Type

1. Add to `src/types/index.ts`
2. If it needs validation, add a Zod schema in `src/types/schema.ts`
3. Export both the type and schema

### Persist Data

Use `src/utils/storage.ts`:

```typescript
import { saveShipToStorage, loadShipFromStorage } from "@utils/storage";

saveShipToStorage(shipSpec);
const loaded = loadShipFromStorage();
```

### Export Data

Use `src/utils/export.ts`:

```typescript
import { exportAsJSON, downloadFile } from "@utils/export";

const json = exportAsJSON(shipSpec);
downloadFile(json, "my-ship.json", "application/json");
```

---

## Debugging

### Enable Browser DevTools

- Press `F12` to open DevTools
- Vue DevTools extension recommended for inspecting components
- Pinia DevTools shows state changes in real-time

### Check Compilation

In your browser console:

```javascript
// Get current ship store
const store = useShipStore();

// See compiled data
console.log(store.derivedData);

// Check for errors
console.log(store.compilationError);
```

### Test a Compiler Stage

```bash
npm run test -- src/compiler/hull.test.ts --watch
```

---

## Next Steps

After you're comfortable, consider:

1. **Enhance the UI** — Add visual hull editor, room placement tools
2. **Implement mesh export** — Generate and export GLB files
3. **Add undo/redo** — Track changes and allow reverting
4. **Create presets** — Save common hull profiles
5. **Procedural generation** — Generate ships via Node.js CLI

---

## Troubleshooting

**Q: TypeScript errors on import?**  
A: Check that paths in `tsconfig.json` and `vite.config.ts` match.

**Q: Tests won't run?**  
A: Run `npm install jsdom` to install test environment.

**Q: 3D Preview shows nothing?**  
A: Three.js is initialized but mesh rendering is not yet implemented. Look for console errors.

**Q: Port 5173 already in use?**  
A: Vite will use next available port automatically, or set `VITE_PORT=3000 npm run dev`.

---

## Getting Help

- Check [README.md](./README.md) for full documentation
- Review the [design document](./Ship_Design_Toolkit_MVP_FULL.md) for architecture details
- Examine test files for usage examples
- Read code comments for implementation details

Good luck designing ships! 🚀
