/**
 * Enhanced Order Form Component
 * Standardized form for creating/editing subscription orders
 * 
 * Compliant with subscription_orders schema:
 * - order_number: varchar(50) NOT NULL UNIQUE
 * - type: ENUM ('NEW', 'RENEWAL', 'UPGRADE', 'DOWNGRADE', 'ADD_ON')
 * - status: ENUM ('DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'FAILED', 'REFUNDED')
 * - currency_code: varchar(3) NOT NULL
 * - items_snapshot: jsonb NOT NULL
 * - billing_info: jsonb NOT NULL
 * - amounts: numeric(19,4) >= 0
 * 
 * ✅ Features:
 * - Tenant selection (from API)
 * - Line Items Editor with dynamic metadata
 * - Auto-calculation of totals
 * - JSON Editor for Billing Info (with form fields helper)
 */

import React, { useState, useEffect } from 'react';
import { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  LineItem, 
  BillingInfo, 
  OrderType 
} from '@/api/ordersApi';
import { tenantsApi, Tenant } from '@/api/tenantsApi';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, ShoppingCart, CreditCard, User } from 'lucide-react';
import { LineItemsEditor } from './LineItemsEditor';
import { showToast } from '@/lib/toast';

interface EnhancedOrderFormProps {
  initialData?: Partial<Order>;
  isEdit?: boolean;
  onSubmit: (data: CreateOrderRequest | UpdateOrderRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: 'NEW', label: 'Mới (New)' },
  { value: 'RENEWAL', label: 'Gia hạn (Renewal)' },
  { value: 'UPGRADE', label: 'Nâng cấp (Upgrade)' },
  { value: 'DOWNGRADE', label: 'Hạ cấp (Downgrade)' },
  { value: 'ADD_ON', label: 'Thêm tính năng (Add-on)' },
];

const ORDER_STATUSES = [
  { value: 'DRAFT', label: 'Nháp (Draft)' },
  { value: 'PENDING', label: 'Chờ thanh toán (Pending)' },
  { value: 'PAID', label: 'Đã thanh toán (Paid)' },
  { value: 'CANCELLED', label: 'Đã hủy (Cancelled)' },
  { value: 'FAILED', label: 'Thất bại (Failed)' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền (Refunded)' },
];

const CURRENCIES = ['VND', 'USD', 'EUR'];

export function EnhancedOrderForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedOrderFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateOrderRequest>>({
    tenant_id: '',
    order_number: '',
    po_number: '',
    type: 'NEW',
    status: 'DRAFT',
    currency_code: 'VND',
    tax_amount: 0,
    discount_amount: 0,
    credit_applied: 0,
    payment_method: '',
    payment_ref_id: '',
  });

  const [items, setItems] = useState<LineItem[]>([]);
  const [itemsValid, setItemsValid] = useState(true);
  const [itemsErrors, setItemsErrors] = useState<string[]>([]);
  
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({});

  // Calculated State
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    subtotal: 0,
    total: 0,
  });

  // Load Tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await tenantsApi.getAll();
        setTenants(data);
      } catch (err) {
        console.error("Failed to load tenants", err);
      }
    };
    fetchTenants();
  }, []);

  // Load Initial Data
  useEffect(() => {
    if (initialData) {
      setFormData({
        tenant_id: initialData.tenant_id,
        order_number: initialData.order_number,
        po_number: initialData.po_number || '',
        type: initialData.type,
        status: initialData.status,
        currency_code: initialData.currency_code,
        tax_amount: initialData.tax_amount || 0,
        discount_amount: initialData.discount_amount || 0,
        credit_applied: initialData.credit_applied || 0,
        payment_method: initialData.payment_method || '',
        payment_ref_id: initialData.payment_ref_id || '',
      });
      setItems(initialData.items_snapshot || []);
      setBillingInfo(initialData.billing_info || {});
    } else {
      // Default items for new order
      setItems([{
        item_type: 'PLAN',
        id: '',
        name: '',
        price: 0,
        quantity: 1,
        metadata: {},
      }]);
    }
  }, [initialData]);

  // Auto-calculate amounts
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Number(formData.tax_amount) || 0;
    const discount = Number(formData.discount_amount) || 0;
    const credit = Number(formData.credit_applied) || 0;
    
    // Ensure total is not negative
    const total = Math.max(0, subtotal + tax - discount - credit);

    setCalculatedAmounts({
      subtotal,
      total,
    });
  }, [items, formData.tax_amount, formData.discount_amount, formData.credit_applied]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingChange = (field: string, value: any) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: formData.currency_code || 'VND',
    }).format(price);
  };

  const validateForm = (): boolean => {
    if (!formData.order_number?.trim()) {
      showToast.error("Lỗi", "Mã đơn hàng là bắt buộc");
      return false;
    }
    if (!formData.tenant_id) {
      showToast.error("Lỗi", "Khách hàng (Tenant) là bắt buộc");
      return false;
    }
    if (items.length === 0) {
      showToast.error("Lỗi", "Đơn hàng phải có ít nhất 1 sản phẩm/dịch vụ");
      return false;
    }
    if (!itemsValid) {
      showToast.error("Lỗi sản phẩm", itemsErrors[0] || "Vui lòng kiểm tra lại danh sách sản phẩm");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData: any = {
        ...formData,
        subtotal_amount: calculatedAmounts.subtotal,
        total_amount: calculatedAmounts.total,
        items_snapshot: items,
        billing_info: billingInfo,
        version: initialData?.version || 1
      };

      await onSubmit(submitData);
    } catch (error: any) {
      console.error("Submit error:", error);
      showToast.error("Lỗi", error.message || "Có lỗi xảy ra");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="items">Sản phẩm & Tài chính</TabsTrigger>
          <TabsTrigger value="billing">Thanh toán & Billing</TabsTrigger>
        </TabsList>

        {/* --- GENERAL TAB --- */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Thông tin đơn hàng
              </CardTitle>
              <CardDescription>Thông tin định danh và phân loại đơn hàng</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="order_number">Mã đơn hàng <span className="text-destructive">*</span></Label>
                <Input
                  id="order_number"
                  value={formData.order_number}
                  onChange={e => handleChange("order_number", e.target.value)}
                  placeholder="ORD-2026-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="po_number">Số PO (Purchase Order)</Label>
                <Input
                  id="po_number"
                  value={formData.po_number}
                  onChange={e => handleChange("po_number", e.target.value)}
                  placeholder="PO-2026-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_id">Khách hàng (Tenant) <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={val => handleChange("tenant_id", val)}
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Loại đơn hàng</Label>
                <Select
                  value={formData.type}
                  onValueChange={val => handleChange("type", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => handleChange("status", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tiền tệ</Label>
                <Select
                  value={formData.currency_code}
                  onValueChange={val => handleChange("currency_code", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ITEMS & FINANCIAL TAB --- */}
        <TabsContent value="items" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sản phẩm/dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsEditor
                items={items}
                onChange={setItems}
                disabled={loading}
                onValidationChange={(isValid, errors) => {
                  setItemsValid(isValid);
                  setItemsErrors(errors);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng kết tài chính</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Thuế (Tax)</Label>
                  <Input
                    type="number"
                    value={formData.tax_amount}
                    onChange={e => handleChange("tax_amount", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giảm giá (Discount)</Label>
                  <Input
                    type="number"
                    value={formData.discount_amount}
                    onChange={e => handleChange("discount_amount", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credit áp dụng</Label>
                  <Input
                    type="number"
                    value={formData.credit_applied}
                    onChange={e => handleChange("credit_applied", parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính (Subtotal):</span>
                  <span className="font-semibold">{formatPrice(calculatedAmounts.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Thuế:</span>
                  <span className="font-semibold">{formatPrice(formData.tax_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Giảm giá:</span>
                  <span className="font-semibold text-red-600">-{formatPrice(formData.discount_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Credit:</span>
                  <span className="font-semibold text-red-600">-{formatPrice(formData.credit_applied || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-primary text-xl">{formatPrice(calculatedAmounts.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- BILLING TAB --- */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Thông tin Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tên khách hàng</Label>
                <Input
                  value={billingInfo.customer_name || ''}
                  onChange={e => handleBillingChange("customer_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={billingInfo.customer_email || ''}
                  onChange={e => handleBillingChange("customer_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={billingInfo.customer_phone || ''}
                  onChange={e => handleBillingChange("customer_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Công ty</Label>
                <Input
                  value={billingInfo.company_name || ''}
                  onChange={e => handleBillingChange("company_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mã số thuế</Label>
                <Input
                  value={billingInfo.tax_id || ''}
                  onChange={e => handleBillingChange("tax_id", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Địa chỉ</Label>
                <Textarea
                  value={billingInfo.address || ''}
                  onChange={e => handleBillingChange("address", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <Input
                  value={formData.payment_method || ''}
                  onChange={e => handleChange("payment_method", e.target.value)}
                  placeholder="Transfer, Credit Card, ..."
                />
              </div>
              <div className="space-y-2">
                <Label>Mã tham chiếu (Ref ID)</Label>
                <Input
                  value={formData.payment_ref_id || ''}
                  onChange={e => handleChange("payment_ref_id", e.target.value)}
                  placeholder="Bank Tran ID, Stripe ID..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? "Đang lưu..." : (isEdit ? "Cập nhật" : "Tạo đơn hàng")}
          {!loading && <Save className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </form>
  );
}
