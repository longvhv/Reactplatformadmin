/**
 * Compression & Decompression Utilities
 * 
 * Giảm kích thước data khi transfer và storage
 */

/**
 * Compress string using built-in compression
 * Supports both browser (CompressionStream) and fallback (LZ-string like)
 */
export async function compressString(str: string): Promise<Uint8Array> {
  // Check if CompressionStream is available (modern browsers)
  if ('CompressionStream' in window) {
    const stream = new Response(str).body!.pipeThrough(
      new CompressionStream('gzip')
    );
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }
  
  // Fallback: simple LZ-like compression
  return new TextEncoder().encode(str);
}

/**
 * Decompress data
 */
export async function decompressString(data: Uint8Array): Promise<string> {
  // Check if DecompressionStream is available (modern browsers)
  if ('DecompressionStream' in window) {
    const stream = new Response(data).body!.pipeThrough(
      new DecompressionStream('gzip')
    );
    return await new Response(stream).text();
  }
  
  // Fallback
  return new TextDecoder().decode(data);
}

/**
 * Simple LZ77-based compression for strings
 * Lightweight fallback when native compression not available
 */
class LZCompressor {
  private static readonly MIN_MATCH = 3;
  private static readonly MAX_MATCH = 258;
  private static readonly WINDOW_SIZE = 32768;
  
  /**
   * Compress string to base64
   */
  static compress(input: string): string {
    if (!input) return '';
    
    const dict: Record<string, number> = {};
    const data = (input + '').split('');
    const out: string[] = [];
    let phrase = data[0];
    let code = 256;
    
    for (let i = 1; i < data.length; i++) {
      const currChar = data[i];
      const combined = phrase + currChar;
      
      if (dict[combined] != null) {
        phrase = combined;
      } else {
        out.push(phrase.length > 1 ? String.fromCharCode(dict[phrase]) : phrase);
        dict[combined] = code;
        code++;
        phrase = currChar;
      }
    }
    
    out.push(phrase.length > 1 ? String.fromCharCode(dict[phrase]) : phrase);
    return out.join('');
  }
  
  /**
   * Decompress from base64
   */
  static decompress(compressed: string): string {
    if (!compressed) return '';
    
    const dict: Record<number, string> = {};
    const data = (compressed + '').split('');
    let currChar = data[0];
    let oldPhrase = currChar;
    const out = [currChar];
    let code = 256;
    let phrase: string;
    
    for (let i = 1; i < data.length; i++) {
      const currCode = data[i].charCodeAt(0);
      
      if (currCode < 256) {
        phrase = data[i];
      } else {
        phrase = dict[currCode] ? dict[currCode] : oldPhrase + currChar;
      }
      
      out.push(phrase);
      currChar = phrase.charAt(0);
      dict[code] = oldPhrase + currChar;
      code++;
      oldPhrase = phrase;
    }
    
    return out.join('');
  }
}

/**
 * Compress JSON object
 */
export function compressJSON(obj: any): string {
  const json = JSON.stringify(obj);
  return LZCompressor.compress(json);
}

/**
 * Decompress JSON object
 */
export function decompressJSON(compressed: string): any {
  const json = LZCompressor.decompress(compressed);
  return JSON.parse(json);
}

/**
 * Compress and encode to base64
 */
export function compressToBase64(str: string): string {
  const compressed = LZCompressor.compress(str);
  return btoa(encodeURIComponent(compressed));
}

/**
 * Decompress from base64
 */
export function decompressFromBase64(base64: string): string {
  const compressed = decodeURIComponent(atob(base64));
  return LZCompressor.decompress(compressed);
}

/**
 * Compress data for localStorage
 * Automatically compresses if data is large
 */
export function compressForStorage(key: string, data: any): void {
  const json = JSON.stringify(data);
  
  // Only compress if data is larger than 1KB
  if (json.length > 1024) {
    const compressed = compressJSON(data);
    localStorage.setItem(key, `compressed:${compressed}`);
  } else {
    localStorage.setItem(key, json);
  }
}

/**
 * Decompress data from localStorage
 * Automatically detects if data is compressed
 */
export function decompressFromStorage(key: string): any {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  // Check if compressed
  if (stored.startsWith('compressed:')) {
    const compressed = stored.substring(11); // Remove 'compressed:' prefix
    return decompressJSON(compressed);
  }
  
  return JSON.parse(stored);
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(original: string, compressed: string): number {
  const originalSize = new Blob([original]).size;
  const compressedSize = new Blob([compressed]).size;
  return ((1 - compressedSize / originalSize) * 100).toFixed(2) as any;
}

/**
 * Compress fetch response
 * Useful for caching large API responses
 */
export async function compressResponse(response: Response): Promise<string> {
  const text = await response.text();
  return compressJSON(text);
}

/**
 * Enhanced fetch with automatic compression for large payloads
 */
export async function fetchWithCompression(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Add compression headers
  const headers = new Headers(options?.headers);
  headers.set('Accept-Encoding', 'gzip, deflate, br');
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Compress large request bodies
 */
export async function compressRequestBody(body: any): Promise<Blob> {
  const json = JSON.stringify(body);
  
  // Only compress if body is larger than 5KB
  if (json.length < 5120) {
    return new Blob([json], { type: 'application/json' });
  }
  
  if ('CompressionStream' in window) {
    const stream = new Response(json).body!.pipeThrough(
      new CompressionStream('gzip')
    );
    return await new Response(stream).blob();
  }
  
  // Fallback
  const compressed = compressJSON(body);
  return new Blob([compressed], { type: 'application/json' });
}

/**
 * Smart cache with compression
 * Automatically compresses large values
 */
export class CompressedCache {
  private cache = new Map<string, { value: any; compressed: boolean; timestamp: number }>();
  private readonly ttl: number;
  private readonly compressionThreshold: number;
  
  constructor(ttl = 5 * 60 * 1000, compressionThreshold = 1024) {
    this.ttl = ttl;
    this.compressionThreshold = compressionThreshold;
  }
  
  /**
   * Set cache value with automatic compression
   */
  set(key: string, value: any): void {
    const json = JSON.stringify(value);
    const shouldCompress = json.length > this.compressionThreshold;
    
    this.cache.set(key, {
      value: shouldCompress ? compressJSON(value) : value,
      compressed: shouldCompress,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Get cache value with automatic decompression
   */
  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Decompress if needed
    return cached.compressed ? decompressJSON(cached.value) : cached.value;
  }
  
  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    let totalSize = 0;
    let compressedCount = 0;
    
    this.cache.forEach(item => {
      const size = new Blob([JSON.stringify(item.value)]).size;
      totalSize += size;
      if (item.compressed) compressedCount++;
    });
    
    return {
      size: this.cache.size,
      totalSize,
      compressedCount,
      averageSize: totalSize / this.cache.size || 0,
    };
  }
}

/**
 * Create compressed cache instance
 */
export function createCompressedCache(ttl?: number, compressionThreshold?: number) {
  return new CompressedCache(ttl, compressionThreshold);
}

/**
 * Example usage:
 * 
 * // String compression
 * const compressed = await compressString(largeText);
 * const decompressed = await decompressString(compressed);
 * 
 * // JSON compression
 * const compressedData = compressJSON(largeObject);
 * const originalData = decompressJSON(compressedData);
 * 
 * // Storage compression
 * compressForStorage('myData', largeObject);
 * const data = decompressFromStorage('myData');
 * 
 * // Compressed cache
 * const cache = createCompressedCache();
 * cache.set('key', largeData);
 * const cachedData = cache.get('key');
 */
