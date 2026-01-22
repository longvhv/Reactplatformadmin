/**
 * MemberDetailModal Component
 * Modal for viewing tenant member details
 * ✅ Fully aligned with tenant_members schema and EnrichedTenantMember
 */

import React from 'react';
import {
  X,
  User,
  Mail,
  Briefcase,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Crown,
  Users,
  Eye,
  FileText,
} from 'lucide-react';
import { EnrichedTenantMember } from '../../api/tenantMembersApi';
import { useTranslation } from '../../providers/LanguageProvider';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: EnrichedTenantMember | null;
}

export function MemberDetailModal({ isOpen, onClose, member }: MemberDetailModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !member) return null;

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatDateOnly = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const calculateTenure = () => {
    if (!member.joined_at) return 'N/A';
    const joinDate = new Date(member.joined_at);
    const endDate = member.left_at ? new Date(member.left_at) : new Date();
    const days = Math.floor((endDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years ${Math.floor((days % 365) / 30)} months`;
  };

  const getRoleBadge = () => {
    const config = {
      OWNER: { color: 'bg-purple-100 text-purple-700', icon: Crown, label: t('common.owner') || 'Owner' },
      ADMIN: { color: 'bg-blue-100 text-blue-700', icon: Shield, label: t('common.admin') || 'Admin' },
      MEMBER: { color: 'bg-gray-100 text-gray-700', icon: Users, label: t('common.member') || 'Member' },
      VIEWER: { color: 'bg-green-100 text-green-700', icon: Eye, label: t('common.viewer') || 'Viewer' },
    };
    const c = config[member.role];
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${c.color}`}>
        <Icon className="w-4 h-4" />
        {c.label}
      </span>
    );
  };

  const getStatusBadge = () => {
    const config = {
      ACTIVE: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
      ONBOARDING: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Onboarding' },
      SUSPENDED: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'Suspended' },
      RESIGNED: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Resigned' },
    };
    const c = config[member.status];
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${c.color}`}>
        <Icon className="w-4 h-4" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-semibold overflow-hidden">
                {member.user?.avatar_url ? (
                  <img src={member.user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  member.user?.full_name?.charAt(0) || '?'
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {member.user?.full_name || 'Unknown User'}
                </h2>
                <p className="text-sm text-gray-500">{member.user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getRoleBadge()}
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Tenure
              </div>
              <p className="text-2xl font-bold text-blue-700">{calculateTenure()}</p>
              <p className="text-xs text-blue-600 mt-1">Duration</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                <Shield className="w-4 h-4" />
                Permissions
              </div>
              <p className="text-2xl font-bold text-purple-700">{member.permissions?.length || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Explicit Grants</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                <FileText className="w-4 h-4" />
                Version
              </div>
              <p className="text-2xl font-bold text-green-700">v{member.version}</p>
              <p className="text-xs text-green-600 mt-1">Record Version</p>
            </div>
          </div>

          {/* Employee Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employee Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Employee Code</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {member.employee_code || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Internal Email</label>
                <p className="text-sm text-gray-900 mt-1">{member.internal_email || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Job Title</label>
                <p className="text-sm text-gray-900 mt-1">{member.job_title || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Manager</label>
                <p className="text-sm text-gray-900 mt-1">
                  {member.manager ? (
                    <span>
                      {member.manager.user?.full_name || 'Unknown'}
                    </span>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              System User
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">User ID</label>
                <p className="text-sm font-mono text-gray-900 mt-1 break-all">{member.user_id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Email</label>
                <p className="text-sm text-gray-900 mt-1">{member.user?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Joined At</p>
                </div>
                <p className="text-sm text-gray-900">{formatDateOnly(member.joined_at)}</p>
              </div>
              {member.left_at && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-red-900">Left At</p>
                  </div>
                  <p className="text-sm text-red-900">{formatDateOnly(member.left_at)}</p>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Tenure</p>
                </div>
                <p className="text-sm font-semibold text-indigo-600">{calculateTenure()}</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {member.permissions && member.permissions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissions ({member.permissions.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.permissions.map((perm, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {member.metadata && Object.keys(member.metadata).length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(member.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Audit Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Audit Trail
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Created At</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(member.created_at)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Updated At</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(member.updated_at)}</p>
              </div>
              {member.deleted_at && (
                <>
                  <div>
                    <label className="text-xs text-red-500 uppercase">Deleted At</label>
                    <p className="text-sm text-red-900 mt-1">{formatDate(member.deleted_at)}</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase">Version</label>
                <p className="text-sm text-gray-900 mt-1">v{member.version}</p>
              </div>
            </div>
          </div>

          {/* IDs */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">System IDs</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 uppercase">Member ID</label>
                <p className="text-xs font-mono text-gray-900 mt-1 break-all">{member._id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Tenant ID</label>
                <p className="text-xs font-mono text-gray-900 mt-1 break-all">{member.tenant_id}</p>
              </div>
              {member.manager_id && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Manager ID</label>
                  <p className="text-xs font-mono text-gray-900 mt-1 break-all">{member.manager_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}