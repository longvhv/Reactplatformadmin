/**
 * TenantInvitationsTab Component
 * Manages email-based invitations for tenant members
 * Design inspired by GitHub/Slack invitation systems
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  Mail,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  Ban,
  Link as LinkIcon,
  Calendar,
  Filter,
  Edit,
} from 'lucide-react';
import {
  tenantInvitationsApi,
  TenantInvitation,
  InvitationStatus,
  CreateInvitationRequest,
  UpdateInvitationRequest,
  getStatusColor,
  getStatusLabel,
  formatTimeUntilExpiry,
  formatTimeSinceCreation,
} from '../../api/tenantInvitationsApi';
import { TenantInvitationForm } from '../tenant-invitations/TenantInvitationForm';
import { ShowInvitationLinkModal } from '../tenant-invitations/ShowInvitationLinkModal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';

interface TenantInvitationsTabProps {
  tenantId: string;
}

export const TenantInvitationsTab: React.FC<TenantInvitationsTabProps> = ({ 
  tenantId 
}) => {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvitationLinkModal, setShowInvitationLinkModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<TenantInvitation | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<TenantInvitation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<InvitationStatus | 'ALL'>('ALL');

  // Load invitations
  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantInvitationsApi.getByTenant(tenantId);
      setInvitations(data);
    } catch (err) {
      setError(t('invitations.fetchError') || 'Failed to fetch invitations');
      console.error('Error loading invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadInvitations();
    }
  }, [tenantId]);

  // Handle create submit
  const handleCreateSubmit = async (data: CreateInvitationRequest | UpdateInvitationRequest) => {
    try {
      setSubmitting(true);
      const newInvitation = await tenantInvitationsApi.create(data as CreateInvitationRequest);
      
      toast.success(t('common.success') || 'Invitation sent successfully');
      setShowCreateModal(false);
      setSelectedInvitation(newInvitation);
      setShowInvitationLinkModal(true);
      loadInvitations();
    } catch (err: any) {
      toast.error(t('common.error') || 'Error', { description: err.message || 'Failed to send invitation' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async (data: CreateInvitationRequest | UpdateInvitationRequest) => {
    if (!editingInvitation) return;
    
    try {
      setSubmitting(true);
      await tenantInvitationsApi.update(editingInvitation._id, data as UpdateInvitationRequest);
      
      toast.success(t('common.success') || 'Invitation updated successfully');
      setEditingInvitation(null);
      loadInvitations();
    } catch (err: any) {
      toast.error(t('common.error') || 'Error', { description: err.message || 'Failed to update invitation' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(t('invitations.confirmDelete', { email }) || `Are you sure you want to delete invitation for ${email}?`)) return;

    try {
      await tenantInvitationsApi.delete(id);
      await loadInvitations();
      toast.success(t('common.success') || 'Invitation deleted successfully');
    } catch (err) {
      toast.error(t('common.error') || 'Error', { description: 'Failed to delete invitation' });
      console.error('Error deleting invitation:', err);
    }
  };

  // Handle revoke
  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(t('invitations.confirmRevoke', { email }) || `Are you sure you want to revoke invitation for ${email}?`)) return;

    try {
      await tenantInvitationsApi.revoke(id);
      await loadInvitations();
      toast.success(t('common.success') || 'Invitation revoked successfully');
    } catch (err) {
      toast.error(t('common.error') || 'Error', { description: 'Failed to revoke invitation' });
      console.error('Error revoking invitation:', err);
    }
  };

  // Handle resend
  const handleResend = async (id: string) => {
    try {
      const newInvitation = await tenantInvitationsApi.resend(id);
      setSelectedInvitation(newInvitation);
      setShowInvitationLinkModal(true);
      await loadInvitations();
      toast.success(t('common.success') || 'Invitation resent successfully');
    } catch (err: any) {
      toast.error(t('common.error') || 'Error', { description: err.message || 'Failed to resend invitation' });
      console.error('Error resending invitation:', err);
    }
  };

  // Handle show link
  const handleShowLink = (invitation: TenantInvitation) => {
    setSelectedInvitation(invitation);
    setShowInvitationLinkModal(true);
  };

  if (loading && !invitations.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  // Filter invitations
  const filteredInvitations = filterStatus === 'ALL' 
    ? invitations 
    : invitations.filter(inv => inv.status === filterStatus);

  // Stats
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'PENDING').length,
    accepted: invitations.filter(i => i.status === 'ACCEPTED').length,
    expired: invitations.filter(i => i.status === 'EXPIRED').length,
    revoked: invitations.filter(i => i.status === 'REVOKED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('invitations.title') || 'Invitations'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('invitations.subtitle') || 'Manage email-based invitations for tenant members.'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('invitations.sendInvitation') || 'Send Invitation'}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              {t('invitations.howInvitationsWork') || 'How invitations work'}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('invitations.invitationsDescription') || 'Invite members by email. They will receive a link to join your tenant. You can assign roles and departments.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {invitations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Mail className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('invitations.totalInvitations') || 'Total'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('invitations.pending') || 'Pending'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('invitations.accepted') || 'Accepted'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('invitations.expired') || 'Expired'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-lg p-2">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('invitations.revoked') || 'Revoked'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.revoked}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      {invitations.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as InvitationStatus | 'ALL')}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">{t('invitations.allStatuses') || 'All Statuses'}</option>
            <option value="PENDING">{t('invitations.pending') || 'Pending'}</option>
            <option value="ACCEPTED">{t('invitations.accepted') || 'Accepted'}</option>
            <option value="EXPIRED">{t('invitations.expired') || 'Expired'}</option>
            <option value="REVOKED">{t('invitations.revoked') || 'Revoked'}</option>
          </select>
          <span className="text-sm text-gray-500">
            {filteredInvitations.length} {t('invitations.results') || 'results'}
          </span>
        </div>
      )}

      {/* Invitations List */}
      {filteredInvitations.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.email') || 'Email'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.expiresAt') || 'Expires At'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.invitedAt') || 'Invited At'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => {
                  const statusColor = getStatusColor(invitation.status);
                  const isExpired = new Date(invitation.expires_at) < new Date() && invitation.status === 'PENDING';
                  const effectiveStatus = isExpired ? 'EXPIRED' : invitation.status;
                  
                  return (
                    <tr key={invitation._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{invitation.email}</span>
                        </div>
                        {invitation.role_ids && invitation.role_ids.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {invitation.role_ids.join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`${statusColor} flex items-center gap-1 w-fit`}
                        >
                          {effectiveStatus === 'PENDING' && <Clock className="h-3 w-3" />}
                          {effectiveStatus === 'ACCEPTED' && <CheckCircle className="h-3 w-3" />}
                          {effectiveStatus === 'EXPIRED' && <Calendar className="h-3 w-3" />}
                          {effectiveStatus === 'REVOKED' && <Ban className="h-3 w-3" />}
                          {getStatusLabel(effectiveStatus as InvitationStatus)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatTimeUntilExpiry(invitation.expires_at)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTimeSinceCreation(invitation.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {invitation.status === 'PENDING' && !isExpired && (
                            <>
                              <button
                                onClick={() => handleShowLink(invitation)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                title={t('invitations.showLink') || 'Show Link'}
                              >
                                <LinkIcon className="h-4 w-4" />
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => setEditingInvitation(invitation)}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                title={t('common.edit') || 'Edit'}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleResend(invitation._id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title={t('invitations.resend') || 'Resend'}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleRevoke(invitation._id, invitation.email)}
                                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                title={t('invitations.revoke') || 'Revoke'}
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(invitation.status === 'EXPIRED' || isExpired) && (
                            <button
                              onClick={() => handleResend(invitation._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              title={t('invitations.resend') || 'Resend'}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          {(invitation.status === 'ACCEPTED' || invitation.status === 'REVOKED' || isExpired || invitation.status === 'EXPIRED') && (
                            <>
                              {(invitation.status === 'ACCEPTED' || invitation.status === 'REVOKED') && <span className="text-gray-300">|</span>}
                              <button
                                onClick={() => handleDelete(invitation._id, invitation.email)}
                                className="text-red-600 hover:text-red-800"
                                title={t('invitations.delete') || 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filterStatus === 'ALL' 
              ? (t('invitations.noInvitations') || 'No invitations found.')
              : (t('invitations.noInvitationsWithStatus', { status: filterStatus.toLowerCase() }) || `No ${filterStatus.toLowerCase()} invitations found.`)}
          </p>
          {filterStatus === 'ALL' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('invitations.sendFirstInvitation') || 'Send First Invitation'}
            </Button>
          )}
        </div>
      )}

      {/* Unified Modal Container */}
      {(showCreateModal || editingInvitation) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <TenantInvitationForm 
                tenantId={tenantId}
                initialData={editingInvitation || undefined}
                onSubmit={editingInvitation ? handleUpdateSubmit : handleCreateSubmit}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingInvitation(null);
                }}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Show Invitation Link Modal */}
      {showInvitationLinkModal && selectedInvitation && (
        <ShowInvitationLinkModal
          invitation={selectedInvitation}
          onClose={() => {
            setShowInvitationLinkModal(false);
            setSelectedInvitation(null);
          }}
        />
      )}
    </div>
  );
};
