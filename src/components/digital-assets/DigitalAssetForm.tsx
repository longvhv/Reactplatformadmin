/**
 * Digital Asset Form Component
 * Form for creating/editing digital assets
 * ✅ Compliance with tenant_digital_assets schema
 */

import React, { useState, useEffect } from 'react';
import { 
  TenantDigitalAsset, 
  CreateAssetRequest, 
  UpdateAssetRequest, 
  AssetType, 
  AssetStatus 
} from '../../api/digitalAssetsApi';
import { ordersApi, Order } from '../../api/ordersApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Globe, Save, X, ShoppingCart, Code } from 'lucide-react';
import { useTranslation } from '../../providers/LanguageProvider';

interface DigitalAssetFormProps {
  tenantId: string;
  initialData?: TenantDigitalAsset;
  onSubmit: (data: CreateAssetRequest | UpdateAssetRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DigitalAssetForm({ tenantId, initialData, onSubmit, onCancel, loading }: DigitalAssetFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  
  // Form State
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('DOMAIN');
  const [status, setStatus] = useState<AssetStatus>('PENDING');
  const [autoRenew, setAutoRenew] = useState(true);
  const [activatedAt, setActivatedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [orderId, setOrderId] = useState<string>('');
  const [metadataJson, setMetadataJson] = useState('{}');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOrders();
    if (initialData) {
      setName(initialData.name);
      setAssetType(initialData.asset_type);
      setStatus(initialData.status);
      setAutoRenew(initialData.auto_renew);
      setOrderId(initialData.order_id || '');
      
      if (initialData.activated_at) {
        setActivatedAt(new Date(initialData.activated_at).toISOString().split('T')[0]);
      }
      if (initialData.expires_at) {
        setExpiresAt(new Date(initialData.expires_at).toISOString().split('T')[0]);
      }
      
      if (initialData.asset_metadata) {
        try {
          setMetadataJson(JSON.stringify(initialData.asset_metadata, null, 2));
        } catch (e) {
          setMetadataJson('{}');
        }
      }
    }
  }, [initialData, tenantId]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await ordersApi.getAll({ tenant_id: tenantId });
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t('common.required') || 'Required';
    }

    try {
      JSON.parse(metadataJson);
    } catch (e) {
      newErrors.metadata = 'Invalid JSON format';
    }

    if (activatedAt && expiresAt) {
      if (new Date(expiresAt) <= new Date(activatedAt)) {
        newErrors.expiresAt = 'Expiry date must be after activation date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const metadata = JSON.parse(metadataJson);
      
      // Parse dates to ISO string or null
      const activatedAtISO = activatedAt ? new Date(activatedAt).toISOString() : null;
      const expiresAtISO = expiresAt ? new Date(expiresAt).toISOString() : null;

      if (isEdit) {
        const updateData: UpdateAssetRequest = {
          name: name.trim(),
          asset_type: assetType,
          status: status,
          auto_renew: autoRenew,
          order_id: orderId || null,
          asset_metadata: metadata,
          activated_at: activatedAtISO,
          expires_at: expiresAtISO,
        };
        onSubmit(updateData);
      } else {
        const createData: CreateAssetRequest = {
          tenant_id: tenantId,
          name: name.trim(),
          asset_type: assetType,
          status: status,
          auto_renew: autoRenew,
          order_id: orderId || null,
          asset_metadata: metadata,
          activated_at: activatedAtISO,
          expires_at: expiresAtISO,
        };
        onSubmit(createData);
      }
    } catch (error) {
      console.error('Form submission error', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Globe className="w-5 h-5 text-indigo-600" />
            {isEdit ? 'Edit Digital Asset' : 'Add Digital Asset'}
          </CardTitle>
          <CardDescription>
            Manage domain, SSL, or license details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NAME */}
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. example.com"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* ORDER */}
            <div className="space-y-2">
              <Label htmlFor="orderId">Linked Order <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Select 
                value={orderId} 
                onValueChange={setOrderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingOrders ? "Loading orders..." : "Select an order"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlinked">-- No Order --</SelectItem>
                  {orders.map(order => (
                    <SelectItem key={order._id} value={order._id}>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        <span>{order.order_number}</span>
                        <span className="text-xs text-muted-foreground">
                          ({new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency_code }).format(order.total_amount)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TYPE */}
            <div className="space-y-2">
              <Label htmlFor="assetType">Type</Label>
              <Select 
                value={assetType} 
                onValueChange={(val) => setAssetType(val as AssetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOMAIN">Domain</SelectItem>
                  <SelectItem value="SSL">SSL Certificate</SelectItem>
                  <SelectItem value="LICENSE_KEY">License Key</SelectItem>
                  <SelectItem value="SOFTWARE">Software</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(val) => setStatus(val as AssetStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROVISIONING">Provisioning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="TRANSFERRING">Transferring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ACTIVATED AT */}
            <div className="space-y-2">
              <Label htmlFor="activatedAt">Activated Date</Label>
              <Input
                id="activatedAt"
                type="date"
                value={activatedAt}
                onChange={e => setActivatedAt(e.target.value)}
              />
            </div>

            {/* EXPIRES AT */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={e => {
                  setExpiresAt(e.target.value);
                  if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));
                }}
                className={errors.expiresAt ? 'border-destructive' : ''}
              />
              {errors.expiresAt && <p className="text-sm text-destructive">{errors.expiresAt}</p>}
            </div>
          </div>

          {/* AUTO RENEW */}
          <div className="flex items-center space-x-2 border p-4 rounded-lg bg-gray-50/50">
            <Switch
              id="autoRenew"
              checked={autoRenew}
              onCheckedChange={setAutoRenew}
            />
            <Label htmlFor="autoRenew" className="cursor-pointer">Enable Auto-renewal</Label>
          </div>

          {/* METADATA */}
          <div className="space-y-2">
            <Label htmlFor="metadata" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Metadata (JSON)
            </Label>
            <Textarea
              id="metadata"
              value={metadataJson}
              onChange={e => {
                setMetadataJson(e.target.value);
                if (errors.metadata) setErrors(prev => ({ ...prev, metadata: '' }));
              }}
              className={`font-mono text-xs h-32 ${errors.metadata ? 'border-destructive' : ''}`}
              placeholder="{}"
            />
            {errors.metadata && <p className="text-sm text-destructive">{errors.metadata}</p>}
            <p className="text-xs text-muted-foreground">
              Additional configuration or provider details in JSON format.
            </p>
          </div>

        </CardContent>
        
        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? (t('common.saving') || 'Saving...') : (isEdit ? (t('common.save') || 'Update Asset') : (t('common.create') || 'Create Asset'))}
          </Button>
        </div>
      </Card>
    </form>
  );
}
