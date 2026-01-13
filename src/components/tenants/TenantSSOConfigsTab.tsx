/**
 * Tenant SSO Configs Tab Component
 * Manage SSO configurations for tenant (SAML, OAuth2, OIDC)
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Shield, Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface TenantSSOConfig {
  _id: string;
  tenant_id: string;
  provider: 'SAML' | 'OAUTH2' | 'OIDC';
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  entity_id?: string;
  sso_url?: string;
  slo_url?: string;
  certificate?: string;
  metadata_url?: string;
  client_id?: string;
  client_secret?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  scopes?: string[];
  attribute_mapping?: Record<string, any>;
  settings?: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
}

interface TenantSSOConfigsTabProps {
  tenantId: string;
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

export function TenantSSOConfigsTab({ tenantId }: TenantSSOConfigsTabProps) {
  const [configs, setConfigs] = useState<TenantSSOConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TenantSSOConfig | null>(null);
  const [formData, setFormData] = useState<Partial<TenantSSOConfig>>({
    provider: 'SAML',
    status: 'TESTING',
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    loadConfigs();
  }, [tenantId]);

  const loadConfigs = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tenant-sso-configs?tenant_id=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load SSO configs');

      const result = await response.json();
      setConfigs(result.data || []);
    } catch (error) {
      console.error('Error loading SSO configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingConfig
        ? `${API_BASE_URL}/tenant-sso-configs/${editingConfig._id}`
        : `${API_BASE_URL}/tenant-sso-configs`;

      const method = editingConfig ? 'PATCH' : 'POST';

      const payload = editingConfig
        ? { ...formData, version: editingConfig.version }
        : { ...formData, tenant_id: tenantId };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save SSO config');
      }

      await loadConfigs();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving SSO config:', error);
      alert(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  const handleDelete = async (config: TenantSSOConfig) => {
    if (!confirm(`Delete SSO config "${config.name}"?`)) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/tenant-sso-configs/${config._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete SSO config');

      await loadConfigs();
    } catch (error) {
      console.error('Error deleting SSO config:', error);
      alert('Failed to delete SSO config');
    }
  };

  const handleTestConfig = async (config: TenantSSOConfig) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tenant-sso-configs/${config._id}/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Configuration is valid!');
      } else {
        const message = [
          'Configuration has issues:',
          ...result.errors?.map((e: string) => `❌ ${e}`) || [],
          ...result.warnings?.map((w: string) => `⚠️ ${w}`) || [],
        ].join('\n');
        alert(message);
      }
    } catch (error) {
      console.error('Error testing SSO config:', error);
      alert('Failed to test configuration');
    }
  };

  const handleOpenDialog = (config?: TenantSSOConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData(config);
    } else {
      setEditingConfig(null);
      setFormData({
        provider: 'SAML',
        status: 'TESTING',
        scopes: ['openid', 'profile', 'email'],
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingConfig(null);
    setFormData({
      provider: 'SAML',
      status: 'TESTING',
      scopes: ['openid', 'profile', 'email'],
    });
  };

  const getProviderIcon = (provider: string) => {
    return <Shield className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'TESTING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading SSO configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SSO Configurations</h3>
          <p className="text-sm text-gray-500">
            Manage SAML, OAuth2, and OIDC single sign-on integrations
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add SSO Config
        </Button>
      </div>

      {/* Configs List */}
      {configs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No SSO configurations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Get started by adding your first SSO integration
          </p>
          <Button onClick={() => handleOpenDialog()} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add SSO Config
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <div
              key={config._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    {getProviderIcon(config.provider)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {config.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {config.provider}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(config.status)}`}>
                        {config.status}
                      </Badge>
                    </div>
                    {config.description && (
                      <p className="text-sm text-gray-500 mb-2">{config.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {config.provider === 'SAML' && config.entity_id && (
                        <div>
                          <span className="font-medium">Entity ID:</span> {config.entity_id}
                        </div>
                      )}
                      {(config.provider === 'OAUTH2' || config.provider === 'OIDC') && config.client_id && (
                        <div>
                          <span className="font-medium">Client ID:</span> {config.client_id}
                        </div>
                      )}
                      {config.scopes && config.scopes.length > 0 && (
                        <div>
                          <span className="font-medium">Scopes:</span> {config.scopes.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConfig(config)}
                    title="Test Configuration"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(config)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(config)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit SSO Configuration' : 'Add SSO Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure single sign-on integration for this tenant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value as any })}
                  disabled={!!editingConfig}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAML">SAML 2.0</SelectItem>
                    <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
                    <SelectItem value="OIDC">OpenID Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TESTING">Testing</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Configuration Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Corporate SSO"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            {/* SAML-specific fields */}
            {formData.provider === 'SAML' && (
              <>
                <div>
                  <Label htmlFor="entity_id">Entity ID *</Label>
                  <Input
                    id="entity_id"
                    value={formData.entity_id || ''}
                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                    placeholder="https://idp.example.com/entity"
                  />
                </div>

                <div>
                  <Label htmlFor="sso_url">SSO URL *</Label>
                  <Input
                    id="sso_url"
                    value={formData.sso_url || ''}
                    onChange={(e) => setFormData({ ...formData, sso_url: e.target.value })}
                    placeholder="https://idp.example.com/sso"
                  />
                </div>

                <div>
                  <Label htmlFor="slo_url">SLO URL (Optional)</Label>
                  <Input
                    id="slo_url"
                    value={formData.slo_url || ''}
                    onChange={(e) => setFormData({ ...formData, slo_url: e.target.value })}
                    placeholder="https://idp.example.com/slo"
                  />
                </div>

                <div>
                  <Label htmlFor="certificate">X.509 Certificate</Label>
                  <Textarea
                    id="certificate"
                    value={formData.certificate || ''}
                    onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="metadata_url">Metadata URL (Optional)</Label>
                  <Input
                    id="metadata_url"
                    value={formData.metadata_url || ''}
                    onChange={(e) => setFormData({ ...formData, metadata_url: e.target.value })}
                    placeholder="https://idp.example.com/metadata"
                  />
                </div>
              </>
            )}

            {/* OAuth2/OIDC-specific fields */}
            {(formData.provider === 'OAUTH2' || formData.provider === 'OIDC') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_id">Client ID *</Label>
                    <Input
                      id="client_id"
                      value={formData.client_id || ''}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      placeholder="client_id_here"
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_secret">Client Secret</Label>
                    <Input
                      id="client_secret"
                      type="password"
                      value={formData.client_secret || ''}
                      onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="authorization_endpoint">Authorization Endpoint *</Label>
                  <Input
                    id="authorization_endpoint"
                    value={formData.authorization_endpoint || ''}
                    onChange={(e) => setFormData({ ...formData, authorization_endpoint: e.target.value })}
                    placeholder="https://idp.example.com/oauth/authorize"
                  />
                </div>

                <div>
                  <Label htmlFor="token_endpoint">Token Endpoint *</Label>
                  <Input
                    id="token_endpoint"
                    value={formData.token_endpoint || ''}
                    onChange={(e) => setFormData({ ...formData, token_endpoint: e.target.value })}
                    placeholder="https://idp.example.com/oauth/token"
                  />
                </div>

                {formData.provider === 'OIDC' && (
                  <>
                    <div>
                      <Label htmlFor="userinfo_endpoint">UserInfo Endpoint</Label>
                      <Input
                        id="userinfo_endpoint"
                        value={formData.userinfo_endpoint || ''}
                        onChange={(e) => setFormData({ ...formData, userinfo_endpoint: e.target.value })}
                        placeholder="https://idp.example.com/oauth/userinfo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jwks_uri">JWKS URI</Label>
                      <Input
                        id="jwks_uri"
                        value={formData.jwks_uri || ''}
                        onChange={(e) => setFormData({ ...formData, jwks_uri: e.target.value })}
                        placeholder="https://idp.example.com/.well-known/jwks.json"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="scopes">Scopes (comma-separated)</Label>
                  <Input
                    id="scopes"
                    value={formData.scopes?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      scopes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="openid, profile, email"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingConfig ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
