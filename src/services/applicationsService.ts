/**
 * Applications Service
 * Handles CRUD operations for applications
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '../utils/supabase/client';

// Application interface matching database schema
export interface Application {
  _id: string; // Primary Key
  id?: string; // Legacy support
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  icon_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active applications
 */
export async function fetchApplications(): Promise<Application[]> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[ApplicationsService] Error fetching applications:', error);
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }

    // Map _id to id for backward compatibility
    return (data || []).map((app: any) => ({
      ...app,
      id: app._id || app.id
    }));
  } catch (error: any) {
    console.error('[ApplicationsService] Unexpected error:', error);
    throw error;
  }
}

/**
 * Fetch application by ID
 */
export async function fetchApplicationById(id: string): Promise<Application | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .or(`_id.eq.${id},id.eq.${id}`) // Try both _id and id
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[ApplicationsService] Error fetching application:', error);
      throw new Error(`Failed to fetch application: ${error.message}`);
    }

    if (data) {
        data.id = data._id || data.id;
    }
    return data;
  } catch (error: any) {
    console.error('[ApplicationsService] Unexpected error:', error);
    throw error;
  }
}

/**
 * Fetch application by code
 */
export async function fetchApplicationByCode(code: string): Promise<Application | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[ApplicationsService] Error fetching application by code:', error);
      throw new Error(`Failed to fetch application: ${error.message}`);
    }

    if (data) {
        data.id = data._id || data.id;
    }
    return data;
  } catch (error: any) {
    console.error('[ApplicationsService] Unexpected error:', error);
    throw error;
  }
}

export default {
  fetchApplications,
  fetchApplicationById,
  fetchApplicationByCode,
};
