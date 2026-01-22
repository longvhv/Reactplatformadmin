/**
 * Enhanced Product Form Component
 * Standardized form for create/edit product with full schema validation
 * 
 * Compliant with saas_products schema:
 * - code: varchar(50), UNIQUE, regex ^[a-z0-9-]+$
 * - name: varchar(255), NOT NULL
 * - base_price: numeric >= 0
 * - trial_days: int >= 0
 * - features/limits: jsonb
 */

import { useState, useEffect } from 'react';
import { SaasProduct, CreateSaasProductRequest, UpdateSaasProductRequest } from '../../api/saasProductsApi';
import { saasProductTypesApi } from '../../api/saasProductTypesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertCircle, Plus, Trash2, Package, Save } from 'lucide-react';
import { showToast } from '../../lib/toast';

type BillingCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
type ProductStatus = 'active' | 'inactive' | 'archived';

interface EnhancedProductFormProps {
  product?: SaasProduct | null;
  tenantId: string;
  onSubmit: (data: CreateSaasProductRequest | UpdateSaasProductRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'DAILY', label: 'Hàng ngày' },
  { value: 'WEEKLY', label: 'Hàng tuần' },
  { value: 'MONTHLY', label: 'Hàng tháng' },
  { value: 'QUARTERLY', label: 'Hàng quý' },
  { value: 'YEARLY', label: 'Hàng năm' },
  { value: 'LIFETIME', label: 'Trọn đời' },
];

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
  { value: 'archived', label: 'Lưu trữ' },
];

const CURRENCIES = [
  { value: 'VND', label: 'VND - Vietnam Dong' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export function EnhancedProductForm({ product, tenantId, onSubmit, onCancel, loading }: EnhancedProductFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productTypes, setProductTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    product_type_code: '',
    base_price: 0,
    currency: 'VND',
    billing_cycle: 'MONTHLY' as BillingCycle,
    trial_days: 0,
    status: 'active' as ProductStatus,
    is_featured: false,
    display_order: 0,
  });

  const [features, setFeatures] = useState<Array<{ key: string; value: string }>>([]);
  const [limits, setLimits] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    // Fetch product types
    const fetchProductTypes = async () => {
      try {
        const types = await saasProductTypesApi.getAll({ is_active: true });
        setProductTypes(types);
      } catch (error) {
        console.error('Failed to fetch product types:', error);
      }
    };
    fetchProductTypes();

    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        product_type_code: product.product_type_code || '',
        base_price: product.base_price,
        currency: product.currency,
        billing_cycle: product.billing_cycle,
        trial_days: product.trial_days,
        status: product.status,
        is_featured: product.is_featured,
        display_order: product.display_order,
      });

      // Parse features
      if (product.features && typeof product.features === 'object') {
        setFeatures(
          Object.entries(product.features).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          }))
        );
      }

      // Parse limits
      if (product.limits && typeof product.limits === 'object') {
        setLimits(
          Object.entries(product.limits).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          }))
        );
      }
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Code
    if (!formData.code.trim()) {
      newErrors.code = 'Mã sản phẩm là bắt buộc';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Mã sản phẩm tối đa 50 ký tự';
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Mã chỉ được chứa chữ thường, số và dấu gạch ngang (ví dụ: pro-plan-2024)';
    }

    // Validate Name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm là bắt buộc';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Tên sản phẩm tối đa 255 ký tự';
    }

    // Validate Numbers
    if (formData.base_price < 0) {
      newErrors.base_price = 'Giá không được nhỏ hơn 0';
    }
    if (formData.trial_days < 0) {
      newErrors.trial_days = 'Ngày dùng thử không được nhỏ hơn 0';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      if (['code', 'name', 'description'].includes(firstErrorField)) {
        setActiveTab('general');
      } else if (['base_price', 'trial_days'].includes(firstErrorField)) {
        setActiveTab('pricing');
      }
      showToast.error('Lỗi xác thực', 'Vui lòng kiểm tra lại các trường thông tin');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Helper to convert array to object with type safety
      const arrayToObject = (arr: typeof features) => {
        const obj: Record<string, any> = {};
        arr.forEach(({ key, value }) => {
          if (key.trim()) {
            try {
              // Try to parse as JSON first (for booleans, numbers, objects)
              obj[key] = JSON.parse(value);
            } catch {
              // Fallback to string
              obj[key] = value;
            }
          }
        });
        return obj;
      };

      const featuresObj = arrayToObject(features);
      const limitsObj = arrayToObject(limits);

      const commonData = {
        ...formData,
        features: featuresObj,
        limits: limitsObj,
        metadata: {},
      };

      if (product) {
        // Update
        const updateData: UpdateSaasProductRequest = {
          ...commonData,
          version: product.version,
        };
        await onSubmit(updateData);
      } else {
        // Create
        const createData: CreateSaasProductRequest = {
          tenant_id: tenantId,
          ...commonData,
        };
        await onSubmit(createData);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      // Toast is handled by parent or onSubmit
    }
  };

  const handleFeatureChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const handleLimitChange = (index: number, field: 'key' | 'value', value: string) => {
    const newLimits = [...limits];
    newLimits[index][field] = value;
    setLimits(newLimits);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="pricing">Giá & Chu kỳ</TabsTrigger>
          <TabsTrigger value="features">Tính năng</TabsTrigger>
          <TabsTrigger value="settings">Cấu hình</TabsTrigger>
        </TabsList>

        {/* Tab: General Info */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Các thông tin định danh của sản phẩm trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Mã sản phẩm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => {
                      // Auto-format: lowercase, replace spaces with dashes
                      const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
                      setFormData({ ...formData, code: val });
                      if (errors.code) setErrors({ ...errors, code: '' });
                    }}
                    placeholder="vd: enterprise-plan"
                    disabled={!!product} // Cannot change code after creation
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.code}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Mã duy nhất, chữ thường, không dấu (a-z, 0-9, -). Không thể thay đổi sau khi tạo.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tên hiển thị <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="vd: Gói Doanh Nghiệp"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về sản phẩm này..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_type_code">Loại sản phẩm (Mã)</Label>
                <select
                  id="product_type_code"
                  value={formData.product_type_code}
                  onChange={(e) => setFormData({ ...formData, product_type_code: e.target.value })}
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Chọn loại sản phẩm --</option>
                  {productTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Chọn loại sản phẩm từ danh sách đã cấu hình.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pricing */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Chính sách giá</CardTitle>
              <CardDescription>
                Thiết lập giá bán và chu kỳ thanh toán cho sản phẩm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="base_price">
                    Giá cơ bản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                    className={errors.base_price ? 'border-red-500' : ''}
                  />
                  {errors.base_price && (
                    <p className="text-sm text-red-500">{errors.base_price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Chu kỳ thanh toán</Label>
                  <select
                    id="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as BillingCycle })}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {BILLING_CYCLES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="trial_days">Thời gian dùng thử (ngày)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="trial_days"
                    type="number"
                    min="0"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: Number(e.target.value) })}
                    className={`w-32 ${errors.trial_days ? 'border-red-500' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    Nhập 0 nếu không có chế độ dùng thử
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Features & Limits */}
        <TabsContent value="features" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Features */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Các tính năng (Features)</CardTitle>
                    <CardDescription>Định nghĩa các module được bật</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFeatures([...features, { key: '', value: 'true' }])}>
                    <Plus className="w-4 h-4" /> Thêm
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {features.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                    Chưa có tính năng nào được cấu hình
                  </div>
                )}
                {features.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      placeholder="Key (vd: hrm_module)"
                      value={item.key}
                      onChange={(e) => handleFeatureChange(idx, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (vd: true)"
                      value={item.value}
                      onChange={(e) => handleFeatureChange(idx, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Limits */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Các giới hạn (Limits)</CardTitle>
                    <CardDescription>Định nghĩa hạn mức sử dụng</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLimits([...limits, { key: '', value: '10' }])}>
                    <Plus className="w-4 h-4" /> Thêm
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {limits.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                    Chưa có giới hạn nào được cấu hình
                  </div>
                )}
                {limits.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      placeholder="Key (vd: max_users)"
                      value={item.key}
                      onChange={(e) => handleLimitChange(idx, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (vd: 50)"
                      value={item.value}
                      onChange={(e) => handleLimitChange(idx, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setLimits(limits.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Settings */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình trạng thái</CardTitle>
              <CardDescription>Quản lý trạng thái hiển thị của sản phẩm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label htmlFor="status">Trạng thái hoạt động</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Sản phẩm "Lưu trữ" sẽ không hiển thị trên danh sách bán hàng nhưng vẫn tồn tại trong hệ thống.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="display_order">Thứ tự hiển thị</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Số càng nhỏ càng hiển thị lên đầu danh sách (ưu tiên).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="is_featured" className="text-base font-medium">Sản phẩm nổi bật</Label>
                  <p className="text-sm text-muted-foreground">
                    Đánh dấu sản phẩm này là nổi bật để hiển thị ở vị trí đặc biệt (Hot/Featured)
                  </p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit Info (Read Only) */}
      {product && (
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t">
          <div>
            <span className="font-medium">Tạo lúc:</span>{' '}
            {product.created_at ? new Date(product.created_at).toLocaleString('vi-VN') : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Cập nhật:</span>{' '}
            {product.updated_at ? new Date(product.updated_at).toLocaleString('vi-VN') : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Version:</span> {product.version}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {product ? 'Cập nhật' : 'Tạo sản phẩm'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
