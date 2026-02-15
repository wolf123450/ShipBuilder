/**
 * Keyboard shortcuts composable for the Ship Design Toolkit
 * Handles global keyboard events for common operations
 */

import { onMounted, onUnmounted } from "vue";
import { useShipStore } from "@stores/shipStore";

export interface KeyboardShortcutsOptions {
  onSave?: () => void;
  onDelete?: () => void;
  onClearSelection?: () => void;
  onCycleTab?: (direction: "next" | "prev") => void;
}

/**
 * Register keyboard shortcuts
 * Ctrl+S: Save
 * Delete: Delete selected item
 * Escape: Clear selection
 * Tab: Cycle through tabs (with Shift for reverse)
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const shipStore = useShipStore();

  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+S (Cmd+S on Mac) - Save
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      if (options.onSave) {
        options.onSave();
      } else {
        // Default: save to localStorage
        console.log("Saving project to localStorage...");
      }
      return;
    }

    // Delete - Delete selected item
    if (event.key === "Delete") {
      // Only delete if a room is selected (not for other selection types)
      if (shipStore.selection.itemType === "room" && shipStore.selection.itemIds[0]) {
        event.preventDefault();
        if (options.onDelete) {
          options.onDelete();
        } else {
          // Default: delete the selected room
          const selectedRoom = shipStore.ship.rooms.find(
            (r: any) => r.id === shipStore.selection.itemIds[0]
          );
          if (selectedRoom) {
            shipStore.deleteRoom(selectedRoom.id);
            shipStore.clearSelection();
          }
        }
      }
      return;
    }

    // Escape - Clear selection
    if (event.key === "Escape") {
      if (shipStore.selection.itemType) {
        event.preventDefault();
        if (options.onClearSelection) {
          options.onClearSelection();
        } else {
          // Default: clear selection
          shipStore.clearSelection();
        }
      }
      return;
    }

    // Tab - Cycle through editor tabs
    if (event.key === "Tab") {
      // Only intercept if not in an input field
      if (
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        )
      ) {
        event.preventDefault();
        const direction = event.shiftKey ? "prev" : "next";
        if (options.onCycleTab) {
          options.onCycleTab(direction);
        }
      }
      return;
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  return {
    handleKeyDown,
  };
}
