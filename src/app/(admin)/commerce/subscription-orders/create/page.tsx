/**
 * Add Order Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../../components/shim/next-navigation';
import { ShoppingCart, Plus } from 'lucide-react';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { ordersApi, CreateOrderRequest } from '../../../../../../api/ordersApi';
import { OrderForm } from '../../../../../../components/orders/OrderForm';
import { showToast } from '../../../../../../lib/toast';

function AddOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ordersApi.create(data as CreateOrderRequest);
      showToast.success('Success', 'Order created');
      router.push('/commerce/subscription-orders');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Add Order"
      description="Create a new subscription order"
      icon={ShoppingCart}
      backPath="/commerce/subscription-orders"
      backLabel="Back to Orders"
    >
      <OrderForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/commerce/subscription-orders')}
      />
    </FormPageLayout>
  );
}

export { AddOrderPage };
export default AddOrderPage;