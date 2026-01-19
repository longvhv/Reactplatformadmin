/**
 * TenantApiKeysTab Component
 * Manages API keys for tenant with security best practices
 * Design inspired by Stripe/GitHub/Vercel API key management
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
  Calendar,
  Eye,
  EyeOff,
  Shield,
  RefreshCw,
  Globe,
  Activity,
  MoreVertical,
} from 'lucide-react';
import {
  apiKeysService,
  ApiKey,
  GeneratedApiKey,
  AVAILABLE_SCOPES,
} from '../../services/apiKeysService';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<GeneratedApiKey | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load API keys
  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeysService.getByTenantId(tenantId);
      setKeys(data);
    } catch (err) {
      setError(t('apiKeys.fetchError'));
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

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('apiKeys.confirmRevoke', { name }))) return;

    try {
      await apiKeysService.delete(id);
      await loadKeys();
    } catch (err) {
      alert(t('apiKeys.revokeError'));
      console.error('Error deleting API key:', err);
    }
  };

  // Handle rotate
  const handleRotate = async (id: string, name: string) => {
    if (!confirm(t('apiKeys.confirmRotate', { name }))) return;

    try {
      const newKey = await apiKeysService.rotateKey(id);
      setGeneratedKey(newKey);
      setShowKeyModal(true);
      await loadKeys();
    } catch (err) {
      alert(t('apiKeys.rotateError'));
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
      return <Badge variant="secondary">{t('apiKeys.neverExpires')}</Badge>;
    }

    const expired = isExpired(expiresAt);
    const daysUntil = apiKeysService.getDaysUntilExpiration(expiresAt);

    if (expired) {
      return (
        <Badge variant="danger" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('apiKeys.expired')}
        </Badge>
      );
    } else if (daysUntil && daysUntil <= 7) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {t('apiKeys.expiresSoon', { days: daysUntil })}
        </Badge>
      );
    } else {
      return (
        <Badge variant="success">
          {daysUntil} {t('apiKeys.daysLeft')}
        </Badge>
      );
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

  const activeKeys = keys.filter(k => !isExpired(k.expires_at));
  const expiredKeys = keys.filter(k => isExpired(k.expires_at));
  const neverUsedKeys = keys.filter(k => !k.last_used_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('apiKeys.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('apiKeys.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('apiKeys.createKey')}
        </Button>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">{t('apiKeys.securityWarning')}</p>
            <p className="text-sm text-yellow-700 mt-1">{t('apiKeys.securityWarningMessage')}</p>
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
                <p className="text-sm text-gray-500">{t('apiKeys.totalKeys')}</p>
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
                <p className="text-sm text-gray-500">{t('apiKeys.active')}</p>
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
                <p className="text-sm text-gray-500">{t('apiKeys.expired')}</p>
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
                <p className="text-sm text-gray-500">{t('apiKeys.neverUsed')}</p>
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
                    {t('apiKeys.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.key')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.scopes')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.expiration')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('apiKeys.lastUsed')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
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
                          className="text-gray-400 hover:text-gray-600"
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
                          key.scopes.slice(0, 2).map((scope, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {t('apiKeys.noScopes')}
                          </Badge>
                        )}
                        {key.scopes.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{key.scopes.length - 2}
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
                        <span className="text-gray-400">{t('apiKeys.never')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRotate(key._id, key.name)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          title={t('apiKeys.rotate')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(key._id, key.name)}
                          className="text-red-600 hover:text-red-800"
                          title={t('apiKeys.revoke')}
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
          <p className="text-gray-500 mb-4">{t('apiKeys.noKeys')}</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('apiKeys.createFirstKey')}
          </Button>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          tenantId={tenantId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(key) => {
            setShowCreateModal(false);
            setGeneratedKey(key);
            setShowKeyModal(true);
            loadKeys();
          }}
        />
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

// Create API Key Modal Component
interface CreateApiKeyModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: (key: GeneratedApiKey) => void;
}

const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  tenantId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [allowedIps, setAllowedIps] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('apiKeys.nameRequired'));
      return;
    }

    if (selectedScopes.length === 0) {
      setError(t('apiKeys.scopesRequired'));
      return;
    }

    try {
      setSubmitting(true);

      // Parse IPs
      const ipsArray = allowedIps
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      // Calculate expiration
      let expiresAt: string | undefined;
      if (expiresInDays !== null && expiresInDays > 0) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiresInDays);
        expiresAt = expiry.toISOString();
      }

      const key = await apiKeysService.create({
        tenant_id: tenantId,
        name: name.trim(),
        scopes: selectedScopes,
        allowed_ips: ipsArray.length > 0 ? ipsArray : undefined,
        expires_at: expiresAt,
      });

      onSuccess(key);
    } catch (err: any) {
      setError(err.message || t('apiKeys.createError'));
      console.error('Error creating API key:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('apiKeys.createKey')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('apiKeys.keyName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('apiKeys.keyNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('apiKeys.permissions')}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {AVAILABLE_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope)}
                    onChange={() => handleScopeToggle(scope)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    {apiKeysService.getScopeDisplayName(scope)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Allowed IPs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('apiKeys.allowedIps')} ({t('common.optional')})
            </label>
            <input
              type="text"
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="192.168.1.0/24, 10.0.0.1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t('apiKeys.allowedIpsHint')}</p>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('apiKeys.expiresIn')} ({t('common.optional')})
            </label>
            <select
              value={expiresInDays || ''}
              onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('apiKeys.neverExpires')}</option>
              <option value="7">7 {t('apiKeys.days')}</option>
              <option value="30">30 {t('apiKeys.days')}</option>
              <option value="90">90 {t('apiKeys.days')}</option>
              <option value="180">180 {t('apiKeys.days')}</option>
              <option value="365">365 {t('apiKeys.days')}</option>
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
              {submitting ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
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
  const [showKey, setShowKey] = useState(true);

  const copyKey = () => {
    navigator.clipboard.writeText(generatedKey.plainKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('apiKeys.keyCreated')}</h3>
        </div>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">{t('apiKeys.oneTimeWarning')}</p>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('apiKeys.oneTimeWarningMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('apiKeys.yourApiKey')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={generatedKey.plainKey}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm pr-10"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={copyKey} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Key Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('apiKeys.name')}:</span>
              <span className="text-sm font-medium text-gray-900">
                {generatedKey.apiKey.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('apiKeys.scopes')}:</span>
              <span className="text-sm font-medium text-gray-900">
                {generatedKey.apiKey.scopes.length} {t('apiKeys.permissions').toLowerCase()}
              </span>
            </div>
            {generatedKey.apiKey.expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('apiKeys.expires')}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(generatedKey.apiKey.expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

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