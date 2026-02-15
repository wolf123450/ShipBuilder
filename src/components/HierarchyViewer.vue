<template>
  <div class="hierarchy-viewer">
    <!-- Header with search and expand/collapse controls -->
    <div class="hierarchy-header">
      <div class="search-bar">
        <input
          v-model="searchFilter"
          type="text"
          placeholder="Search hierarchy..."
          class="search-input"
        />
      </div>
      <div class="header-controls">
        <button @click="handleExpandAll" title="Expand all" class="icon-button">
          <span>⊕</span>
        </button>
        <button @click="handleCollapseAll" title="Collapse all" class="icon-button">
          <span>⊖</span>
        </button>
      </div>
    </div>

    <!-- Hierarchy tree -->
    <div class="hierarchy-tree" @click="handleEmptySpaceClick">
      <!-- Primary Hull -->
      <div v-if="matchesFilter('primary-hull')" class="hierarchy-section">
        <div
          class="hierarchy-node node-hull"
          :class="{ selected: store.isSelected('hull', 'primary') }"
          @click="handleNodeClick('hull', 'primary', $event)"
          @contextmenu="handleContextMenu($event, 'hull', 'primary')"
        >
          <button
            class="expand-btn"
            @click.stop="toggleNode('primary-hull')"
          >
            <span v-if="expandedNodes['primary-hull']">▼</span>
            <span v-else>▶</span>
          </button>
          <span class="icon">🛖</span>
          <span class="label">Primary Hull</span>
          <span class="count">({{ primaryHullMesh }})</span>
          <button
            class="visibility-btn"
            @click.stop="store.toggleHullVisibility()"
            :title="store.visibility.hull ? 'Hide hull' : 'Show hull'"
          >
            {{ store.visibility.hull ? '👁️' : '🔓' }}
          </button>
        </div>
      </div>

      <!-- Secondary Hulls -->
      <div v-if="hasSecondaryHulls && matchesFilter('secondary-hulls')" class="hierarchy-section">
        <div
          class="hierarchy-node node-group"
          @click="handleGroupClick('hull')"
          :class="{ selected: store.selection.itemType === 'all-hulls' }"
        >
          <button
            class="expand-btn"
            @click.stop="toggleNode('secondary-hulls')"
          >
            <span v-if="expandedNodes['secondary-hulls']">▼</span>
            <span v-else>▶</span>
          </button>
          <span class="icon">🛢️</span>
          <span class="label">Secondary Hulls</span>
          <span class="count">({{ secondaryHullCount }})</span>
        </div>
        <div v-if="expandedNodes['secondary-hulls']" class="hierarchy-children">
          <div
            v-for="hull in ship.secondaryHulls"
            :key="hull.name || 'unnamed'"
            v-show="matchesFilter(hull.name || 'unnamed')"
            class="hierarchy-node node-hull"
            :class="{ selected: store.isSelected('hull', hull.name || 'unnamed') }"
            @click="handleNodeClick('hull', hull.name || 'unnamed', $event)"
            @contextmenu="handleContextMenu($event, 'hull', hull.name || 'unnamed')"
          >
            <span class="indent"></span>
            <span class="icon">⚙️</span>
            <span class="label">{{ hull.name || 'Unnamed Hull' }}</span>
          </div>
        </div>
      </div>

      <!-- Decks -->
      <div v-if="matchesFilter('decks')" class="hierarchy-section">
        <div class="hierarchy-node node-group" @click="handleGroupClick('deck')" :class="{ selected: store.selection.itemType === 'all-decks' }">
          <button
            class="expand-btn"
            @click.stop="toggleNode('decks')"
          >
            <span v-if="expandedNodes['decks']">▼</span>
            <span v-else>▶</span>
          </button>
          <span class="icon">📋</span>
          <span class="label">Decks</span>
          <span class="count">({{ deckCount }})</span>
          <button
            class="visibility-btn"
            @click.stop="store.toggleDecksVisibility()"
            :title="store.visibility.decks ? 'Hide decks' : 'Show decks'"
          >
            {{ store.visibility.decks ? '👁️' : '🔓' }}
          </button>
        </div>
        <div v-if="expandedNodes['decks']" class="hierarchy-children">
          <div
            v-for="deckIndex in deckIndices"
            :key="deckIndex"
            v-show="matchesFilter(`Deck ${deckIndex}`)"
            class="hierarchy-node node-deck"
            :class="{ selected: store.isSelected('deck', String(deckIndex)) }"
            @click="handleNodeClick('deck', String(deckIndex), $event)"
            @contextmenu="handleContextMenu($event, 'deck', String(deckIndex))"
          >
            <span class="indent"></span>
            <span class="icon">📑</span>
            <span class="label">{{ getDeckLabel(deckIndex) }}</span>
            <span class="count">({{ getRoomsOnDeck(deckIndex).length }} rooms)</span>
            <button
              class="visibility-btn"
              @click.stop="store.toggleDeckVisibility(deckIndex)"
              :title="store.isDeckVisible(deckIndex) ? 'Hide deck' : 'Show deck'"
            >
              {{ store.isDeckVisible(deckIndex) ? '👁️' : '🔓' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rooms -->
      <div v-if="matchesFilter('rooms') && hasRooms" class="hierarchy-section">
        <div class="hierarchy-node node-group" @click="handleGroupClick('room')" :class="{ selected: store.selection.itemType === 'all-rooms' }">
          <button
            class="expand-btn"
            @click.stop="toggleNode('rooms')"
          >
            <span v-if="expandedNodes['rooms']">▼</span>
            <span v-else>▶</span>
          </button>
          <span class="icon">🚪</span>
          <span class="label">Rooms</span>
          <span class="count">({{ ship.rooms.length }})</span>
          <button
            class="visibility-btn"
            @click.stop="store.toggleRoomsVisibility()"
            :title="store.visibility.rooms ? 'Hide rooms' : 'Show rooms'"
          >
            {{ store.visibility.rooms ? '👁️' : '🔓' }}
          </button>
        </div>
        <div v-if="expandedNodes['rooms']" class="hierarchy-children">
          <div
            v-for="room in ship.rooms"
            :key="room.id"
            v-show="matchesFilter(room.id)"
            class="hierarchy-node node-room"
            :class="{ selected: store.isSelected('room', room.id) }"
            @click="handleNodeClick('room', room.id, $event)"
            @contextmenu="handleContextMenu($event, 'room', room.id)"
          >
            <span class="indent"></span>
            <span class="icon">{{ getRoomIcon(room.type) }}</span>
            <span class="label">{{ room.id }}</span>
            <span class="room-type">[{{ room.type }}]</span>
            <button
              class="visibility-btn"
              @click.stop="store.toggleRoomVisibility(room.id)"
              :title="store.isRoomVisible(room.id) ? 'Hide room' : 'Show room'"
            >
              {{ store.isRoomVisible(room.id) ? '👁️' : '🔓' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }"
    >
      <div class="context-menu-items">
        <button
          v-if="contextMenu.itemType !== 'room'"
          @click="handleSelectAll"
          class="context-menu-item"
        >
          Select All
        </button>
        <button
          v-if="contextMenu.itemType === 'hull' && contextMenu.itemId !== 'primary'"
          @click="handleDuplicate"
          class="context-menu-item"
        >
          Duplicate
        </button>
        <button
          v-if="contextMenu.itemType === 'hull' && contextMenu.itemId !== 'primary'"
          @click="handleDelete"
          class="context-menu-item danger"
        >
          Delete
        </button>
        <button
          @click="handleClearSelection"
          class="context-menu-item"
        >
          Clear Selection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useShipStore } from '@stores/shipStore';
import { RoomType } from '@core/index';

const store = useShipStore();

// UI State
const expandedNodes = computed(() => store.hierarchyUI.expandedNodes);
const searchFilter = ref(store.hierarchyUI.searchFilter);

// Sync search filter between local and store
watch(
  () => store.hierarchyUI.searchFilter,
  (newVal) => {
    searchFilter.value = newVal;
  }
);

watch(
  () => searchFilter.value,
  (newVal) => {
    store.setHierarchyFilter(newVal);
  }
);

// Hierarchy computed properties
const ship = computed(() => store.ship);
const hasSecondaryHulls = computed(() => !!(ship.value.secondaryHulls && ship.value.secondaryHulls.length > 0));
const secondaryHullCount = computed(() => ship.value.secondaryHulls?.length ?? 0);
const hasRooms = computed(() => ship.value.rooms.length > 0);

// Calculate deck count and indices
const deckCount = computed(() => {
  const { startY, endY, deckHeight } = ship.value.decks;
  return Math.ceil((endY - startY) / deckHeight);
});

const deckIndices = computed(() => {
  const indices: number[] = [];
  for (let i = 0; i < deckCount.value; i++) {
    indices.push(i);
  }
  return indices;
});

// Mesh counts (simplified - could be enhanced with actual geometry)
const primaryHullMesh = computed(() => 'triangles');

// Context menu state
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  itemType: null as string | null,
  itemId: null as string | null,
});

// Helper methods
function toggleNode(nodePath: string) {
  store.toggleExpandedNode(nodePath);
}

function matchesFilter(label: string): boolean {
  if (!searchFilter.value) return true;
  return label.toLowerCase().includes(searchFilter.value.toLowerCase());
}

function getRoomsOnDeck(deckIndex: number) {
  return ship.value.rooms.filter((r) => r.deck === deckIndex);
}

function getDeckLabel(deckIndex: number): string {
  const { naming } = ship.value.decks;
  // TODO: Implement different naming schemes
  return `Deck ${deckIndex}`;
}

function getRoomIcon(roomType: RoomType): string {
  const icons: Record<RoomType, string> = {
    [RoomType.Command]: '⚔️',
    [RoomType.Corridor]: '🚶',
    [RoomType.Crew]: '👥',
    [RoomType.Cargo]: '📦',
    [RoomType.Engineering]: '⚙️',
  };
  return icons[roomType] || '🚪';
}

// Selection handlers
function handleNodeClick(
  itemType: 'hull' | 'deck' | 'room',
  itemId: string,
  event: MouseEvent
) {
  const multiSelect = event.ctrlKey || event.metaKey;
  
  // Check if already selected - if so, deselect
  if (!multiSelect && store.isSelected(itemType, itemId)) {
    store.clearSelection();
    return;
  }
  
  if (multiSelect && event.shiftKey) {
    // Range select (not implemented yet)
    return;
  }
  if (multiSelect) {
    store.toggleSelection(itemType, itemId);
  } else {
    store.selectItem(itemType, itemId);
  }
}

function handleGroupClick(itemType: 'hull' | 'deck' | 'room') {
  store.selectAllOfType(itemType);
}

function handleEmptySpaceClick(event: MouseEvent) {
  // Only deselect if clicking directly on the tree background, not on child elements
  if (event.target === event.currentTarget) {
    store.clearSelection();
  }
}

// Context menu handlers
function handleContextMenu(
  event: MouseEvent,
  itemType: string | null,
  itemId: string | null
) {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    itemType,
    itemId,
  };
}

function handleSelectAll() {
  if (contextMenu.value.itemType === 'hull') {
    store.selectAllOfType('hull');
  } else if (contextMenu.value.itemType === 'deck') {
    store.selectAllOfType('deck');
  } else if (contextMenu.value.itemType === 'room') {
    store.selectAllOfType('room');
  }
  contextMenu.value.visible = false;
}

function handleDuplicate() {
  if (
    contextMenu.value.itemType === 'hull' &&
    contextMenu.value.itemId &&
    contextMenu.value.itemId !== 'primary'
  ) {
    store.duplicateSecondaryHull(contextMenu.value.itemId);
  }
  contextMenu.value.visible = false;
}

function handleDelete() {
  if (
    contextMenu.value.itemType === 'hull' &&
    contextMenu.value.itemId &&
    contextMenu.value.itemId !== 'primary'
  ) {
    if (confirm(`Delete hull "${contextMenu.value.itemId}"?`)) {
      store.deleteSecondaryHull(contextMenu.value.itemId);
    }
  }
  contextMenu.value.visible = false;
}

function handleClearSelection() {
  store.clearSelection();
  contextMenu.value.visible = false;
}

function handleExpandAll() {
  store.expandAllNodes();
}

function handleCollapseAll() {
  store.collapseAllNodes();
}

// Close context menu when clicking elsewhere
document.addEventListener('click', () => {
  contextMenu.value.visible = false;
});
</script>

<style scoped>
.hierarchy-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
}

.hierarchy-header {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 150px;
}

.search-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
}

.search-input::placeholder {
  color: var(--color-text-secondary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.header-controls {
  display: flex;
  gap: 0.25rem;
}

.icon-button {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-hover);
}

.icon-button:active {
  transform: scale(0.95);
}

.hierarchy-tree {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.hierarchy-section {
  border-bottom: 1px solid var(--color-border-subtle);
}

.hierarchy-section:last-child {
  border-bottom: none;
}

.hierarchy-node {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.hierarchy-node:hover {
  background-color: var(--color-background-hover);
}

.hierarchy-node.selected {
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
}

.node-hull {
  font-weight: 500;
  padding-left: 0.5rem;
}

.node-group {
  font-weight: 600;
  background-color: var(--color-background-tertiary);
}

.node-deck {
  padding-left: 2.5rem;
}

.node-room {
  padding-left: 2.5rem;
  font-size: 0.85rem;
}

.expand-btn {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: color 0.2s ease;
  margin-left: -0.25rem;
  margin-right: -0.25rem;
}

.expand-btn:hover {
  color: var(--color-text);
}

.indent {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-block;
}

.icon {
  font-size: 1rem;
  width: 1.2rem;
  text-align: center;
}

.label {
  flex: 1;
  word-break: break-word;
}

.count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-left: auto;
  padding-left: 0.5rem;
}

.room-type {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-left: 0.25rem;
}

.hierarchy-children {
  border-left: 2px solid var(--color-border-subtle);
  margin-left: 0.75rem;
}

.visibility-btn {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  margin-left: auto;
}

.visibility-btn:hover {
  color: var(--color-text);
  transform: scale(1.1);
}

/* Context Menu */
.context-menu {
  position: fixed;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 140px;
}

.context-menu-items {
  display: flex;
  flex-direction: column;
}

.context-menu-item {
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  font-size: 0.85rem;
  transition: background-color 0.15s ease;
}

.context-menu-item:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.context-menu-item:first-child {
  border-radius: 4px 4px 0 0;
}

.context-menu-item:last-child {
  border-radius: 0 0 4px 4px;
}

.context-menu-item.danger {
  color: var(--color-danger);
}

.context-menu-item.danger:hover {
  background-color: rgba(var(--color-danger-rgb), 0.1);
  color: var(--color-danger-dark);
}
</style>
