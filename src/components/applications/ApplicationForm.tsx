/**
 * Application Form Component
 * Create and Edit application forms with validation
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import {
  useApplication,
  applicationsApi,
  isValidAppCode,
} from '../../api/applicationsApi';

export function ApplicationForm({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { application, loading } = useApplication(mode === 'edit' ? code : undefined);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && application) {
      setFormData({
        code: application.code,
        name: application.name,
        description: application.description || '',
        is_active: application.is_active,
      });
    }
  }, [mode, application]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code) {
      newErrors.code = 'Code is required';
    } else if (!isValidAppCode(formData.code)) {
      newErrors.code =
        'Code must be UPPERCASE_SNAKE_CASE (e.g., HRM_RECRUIT, CRM_SALES_V2)';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (mode === 'create') {
        const app = await applicationsApi.create({
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
        });
        alert('Application created successfully!');
        navigate(`/core/applications/${app.code}`);
      } else {
        await applicationsApi.update(code!, {
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
        });
        alert('Application updated successfully!');
        navigate(`/core/applications/${code}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'edit' && loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (mode === 'edit' && !application) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Application not found</p>
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
        {mode === 'edit' && code && (
          <>
            <Link to={`/core/applications/${code}`} className="hover:text-indigo-600">
              {code}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">
          {mode === 'create' ? 'Create' : 'Edit'}
        </span>
      </nav>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create Application' : 'Edit Application'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'create'
              ? 'Define a new technical application with unique code'
              : 'Update application information'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              disabled={mode === 'edit'}
              placeholder="HRM_RECRUIT"
              className={`w-full px-3 py-2 border rounded-lg font-mono ${
                mode === 'edit'
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                  : errors.code
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
            />
            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Format: UPPERCASE_SNAKE_CASE (e.g., HRM_RECRUIT, CRM_SALES_V2)
              {mode === 'edit' && ' • Code cannot be changed after creation'}
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="HRM - Recruitment Module"
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Friendly name displayed in UI (max 255 characters)
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Recruitment and candidate management features including job postings, candidate tracking, interview scheduling, and AI-powered matching."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Detailed description of application features and purpose
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {formData.is_active
                  ? 'Application is active and can be used in service packages'
                  : 'Application is inactive and hidden from package creation'}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Next Steps</h3>
                <p className="text-sm text-blue-700">
                  {mode === 'create'
                    ? 'After creating this application, you can add capabilities (features and limits) that service packages can configure.'
                    : 'Manage capabilities for this application on the detail page.'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              to={mode === 'edit' ? `/core/applications/${code}` : '/core/applications'}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                submitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {submitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                ? 'Create Application'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Code Format Examples */}
      {mode === 'create' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Code Format Examples</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-green-700 mb-2">✅ Valid Codes</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="text-gray-700">HRM_RECRUIT</div>
                <div className="text-gray-700">CRM_SALES_V2</div>
                <div className="text-gray-700">ACCOUNTING_2024</div>
                <div className="text-gray-700">INVENTORY_MGMT</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-2">❌ Invalid Codes</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="text-gray-500 line-through">hrm-recruit (lowercase, dash)</div>
                <div className="text-gray-500 line-through">HRM.Recruit (dot, mixed case)</div>
                <div className="text-gray-500 line-through">HRM Recruitment (space)</div>
                <div className="text-gray-500 line-through">HRM-RECRUIT (dash)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
