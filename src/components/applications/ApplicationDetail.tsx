/**
 * Application Detail Component
 * Displays detailed information about an application including all capabilities
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { applicationsApi } from '@/api/applicationsApi';
import { appCapabilityApi } from '@/api/appCapabilityApi';
import { useApplicationWithCapabilities } from '@/hooks/useApplicationWithCapabilities';

// Helper functions for inline capability modal
// Note: These are simplified versions for the inline modal
// TODO: Refactor to use full appCapabilityApi types
const formatCapabilityType = (type: string) => type;
const getCapabilityTypeIcon = (type: string) => type === 'BOOLEAN' ? '🔘' : '🔢';
const formatDefaultValue = (value: any, type: string) => {
  if (type === 'BOOLEAN') return value ? 'true' : 'false';
  return String(value);
};

// Simplified capability interface for inline modal
// TODO: Migrate to full AppCapability interface
interface SimpleCapability {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'BOOLEAN' | 'NUMBER';
  default_value: boolean | number;
  is_active: boolean;
  version: number;
  deleted_at?: string | null;
}

export function ApplicationDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useApplicationWithCapabilities(code);

  const [showCreateCapability, setShowCreateCapability] = useState(false);

  const handleDelete = async () => {
    if (!code) return;

    if (!confirm(`Are you sure you want to delete application ${code}?`)) {
      return;
    }

    try {
      await applicationsApi.delete(code);
      alert('Application deleted successfully');
      navigate('/core/applications');
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleActive = async () => {
    if (!code || !data) return;

    try {
      await applicationsApi.update(code, { is_active: !data.is_active });
      alert('Application status updated');
      refresh();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCapability = async (capabilityId: string, capabilityCode: string) => {
    if (!confirm(`Are you sure you want to delete capability ${capabilityCode}?`)) {
      return;
    }

    try {
      await appCapabilityApi.delete(capabilityId);
      alert('Capability deleted successfully');
      refresh();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleCapability = async (capabilityId: string, currentStatus: boolean) => {
    try {
      await appCapabilityApi.update(capabilityId, { is_active: !currentStatus });
      alert('Capability status updated');
      refresh();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                onClick={() => setShowCreateCapability(true)}
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
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No capabilities yet</h3>
            <p className="text-gray-600 mb-4">
              Add capabilities to define features and limits for this application
            </p>
            {!data.deleted_at && (
              <button
                onClick={() => setShowCreateCapability(true)}
                className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Capability
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.capabilities.map((capability) => (
              <div key={capability._id} className="p-6 hover:bg-gray-50">
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
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          capability.type === 'BOOLEAN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {capability.type}
                      </span>
                      {capability.deleted_at ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Deleted
                        </span>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            capability.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {capability.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>

                    {capability.description && (
                      <p className="text-sm text-gray-700 mb-3">{capability.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Default Value:</span>{' '}
                        <span className="font-mono font-semibold text-gray-900">
                          {formatDefaultValue(capability.default_value, capability.type)}
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
                        onClick={() =>
                          handleToggleCapability(capability._id, capability.is_active)
                        }
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        {capability.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDeleteCapability(capability._id, capability.code)}
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

      {/* Usage Examples */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Package Configuration Example
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Use this application in service package entitlements:
        </p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm">
          <code>{`{
  "code": "BASIC_PLAN",
  "entitlements_config": {
    "${data.code}": {${
      data.capabilities.length > 0
        ? `\n      ${data.capabilities
            .filter((c) => !c.deleted_at)
            .map(
              (c) =>
                `"${c.code}": ${
                  c.type === 'BOOLEAN'
                    ? 'false'
                    : typeof c.default_value === 'number'
                    ? c.default_value
                    : JSON.stringify(c.default_value)
                }`
            )
            .join(',\n      ')}\n    `
        : '\n      // Add capability values here\n    '
    }}
  }
}`}</code>
        </pre>
      </div>

      {/* Create Capability Modal */}
      {showCreateCapability && (
        <CreateCapabilityModal
          appCode={data.code}
          onClose={() => setShowCreateCapability(false)}
          onSuccess={() => {
            setShowCreateCapability(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// Create Capability Modal Component
function CreateCapabilityModal({
  appCode,
  onClose,
  onSuccess,
}: {
  appCode: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'NUMBER' as 'BOOLEAN' | 'NUMBER',
    default_value: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code) {
      newErrors.code = 'Code is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must be lowercase_snake_case';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.default_value) {
      newErrors.default_value = 'Default value is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      let parsedValue: any;
      if (formData.type === 'BOOLEAN') {
        parsedValue = formData.default_value === 'true';
      } else {
        parsedValue = parseFloat(formData.default_value);
        if (isNaN(parsedValue)) {
          setErrors({ default_value: 'Invalid number' });
          return;
        }
      }

      await appCapabilityApi.create(appCode, {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        default_value: parsedValue,
        description: formData.description || undefined,
        is_active: formData.is_active,
      });

      onSuccess();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add Capability</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toLowerCase() })
              }
              placeholder="max_users"
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.code ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-500 mt-1">Format: lowercase_snake_case</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Maximum Users"
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'BOOLEAN' | 'NUMBER' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="NUMBER">NUMBER - Numeric limits (e.g., max_users, storage_gb)</option>
              <option value="BOOLEAN">BOOLEAN - Feature toggles (e.g., enable_ai_matching)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Value <span className="text-red-500">*</span>
            </label>
            {formData.type === 'BOOLEAN' ? (
              <select
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.default_value ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select...</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                type="number"
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                placeholder="10"
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.default_value ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            )}
            {errors.default_value && (
              <p className="text-sm text-red-600 mt-1">{errors.default_value}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Maximum number of users allowed"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Capability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}