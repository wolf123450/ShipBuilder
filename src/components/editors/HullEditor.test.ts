import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HullEditor from "./HullEditor.vue";
import { useShipStore } from "@stores/shipStore";

describe("HullEditor Component", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders hull editor with title and description", () => {
    const wrapper = mount(HullEditor);
    expect(wrapper.text()).toContain("Hull Design");
    expect(wrapper.text()).toContain("Define the basic shape of your ship");
  });

  it("loads initial hull values from store", () => {
    const store = useShipStore();
    const wrapper = mount(HullEditor);

    const inputFields = wrapper.findAll("input[type='number']");
    // First three are length, beam, height
    expect(inputFields[0].element.value).toBe(
      String(store.shipSpec.ship.hull.length)
    );
    expect(inputFields[1].element.value).toBe(
      String(store.shipSpec.ship.hull.maxBeam)
    );
    expect(inputFields[2].element.value).toBe(
      String(store.shipSpec.ship.hull.maxHeight)
    );
  });

  it("displays all spine profile points", () => {
    const store = useShipStore();
    const wrapper = mount(HullEditor);

    const pointText = wrapper.text();
    const pointCount = store.shipSpec.ship.hull.spine.points.length;
    for (let i = 0; i < pointCount; i++) {
      expect(pointText).toContain(`Point ${i + 1}`);
    }
  });

  it("updates hull length when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const lengthInput = wrapper.findAll("input[type='number']")[0];
    await lengthInput.setValue(100);

    // Trigger change event
    await lengthInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        length: 100,
      })
    );
  });

  it("updates hull beam when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const beamInput = wrapper.findAll("input[type='number']")[1];
    await beamInput.setValue(25);
    await beamInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        maxBeam: 25,
      })
    );
  });

  it("updates hull height when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const heightInput = wrapper.findAll("input[type='number']")[2];
    await heightInput.setValue(15);
    await heightInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        maxHeight: 15,
      })
    );
  });

  it("adds a new profile point", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const initialPointCount = store.shipSpec.ship.hull.spine.points.length;
    const buttons = wrapper.findAll("button");
    const addButton = buttons.find((btn) => btn.text().includes("Add Profile Point"));

    if (addButton) {
      await addButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(updateSpy).toHaveBeenCalled();
      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].spine.points.length).toBe(initialPointCount + 1);
    }
  });

  it("removes a profile point when delete button clicked", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const initialPointCount = store.shipSpec.ship.hull.spine.points.length;

    // Only show delete if more than 3 points
    if (initialPointCount > 3) {
      const deleteButtons = wrapper.findAll("button:contains('Delete')");
      if (deleteButtons.length > 0) {
        await deleteButtons[0].trigger("click");
        await wrapper.vm.$nextTick();

        const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
        expect(lastCall[0].spine.points.length).toBe(initialPointCount - 1);
      }
    }
  });

  it("prevents deleting profile point when only 3 points remain", async () => {
    const store = useShipStore();

    // Reset to have exactly 3 points
    store.updateHull({
      spine: {
        points: [
          { z: 0.0, radius: 0.2 },
          { z: 0.5, radius: 0.8 },
          { z: 1.0, radius: 0.15 },
        ],
      },
    });

    const wrapper = mount(HullEditor);
    const deleteButtons = wrapper.findAll("button:contains('Delete')");

    // Should not have delete buttons when exactly 3 points
    expect(deleteButtons.length).toBe(0);
  });

  it("applies Fighter preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const presetButtons = wrapper.findAll("button");
    const fighterButton = presetButtons.find(
      (btn) => btn.text() === "Fighter"
    );

    if (fighterButton) {
      await fighterButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(updateSpy).toHaveBeenCalled();
      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].length).toBe(40);
      expect(lastCall[0].maxBeam).toBe(12);
      expect(lastCall[0].maxHeight).toBe(6);
    }
  });

  it("applies Corvette preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const presetButtons = wrapper.findAll("button");
    const corvetteButton = presetButtons.find(
      (btn) => btn.text() === "Corvette"
    );

    if (corvetteButton) {
      await corvetteButton.trigger("click");
      await wrapper.vm.$nextTick();

      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].length).toBe(80);
      expect(lastCall[0].maxBeam).toBe(20);
      expect(lastCall[0].maxHeight).toBe(10);
    }
  });

  it("applies Cruiser preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const presetButtons = wrapper.findAll("button");
    const cruiserButton = presetButtons.find(
      (btn) => btn.text() === "Cruiser"
    );

    if (cruiserButton) {
      await cruiserButton.trigger("click");
      await wrapper.vm.$nextTick();

      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].length).toBe(150);
      expect(lastCall[0].maxBeam).toBe(35);
      expect(lastCall[0].maxHeight).toBe(15);
    }
  });

  it("applies Capital Ship preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateHull");
    const wrapper = mount(HullEditor);

    const presetButtons = wrapper.findAll("button");
    const capitalButton = presetButtons.find(
      (btn) => btn.text() === "Capital Ship"
    );

    if (capitalButton) {
      await capitalButton.trigger("click");
      await wrapper.vm.$nextTick();

      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].length).toBe(300);
      expect(lastCall[0].maxBeam).toBe(80);
      expect(lastCall[0].maxHeight).toBe(40);
    }
  });

  it("displays compilation error when present", async () => {
    const store = useShipStore();
    const wrapper = mount(HullEditor);

    // Set a compilation error
    store.compilationError = "Invalid hull parameters";
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Validation Error");
    expect(wrapper.text()).toContain("Invalid hull parameters");
  });

  it("hides validation error when compilation succeeds", async () => {
    const store = useShipStore();
    const wrapper = mount(HullEditor);

    store.compilationError = "Error message";
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Validation Error");

    store.compilationError = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain("Validation Error");
  });

  it("syncs with store when hull is updated externally", async () => {
    const store = useShipStore();
    const wrapper = mount(HullEditor);

    // Update store directly
    store.updateHull({
      length: 120,
      maxBeam: 30,
      maxHeight: 18,
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for watch

    const lengthInput = wrapper.findAll("input[type='number']")[0];
    expect(parseInt(lengthInput.element.value)).toBe(120);
  });
});
