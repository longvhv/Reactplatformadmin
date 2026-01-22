/**
 * useUserSessions Hook
 * React hook for managing user sessions
 * 
 * ✅ UPDATED: Sync with userSessionsApi
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  userSessionsApi,
  UserSession,
  SessionFilters,
  CreateSessionRequest,
  UpdateSessionRequest
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
      const msg = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(msg);
      console.error('Error fetching sessions:', err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create session
  const createSession = useCallback(async (data: CreateSessionRequest): Promise<UserSession> => {
    try {
      const created = await userSessionsApi.create(data);
      await fetchSessions();
      toast.success('Session created successfully');
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchSessions]);

  // Update session
  const updateSession = useCallback(async (id: string, data: UpdateSessionRequest): Promise<UserSession> => {
    try {
      const updated = await userSessionsApi.update(id, data);
      await fetchSessions();
      toast.success('Session updated successfully');
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update session';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchSessions]);

  // Revoke session (Soft "lock")
  const revokeSession = useCallback(async (id: string): Promise<UserSession> => {
    try {
      const revoked = await userSessionsApi.revokeSession(id);
      await fetchSessions();
      toast.success('Session revoked successfully');
      return revoked;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke session';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchSessions]);

  // Delete session (Hard delete)
  const deleteSession = useCallback(async (id: string): Promise<void> => {
    try {
      await userSessionsApi.delete(id);
      await fetchSessions();
      toast.success('Session deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchSessions]);

  // Cleanup expired sessions
  const cleanupExpired = useCallback(async (userId?: string): Promise<number> => {
    try {
      const count = await userSessionsApi.cleanupExpired(userId);
      await fetchSessions();
      if (count > 0) toast.success(`Cleaned up ${count} expired sessions`);
      return count;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cleanup sessions';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchSessions]);

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    revokeSession,
    deleteSession,
    cleanupExpired,
    refresh: fetchSessions,
  };
}

export default useUserSessions;
