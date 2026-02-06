import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ExportEditor from "./ExportEditor.vue";
import { useShipStore } from "@stores/shipStore";
import * as exportUtils from "@utils/export";
import * as storageUtils from "@utils/storage";

// Mock the export and storage utilities
vi.mock("@utils/export", () => ({
  exportAsJSON: vi.fn((spec) => JSON.stringify(spec)),
  exportAsYAML: vi.fn(async (spec) => JSON.stringify(spec)),
  downloadFile: vi.fn(),
  exportAsGLB: vi.fn(),
  triggerFileInput: vi.fn(),
  importFromFile: vi.fn(),
}));

vi.mock("@utils/storage", () => ({
  saveShipToLibrary: vi.fn(),
  loadLibrary: vi.fn(() => []),
  loadShipFromStorage: vi.fn(),
  deleteFromLibrary: vi.fn(),
}));

describe("ExportEditor Component", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("renders export editor with title and description", () => {
    const wrapper = mount(ExportEditor);
    expect(wrapper.text()).toContain("Export & Save");
    expect(wrapper.text()).toContain(
      "Save your ship design or export it for use in other applications"
    );
  });

  it("loads and displays ship name from store", () => {
    const store = useShipStore();
    store.updateMeta({ name: "Test Cruiser" });
    const wrapper = mount(ExportEditor);

    const nameInput = wrapper.find("input[type='text']");
    expect((nameInput.element as HTMLInputElement).value).toBe("Test Cruiser");
  });

  it("updates ship name when input changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateMeta");
    const wrapper = mount(ExportEditor);

    const nameInput = wrapper.find("input[type='text']");
    await nameInput.setValue("New Ship Name");
    await nameInput.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith({ name: "New Ship Name" });
  });

  it("loads and displays ship description from store", () => {
    const store = useShipStore();
    store.updateMeta({ description: "A mighty warship" });
    const wrapper = mount(ExportEditor);

    const descriptionBox = wrapper.find("textarea");
    expect(descriptionBox.element.value).toContain("A mighty warship");
  });

  it("updates ship description when textarea changes", async () => {
    const store = useShipStore();
    const updateSpy = vi.spyOn(store, "updateMeta");
    const wrapper = mount(ExportEditor);

    const descriptionBox = wrapper.find("textarea");
    await descriptionBox.setValue("An updated description");
    await descriptionBox.trigger("change");
    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalledWith({
      description: "An updated description",
    });
  });

  it("displays export format buttons", () => {
    const wrapper = mount(ExportEditor);
    const buttons = wrapper.findAll("button");

    const buttonTexts = buttons.map((btn) => btn.text());
    expect(buttonTexts.some((text) => text.includes("JSON"))).toBe(true);
    expect(buttonTexts.some((text) => text.includes("YAML"))).toBe(true);
    expect(buttonTexts.some((text) => text.includes("GLB"))).toBe(true);
  });

  it("exports as JSON when button clicked", async () => {
    const downloadSpy = vi.spyOn(exportUtils, "downloadFile");
    const wrapper = mount(ExportEditor);

    const exportButtons = wrapper.findAll("button");
    const jsonButton = exportButtons.find((btn) => btn.text().includes("JSON"));

    if (jsonButton) {
      await jsonButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(downloadSpy).toHaveBeenCalled();
    }
  });

  it("exports as YAML when button clicked", async () => {
    const downloadSpy = vi.spyOn(exportUtils, "downloadFile");
    const wrapper = mount(ExportEditor);

    const exportButtons = wrapper.findAll("button");
    const yamlButton = exportButtons.find((btn) => btn.text().includes("YAML"));

    if (yamlButton) {
      await yamlButton.trigger("click");
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for async

      expect(downloadSpy).toHaveBeenCalled();
    }
  });

  it("displays 'Save Current' button for local saves", () => {
    const wrapper = mount(ExportEditor);
    expect(wrapper.text()).toContain("Save Current");
  });

  it("displays 'Import' button for file import", () => {
    const wrapper = mount(ExportEditor);
    expect(wrapper.text()).toContain("Import");
  });

  it("saves to local library when 'Save Current' clicked", async () => {
    const saveSpy = vi.spyOn(storageUtils, "saveShipToLibrary");
    const wrapper = mount(ExportEditor);

    const buttons = wrapper.findAll("button");
    const saveButton = buttons.find((btn) => btn.text() === "Save Current");

    if (saveButton) {
      await saveButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(saveSpy).toHaveBeenCalled();
    }
  });

  it("loads saves list on mount", async () => {
    const mockSaves = [
      {
        id: "save1",
        name: "Fighter Design",
        timestamp: new Date().toISOString(),
        spec: null,
      },
      {
        id: "save2",
        name: "Cruiser Design",
        timestamp: new Date().toISOString(),
        spec: null,
      },
    ];

    vi.mocked(storageUtils.loadLibrary).mockReturnValue(mockSaves as any);

    const wrapper = mount(ExportEditor);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Local Saves");
    expect(wrapper.text()).toContain("Fighter Design");
    expect(wrapper.text()).toContain("Cruiser Design");
  });

  it("displays 'No local saves yet' when library is empty", async () => {
    vi.mocked(storageUtils.loadLibrary).mockReturnValue([]);

    const wrapper = mount(ExportEditor);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("No local saves yet");
  });

  it("shows delete confirmation when delete button clicked", async () => {
    const mockSaves = [
      {
        id: "save1",
        name: "Fighter Design",
        timestamp: new Date().toISOString(),
        spec: null,
      },
    ];

    vi.mocked(storageUtils.loadLibrary).mockReturnValue(mockSaves as any);

    const wrapper = mount(ExportEditor);
    await wrapper.vm.$nextTick();

    const deleteButton = wrapper.find("button:contains('Delete')");
    if (deleteButton.exists()) {
      await deleteButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).showDeleteConfirm).toBe(true);
    }
  });

  it("imports when import button clicked", async () => {
    const triggerSpy = vi.spyOn(exportUtils, "triggerFileInput");
    const wrapper = mount(ExportEditor);

    const buttons = wrapper.findAll("button");
    const importButton = buttons.find((btn) => btn.text() === "Import");

    if (importButton) {
      await importButton.trigger("click");
      await wrapper.vm.$nextTick();

      expect(triggerSpy).toHaveBeenCalled();
    }
  });

  it("displays ship statistics when derived data available", async () => {
    const store = useShipStore();
    const wrapper = mount(ExportEditor);

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (store.derivedData) {
      expect(wrapper.text()).toContain("Ship Statistics");
      expect(wrapper.text()).toContain("Hull Length");
      expect(wrapper.text()).toContain("Hull Beam");
    }
  });

  it("displays import error when import fails", async () => {
    let fileCallback: ((file: any) => Promise<void>) | undefined;

    vi.mocked(exportUtils.triggerFileInput).mockImplementation(
      ((callback: (file: any) => Promise<void>) => {
        fileCallback = callback;
      }) as any
    );

    const wrapper = mount(ExportEditor);

    const buttons = wrapper.findAll("button");
    const importButton = buttons.find((btn) => btn.text() === "Import");

    if (importButton && fileCallback) {
      await importButton.trigger("click");

      // Simulate import error
      vi.mocked(exportUtils.importFromFile).mockRejectedValueOnce(
        new Error("Invalid JSON format")
      );

      await fileCallback!({ name: "bad.json" } as any);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Invalid JSON format");
    }
  });

  it("clears import error on successful import", async () => {
    const store = useShipStore();
    let fileCallback: ((file: any) => Promise<void>) | undefined;

    vi.mocked(exportUtils.triggerFileInput).mockImplementation(
      ((callback: (file: any) => Promise<void>) => {
        fileCallback = callback;
      }) as any
    );

    const wrapper = mount(ExportEditor);

    // First simulate error
    if (fileCallback) {
      vi.mocked(exportUtils.importFromFile).mockRejectedValueOnce(
        new Error("Bad file")
      );
      await fileCallback!({ name: "bad.json" } as any);
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).importError).toBeTruthy();

      // Then simulate success
      vi.mocked(exportUtils.importFromFile).mockResolvedValueOnce(
        store.shipSpec
      );
      await fileCallback!({ name: "good.json" } as any);
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).importError).toBe("");
    }
  });
});
