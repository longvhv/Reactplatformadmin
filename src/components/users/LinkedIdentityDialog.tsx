/**
 * LinkedIdentityDialog Component
 * Dialog for adding/editing user linked identities
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  userLinkedIdentitiesApi, 
  UserLinkedIdentity, 
  IDENTITY_PROVIDERS, 
  IDENTITY_STATUSES 
} from '@/api/userLinkedIdentitiesApi';
import { toast } from 'sonner@2.0.3';
import { Link2, Save, X } from 'lucide-react';

interface LinkedIdentityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  identity?: UserLinkedIdentity | null; // If provided, edit mode
  onSuccess: () => void;
}

export function LinkedIdentityDialog({
  open,
  onOpenChange,
  userId,
  identity,
  onSuccess,
}: LinkedIdentityDialogProps) {
  const isEditing = !!identity;
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [provider, setProvider] = useState<string>('GOOGLE');
  const [providerUserId, setProviderUserId] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerUsername, setProviderUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [isVerified, setIsVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [metadata, setMetadata] = useState('{}');

  // Load identity data when editing
  useEffect(() => {
    if (open && identity) {
      setProvider(identity.provider);
      setProviderUserId(identity.provider_user_id);
      setProviderEmail(identity.provider_email || '');
      setProviderUsername(identity.provider_username || '');
      setDisplayName(identity.display_name || '');
      setStatus(identity.status);
      setIsVerified(identity.is_verified);
      setIsPrimary(identity.is_primary);
      setMetadata(JSON.stringify(identity.metadata || {}, null, 2));
    } else if (open && !identity) {
      // Reset form for create mode
      setProvider('GOOGLE');
      setProviderUserId('');
      setProviderEmail('');
      setProviderUsername('');
      setDisplayName('');
      setStatus('ACTIVE');
      setIsVerified(false);
      setIsPrimary(false);
      setMetadata('{}');
    }
  }, [open, identity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!providerUserId.trim()) {
      toast.error('Provider User ID is required');
      return;
    }

    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      toast.error('Metadata must be valid JSON');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && identity) {
        await userLinkedIdentitiesApi.update(identity._id, {
          provider_username: providerUsername || undefined,
          provider_email: providerEmail || undefined,
          display_name: displayName || undefined,
          status: status as any,
          is_verified: isVerified,
          is_primary: isPrimary,
          metadata: parsedMetadata,
          version: identity.version,
        });
        toast.success('Identity updated successfully');
      } else {
        await userLinkedIdentitiesApi.linkIdentity({
          user_id: userId,
          provider: provider as any,
          provider_user_id: providerUserId,
          provider_username: providerUsername || undefined,
          provider_email: providerEmail || undefined,
          display_name: displayName || undefined,
          status: status as any,
          is_verified: isVerified,
          is_primary: isPrimary,
          metadata: parsedMetadata,
        });
        toast.success('Identity linked successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving identity:', error);
      toast.error(error.message || 'Failed to save identity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {isEditing ? 'Edit Linked Identity' : 'Link New Identity'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update details for this linked identity.' 
              : 'Manually link an external identity to this user.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider <span className="text-red-500">*</span></Label>
              <Select 
                value={provider} 
                onValueChange={setProvider}
                disabled={isEditing} // Cannot change provider when editing
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {IDENTITY_PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider User ID */}
            <div className="space-y-2">
              <Label htmlFor="provider_user_id">Provider User ID <span className="text-red-500">*</span></Label>
              <Input
                id="provider_user_id"
                value={providerUserId}
                onChange={(e) => setProviderUserId(e.target.value)}
                placeholder="e.g. 123456789"
                disabled={isEditing} // Cannot change ID when editing
                required
              />
              <p className="text-xs text-muted-foreground">Unique ID from the provider</p>
            </div>

            {/* Provider Email */}
            <div className="space-y-2">
              <Label htmlFor="provider_email">Provider Email</Label>
              <Input
                id="provider_email"
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="email@provider.com"
              />
            </div>

            {/* Provider Username */}
            <div className="space-y-2">
              <Label htmlFor="provider_username">Provider Username</Label>
              <Input
                id="provider_username"
                value={providerUsername}
                onChange={(e) => setProviderUsername(e.target.value)}
                placeholder="username"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDENTITY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_verified" 
                checked={isVerified} 
                onCheckedChange={(checked) => setIsVerified(!!checked)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="is_verified" className="cursor-pointer">
                  Is Verified
                </Label>
                <p className="text-xs text-muted-foreground">
                  The identity has been verified by the provider (e.g. email confirmed)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_primary" 
                checked={isPrimary} 
                onCheckedChange={(checked) => setIsPrimary(!!checked)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="is_primary" className="cursor-pointer">
                  Primary Identity
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use this identity as the main one for this user
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              className="font-mono text-xs min-h-[100px]"
              placeholder="{}"
            />
          </div>

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
              {isEditing ? 'Save Changes' : 'Link Identity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
