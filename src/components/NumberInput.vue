<template>
  <div class="number-input-wrapper">
    <input
      :value="modelValue"
      type="number"
      :step="step"
      :min="min"
      :max="max"
      class="number-input"
      @input="$emit('update:modelValue', parseFloat(($event.target as HTMLInputElement).value))"
    />
    <div class="spinner-buttons">
      <button class="spinner-btn spinner-up" @click="increment" :title="`Increase by ${step}`">
        <span class="spinner-icon">▲</span>
      </button>
      <button class="spinner-btn spinner-down" @click="decrement" :title="`Decrease by ${step}`">
        <span class="spinner-icon">▼</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: number;
  step?: number;
  min?: number;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  step: 1,
  min: undefined,
  max: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

function increment() {
  let newValue = (props.modelValue ?? 0) + (props.step ?? 1);
  if (props.max !== undefined) {
    newValue = Math.min(newValue, props.max);
  }
  emit('update:modelValue', newValue);
}

function decrement() {
  let newValue = (props.modelValue ?? 0) - (props.step ?? 1);
  if (props.min !== undefined) {
    newValue = Math.max(newValue, props.min);
  }
  emit('update:modelValue', newValue);
}
</script>

<style scoped>
.number-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
}

.number-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px 0 0 4px;
  background-color: var(--color-background-tertiary);
  color: var(--color-text);
  font-size: 0.85rem;
  text-align: right;
  /* Hide default spinner buttons */
  appearance: textfield;
  -moz-appearance: textfield;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  border-radius: 4px 0 0 4px;
}

.spinner-buttons {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-left: none;
  border-radius: 0 4px 4px 0;
  overflow: hidden;
  background-color: var(--color-background-tertiary);
  height: 100%;
}

.spinner-btn {
  flex: 1;
  padding: 0 0.4rem;
  border: none;
  background-color: var(--color-background-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  transition: all 0.2s ease;
  border-left: 1px solid var(--color-border);
  min-height: 1.2rem;
}

.spinner-btn:hover {
  background-color: var(--color-border);
  color: var(--color-primary);
}

.spinner-btn:active {
  background-color: var(--color-primary);
  color: white;
}

.spinner-up {
  border-bottom: 1px solid var(--color-border);
}

.spinner-icon {
  display: block;
  line-height: 1;
}
</style>
