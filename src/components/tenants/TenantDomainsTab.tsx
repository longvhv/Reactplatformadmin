/**
 * TenantDomainsTab Component
 * Manages domain verification and policies for a tenant
 * Design inspired by Stripe/GitHub/Vercel domain management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Copy,
  RefreshCw,
  Info,
  Settings,
  AlertCircle,
} from 'lucide-react';
import {
  tenantDomainsService,
  TenantDomain,
  VerificationMethod,
  DomainPolicy,
} from '../../services/tenantDomainsService';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TenantDomainsTabProps {
  tenantId: string;
}

export const TenantDomainsTab: React.FC<TenantDomainsTabProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<TenantDomain | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Load domains
  const loadDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantDomainsService.getByTenantId(tenantId);
      setDomains(data);
    } catch (err) {
      setError(t('domains.fetchError'));
      console.error('Error loading domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadDomains();
    }
  }, [tenantId]);

  // Handle delete
  const handleDelete = async (id: string, domain: string) => {
    if (!confirm(t('domains.confirmDelete', { domain }))) return;

    try {
      await tenantDomainsService.delete(id);
      await loadDomains();
    } catch (err) {
      alert(t('domains.deleteError'));
      console.error('Error deleting domain:', err);
    }
  };

  // Handle verify
  const handleVerify = async (domain: TenantDomain) => {
    setSelectedDomain(domain);
    setShowVerificationModal(true);
  };

  // Handle mark as verified (admin action)
  const handleMarkVerified = async (id: string) => {
    if (!confirm(t('domains.confirmMarkVerified'))) return;

    try {
      await tenantDomainsService.markAsVerified(id);
      await loadDomains();
    } catch (err) {
      alert(t('domains.verifyError'));
      console.error('Error marking as verified:', err);
    }
  };

  // Handle policy change
  const handlePolicyChange = async (id: string, policy: DomainPolicy) => {
    try {
      await tenantDomainsService.updatePolicy(id, policy);
      await loadDomains();
    } catch (err) {
      alert(t('domains.updateError'));
      console.error('Error updating policy:', err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('domains.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('domains.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('domains.addDomain')}
        </Button>
      </div>

      {/* Stats */}
      {domains.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Globe className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('domains.totalDomains')}</p>
                <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('domains.verified')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {domains.filter(d => d.verification_status === 'VERIFIED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('domains.pending')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {domains.filter(d => d.verification_status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      {domains.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('domains.domain')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('domains.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('domains.method')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('domains.policy')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('domains.createdAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {domains.map((domain) => (
                  <tr key={domain._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm text-gray-900">{domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {domain.verification_status === 'VERIFIED' ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          {t('domains.verified')}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          {t('domains.pending')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {domain.verification_method === 'DNS_TXT' ? 'DNS TXT' : 'HTML File'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={domain.policy}
                        onChange={(e) => handlePolicyChange(domain._id, e.target.value as DomainPolicy)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="NONE">{t('domains.policyNone')}</option>
                        <option value="CAPTURE">{t('domains.policyCapture')}</option>
                        <option value="ENFORCE_SSO">{t('domains.policyEnforceSSO')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(domain.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {domain.verification_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerify(domain)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              {t('domains.verify')}
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleMarkVerified(domain._id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              {t('domains.markVerified')}
                            </button>
                            <span className="text-gray-300">|</span>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(domain._id, domain.domain)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('domains.noDomains')}</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('domains.addFirstDomain')}
          </Button>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <AddDomainModal
          tenantId={tenantId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDomains();
          }}
        />
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedDomain && (
        <VerificationModal
          domain={selectedDomain}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedDomain(null);
          }}
          onRefresh={loadDomains}
        />
      )}
    </div>
  );
};

// Add Domain Modal Component
interface AddDomainModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDomainModal: React.FC<AddDomainModalProps> = ({ tenantId, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [domain, setDomain] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('DNS_TXT');
  const [policy, setPolicy] = useState<DomainPolicy>('NONE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!domain.trim()) {
      setError(t('domains.domainRequired'));
      return;
    }

    try {
      setSubmitting(true);
      await tenantDomainsService.create({
        tenant_id: tenantId,
        domain: domain.trim(),
        verification_method: verificationMethod,
        policy,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('domains.createError'));
      console.error('Error creating domain:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('domains.addDomain')}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('domains.domainName')}
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t('domains.domainHint')}</p>
          </div>

          {/* Verification Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('domains.verificationMethod')}
            </label>
            <select
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DNS_TXT">DNS TXT Record</option>
              <option value="HTML_FILE">HTML File</option>
            </select>
          </div>

          {/* Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('domains.domainPolicy')}
            </label>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as DomainPolicy)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="NONE">{t('domains.policyNone')}</option>
              <option value="CAPTURE">{t('domains.policyCapture')}</option>
              <option value="ENFORCE_SSO">{t('domains.policyEnforceSSO')}</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Verification Modal Component
interface VerificationModalProps {
  domain: TenantDomain;
  onClose: () => void;
  onRefresh: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ domain, onClose, onRefresh }) => {
  const { t } = useTranslation();
  const instructions = tenantDomainsService.getVerificationInstructions(domain);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('domains.verificationInstructions')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Domain Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">{domain.domain}</span>
            </div>
            <p className="text-sm text-gray-600">
              {t('domains.verificationMethodLabel')}: {instructions.method === 'DNS_TXT' ? 'DNS TXT Record' : 'HTML File'}
            </p>
          </div>

          {/* Instructions */}
          {instructions.method === 'DNS_TXT' ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{t('domains.dnsInstructions')}</p>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>{t('domains.dnsStep1')}</li>
                      <li>{t('domains.dnsStep2')}</li>
                      <li>{t('domains.dnsStep3')}</li>
                      <li>{t('domains.dnsStep4')}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('domains.recordName')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={instructions.recordName}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(instructions.recordName || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('domains.recordValue')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={instructions.recordValue}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(instructions.recordValue || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{t('domains.htmlInstructions')}</p>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>{t('domains.htmlStep1')}</li>
                      <li>{t('domains.htmlStep2')}</li>
                      <li>{t('domains.htmlStep3')}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('domains.filePath')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={instructions.filePath}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(instructions.filePath || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('domains.fileContent')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={instructions.fileContent}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(instructions.fileContent || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('common.close')}
            </Button>
            <Button onClick={onRefresh} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('domains.checkVerification')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
