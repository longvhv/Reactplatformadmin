'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserDevice, 
  CreateDeviceRequest, 
  UpdateDeviceRequest, 
  DeviceType,
  DEVICE_TYPES,
  DeviceTypeHelper,
  DeviceOS,
  OS_TYPES,
  DeviceOSHelper,
  DeviceBrowser,
  BROWSERS,
  DeviceBrowserHelper
} from '@/api/userDevicesApi';
import { usersApi, User } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Laptop, Smartphone, Tablet, Watch, Tv, HelpCircle, Shield, Globe } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { Textarea } from '@/components/ui/textarea';

interface UserDeviceFormProps {
  initialData?: UserDevice;
  isEdit?: boolean;
  onSubmit: (data: CreateDeviceRequest | UpdateDeviceRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserDeviceForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: UserDeviceFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateDeviceRequest & UpdateDeviceRequest>>({
    device_type: 'desktop',
    is_trusted: false,
    location: {},
    ...initialData
  });

  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(initialData?.metadata || {}, null, 2)
  );
  
  const [locationJson, setLocationJson] = useState(
    JSON.stringify(initialData?.location || {}, null, 2)
  );

  // Load users
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

  const handleJsonChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
  };

  const validate = () => {
     if (!isEdit && !formData.user_id) {
         return 'User is required';
     }
     if (!formData.device_type) {
         return 'Device Type is required';
     }

     try {
         JSON.parse(metadataJson);
     } catch(e) {
         return 'Invalid Metadata JSON';
     }
     
     try {
         JSON.parse(locationJson);
     } catch(e) {
         return 'Invalid Location JSON';
     }

     return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validate();
    if (error) {
        showToast.error('Validation Error', error);
        return;
    }

    try {
      const payload = {
          ...formData,
          metadata: JSON.parse(metadataJson),
          location: JSON.parse(locationJson)
      };
      await onSubmit(payload as any);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getDeviceIcon = (type?: string) => {
    const t = type as DeviceType;
    if (DeviceTypeHelper.isDesktop(t)) return <Laptop className="w-4 h-4" />;
    if (DeviceTypeHelper.isMobile(t)) return <Smartphone className="w-4 h-4" />;
    if (DeviceTypeHelper.isTablet(t)) return <Tablet className="w-4 h-4" />;
    if (DeviceTypeHelper.isTV(t)) return <Tv className="w-4 h-4" />;
    if (DeviceTypeHelper.isWatch(t)) return <Watch className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Device Details</CardTitle>
          <CardDescription>
            {isEdit ? 'Update registered device information' : 'Manually register a user device'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* User Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={!isEdit ? "required" : ""}>User</Label>
              {isEdit ? (
                <div className="p-2 bg-muted rounded-md text-sm border flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {users.find(u => u._id === formData.user_id)?.full_name?.substring(0,2) || '??'}
                  </div>
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

             <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <Label className="text-base text-blue-900 dark:text-blue-100">Trusted Device</Label>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        Trusted devices may bypass certain MFA challenges.
                    </p>
                </div>
                <Switch 
                    checked={formData.is_trusted || false}
                    onCheckedChange={c => handleChange('is_trusted', c)}
                />
            </div>
          </div>

          {/* Device Identity */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Laptop className="w-4 h-4"/> Hardware Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="required">Device Type</Label>
                    <Select 
                        value={formData.device_type} 
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
                                        <span className="capitalize">{type}</span>
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
                        placeholder="e.g. John's iPhone"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input 
                        value={formData.manufacturer || ''}
                        onChange={e => handleChange('manufacturer', e.target.value)}
                        placeholder="e.g. Apple, Samsung"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Model</Label>
                    <Input 
                        value={formData.device_model || ''}
                        onChange={e => handleChange('device_model', e.target.value)}
                        placeholder="e.g. iPhone 15 Pro"
                    />
                </div>
                <div className="space-y-2">
                    <Label>OS</Label>
                    <Select 
                        value={formData.os || 'other'} 
                        onValueChange={(v) => handleChange('os', v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {OS_TYPES.map(os => (
                                <SelectItem key={os} value={os}>
                                    <span className="capitalize">{os}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>OS Version</Label>
                    <Input 
                        value={formData.os_version || ''}
                        onChange={e => handleChange('os_version', e.target.value)}
                        placeholder="e.g. 17.0.1"
                    />
                </div>
            </div>
          </div>

          {/* Software & Browser */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Globe className="w-4 h-4"/> Software / Browser
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Browser</Label>
                    <Select 
                        value={formData.browser || 'other'} 
                        onValueChange={(v) => handleChange('browser', v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {BROWSERS.map(b => (
                                <SelectItem key={b} value={b}>
                                    <span className="capitalize">{b}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Browser Version</Label>
                    <Input 
                        value={formData.browser_version || ''}
                        onChange={e => handleChange('browser_version', e.target.value)}
                        placeholder="e.g. 120.0.6099.109"
                    />
                </div>
                <div className="space-y-2">
                    <Label>App Name (if native)</Label>
                    <Input 
                        value={formData.app_name || ''}
                        onChange={e => handleChange('app_name', e.target.value)}
                        placeholder="e.g. Mobile App"
                    />
                </div>
                <div className="space-y-2">
                    <Label>App Version</Label>
                    <Input 
                        value={formData.app_version || ''}
                        onChange={e => handleChange('app_version', e.target.value)}
                        placeholder="e.g. 1.0.5"
                    />
                </div>
            </div>
          </div>

          {/* Network & Security */}
          <div className="space-y-4 pt-4 border-t">
             <h3 className="text-sm font-medium text-gray-500">Network & Security Identifiers</h3>
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
                    <Label>Fingerprint / Token</Label>
                    <Input 
                        value={formData.fingerprint || ''}
                        onChange={e => handleChange('fingerprint', e.target.value)}
                        placeholder="Unique Device Fingerprint"
                    />
                </div>
                 <div className="space-y-2 md:col-span-2">
                    <Label>User Agent</Label>
                    <Input 
                        value={formData.user_agent || ''}
                        onChange={e => handleChange('user_agent', e.target.value)}
                        placeholder="Mozilla/5.0..."
                        className="font-mono text-xs"
                    />
                </div>
             </div>
          </div>

          {/* JSON Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
             <div className="space-y-2">
                <Label>Location Data (JSON)</Label>
                <Textarea 
                    value={locationJson}
                    onChange={e => handleJsonChange(setLocationJson, e.target.value)}
                    className="font-mono text-xs h-[100px]"
                />
             </div>
             <div className="space-y-2">
                <Label>Metadata (JSON)</Label>
                <Textarea 
                    value={metadataJson}
                    onChange={e => handleJsonChange(setMetadataJson, e.target.value)}
                    className="font-mono text-xs h-[100px]"
                />
             </div>
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save Device</>}
        </Button>
      </div>
    </form>
  );
}
