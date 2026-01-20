/**
 * Edit Order Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { ShoppingCart } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { ordersApi, Order } from '@/api/ordersApi';
import { OrderForm } from '@/components/orders/OrderForm';
import { showToast } from '@/lib/toast';

function EditOrderPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setOrderLoading(true);
      const data = await ordersApi.getById(id);
      setOrder(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load order');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ordersApi.update(id, data);
      showToast.success('Success', 'Order updated');
      router.push('/commerce/subscription-orders');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Edit Order"
      description="Update order information"
      icon={ShoppingCart}
      backPath="/commerce/subscription-orders"
      backLabel="Back to Orders"
    >
      <OrderForm
        initialData={order}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/commerce/subscription-orders')}
      />
    </FormPageLayout>
  );
}

export { EditOrderPage };
export default EditOrderPage;
