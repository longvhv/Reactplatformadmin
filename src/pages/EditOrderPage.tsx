/**
 * Edit Subscription Order Page
 * Production-ready form for updating existing subscription orders
 * ✅ Matches new subscription_orders schema (migration 023)
 * ✅ Optimistic locking with version control
 * ✅ Full validation and error handling
 * ✅ Stripe/GitHub inspired design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersApi, Order, UpdateOrderRequest } from '../api/ordersApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Save, AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditOrderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<UpdateOrderRequest>({
    status: 'PENDING',
    payment_method: '',
    total_amount: 0,
    version: 1,
  });

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoadingOrder(true);
      const data = await ordersApi.getById(orderId);
      setOrder(data);
      setFormData({
        status: data.status,
        payment_method: data.payment_method || '',
        payment_ref_id: data.payment_ref_id || '',
        total_amount: data.total_amount,
        tax_amount: data.tax_amount,
        discount_amount: data.discount_amount,
        credit_applied: data.credit_applied,
        version: data.version,
      });
    } catch (error: any) {
      console.error('Error loading order:', error);
      toast.error('Không thể tải đơn hàng: ' + error.message);
      navigate('/core/subscription-orders');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !order) return;

    try {
      setLoading(true);
      
      // Validate
      if (formData.total_amount <= 0) {
        toast.error('Tổng tiền phải lớn hơn 0');
        return;
      }

      // Update order
      await ordersApi.update(id, formData);
      
      toast.success('Cập nhật đơn hàng thành công!');
      navigate(`/core/subscription-orders/${id}`);
      
    } catch (error: any) {
      console.error('Error updating order:', error);
      
      // Handle optimistic locking conflict
      if (error.message.includes('Version conflict') || 
          error.message.includes('409') ||
          error.message.includes('version')) {
        toast.error('Đơn hàng đã được cập nhật bởi người khác. Đang tải lại...');
        if (id) loadOrder(id);
      } else {
        toast.error('Không thể cập nhật đơn hàng: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/core/subscription-orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-foreground">
                  Chỉnh sửa đơn hàng
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                {order.order_number} • Version: v{order.version}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </div>

        {/* Optimistic Locking Warning */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Optimistic Locking</p>
                <p>
                  Đơn hàng này sử dụng <strong>version control</strong> (hiện tại: v{order.version}). 
                  Nếu người khác đã cập nhật đơn hàng, bạn sẽ nhận được thông báo lỗi và cần tải lại trang.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-only Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cố định (không thể sửa)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Order ID</Label>
                  <p className="font-mono text-sm mt-1">{order._id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mã đơn hàng</Label>
                  <p className="font-semibold mt-1">{order.order_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Loại đơn hàng</Label>
                  <p className="mt-1">{order.type || 'NEW'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Đơn vị tiền tệ</Label>
                  <p className="mt-1">{order.currency_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tạo lúc</Label>
                  <p className="font-mono text-xs mt-1">
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cập nhật lúc</Label>
                  <p className="font-mono text-xs mt-1">
                    {new Date(order.updated_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin có thể chỉnh sửa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div>
                <Label htmlFor="status">Trạng thái *</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                  required
                >
                  <option value="DRAFT">DRAFT - Nháp</option>
                  <option value="PENDING">PENDING - Chờ thanh toán</option>
                  <option value="PAID">PAID - Đã thanh toán</option>
                  <option value="CANCELLED">CANCELLED - Đã hủy</option>
                  <option value="FAILED">FAILED - Thất bại</option>
                  <option value="REFUNDED">REFUNDED - Đã hoàn tiền</option>
                </select>
              </div>

              {/* Payment Method */}
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
                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                  <option value="MOMO">MoMo</option>
                  <option value="ZALOPAY">ZaloPay</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>

              {/* Payment Reference */}
              <div>
                <Label htmlFor="payment_ref_id">Mã tham chiếu thanh toán</Label>
                <Input
                  id="payment_ref_id"
                  name="payment_ref_id"
                  type="text"
                  value={formData.payment_ref_id || ''}
                  onChange={handleChange}
                  placeholder="VD: TXN123456789"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tax Amount */}
                <div>
                  <Label htmlFor="tax_amount">Thuế</Label>
                  <Input
                    id="tax_amount"
                    name="tax_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax_amount || 0}
                    onChange={handleChange}
                    className="mt-2 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(formData.tax_amount || 0, order.currency_code)}
                  </p>
                </div>

                {/* Discount Amount */}
                <div>
                  <Label htmlFor="discount_amount">Giảm giá</Label>
                  <Input
                    id="discount_amount"
                    name="discount_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount || 0}
                    onChange={handleChange}
                    className="mt-2 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(formData.discount_amount || 0, order.currency_code)}
                  </p>
                </div>

                {/* Credit Applied */}
                <div>
                  <Label htmlFor="credit_applied">Credit áp dụng</Label>
                  <Input
                    id="credit_applied"
                    name="credit_applied"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.credit_applied || 0}
                    onChange={handleChange}
                    className="mt-2 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(formData.credit_applied || 0, order.currency_code)}
                  </p>
                </div>

                {/* Total Amount */}
                <div>
                  <Label htmlFor="total_amount">Tổng tiền *</Label>
                  <Input
                    id="total_amount"
                    name="total_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={handleChange}
                    className="mt-2 font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(formData.total_amount, order.currency_code)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Snapshot Info */}
          {order.items_snapshot && order.items_snapshot.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-base">📦 Items Snapshot (không thể sửa)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  Items snapshot được lưu tự động khi tạo đơn hàng và <strong>không thể thay đổi</strong>. 
                  Điều này đảm bảo thông tin về giá và quyền lợi luôn chính xác với thời điểm khách hàng đặt mua.
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  {order.items_snapshot.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                      </div>
                      <p className="font-mono">
                        {formatPrice(item.price * item.qty, order.currency_code)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/core/subscription-orders')}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>

          {/* Version Info */}
          <p className="text-xs text-muted-foreground text-center">
            Current version: v{order.version} • Updating to: v{order.version + 1}
          </p>
        </form>
      </div>
    </div>
  );
}