/**
 * Mesh cache for avoiding redundant mesh generation
 * Stores generated geometries indexed by hull spec hash
 */

import * as THREE from 'three';
import { BakedMesh } from '@compiler/mesh';
import { getHullSpecHash } from '@utils/profiling';

export interface CachedMesh {
  specHash: string;
  geometry: THREE.BufferGeometry;
  boundingBox: any;
  timestamp: number;
  hitCount: number;
}

class MeshCache {
  private cache: Map<string, CachedMesh> = new Map();
  private readonly maxEntries = 10; // Keep last 10 meshes in memory
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  /**
   * Get cached mesh by hull spec
   */
  get(hullSpec: any): BakedMesh | null {
    const hash = getHullSpecHash(hullSpec);
    const cached = this.cache.get(hash);

    if (cached) {
      this.stats.hits++;
      cached.hitCount++;
      cached.timestamp = performance.now(); // Update access time
      return {
        geometry: cached.geometry,
        boundingBox: cached.boundingBox,
      };
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Store mesh in cache
   */
  set(hullSpec: any, mesh: BakedMesh): void {
    const hash = getHullSpecHash(hullSpec);

    // Check if we need to evict old entries
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    // Clone the geometry so we don't dispose of cached versions
    const clonedGeometry = mesh.geometry.clone();

    this.cache.set(hash, {
      specHash: hash,
      geometry: clonedGeometry,
      boundingBox: mesh.boundingBox,
      timestamp: performance.now(),
      hitCount: 0,
    });
  }

  /**
   * Evict the oldest/least used entry
   */
  private evictOldest(): void {
    let oldestEntry: [string, CachedMesh] | null = null;
    let minScore = Infinity;

    // Eviction strategy: oldest timestamp with lowest hit count
    for (const [key, entry] of this.cache.entries()) {
      const score = entry.timestamp / (entry.hitCount + 1); // Favor old entries with low hits
      if (score < minScore) {
        minScore = score;
        oldestEntry = [key, entry];
      }
    }

    if (oldestEntry) {
      const [key, entry] = oldestEntry;
      entry.geometry.dispose();
      this.cache.delete(key);
      this.stats.evictions++;
    }
  }

  /**
   * Clear all cached meshes
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      entry.geometry.dispose();
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 'N/A';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      entryCount: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of cached geometries
   */
  private estimateMemoryUsage(): string {
    let totalBytes = 0;
    for (const entry of this.cache.values()) {
      const positions = entry.geometry.getAttribute('position');
      if (positions) {
        totalBytes += positions.array.byteLength;
      }
      const index = entry.geometry.index;
      if (index) {
        totalBytes += index.array.byteLength;
      }
    }
    
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('=== Mesh Cache Statistics ===');
    console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate}`);
    console.log(`Evictions: ${stats.evictions}`);
    console.log(`Cached Entries: ${stats.entryCount}/${this.maxEntries}`);
    console.log(`Memory Usage: ${stats.memoryUsage}`);
  }
}

// Global mesh cache instance
export const meshCache = new MeshCache();
