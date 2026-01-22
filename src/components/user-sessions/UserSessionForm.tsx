'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserSession, 
  CreateSessionRequest, 
  UpdateSessionRequest, 
  DeviceType,
  DEVICE_TYPES,
  DeviceTypeHelper
} from '../../api/userSessionsApi';
import { usersApi, User } from '../../api/usersApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { CalendarIcon, Save, Monitor, Smartphone, Tablet, Tv, Watch, HelpCircle } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { TimePicker } from '../ui/time-picker'; // Assuming we have or can use a time picker logic or simple input

interface UserSessionFormProps {
  initialData?: UserSession;
  isEdit?: boolean;
  onSubmit: (data: CreateSessionRequest | UpdateSessionRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserSessionForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: UserSessionFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateSessionRequest & UpdateSessionRequest>>({
    is_active: true,
    device_type: 'desktop',
    ...initialData
  });

  // Load users for selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await usersApi.getAll();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users', err);
        showToast.error('Error', 'Failed to load users list');
      }
    };
    
    // Only load users if we are creating or need to show user name
    loadUsers();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!isEdit && !formData.user_id) {
        showToast.error('Validation Error', 'User is required');
        return;
    }
    if (!isEdit && !formData.session_token) {
        showToast.error('Validation Error', 'Session Token is required');
        return;
    }

    try {
      await onSubmit(formData as any);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getDeviceIcon = (type?: string) => {
    if (DeviceTypeHelper.isDesktop(type as DeviceType)) return <Monitor className="w-4 h-4" />;
    if (DeviceTypeHelper.isMobile(type as DeviceType)) return <Smartphone className="w-4 h-4" />;
    if (DeviceTypeHelper.isTablet(type as DeviceType)) return <Tablet className="w-4 h-4" />;
    if (DeviceTypeHelper.isSmartTV(type as DeviceType)) return <Tv className="w-4 h-4" />;
    if (DeviceTypeHelper.isWatch(type as DeviceType)) return <Watch className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>
            {isEdit ? 'Update session information and status' : 'Create a new user session manually'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* User Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={!isEdit ? "required" : ""}>User</Label>
              {isEdit ? (
                <div className="p-2 bg-muted rounded-md text-sm">
                  {users.find(u => u._id === formData.user_id)?.full_name || formData.user_id}
                </div>
              ) : (
                <Select 
                  value={formData.user_id} 
                  onValueChange={(v) => handleChange('user_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select User..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Session Token */}
            <div className="space-y-2">
              <Label className={!isEdit ? "required" : ""}>Session Token</Label>
              <Input 
                value={formData.session_token || ''}
                onChange={e => handleChange('session_token', e.target.value)}
                placeholder="Unique Session Token"
                disabled={isEdit} // Token usually immutable after creation
                className={isEdit ? "bg-muted" : ""}
              />
            </div>
          </div>

          {/* Device Info */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500">Device Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Device Type</Label>
                    <Select 
                        value={formData.device_type || 'desktop'} 
                        onValueChange={(v) => handleChange('device_type', v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DEVICE_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                        {getDeviceIcon(type)}
                                        <span className="capitalize">{type.replace('_', ' ')}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Device Name</Label>
                    <Input 
                        value={formData.device_name || ''}
                        onChange={e => handleChange('device_name', e.target.value)}
                        placeholder="e.g. Chrome on macOS"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Browser</Label>
                    <Input 
                        value={formData.browser || ''}
                        onChange={e => handleChange('browser', e.target.value)}
                        placeholder="e.g. Chrome 120.0"
                    />
                </div>
                <div className="space-y-2">
                    <Label>OS</Label>
                    <Input 
                        value={formData.os || ''}
                        onChange={e => handleChange('os', e.target.value)}
                        placeholder="e.g. macOS Sonoma"
                    />
                </div>
            </div>
          </div>

          {/* Location & Network */}
          <div className="space-y-4 pt-4 border-t">
             <h3 className="text-sm font-medium text-gray-500">Network & Location</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>IP Address</Label>
                    <Input 
                        value={formData.ip_address || ''}
                        onChange={e => handleChange('ip_address', e.target.value)}
                        placeholder="192.168.1.1"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Location</Label>
                    <Input 
                        value={formData.location || ''}
                        onChange={e => handleChange('location', e.target.value)}
                        placeholder="e.g. Ho Chi Minh City, VN"
                    />
                </div>
             </div>
          </div>

          {/* Status & Timestamps */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500">Status & Expiration</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="space-y-0.5">
                    <Label className="text-base">Active Session</Label>
                    <p className="text-sm text-muted-foreground">
                        Is this session currently valid and active?
                    </p>
                </div>
                <Switch 
                    checked={formData.is_active}
                    onCheckedChange={c => handleChange('is_active', c)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2 flex flex-col">
                     <Label>Expires At</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.expires_at && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expires_at ? format(new Date(formData.expires_at), "PPP HH:mm") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={formData.expires_at ? new Date(formData.expires_at) : undefined}
                            onSelect={(d) => d && handleChange('expires_at', d.toISOString())}
                            initialFocus
                        />
                        <div className="p-3 border-t">
                             <Label className="text-xs mb-2 block">Time</Label>
                             <Input 
                                type="time"
                                value={formData.expires_at ? format(new Date(formData.expires_at), "HH:mm") : "00:00"}
                                onChange={(e) => {
                                    const date = formData.expires_at ? new Date(formData.expires_at) : new Date();
                                    const [hours, minutes] = e.target.value.split(':');
                                    date.setHours(parseInt(hours));
                                    date.setMinutes(parseInt(minutes));
                                    handleChange('expires_at', date.toISOString());
                                }}
                             />
                        </div>
                        </PopoverContent>
                    </Popover>
                 </div>
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save Session</>}
        </Button>
      </div>
    </form>
  );
}