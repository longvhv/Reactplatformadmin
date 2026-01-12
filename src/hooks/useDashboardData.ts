import { useState, useEffect, useCallback } from 'react';
import { statsApi, activitiesApi, type Stat, type Activity } from '@/services/dashboardApi';

export function useDashboardData() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    const loadedStats = statsApi.getAll();
    const loadedActivities = activitiesApi.getRecent(5);
    setStats(loadedStats);
    setActivities(loadedActivities);
    setLoading(false);
  }, []);

  const updateStat = useCallback((id: number, updates: Partial<Omit<Stat, 'id' | 'createdAt'>>) => {
    const updated = statsApi.updateStat(id, updates);
    if (updated) {
      setStats(statsApi.getAll());
    }
  }, []);

  const addActivity = useCallback((data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    activitiesApi.addActivity(data);
    setActivities(activitiesApi.getRecent(5));
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    stats,
    activities,
    loading,
    updateStat,
    addActivity,
    refreshData,
  };
}
