/**
 * TenantApiKeysTab Component
 * Manages API keys for tenant with security best practices
 * Design inspired by Stripe/GitHub/Vercel API key management
 * ✅ Updated 2026-01-20: Added Edit functionality and Optimistic Locking support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Shield,
  RefreshCw,
  Activity,
  Edit,
} from 'lucide-react';
import {
  apiKeysService,
  ApiKey,
  GeneratedApiKey,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from '../../services/apiKeysService';
import { ApiKeyForm } from '../api-keys/ApiKeyForm';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TenantApiKeysTabProps {
  tenantId: string;
}

export const TenantApiKeysTab: React.FC<TenantApiKeysTabProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<GeneratedApiKey | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load API keys
  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeysService.getByTenantId(tenantId);
      setKeys(data);
    } catch (err) {
      setError(t('apiKeys.fetchError') || 'Failed to fetch API keys');
      console.error('Error loading API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadKeys();
    }
  }, [tenantId]);

  // Handle create
  const handleCreateSubmit = async (data: CreateApiKeyInput | UpdateApiKeyInput) => {
    try {
      setSubmitting(true);
      // It's a create input
      const key = await apiKeysService.create(data as CreateApiKeyInput);
      
      setShowCreateModal(false);
      setGeneratedKey(key);
      setShowKeyModal(true);
      loadKeys();
    } catch (err: any) {
      alert(err.message || t('apiKeys.createError') || 'Failed to create API key');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update
  const handleUpdateSubmit = async (data: CreateApiKeyInput | UpdateApiKeyInput) => {
    if (!editingKey) return;
    
    try {
      setSubmitting(true);
      // It's an update input
      await apiKeysService.update(editingKey._id, data as UpdateApiKeyInput);
      
      setEditingKey(null);
      loadKeys();
    } catch (err: any) {
      alert(err.message || t('apiKeys.updateError') || 'Failed to update API key');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('apiKeys.confirmRevoke', { name }) || `Are you sure you want to revoke key "${name}"?`)) return;

    try {
      await apiKeysService.delete(id);
      await loadKeys();
    } catch (err) {
      alert(t('apiKeys.revokeError') || 'Failed to revoke API key');
      console.error('Error deleting API key:', err);
    }
  };

  // Handle rotate
  const handleRotate = async (id: string, name: string) => {
    if (!confirm(t('apiKeys.confirmRotate', { name }) || `Are you sure you want to rotate key "${name}"? The old key will be deleted immediately.`)) return;

    try {
      const newKey = await apiKeysService.rotateKey(id);
      setGeneratedKey(newKey);
      setShowKeyModal(true);
      await loadKeys();
    } catch (err) {
      alert(t('apiKeys.rotateError') || 'Failed to rotate API key');
      console.error('Error rotating API key:', err);
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

  // Check if key is expired
  const isExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Get expiration badge
  const getExpirationBadge = (expiresAt?: string) => {
    if (!expiresAt) {
      return <Badge variant="secondary">{t('apiKeys.neverExpires') || 'Never expires'}</Badge>;
    }

    const expired = isExpired(expiresAt);
    const daysUntil = apiKeysService.getDaysUntilExpiration(expiresAt);

    if (expired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('apiKeys.expired') || 'Expired'}
        </Badge>
      );
    } else if (daysUntil && daysUntil <= 7) {
      return (
        <Badge variant="warning" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
          <Clock className="h-3 w-3" />
          {t('apiKeys.expiresSoon', { days: daysUntil }) || `Expires in ${daysUntil} days`}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          {daysUntil} {t('apiKeys.daysLeft') || 'days left'}
        </Badge>
      );
    }
  };

  if (loading && !keys.length) {
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

  const activeKeys = keys.filter(k => !isExpired(k.expires_at));
  const expiredKeys = keys.filter(k => isExpired(k.expires_at));
  const neverUsedKeys = keys.filter(k => !k.last_used_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('apiKeys.title') || 'API Keys'}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('apiKeys.subtitle') || 'Manage access tokens for your applications.'}</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('apiKeys.createKey') || 'Create New Key'}
        </Button>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">{t('apiKeys.securityWarning') || 'Keep your keys secure'}</p>
            <p className="text-sm text-yellow-700 mt-1">
              {t('apiKeys.securityWarningMessage') || 'Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {keys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Key className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('apiKeys.totalKeys') || 'Total Keys'}</p>
                <p className="text-2xl font-bold text-gray-900">{keys.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('apiKeys.active') || 'Active'}</p>
                <p className="text-2xl font-bold text-gray-900">{activeKeys.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-lg p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('apiKeys.expired') || 'Expired'}</p>
                <p className="text-2xl font-bold text-gray-900">{expiredKeys.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('apiKeys.neverUsed') || 'Never Used'}</p>
                <p className="text-2xl font-bold text-gray-900">{neverUsedKeys.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {keys.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.name') || 'Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.key') || 'Key'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.scopes') || 'Scopes'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.expiration') || 'Expiration'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.lastUsed') || 'Last Used'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{key.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {apiKeysService.formatKeyDisplay(key.key_prefix)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key_prefix, key._id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy prefix"
                        >
                          {copiedId === key._id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.length > 0 ? (
                          <>
                            {key.scopes.slice(0, 2).map((scope, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs font-mono">
                                {scope}
                              </Badge>
                            ))}
                            {key.scopes.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{key.scopes.length - 2}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {t('apiKeys.noScopes') || 'No scopes'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getExpirationBadge(key.expires_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {key.last_used_at ? (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {new Date(key.last_used_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">{t('apiKeys.never') || 'Never'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                         <button
                          onClick={() => setEditingKey(key)}
                          className="text-gray-600 hover:text-indigo-600 text-sm font-medium p-1 rounded hover:bg-indigo-50 transition-colors"
                          title={t('common.edit') || 'Edit'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleRotate(key._id, key.name)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium p-1 rounded hover:bg-indigo-50 transition-colors"
                          title={t('apiKeys.rotate') || 'Rotate Key'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(key._id, key.name)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title={t('apiKeys.revoke') || 'Revoke Key'}
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
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('apiKeys.noKeys') || 'No API keys found for this tenant.'}</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('apiKeys.createFirstKey') || 'Create Your First Key'}
          </Button>
        </div>
      )}

      {/* Unified Modal Container */}
      {(showCreateModal || editingKey) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ApiKeyForm 
                tenantId={tenantId}
                initialData={editingKey || undefined}
                onSubmit={editingKey ? handleUpdateSubmit : handleCreateSubmit}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingKey(null);
                }}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Show API Key Modal (one-time display) */}
      {showKeyModal && generatedKey && (
        <ShowApiKeyModal
          generatedKey={generatedKey}
          onClose={() => {
            setShowKeyModal(false);
            setGeneratedKey(null);
          }}
        />
      )}
    </div>
  );
};

// Show API Key Modal (one-time display)
interface ShowApiKeyModalProps {
  generatedKey: GeneratedApiKey;
  onClose: () => void;
}

const ShowApiKeyModal: React.FC<ShowApiKeyModalProps> = ({ generatedKey, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  
  // We don't hide the key initially because it's a one-time show
  // But we can add a toggle if needed. For now, show it clearly.

  const copyKey = () => {
    navigator.clipboard.writeText(generatedKey.plainKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('apiKeys.keyCreated') || 'API Key Created'}</h3>
            </div>
          </div>

          <div className="space-y-4">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t('apiKeys.saveKeyWarning') || 'Save this key immediately!'}</p>
                  <p>{t('apiKeys.saveKeyDescription') || 'This is the only time we will show you the full API key. Make sure to copy it and store it in a secure location.'}</p>
                </div>
              </div>
            </div>

            {/* Key Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {generatedKey.apiKey.name}
              </label>
              <div className="relative group">
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm break-all text-gray-800 pr-12">
                  {generatedKey.plainKey}
                </div>
                <button
                  onClick={copyKey}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={onClose} className="w-full sm:w-auto">
                {t('common.done') || 'I have saved the key'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
