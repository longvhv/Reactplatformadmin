/**
 * Service Packages Adapter
 * Custom adapter với field mapping và status conversion
 */

import { SupabaseAdapter } from './supabase';

export class ServicePackagesAdapter<T, CreateDto, UpdateDto> extends SupabaseAdapter<T, CreateDto, UpdateDto> {
  /**
   * Map database row to API response format
   * Handles 3-state status: ACTIVE, INACTIVE, ARCHIVED
   * 
   * Logic:
   * - deleted_at IS NOT NULL → ARCHIVED
   * - is_active = true → ACTIVE
   * - is_active = false → INACTIVE
   */
  protected mapFromDb(row: any): any {
    if (!row) return row;

    // First apply standard field mapping
    const mapped = super.mapFromDb(row);

    // Determine status based on deleted_at and is_active
    if (mapped.deleted_at !== null && mapped.deleted_at !== undefined) {
      // Soft deleted = ARCHIVED
      mapped.status = 'ARCHIVED';
    } else if (mapped.is_active) {
      mapped.status = 'ACTIVE';
    } else {
      mapped.status = 'INACTIVE';
    }

    delete mapped.is_active;
    return mapped;
  }

  /**
   * Map API request to database format
   * Handles 3-state status conversion
   * 
   * Logic:
   * - ARCHIVED → set deleted_at = now, is_active = false
   * - ACTIVE → set is_active = true, clear deleted_at
   * - INACTIVE → set is_active = false, clear deleted_at
   */
  protected mapToDb(data: any): any {
    if (!data) return data;

    const mapped = { ...data };

    // Handle status conversion including ARCHIVED
    if (mapped.status !== undefined) {
      if (mapped.status === 'ARCHIVED') {
        // Archive = soft delete
        mapped.deleted_at = new Date().toISOString();
        mapped.is_active = false;
      } else if (mapped.status === 'ACTIVE') {
        // Active = clear soft delete, set active
        mapped.deleted_at = null;
        mapped.is_active = true;
      } else {
        // Inactive = clear soft delete, set inactive
        mapped.deleted_at = null;
        mapped.is_active = false;
      }
      delete mapped.status;
    }

    // Apply standard field mapping
    return super.mapToDb(mapped);
  }
}