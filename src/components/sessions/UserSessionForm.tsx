/**
 * UserSessionForm Component
 * Form for creating and editing user sessions
 * 
 * ✅ COMPLIANT with public.user_sessions schema
 * - Supports all 14 fields
 * - Validates session_token uniqueness (via API error handling)
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form@7.55.0';
import { toast } from 'sonner@2.0.3';
import { 
  Save, 
  X, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Tv, 
  Watch, 
  HelpCircle,
  Globe,
  MapPin,
  Clock,
  Shield
} from 'lucide-react';
import { 
  userSessionsApi, 
  UserSession, 
  CreateSessionRequest, 
  UpdateSessionRequest,
  DeviceType,
  DEVICE_TYPES,
  DeviceTypeHelper
} from '@/api/userSessionsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface UserSessionFormProps {
  initialData?: Partial<UserSession>;
  userId?: string;
  isEdit?: boolean;
  onSuccess?: (session: UserSession) => void;
  onCancel?: () => void;
}

interface FormData {
  user_id: string;
  session_token: string;
  device_name: string;
  device_type: DeviceType;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  expires_at: string;
  is_active: boolean;
  last_activity_at: string;
}

export function UserSessionForm({ 
  initialData, 
  userId, 
  isEdit = false, 
  onSuccess, 
  onCancel 
}: UserSessionFormProps) {
  const [loading, setLoading] = useState(false);

  // Generate random token for new sessions
  const defaultToken = isEdit ? '' : crypto.randomUUID();

  const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      user_id: initialData?.user_id || userId || '',
      session_token: initialData?.session_token || defaultToken,
      device_name: initialData?.device_name || '',
      device_type: (initialData?.device_type as DeviceType) || 'desktop',
      browser: initialData?.browser || '',
      os: initialData?.os || '',
      ip_address: initialData?.ip_address || '',
      location: initialData?.location || '',
      expires_at: initialData?.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : '',
      is_active: initialData?.is_active ?? true,
      last_activity_at: initialData?.last_activity_at ? new Date(initialData.last_activity_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const commonData = {
        device_name: data.device_name || null,
        device_type: data.device_type,
        browser: data.browser || null,
        os: data.os || null,
        ip_address: data.ip_address || null,
        location: data.location || null,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      };

      let result: UserSession;

      if (isEdit && initialData?._id) {
        // Update
        const updateData: UpdateSessionRequest = {
          ...commonData,
          is_active: data.is_active,
          last_activity_at: data.last_activity_at ? new Date(data.last_activity_at).toISOString() : undefined,
        };
        result = await userSessionsApi.update(initialData._id, updateData);
        toast.success('Session updated successfully');
      } else {
        // Create
        if (!data.user_id) {
          toast.error('User ID is required');
          setLoading(false);
          return;
        }
        if (!data.session_token) {
          toast.error('Session Token is required');
          setLoading(false);
          return;
        }

        const createData: CreateSessionRequest = {
          user_id: data.user_id,
          session_token: data.session_token,
          ...commonData,
        };
        result = await userSessionsApi.create(createData);
        toast.success('Session created successfully');
      }

      if (onSuccess) onSuccess(result);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    if (DeviceTypeHelper.isMobile(type as DeviceType)) return <Smartphone className="w-4 h-4" />;
    if (DeviceTypeHelper.isTablet(type as DeviceType)) return <Tablet className="w-4 h-4" />;
    if (DeviceTypeHelper.isSmartTV(type as DeviceType)) return <Tv className="w-4 h-4" />;
    if (DeviceTypeHelper.isWatch(type as DeviceType)) return <Watch className="w-4 h-4" />;
    if (DeviceTypeHelper.isOther(type as DeviceType)) return <HelpCircle className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Session' : 'Create New Session'}</CardTitle>
          <CardDescription>
            {isEdit 
              ? 'Update session details and status' 
              : 'Manually create a user session for testing or administrative purposes'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Identity & Token */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID <span className="text-red-500">*</span></Label>
              <Input 
                id="user_id" 
                {...register('user_id', { required: true })} 
                disabled={isEdit || !!userId} 
                className={errors.user_id ? "border-red-500" : ""}
              />
              {errors.user_id && <p className="text-sm text-red-500">User ID is required</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_token">Session Token <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="session_token" 
                  {...register('session_token', { required: true })} 
                  disabled={isEdit} // Token usually shouldn't change
                  className={`pl-9 ${errors.session_token ? "border-red-500" : ""}`}
                />
              </div>
              {errors.session_token && <p className="text-sm text-red-500">Token is required</p>}
            </div>
          </div>

          {/* Device Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="device_type">Device Type</Label>
              <Controller
                name="device_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(type)}
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="device_name">Device Name</Label>
              <Input id="device_name" {...register('device_name')} placeholder="e.g. iPhone 15 Pro" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="os">Operating System</Label>
              <Input id="os" {...register('os')} placeholder="e.g. iOS 17.2" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="browser">Browser</Label>
              <Input id="browser" {...register('browser')} placeholder="e.g. Safari" />
            </div>
          </div>

          {/* Network & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="ip_address" 
                  {...register('ip_address')} 
                  placeholder="e.g. 192.168.1.1" 
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="location" 
                  {...register('location')} 
                  placeholder="e.g. Hanoi, Vietnam" 
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Time & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t mt-2">
             <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="expires_at" 
                  type="datetime-local" 
                  {...register('expires_at')} 
                  className="pl-9"
                />
              </div>
            </div>

            {isEdit && (
               <div className="space-y-2">
                <Label htmlFor="last_activity_at">Last Activity</Label>
                <Input 
                  id="last_activity_at" 
                  type="datetime-local" 
                  {...register('last_activity_at')} 
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  id="is_active" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
            <Label htmlFor="is_active">Is Active (Session Valid)</Label>
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
             <>
               <span className="animate-spin mr-2">⏳</span> Saving...
             </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Update Session' : 'Create Session'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
