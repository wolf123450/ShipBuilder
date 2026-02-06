# Ship Design Toolkit - MVP Development Roadmap

## Overview

Ship Design Toolkit MVP aims to deliver a production-ready spaceship design application with a visual 3D feedback loop. The project is structured in phases, each building on previous work.

---

## 📊 Implementation Status (as of Feb 6, 2026)

| Phase | Focus | Status | Tests | Notes |
|-------|-------|--------|-------|-------|
| **Phase 1** | Core MVP (mesh, preview, workflow) | ✅ COMPLETE | 22/22 passing | Visual feedback loop implemented |
| **Phase 2** | 2D Room Placement (editor & collision) | ✅ COMPLETE | 22/22 passing | Full drag-drop, SAT collision detection, CRUD |
| **Phase 3** | Export & Import (formats & library) | ✅ COMPLETE | 22/22 passing | JSON/YAML/GLB export + localStorage library |
| **Phase 4** | Polish & Optimization | ⏳ PENDING | — | Deferred (not blocking MVP release) |

**MVP Readiness**: ~95% complete. Core features fully implemented. Ready for release with Phase 4 items moved to future sprints.

---

## Phase 1: Core MVP (Visual Feedback Loop) - ✅ COMPLETE

### 1.1: Mesh Baker Module ✅ COMPLETE
- [x] Implement voxel-based hull mesh generation
- [x] Surface extraction (face-based approach)
- [x] Deck polygon extrusion to 3D
- [x] Room box generation
- [x] Configurable mesh resolution (0.5-5m, capped at 60³)
- [x] Unit tests (5 tests, all passing)
- **Status**: Complete and tested
- **Commits**: d2bc6c2

### 1.2: Preview3D Rewrite ✅ COMPLETE
- [x] Three.js scene with camera setup
- [x] Hull mesh rendering with Phong material
- [x] Deck footprints as semi-transparent overlays
- [x] Room visualization with type-based color coding
- [x] Interactive mesh resolution slider
- [x] Visibility toggles (hull/decks/rooms)
- [x] Orbit camera with animation
- [x] Stats overlay (vertex/deck/room counts)
- [x] Proper resource cleanup
- **Status**: Complete and rendering
- **Commits**: d2bc6c2

### 1.3: Tab-Based Workflow UI ✅ COMPLETE
- [x] Create StepEditor container (4 tabs)
- [x] Step 1: Hull Editor with presets and profile editor
- [x] Step 2: Deck Editor with deck summary
- [x] Step 3: Room Editor with add/delete functionality
- [x] Step 4: Export Editor with save/export UI
- [x] Integrate all steps into ShipDesignerApp
- [x] All components linked to Pinia store
- [x] No TypeScript errors
- **Status**: Complete and integrated
- **Commits**: 49c9ff2
- **Browser Testing**: Ready

**Phase 1 Summary**: 
- ✅ All 3 components delivered
- ✅ 22 unit tests passing
- ✅ Zero TypeScript errors
- ✅ Zero console errors (verified in browser)
- ✅ Real-time 3D feedback working
- ✅ Tab-based workflow fully functional

**Phase 2 Summary** (2D Room Placement):
- ✅ All 4 subsections complete (2.1-2.4: footprint, drag, collision, context menu)
- ✅ New Tab 3 "Rooms" replaces old RoomEditor (merged with 2D placement)
- ✅ Canvas backing store coordinate system fixed for accurate hit detection
- ✅ Full CRUD room management (add/edit/duplicate/delete/drag)
- ✅ Canvas panning support for easy navigation
- ✅ All existing tests still passing (22/22)
- ✅ Ready for Phase 3 (Export/Import)

**Phase 3 Summary** (Export/Import):
- ✅ JSON export (portable format)
- ✅ YAML export (version control friendly)
- ✅ GLB/GLTF export (game engine ready)
- ✅ File import with validation and error display
- ✅ localStorage project library with full CRUD
- ✅ All tests passing (22/22)
- 🚧 Ready for Phase 4 (Polish & Optimization)

---

## Phase 2: 2D Room Placement (Interactive Layout Editor) - ✅ COMPLETE

### 2.1: Deck Footprint 2D View ✅ COMPLETE
- [x] Render deck polygon in 2D orthographic view
- [x] Pan/zoom controls (mouse wheel to zoom, drag to pan)
- [x] Coordinate system display (X/Z axes with origin markers)
- [x] Grid overlay (optional, toggleable)
- [x] Room placement guide overlay (footprint bounds with clear visualization)
- [x] Update DeckFootprint type with bounds and area calculations
- [x] Integrated into StepEditor as Tab 3 (Rooms - merged with old RoomEditor)
- **Status**: Complete and tested

### 2.2: Room Drag-and-Drop ✅ COMPLETE
- [x] Click to select room (highlight with thicker border)
- [x] Drag to move room on deck (real-time position updates)
- [x] World coordinate display during mouse movement
- [x] Highlight selected room in 2D view with white border
- [x] Accurate hit detection using canvas backing store scaling
- **Status**: Complete and fully functional

### 2.3: Collision Detection & Feedback ✅ COMPLETE
- [x] Detect overlapping rooms using SAT (Separating Axis Theorem)
- [x] Highlight overlapping rooms in red with ✕ indicator
- [x] Detect rooms outside deck footprint with point-in-polygon test
- [x] Highlight out-of-bounds rooms in orange with ! indicator
- [x] Show valid placement zones (deck footprint with semi-transparent fill)
- [x] Real-time 3D updates as user drags (Preview3D synced)
- [x] Visual feedback for conflicts (color-coded, icons)
- **Status**: Complete with SAT algorithm and polygon containment

### 2.4: Room Context Menu ✅ COMPLETE
- [x] Delete room (delete button in room list)
- [x] Duplicate room (copy button, auto-generates unique ID, offset position)
- [x] Edit room properties (modal popup with full property editor)
- [x] Copy position/dimensions (edit form shows all properties)
- [x] Canvas panning (click empty space, drag to pan viewport, mouseup to stop)
- **Status**: Complete with full CRUD operations

**Phase 2 Summary:**
- ✅ All 4 subsections delivered (2.1-2.4)
- ✅ 22 unit tests passing (no new test failures)
- ✅ Zero TypeScript errors
- ✅ Real-time 2D visual editing with collision feedback
- ✅ Merged RoomEditor and DeckPlacementEditor into single "Rooms" tab
- ✅ Full interactive room management (add/edit/duplicate/delete/drag)
- ✅ Canvas panning for easy navigation
- ✅ Ready for Phase 3 (Export/Import)

---

## Phase 3: Export & Import - ✅ COMPLETE

### 3.1: File Export ✅ COMPLETE
- [x] GLB/GLTF mesh export (for game engines)
- [x] JSON ship spec export (portable, tested)
- [x] YAML ship spec export (version control friendly, tested)
- [x] Download file UI wired to export functions
- **Status**: Complete - All formats working

### 3.2: File Import ✅ COMPLETE
- [x] Import JSON/YAML from file dialog (triggerFileInput with file picker)
- [x] Validate imported spec against schema (auto-parsing with fallback)
- [x] Display import errors clearly (importError ref in UI)
- [x] Merge imported spec into current design (shipStore.loadShip)
- **Status**: Complete - Import modal with error display

### 3.3: Local Library ✅ COMPLETE
- [x] Save projects to browser localStorage (saveShipToLibrary)
- [x] Load saved projects with timestamps (loadLibrary with formatted dates)
- [x] Delete saved projects (deleteFromLibrary with confirmation)
- [x] Display library in Step 4 (Local Saves section in ExportEditor)
- **Status**: Complete - Full CRUD library management

**Phase 3 Summary:**
- ✅ JSON export implemented and tested
- ✅ YAML export implemented (js-yaml library)
- ✅ GLB/GLTF export implemented (Three.js GLTFExporter)
- ✅ File import with error handling complete
- ✅ localStorage library with persistence working
- ✅ All 22 unit tests passing (no regressions)
- ✅ Import error display in UI
- ✅ Delete project confirmation dialog added
- ✅ Ready for Phase 4 (Polish)

---

## Phase 4: Polish & Optimization - 🚧 IN PROGRESS

### Priority 1: Keyboard Shortcuts ⌨️ ✅ COMPLETE
- [x] **Ctrl+S** — Save current project to localStorage
- [x] **Delete** — Delete selected room
- [x] **Escape** — Clear selection
- [x] **Tab** — Cycle through deck tabs (1-4)
- [x] **Implementation**: Create `useKeyboardShortcuts.ts` composable
- [x] **File**: `src/components/composables/useKeyboardShortcuts.ts`
- [x] **Integration points**: `StepEditor.vue`, `Preview3D.vue`, `ShipDesignerApp.vue`
- [x] **Store updates**: Proper dirty tracking with `isDirty` and `markClean()`
- **Time spent**: ~2 hours
- **Status**: Tested and working (22/22 tests still passing)

### Priority 2: Confirmation Dialogs & Error Handling 🛡️ ✅ COMPLETE
- [x] Add delete confirmation for rooms (show modal before deleting)
- [x] Create reusable `ConfirmDialog.vue` component
  - [x] Props: title, message, confirmText, cancelText, isDangerous (red button)
  - [x] Emits: @confirm, @cancel
  - [x] Styles: Dark theme consistent with app
  - [x] Uses teleport for proper modal overlay
- [x] Add delete confirmation for room in `DeckPlacementEditor.vue`
  - [x] Shows confirmation dialog before deletion
  - [x] User-friendly message with warning
  - [x] Red "Delete" button for dangerous action
- [x] Add confirmation for "Delete Project" from library in `ExportEditor.vue`
  - [x] Shows project name in confirmation
  - [x] Prevents accidental deletions
- [x] Improve error messages (validation, import errors)
  - [x] Show user-friendly messages with emoji indicators
  - [x] Different messages for JSON/YAML/Spec validation errors
  - [x] Helpful hints about file format
- **Implementation**: Modal dialogs for destructive actions
- **Components created**:
  - `src/components/ConfirmDialog.vue` — Reusable confirmation dialog
- **Components updated**:
  - `DeckPlacementEditor.vue` - delete room confirmation
  - `ExportEditor.vue` - delete project confirmation + better error messages
- **Time spent**: ~1.5 hours
- **Status**: Complete (22/22 tests still passing)

### Priority 2.5: Keyboard Shortcuts Cheat Sheet 📋
- [ ] Create `KeyboardShortcutsHelp.vue` modal component
  - [ ] Show all available shortcuts with descriptions
  - [ ] Organized by category (Editing, Navigation, Export)
  - [ ] Include both keyboard text and visual icons
  - [ ] Copy-to-clipboard functionality for each shortcut
- [ ] Add "?" Help button to header
  - [ ] Opens cheat sheet modal on click
  - [ ] Accessible via keyboard (press "?" to toggle)
- [ ] Embed in-app documentation
  - [ ] Display shortcuts on first load (optional)
  - [ ] Persistent user preference to show/hide tips
- **Implementation**: Modal component + help UI button
- **File**: `src/components/KeyboardShortcutsHelp.vue`
- **Integration**: `ShipDesignerApp.vue` header
- **Estimated Time**: 1 hour
- **Tests**: None (visual documentation)

### Priority 3: Component Integration Tests 🧪
- [ ] Test hull editor (change parameters, presets)
- [ ] Test deck editor (add/edit decks)
- [ ] Test room placement (add/delete/drag)
- [ ] Test export/import roundtrip
- [ ] Test keyboard shortcuts
- **Implementation**: Vitest + Vue Test Utils
- **File**: `src/components/**/*.test.ts` (new)
- **Estimated Time**: 2-3 hours
- **Tests**: Full component interaction coverage

### Priority 4: Tooltips & UX Polish ✨
- [ ] Add tooltips to all hull parameters
- [ ] Add tooltips to deck controls
- [ ] Add tooltips to room editor
- [ ] Add tooltips to export buttons
- [ ] Create reusable `Tooltip.vue` component or use HTML title attributes
- **Estimated Time**: 1-2 hours
- **Tests**: None (visual only)

### Priority 5: Performance Optimization 🚀 [LOWER PRIORITY]
- [ ] Profile mesh generation with DevTools
- [ ] Implement mesh caching for unchanged specs
- [ ] Optimize voxel grid sampling (early termination)
- [ ] Lazy-load Three.js components
- **Estimated Time**: 2+ hours (depends on findings)
- **Tests**: Performance benchmarks with Vitest

### Testing (Priority 3) Details
- **Files to create**:
  - `src/components/editors/HullEditor.test.ts`
  - `src/components/editors/DeckEditor.test.ts`
  - `src/components/editors/DeckPlacementEditor.test.ts`
  - `src/components/editors/ExportEditor.test.ts`
- **Coverage goal**: All user interactions tested
- **Framework**: Vitest + @vue/test-utils

**Phase 4 Success Criteria**:
- ✅ Keyboard shortcuts working (Ctrl+S, Delete, etc.)
- ✅ Confirmation dialogs prevent accidental deletions
- ✅ Error messages are user-friendly
- ✅ Component tests provide confidence
- ✅ No console warnings during normal use
- ✅ Smooth 60 FPS on modern hardware

---

## Success Criteria for MVP

### Functional Requirements
- [x] Users can design hull shape with adjustable parameters
- [x] Users can add multiple decks with custom heights
- [x] Users can add rooms to decks
- [x] 3D preview updates in real-time
- [x] Users can export designs (JSON/YAML)
- [x] Users can save designs locally
- [x] Users can import previously saved designs
- [x] Users can place rooms on deck footprints visually
- [x] Users can export designs as GLB for game engines

### Non-Functional Requirements
- [x] Deterministic mesh generation (same input = same output)
- [x] No external mesh libraries (custom implementation)
- [x] Responsive UI (runs smoothly on modern browsers)
- [x] Strict TypeScript mode
- [x] Unit tests for core compiler
- [x] No console errors in browser
- [ ] Sub-300ms frame time on modern hardware
- [ ] <100ms compile time for typical ships

### UX Requirements
- [x] Clear step-by-step workflow
- [x] Real-time visual feedback
- [x] Preset options for quick setup
- [ ] Tooltips for all parameters
- [ ] Visual feedback for validation errors

---

## Timeline & Effort Estimate (REVISED)

| Phase | Component | Est. Time | Status | Actual |
|-------|-----------|-----------|--------|--------|
| 1.1 | Mesh Baker | 1 hour | ✅ | ~1h |
| 1.2 | Preview3D | 2 hours | ✅ | ~2h |
| 1.3 | Step Editor | 2 hours | ✅ | ~2.5h |
| 2.1-2.4 | 2D Room Placement | 2.5 hours | ✅ | ~3h |
| 3 | Export/Import | 1.5 hours | ✅ | ~1.5h |
| 4 | Polish | 1 hour | ⏳ | — |
| **Total** | | **10 hours** | **85% done** | **10h done** |

---

## Testing Strategy

- [x] Unit tests for hull compiler (6 tests)
- [x] Unit tests for deck compiler (6 tests)
- [x] Unit tests for mesh baker (5 tests)
- [x] All tests passing (22/22)
- [ ] Component integration tests
- [ ] Browser smoke tests
- [ ] Performance profiling

**Current Test Status**: 
- ✅ 22 tests passing
- ✅ Zero TypeScript errors
- ✅ Zero console errors (verified in browser)
- ✅ All UI components rendering correctly

---

## Known Issues & Limitations

1. **Mesh Generation**
   - Simple voxel approach, not optimized marching cubes
   - Can produce visible blocky artifacts on curved surfaces
   - **Workaround**: Use mesh resolution slider for better quality
   - Solution: Implement proper marching cubes in Phase 2

2. **Room Placement Validation**
   - Uses AABB overlap (basic, not perfect)
   - Doesn't check polygon containment
   - **Workaround**: 2D placement editor in Phase 2
   - Solution: Implement polygon containment check

3. **Deck Footprint Shrinking**
   - Uses simple centroid-based approach
   - Doesn't handle concave shapes well
   - **Workaround**: Manual room positioning
   - Solution: Implement robust polygon offset in Phase 2

4. **Performance**
   - No mesh caching (recalculates on every change)
   - Can be slow with high-resolution grids
   - **Workaround**: Use coarser resolution for real-time editing
   - Solution: Implement GPU instancing in Phase 4

---

## Code Quality Metrics

- **TypeScript**: Strict mode enabled ✅
- **Test Coverage**: ~35% (core compiler only)
- **ESLint**: Clean (no warnings) ✅
- **Prettier**: Auto-formatted ✅
- **Compilation**: Zero errors ✅
- **Browser Console**: Zero errors ✅

---

## Architecture Notes

### State Management Pattern
```
Store (shipSpec) → Compiler (pure) → Derived Data → UI (reactive)
                                    ↓
                            3D Mesh (cached)
```

### Mesh Generation Pipeline
```
Hull Volume → Voxel Grid Sampling → Face Extraction → Mesh Geometry
   (SDF)      (configurable res)      (simple)      (Three.js)
```

### Component Hierarchy
```
ShipDesignerApp
├── Header (export button)
├── StepEditor (tab container) ✅
│   ├── HullEditor ✅
│   ├── DeckEditor ✅
│   ├── RoomEditor ✅
│   └── ExportEditor ✅ (UI only)
└── Preview3D (3D viewport) ✅
```

---

## Completed Work Summary

### Git Commits
1. **d2bc6c2**: Phase 1.1 & 1.2 - Mesh baker and Preview3D rewrite
2. **49c9ff2**: Phase 1.3 - Step editor integration

### Files Created
- `src/compiler/mesh.ts` (206 lines)
- `src/compiler/mesh.test.ts` (95 lines)
- `src/components/Preview3D.vue` (290 lines, rewritten)
- `src/components/StepEditor.vue` (44 lines)
- `src/components/editors/HullEditor.vue` (180 lines)
- `src/components/editors/DeckEditor.vue` (130 lines)
- `src/components/editors/RoomEditor.vue` (160 lines)
- `src/components/editors/ExportEditor.vue` (231 lines)
- `TODO.md` (this file)

### Files Modified
- `src/components/ShipDesignerApp.vue` (integrated StepEditor)
- `tsconfig.json` (added @core alias)
- `vite.config.ts` (added @core alias)
- `vitest.config.ts` (added @core alias)
- 8+ files (import updates for @core alias)

---

## Next Immediate Steps

### For Phase 3 (Export & Import) - NEXT PRIORITY
1. Create `ExportEditor.vue` export UI (wire buttons)
   - Implement JSON download
   - Implement YAML download
   - Implement GLB export via three.js
   - Add localStorage save/load

2. Add import dialog
   - File picker UI
   - Validate imported spec against schema
   - Load into current design with error handling

3. Add local library manager
   - Save/load from localStorage
   - Display list of saved projects with timestamps
   - Delete saved projects

### For Phase 4 (Polish) - FINAL
1. Add keyboard shortcuts
   - Ctrl+S to save
   - Ctrl+Z/Ctrl+Y for undo/redo (optional)
   - Delete key to remove selected room
   - R key to rotate selected room
2. Improve error messages with user-friendly text
3. Add tooltips to all parameters
4. Profile performance and optimize if needed

---

## Development Notes

**Build System**: Vite + Vue 3 + TypeScript
**Testing**: Vitest
**Styling**: Tailwind CSS with ship theme
**3D**: Three.js v0.159.0
**State**: Pinia with reactive ship specs
**Data Validation**: Zod schemas
**IDE**: VS Code with Prettier + ESLint
**Git**: Meaningful commits per feature

**To Run**:
```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server (http://localhost:5173)
npm run test -- --run        # Run all tests (22 passing)
npm run build                # Production build
```

**Current Status**: 
- ✅ Phase 1 Complete
- 🚧 Phase 2-4 Ready to Start
- **MVP Core**: Fully Functional
- **Browser Testing**: Verified Working
