/**
 * UserConsentsTab Component
 * Manages legal consent tracking for GDPR/CCPA compliance
 * Features: Consent lifecycle, withdrawal, expiry, renewal
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  Shield,
  Plus,
  Trash2,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  FileText,
  Calendar,
  Globe,
  Smartphone,
  Mail,
  UserPlus,
  User,
  ShoppingCart,
  Code,
} from 'lucide-react';
import {
  userConsentsService,
  UserConsent,
  ConsentStatus,
  DocumentType,
  ConsentMethod,
} from '../../services/userConsentsService';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface UserConsentsTabProps {
  userId: string;
}

export const UserConsentsTab: React.FC<UserConsentsTabProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<UserConsent | null>(null);
  const [filterStatus, setFilterStatus] = useState<ConsentStatus | 'ALL'>('ALL');
  const [filterDocumentType, setFilterDocumentType] = useState<DocumentType | 'ALL'>('ALL');

  // Load consents
  const loadConsents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userConsentsService.getByUserId(userId);
      setConsents(data);
    } catch (err) {
      setError(t('consents.fetchError'));
      console.error('Error loading consents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadConsents();
    }
  }, [userId]);

  // Handle withdraw
  const handleWithdraw = (consent: UserConsent) => {
    setSelectedConsent(consent);
    setShowWithdrawModal(true);
  };

  // Handle renew
  const handleRenew = async (id: string) => {
    if (!confirm(t('consents.confirmRenew'))) return;

    try {
      await userConsentsService.renew(id);
      await loadConsents();
    } catch (err) {
      alert(t('consents.renewError'));
      console.error('Error renewing consent:', err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('consents.confirmDelete', { title }))) return;

    try {
      await userConsentsService.delete(id);
      await loadConsents();
    } catch (err) {
      alert(t('consents.deleteError'));
      console.error('Error deleting consent:', err);
    }
  };

  // Handle view details
  const handleViewDetails = (consent: UserConsent) => {
    setSelectedConsent(consent);
    setShowDetailsModal(true);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const exportData = await userConsentsService.exportUserConsents(userId);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-consents-${userId}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('consents.exportError'));
      console.error('Error exporting consents:', err);
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

  // Filter consents
  let filteredConsents = consents;
  if (filterStatus !== 'ALL') {
    filteredConsents = filteredConsents.filter(
      c => userConsentsService.getConsentStatus(c) === filterStatus
    );
  }
  if (filterDocumentType !== 'ALL') {
    filteredConsents = filteredConsents.filter(c => c.document_type === filterDocumentType);
  }

  // Stats
  const stats = {
    total: consents.length,
    active: consents.filter(c => userConsentsService.getConsentStatus(c) === 'active').length,
    withdrawn: consents.filter(c => userConsentsService.getConsentStatus(c) === 'withdrawn').length,
    expired: consents.filter(c => userConsentsService.getConsentStatus(c) === 'expired').length,
    renewalRequired: consents.filter(c => userConsentsService.getConsentStatus(c) === 'renewal_required').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('consents.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('consents.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t('consents.export')}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              {t('consents.gdprCompliance')}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('consents.gdprDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {consents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('consents.totalConsents')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('consents.active')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-lg p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('consents.withdrawn')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withdrawn}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('consents.expired')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('consents.renewalRequired')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.renewalRequired}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {consents.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ConsentStatus | 'ALL')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">{t('consents.allStatuses')}</option>
              <option value="active">{t('consents.active')}</option>
              <option value="withdrawn">{t('consents.withdrawn')}</option>
              <option value="expired">{t('consents.expired')}</option>
              <option value="renewal_required">{t('consents.renewalRequired')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterDocumentType}
              onChange={(e) => setFilterDocumentType(e.target.value as DocumentType | 'ALL')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">{t('consents.allDocumentTypes')}</option>
              <option value="privacy_policy">{t('consents.privacyPolicy')}</option>
              <option value="terms_of_service">{t('consents.termsOfService')}</option>
              <option value="cookie_policy">{t('consents.cookiePolicy')}</option>
              <option value="marketing">{t('consents.marketing')}</option>
              <option value="data_processing">{t('consents.dataProcessing')}</option>
              <option value="third_party_sharing">{t('consents.thirdPartySharing')}</option>
              <option value="newsletter">{t('consents.newsletter')}</option>
              <option value="other">{t('consents.other')}</option>
            </select>
          </div>

          <span className="text-sm text-gray-500">
            {filteredConsents.length} {t('consents.results')}
          </span>
        </div>
      )}

      {/* Consents Table */}
      {filteredConsents.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consents.document')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consents.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consents.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consents.consentDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consents.expires')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consents.method')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredConsents.map((consent) => {
                  const status = userConsentsService.getConsentStatus(consent);
                  const statusColor = userConsentsService.getStatusColor(status);
                  const needsAttention = userConsentsService.needsAttention(consent);

                  return (
                    <tr 
                      key={consent._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        needsAttention ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {consent.document_title || 'Untitled Document'}
                            </p>
                            {consent.document_version && (
                              <p className="text-xs text-gray-500">
                                v{consent.document_version}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {userConsentsService.getDocumentTypeDisplay(consent.document_type)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            statusColor === 'green' ? 'success' :
                            statusColor === 'red' ? 'destructive' :
                            statusColor === 'yellow' ? 'warning' :
                            'secondary'
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {status === 'active' && <CheckCircle className="h-3 w-3" />}
                          {status === 'withdrawn' && <XCircle className="h-3 w-3" />}
                          {status === 'expired' && <Calendar className="h-3 w-3" />}
                          {status === 'renewal_required' && <AlertTriangle className="h-3 w-3" />}
                          {userConsentsService.getStatusDisplay(status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {userConsentsService.getTimeAgo(consent.consent_date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          {userConsentsService.getTimeUntilExpiry(consent.expires_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ConsentMethodIcon method={consent.consent_method} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(consent)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title={t('consents.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {status === 'active' && !consent.withdrawn && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleWithdraw(consent)}
                                className="text-orange-600 hover:text-orange-800"
                                title={t('consents.withdraw')}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(status === 'expired' || status === 'renewal_required') && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleRenew(consent._id)}
                                className="text-blue-600 hover:text-blue-800"
                                title={t('consents.renew')}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(status === 'withdrawn' || status === 'expired') && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleDelete(
                                  consent._id, 
                                  consent.document_title || 'document'
                                )}
                                className="text-red-600 hover:text-red-800"
                                title={t('consents.delete')}
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
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filterStatus === 'ALL' && filterDocumentType === 'ALL'
              ? t('consents.noConsents')
              : t('consents.noConsentsWithFilters')}
          </p>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedConsent && (
        <WithdrawConsentModal
          consent={selectedConsent}
          onClose={() => {
            setShowWithdrawModal(false);
            setSelectedConsent(null);
          }}
          onSuccess={() => {
            setShowWithdrawModal(false);
            setSelectedConsent(null);
            loadConsents();
          }}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedConsent && (
        <ConsentDetailsModal
          consent={selectedConsent}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedConsent(null);
          }}
        />
      )}
    </div>
  );
};

// Consent Method Icon Component
const ConsentMethodIcon: React.FC<{ method?: ConsentMethod }> = ({ method }) => {
  const iconMap: Record<ConsentMethod, React.ReactNode> = {
    web: <Globe className="h-4 w-4 text-blue-600" />,
    mobile: <Smartphone className="h-4 w-4 text-purple-600" />,
    api: <Code className="h-4 w-4 text-green-600" />,
    email: <Mail className="h-4 w-4 text-orange-600" />,
    signup: <UserPlus className="h-4 w-4 text-indigo-600" />,
    profile: <User className="h-4 w-4 text-gray-600" />,
    checkout: <ShoppingCart className="h-4 w-4 text-yellow-600" />,
    other: <FileText className="h-4 w-4 text-gray-400" />,
  };

  return (
    <div className="flex items-center gap-2">
      {method && iconMap[method]}
      <span className="text-sm text-gray-600">
        {userConsentsService.getConsentMethodDisplay(method)}
      </span>
    </div>
  );
};

// Withdraw Consent Modal
interface WithdrawConsentModalProps {
  consent: UserConsent;
  onClose: () => void;
  onSuccess: () => void;
}

const WithdrawConsentModal: React.FC<WithdrawConsentModalProps> = ({
  consent,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await userConsentsService.withdraw(consent._id, { withdrawn_reason: reason });
      onSuccess();
    } catch (err) {
      alert(t('consents.withdrawError'));
      console.error('Error withdrawing consent:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('consents.withdrawConsent')}
        </h3>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">
                {t('consents.withdrawWarning')}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {t('consents.withdrawWarningMessage')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('consents.document')}
            </label>
            <p className="text-sm text-gray-900">
              {consent.document_title || 'Untitled Document'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('consents.withdrawReason')} ({t('common.optional')})
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('consents.withdrawReasonPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting} 
              variant="destructive"
              className="flex-1"
            >
              {submitting ? t('common.processing') : t('consents.withdraw')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Consent Details Modal
interface ConsentDetailsModalProps {
  consent: UserConsent;
  onClose: () => void;
}

const ConsentDetailsModal: React.FC<ConsentDetailsModalProps> = ({ 
  consent, 
  onClose 
}) => {
  const { t } = useTranslation();
  const status = userConsentsService.getConsentStatus(consent);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('consents.consentDetails')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Document Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">{t('consents.documentInformation')}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">{t('consents.documentTitle')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {consent.document_title || 'Untitled'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('consents.documentType')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {userConsentsService.getDocumentTypeDisplay(consent.document_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('consents.documentVersion')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {consent.document_version || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('consents.status')}</p>
                <Badge
                  variant={
                    status === 'active' ? 'success' :
                    status === 'withdrawn' ? 'destructive' :
                    status === 'renewal_required' ? 'warning' :
                    'secondary'
                  }
                >
                  {userConsentsService.getStatusDisplay(status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Consent Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">{t('consents.consentInformation')}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">{t('consents.consentDate')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(consent.consent_date).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('consents.consentMethod')}</p>
                <ConsentMethodIcon method={consent.consent_method} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('consents.consentIP')}</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {consent.consent_ip || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('consents.expires')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {consent.expires_at 
                    ? new Date(consent.expires_at).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawal Info */}
          {consent.withdrawn && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-red-900">{t('consents.withdrawalInformation')}</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-red-600">{t('consents.withdrawnDate')}</p>
                  <p className="text-sm font-medium text-red-900">
                    {consent.withdrawn_date 
                      ? new Date(consent.withdrawn_date).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                {consent.withdrawn_reason && (
                  <div>
                    <p className="text-xs text-red-600">{t('consents.withdrawReason')}</p>
                    <p className="text-sm text-red-900">{consent.withdrawn_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">{t('consents.sourceInformation')}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">{t('consents.sourceApplication')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {consent.source_application || 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">{t('consents.sourcePage')}</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {consent.source_page || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* User Agent */}
          {consent.consent_user_agent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{t('consents.userAgent')}</p>
              <p className="text-xs font-mono text-gray-900 break-all">
                {consent.consent_user_agent}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={onClose} className="flex-1">
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};