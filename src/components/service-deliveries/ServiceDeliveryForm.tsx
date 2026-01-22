/**
 * Service Delivery Form Component
 * Form for creating/editing service deliveries
 * ✅ Compliance with tenant_service_deliveries schema
 */

import React, { useState, useEffect } from 'react';
import { 
  TenantServiceDelivery, 
  CreateServiceDeliveryRequest, 
  UpdateServiceDeliveryRequest,
  DeliveryStatus,
} from '@/api/tenantServiceDeliveriesApi';
import { saasProductsApi, SaasProduct } from '@/api/saasProductsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Save, X, Box, Code } from 'lucide-react';
import { useTranslation } from '@/providers/LanguageProvider';

interface ServiceDeliveryFormProps {
  tenantId: string;
  initialData?: TenantServiceDelivery;
  onSubmit: (data: CreateServiceDeliveryRequest | UpdateServiceDeliveryRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceDeliveryForm({ tenantId, initialData, onSubmit, onCancel, loading }: ServiceDeliveryFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  
  // Form State
  const [productId, setProductId] = useState('');
  const [unitType, setUnitType] = useState('MONTH');
  const [totalUnits, setTotalUnits] = useState<number>(1);
  const [deliveredUnits, setDeliveredUnits] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [currencyCode, setCurrencyCode] = useState('VND');
  const [status, setStatus] = useState<DeliveryStatus>('PENDING');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [metadataJson, setMetadataJson] = useState('{}');
  
  // Data State
  const [products, setProducts] = useState<SaasProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
    if (initialData) {
      setProductId(initialData.product_id);
      setUnitType(initialData.unit_type);
      setTotalUnits(initialData.total_units);
      setDeliveredUnits(initialData.delivered_units);
      setUnitPrice(initialData.unit_price);
      setCurrencyCode(initialData.currency_code);
      setStatus(initialData.status);
      setSubscriptionId(initialData.subscription_id || '');
      
      if (initialData.service_metadata) {
        try {
          setMetadataJson(JSON.stringify(initialData.service_metadata, null, 2));
        } catch (e) {
          setMetadataJson('{}');
        }
      }
    }
  }, [initialData, tenantId]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      // In a real app we might want to paginate or filter active products
      const data = await saasProductsApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!productId && !isEdit) {
       // Product ID is usually fixed after creation but vital for creation
      newErrors.productId = t('common.required') || 'Required';
    }

    if (!unitType) {
        newErrors.unitType = t('common.required') || 'Required';
    }

    if (totalUnits <= 0) {
        newErrors.totalUnits = 'Total units must be > 0';
    }

    if (deliveredUnits < 0) {
        newErrors.deliveredUnits = 'Delivered units must be >= 0';
    }

    if (deliveredUnits > totalUnits) {
        newErrors.deliveredUnits = 'Delivered units cannot exceed total units';
    }

    try {
      JSON.parse(metadataJson);
    } catch (e) {
      newErrors.metadata = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const metadata = JSON.parse(metadataJson);
      
      if (isEdit) {
        const updateData: UpdateServiceDeliveryRequest = {
          unit_type: unitType,
          total_units: Number(totalUnits),
          delivered_units: Number(deliveredUnits),
          unit_price: Number(unitPrice),
          currency_code: currencyCode,
          status: status,
          subscription_id: subscriptionId || null,
          service_metadata: metadata,
        };
        onSubmit(updateData);
      } else {
        const createData: CreateServiceDeliveryRequest = {
          tenant_id: tenantId,
          product_id: productId,
          unit_type: unitType,
          total_units: Number(totalUnits),
          delivered_units: Number(deliveredUnits),
          unit_price: Number(unitPrice),
          currency_code: currencyCode,
          status: status,
          subscription_id: subscriptionId || null,
          service_metadata: metadata,
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
            <Package className="w-5 h-5 text-indigo-600" />
            {isEdit ? 'Edit Service Delivery' : 'Add Service Delivery'}
          </CardTitle>
          <CardDescription>
            Track delivery progress for SaaS products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          
          {/* PRODUCT (Required for creation) */}
          <div className="space-y-2">
            <Label htmlFor="productId">Product <span className="text-destructive">*</span></Label>
            <Select 
              value={productId} 
              onValueChange={val => {
                setProductId(val);
                if (errors.productId) setErrors(prev => ({ ...prev, productId: '' }));
              }}
              disabled={isEdit || loadingProducts}
            >
              <SelectTrigger className={errors.productId ? 'border-destructive' : ''}>
                <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product"} />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product._id} value={product._id}>
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-muted-foreground" />
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">({product.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-destructive">{errors.productId}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UNIT TYPE */}
            <div className="space-y-2">
              <Label htmlFor="unitType">Unit Type <span className="text-destructive">*</span></Label>
              <Select 
                value={unitType} 
                onValueChange={val => {
                    setUnitType(val);
                    if (errors.unitType) setErrors(prev => ({...prev, unitType: ''}));
                }}
              >
                <SelectTrigger className={errors.unitType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTH">Month</SelectItem>
                  <SelectItem value="YEAR">Year</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="LICENSE">License</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="SESSION">Session</SelectItem>
                  <SelectItem value="HOUR">Hour</SelectItem>
                  <SelectItem value="ITEM">Item</SelectItem>
                </SelectContent>
              </Select>
              {errors.unitType && <p className="text-sm text-destructive">{errors.unitType}</p>}
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
              <Select 
                value={status} 
                onValueChange={(val) => setStatus(val as DeliveryStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TOTAL UNITS */}
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units <span className="text-destructive">*</span></Label>
              <Input
                id="totalUnits"
                type="number"
                min="0.01"
                step="0.01"
                value={totalUnits}
                onChange={e => {
                    setTotalUnits(Number(e.target.value));
                    if (errors.totalUnits) setErrors(prev => ({...prev, totalUnits: ''}));
                }}
                className={errors.totalUnits ? 'border-destructive' : ''}
              />
              {errors.totalUnits && <p className="text-sm text-destructive">{errors.totalUnits}</p>}
            </div>

            {/* DELIVERED UNITS */}
            <div className="space-y-2">
              <Label htmlFor="deliveredUnits">Delivered Units</Label>
              <Input
                id="deliveredUnits"
                type="number"
                min="0"
                step="0.01"
                value={deliveredUnits}
                onChange={e => {
                    setDeliveredUnits(Number(e.target.value));
                    if (errors.deliveredUnits) setErrors(prev => ({...prev, deliveredUnits: ''}));
                }}
                className={errors.deliveredUnits ? 'border-destructive' : ''}
              />
              {errors.deliveredUnits && <p className="text-sm text-destructive">{errors.deliveredUnits}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UNIT PRICE */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                value={unitPrice}
                onChange={e => setUnitPrice(Number(e.target.value))}
              />
            </div>

            {/* CURRENCY */}
            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <Input
                id="currencyCode"
                value={currencyCode}
                maxLength={3}
                onChange={e => setCurrencyCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* SUBSCRIPTION ID */}
          <div className="space-y-2">
            <Label htmlFor="subscriptionId">Subscription ID <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="subscriptionId"
              value={subscriptionId}
              onChange={e => setSubscriptionId(e.target.value)}
              placeholder="UUID"
              className="font-mono text-sm"
            />
          </div>

          {/* METADATA */}
          <div className="space-y-2">
            <Label htmlFor="metadata" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Service Metadata (JSON)
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
            {loading ? (t('common.saving') || 'Saving...') : (isEdit ? (t('common.save') || 'Update Delivery') : (t('common.create') || 'Create Delivery'))}
          </Button>
        </div>
      </Card>
    </form>
  );
}
