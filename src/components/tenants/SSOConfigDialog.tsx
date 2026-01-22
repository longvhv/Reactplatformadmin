/**
 * SSOConfigDialog Component
 * Dialog for adding/editing tenant SSO configurations
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  TenantSSOConfig,
  CreateSSOConfigRequest,
  UpdateSSOConfigRequest,
  SSOProvider,
  SSOConfigStatus,
  SSOProviderHelper,
} from '../../api/tenantSSOConfigsApi';
import { toast } from 'sonner@2.0.3';
import { Shield, Save, X } from 'lucide-react';

interface SSOConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  config?: TenantSSOConfig | null; // If provided, edit mode
  onSave: (data: CreateSSOConfigRequest | UpdateSSOConfigRequest) => Promise<void>;
}

export function SSOConfigDialog({
  open,
  onOpenChange,
  tenantId,
  config,
  onSave,
}: SSOConfigDialogProps) {
  const isEditing = !!config;
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [provider, setProvider] = useState<SSOProvider>('SAML');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<SSOConfigStatus>('TESTING');
  
  // SAML fields
  const [entityId, setEntityId] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [sloUrl, setSloUrl] = useState('');
  const [certificate, setCertificate] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');

  // OAuth2/OIDC fields
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [authEndpoint, setAuthEndpoint] = useState('');
  const [tokenEndpoint, setTokenEndpoint] = useState('');
  const [userinfoEndpoint, setUserinfoEndpoint] = useState('');
  const [jwksUri, setJwksUri] = useState('');
  
  // JSON fields
  const [scopes, setScopes] = useState('');
  const [attributeMapping, setAttributeMapping] = useState('{}');
  const [settings, setSettings] = useState('{}');

  // Load config data when editing
  useEffect(() => {
    if (open && config) {
      setProvider(config.provider);
      setName(config.name);
      setDescription(config.description || '');
      setStatus(config.status);
      
      setEntityId(config.entity_id || '');
      setSsoUrl(config.sso_url || '');
      setSloUrl(config.slo_url || '');
      setCertificate(config.certificate || '');
      setMetadataUrl(config.metadata_url || '');
      
      setClientId(config.client_id || '');
      // Only set client secret placeholder if it exists (for security)
      setClientSecret(config.client_secret ? '********' : '');
      setAuthEndpoint(config.authorization_endpoint || '');
      setTokenEndpoint(config.token_endpoint || '');
      setUserinfoEndpoint(config.userinfo_endpoint || '');
      setJwksUri(config.jwks_uri || '');
      
      setScopes(Array.isArray(config.scopes) ? config.scopes.join(', ') : '');
      setAttributeMapping(JSON.stringify(config.attribute_mapping || {}, null, 2));
      setSettings(JSON.stringify(config.settings || {}, null, 2));
    } else if (open && !config) {
      // Reset form for create mode
      setProvider('SAML');
      setName('');
      setDescription('');
      setStatus('TESTING');
      
      setEntityId('');
      setSsoUrl('');
      setSloUrl('');
      setCertificate('');
      setMetadataUrl('');
      
      setClientId('');
      setClientSecret('');
      setAuthEndpoint('');
      setTokenEndpoint('');
      setUserinfoEndpoint('');
      setJwksUri('');
      
      setScopes('openid, profile, email');
      setAttributeMapping(JSON.stringify({
        email: 'email',
        first_name: 'given_name',
        last_name: 'family_name',
      }, null, 2));
      setSettings('{}');
    }
  }, [open, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast.error('Configuration Name is required');
      return;
    }

    if (SSOProviderHelper.isSAML(provider)) {
      if (!entityId) {
        toast.error('Entity ID is required for SAML');
        return;
      }
      if (!ssoUrl) {
        toast.error('SSO URL is required for SAML');
        return;
      }
    } else if (SSOProviderHelper.isOAuth2(provider) || SSOProviderHelper.isOIDC(provider)) {
      if (!clientId) {
        toast.error('Client ID is required');
        return;
      }
      if (!authEndpoint) {
        toast.error('Authorization Endpoint is required');
        return;
      }
      if (!tokenEndpoint) {
        toast.error('Token Endpoint is required');
        return;
      }
    } else if (SSOProviderHelper.isCAS(provider)) {
       if (!ssoUrl) {
        toast.error('SSO URL is required for CAS');
        return;
      }
    }

    let parsedScopes: string[] = [];
    try {
      parsedScopes = scopes.split(',').map(s => s.trim()).filter(Boolean);
    } catch (error) {
      toast.error('Scopes format is invalid');
      return;
    }

    let parsedMapping = {};
    try {
      parsedMapping = JSON.parse(attributeMapping);
    } catch (error) {
      toast.error('Attribute Mapping must be valid JSON');
      return;
    }

    let parsedSettings = {};
    try {
      parsedSettings = JSON.parse(settings);
    } catch (error) {
      toast.error('Settings must be valid JSON');
      return;
    }

    try {
      setSubmitting(true);

      const commonData = {
        provider,
        name,
        description: description || null,
        status,
        entity_id: entityId || null,
        sso_url: ssoUrl || null,
        slo_url: sloUrl || null,
        certificate: certificate || null,
        metadata_url: metadataUrl || null,
        client_id: clientId || null,
        authorization_endpoint: authEndpoint || null,
        token_endpoint: tokenEndpoint || null,
        userinfo_endpoint: userinfoEndpoint || null,
        jwks_uri: jwksUri || null,
        scopes: parsedScopes,
        attribute_mapping: parsedMapping,
        settings: parsedSettings,
      };

      // Handle client secret separately
      // For create: send if provided
      // For update: only send if changed (not the placeholder)
      let secretToSend: string | null | undefined = undefined;
      if (clientSecret && clientSecret !== '********') {
        secretToSend = clientSecret;
      } else if (!clientSecret) {
        secretToSend = null;
      }
      
      if (isEditing && config) {
        await onSave({
          ...commonData,
          client_secret: secretToSend,
          version: config.version,
        } as UpdateSSOConfigRequest);
      } else {
        await onSave({
          ...commonData,
          tenant_id: tenantId,
          client_secret: secretToSend,
        } as CreateSSOConfigRequest);
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving SSO config:', error);
      toast.error(error.message || 'Failed to save SSO config');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {isEditing ? 'Edit SSO Configuration' : 'Add SSO Configuration'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update single sign-on integration details.' 
              : 'Configure a new single sign-on provider for this tenant.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider <span className="text-red-500">*</span></Label>
                <Select 
                  value={provider} 
                  onValueChange={(v) => setProvider(v as SSOProvider)}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAML">SAML 2.0</SelectItem>
                    <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
                    <SelectItem value="OIDC">OpenID Connect</SelectItem>
                    <SelectItem value="LDAP">LDAP</SelectItem>
                    <SelectItem value="CAS">CAS</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                <Select 
                  value={status} 
                  onValueChange={(v) => setStatus(v as SSOConfigStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TESTING">Testing</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Configuration Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Corporate Okta SSO"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* 2. Provider Specific Settings */}
          {SSOProviderHelper.isSAML(provider) && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-muted-foreground">SAML Configuration</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity_id">Entity ID (Issuer) <span className="text-red-500">*</span></Label>
                  <Input
                    id="entity_id"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="https://idp.example.com/entity"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sso_url">SSO URL (Login) <span className="text-red-500">*</span></Label>
                  <Input
                    id="sso_url"
                    value={ssoUrl}
                    onChange={(e) => setSsoUrl(e.target.value)}
                    placeholder="https://idp.example.com/sso"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slo_url">SLO URL (Logout)</Label>
                  <Input
                    id="slo_url"
                    value={sloUrl}
                    onChange={(e) => setSloUrl(e.target.value)}
                    placeholder="https://idp.example.com/slo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate">X.509 Certificate</Label>
                  <Textarea
                    id="certificate"
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metadata_url">Metadata URL</Label>
                  <Input
                    id="metadata_url"
                    value={metadataUrl}
                    onChange={(e) => setMetadataUrl(e.target.value)}
                    placeholder="https://idp.example.com/metadata"
                  />
                </div>
              </div>
            </div>
          )}

          {(SSOProviderHelper.isOAuth2(provider) || SSOProviderHelper.isOIDC(provider)) && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-muted-foreground">OAuth2 / OIDC Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID <span className="text-red-500">*</span></Label>
                  <Input
                    id="client_id"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="client_id"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={isEditing ? 'Leave blank to keep unchanged' : 'client_secret'}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="auth_endpoint">Authorization Endpoint <span className="text-red-500">*</span></Label>
                  <Input
                    id="auth_endpoint"
                    value={authEndpoint}
                    onChange={(e) => setAuthEndpoint(e.target.value)}
                    placeholder="https://idp.example.com/oauth/authorize"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="token_endpoint">Token Endpoint <span className="text-red-500">*</span></Label>
                  <Input
                    id="token_endpoint"
                    value={tokenEndpoint}
                    onChange={(e) => setTokenEndpoint(e.target.value)}
                    placeholder="https://idp.example.com/oauth/token"
                    required
                  />
                </div>

                {SSOProviderHelper.isOIDC(provider) && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="userinfo_endpoint">UserInfo Endpoint</Label>
                      <Input
                        id="userinfo_endpoint"
                        value={userinfoEndpoint}
                        onChange={(e) => setUserinfoEndpoint(e.target.value)}
                        placeholder="https://idp.example.com/oauth/userinfo"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="jwks_uri">JWKS URI</Label>
                      <Input
                        id="jwks_uri"
                        value={jwksUri}
                        onChange={(e) => setJwksUri(e.target.value)}
                        placeholder="https://idp.example.com/.well-known/jwks.json"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="scopes">Scopes (comma-separated)</Label>
                  <Input
                    id="scopes"
                    value={scopes}
                    onChange={(e) => setScopes(e.target.value)}
                    placeholder="openid, profile, email"
                  />
                </div>
              </div>
            </div>
          )}

          {SSOProviderHelper.isCAS(provider) && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-muted-foreground">CAS Configuration</h3>
              <div className="space-y-2">
                <Label htmlFor="sso_url">CAS Server URL <span className="text-red-500">*</span></Label>
                <Input
                  id="sso_url"
                  value={ssoUrl}
                  onChange={(e) => setSsoUrl(e.target.value)}
                  placeholder="https://cas.example.com"
                  required
                />
              </div>
            </div>
          )}

          {SSOProviderHelper.isLDAP(provider) && (
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-medium text-muted-foreground">LDAP Configuration</h3>
              <div className="bg-muted/30 p-4 rounded-md text-sm text-muted-foreground">
                 LDAP configuration is handled via the "Settings" JSON field below. 
                 Please ensure you provide <code>ldap_host</code>, <code>ldap_port</code>, 
                 <code>ldap_base_dn</code>, etc.
              </div>
            </div>
          )}

          {/* 3. Advanced Settings */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Configuration (JSON)</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attribute_mapping">Attribute Mapping</Label>
                    <Textarea
                      id="attribute_mapping"
                      value={attributeMapping}
                      onChange={(e) => setAttributeMapping(e.target.value)}
                      className="font-mono text-xs min-h-[150px]"
                      placeholder="{}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Map provider attributes to user fields (email, first_name, last_name, etc.)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings">Custom Settings</Label>
                    <Textarea
                      id="settings"
                      value={settings}
                      onChange={(e) => setSettings(e.target.value)}
                      className="font-mono text-xs min-h-[150px]"
                      placeholder="{}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Provider-specific settings (e.g. LDAP config, security options)
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Save Changes' : 'Create Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
