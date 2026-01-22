/**
 * UserAuthMethodsTab Component
 * Manages linked identities and MFA methods for a user
 * Used in UserDetailPage
 * 
 * ✅ REWRITTEN 2026-01-20: Uses userLinkedIdentitiesApi and userMfaMethodsApi with Dialogs
 */

import { useState, useEffect } from 'react';
import { 
  Shield, Key, Link2, Plus, Trash2, Edit, Loader2, 
  Smartphone, Mail, KeyRound, CheckCircle2, XCircle,
  Clock, Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { LinkedIdentityDialog } from './LinkedIdentityDialog';
import { MFAMethodDialog } from './MFAMethodDialog';
import { 
  userLinkedIdentitiesApi, 
  UserLinkedIdentity, 
  IdentityProvider 
} from '../../api/userLinkedIdentitiesApi';
import {
  userMfaMethodsApi,
  UserMfaMethod,
  MfaMethodType
} from '../../api/userMfaMethodsApi';
import { 
  IDENTITY_PROVIDERS as UI_IDENTITY_PROVIDERS, 
  IDENTITY_STATUSES as UI_IDENTITY_STATUSES, 
  MFA_METHOD_TYPES, 
  MFA_STATUSES 
} from '../../data/user-auth-methods';
import { toast } from 'sonner@2.0.3';

interface UserAuthMethodsTabProps {
  userId: string;
}

export function UserAuthMethodsTab({ userId }: UserAuthMethodsTabProps) {
  const [linkedIdentities, setLinkedIdentities] = useState<UserLinkedIdentity[]>([]);
  const [mfaMethods, setMfaMethods] = useState<UserMfaMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Identity Dialog State
  const [showAddIdentity, setShowAddIdentity] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<UserLinkedIdentity | null>(null);
  
  // MFA Dialog State
  const [showAddMFA, setShowAddMFA] = useState(false);
  const [editingMFA, setEditingMFA] = useState<UserMfaMethod | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLinkedIdentities(),
        loadMFAMethods(),
      ]);
    } catch (error) {
      console.error('Error loading auth methods:', error);
      toast.error('Failed to load authentication methods');
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedIdentities = async () => {
    try {
      const identities = await userLinkedIdentitiesApi.getByUserId(userId);
      setLinkedIdentities(identities);
    } catch (error) {
      console.error('Error loading linked identities:', error);
      toast.error('Failed to load linked identities');
    }
  };

  const loadMFAMethods = async () => {
    try {
      const methods = await userMfaMethodsApi.getByUserId(userId);
      setMfaMethods(methods);
    } catch (error) {
      console.error('Error loading MFA methods:', error);
      // Don't show toast here to avoid double errors if both fail
    }
  };

  // IDENTITY HANDLERS

  const handleDeleteIdentity = async (identity: UserLinkedIdentity) => {
    if (!confirm(`Are you sure you want to remove ${identity.provider} login?`)) return;

    try {
      await userLinkedIdentitiesApi.delete(identity._id);
      toast.success('Identity removed successfully');
      await loadLinkedIdentities();
    } catch (error: any) {
      console.error('Error deleting identity:', error);
      toast.error(error.message || 'Failed to remove identity');
    }
  };

  const handleEditIdentity = (identity: UserLinkedIdentity) => {
    setEditingIdentity(identity);
    setShowAddIdentity(true);
  };

  // MFA HANDLERS

  const handleDeleteMFA = async (method: UserMfaMethod) => {
    if (!confirm(`Remove ${method.method_type} MFA method?`)) return;

    try {
      await userMfaMethodsApi.delete(method._id);
      toast.success('MFA method removed');
      await loadMFAMethods();
    } catch (error: any) {
      console.error('Error deleting MFA method:', error);
      toast.error(error.message || 'Failed to remove MFA method');
    }
  };

  const handleEditMFA = (method: UserMfaMethod) => {
    setEditingMFA(method);
    setShowAddMFA(true);
  };

  // HELPERS

  const getProviderConfig = (provider: IdentityProvider) => {
    return UI_IDENTITY_PROVIDERS.find(p => p.value === provider) || 
           { value: provider, label: provider, color: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const getMFATypeConfig = (type: MfaMethodType) => {
    return MFA_METHOD_TYPES.find(t => t.value === type) || MFA_METHOD_TYPES[0];
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Linked Identities Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Linked Accounts
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Social login providers and identity accounts
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingIdentity(null);
              setShowAddIdentity(true);
            }} 
            variant="outline" 
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Link Account
          </Button>
        </div>

        {linkedIdentities.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No linked accounts. Connect social login providers for easier sign-in.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedIdentities.map((identity) => {
              const providerConfig = getProviderConfig(identity.provider);
              const statusConfig = UI_IDENTITY_STATUSES.find(s => s.value === identity.status);

              return (
                <div
                  key={identity._id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${providerConfig.color}`}>
                        <Link2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{providerConfig.label}</h3>
                          {identity.is_primary && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {identity.provider_email || identity.display_name || identity.provider_username || 'No identifier'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditIdentity(identity)}
                        title="Edit Identity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIdentity(identity)}
                        className="text-red-600 hover:bg-red-50"
                        title="Remove Identity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${statusConfig?.color}`}>
                      {statusConfig?.label}
                    </span>
                    {identity.is_verified && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last used: {formatDate(identity.last_used_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MFA Methods Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Multi-Factor Authentication
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Additional security methods for account protection
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingMFA(null);
              setShowAddMFA(true);
            }} 
            variant="outline" 
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add MFA Method
          </Button>
        </div>

        {mfaMethods.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No MFA methods configured. Add two-factor authentication for enhanced security.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mfaMethods.map((method) => {
              const typeConfig = getMFATypeConfig(method.method_type);
              const statusConfig = MFA_STATUSES.find(s => s.value === method.status);

              const getMethodIcon = () => {
                switch (method.method_type) {
                  case 'TOTP': return KeyRound;
                  case 'SMS': return Smartphone;
                  case 'EMAIL': return Mail;
                  case 'WEBAUTHN': return Key;
                  default: return Shield;
                }
              };

              const Icon = getMethodIcon();

              return (
                <div
                  key={method._id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{typeConfig.label}</h3>
                          {method.is_primary && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.method_name || typeConfig.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMFA(method)}
                        title="Edit MFA Method"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMFA(method)}
                        className="text-red-600 hover:bg-red-50"
                        disabled={method.is_enforced}
                        title={method.is_enforced ? "Cannot remove enforced method" : "Remove Method"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Method Details */}
                  {method.method_type === 'SMS' && method.sms_phone_number && (
                    <p className="text-sm mb-2">📱 {method.sms_phone_number}</p>
                  )}
                  {method.method_type === 'EMAIL' && method.email_address && (
                    <p className="text-sm mb-2">✉️ {method.email_address}</p>
                  )}
                  {method.device_name && (
                    <p className="text-sm mb-2">📱 {method.device_name}</p>
                  )}

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${statusConfig?.color}`}>
                      {statusConfig?.label}
                    </span>
                    {method.is_verified && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {method.is_enforced && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded border border-red-200">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Usage Stats */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Success: {method.success_count}</span>
                      <span>Failed: {method.failure_count}</span>
                    </div>
                    {method.method_type === 'BACKUP_CODES' && (
                      <div>
                        Codes: {method.backup_codes_total! - (method.backup_codes_used || 0)} / {method.backup_codes_total} remaining
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last used: {formatDate(method.last_used_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Security Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">{linkedIdentities.length}</div>
            <div className="text-sm text-muted-foreground">Linked Accounts</div>
          </div>
          <div className="bg-background rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">{mfaMethods.length}</div>
            <div className="text-sm text-muted-foreground">MFA Methods</div>
          </div>
          <div className="bg-background rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">
              {mfaMethods.filter(m => m.is_verified).length}
            </div>
            <div className="text-sm text-muted-foreground">Verified Methods</div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      {mfaMethods.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Enable Two-Factor Authentication</h4>
              <p className="text-sm text-yellow-800">
                Protect this account by adding at least one MFA method. We recommend using an authenticator app like Google Authenticator or Authy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Linked Identity Dialog */}
      <LinkedIdentityDialog 
        open={showAddIdentity} 
        onOpenChange={(open) => {
          setShowAddIdentity(open);
          if (!open) setEditingIdentity(null);
        }}
        userId={userId}
        identity={editingIdentity}
        onSuccess={loadLinkedIdentities}
      />

      {/* MFA Method Dialog */}
      <MFAMethodDialog 
        open={showAddMFA} 
        onOpenChange={(open) => {
          setShowAddMFA(open);
          if (!open) setEditingMFA(null);
        }}
        userId={userId}
        method={editingMFA}
        onSuccess={loadMFAMethods}
      />
    </div>
  );
}