/**
 * Order Form V2 Component
 * Updated for new subscription_orders schema with Line Items support
 * Supports PLAN + PRODUCT items
 */

import React, { useState, useEffect } from 'react';
import { Order, CreateOrderRequest, LineItem, BillingInfo, OrderType } from '../../api/ordersApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Save, X } from 'lucide-react';
import { LineItemsEditor } from './LineItemsEditor';

interface OrderFormV2Props {
  order?: Partial<Order>;
  onSubmit: (data: CreateOrderRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrderFormV2({ order, onSubmit, onCancel, loading }: OrderFormV2Props) {
  const { t } = useLanguage();
  
  // Form state
  const [formData, setFormData] = useState({
    tenant_id: order?.tenant_id || '00000000-0000-0000-0000-000000000001',
    order_number: order?.order_number || '',
    po_number: order?.po_number || '',
    type: order?.type || 'NEW' as OrderType,
    status: order?.status || 'DRAFT' as const,
    currency_code: order?.currency_code || 'VND',
    tax_amount: order?.tax_amount || 0,
    discount_amount: order?.discount_amount || 0,
    credit_applied: order?.credit_applied || 0,
    payment_method: order?.payment_method || '',
    payment_ref_id: order?.payment_ref_id || '',
  });

  // Line Items state
  const [items, setItems] = useState<LineItem[]>(
    order?.items_snapshot && order.items_snapshot.length > 0
      ? order.items_snapshot
      : [
          {
            item_type: 'PLAN' as const,
            id: '',
            name: '',
            price: 0,
            quantity: 1,
            metadata: {},
          }
        ]
  );

  // Validation state for line items
  const [itemsValid, setItemsValid] = useState(true);
  const [itemsErrors, setItemsErrors] = useState<string[]>([]);

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

  // Calculated values
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    subtotal_amount: 0,
    total_amount: 0,
  });

  // Auto-calculate amounts when items or adjustments change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Number(formData.tax_amount) || 0;
    const discount = Number(formData.discount_amount) || 0;
    const credit = Number(formData.credit_applied) || 0;
    const total = subtotal + tax - discount - credit;

    setCalculatedAmounts({
      subtotal_amount: subtotal,
      total_amount: Math.max(0, total),
    });
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
    
    // Validate items
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 line item');
      return;
    }

    // Check validation from LineItemsEditor
    if (!itemsValid) {
      alert(`Có lỗi trong line items:\\n${itemsErrors.join('\\n')}`);
      return;
    }

    const submitData: CreateOrderRequest = {
      tenant_id: formData.tenant_id,
      order_number: formData.order_number,
      po_number: formData.po_number || undefined,
      type: formData.type,
      status: formData.status,
      currency_code: formData.currency_code,
      subtotal_amount: calculatedAmounts.subtotal_amount,
      tax_amount: formData.tax_amount,
      discount_amount: formData.discount_amount,
      credit_applied: formData.credit_applied,
      total_amount: calculatedAmounts.total_amount,
      items_snapshot: items,
      billing_info: billingInfo,
      payment_method: formData.payment_method || undefined,
      payment_ref_id: formData.payment_ref_id || undefined,
    };

    onSubmit(submitData);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* I. BASIC INFO */}
      <Card>
        <CardHeader>
          <CardTitle>I. Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order_number">Mã đơn hàng *</Label>
              <Input
                id="order_number"
                name="order_number"
                value={formData.order_number}
                onChange={handleChange}
                required
                placeholder="ORD-2026-001"
                className="mt-2"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mã đơn hàng phải unique trong hệ thống
              </p>
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
              <Label htmlFor="currency_code">Đơn vị tiền tệ *</Label>
              <select
                id="currency_code"
                name="currency_code"
                value={formData.currency_code}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
              >
                <option value="VND">VND - Việt Nam Đồng</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* II. LINE ITEMS */}
      <Card>
        <CardHeader>
          <CardTitle>II. Danh sách Line Items</CardTitle>
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

      {/* III. FINANCIAL ADJUSTMENTS */}
      <Card>
        <CardHeader>
          <CardTitle>III. Điều chỉnh tài chính</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax_amount">Thuế</Label>
              <Input
                id="tax_amount"
                name="tax_amount"
                type="number"
                value={formData.tax_amount}
                onChange={handleChange}
                min="0"
                step="1000"
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="discount_amount">Giảm giá</Label>
              <Input
                id="discount_amount"
                name="discount_amount"
                type="number"
                value={formData.discount_amount}
                onChange={handleChange}
                min="0"
                step="1000"
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="credit_applied">Credit áp dụng</Label>
              <Input
                id="credit_applied"
                name="credit_applied"
                type="number"
                value={formData.credit_applied}
                onChange={handleChange}
                min="0"
                step="1000"
                className="mt-2"
                disabled={loading}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatPrice(calculatedAmounts.subtotal_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Thuế:</span>
              <span className="font-semibold">{formatPrice(formData.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Giảm giá:</span>
              <span className="font-semibold text-red-600">-{formatPrice(formData.discount_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Credit:</span>
              <span className="font-semibold text-red-600">-{formatPrice(formData.credit_applied)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>TỔNG CỘNG:</span>
              <span className="text-primary">{formatPrice(calculatedAmounts.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IV. BILLING INFO */}
      <Card>
        <CardHeader>
          <CardTitle>IV. Thông tin thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Tên khách hàng</Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={billingInfo.customer_name || ''}
                onChange={handleBillingChange}
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                value={billingInfo.customer_email || ''}
                onChange={handleBillingChange}
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="customer_phone">Số điện thoại</Label>
              <Input
                id="customer_phone"
                name="customer_phone"
                value={billingInfo.customer_phone || ''}
                onChange={handleBillingChange}
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="company_name">Tên công ty</Label>
              <Input
                id="company_name"
                name="company_name"
                value={billingInfo.company_name || ''}
                onChange={handleBillingChange}
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="tax_id">Mã số thuế</Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={billingInfo.tax_id || ''}
                onChange={handleBillingChange}
                className="mt-2"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              name="address"
              value={billingInfo.address || ''}
              onChange={handleBillingChange}
              rows={3}
              className="mt-2"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* V. PAYMENT INFO */}
      <Card>
        <CardHeader>
          <CardTitle>V. Phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Phương thức</Label>
              <Input
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                placeholder="Chuyển khoản, Thẻ tín dụng, ..."
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="payment_ref_id">Mã tham chiếu</Label>
              <Input
                id="payment_ref_id"
                name="payment_ref_id"
                value={formData.payment_ref_id}
                onChange={handleChange}
                placeholder="Mã giao dịch từ ngân hàng, gateway, ..."
                className="mt-2"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Đang lưu...' : 'Lưu đơn hàng'}
        </Button>
      </div>
    </form>
  );
}