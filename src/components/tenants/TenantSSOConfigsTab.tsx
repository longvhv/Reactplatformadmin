/**
 * Tenant SSO Configs Tab Component
 * Manage SSO configurations for tenant (SAML, OAuth2, OIDC, LDAP, CAS, OTHER)
 * 
 * ✅ ENHANCED 2026-01-20: Uses dedicated SSOConfigDialog for full field support
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Shield, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useTenantSSOConfigs } from '../../hooks/useTenantSSOConfigs';
import {
  TenantSSOConfig,
  SSOProvider,
  getProviderLabel,
  getProviderColor,
  getStatusColor,
  CreateSSOConfigRequest,
  UpdateSSOConfigRequest,
} from '../../api/tenantSSOConfigsApi';
import { toast } from 'sonner@2.0.3';
import { SSOConfigDialog } from './SSOConfigDialog';

interface TenantSSOConfigsTabProps {
  tenantId: string;
}

export function TenantSSOConfigsTab({ tenantId }: TenantSSOConfigsTabProps) {
  const {
    configs,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    testConfig: testConfigHook,
    refresh,
  } = useTenantSSOConfigs({ tenant_id: tenantId });

  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TenantSSOConfig | null>(null);

  const handleSave = async (data: CreateSSOConfigRequest | UpdateSSOConfigRequest) => {
    try {
      if (editingConfig) {
        await updateConfig(editingConfig._id, data as UpdateSSOConfigRequest);
        toast.success('SSO config updated successfully');
      } else {
        await createConfig(data as CreateSSOConfigRequest);
        toast.success('SSO config created successfully');
      }
      refresh();
    } catch (err: any) {
      console.error('Failed to save SSO config:', err);
      throw err; // Propagate error to dialog to show toast there or handle it
    }
  };

  const handleDelete = async (config: TenantSSOConfig) => {
    if (!confirm(`Delete SSO config "${config.name}"? This action cannot be undone.`)) return;

    try {
      await deleteConfig(config._id);
      toast.success('SSO config deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete config');
    }
  };

  const handleTestConfig = async (config: TenantSSOConfig) => {
    try {
      const result = await testConfigHook(config._id);
      
      if (result.success) {
        toast.success('✅ Configuration is valid!');
      } else {
        const message = [
          'Configuration has issues:',
          ...result.errors?.map((e: string) => `❌ ${e}`) || [],
          ...result.warnings?.map((w: string) => `⚠️ ${w}`) || [],
        ].join('\n');
        toast.error(message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to test configuration');
    }
  };

  const handleOpenDialog = (config?: TenantSSOConfig) => {
    if (config) {
      setEditingConfig(config);
    } else {
      setEditingConfig(null);
    }
    setShowDialog(true);
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
                    <Shield className={`w-4 h-4 ${getProviderColor(config.provider)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {config.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getProviderLabel(config.provider)}
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
      <SSOConfigDialog 
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingConfig(null);
        }}
        tenantId={tenantId}
        config={editingConfig}
        onSave={handleSave}
      />
    </div>
  );
}
