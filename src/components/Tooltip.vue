<template>
  <div
    ref="triggerRef"
    class="relative inline-block"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <slot />
    <Teleport to="body">
      <div
        v-show="showTooltip"
        ref="tooltipRef"
        class="fixed px-3 py-2 bg-gray-900 text-white text-xs rounded pointer-events-none opacity-100 whitespace-nowrap z-[9999] border border-gray-700 shadow-xl"
        :style="tooltipPosition"
      >
        {{ text }}
        <div class="absolute w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45" :style="arrowPosition" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const showTooltip = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);

const tooltipPosition = computed(() => {
  if (!triggerRef.value) {
    return { top: "0", left: "0" };
  }

  const triggerRect = triggerRef.value.getBoundingClientRect();
  const padding = 8;
  let top = triggerRect.top - padding;
  let left = triggerRect.left + triggerRect.width / 2;

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: "translate(-50%, -100%)",
  };
});

const arrowPosition = computed(() => ({
  bottom: "-4px",
  left: "50%",
  transform: "translateX(-50%)",
}));

watch(showTooltip, async (newVal) => {
  if (newVal) {
    await nextTick();
    // Check if tooltip goes off-screen and adjust
    if (tooltipRef.value) {
      const tooltipRect = tooltipRef.value.getBoundingClientRect();
      
      // If tooltip goes off-screen to the left, move it right
      if (tooltipRect.left < 0) {
        tooltipRef.value.style.left = "8px";
        tooltipRef.value.style.transform = "translate(0, -100%)";
      }
      
      // If tooltip goes off-screen to the right, move it left
      if (tooltipRect.right > window.innerWidth) {
        tooltipRef.value.style.right = "8px";
        tooltipRef.value.style.left = "auto";
        tooltipRef.value.style.transform = "translate(0, -100%)";
      }
      
      // If tooltip goes off-screen to the top, show it below instead
      if (tooltipRect.top < 0 && triggerRef.value) {
        const triggerRect = triggerRef.value.getBoundingClientRect();
        const newTop = triggerRect.bottom + 8;
        tooltipRef.value.style.top = `${newTop}px`;
        tooltipRef.value.style.transform = "translate(-50%, 0)";
      }
    }
  }
});
</script>
