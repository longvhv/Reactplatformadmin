/**
 * Dashboard Hook - Real-time data fetching
 * Provides dashboard statistics, activities, and charts data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardOverview,
  getRecentActivities,
  getUserGrowthChart,
  getTenantGrowthChart,
  transformToStatCards,
  type DashboardStats,
  type Activity,
  type ChartDataPoint,
  type DashboardOverview,
} from '../services/dashboardService';

interface UseDashboardReturn {
  stats: DashboardStats[];
  activities: Activity[];
  userGrowthData: ChartDataPoint[];
  tenantGrowthData: ChartDataPoint[];
  overview: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);
  const [tenantGrowthData, setTenantGrowthData] = useState<ChartDataPoint[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [overviewData, recentActivities, userGrowth, tenantGrowth] = await Promise.all([
        getDashboardOverview(),
        getRecentActivities(10),
        getUserGrowthChart(),
        getTenantGrowthChart(),
      ]);

      // Update state
      setOverview(overviewData);
      setStats(transformToStatCards(overviewData));
      setActivities(recentActivities);
      setUserGrowthData(userGrowth);
      setTenantGrowthData(tenantGrowth);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    activities,
    userGrowthData,
    tenantGrowthData,
    overview,
    loading,
    error,
    refetch: fetchData,
  };
}