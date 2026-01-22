'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { 
  userMfaMethodsApi, 
  CreateMfaMethodRequest, 
  UpdateMfaMethodRequest, 
  MfaMethodStatus,
  MfaMethodStatusHelper,
  MfaMethodType,
  MfaMethodTypeHelper
} from '../../api/userMfaMethodsApi';
import { toast } from 'sonner@2.0.3';
import { Shield, Save, X } from 'lucide-react';

interface MFAMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  method?: UserMfaMethod | null; // If provided, edit mode
  onSuccess: () => void;
}

export function MFAMethodDialog({
  open,
  onOpenChange,
  userId,
  method,
  onSuccess,
}: MFAMethodDialogProps) {
  const isEditing = !!method;
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [methodType, setMethodType] = useState<string>('TOTP');
  const [methodName, setMethodName] = useState('');
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [status, setStatus] = useState<string>('PENDING');
  const [isVerified, setIsVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isEnforced, setIsEnforced] = useState(false);
  const [metadata, setMetadata] = useState('{}');

  // Load method data when editing
  useEffect(() => {
    if (open && method) {
      setMethodType(method.method_type);
      setMethodName(method.method_name || '');
      setSmsPhoneNumber(method.sms_phone_number || '');
      setEmailAddress(method.email_address || '');
      setDeviceName(method.device_name || '');
      setStatus(method.status);
      setIsVerified(method.is_verified);
      setIsPrimary(method.is_primary);
      setIsEnforced(method.is_enforced);
      setMetadata(JSON.stringify(method.metadata || {}, null, 2));
    } else if (open && !method) {
      // Reset form for create mode
      setMethodType('TOTP');
      setMethodName('');
      setSmsPhoneNumber('');
      setEmailAddress('');
      setDeviceName('');
      setStatus('PENDING');
      setIsVerified(false);
      setIsPrimary(false);
      setIsEnforced(false);
      setMetadata('{}');
    }
  }, [open, method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (MfaMethodTypeHelper.requiresPhone(methodType as MfaMethodType) && !smsPhoneNumber.trim()) {
      toast.error('Phone number is required for SMS');
      return;
    }
    if (MfaMethodTypeHelper.requiresEmail(methodType as MfaMethodType) && !emailAddress.trim()) {
      toast.error('Email address is required for Email MFA');
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

      // Update
      if (isEditing && method) {
        await userMfaMethodsApi.update(method._id, {
          method_name: methodName || undefined,
          sms_phone_number: MfaMethodTypeHelper.requiresPhone(methodType as MfaMethodType) ? smsPhoneNumber : undefined,
          email_address: MfaMethodTypeHelper.requiresEmail(methodType as MfaMethodType) ? emailAddress : undefined,
          device_name: deviceName || undefined,
          status: status as any,
          is_verified: isVerified,
          is_primary: isPrimary,
          is_enforced: isEnforced,
          metadata: parsedMetadata,
          version: method.version,
        });
        toast.success('MFA method updated successfully');
      } else {
        // Create new method
        await userMfaMethodsApi.create({
          user_id: userId,
          method_type: methodType as MfaMethodType,
          method_name: methodName || undefined,
          sms_phone_number: MfaMethodTypeHelper.requiresPhone(methodType as MfaMethodType) ? smsPhoneNumber : undefined,
          email_address: MfaMethodTypeHelper.requiresEmail(methodType as MfaMethodType) ? emailAddress : undefined,
          device_name: deviceName || undefined,
          status: status as any,
          is_verified: isVerified,
          is_primary: isPrimary,
          is_enforced: isEnforced,
          metadata: parsedMetadata,
          // For administrative creation, we assume setup might be needed later or handled externally
        });
        toast.success('MFA method added successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving MFA method:', error);
      toast.error(error.message || 'Failed to save MFA method');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {isEditing ? 'Edit MFA Method' : 'Add MFA Method'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update details for this authentication method.' 
              : 'Manually provision a new MFA method for this user.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method Type */}
            <div className="space-y-2">
              <Label htmlFor="method_type">Method Type <span className="text-red-500">*</span></Label>
              <Select 
                value={methodType} 
                onValueChange={setMethodType}
                disabled={isEditing} // Cannot change type when editing
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MfaMethodTypeHelper.getTypes().map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Method Name */}
            <div className="space-y-2">
              <Label htmlFor="method_name">Method Name</Label>
              <Input
                id="method_name"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                placeholder="e.g. My iPhone, Work Email"
              />
            </div>

            {/* Conditional Fields based on Type */}
            {MfaMethodTypeHelper.requiresPhone(methodType as MfaMethodType) && (
              <div className="space-y-2">
                <Label htmlFor="sms_phone_number">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id="sms_phone_number"
                  value={smsPhoneNumber}
                  onChange={(e) => setSmsPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>
            )}

            {MfaMethodTypeHelper.requiresEmail(methodType as MfaMethodType) && (
              <div className="space-y-2">
                <Label htmlFor="email_address">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="email_address"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
            )}

            {MfaMethodTypeHelper.requiresDevice(methodType as MfaMethodType) && (
              <div className="space-y-2">
                <Label htmlFor="device_name">Device Name</Label>
                <Input
                  id="device_name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Chrome on macOS"
                />
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MfaMethodStatusHelper.getStatuses().map((s) => (
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
                  The method has been proven to work (e.g. code successfully entered)
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
                  Primary Method
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use this as the default MFA method
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_enforced" 
                checked={isEnforced} 
                onCheckedChange={(checked) => setIsEnforced(!!checked)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="is_enforced" className="cursor-pointer">
                  Enforced
                </Label>
                <p className="text-xs text-muted-foreground">
                  User cannot remove this method and must use it
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
              {isEditing ? 'Save Changes' : 'Add Method'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}