<template>
  <div class="hull-instance-editor">
    <!-- Hull selector list -->
    <div class="hull-selector">
      <div class="hull-selector-header">
        <h3>Hulls</h3>
        <button class="btn-add-hull" @click="handleAddHull" title="Add a new secondary hull">
          ➕ Add Hull
        </button>
      </div>
      <div class="hull-list">
        <div
          v-for="hull in allHulls"
          :key="hull.id"
          :class="['hull-item', { active: selectedHull?.id === hull.id }]"
          @click="selectHullFromList(hull)"
        >
          <span class="hull-icon">{{ hull.isPrimary ? '⚓' : '🛰️' }}</span>
          <span class="hull-name">{{ hull.name }}</span>
          <span class="hull-type">({{ hull.isPrimary ? 'Primary' : 'Secondary' }})</span>
          <input
            :checked="hull.enabled"
            type="checkbox"
            class="hull-enabled"
            @click.stop="toggleHullEnabled(hull)"
            :title="`${hull.enabled ? 'Disable' : 'Enable'} this hull`"
          />
        </div>
      </div>
    </div>

    <!-- Empty state when no hull is selected -->
    <div v-if="!editingHull" class="editor-empty">
      <p>Select a hull to edit its properties</p>
    </div>

    <!-- Hull editor form -->
    <div v-else class="editor-form">
      <!-- Hull metadata section (collapsible) -->
      <div class="collapsible-section">
        <h3 class="section-header" @click="toggleSection('metadata')">
          <span :class="['toggle-icon', { open: openSections.metadata }]">▶</span>
          Hull Properties
        </h3>
        
        <div v-if="openSections.metadata" class="section-content">
          <div class="form-group">
            <label>Name</label>
            <input
              v-model="editingHull.name"
              type="text"
              placeholder="Hull name"
              @blur="saveChanges"
            />
          </div>

          <div class="form-group">
            <label>Type</label>
            <span class="read-only">{{ selectedHull!.isPrimary ? "Primary (Structural)" : "Secondary (Attached)" }}</span>
          </div>

          <div class="form-group">
            <label>Enabled</label>
            <input
              v-model="editingHull.enabled"
              type="checkbox"
              @change="saveChanges"
            />
          </div>
        </div>
      </div>

      <!-- Hull Spec section (collapsible) -->
      <div class="collapsible-section">
        <h3 class="section-header" @click="toggleSection('spec')">
          <span :class="['toggle-icon', { open: openSections.spec }]">▶</span>
          Hull Profile
        </h3>
        
        <div v-if="openSections.spec" class="section-content">
          <p class="section-help">Configure the hull's shape and geometry</p>

          <div class="form-group">
            <label>Length ({{ editingHull.hullSpec.length.toFixed(1) }}m)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull.hullSpec.length"
                type="range"
                min="10"
                max="500"
                step="1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull.hullSpec.length"
                :step="1"
                :min="10"
                :max="500"
                @update:modelValue="(v) => { if (editingHull) { editingHull.hullSpec.length = v; saveChanges(); } }"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Max Beam/Width ({{ editingHull.hullSpec.maxBeam.toFixed(1) }}m)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull.hullSpec.maxBeam"
                type="range"
                min="2"
                max="100"
                step="0.5"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull.hullSpec.maxBeam"
                :step="0.5"
                :min="2"
                :max="100"
                @update:modelValue="(v) => { if (editingHull) { editingHull.hullSpec.maxBeam = v; saveChanges(); } }"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Max Height ({{ editingHull.hullSpec.maxHeight.toFixed(1) }}m)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull.hullSpec.maxHeight"
                type="range"
                min="1"
                max="50"
                step="0.5"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull.hullSpec.maxHeight"
                :step="0.5"
                :min="1"
                :max="50"
                @update:modelValue="(v) => { if (editingHull) { editingHull.hullSpec.maxHeight = v; saveChanges(); } }"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Top Bias ({{ (editingHull.hullSpec.topBias ?? 1.0).toFixed(2) }}x)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull.hullSpec.topBias"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull.hullSpec.topBias ?? 1.0"
                :step="0.1"
                :min="0.5"
                :max="2"
                @update:modelValue="(v) => { if (editingHull) { editingHull.hullSpec.topBias = v; saveChanges(); } }"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Interior Decks</label>
            <div class="checkbox-row">
              <input
                v-model="editingHull.hullSpec.hasInteriorDecks"
                type="checkbox"
                @change="saveChanges"
              />
              <span class="checkbox-label">Generate decks inside this hull</span>
            </div>
          </div>
        </div>
      </div>

      <!-- World Transform section (collapsible) -->
      <div class="collapsible-section">
        <h3 class="section-header" @click="toggleSection('transform')">
          <span :class="['toggle-icon', { open: openSections.transform }]">▶</span>
          Position & Orientation
        </h3>

        <div v-if="openSections.transform" class="section-content">
          <!-- Position X -->
          <div class="form-group">
            <label>Position X ({{ (editingHull!.worldTransform?.position?.x ?? 0).toFixed(1) }}m)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.position!.x"
                type="range"
                min="-100"
                max="100"
                step="0.1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.position!.x ?? 0"
                :step="0.1"
                @update:modelValue="(v) => { if (editingHull?.worldTransform?.position) { editingHull.worldTransform.position.x = v; saveChanges(); } }"
              />
            </div>
          </div>

          <!-- Position Y -->
          <div class="form-group">
            <label>Position Y ({{ (editingHull!.worldTransform?.position?.y ?? 0).toFixed(1) }}m)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.position!.y"
                type="range"
                min="-50"
                max="50"
                step="0.1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.position!.y ?? 0"
                :step="0.1"
                @update:modelValue="(v) => { if (editingHull?.worldTransform?.position) { editingHull.worldTransform.position.y = v; saveChanges(); } }"
              />
            </div>
          </div>

          <!-- Position Z -->
          <div class="form-group">
            <label>Position Z ({{ (editingHull!.worldTransform?.position?.z ?? 0).toFixed(1) }}m)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.position!.z"
                type="range"
                min="-100"
                max="100"
                step="0.1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.position!.z ?? 0"
                :step="0.1"
                @update:modelValue="(v) => { if (editingHull?.worldTransform?.position) { editingHull.worldTransform.position.z = v; saveChanges(); } }"
              />
            </div>
          </div>

          <!-- Rotation X -->
          <div class="form-group">
            <label>Rotation X ({{ (editingHull!.worldTransform?.rotation?.x ?? 0).toFixed(1) }}°)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.rotation!.x"
                type="range"
                min="-180"
                max="180"
                step="1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.rotation!.x ?? 0"
                :step="1"
                :min="-180"
                :max="180"
                @update:modelValue="(v) => { if (editingHull?.worldTransform?.rotation) { editingHull.worldTransform.rotation.x = v; saveChanges(); } }"
              />
            </div>
          </div>

          <!-- Rotation Y -->
          <div class="form-group">
            <label>Rotation Y ({{ (editingHull!.worldTransform?.rotation?.y ?? 0).toFixed(1) }}°)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.rotation!.y"
                type="range"
                min="-180"
                max="180"
                step="1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.rotation!.y ?? 0"
                :step="1"
                :min="-180"
                :max="180"
                @update:modelValue="(v) => { if (editingHull?.worldTransform?.rotation) { editingHull.worldTransform.rotation.y = v; saveChanges(); } }"
              />
            </div>
          </div>

          <!-- Rotation Z -->
          <div class="form-group">
            <label>Rotation Z ({{ (editingHull!.worldTransform?.rotation?.z ?? 0).toFixed(1) }}°)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.rotation!.z"
                type="range"
                min="-180"
                max="180"
                step="1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.rotation!.z ?? 0"
                :step="1"
                :min="-180"
                :max="180"
                @update:modelValue="(v) => { if (editingHull?.worldTransform?.rotation) { editingHull.worldTransform.rotation.z = v; saveChanges(); } }"
              />
            </div>
          </div>

          <!-- Scale -->
          <div class="form-group">
            <label>Scale ({{ (editingHull!.worldTransform?.scale ?? 1.0).toFixed(2) }}x)</label>
            <div class="slider-input-group">
              <input
                v-model.number="editingHull!.worldTransform!.scale"
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                @input="saveChanges"
                class="slider"
              />
              <NumberInput
                :modelValue="editingHull!.worldTransform!.scale ?? 1.0"
                :step="0.1"
                :min="0.1"
                :max="10"
                @update:modelValue="(v) => { if (editingHull?.worldTransform) { editingHull.worldTransform.scale = v; saveChanges(); } }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Boolean Operations section (collapsible, Phase 5.0c - UI only) -->
      <div class="collapsible-section">
        <h3 class="section-header" @click="toggleSection('booleanOp')">
          <span :class="['toggle-icon', { open: openSections.booleanOp }]">▶</span>
          Boolean Operation
        </h3>
        
        <div v-if="openSections.booleanOp" class="section-content">
          <p class="section-help">How this hull combines with others (Phase 5.0d)</p>
          
          <div class="button-group boolean-ops">
            <button
              :class="{ active: editingHull.booleanOp === BooleanOperation.Union }"
              @click="updateBooleanOp(BooleanOperation.Union)"
              title="Add this hull to the model"
            >
              🟢 Union
            </button>
            <button
              :class="{ active: editingHull.booleanOp === BooleanOperation.Difference }"
              @click="updateBooleanOp(BooleanOperation.Difference)"
              title="Subtract this hull from the model"
            >
              🔴 Difference
            </button>
            <button
              :class="{ active: editingHull.booleanOp === BooleanOperation.Intersection }"
              @click="updateBooleanOp(BooleanOperation.Intersection)"
              title="Keep only the overlap"
            >
              🟡 Intersection
            </button>
          </div>
        </div>
      </div>

      <!-- Action buttons section (collapsible) -->
      <div class="collapsible-section">
        <h3 class="section-header" @click="toggleSection('actions')">
          <span :class="['toggle-icon', { open: openSections.actions }]">▶</span>
          Actions
        </h3>
        
        <div v-if="openSections.actions" class="section-content">
          <div class="button-group">
            <button class="btn-secondary" @click="handleDuplicate" v-if="!selectedHull!.isPrimary">
              📋 Duplicate
            </button>
            <button class="btn-secondary" @click="handleMirror" v-if="!selectedHull!.isPrimary">
              🔄 Mirror (XZ)
            </button>
            <button class="btn-secondary" @click="handleReset">
              ↺ Reset Transform
            </button>
            <button class="btn-danger" @click="handleDelete" v-if="!selectedHull!.isPrimary">
              ✕ Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <ConfirmDialog
      v-if="showDeleteConfirm && selectedHull"
      title="Delete Hull"
      :message="deleteMessage"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useShipStore } from "@stores/shipStore";
import type { HullInstance } from "@core/index";
import { BooleanOperation } from "@core/index";
import ConfirmDialog from "@components/ConfirmDialog.vue";
import NumberInput from "@components/NumberInput.vue";

// Type alias for enum values
type BooleanOpType = BooleanOperation;

const store = useShipStore();
const showDeleteConfirm = ref(false);

// Editing state - local copy to avoid reactivity issues during editing
const editingHull = ref<HullInstance | null>(null);

// Collapsible section states
const openSections = ref({
  metadata: true,
  spec: true,
  transform: false,
  booleanOp: false,
  actions: false,
});

// Computed property for all available hulls
const allHulls = computed(() => {
  const primary = store.getPrimaryHull();
  const secondary = store.getSecondaryHulls();
  return primary ? [primary, ...secondary] : secondary;
});

// Computed property for currently selected hull
const selectedHull = computed(() => {
  if (store.selection.itemType !== "hull" || store.selection.itemIds.length === 0) {
    return null;
  }
  const hullId = store.selection.itemIds[0];
  return store.getHullById(hullId);
});

// Watch selected hull and update editing state
watch(
  selectedHull,
  (newHull) => {
    if (newHull) {
      // Deep clone with proper defaults
      editingHull.value = {
        ...newHull,
        worldTransform: {
          position: newHull.worldTransform?.position ?? { x: 0, y: 0, z: 0 },
          rotation: newHull.worldTransform?.rotation ?? { x: 0, y: 0, z: 0 },
          scale: newHull.worldTransform?.scale ?? 1.0,
        },
      };
    } else {
      editingHull.value = null;
    }
  },
  { immediate: true }
);

/**
 * Toggle section visibility
 */
function toggleSection(section: keyof typeof openSections.value) {
  openSections.value[section] = !openSections.value[section];
}

/**
 * Select hull from list
 */
function selectHullFromList(hull: HullInstance) {
  store.selectItem("hull", hull.id, false);
}

/**
 * Toggle hull enabled state
 */
function toggleHullEnabled(hull: HullInstance) {
  store.updateHullInstance(hull.id, { enabled: !hull.enabled });
}

/**
 * Save changes to the store
 */
function saveChanges() {
  if (!selectedHull.value || !editingHull.value) return;
  
  const updates: Partial<HullInstance> = {
    name: editingHull.value.name,
    enabled: editingHull.value.enabled,
    hullSpec: editingHull.value.hullSpec,
    worldTransform: {
      position: { 
        x: editingHull.value.worldTransform.position?.x ?? 0,
        y: editingHull.value.worldTransform.position?.y ?? 0,
        z: editingHull.value.worldTransform.position?.z ?? 0,
      },
      rotation: { 
        x: editingHull.value.worldTransform.rotation?.x ?? 0,
        y: editingHull.value.worldTransform.rotation?.y ?? 0,
        z: editingHull.value.worldTransform.rotation?.z ?? 0,
      },
      scale: editingHull.value.worldTransform.scale ?? 1.0,
    },
    booleanOp: editingHull.value.booleanOp,
  };
  
  store.updateHullInstance(selectedHull.value.id, updates);
}

/**
 * Update boolean operation
 */
function updateBooleanOp(op: BooleanOpType) {
  if (!editingHull.value) return;
  editingHull.value.booleanOp = op;
  saveChanges();
}

/**
 * Duplicate the hull with offset position
 */
function handleDuplicate() {
  if (!selectedHull.value) return;
  
  const copy: HullInstance = JSON.parse(JSON.stringify(selectedHull.value));
  copy.id = `${selectedHull.value.id}-copy-${Date.now()}`;
  copy.name = `${selectedHull.value.name} (copy)`;
  
  // Offset by 10 meters in X
  if (copy.worldTransform?.position) {
    copy.worldTransform.position.x += 10;
  }
  
  store.addHull(copy);
}

/**
 * Mirror the hull across YZ plane
 */
function handleMirror() {
  if (!selectedHull.value) return;
  
  const copy: HullInstance = JSON.parse(JSON.stringify(selectedHull.value));
  copy.id = `${selectedHull.value.id}-mirror-${Date.now()}`;
  copy.name = `${selectedHull.value.name} (mirrored)`;
  
  // Flip X position and rotation
  if (copy.worldTransform?.position) {
    copy.worldTransform.position.x = -copy.worldTransform.position.x;
  }
  if (copy.worldTransform?.rotation) {
    copy.worldTransform.rotation.y = -(copy.worldTransform.rotation.y ?? 0);
    copy.worldTransform.rotation.z = -(copy.worldTransform.rotation.z ?? 0);
  }
  
  store.addHull(copy);
}

/**
 * Reset transform to origin
 */
function handleReset() {
  if (!editingHull.value) return;
  
  editingHull.value.worldTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
  };
  
  saveChanges();
}

/**
 * Add a new secondary hull
 */
function handleAddHull() {
  const newHull: HullInstance = {
    id: `secondary-${Date.now()}`,
    name: `Hull ${allHulls.value.length}`,
    isPrimary: false,
    enabled: true,
    hullSpec: {
      // Copy from primary hull as template
      ...JSON.parse(JSON.stringify(store.getPrimaryHull()?.hullSpec || {
        spine: { points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 }] },
        length: 100,
        maxBeam: 20,
        maxHeight: 15,
        topBias: 1.0,
        generationAlgorithm: 'parametric_surface',
        sectionShape: 'ellipse',
        shapeParams: {},
        spineSampleRate: 50,
        hasInteriorDecks: false,
      }))
    },
    worldTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1.0,
    },
    booleanOp: BooleanOperation.Union,
  };

  store.addHull(newHull);
  store.selectItem('hull', newHull.id, false);
}

/**
 * Delete the hull (with confirmation)
 */
function handleDelete() {
  if (!selectedHull.value) return;
  showDeleteConfirm.value = true;
}

/**
 * Confirm deletion
 */
function confirmDelete() {
  if (!selectedHull.value) return;
  
  showDeleteConfirm.value = false;
  store.deleteHull(selectedHull.value.id);
  store.clearSelection();
}

/**
 * Computed property for confirmation message
 */
const deleteMessage = computed(() => {
  if (!selectedHull.value) return "";
  return `Are you sure you want to delete "${selectedHull.value.name}"? This cannot be undone.`;
});
</script>

<style scoped>
.hull-instance-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-background-secondary);
}

.hull-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.hull-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.hull-selector-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-primary);
}

.btn-add-hull {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-add-hull:hover {
  background-color: var(--color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-add-hull:active {
  transform: scale(0.98);
}

.hull-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 200px;
  overflow-y: auto;
}

.hull-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.hull-item:hover {
  background-color: var(--color-border);
  border-color: var(--color-border-hover);
}

.hull-item.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.hull-icon {
  font-size: 1.1rem;
  min-width: 1.5rem;
  text-align: center;
}

.hull-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.85rem;
}

.hull-type {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.hull-item.active .hull-type {
  color: rgba(255, 255, 255, 0.7);
}

.hull-enabled {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.editor-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 0.95rem;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.collapsible-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-primary);
  background-color: var(--color-background-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background-color: var(--color-border);
}

.toggle-icon {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.8rem;
}

.toggle-icon.open {
  transform: rotate(90deg);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.section-help {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-group input[type="text"],
.form-group input[type="number"] {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  color: var(--color-text);
  font-size: 0.85rem;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-group input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.checkbox-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.read-only {
  padding: 0.5rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.slider-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.slider {
  flex: 1;
  height: 1.8rem;
  border-radius: 4px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, var(--color-background-tertiary) 0%, var(--color-background-tertiary) 100%);
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: var(--color-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.number-input {
  width: 4rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  color: var(--color-text);
  font-size: 0.85rem;
  text-align: right;
}

.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.button-group button {
  flex: 1;
  min-width: 120px;
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-tertiary);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-group button:hover {
  background-color: var(--color-border);
  border-color: var(--color-border-hover);
}

.button-group.boolean-ops button.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-secondary {
  background-color: var(--color-background-tertiary);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-danger {
  background-color: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fca5a5;
  border-color: #f87171;
}
</style>
