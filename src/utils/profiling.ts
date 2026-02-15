/**
 * Performance profiling utilities
 * Helps identify bottlenecks in mesh generation and compilation
 */

export interface ProfileMetrics {
  [key: string]: {
    count: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
    avgTime: number;
  };
}

class Profiler {
  private metrics: ProfileMetrics = {};
  private timestamps: Map<string, number> = new Map();

  /**
   * Start timing a section
   */
  start(label: string): void {
    this.timestamps.set(label, performance.now());
  }

  /**
   * End timing a section and record metrics
   */
  end(label: string): number {
    const startTime = this.timestamps.get(label);
    if (!startTime) {
      console.warn(`No start time found for label: ${label}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.metrics[label]) {
      this.metrics[label] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: -Infinity,
        avgTime: 0,
      };
    }

    const metric = this.metrics[label];
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.avgTime = metric.totalTime / metric.count;

    this.timestamps.delete(label);
    return duration;
  }

  /**
   * Get all metrics
   */
  getMetrics(): ProfileMetrics {
    return this.metrics;
  }

  /**
   * Print metrics in a table format
   */
  print(): void {
    console.table(
      Object.entries(this.metrics).map(([label, metric]) => ({
        Label: label,
        'Count': metric.count,
        'Total (ms)': metric.totalTime.toFixed(2),
        'Min (ms)': metric.minTime.toFixed(2),
        'Max (ms)': metric.maxTime.toFixed(2),
        'Avg (ms)': metric.avgTime.toFixed(2),
      }))
    );
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {};
    this.timestamps.clear();
  }

  /**
   * Measure a synchronous function
   */
  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    const duration = this.end(label);
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Measure an async function
   */
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    const duration = this.end(label);
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return result;
  }
}

// Global profiler instance
export const profiler = new Profiler();

/**
 * Create a hash of an object for cache keys
 */
export function hashObject(obj: any): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Calculate hash for hull specification
 */
export function getHullSpecHash(hullSpec: any): string {
  // Only hash the relevant hull properties that affect mesh generation
  const relevantSpec = {
    type: hullSpec.type,
    symmetry: hullSpec.symmetry,
    length: hullSpec.length,
    maxBeam: hullSpec.maxBeam,
    maxHeight: hullSpec.maxHeight,
    spine: hullSpec.spine,
    generationAlgorithm: hullSpec.generationAlgorithm,
    voxelResolution: hullSpec.voxelResolution,
    spineSampleRate: hullSpec.spineSampleRate,
    sectionShape: hullSpec.sectionShape,
    shapeParams: hullSpec.shapeParams,
    topBias: hullSpec.topBias,
  };
  return hashObject(relevantSpec);
}
