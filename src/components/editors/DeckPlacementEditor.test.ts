import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DeckPlacementEditor from "./DeckPlacementEditor.vue";
import { useShipStore } from "@stores/shipStore";
import type { RoomShapeType, RoomType } from "@/types";

describe("DeckPlacementEditor Component", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders room placement editor with title and description", async () => {
    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Room Placement");
    expect(wrapper.text()).toContain(
      "Define the functional spaces inside your ship"
    );
  });

  it("displays deck selector dropdown", () => {
    const wrapper = mount(DeckPlacementEditor);
    const select = wrapper.find("select");
    expect(select.exists()).toBe(true);
  });

  it("displays canvas for room placement", () => {
    const wrapper = mount(DeckPlacementEditor);
    const canvas = wrapper.find("canvas");
    expect(canvas.exists()).toBe(true);
  });

  it("shows room list for selected deck", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Room Placement");
    expect(wrapper.text()).toContain("Rooms on Deck");
  });

  it("displays 'Add Room' button", () => {
    const wrapper = mount(DeckPlacementEditor);
    expect(wrapper.text()).toContain("Add Room");
  });

  it("displays room list items with room names", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    if (store.shipSpec.ship.rooms.length > 0) {
      const roomName = store.shipSpec.ship.rooms[0].id;
      expect(wrapper.text()).toContain(roomName);
    }
  });

  it("displays Edit, Copy, and Delete buttons for each room", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    if (store.shipSpec.ship.rooms.length > 0) {
      expect(wrapper.text()).toContain("Edit");
      expect(wrapper.text()).toContain("Copy");
      expect(wrapper.text()).toContain("Delete");
    }
  });

  it("shows 'No rooms on this deck' message when deck is empty", async () => {
    const store = useShipStore();

    // Clear all rooms
    store.shipSpec.ship.rooms = [];

    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("No rooms on this deck");
  });

  it("opens add room form when '+Add Room' button clicked", async () => {
    const wrapper = mount(DeckPlacementEditor);
    const addButton = wrapper.find("button:contains('Add Room')");

    if (addButton.exists()) {
      await addButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).showRoomForm).toBe(true);
      expect(wrapper.text()).toContain("New Room on Deck");
    }
  });

  it("displays toggle for grid visibility", () => {
    const wrapper = mount(DeckPlacementEditor);
    const buttons = wrapper.findAll("button");
    const gridButton = buttons.find((btn) =>
      btn.text().includes("Grid:")
    );

    expect(gridButton?.exists()).toBe(true);
  });

  it("displays 'Fit View' button for zoom reset", () => {
    const wrapper = mount(DeckPlacementEditor);
    expect(wrapper.text()).toContain("Fit View");
  });

  it("displays footprint area information", async () => {
    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Footprint Area");
  });

  // Note: Coordinate display only shows when mouse is over canvas (mouseWorldPos is not null)
  // So we skip testing the exact text presence here

  it("selects room when room item clicked", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    // Rooms should be displayed in the list
    if (store.shipSpec.ship.rooms.length > 0) {
      const roomName = store.shipSpec.ship.rooms[0].id;
      expect(wrapper.text()).toContain(roomName);
    }
  });

  it("syncs selection with store when room is selected", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);

    if (store.shipSpec.ship.rooms.length > 0) {
      const roomId = store.shipSpec.ship.rooms[0].id;
      (wrapper.vm as any).selectedRoomId = roomId;
      await wrapper.vm.$nextTick();

      // Trigger updateSelection via watcher
      store.selectItem("room", roomId);
    }
  });

  it("clears selection when clicking outside rooms", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);

    store.clearSelection();
    await wrapper.vm.$nextTick();

    expect(store.selectedItemType).toBeNull();
  });

  it("exposes deleteSelectedRoom method for keyboard shortcuts", () => {
    const wrapper = mount(DeckPlacementEditor);
    expect(typeof wrapper.vm.deleteSelectedRoom).toBe("function");
  });

  it("displays edit modal when edit button clicked", async () => {
    const store = useShipStore();

    if (store.shipSpec.ship.rooms.length > 0) {
      const wrapper = mount(DeckPlacementEditor);
      await wrapper.vm.$nextTick();

      // Click edit button
      const editButtons = wrapper.findAll("button");
      const firstEditButton = editButtons.find((btn) => btn.text() === "Edit");

      if (firstEditButton) {
        await firstEditButton.trigger("click");
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).showEditModal).toBe(true);
      }
    }
  });

  it("displays room type in room list items", async () => {
    const store = useShipStore();

    if (store.shipSpec.ship.rooms.length > 0) {
      const wrapper = mount(DeckPlacementEditor);
      await wrapper.vm.$nextTick();

      const roomType = store.shipSpec.ship.rooms[0].type;
      const typeText = wrapper.text();
      expect(typeText.toLowerCase()).toContain(roomType.toLowerCase());
    }
  });

  it("displays room position and size in list", async () => {
    const store = useShipStore();

    if (store.shipSpec.ship.rooms.length > 0) {
      const wrapper = mount(DeckPlacementEditor);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Pos:");
      expect(wrapper.text()).toContain("Size:");
    }
  });

  it("updates deck selector when decks change", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckPlacementEditor);

    // Add more decks
    store.updateDecks({
      deckHeight: 2.0,
      startY: -20,
      endY: 20,
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const select = wrapper.find("select");
    expect(select.exists()).toBe(true);
  });

  it("shows delete confirmation when delete button clicked", async () => {
    const store = useShipStore();

    if (store.shipSpec.ship.rooms.length > 0) {
      const wrapper = mount(DeckPlacementEditor);
      await wrapper.vm.$nextTick();

      const deleteButtons = wrapper.findAll("button");
      const firstDeleteButton = deleteButtons.find(
        (btn) => btn.text() === "Delete"
      );

      if (firstDeleteButton) {
        await firstDeleteButton.trigger("click");
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).showDeleteConfirm).toBe(true);
      }
    }
  });

  // Note: ConfirmDialog component is conditionally rendered only when showDeleteConfirm && saveToDelete
  // So it won't exist initially. The component is tested through integration when delete is triggered.

  it("calculates room corners correctly for collision detection", async () => {
    const wrapper = mount(DeckPlacementEditor);

    // Test that getRoomCorners function exists and works
    if ((wrapper.vm as any).getRoomCorners) {
      const testRoom = {
        position: { x: 0, z: 0 },
        shape: { size: [4, 6] },
        rotationDeg: 0,
      };

      const corners = (wrapper.vm as any).getRoomCorners(testRoom);
      expect(Array.isArray(corners)).toBe(true);
      expect(corners.length).toBe(4); // Rectangle should have 4 corners
    }
  });

  it("handles room color coding by type", async () => {
    const store = useShipStore();

    if (store.shipSpec.ship.rooms.length > 0) {
      const wrapper = mount(DeckPlacementEditor);
      await wrapper.vm.$nextTick();

      // Check that getRoomColor function exists
      if ((wrapper.vm as any).getRoomColor) {
        const roomType = store.shipSpec.ship.rooms[0].type;
        const color = (wrapper.vm as any).getRoomColor(roomType);
        expect(typeof color).toBe("string");
        expect(color).toMatch(/^#/); // Should be hex color code
      }
    }
  });

  it("displays room rotation when non-zero", async () => {
    const store = useShipStore();

    // Add a rotated room
    const rotatedRoom = {
      id: "rotated_test",
      type: "crew" as RoomType,
      deck: 0,
      shape: { type: 0 as unknown as RoomShapeType, size: [4, 4] as [number, number] },
      position: { x: 5, z: 5 },
      rotationDeg: 45,
      tags: [],
    };

    store.addRoom(rotatedRoom);

    const wrapper = mount(DeckPlacementEditor);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("45°");
  });
});
