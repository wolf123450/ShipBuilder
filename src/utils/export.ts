/**
 * Export utilities for ships
 */

import { ShipSpec, ExportOptions } from "@types/index";

/**
 * Export ship spec as JSON
 */
export function exportAsJSON(spec: ShipSpec): string {
  return JSON.stringify(spec, null, 2);
}

/**
 * Export ship spec as YAML
 */
export async function exportAsYAML(spec: ShipSpec): Promise<string> {
  // Dynamic import to keep yaml as optional
  const yaml = await import("js-yaml");

  return yaml.dump(spec, {
    indent: 2,
    lineWidth: 100,
  });
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import ship spec from file
 */
export async function importFromFile(file: File): Promise<ShipSpec | null> {
  try {
    const text = await file.text();

    // Try JSON first
    try {
      return JSON.parse(text) as ShipSpec;
    } catch {
      // Try YAML
      const yaml = await import("js-yaml");
      return yaml.load(text) as ShipSpec;
    }
  } catch (error) {
    console.error("Failed to import file:", error);
    return null;
  }
}

/**
 * Helper to trigger file input
 */
export function triggerFileInput(callback: (file: File) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.yaml,.yml";
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) {
      callback(files[0]);
    }
  };
  input.click();
}
