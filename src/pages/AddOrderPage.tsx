/**
 * Add Order Page
 * Create new subscription order
 * ✅ Updated to use EnhancedOrderForm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { ordersApi, CreateOrderRequest } from '@/api/ordersApi';
import { EnhancedOrderForm } from '@/components/orders/EnhancedOrderForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function AddOrderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateOrderRequest | any) => {
    setLoading(true);
    try {
      await ordersApi.create(data);
      showToast.success('Thành công', 'Đã tạo đơn hàng mới');
      navigate('/commerce/subscription-orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      showToast.error('Lỗi', 'Không thể tạo đơn hàng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Đơn Hàng"
      description="Tạo đơn hàng mới (Subscription hoặc One-time)"
      icon={ShoppingCart}
      backPath="/commerce/subscription-orders"
      backLabel="Danh sách đơn hàng"
    >
      <EnhancedOrderForm 
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate('/commerce/subscription-orders')}
      />
    </FormPageLayout>
  );
}
