/**
 * Application Detail Component
 * Displays detailed information about an application including all capabilities
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { applicationsApi } from '../../api/applicationsApi';
import { appCapabilitiesApi, AppCapability } from '../../api/appCapabilitiesApi';
import { useApplicationWithCapabilities } from '../../hooks/useApplicationWithCapabilities';
import { AppCapabilityForm } from './AppCapabilityForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { showToast } from '../../lib/toast';

// Helper functions for display
const getCapabilityTypeIcon = (type: string) => type === 'FEATURE' ? '✨' : '🔢';

const formatDefaultValue = (val: any) => {
  if (typeof val?.enabled === 'boolean') return val.enabled ? 'Enabled' : 'Disabled';
  if (typeof val?.value !== 'undefined') {
    return `${val.value} ${val.unit || ''}`;
  }
  return JSON.stringify(val);
};

export function ApplicationDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useApplicationWithCapabilities(code);

  const [showCapabilityModal, setShowCapabilityModal] = useState(false);
  const [editingCapability, setEditingCapability] = useState<AppCapability | undefined>(undefined);

  const handleDelete = async () => {
    if (!code) return;

    if (!confirm(`Are you sure you want to delete application ${code}?`)) {
      return;
    }

    try {
      await applicationsApi.delete(code);
      showToast.success('Success', 'Application deleted successfully');
      navigate('/core/applications');
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleToggleActive = async () => {
    if (!code || !data) return;

    try {
      await applicationsApi.update(code, { is_active: !data.is_active });
      showToast.success('Success', 'Application status updated');
      refresh();
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDeleteCapability = async (capability: AppCapability) => {
    if (!confirm(`Are you sure you want to delete capability ${capability.code}?`)) {
      return;
    }

    try {
      await appCapabilitiesApi.delete(capability._id, capability.version);
      showToast.success('Success', 'Capability deleted successfully');
      refresh();
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleToggleCapability = async (capability: AppCapability) => {
    try {
      const newStatus = capability.status === 'active' ? 'inactive' : 'active';
      await appCapabilitiesApi.update(capability._id, { 
        status: newStatus, 
        version: capability.version 
      });
      showToast.success('Success', 'Capability status updated');
      refresh();
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleEditCapability = (capability: AppCapability) => {
    setEditingCapability(capability);
    setShowCapabilityModal(true);
  };

  const handleAddCapability = () => {
    setEditingCapability(undefined);
    setShowCapabilityModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {error || 'Application not found'}
          </p>
        </div>
        <Link
          to="/core/applications"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link to="/core/applications" className="hover:text-indigo-600">
          Applications
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{data.code}</span>
      </nav>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
              {data.deleted_at ? (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                  Deleted
                </span>
              ) : (
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    data.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {data.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-gray-600 mb-4">{data.code}</p>
            {data.description && (
              <p className="text-gray-700">{data.description}</p>
            )}

            {/* Metadata */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>{' '}
                <span className="text-gray-900 font-medium">
                  {new Date(data.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Updated:</span>{' '}
                <span className="text-gray-900 font-medium">
                  {new Date(data.updated_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Version:</span>{' '}
                <span className="text-gray-900 font-medium">v{data.version}</span>
              </div>
              <div>
                <span className="text-gray-600">Capabilities:</span>{' '}
                <span className="text-gray-900 font-medium">{data.capabilities.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!data.deleted_at && (
            <div className="flex items-center gap-2">
              <Link
                to={`/core/applications/${data.code}/edit`}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Edit
              </Link>
              <button
                onClick={handleToggleActive}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {data.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Capabilities ({data.capabilities.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Features and limits for this application
              </p>
            </div>
            {!data.deleted_at && (
              <button
                onClick={handleAddCapability}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                + Add Capability
              </button>
            )}
          </div>
        </div>

        {data.capabilities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No capabilities yet</h3>
            <p className="text-gray-600 mb-4">
              Add capabilities to define features and limits for this application
            </p>
            {!data.deleted_at && (
              <button
                onClick={handleAddCapability}
                className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Capability
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.capabilities.map((capability) => (
              <div key={capability._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCapabilityTypeIcon(capability.type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {capability.name}
                        </h3>
                        <p className="text-sm font-mono text-gray-600">{capability.code}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        capability.type === 'FEATURE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {capability.type}
                      </span>
                      {capability.deleted_at ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Deleted
                        </span>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          capability.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {capability.status}
                        </span>
                      )}
                    </div>

                    {capability.description && (
                      <p className="text-sm text-gray-700 mb-3">{capability.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Default:</span>{' '}
                        <span className="font-mono font-semibold text-gray-900">
                          {formatDefaultValue(capability.default_value)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Version:</span>{' '}
                        <span className="text-gray-900">v{capability.version}</span>
                      </div>
                    </div>
                  </div>

                  {!capability.deleted_at && !data.deleted_at && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                         onClick={() => handleEditCapability(capability)}
                         className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleToggleCapability(capability)}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        {capability.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDeleteCapability(capability)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capability Modal */}
      <Dialog open={showCapabilityModal} onOpenChange={setShowCapabilityModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCapability ? 'Edit Capability' : 'Add Capability'}
            </DialogTitle>
          </DialogHeader>
          <AppCapabilityForm
            initialData={editingCapability}
            tenantId={data.tenant_id} // Should ideally come from context/auth
            appId={data._id}
            onSubmit={async (reqData) => {
              if (editingCapability) {
                 await appCapabilitiesApi.update(editingCapability._id, reqData as any);
                 showToast.success('Success', 'Capability updated');
              } else {
                 await appCapabilitiesApi.create(reqData as any);
                 showToast.success('Success', 'Capability created');
              }
              setShowCapabilityModal(false);
              refresh();
            }}
            onCancel={() => setShowCapabilityModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}