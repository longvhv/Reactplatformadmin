/**
 * Service Packages Adapter
 * Custom adapter với field mapping và status conversion
 */

import { SupabaseAdapter } from './supabase';

export class ServicePackagesAdapter<T, CreateDto, UpdateDto> extends SupabaseAdapter<T, CreateDto, UpdateDto> {
  /**
   * Map database row to API response format
   * Handles special conversion for is_active -> status
   */
  protected mapFromDb(row: any): any {
    if (!row) return row;

    // First apply standard field mapping
    const mapped = super.mapFromDb(row);

    // Convert is_active (boolean) to status (enum)
    if (mapped.is_active !== undefined) {
      mapped.status = mapped.is_active ? 'ACTIVE' : 'INACTIVE';
      delete mapped.is_active;
    }

    return mapped;
  }

  /**
   * Map API request to database format
   * Handles special conversion for status -> is_active
   */
  protected mapToDb(data: any): any {
    if (!data) return data;

    const mapped = { ...data };

    // Convert status (enum) to is_active (boolean)
    if (mapped.status !== undefined) {
      mapped.is_active = mapped.status === 'ACTIVE';
      delete mapped.status;
    }

    // Apply standard field mapping
    return super.mapToDb(mapped);
  }
}
