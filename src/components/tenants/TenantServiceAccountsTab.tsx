/**
 * TenantServiceAccountsTab Component
 * Manages OAuth2-style service accounts for tenant
 * Design inspired by Google Cloud Platform / AWS IAM service accounts
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  MoreVertical,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  serviceAccountsService,
  ServiceAccount,
  GeneratedServiceAccount,
} from '../../services/serviceAccountsService';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedAccount, setGeneratedAccount] = useState<GeneratedServiceAccount | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load service accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceAccountsService.getByTenantId(tenantId);
      setAccounts(data);
    } catch (err) {
      setError(t('serviceAccounts.fetchError'));
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

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('serviceAccounts.confirmDelete', { name }))) return;

    try {
      await serviceAccountsService.delete(id);
      await loadAccounts();
    } catch (err) {
      alert(t('serviceAccounts.deleteError'));
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
      alert(t('serviceAccounts.toggleError'));
      console.error('Error toggling active status:', err);
    }
  };

  // Handle reset secret
  const handleResetSecret = async (id: string, name: string) => {
    if (!confirm(t('serviceAccounts.confirmReset', { name }))) return;

    try {
      const newAccount = await serviceAccountsService.resetClientSecret(id);
      setGeneratedAccount(newAccount);
      setShowCredentialsModal(true);
      await loadAccounts();
    } catch (err) {
      alert(t('serviceAccounts.resetError'));
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

  const activeAccounts = accounts.filter(a => a.is_active);
  const inactiveAccounts = accounts.filter(a => !a.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('serviceAccounts.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('serviceAccounts.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('serviceAccounts.createAccount')}
        </Button>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              {t('serviceAccounts.whatAreServiceAccounts')}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('serviceAccounts.serviceAccountsDescription')}
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
                <p className="text-sm text-gray-500">{t('serviceAccounts.totalAccounts')}</p>
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
                <p className="text-sm text-gray-500">{t('serviceAccounts.active')}</p>
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
                <p className="text-sm text-gray-500">{t('serviceAccounts.inactive')}</p>
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
                    {t('serviceAccounts.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.clientId')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceAccounts.lastUpdated')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
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
                          className="text-gray-400 hover:text-gray-600"
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
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          {t('serviceAccounts.active')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          {t('serviceAccounts.inactive')}
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
                          onClick={() => handleToggleActive(account._id, account.is_active)}
                          className={`${
                            account.is_active 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-green-600 hover:text-green-800'
                          } text-sm font-medium`}
                          title={
                            account.is_active 
                              ? t('serviceAccounts.deactivate') 
                              : t('serviceAccounts.activate')
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
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          title={t('serviceAccounts.resetSecret')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(account._id, account.name)}
                          className="text-red-600 hover:text-red-800"
                          title={t('serviceAccounts.delete')}
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
          <p className="text-gray-500 mb-4">{t('serviceAccounts.noAccounts')}</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('serviceAccounts.createFirstAccount')}
          </Button>
        </div>
      )}

      {/* Create Service Account Modal */}
      {showCreateModal && (
        <CreateServiceAccountModal
          tenantId={tenantId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(account) => {
            setShowCreateModal(false);
            setGeneratedAccount(account);
            setShowCredentialsModal(true);
            loadAccounts();
          }}
        />
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

// Create Service Account Modal Component
interface CreateServiceAccountModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: (account: GeneratedServiceAccount) => void;
}

const CreateServiceAccountModal: React.FC<CreateServiceAccountModalProps> = ({
  tenantId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberId, setMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('serviceAccounts.nameRequired'));
      return;
    }

    if (!memberId) {
      setError(t('serviceAccounts.memberRequired'));
      return;
    }

    try {
      setSubmitting(true);

      const account = await serviceAccountsService.create({
        tenant_id: tenantId,
        member_id: memberId,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      onSuccess(account);
    } catch (err: any) {
      setError(err.message || t('serviceAccounts.createError'));
      console.error('Error creating service account:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('serviceAccounts.createAccount')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceAccounts.accountName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('serviceAccounts.accountNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceAccounts.description')} ({t('common.optional')})
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('serviceAccounts.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Member ID (in real app, this would be a dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceAccounts.associatedMember')}
            </label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder={t('serviceAccounts.memberIdPlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('serviceAccounts.memberIdHint')}
            </p>
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
              {submitting ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
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

  const copyBoth = () => {
    const credentials = `Client ID: ${generatedAccount.serviceAccount.client_id}\nClient Secret: ${generatedAccount.clientSecret}`;
    navigator.clipboard.writeText(credentials);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('serviceAccounts.credentialsCreated')}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Critical Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  {t('serviceAccounts.oneTimeWarning')}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('serviceAccounts.oneTimeWarningMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('serviceAccounts.clientId')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedAccount.serviceAccount.client_id}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <Button onClick={copyClientId} variant="outline">
                {copiedClientId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('serviceAccounts.clientSecret')}
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
              <Button onClick={copyClientSecret} variant="outline">
                {copiedClientSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('serviceAccounts.name')}:</span>
              <span className="text-sm font-medium text-gray-900">
                {generatedAccount.serviceAccount.name}
              </span>
            </div>
            {generatedAccount.serviceAccount.description && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('serviceAccounts.description')}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {generatedAccount.serviceAccount.description}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('serviceAccounts.status')}:</span>
              <Badge variant="success">{t('serviceAccounts.active')}</Badge>
            </div>
          </div>

          {/* Usage Example */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              {t('serviceAccounts.usageExample')}
            </p>
            <pre className="text-xs text-blue-800 font-mono overflow-x-auto">
{`POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=${generatedAccount.serviceAccount.client_id}
&client_secret=${generatedAccount.clientSecret}`}
            </pre>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={copyBoth} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              {t('serviceAccounts.copyBoth')}
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
