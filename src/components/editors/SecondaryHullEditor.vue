<template>
  <div class="secondary-hull-editor">
    <div v-if="selectedHull" class="editor-content">
      <!-- Header -->
      <div class="editor-header">
        <h3>Secondary Hull Editor</h3>
        <p class="hull-name">{{ selectedHull.name || 'Unnamed Hull' }}</p>
      </div>

      <!-- Basic Properties -->
      <div class="property-group">
        <label class="property-label">Name</label>
        <input
          v-model="editedHull.name"
          class="property-input"
          type="text"
          placeholder="Hull name (e.g., 'Engine Pod Left')"
          @change="updateHull"
        />
      </div>

      <!-- Position Controls -->
      <div class="property-group">
        <label class="property-label">Position (meters)</label>
        <div class="property-row">
          <div class="property-item">
            <label>X:</label>
            <input
              v-model.number="editedPosition.x"
              type="number"
              step="0.1"
              class="property-number"
              @change="updateHull"
            />
            <input
              v-model.number="editedPosition.x"
              type="range"
              min="-100"
              max="100"
              step="0.1"
              class="property-slider"
              @change="updateHull"
            />
          </div>
          <div class="property-item">
            <label>Y:</label>
            <input
              v-model.number="editedPosition.y"
              type="number"
              step="0.1"
              class="property-number"
              @change="updateHull"
            />
            <input
              v-model.number="editedPosition.y"
              type="range"
              min="-100"
              max="100"
              step="0.1"
              class="property-slider"
              @change="updateHull"
            />
          </div>
          <div class="property-item">
            <label>Z:</label>
            <input
              v-model.number="editedPosition.z"
              type="number"
              step="0.1"
              class="property-number"
              @change="updateHull"
            />
            <input
              v-model.number="editedPosition.z"
              type="range"
              min="-100"
              max="100"
              step="0.1"
              class="property-slider"
              @change="updateHull"
            />
          </div>
        </div>
      </div>

      <!-- Rotation Controls -->
      <div class="property-group">
        <label class="property-label">Rotation (degrees)</label>
        <div class="property-row">
          <div class="property-item">
            <label>Pitch (X):</label>
            <input
              v-model.number="editedRotation.x"
              type="number"
              step="1"
              class="property-number"
              @change="updateHull"
            />
            <input
              v-model.number="editedRotation.x"
              type="range"
              min="-360"
              max="360"
              step="1"
              class="property-slider"
              @change="updateHull"
            />
          </div>
          <div class="property-item">
            <label>Yaw (Y):</label>
            <input
              v-model.number="editedRotation.y"
              type="number"
              step="1"
              class="property-number"
              @change="updateHull"
            />
            <input
              v-model.number="editedRotation.y"
              type="range"
              min="-360"
              max="360"
              step="1"
              class="property-slider"
              @change="updateHull"
            />
          </div>
          <div class="property-item">
            <label>Roll (Z):</label>
            <input
              v-model.number="editedRotation.z"
              type="number"
              step="1"
              class="property-number"
              @change="updateHull"
            />
            <input
              v-model.number="editedRotation.z"
              type="range"
              min="-360"
              max="360"
              step="1"
              class="property-slider"
              @change="updateHull"
            />
          </div>
        </div>
      </div>

      <!-- Scale Control -->
      <div class="property-group">
        <label class="property-label">Scale</label>
        <div class="property-row">
          <input
            v-model.number="editedScale"
            type="number"
            step="0.1"
            min="0.1"
            max="2.0"
            class="property-number"
            @change="updateHull"
          />
          <input
            v-model.number="editedScale"
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            class="property-slider"
            @change="updateHull"
          />
          <span class="scale-value">{{ editedScale.toFixed(2) }}x</span>
        </div>
      </div>

      <!-- Profile Mode -->
      <div class="property-group">
        <label class="property-label">Profile Mode</label>
        <div class="profile-mode-buttons">
          <button
            class="mode-button"
            :class="{ active: profileMode === 'primary' }"
            @click="setProfileMode('primary')"
          >
            Use Primary Profile
          </button>
          <button
            class="mode-button"
            :class="{ active: profileMode === 'custom' }"
            @click="setProfileMode('custom')"
          >
            Custom Profile
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-group">
        <button class="action-button duplicate" @click="handleDuplicate" title="Duplicate this hull">
          📋 Duplicate
        </button>
        <button class="action-button mirror" @click="handleMirror" title="Mirror across YZ plane">
          🔄 Mirror
        </button>
        <button class="action-button reset" @click="handleReset" title="Reset to default position">
          ↺ Reset
        </button>
        <button class="action-button delete" @click="handleDelete" title="Delete this hull">
          🗑️ Delete
        </button>
      </div>

      <!-- Visibility Toggle -->
      <div class="visibility-section">
        <label>
          <input
            v-model="visibility"
            type="checkbox"
            @change="updateHull"
          />
          Visible in 3D Preview
        </label>
      </div>
    </div>
    <div v-else class="editor-empty">
      <div class="empty-content">
        <p>No secondary hulls created yet</p>
        <button class="add-button" @click="handleAddSecondaryHull">
          ➕ Add Secondary Hull
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useShipStore } from '@stores/shipStore';
import type { HullSpec } from '@core/index';

const store = useShipStore();

// Selection derived from store
const selectedHull = computed(() => {
  if (store.selection.itemType === 'hull' && store.selection.itemIds.length > 0) {
    const hullId = store.selection.itemIds[0];
    // Check if it's a secondary hull
    return store.ship.secondaryHulls?.find((h) => h.name === hullId);
  }
  return null;
});

// Local editing state
const editedHull = ref<Partial<HullSpec>>({});
const editedPosition = ref({ x: 0, y: 0, z: 0 });
const editedRotation = ref({ x: 0, y: 0, z: 0 });
const editedScale = ref(1.0);
const visibility = ref(true);
const profileMode = ref<'primary' | 'custom'>('primary');

// Watch for hull selection changes and populate edit state
watch(selectedHull, (newHull) => {
  if (newHull) {
    editedHull.value = { ...newHull };
    editedPosition.value = {
      x: newHull.worldTransform?.position?.x ?? 0,
      y: newHull.worldTransform?.position?.y ?? 0,
      z: newHull.worldTransform?.position?.z ?? 0,
    };
    editedRotation.value = {
      x: newHull.worldTransform?.rotation?.x ?? 0,
      y: newHull.worldTransform?.rotation?.y ?? 0,
      z: newHull.worldTransform?.rotation?.z ?? 0,
    };
    editedScale.value = newHull.worldTransform?.scale ?? 1.0;
    // TODO: Derive visibility from store when visibility tracking is added
    visibility.value = true;
    // TODO: Detect profile mode from hull properties
    profileMode.value = 'primary';
  }
}, { deep: true });

function updateHull() {
  if (!selectedHull.value?.name) return;
  
  const updates: Partial<HullSpec> = {
    name: editedHull.value.name,
    worldTransform: {
      position: editedPosition.value,
      rotation: editedRotation.value,
      scale: editedScale.value,
    },
  };
  
  store.updateSecondaryHull(selectedHull.value.name, updates);
}

function setProfileMode(mode: 'primary' | 'custom') {
  profileMode.value = mode;
  // TODO: Store profile mode preference
}

function handleAddSecondaryHull() {
  // Create a new secondary hull based on the primary hull
  const primaryHull = store.ship.hull;
  
  // Generate a unique name
  const existingCount = store.ship.secondaryHulls?.length ?? 0;
  const newName = `Secondary Hull ${existingCount + 1}`;
  
  const newHull: HullSpec = {
    ...primaryHull,
    name: newName,
    worldTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1.0,
    },
  };
  
  store.addSecondaryHull(newHull);
}

function handleDuplicate() {
  if (!selectedHull.value?.name) return;
  
  // Create a copy with offset position
  const newHull: HullSpec = {
    ...selectedHull.value,
    name: `${selectedHull.value.name} (Copy)`,
    worldTransform: {
      position: {
        x: (editedPosition.value.x ?? 0) + 5, // Offset by 5m
        y: editedPosition.value.y ?? 0,
        z: editedPosition.value.z ?? 0,
      },
      rotation: editedRotation.value,
      scale: editedScale.value,
    },
  };
  
  store.addSecondaryHull(newHull);
}

function handleMirror() {
  if (!selectedHull.value?.name) return;
  
  // Mirror across YZ plane (negate X position and Y rotation)
  const newHull: HullSpec = {
    ...selectedHull.value,
    name: `${selectedHull.value.name} (Mirrored)`,
    worldTransform: {
      position: {
        x: -(editedPosition.value.x ?? 0), // Mirror X
        y: editedPosition.value.y ?? 0,
        z: editedPosition.value.z ?? 0,
      },
      rotation: {
        x: editedRotation.value.x ?? 0,
        y: -(editedRotation.value.y ?? 0), // Mirror yaw
        z: -(editedRotation.value.z ?? 0), // Mirror roll
      },
      scale: editedScale.value,
    },
  };
  
  store.addSecondaryHull(newHull);
}

function handleReset() {
  editedPosition.value = { x: 0, y: 0, z: 0 };
  editedRotation.value = { x: 0, y: 0, z: 0 };
  editedScale.value = 1.0;
  updateHull();
}

function handleDelete() {
  if (!selectedHull.value?.name) return;
  
  if (confirm(`Delete secondary hull "${selectedHull.value.name}"?`)) {
    store.deleteSecondaryHull(selectedHull.value.name);
    store.clearSelection();
  }
}
</script>

<style scoped>
.secondary-hull-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.editor-header {
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 1rem;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
}

.hull-name {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.editor-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-content > p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.add-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.add-button:hover {
  background-color: #2563eb;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.add-button:active {
  transform: translateY(0);
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.property-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-input {
  padding: 0.5rem;
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9rem;
}

.property-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.property-row {
  display: flex;
  gap: 1rem;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.property-item > label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.property-number {
  padding: 0.4rem;
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.85rem;
  width: 70px;
}

.property-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-background);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.property-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.property-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.scale-value {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  min-width: 45px;
}

.profile-mode-buttons {
  display: flex;
  gap: 0.5rem;
}

.mode-button {
  flex: 1;
  padding: 0.5rem;
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mode-button:hover {
  border-color: var(--color-primary);
}

.mode-button.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--color-background-secondary);
  border-radius: 6px;
}

.action-button {
  padding: 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: var(--color-background-tertiary);
  border-color: var(--color-primary);
}

.action-button.delete:hover {
  background-color: rgba(255, 0, 0, 0.2);
  border-color: #ff0000;
  color: #ff6b6b;
}

.visibility-section {
  padding: 0.75rem;
  background-color: var(--color-background-secondary);
  border-radius: 4px;
}

.visibility-section label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text);
}

.visibility-section input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
</style>
