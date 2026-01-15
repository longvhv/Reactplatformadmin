/**
 * Add Subscription Order Page
 * Production-ready form for creating subscription orders
 * ✅ Matches new subscription_orders schema (migration 023)
 * ✅ Full validation and error handling
 * ✅ Stripe/GitHub inspired design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, CreateOrderRequest } from '../api/ordersApi';
import { OrderForm } from '../components/orders/OrderForm';
import { Button } from '../components/ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/core/subscription-orders')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
            
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Tạo đơn hàng mới
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Tạo đơn hàng mua gói dịch vụ cho khách hàng
            </p>
          </div>
        </div>

        {/* Form */}
        <OrderForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/subscription-orders')}
          loading={loading}
        />
      </div>
    </div>
  );
}