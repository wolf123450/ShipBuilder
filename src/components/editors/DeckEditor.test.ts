import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DeckEditor from "./DeckEditor.vue";
import { useShipStore } from "@stores/shipStore";

describe("DeckEditor Component", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders deck editor with title and description", () => {
    const wrapper = mount(DeckEditor);
    expect(wrapper.text()).toContain("Deck Layout");
    expect(wrapper.text()).toContain("Define the deck stack inside your hull");
  });

  it("loads initial deck values from store", () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    const inputFields = wrapper.findAll("input[type='number']");
    expect((inputFields[0].element as HTMLInputElement).value).toBe(
      String(store.shipSpec.ship.decks.deckHeight)
    );
    expect((inputFields[1].element as HTMLInputElement).value).toBe(
      String(store.shipSpec.ship.decks.startY)
    );
    expect((inputFields[2].element as HTMLInputElement).value).toBe(
      String(store.shipSpec.ship.decks.endY)
    );
  });

  it("displays deck count correctly", () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    const deckHeight = store.shipSpec.ship.decks.deckHeight;
    const startY = store.shipSpec.ship.decks.startY;
    const endY = store.shipSpec.ship.decks.endY;
    const expectedCount = Math.floor((endY - startY) / deckHeight);

    expect(wrapper.text()).toContain(`Total Decks: ${expectedCount}`);
  });

  it("updates deck height when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateDecks");
    const wrapper = mount(DeckEditor);

    const deckHeightInput = wrapper.findAll("input[type='number']")[0];
    await deckHeightInput.setValue(3.0);
    await deckHeightInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        deckHeight: 3.0,
      })
    );
  });

  it("updates stack start when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateDecks");
    const wrapper = mount(DeckEditor);

    const startInput = wrapper.findAll("input[type='number']")[1];
    await startInput.setValue(-5);
    await startInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        startY: -5,
      })
    );
  });

  it("updates stack end when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateDecks");
    const wrapper = mount(DeckEditor);

    const endInput = wrapper.findAll("input[type='number']")[2];
    await endInput.setValue(15);
    await endInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        endY: 15,
      })
    );
  });

  it("applies Spacious preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateDecks");
    const wrapper = mount(DeckEditor);

    const presetButtons = wrapper.findAll("button");
    const spaciousButton = presetButtons.find((btn) =>
      btn.text().includes("Spacious")
    );

    if (spaciousButton) {
      await spaciousButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(updateSpy).toHaveBeenCalled();
      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].deckHeight).toBe(3.5);
      expect(lastCall[0].startY).toBe(-7);
      expect(lastCall[0].endY).toBe(7);
    }
  });

  it("applies Compact preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateDecks");
    const wrapper = mount(DeckEditor);

    const presetButtons = wrapper.findAll("button");
    const compactButton = presetButtons.find((btn) =>
      btn.text().includes("Compact")
    );

    if (compactButton) {
      await compactButton.trigger("click");
      await wrapper.vm.$nextTick();

      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].deckHeight).toBe(2.6);
      expect(lastCall[0].startY).toBe(-10.4);
      expect(lastCall[0].endY).toBe(10.4);
    }
  });

  it("applies Tall & Narrow preset", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateDecks");
    const wrapper = mount(DeckEditor);

    const presetButtons = wrapper.findAll("button");
    const tallButton = presetButtons.find((btn) =>
      btn.text().includes("Tall & Narrow")
    );

    if (tallButton) {
      await tallButton.trigger("click");
      await wrapper.vm.$nextTick();

      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[0].deckHeight).toBe(2.0);
      expect(lastCall[0].startY).toBe(-15);
      expect(lastCall[0].endY).toBe(15);
    }
  });

  it("displays deck summary with footprints", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    // Wait for compilation
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (store.derivedData) {
      const deckText = wrapper.text();
      expect(deckText).toContain("Deck Summary");

      const deckCount = store.derivedData.deckFootprints.length;
      for (let i = 0; i < deckCount; i++) {
        expect(deckText).toContain(`Deck ${i}`);
      }
    }
  });

  it("displays compilation error when present", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    store.compilationError = "Invalid deck configuration";
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Validation Error");
    expect(wrapper.text()).toContain("Invalid deck configuration");
  });

  it("hides validation error when compilation succeeds", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    store.compilationError = "Error message";
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Validation Error");

    store.compilationError = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain("Validation Error");
  });

  it("syncs with store when decks are updated externally", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    store.updateDecks({
      deckHeight: 2.8,
      startY: -8,
      endY: 8,
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const deckHeightInput = wrapper.findAll("input[type='number']")[0];
    expect(parseFloat((deckHeightInput.element as HTMLInputElement).value)).toBe(2.8);
  });

  it("calculates deck count correctly with different configurations", async () => {
    const store = useShipStore();
    const wrapper = mount(DeckEditor);

    // Test multiple configurations
    const configurations = [
      { deckHeight: 2.0, startY: -10, endY: 10 }, // 10 decks
      { deckHeight: 3.0, startY: -9, endY: 9 }, // 6 decks
      { deckHeight: 4.0, startY: -8, endY: 8 }, // 4 decks
    ];

    for (const config of configurations) {
      store.updateDecks(config);
      await wrapper.vm.$nextTick();

      const expectedCount = Math.floor(
        (config.endY - config.startY) / config.deckHeight
      );
      expect(wrapper.text()).toContain(`Total Decks: ${expectedCount}`);
    }
  });
});
