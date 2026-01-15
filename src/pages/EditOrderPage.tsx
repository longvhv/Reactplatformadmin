/**
 * Edit Subscription Order Page
 * Production-ready form for updating existing subscription orders
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 * ✅ Matches new subscription_orders schema (migration 023)
 * ✅ Optimistic locking with version control
 * ✅ Full validation and error handling
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ordersApi, Order } from '../api/ordersApi';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { OrderForm } from '../components/orders/OrderForm';
import { ShoppingCart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditOrderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

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
    } catch (error: any) {
      console.error('Error loading order:', error);
      toast.error('Không thể tải đơn hàng: ' + error.message);
      navigate('/core/subscription-orders');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!id || !order) return;

    try {
      setLoading(true);
      
      // Validate
      if (formData.total_amount <= 0) {
        toast.error('Tổng tiền phải lớn hơn 0');
        throw new Error('Invalid amount');
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
      throw error;
    } finally {
      setLoading(false);
    }
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

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa đơn hàng"
      description={`Cập nhật thông tin đơn hàng #${order.order_number || id}`}
      icon={ShoppingCart}
      backPath="/core/subscription-orders"
      backLabel="Quay lại danh sách"
    >
      <OrderForm
        order={order}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/subscription-orders')}
        loading={loading}
      />
    </FormPageLayout>
  );
}