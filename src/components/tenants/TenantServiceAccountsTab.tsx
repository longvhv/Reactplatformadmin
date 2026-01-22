/**
 * TenantServiceAccountsTab Component
 * Manages OAuth2-style service accounts for tenant
 * Design inspired by Google Cloud Platform / AWS IAM service accounts
 * ✅ Updated 2026-01-20: Added Edit functionality and Optimistic Locking support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  UserCog,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
} from 'lucide-react';
import {
  serviceAccountsService,
  ServiceAccount,
  GeneratedServiceAccount,
  CreateServiceAccountInput,
  UpdateServiceAccountInput
} from '../../services/serviceAccountsService';
import { ServiceAccountForm } from '../service-accounts/ServiceAccountForm';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TenantServiceAccountsTabProps {
  tenantId: string;
}

export const TenantServiceAccountsTab: React.FC<TenantServiceAccountsTabProps> = ({ 
  tenantId 
}) => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ServiceAccount | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedAccount, setGeneratedAccount] = useState<GeneratedServiceAccount | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load service accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceAccountsService.getByTenantId(tenantId);
      setAccounts(data);
    } catch (err) {
      setError(t('serviceAccounts.fetchError') || 'Failed to fetch service accounts');
      console.error('Error loading service accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadAccounts();
    }
  }, [tenantId]);

  // Handle create submit
  const handleCreateSubmit = async (data: CreateServiceAccountInput | UpdateServiceAccountInput) => {
    try {
      setSubmitting(true);
      const account = await serviceAccountsService.create(data as CreateServiceAccountInput);
      
      setShowCreateModal(false);
      setGeneratedAccount(account);
      setShowCredentialsModal(true);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || t('serviceAccounts.createError') || 'Failed to create service account');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async (data: CreateServiceAccountInput | UpdateServiceAccountInput) => {
    if (!editingAccount) return;
    
    try {
      setSubmitting(true);
      await serviceAccountsService.update(editingAccount._id, data as UpdateServiceAccountInput);
      
      setEditingAccount(null);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || t('serviceAccounts.updateError') || 'Failed to update service account');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('serviceAccounts.confirmDelete', { name }) || `Are you sure you want to delete service account "${name}"?`)) return;

    try {
      await serviceAccountsService.delete(id);
      await loadAccounts();
    } catch (err) {
      alert(t('serviceAccounts.deleteError') || 'Failed to delete service account');
      console.error('Error deleting service account:', err);
    }
  };

  // Handle activate/deactivate
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await serviceAccountsService.deactivate(id);
      } else {
        await serviceAccountsService.activate(id);
      }
      await loadAccounts();
    } catch (err) {
      alert(t('serviceAccounts.toggleError') || 'Failed to toggle status');
      console.error('Error toggling active status:', err);
    }
  };

  // Handle reset secret
  const handleResetSecret = async (id: string, name: string) => {
    if (!confirm(t('serviceAccounts.confirmReset', { name }) || `Are you sure you want to reset the secret for "${name}"? The old secret will stop working immediately.`)) return;

    try {
      const newAccount = await serviceAccountsService.resetClientSecret(id);
      setGeneratedAccount(newAccount);
      setShowCredentialsModal(true);
      await loadAccounts();
    } catch (err) {
      alert(t('serviceAccounts.resetError') || 'Failed to reset client secret');
      console.error('Error resetting client secret:', err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading && !accounts.length) {
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

  const activeAccounts = accounts.filter(a => a.is_active);
  const inactiveAccounts = accounts.filter(a => !a.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('serviceAccounts.title') || 'Service Accounts'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('serviceAccounts.subtitle') || 'Manage automated access for your applications.'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('serviceAccounts.createAccount') || 'Create Service Account'}
        </Button>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              {t('serviceAccounts.whatAreServiceAccounts') || 'What are Service Accounts?'}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('serviceAccounts.serviceAccountsDescription') || 'Service accounts are special accounts used by applications or virtual machines (VMs), not people. Applications use service accounts to make authorized API calls.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <UserCog className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('serviceAccounts.totalAccounts') || 'Total Accounts'}</p>
                <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('serviceAccounts.active') || 'Active'}</p>
                <p className="text-2xl font-bold text-gray-900">{activeAccounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <XCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('serviceAccounts.inactive') || 'Inactive'}</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveAccounts.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Accounts List */}
      {accounts.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.name') || 'Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.clientId') || 'Client ID'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.lastUpdated') || 'Last Updated'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {account.name}
                          </span>
                        </div>
                        {account.description && (
                          <p className="text-sm text-gray-500 mt-1 ml-6">
                            {account.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {serviceAccountsService.formatClientIdDisplay(account.client_id)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(account.client_id, account._id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {copiedId === account._id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {account.is_active ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3" />
                          {t('serviceAccounts.active') || 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          {t('serviceAccounts.inactive') || 'Inactive'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {serviceAccountsService.getTimeSinceUpdate(account.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingAccount(account)}
                          className="text-gray-600 hover:text-indigo-600 text-sm font-medium p-1 rounded hover:bg-indigo-50 transition-colors"
                          title={t('common.edit') || 'Edit'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleToggleActive(account._id, account.is_active)}
                          className={`${
                            account.is_active 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-green-600 hover:text-green-800'
                          } text-sm font-medium p-1 rounded hover:bg-gray-50 transition-colors`}
                          title={
                            account.is_active 
                              ? (t('serviceAccounts.deactivate') || 'Deactivate')
                              : (t('serviceAccounts.activate') || 'Activate')
                          }
                        >
                          {account.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleResetSecret(account._id, account.name)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium p-1 rounded hover:bg-indigo-50 transition-colors"
                          title={t('serviceAccounts.resetSecret') || 'Reset Secret'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(account._id, account.name)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title={t('serviceAccounts.delete') || 'Delete'}
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
          <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('serviceAccounts.noAccounts') || 'No service accounts found.'}</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('serviceAccounts.createFirstAccount') || 'Create First Account'}
          </Button>
        </div>
      )}

      {/* Unified Modal Container for Create/Edit */}
      {(showCreateModal || editingAccount) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <ServiceAccountForm 
                tenantId={tenantId}
                initialData={editingAccount || undefined}
                onSubmit={editingAccount ? handleUpdateSubmit : handleCreateSubmit}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingAccount(null);
                }}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Show Credentials Modal (one-time display) */}
      {showCredentialsModal && generatedAccount && (
        <ShowCredentialsModal
          generatedAccount={generatedAccount}
          onClose={() => {
            setShowCredentialsModal(false);
            setGeneratedAccount(null);
          }}
        />
      )}
    </div>
  );
};

// Show Credentials Modal (one-time display)
interface ShowCredentialsModalProps {
  generatedAccount: GeneratedServiceAccount;
  onClose: () => void;
}

const ShowCredentialsModal: React.FC<ShowCredentialsModalProps> = ({ 
  generatedAccount, 
  onClose 
}) => {
  const { t } = useTranslation();
  const [copiedClientId, setCopiedClientId] = useState(false);
  const [copiedClientSecret, setCopiedClientSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(true);

  const copyClientId = () => {
    navigator.clipboard.writeText(generatedAccount.serviceAccount.client_id);
    setCopiedClientId(true);
    setTimeout(() => setCopiedClientId(false), 2000);
  };

  const copyClientSecret = () => {
    navigator.clipboard.writeText(generatedAccount.clientSecret);
    setCopiedClientSecret(true);
    setTimeout(() => setCopiedClientSecret(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('serviceAccounts.credentialsCreated') || 'Credentials Created'}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Critical Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">
                    {t('serviceAccounts.oneTimeWarning') || 'Warning: One-time Display'}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {t('serviceAccounts.oneTimeWarningMessage') || 'The client secret will only be shown once. Please copy and store it securely now. You will not be able to see it again.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceAccounts.clientId') || 'Client ID'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedAccount.serviceAccount.client_id}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                />
                <Button onClick={copyClientId} variant="outline" size="icon">
                  {copiedClientId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceAccounts.clientSecret') || 'Client Secret'}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={generatedAccount.clientSecret}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm pr-10"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={copyClientSecret} variant="outline" size="icon">
                  {copiedClientSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('serviceAccounts.name') || 'Name'}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {generatedAccount.serviceAccount.name}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={onClose} className="w-full sm:w-auto">
                {t('common.done') || 'I have stored the credentials'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
