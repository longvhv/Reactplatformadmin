/**
 * useUserSessions Hook
 * React hook for managing user sessions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  userSessionsApi,
  UserSession,
  SessionFilters,
  CreateSessionData,
} from '../api/userSessionsApi';

export function useUserSessions(filters?: SessionFilters) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userSessionsApi.getAll(filters);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create session
  const createSession = async (data: CreateSessionData): Promise<UserSession> => {
    try {
      const created = await userSessionsApi.create(data);
      await fetchSessions();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      throw new Error(message);
    }
  };

  // Toggle lock
  const toggleLock = async (id: string): Promise<void> => {
    try {
      await userSessionsApi.toggleLock(id);
      await fetchSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle lock';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete session
  const deleteSession = async (id: string): Promise<void> => {
    try {
      await userSessionsApi.delete(id);
      await fetchSessions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete all inactive sessions
  const deleteInactiveSessions = async (userId: string): Promise<number> => {
    try {
      const count = await userSessionsApi.deleteInactive(userId);
      await fetchSessions();
      return count;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete sessions';
      setError(message);
      throw new Error(message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    createSession,
    toggleLock,
    deleteSession,
    deleteInactiveSessions,
    refresh: fetchSessions,
  };
}

export default useUserSessions;
