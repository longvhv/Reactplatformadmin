/**
 * Order Form Component
 * Form for creating/editing subscription orders
 * ✅ Updated for new subscription_orders schema (2026-01-15)
 */

import React, { useState, useEffect } from 'react';
import { Order, CreateOrderRequest, UpdateOrderRequest, LineItem, BillingInfo } from '../../api/ordersApi';
import { tenantsApi, Tenant } from '../../api/tenantsApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Save, X } from 'lucide-react';
import { LineItemsEditor } from './LineItemsEditor';

interface OrderFormProps {
  order?: Partial<Order>;
  onSubmit: (data: CreateOrderRequest | UpdateOrderRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrderForm({ order, onSubmit, onCancel, loading }: OrderFormProps) {
  const { t } = useLanguage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    tenant_id: order?.tenant_id || '',
    order_number: order?.order_number || '',
    po_number: order?.po_number || '',
    type: order?.type || 'NEW' as const,
    status: order?.status || 'DRAFT' as const,
    currency_code: order?.currency_code || 'VND',
    subtotal_amount: order?.subtotal_amount || 0,
    tax_amount: order?.tax_amount || 0,
    discount_amount: order?.discount_amount || 0,
    credit_applied: order?.credit_applied || 0,
    total_amount: order?.total_amount || 0,
    payment_method: order?.payment_method || '',
    payment_ref_id: order?.payment_ref_id || '',
  });

  // Items state
  const [items, setItems] = useState<LineItem[]>(
    order?.items_snapshot || [
      { 
        item_type: 'PRODUCT',
        id: '', 
        name: '', 
        price: 0, 
        quantity: 1,
        product_type: 'OTHER',
        metadata: {}
      }
    ]
  );

  // Billing info state
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(
    order?.billing_info || {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      company_name: '',
      tax_id: '',
      address: '',
    }
  );

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const data = await tenantsApi.getAll();
        setTenants(data);
        if (!formData.tenant_id && data.length > 0) {
          setFormData(prev => ({ ...prev, tenant_id: data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load tenants', err);
      }
    };
    loadTenants();
  }, []);

  // Auto-calculate amounts
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Number(formData.tax_amount) || 0;
    const discount = Number(formData.discount_amount) || 0;
    const credit = Number(formData.credit_applied) || 0;
    const total = subtotal + tax - discount - credit;

    setFormData(prev => ({
      ...prev,
      subtotal_amount: subtotal,
      total_amount: Math.max(0, total),
    }));
  }, [items, formData.tax_amount, formData.discount_amount, formData.credit_applied]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Base data
    const commonData = {
      po_number: formData.po_number || undefined,
      type: formData.type,
      status: formData.status,
      currency_code: formData.currency_code,
      subtotal_amount: formData.subtotal_amount,
      tax_amount: formData.tax_amount,
      discount_amount: formData.discount_amount,
      credit_applied: formData.credit_applied,
      total_amount: formData.total_amount,
      items_snapshot: items,
      billing_info: billingInfo,
      payment_method: formData.payment_method || undefined,
      payment_ref_id: formData.payment_ref_id || undefined,
    };

    if (order && order._id) {
      // Update
      const updateData: UpdateOrderRequest = {
        ...commonData,
        version: order.version || 1,
      };
      onSubmit(updateData);
    } else {
      // Create
      const createData: CreateOrderRequest = {
        ...commonData,
        tenant_id: formData.tenant_id,
        order_number: formData.order_number,
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* I. BASIC INFO */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          I. Thông tin cơ bản
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenant_id">Khách hàng (Tenant) *</Label>
            <select
              id="tenant_id"
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              required
              disabled={!!order} // Disable if editing
              className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="">-- Chọn khách hàng --</option>
              {tenants.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="order_number">Mã đơn hàng *</Label>
            <Input
              id="order_number"
              name="order_number"
              value={formData.order_number}
              onChange={handleChange}
              required
              readOnly={!!order} // Readonly if editing
              placeholder="ORD-2026-001"
              className="mt-2"
            />
            {!order && (
              <p className="text-xs text-muted-foreground mt-1">
                Mã đơn hàng phải unique trong hệ thống
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="po_number">Số PO (tùy chọn)</Label>
            <Input
              id="po_number"
              name="po_number"
              value={formData.po_number}
              onChange={handleChange}
              placeholder="PO-2026-001"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="type">Loại đơn hàng *</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="NEW">Mới</option>
              <option value="RENEWAL">Gia hạn</option>
              <option value="UPGRADE">Nâng cấp</option>
              <option value="DOWNGRADE">Hạ cấp</option>
              <option value="ADD_ON">Thêm tính năng</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status">Trạng thái *</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="DRAFT">Nháp</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="FAILED">Thất bại</option>
              <option value="REFUNDED">Đã hoàn tiền</option>
            </select>
          </div>

          <div>
            <Label htmlFor="currency_code">Loại tiền tệ *</Label>
            <select
              id="currency_code"
              name="currency_code"
              value={formData.currency_code}
              onChange={handleChange}
              required
              className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="VND">VND - Việt Nam Đồng</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
        </div>
      </div>

      {/* II. ITEMS */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <LineItemsEditor 
          items={items} 
          onChange={setItems} 
          disabled={loading}
        />
      </div>

      {/* III. FINANCIAL DETAILS */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          III. Chi tiết tài chính
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-foreground">Tạm tính (tự động):</span>
                <span className="text-primary">
                  {formData.subtotal_amount.toLocaleString()} {formData.currency_code}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="tax_amount">Thuế</Label>
            <Input
              id="tax_amount"
              name="tax_amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.tax_amount}
              onChange={handleChange}
              className="mt-2 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="discount_amount">Giảm giá</Label>
            <Input
              id="discount_amount"
              name="discount_amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.discount_amount}
              onChange={handleChange}
              className="mt-2 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="credit_applied">Credit áp dụng</Label>
            <Input
              id="credit_applied"
              name="credit_applied"
              type="number"
              min="0"
              step="0.01"
              value={formData.credit_applied}
              onChange={handleChange}
              className="mt-2 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-foreground">Tổng cộng:</span>
                <span className="text-green-600 dark:text-green-400">
                  {formData.total_amount.toLocaleString()} {formData.currency_code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Công thức: Tạm tính + Thuế - Giảm giá - Credit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* IV. BILLING INFO */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          IV. Thông tin khách hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer_name">Tên khách hàng</Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={billingInfo.customer_name}
              onChange={handleBillingChange}
              placeholder="Nguyễn Văn A"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="customer_email">Email</Label>
            <Input
              id="customer_email"
              name="customer_email"
              type="email"
              value={billingInfo.customer_email}
              onChange={handleBillingChange}
              placeholder="customer@example.com"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="customer_phone">Điện thoại</Label>
            <Input
              id="customer_phone"
              name="customer_phone"
              value={billingInfo.customer_phone}
              onChange={handleBillingChange}
              placeholder="+84 123 456 789"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="company_name">Tên công ty</Label>
            <Input
              id="company_name"
              name="company_name"
              value={billingInfo.company_name}
              onChange={handleBillingChange}
              placeholder="ABC Company Ltd."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="tax_id">Mã số thuế</Label>
            <Input
              id="tax_id"
              name="tax_id"
              value={billingInfo.tax_id}
              onChange={handleBillingChange}
              placeholder="0123456789"
              className="mt-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              name="address"
              value={billingInfo.address}
              onChange={handleBillingChange}
              placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
              rows={2}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* V. PAYMENT INFO */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          V. Thông tin thanh toán
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_method">Phương thức thanh toán</Label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="">-- Chọn phương thức --</option>
              <option value="CREDIT_CARD">Thẻ tín dụng</option>
              <option value="DEBIT_CARD">Thẻ ghi nợ</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="VNPAY">VNPay</option>
              <option value="MOMO">MoMo</option>
              <option value="ZALOPAY">ZaloPay</option>
              <option value="PAYPAL">PayPal</option>
              <option value="STRIPE">Stripe</option>
            </select>
          </div>

          <div>
            <Label htmlFor="payment_ref_id">Mã tham chiếu thanh toán</Label>
            <Input
              id="payment_ref_id"
              name="payment_ref_id"
              value={formData.payment_ref_id}
              onChange={handleChange}
              placeholder="TXN-12345678"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-1" />
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="w-4 h-4 mr-1" />
          {loading ? 'Đang lưu...' : order ? 'Cập nhật' : 'Tạo đơn hàng'}
        </Button>
      </div>
    </form>
  );
}

export default OrderForm;
