/**
 * Service Package Form Component
 * Reusable form for create/edit service packages
 * 
 * Compliant with service_packages schema:
 * - features_config: JSONB (Entitlements)
 * - limits_config: JSONB (Numeric Limits)
 */

import React, { useState, useEffect } from 'react';
import { ServicePackage, CreateServicePackageRequest, UpdateServicePackageRequest } from '../../api/servicePackagesApi';
import { saasProductsApi, SaasProduct } from '../../api/saasProductsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface ServicePackageFormProps {
  package?: ServicePackage | null;
  tenantId?: string;
  onSubmit: (data: CreateServicePackageRequest | UpdateServicePackageRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const BILLING_CYCLES = [
  { value: 'DAILY', label: 'Hàng ngày' },
  { value: 'WEEKLY', label: 'Hàng tuần' },
  { value: 'MONTHLY', label: 'Hàng tháng' },
  { value: 'QUARTERLY', label: 'Hàng quý' },
  { value: 'YEARLY', label: 'Hàng năm' },
  { value: 'LIFETIME', label: 'Trọn đời' },
];

const CURRENCIES = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export function ServicePackageForm({ package: pkg, tenantId: propTenantId, onSubmit, onCancel, loading }: ServicePackageFormProps) {
  const [products, setProducts] = useState<SaasProduct[]>([]);
  
  // Basic Fields
  // Use prop or default. In real app, this should come from context.
  const [tenantId] = useState(propTenantId || '00000000-0000-0000-0000-000000000001'); 
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [billingCycle, setBillingCycle] = useState<any>('MONTHLY');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // JSONB Fields: Entitlements (features_config) & Limits (limits_config)
  const [entitlements, setEntitlements] = useState<Array<{ key: string; value: string }>>([]);
  const [limits, setLimits] = useState<Array<{ key: string; value: string }>>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await saasProductsApi.getAll({ status: 'active' });
        setProducts(data);
        if (data.length > 0 && !pkg) {
            setProductId(data[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, [pkg]);

  useEffect(() => {
    if (pkg) {
      setCode(pkg.package_code);
      setName(pkg.package_name);
      setDescription(pkg.description || '');
      setProductId(pkg.product_id);
      setPrice(pkg.price);
      setCurrency(pkg.currency);
      setBillingCycle(pkg.billing_cycle);
      setDisplayOrder(pkg.display_order);
      setIsPublic(pkg.is_public);
      setIsActive(pkg.is_active);

      // Parse features_config -> Entitlements
      if (pkg.features_config && typeof pkg.features_config === 'object') {
        setEntitlements(
          Object.entries(pkg.features_config).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        );
      }

      // Parse limits_config -> Limits
      if (pkg.limits_config && typeof pkg.limits_config === 'object') {
        setLimits(
          Object.entries(pkg.limits_config).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        );
      }
    }
  }, [pkg]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'Mã gói dịch vụ là bắt buộc';
    if (!name.trim()) newErrors.name = 'Tên gói dịch vụ là bắt buộc';
    if (!productId) newErrors.productId = 'Sản phẩm liên kết là bắt buộc';
    if (price < 0) newErrors.price = 'Giá phải lớn hơn hoặc bằng 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Helper to convert array to object
      const arrayToObject = (arr: typeof entitlements) => {
        const obj: Record<string, any> = {};
        arr.forEach(({ key, value }) => {
          if (key.trim()) {
            try {
              obj[key] = JSON.parse(value);
            } catch {
              obj[key] = value;
            }
          }
        });
        return obj;
      };

      const featuresConfig = arrayToObject(entitlements);
      const limitsConfig = arrayToObject(limits);

      const commonData = {
        package_name: name,
        description,
        price,
        currency,
        billing_cycle: billingCycle,
        features_config: featuresConfig,
        limits_config: limitsConfig,
        display_order: displayOrder,
        is_public: isPublic,
        is_active: isActive,
      };

      if (pkg) {
        // Update
        const updateData: UpdateServicePackageRequest = {
          ...commonData,
          version: pkg.version
        };
        await onSubmit(updateData);
      } else {
        // Create
        const createData: CreateServicePackageRequest = {
          tenant_id: tenantId,
          product_id: productId,
          package_code: code,
          ...commonData,
        };
        await onSubmit(createData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEntitlementChange = (index: number, field: 'key' | 'value', val: string) => {
    const newItems = [...entitlements];
    newItems[index][field] = val;
    setEntitlements(newItems);
  };

  const handleLimitChange = (index: number, field: 'key' | 'value', val: string) => {
    const newItems = [...limits];
    newItems[index][field] = val;
    setLimits(newItems);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
          Thông tin cơ bản
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Mã gói dịch vụ <span className="text-red-500">*</span></Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                 setCode(e.target.value);
                 if (errors.code) setErrors({...errors, code: ''});
              }}
              placeholder="VD: PKG-BASIC"
              className={errors.code ? 'border-red-500' : ''}
              disabled={!!pkg}
            />
            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
          </div>

          <div>
            <Label htmlFor="name">Tên gói dịch vụ <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({...errors, name: ''});
              }}
              placeholder="VD: Gói cơ bản"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="product">Sản phẩm <span className="text-red-500">*</span></Label>
            <Select value={productId} onValueChange={setProductId} disabled={!!pkg}>
              <SelectTrigger id="product" className={errors.productId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p._id} value={p._id}>{p.name} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-sm text-red-500 mt-1">{errors.productId}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
          Thông tin giá
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Giá <span className="text-red-500">*</span></Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(parseFloat(e.target.value) || 0);
                if (errors.price) setErrors({...errors, price: ''});
              }}
              min="0"
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <Label htmlFor="currency">Đơn vị tiền tệ</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="billing">Chu kỳ thanh toán</Label>
            <Select value={billingCycle} onValueChange={setBillingCycle}>
              <SelectTrigger id="billing"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Features & Limits Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entitlements */}
        <div className="space-y-4">
           <div className="flex items-center justify-between border-b pb-2">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Features Config</h3>
             <Button type="button" variant="outline" size="sm" onClick={() => setEntitlements([...entitlements, { key: '', value: 'true' }])}>
               <Plus className="w-4 h-4 mr-1" /> Add
             </Button>
           </div>
           <p className="text-sm text-muted-foreground">Entitlements / Boolean Features</p>
           
           <div className="space-y-3">
             {entitlements.map((item, idx) => (
               <div key={idx} className="flex gap-2 items-start">
                 <Input 
                   placeholder="Key (e.g. has_api)" 
                   value={item.key} 
                   onChange={(e) => handleEntitlementChange(idx, 'key', e.target.value)}
                   className="flex-1"
                 />
                 <Input 
                   placeholder="Value (e.g. true)" 
                   value={item.value} 
                   onChange={(e) => handleEntitlementChange(idx, 'value', e.target.value)}
                   className="flex-1"
                 />
                 <Button type="button" variant="ghost" size="icon" onClick={() => setEntitlements(entitlements.filter((_, i) => i !== idx))}>
                   <Trash2 className="w-4 h-4 text-red-500" />
                 </Button>
               </div>
             ))}
             {entitlements.length === 0 && <div className="text-sm text-gray-400 italic">No features configured</div>}
           </div>
        </div>

        {/* Limits */}
        <div className="space-y-4">
           <div className="flex items-center justify-between border-b pb-2">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Limits Config</h3>
             <Button type="button" variant="outline" size="sm" onClick={() => setLimits([...limits, { key: '', value: '10' }])}>
               <Plus className="w-4 h-4 mr-1" /> Add
             </Button>
           </div>
           <p className="text-sm text-muted-foreground">Numeric Limits / Quotas</p>

           <div className="space-y-3">
             {limits.map((item, idx) => (
               <div key={idx} className="flex gap-2 items-start">
                 <Input 
                   placeholder="Key (e.g. max_users)" 
                   value={item.key} 
                   onChange={(e) => handleLimitChange(idx, 'key', e.target.value)}
                   className="flex-1"
                 />
                 <Input 
                   placeholder="Value (e.g. 100)" 
                   value={item.value} 
                   onChange={(e) => handleLimitChange(idx, 'value', e.target.value)}
                   className="flex-1"
                 />
                 <Button type="button" variant="ghost" size="icon" onClick={() => setLimits(limits.filter((_, i) => i !== idx))}>
                   <Trash2 className="w-4 h-4 text-red-500" />
                 </Button>
               </div>
             ))}
             {limits.length === 0 && <div className="text-sm text-gray-400 italic">No limits configured</div>}
           </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
          Cài đặt hiển thị
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="active">Đang hoạt động (Active)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public">Hiển thị công khai (Public)</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="order">Thứ tự hiển thị</Label>
          <Input 
            id="order" 
            type="number" 
            value={displayOrder} 
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)} 
            className="w-32 mt-1"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting || loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          disabled={submitting || loading}
          className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
        >
          {submitting || loading ? 'Đang lưu...' : pkg ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>

      {/* Audit Info (Read Only) */}
      {pkg && (
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(pkg.created_at).toLocaleString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {new Date(pkg.updated_at).toLocaleString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Version:</span> {pkg.version}
          </div>
        </div>
      )}
    </form>
  );
}
