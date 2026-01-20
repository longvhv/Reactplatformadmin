/**
 * Get registration trend data for charts
 */
export const getRegistrationTrend = async (
  days: number = 30,
  filters?: Pick<UserRegistrationFilters, 'tenant_id' | 'registration_source' | 'data_region'>
): Promise<{ date: string; count: number }[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .schema('telemetry')
      .from('user_registration_logs')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.registration_source) {
      query = query.eq('registration_source', filters.registration_source);
    }

    if (filters?.data_region) {
      query = query.eq('data_region', filters.data_region);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const dateMap: Record<string, number> = {};
    data?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    // Convert to array and sort
    const trend = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trend;
  } catch (error) {
    console.error('Error fetching registration trend:', error);
    throw error;
  }
};

// ==================== API CLIENT ====================

/**
 * User Registration Logs API Client
 * Unified object export for consistent usage pattern
 */
export const userRegistrationLogsApi = {
  // CRUD Operations
  getAll: getUserRegistrationLogs,
  getById: getUserRegistrationLogById,
  create: createUserRegistrationLog,
  update: updateUserRegistrationLog,
  delete: deleteUserRegistrationLog,

  // Statistics & Analytics
  getStats: getUserRegistrationStats,
  getTrend: getRegistrationTrend,

  // Metadata
  getRegistrationSources,
  getDataRegions,
};

// Alias for backward compatibility
export const userRegistrationsApi = userRegistrationLogsApi;

export default userRegistrationLogsApi;