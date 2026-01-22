/**
 * useSystemJobs Hook
 * Hook for managing system jobs
 */

import { useState, useEffect, useCallback } from 'react';
import {
  systemJobsApi,
  SystemJob,
  CreateJobRequest,
  UpdateJobRequest,
  JobFilters,
} from '../api/systemJobsApi';

interface UseSystemJobsOptions extends JobFilters {
  autoLoad?: boolean;
}

export function useSystemJobs(options: UseSystemJobsOptions = {}) {
  const [jobs, setJobs] = useState<SystemJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await systemJobsApi.getAll(options);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system jobs');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  const createJob = async (data: CreateJobRequest) => {
    try {
      const newJob = await systemJobsApi.create(data);
      setJobs(prev => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      throw err;
    }
  };

  const updateJob = async (id: string, data: UpdateJobRequest) => {
    try {
      const updated = await systemJobsApi.update(id, data);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await systemJobsApi.delete(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const executeJob = async (id: string) => {
    try {
      const updated = await systemJobsApi.execute(id);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadJobs();
    }
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    loadJobs,
    createJob,
    updateJob,
    deleteJob,
    executeJob
  };
}

export function useSystemJob(id: string | undefined) {
  const [job, setJob] = useState<SystemJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await systemJobsApi.getById(id);
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { job, loading, error, refresh };
}
