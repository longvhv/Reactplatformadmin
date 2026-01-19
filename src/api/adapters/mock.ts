
/**
 * Mock Adapter
 * In-memory mock implementation for development/fallback
 */

import { BaseApiAdapter, BaseFilters } from './base';

export class MockAdapter<T, CreateDto, UpdateDto> extends BaseApiAdapter<T, CreateDto, UpdateDto> {
  private store: Map<string, T> = new Map();
  
  constructor(tableName: string) {
    super(tableName);
  }

  async getAll(filters?: BaseFilters): Promise<T[]> {
    const values = Array.from(this.store.values());
    
    // Apply limit/offset if present
    if (filters) {
      let result = [...values];

      // Apply search if present
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter((item: any) => {
          // Naive search across all string values
          return Object.values(item).some(val => 
            typeof val === 'string' && val.toLowerCase().includes(query)
          );
        });
      }
      
      // Sort (mock: by created_at desc if available, otherwise unstable)
      result.sort((a: any, b: any) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });

      if (filters.offset) {
        result = result.slice(filters.offset);
      }
      if (filters.limit) {
        result = result.slice(0, filters.limit);
      }
      return result;
    }

    return values;
  }

  async getById(id: string): Promise<T> {
    const item = this.store.get(id);
    if (!item) {
      throw new Error(`Record with id ${id} not found`);
    }
    return item;
  }

  async create(data: CreateDto): Promise<T> {
    const id = crypto.randomUUID();
    const newItem = {
      _id: id,
      id, // compatibility
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    } as unknown as T;
    
    this.store.set(id, newItem);
    return newItem;
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
