/**
 * Edit Order Page
 * Edit existing subscription order
 * ✅ Updated to use EnhancedOrderForm
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { ordersApi, Order } from '@/api/ordersApi';
import { EnhancedOrderForm } from '@/components/orders/EnhancedOrderForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditOrderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await ordersApi.getById(id);
        if (data) {
          setOrder(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy đơn hàng');
          navigate('/commerce/subscription-orders');
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        showToast.error('Lỗi', 'Không thể tải đơn hàng: ' + error.message);
        navigate('/commerce/subscription-orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await ordersApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật đơn hàng');
      navigate('/commerce/subscription-orders', { replace: true });
    } catch (error: any) {
      console.error('Error updating order:', error);
      showToast.error('Lỗi', 'Không thể cập nhật đơn hàng: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Đơn Hàng"
      description={`Cập nhật thông tin đơn hàng ${order.order_number}`}
      icon={ShoppingCart}
      backPath="/commerce/subscription-orders"
      backLabel="Danh sách đơn hàng"
    >
      <EnhancedOrderForm 
        initialData={order}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate('/commerce/subscription-orders')}
      />
    </FormPageLayout>
  );
}
