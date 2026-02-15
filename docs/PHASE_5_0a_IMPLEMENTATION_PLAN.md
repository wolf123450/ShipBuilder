# Phase 5.0a Implementation Plan
## Hierarchy Panel + Enhanced Selection System + Secondary Hull Editor

**Document Date**: February 15, 2026  
**Phase**: 5.0a (Post-MVP, Critical Feature)  
**Status**: Planning (Awaiting Approval)  
**Estimated Effort**: 12-15 hours

---

## 1. Executive Summary

Phase 5.0a adds three interconnected systems to transform ShipBuilder from a flat, parameter-focused tool to a **ship-aware design environment**:

1. **Object Hierarchy Panel** (left sidebar) — Visual tree of all ship objects
2. **Enhanced Selection System** (shipStore) — Single/group/multi-select with consistent interaction model
3. **Secondary Hull Editor** (properties panel) — UI to manage multiple independent hulls with position/rotation/scale

**Key Outcome**: Designers can now visualize complex multi-hull ships (Enterprise saucer+nacelles, Star Destroyer wedge+engines) and navigate large designs with 50+ decks/rooms via an intuitive tree view.

**Integration**: All views (3D, 2D, panels) sync selection state in real-time. Clicking a hull in the hierarchy highlights it in 3D, clicking a deck in 3D updates the hierarchy, etc.

---

## 2. Architecture Overview

### Selection State Model (Enhanced)

**Current (MVP)**:
```typescript
// Store only tracks one selected item
selectedItem: {
  itemType: 'room' | 'deck' | 'hull' | null;
  itemId: string | null;
}
```

**New (Phase 5.0a)**:
```typescript
// Supports single, group, and multi-select
selection: {
  mode: 'single' | 'group' | 'multi';              // Selection mode
  itemType: 'hull' | 'deck' | 'room' | 'all-hulls' | 'all-decks' | 'all-rooms' | null;
  itemIds: string[];                                // Selected item IDs (empty for 'all-*')
}

// Helper state for UI
expandedNodes: {
  'primary-hull': boolean;
  'secondary-hulls': boolean;
  'decks': boolean;
  'rooms': boolean;
}

// Search/filter
hierarchyFilter: string;  // Search text to filter objects by name
```

### Data Flow

```
User Action                Store Action                View Updates
─────────────────────────────────────────────────────────────────────
Click hull in hierarchy → selectItem('hull', id)    → Preview3D highlights hull
                        → mode='single'              → DeckPlacementEditor clears
                        → itemIds=[id]              → HierarchyPanel focuses node

Click + Ctrl desk 1     → selectMultiple('deck', [id1, id2])
                        → mode='multi'              → Preview3D shows group highlight
                        → itemIds=[id1, id2, ...]  → Hierarchy shows checkmarks

"Select All Decks" btn  → selectAllOfType('deck')   → All deck outlines visible
                        → mode='group'              → Hierarchy shows folder icon
                        → itemType='all-decks'      → Expanding node shows full list

Click in 3D preview     → shipStore.selectItem()    → Hierarchy autoscrolls to object
                        → triggers from useInputHandlers.ts

Expand/collapse node    → toggleExpandedNode(path)  → HierarchyPanel redraws
                        → no selection change
```

### Component Hierarchy (Updated)

```
ShipDesignerApp (root)
├── Header
│   └── [Help, Export buttons - existing]
│
├── MainLayout (new flex container: 3-column)
│   ├── HierarchyPanel (LEFT SIDEBAR) - NEW
│   │   ├── Header: "Ship Structure"
│   │   ├── Search input (filter by name)
│   │   ├── HierarchyNode (RECURSIVE)
│   │   │   ├── Node header (icon + name + count)
│   │   │   │   ├── Icon click → selectItem()
│   │   │   │   ├── Ctrl+Click → selectMultiple()
│   │   │   │   ├── Right-Click → context menu
│   │   │   │   └── [+/-] expand/collapse
│   │   │   └── Children (if expanded)
│   │   │       └── HierarchyNode (recursive)
│   │   │
│   │   └── Context Menu (right-click)
│   │       ├── Select
│   │       ├── Duplicate (for hulls/decks/rooms)
│   │       ├── Delete
│   │       ├── Rename (future)
│   │       └── Properties...
│   │
│   ├── StepEditor (CENTER) - MODIFIED
│   │   ├── Tab: Hull Editor (modified to include Secondary Hulls)
│   │   ├── Tab: Deck Editor
│   │   ├── Tab: Room Editor / DeckPlacementEditor
│   │   ├── Tab: Export Editor
│   │   │
│   │   └── PropertiesPanel (new, shown when object selected)
│   │       ├── Show details of selected object
│   │       ├── If secondary hull → SecondaryHullEditor component
│   │       ├── If room → show room properties (existing)
│   │       └── If deck → show deck properties (existing)
│   │
│   └── Preview3D (RIGHT) - MODIFIED
│       ├── 3D Canvas
│       ├── Camera controls
│       └── Multi-selection highlighting (NEW)
```

---

## 3. Component Specification

### 3.1 HierarchyPanel.vue (NEW)

**Purpose**: Main left sidebar showing ship structure as collapsible tree

**Props**: None (consumes from store)

**Template Structure**:
```vue
<template>
  <div class="hierarchy-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>📦 Ship Structure</h3>
      <button @click="collapseSe" class="collapse-all-btn">Collapse All</button>
    </div>

    <!-- Search filter -->
    <input 
      v-model="searchFilter"
      placeholder="Search objects..."
      class="search-input"
    />

    <!-- Main tree -->
    <div class="tree-root">
      <HierarchyNode
        :node="shipNode"
        :filter="searchFilter"
        :expanded-nodes="expandedNodes"
        @select="handleSelect"
        @expand="handleExpand"
        @context-menu="showContextMenu"
      />
    </div>

    <!-- Context menu (floating) -->
    <ContextMenu v-if="contextMenu.visible" :position="contextMenu.pos" />
  </div>
</template>
```

**Data**:
```typescript
const searchFilter = ref('');
const expandedNodes = ref({});
const contextMenu = ref({ visible: false, pos: { x: 0, y: 0 }, target: null });

// Computed tree structure
const shipNode = computed(() => buildHierarchyTree(shipStore.shipSpec));
```

**Methods**:
- `handleSelect(itemType, itemId, multiSelect)` → calls `shipStore.selectItem()/selectMultiple()`
- `handleExpand(nodePath)` → toggles `expandedNodes[nodePath]`
- `showContextMenu(event, target)` → shows right-click menu
- `collapseAll()` → collapses all nodes
- `buildHierarchyTree()` → transforms spec into tree structure

**Styling**:
- Dark theme sidebar (matches app)
- Tree indentation (20px per level)
- Hover states for items
- Highlight selected items
- Icons for object types (⚓ 🛰️ 📋 🚪 📦)

**Watch**:
- Watch `shipStore.selection` → highlight selected node in tree
- Watch `searchFilter` → re-render filtered tree

---

### 3.2 HierarchyNode.vue (NEW - RECURSIVE)

**Purpose**: Single node in hierarchy tree (recursively renders children)

**Props**:
```typescript
interface HierarchyNodeProps {
  node: HierarchyTreeNode;           // { id, name, type, icon, count?, children? }
  filter: string;                    // Search filter text
  expandedNodes: Record<string, boolean>;  // Track expanded state
  level: number;                     // Nesting level (for indentation)
}
```

**Emits**:
- `select(itemType, itemId, multiSelect)`
- `expand(nodePath)`
- `context-menu(event, target)`

**Template**:
```vue
<template>
  <div class="hierarchy-node" :style="{ marginLeft: level * 20 + 'px' }">
    <!-- Node header (clickable) -->
    <div class="node-header" @contextmenu.prevent="showMenu">
      <!-- Expand toggle (if has children) -->
      <button 
        v-if="node.children?.length"
        @click="toggleExpand"
        class="expand-btn"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
      <span v-else class="expand-spacer"></span>

      <!-- Icon -->
      <span class="node-icon">{{ node.icon }}</span>

      <!-- Name + selection checkbox/highlight -->
      <span
        class="node-label"
        :class="{ selected: isSelected }"
        @click="selectNode($event)"
      >
        {{ node.name }}
      </span>

      <!-- Count badge (if applicable) -->
      <span v-if="node.count !== undefined" class="node-count">
        ({{ node.count }})
      </span>

      <!-- Checkmark if selected -->
      <span v-if="isSelected" class="selected-indicator">✓</span>
    </div>

    <!-- Children (if expanded and has children) -->
    <template v-if="isExpanded && node.children?.length">
      <HierarchyNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :filter="filter"
        :expanded-nodes="expandedNodes"
        :level="level + 1"
        @select="$emit('select', ...)"
        @expand="$emit('expand', ...)"
        @context-menu="$emit('context-menu', ...)"
      />
    </template>
  </div>
</template>
```

**Data**:
```typescript
const isExpanded = computed(() => expandedNodes[node.nodePath] ?? false);
const isSelected = computed(() => shipStore.isSelected(node.itemType, node.id));
```

**Methods**:
- `selectNode(event)` → emit select with Ctrl/Shift handling
- `toggleExpand()` → emit expand event
- `showMenu(event)` → emit context-menu event

---

### 3.3 SecondaryHullEditor.vue (NEW)

**Purpose**: Properties panel editor for secondary hulls (shown when secondary hull selected)

**Props**:
```typescript
interface SecondaryHullEditorProps {
  hullId: string;  // ID of secondary hull being edited
}
```

**Template Structure**:
```vue
<template>
  <div class="secondary-hull-editor" v-if="hull">
    <!-- Header -->
    <div class="editor-header">
      <h4>⚙️ Edit Secondary Hull</h4>
      <button @click="deleteHull" class="delete-btn">🗑️ Delete</button>
    </div>

    <!-- Basic info -->
    <div class="form-group">
      <label>Hull Name</label>
      <input v-model="hull.name" placeholder="e.g., Port Engine Pod" />
    </div>

    <div class="form-group">
      <label>Description</label>
      <textarea v-model="hull.description" rows="2" />
    </div>

    <!-- Transform controls -->
    <fieldset>
      <legend>🗺️ Position (World Coordinates)</legend>
      
      <div class="slider-group">
        <label>X: <span>{{ hull.worldTransform.position?.x.toFixed(1) }}m</span></label>
        <input 
          v-model.number="hull.worldTransform.position.x"
          type="range" 
          min="-100" max="100" step="1"
        />
      </div>

      <div class="slider-group">
        <label>Y: <span>{{ hull.worldTransform.position?.y.toFixed(1) }}m</span></label>
        <input 
          v-model.number="hull.worldTransform.position.y"
          type="range" 
          min="-20" max="20" step="1"
        />
      </div>

      <div class="slider-group">
        <label>Z: <span>{{ hull.worldTransform.position?.z.toFixed(1) }}m</span></label>
        <input 
          v-model.number="hull.worldTransform.position.z"
          type="range" 
          min="-100" max="100" step="1"
        />
      </div>
    </fieldset>

    <fieldset>
      <legend>🔄 Rotation (Degrees)</legend>
      
      <div class="slider-group">
        <label>Pitch (X): <span>{{ hull.worldTransform.rotation?.x.toFixed(0) }}°</span></label>
        <input 
          v-model.number="hull.worldTransform.rotation.x"
          type="range" 
          min="-180" max="180" step="1"
        />
      </div>

      <div class="slider-group">
        <label>Yaw (Y): <span>{{ hull.worldTransform.rotation?.y.toFixed(0) }}°</span></label>
        <input 
          v-model.number="hull.worldTransform.rotation.y"
          type="range" 
          min="-180" max="180" step="1"
        />
      </div>

      <div class="slider-group">
        <label>Roll (Z): <span>{{ hull.worldTransform.rotation?.z.toFixed(0) }}°</span></label>
        <input 
          v-model.number="hull.worldTransform.rotation.z"
          type="range" 
          min="-180" max="180" step="1"
        />
      </div>
    </fieldset>

    <fieldset>
      <legend>📏 Scale</legend>
      <div class="slider-group">
        <label>Scale Factor: <span>{{ hull.worldTransform.scale?.toFixed(2) }}x</span></label>
        <input 
          v-model.number="hull.worldTransform.scale"
          type="range" 
          min="0.1" max="2.0" step="0.1"
        />
      </div>
    </fieldset>

    <!-- Profile mode -->
    <fieldset>
      <legend>📋 Hull Profile</legend>
      <label class="checkbox">
        <input 
          v-model="hull.usesPrimaryProfile"
          type="checkbox"
        />
        Use Primary Hull Profile
      </label>
      <p v-if="!hull.usesPrimaryProfile" class="hint">
        Custom profile editing coming in Phase 5.0b
      </p>
    </fieldset>

    <!-- Visibility -->
    <fieldset>
      <legend>👁️ Visibility</legend>
      <label class="checkbox">
        <input 
          v-model="hull.visible"
          type="checkbox"
        />
        Visible in 3D Preview
      </label>
    </fieldset>

    <!-- Quick actions -->
    <div class="action-buttons">
      <button @click="duplicateHull" class="btn-secondary">📋 Duplicate</button>
      <button @click="mirrorHull" class="btn-secondary">🔄 Mirror (X)</button>
      <button @click="resetPosition" class="btn-secondary">⟲ Reset Position</button>
    </div>

    <!-- Display current mesh -->
    <div class="info-section">
      <p><strong>Mesh:</strong> {{ hull.worldTransform ? 'Transformed hull' : 'Primary hull profile' }}</p>
      <p><strong>Algorithm:</strong> {{ hull.generation_algorithm || 'parametric_surface' }}</p>
    </div>
  </div>
</template>
```

**Data**:
```typescript
const hull = ref(null);

const updateHull = debounce((field, value) => {
  shipStore.updateSecondaryHull(hullId.value, { [field]: value });
}, 300);
```

**Methods**:
- `duplicateHull()` → `shipStore.duplicateSecondaryHull(id)` with auto-offset position
- `mirrorHull()` → reflect position across X-axis (for symmetrical engine pods)
- `resetPosition()` → set position to (0, 0, 0)
- `deleteHull()` → show confirmation dialog, then `shipStore.deleteSecondaryHull(id)`

**Watch**:
- Watch hull properties → update store with debounce to avoid excessive re-renders

---

## 4. Store Changes (shipStore.ts)

### New State

```typescript
// Enhanced selection
selection: {
  mode: 'single' | 'group' | 'multi';
  itemType: 'hull' | 'deck' | 'room' | 'all-hulls' | 'all-decks' | 'all-rooms' | null;
  itemIds: string[];  // Empty for 'all-*' selections
}

// Hierarchy UI state
hierarchyUI: {
  expandedNodes: Record<string, boolean>;
  searchFilter: string;
  contextMenuTarget: { type: string; id: string } | null;
}
```

### New Methods

```typescript
// Selection methods
selectItem(type: 'hull' | 'deck' | 'room', id: string, multiSelect: boolean = false)
selectAllOfType(type: 'hull' | 'deck' | 'room')
clearSelection()
toggleSelection(type: string, id: string)
selectMultiple(type: string, ids: string[])
isSelected(type: string, id: string): boolean
getSelectedIds(): string[]

// Hierarchy UI
toggleExpandedNode(path: string)
setHierarchyFilter(filter: string)
expandAllNodes()
collapseAllNodes()

// Secondary hull CRUD
addSecondaryHull(spec: HullSpec)
updateSecondaryHull(id: string, updates: Partial<HullSpec>)
deleteSecondaryHull(id: string)
duplicateSecondaryHull(id: string)

// Helper
getSelectedObject(): { type: string; id: string; object: any } | null
```

### Implementation Details

**selectItem**:
```typescript
selectItem(type, id, multiSelect = false) {
  if (multiSelect && this.selection.mode === 'multi') {
    // Add to selection
    if (!this.selection.itemIds.includes(id)) {
      this.selection.itemIds.push(id);
    }
  } else if (multiSelect && this.selection.itemType === type) {
    // Shift-click range selection (future)
    // For now: treat as toggle
    const idx = this.selection.itemIds.indexOf(id);
    if (idx >= 0) {
      this.selection.itemIds.splice(idx, 1);
    } else {
      this.selection.itemIds.push(id);
    }
  } else {
    // Single select
    this.selection = {
      mode: 'single',
      itemType: type,
      itemIds: [id]
    };
  }
  
  // Trigger reactivity for highlighting
  this.markDirty();
}
```

**selectAllOfType**:
```typescript
selectAllOfType(type: 'hull' | 'deck' | 'room') {
  const ids = this.getAllOfType(type).map(obj => obj.id);
  this.selection = {
    mode: 'group',
    itemType: `all-${type}s`,
    itemIds: ids
  };
  this.markDirty();
}
```

---

## 5. File Structure

### New Files to Create
```
src/components/
├── HierarchyPanel.vue          (500-600 lines)
├── HierarchyNode.vue           (350-400 lines)
├── editors/
│   └── SecondaryHullEditor.vue (400-500 lines)
└── composables/
    └── useHierarchySelection.ts (200-250 lines) - optional helper

src/utils/
└── hierarchyUtils.ts           (150-200 lines)
  ├── buildHierarchyTree()
  ├── filterHierarchy()
  ├── findNodePath()
  └── etc.

docs/
└── PHASE_5_0a_IMPLEMENTATION_PLAN.md (this file)

tests/
└── Phase5.0a-hierarchy.spec.ts (300-400 lines)
  ├── Hierarchy tree building
  ├── Selection state changes
  ├── Multi-select
  ├── Group select
  └── Tree filtering
```

### Modified Files
```
src/stores/shipStore.ts
├── Add selection state
├── Add hierarchy UI state
├── Add new methods (selectItem, selectAllOfType, etc.)
└── Add secondary hull CRUD methods

src/components/ShipDesignerApp.vue
├── Import HierarchyPanel
├── Restructure layout to 3-column (sidebar | center | preview)
├── Pass selection state to components
└── Connect selection signals

src/components/Preview3D.vue
├── Import useInputHandlers composable
├── Add mousedown handler → selectItem() from clicks
├── Update highlighting for multi-select (ALL SELECTIONS)
├── Add group highlight colors (all-hulls, all-decks, all-rooms)
└── Handle selection sync from store

src/components/editors/DeckPlacementEditor.vue
├── Update for hierarchy integration
├── Clear room selection when switching tabs
├── Update highlighting for multi-select

src/components/StepEditor.vue
├── Add PropertiesPanel sub-component
├── Show appropriate editor (SecondaryHullEditor, etc.) based on selection
└── Hide properties panel when nothing selected

src/types/index.ts
├── Add HierarchyTreeNode interface
├── Extend HullSpec (add name, description, visible properties if not present)
├── Update SelectionState type
└── Add WorldTransform enhancements

src/compiler/index.ts
├── Update compileShip() to handle secondary hull visibility
└── Skip invisible hulls from compilation (optimization)
```

---

## 6. Implementation Sequence

### Phase A: Foundation (1-2 hours)
1. Update `src/types/index.ts` with new interfaces
2. Update `shipStore.ts` with new selection state & methods
3. Create `src/utils/hierarchyUtils.ts` with tree-building functions
4. Create test file `Phase5.0a-hierarchy.spec.ts` (skeleton)

### Phase B: Components (4-5 hours)
5. Create `HierarchyPanel.vue` (without context menu first)
6. Create `HierarchyNode.vue` (recursive tree)
7. Create `SecondaryHullEditor.vue` (form-based editor)
8. Create `useHierarchySelection.ts` composable (optional)

### Phase C: Integration (3-4 hours)
9. Update `ShipDesignerApp.vue` layout (3-column)
10. Update `Preview3D.vue` for multi-selection highlighting
11. Update `DeckPlacementEditor.vue` for hierarchy sync
12. Update `StepEditor.vue` with PropertiesPanel

### Phase D: Polish & Testing (2-3 hours)
13. Add context menu (right-click) to HierarchyNode
14. Add search/filter functionality
15. Add keyboard shortcuts (Up/Down to navigate, Enter to select, etc.)
16. Complete test suite
17. Fix edge cases & visual polish

---

## 7. Integration Points

### With Preview3D.vue
- **Input**: Click on hull/deck/room in 3D → triggers `selectItem()`
- **Output**: Store selection → Preview3D highlights selected objects
- **New**: Multi-selection highlighting with different colors per selection mode

### With DeckPlacementEditor.vue
- **Input**: Click on room in 2D deck view → triggers `selectItem('room', id)`
- **Output**: Store selection → DeckPlacementEditor updates room highlighting
- **Note**: Deck view only allows single room or "all-rooms" selection (no mixed multi-select)

### With StepEditor.vue / Tab Switching
- **Input**: Tab switches (Hull → Decks → Rooms → Export)
- **Behavior**: Selection persists across tabs (e.g., select room, click Deck tab, room stays selected in background)
- **Output**: PropertiesPanel shows selected object's editor

### With useInputHandlers.ts (Existing)
- **Input**: Existing click handlers for 3D selection
- **Modification**: Call new `selectItem()` signatures with multi-select parameter

---

## 8. Highlighting & Visual Feedback (Preview3D.vue)

### Highlighting Strategy

**Single Selection**:
```
selectItem('hull', id1) → 
  glow: yellow outline 1.5px
  color: original hull color (no tint)
```

**All-Hulls Selection**:
```
selectAllOfType('hull') →
  All primary + secondary hulls get:
  glow: light blue outline 1.0px
  pulse: subtle opacity animation (0.8→1.0 over 2s)
```

**All-Decks Selection**:
```
selectAllOfType('deck') →
  All deck polygons get:
  color: semi-transparent blue (0.3 opacity)
  outline: blue 1px
```

**All-Rooms Selection**:
```
selectAllOfType('room') →
  All room boxes get:
  color: semi-transparent green (0.3 opacity)
  outline: green 1px
```

**Multi-Select (Ctrl+Click, 2+ items)**:
```
selectMultiple('room', [id1, id2, id3]) →
  Room 1: outline magenta 1.5px
  Room 2: outline cyan 1.5px
  Room 3: outline yellow 1.5px (cycle colors)
```

### Implementation (Three.js)

Use custom shaders or material layering:
1. Create outline pass using EffectComposer (existing in Preview3D)
2. Build selection set from store.selection.itemIds
3. Update outline color/intensity based on selection mode
4. Use stencil buffer or separate render pass for group highlights

---

## 9. Testing Strategy

### Unit Tests (Phase5.0a-hierarchy.spec.ts)

**Store Logic**:
- `selectItem()` single select
- `selectItem()` with multiSelect=true
- `selectAllOfType()` 
- `clearSelection()`
- `toggleSelection()`
- `isSelected()`
- `getSelectedIds()`

**Hierarchy Tree Building**:
- Build tree from flat spec
- Filter tree by search text
- Count children correctly
- Handle empty specs

**Secondary Hull CRUD**:
- `addSecondaryHull()`
- `updateSecondaryHull()` (position, rotation, scale)
- `deleteSecondaryHull()`
- `duplicateSecondaryHull()`

### Component Tests

**HierarchyPanel**:
- Click item → emits select event
- Ctrl+Click → multi-select
- Expand/collapse nodes
- Search filter works
- Tree rebuilds when spec changes

**HierarchyNode** (recursive):
- Renders correctly with children
- Toggles expanded state
- Shows selection indicator
- Right-click context menu

**SecondaryHullEditor**:
- Loads hull data
- Updates form inputs
- Calls store methods on save
- Delete confirmation dialog
- Duplicate/mirror/reset buttons work

### Integration Tests

**Selection Sync**:
- Select in hierarchy → 3D view highlights
- Click hull in 3D → hierarchy updates focus
- Ctrl+Click in hierarchy → multi-select works
- Select all decks → all deck polygons highlight

**Tab Switching**:
- Selection persists when switching tabs
- PropertiesPanel shows correct editor for selected object
- Room selection survives Hull tab → Rooms tab navigation

---

## 10. Styling & Visual Design

### HierarchyPanel (Left Sidebar)

```css
.hierarchy-panel {
  width: 280px;
  background: #1e1e1e;  /* Dark sidebar */
  border-right: 1px solid #444;
  padding: 16px;
  overflow-y: auto;
  font-size: 13px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.node-header {
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.4;
}

.node-header:hover {
  background-color: #333;
}

.node-header.selected {
  background-color: #0e639c;  /* VS Code selection blue */
  color: white;
}

.expand-btn {
  width: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 10px;
}

.node-icon {
  margin-right: 4px;
  font-size: 14px;
}

.node-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-count {
  color: #888;
  font-size: 11px;
  margin-left: 4px;
}

.selected-indicator {
  color: #4ec9b0;
  font-weight: bold;
  font-size: 12px;
}

.search-input {
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 12px;
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ddd;
  font-size: 12px;
}

.search-input::placeholder {
  color: #666;
}
```

### SecondaryHullEditor (Properties Panel)

```css
.secondary-hull-editor {
  padding: 16px;
  background: #252526;
  border-radius: 4px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #ccc;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 6px 8px;
  background-color: #3c3c3c;
  border: 1px solid #555;
  border-radius: 3px;
  color: #ddd;
  font-family: inherit;
  font-size: 12px;
}

fieldset {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #1e1e1e;
}

legend {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.slider-group label {
  margin: 0;
  font-size: 12px;
  min-width: 100px;
}

.slider-group span {
  color: #4ec9b0;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  min-width: 40px;
  text-align: right;
}

.slider-group input[type="range"] {
  flex: 1;
  cursor: pointer;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin: 8px 0;
  font-size: 12px;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 16px;
}

.action-buttons button {
  padding: 6px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #3c3c3c;
  color: #ddd;
  transition: 0.2s;
}

.action-buttons button:hover {
  background-color: #4c4c4c;
  border-color: #666;
}

.delete-btn {
  background-color: #6d2222;
  border-color: #922222;
}

.delete-btn:hover {
  background-color: #8d2222;
}
```

---

## 11. Data Structures & Interfaces

### Hierarchy Tree Node

```typescript
interface HierarchyTreeNode {
  id: string;                    // Unique ID
  name: string;                  // Display name
  type: 'ship' | 'hull' | 'secondary-hull' | 'decks' | 'deck' | 'rooms' | 'room';
  icon: string;                  // Emoji icon (⚓ 🛰️ 📋 🚪 📦)
  count?: number;                // For heading nodes (e.g., "Decks (4)")
  itemType?: string;             // For selection (e.g., 'deck', 'room')
  itemId?: string;               // For selection (e.g., deck index, room ID)
  children?: HierarchyTreeNode[];
  nodePath?: string;             // For hierarchy.primaryHull.decks[2]
}
```

### Selection State

```typescript
interface SelectionState {
  mode: 'single' | 'group' | 'multi';
  itemType: 'hull' | 'deck' | 'room' | 'all-hulls' | 'all-decks' | 'all-rooms' | null;
  itemIds: string[];  // Single-select: [id], Multi-select: [id1, id2, ...], Group: all matching IDs
}
```

### Hierarchy UI State

```typescript
interface HierarchyUIState {
  expandedNodes: Record<string, boolean>;  // e.g., { 'primary-hull': true, 'secondary-hulls': false }
  searchFilter: string;
  contextMenuTarget: { type: string; itemId: string } | null;
  contextMenuPos: { x: number; y: number };
}
```

---

## 12. Edge Cases & Considerations

### Deck/Room Selection in Context of Secondary Hulls

**Question**: When a ship has secondary hulls, can decks/rooms exist on secondary hulls?

**Current Assumption**: 
- Primary hull has decks (existing implementation)
- Secondary hulls are visuals only (no UI for their decks yet - Phase 5+ feature)
- Decks/rooms still belong to primary hull

**Future** (Phase 5.1+): 
- Allow secondary hulls to have their own deck stacks
- Update hierarchy to show `Secondary Hull > Decks` tree
- Update deck compilation to iterate over all hulls

### Multi-Select Limitations

**Current Design**:
- Multi-select works best within a single object type (multiple rooms, multiple decks, etc.)
- `selectAllOfType()` is primary multi-select method
- Ctrl+Click adds to selection (must be same type for now)

**Future Enhancement**:
- Allow mixing types (e.g., select room + deck for copying/moving)
- Add "Select by tag" (e.g., select all VIP rooms)

### Performance with Large Ships (50+ rooms, 10+ decks)

**Considerations**:
- Hierarchy tree filtering should be efficient (computed property, memoized)
- Selection state changes should not trigger full re-render
- Highlighting in Preview3D should use efficient rendering (material swapping, not object recreation)

**Optimization**:
- Use `shallowReactive` for store to avoid deep reactivity overhead
- Implement virtual scrolling in hierarchy if tree grows very large (future)
- Batch store updates to single `markDirty()` call

### Context Menu (Right-Click)

**Initial Features**:
- Select
- Duplicate (hulls, decks, rooms)
- Delete
- Properties (open editor)

**Future**:
- Rename
- Copy/Paste
- Share/Export single object

---

## 13. Open Decisions (Awaiting Approval)

### Decision 1: Secondary Hull UI in Properties Panel vs Tab

**Option A (Proposed)**: SecondaryHullEditor component in PropertiesPanel (right of editor)
- Pros: Integrated with selection, visible alongside other editors
- Cons: Takes up right panel space

**Option B Alternative**: "Secondary Hulls" tab in StepEditor (alongside Hull/Decks/Rooms)
- Pros: Full width for editing, consistent with tab structure
- Cons: Separate from selection flow, requires switching tabs

**Recommendation**: Option A (Properties Panel) - more integrated

### Decision 2: How Much Undo/Redo Support?

**Option A (Proposed)**: Store selection changes but not implemented (Phase 5.0)
- Selection changes don't create undo points (intentional, too noisy)
- Hull position/scale changes do create undo points (if undo system implemented)

**Option B Alternative**: Full undo for everything including selection
- More complex state tracking

**Recommendation**: Option A - simpler for MVP

### Decision 3: Search/Filter in Hierarchy

**Option A (Proposed)**: Simple text search filtering hierarchy
- Type "room1" → shows only Room1 and its parents
- Useful for finding objects in large ships

**Option B Alternative**: Add filters (by type, by deck, etc.)
- More powerful but more complex

**Recommendation**: Option A initially, can add advanced filters later

---

## 14. Success Criteria

Phase 5.0a will be considered **complete** when:

1. ✅ HierarchyPanel displays full ship structure (primary/secondary hulls, decks, rooms)
2. ✅ Clicking items in hierarchy selects them (single & multi-select work)
3. ✅ Selection updates 3D highlighting (yellow glow, group highlights, etc.)
4. ✅ Clicking 3D objects updates hierarchy focus
5. ✅ SecondaryHullEditor allows editing position/rotation/scale
6. ✅ Can add/delete secondary hulls (add button in editor or button somewhere)
7. ✅ Selection persists across tab switches
8. ✅ Search/filter functionality works
9. ✅ 20+ tests passing for hierarchy, selection, and secondary hull CRUD
10. ✅ No TypeScript errors
11. ✅ Visual polish complete (colors, spacing, alignment)

---

## 15. Risk & Mitigation

### Risk: Large Refactor to Selection System

**Mitigation**:
- Keep backward compatibility with existing `selectItem()` calls
- Add new methods, don't break old ones
- Comprehensive test coverage before integration

### Risk: Visual Glitches with Multi-Selection Highlighting

**Mitigation**:
- Start with simple outline colors (no complex shaders initially)
- Test in Preview3D with various camera angles
- Add regression tests for rendering

### Risk: Performance Degradation

**Mitigation**:
- Profile store updates and hierarchy rendering
- Use memoized selectors for tree building
- Monitor re-render frequency during selection changes

---

## Appendix: Component Size Estimates

| Component | Lines | Notes |
|-----------|-------|-------|
| HierarchyPanel.vue | ~550 | Tree container + search |
| HierarchyNode.vue | ~350 | Recursive node component |
| SecondaryHullEditor.vue | ~450 | Form with sliders |
| hierarchyUtils.ts | ~150 | Tree building, filtering |
| useHierarchySelection.ts | ~200 | Optional composable |
| shipStore.ts (additions) | ~250 | Selection methods + CRUD |
| ShipDesignerApp.vue (changes) | ~100-150 | Layout restructuring |
| Preview3D.vue (changes) | ~50-100 | Highlighting logic |
| Tests | ~400 | Comprehensive coverage |
| **TOTAL** | **~2500** | |

**Estimated lines of code for Phase 5.0a: 2200-2500 lines**

---

## Next Steps

1. **User Review & Approval** - Please review this plan and provide feedback
2. **Adjust Based on Feedback** - Modify architecture/components as needed
3. **Begin Phase A (Foundation)** - Once approved, start with type definitions and store updates
4. **Iterative Implementation** - Follow sequence A→B→C→D with git commits after each phase

---

**Plan Created**: February 15, 2026  
**Status**: Awaiting Review
