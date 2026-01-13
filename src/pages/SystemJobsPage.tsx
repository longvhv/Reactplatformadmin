/**
 * System Jobs Management Page
 * Manage and monitor automated system processes
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { SystemJob, JOB_TYPES, JOB_STATUSES, JOB_PRIORITIES } from '../data/system-jobs-demo';
import { SystemJobsTable } from '../components/system-jobs/SystemJobsTable';
import { SystemJobForm } from '../components/system-jobs/SystemJobForm';
import { SystemJobStats } from '../components/system-jobs/SystemJobStats';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

export function SystemJobsPage() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<SystemJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<SystemJob | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    runningJobs: 0,
    failedJobs: 0,
    successRate: 0
  });

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await fetch(`${API_BASE}/system-jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const result = await response.json();
      setJobs(result.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/system-jobs/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [searchTerm, typeFilter, statusFilter, priorityFilter]);

  // Handle create
  const handleCreate = async (jobData: Partial<SystemJob>) => {
    try {
      const response = await fetch(`${API_BASE}/system-jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) throw new Error('Failed to create job');

      setShowForm(false);
      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error creating job:', error);
      alert(t('systemJobs.createError'));
    }
  };

  // Handle update
  const handleUpdate = async (id: string, jobData: Partial<SystemJob>) => {
    try {
      const response = await fetch(`${API_BASE}/system-jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) throw new Error('Failed to update job');

      setShowForm(false);
      setEditingJob(null);
      fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      alert(t('systemJobs.updateError'));
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(t('systemJobs.confirmDelete'))) return;

    try {
      const response = await fetch(`${API_BASE}/system-jobs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete job');

      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(t('systemJobs.deleteError'));
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}/system-jobs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/system-jobs/${id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to toggle active');

      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('systemJobs.title')}</h1>
            <p className="text-gray-600 mt-1">{t('systemJobs.subtitle')}</p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('systemJobs.addJob')}
          </button>
        </div>

        {/* Stats */}
        <SystemJobStats stats={stats} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('systemJobs.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('systemJobs.allTypes')}</option>
              {JOB_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(`systemJobs.${type.value}`)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('systemJobs.allStatuses')}</option>
              {JOB_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {t(`systemJobs.${status.value}`)}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('systemJobs.allPriorities')}</option>
              {JOB_PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {t(`systemJobs.${priority.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {t('common.showing')} <span className="font-medium">{jobs.length}</span> {t('systemJobs.jobs')}
            </p>
            <button
              onClick={() => {
                fetchJobs();
                fetchStats();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh')}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">{t('systemJobs.noJobs')}</p>
          </div>
        ) : (
          <SystemJobsTable
            jobs={jobs}
            onEdit={(job) => {
              setEditingJob(job);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onToggleActive={handleToggleActive}
          />
        )}

        {/* Form Modal */}
        {showForm && (
          <SystemJobForm
            job={editingJob}
            onSave={(data) => {
              if (editingJob) {
                handleUpdate(editingJob.id, data);
              } else {
                handleCreate(data);
              }
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingJob(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
