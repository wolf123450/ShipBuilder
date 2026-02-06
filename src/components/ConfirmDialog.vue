<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-ship-navy rounded-lg shadow-lg max-w-md w-96 border border-ship-slate">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-ship-slate">
            <h2 class="text-xl font-bold text-white">{{ title }}</h2>
          </div>

          <!-- Content -->
          <div class="px-6 py-4">
            <p class="text-gray-300">{{ message }}</p>
          </div>

          <!-- Footer (Actions) -->
          <div class="px-6 py-4 border-t border-ship-slate flex gap-3 justify-end">
            <button
              @click="handleCancel"
              class="px-4 py-2 rounded font-semibold transition-colors bg-ship-slate hover:bg-ship-slate/80 text-gray-200"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              :class="[
                'px-4 py-2 rounded font-semibold transition-colors',
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-ship-accent hover:bg-blue-600 text-white',
              ]"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

withDefaults(defineProps<ConfirmDialogProps>(), {
  confirmText: "Confirm",
  cancelText: "Cancel",
  isDangerous: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const isOpen = ref(true);

function handleConfirm() {
  emit("confirm");
  isOpen.value = false;
}

function handleCancel() {
  emit("cancel");
  isOpen.value = false;
}

// Allow external control
defineExpose({
  isOpen,
  handleConfirm,
  handleCancel,
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
