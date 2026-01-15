/**
 * Add Subscription Order Page
 * Production-ready form for creating subscription orders
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ordersApi, CreateOrderRequest } from '../api/ordersApi';
import { OrderForm } from '../components/orders/OrderForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function AddOrderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateOrderRequest) => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!data.order_number) {
        toast.error('Vui lòng nhập mã đơn hàng');
        return;
      }
      
      if (!data.tenant_id) {
        toast.error('Vui lòng chọn tenant');
        return;
      }

      if (data.total_amount <= 0) {
        toast.error('Tổng tiền phải lớn hơn 0');
        return;
      }

      // Create order
      const created = await ordersApi.create(data);
      
      toast.success(`Đã tạo đơn hàng ${data.order_number}`);
      navigate(`/core/subscription-orders/${created._id}`);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Handle specific errors
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('Mã đơn hàng đã tồn tại. Vui lòng dùng mã khác.');
      } else {
        toast.error(`Không thể tạo đơn hàng: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo đơn hàng mới"
      description="Tạo đơn hàng subscription cho tenant"
      icon={ShoppingCart}
      backPath="/core/subscription-orders"
      backLabel="Quay lại danh sách"
    >
      <OrderForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/subscription-orders')}
        isLoading={loading}
      />
    </FormPageLayout>
  );
}