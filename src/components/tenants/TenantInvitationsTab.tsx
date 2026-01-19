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
  Copy,
  Check,
  AlertTriangle,
  Send,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Ban,
  Link as LinkIcon,
  Users,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  tenantInvitationsService,
  TenantInvitation,
  InvitationStatus,
} from '../../services/tenantInvitationsService';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvitationLinkModal, setShowInvitationLinkModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<TenantInvitation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvitationStatus | 'ALL'>('ALL');

  // Load invitations
  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantInvitationsService.getByTenantId(tenantId);
      setInvitations(data);
    } catch (err) {
      setError(t('invitations.fetchError'));
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

  // Handle delete
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(t('invitations.confirmDelete', { email }))) return;

    try {
      await tenantInvitationsService.delete(id);
      await loadInvitations();
    } catch (err) {
      alert(t('invitations.deleteError'));
      console.error('Error deleting invitation:', err);
    }
  };

  // Handle revoke
  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(t('invitations.confirmRevoke', { email }))) return;

    try {
      await tenantInvitationsService.revoke(id);
      await loadInvitations();
    } catch (err) {
      alert(t('invitations.revokeError'));
      console.error('Error revoking invitation:', err);
    }
  };

  // Handle resend
  const handleResend = async (id: string) => {
    try {
      const newInvitation = await tenantInvitationsService.resend(id);
      setSelectedInvitation(newInvitation);
      setShowInvitationLinkModal(true);
      await loadInvitations();
    } catch (err: any) {
      alert(err.message || t('invitations.resendError'));
      console.error('Error resending invitation:', err);
    }
  };

  // Handle show link
  const handleShowLink = (invitation: TenantInvitation) => {
    setSelectedInvitation(invitation);
    setShowInvitationLinkModal(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
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
            {t('invitations.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('invitations.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('invitations.sendInvitation')}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              {t('invitations.howInvitationsWork')}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('invitations.invitationsDescription')}
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
                <p className="text-sm text-gray-500">{t('invitations.totalInvitations')}</p>
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
                <p className="text-sm text-gray-500">{t('invitations.pending')}</p>
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
                <p className="text-sm text-gray-500">{t('invitations.accepted')}</p>
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
                <p className="text-sm text-gray-500">{t('invitations.expired')}</p>
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
                <p className="text-sm text-gray-500">{t('invitations.revoked')}</p>
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
            <option value="ALL">{t('invitations.allStatuses')}</option>
            <option value="PENDING">{t('invitations.pending')}</option>
            <option value="ACCEPTED">{t('invitations.accepted')}</option>
            <option value="EXPIRED">{t('invitations.expired')}</option>
            <option value="REVOKED">{t('invitations.revoked')}</option>
          </select>
          <span className="text-sm text-gray-500">
            {filteredInvitations.length} {t('invitations.results')}
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
                    {t('invitations.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.expiresAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitations.invitedAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => {
                  const statusColor = tenantInvitationsService.getStatusColor(invitation.status);
                  const isExpired = new Date(invitation.expires_at) < new Date() && invitation.status === 'PENDING';
                  
                  return (
                    <tr key={invitation._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{invitation.email}</span>
                        </div>
                        {invitation.role_ids && invitation.role_ids.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {invitation.role_ids.length} role(s) assigned
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isExpired ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Calendar className="h-3 w-3" />
                            {t('invitations.expired')}
                          </Badge>
                        ) : (
                          <Badge
                            variant={
                              statusColor === 'green' ? 'success' :
                              statusColor === 'yellow' ? 'warning' :
                              statusColor === 'red' ? 'destructive' :
                              'secondary'
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            {invitation.status === 'PENDING' && <Clock className="h-3 w-3" />}
                            {invitation.status === 'ACCEPTED' && <CheckCircle className="h-3 w-3" />}
                            {invitation.status === 'EXPIRED' && <Calendar className="h-3 w-3" />}
                            {invitation.status === 'REVOKED' && <Ban className="h-3 w-3" />}
                            {tenantInvitationsService.getStatusDisplay(invitation.status)}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {tenantInvitationsService.getTimeUntilExpiry(invitation.expires_at)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenantInvitationsService.getTimeSinceCreation(invitation.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {invitation.status === 'PENDING' && !isExpired && (
                            <>
                              <button
                                onClick={() => handleShowLink(invitation)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                title={t('invitations.showLink')}
                              >
                                <LinkIcon className="h-4 w-4" />
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleResend(invitation._id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title={t('invitations.resend')}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleRevoke(invitation._id, invitation.email)}
                                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                title={t('invitations.revoke')}
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(invitation.status === 'EXPIRED' || isExpired) && (
                            <button
                              onClick={() => handleResend(invitation._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              title={t('invitations.resend')}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          {(invitation.status === 'ACCEPTED' || invitation.status === 'REVOKED' || invitation.status === 'EXPIRED') && (
                            <>
                              {invitation.status !== 'EXPIRED' && <span className="text-gray-300">|</span>}
                              <button
                                onClick={() => handleDelete(invitation._id, invitation.email)}
                                className="text-red-600 hover:text-red-800"
                                title={t('invitations.delete')}
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
              ? t('invitations.noInvitations') 
              : t('invitations.noInvitationsWithStatus', { status: filterStatus.toLowerCase() })}
          </p>
          {filterStatus === 'ALL' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('invitations.sendFirstInvitation')}
            </Button>
          )}
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <CreateInvitationModal
          tenantId={tenantId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(invitation) => {
            setShowCreateModal(false);
            setSelectedInvitation(invitation);
            setShowInvitationLinkModal(true);
            loadInvitations();
          }}
        />
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

// Create Invitation Modal Component
interface CreateInvitationModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: (invitation: TenantInvitation) => void;
}

const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
  tenantId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t('invitations.emailRequired'));
      return;
    }

    try {
      setSubmitting(true);

      const invitation = await tenantInvitationsService.create({
        tenant_id: tenantId,
        email: email.trim(),
        expires_in_days: expiresInDays,
      });

      onSuccess(invitation);
    } catch (err: any) {
      setError(err.message || t('invitations.createError'));
      console.error('Error creating invitation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('invitations.sendInvitation')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('invitations.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('invitations.emailPlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('invitations.expiresIn')}
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 {t('invitations.day')}</option>
              <option value={3}>3 {t('invitations.days')}</option>
              <option value={7}>7 {t('invitations.days')}</option>
              <option value={14}>14 {t('invitations.days')}</option>
              <option value={30}>30 {t('invitations.days')}</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? t('common.sending') : t('common.send')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Show Invitation Link Modal
interface ShowInvitationLinkModalProps {
  invitation: TenantInvitation;
  onClose: () => void;
}

const ShowInvitationLinkModal: React.FC<ShowInvitationLinkModalProps> = ({ 
  invitation, 
  onClose 
}) => {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const link = tenantInvitationsService.getInvitationLink(invitation);

  const copyLink = () => {
    navigator.clipboard.writeText(link.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(link.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('invitations.invitationLink')}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  {t('invitations.shareSecurely')}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('invitations.shareSecurelyMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Invitation URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('invitations.invitationUrl')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={link.url}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <Button onClick={copyLink} variant="outline">
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('invitations.token')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={link.token}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <Button onClick={copyToken} variant="outline">
                {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('invitations.email')}:</span>
              <span className="text-sm font-medium text-gray-900">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('invitations.expiresAt')}:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(invitation.expires_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('invitations.validFor')}:</span>
              <span className="text-sm font-medium text-gray-900">
                {tenantInvitationsService.getTimeUntilExpiry(invitation.expires_at)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={copyLink} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              {t('invitations.copyLink')}
            </Button>
            <Button onClick={onClose} className="flex-1">
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};