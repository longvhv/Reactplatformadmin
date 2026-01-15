/**
 * Subscription Order API Client (Alias)
 * @deprecated Use ordersApi instead
 */
import { 
  ordersApi, 
  Order, 
  OrderWithDetails, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderFilters,
  ItemSnapshot,
  BillingInfo,
  getStatusColor,
  getStatusLabel,
  getTypeColor,
  getTypeLabel
} from './ordersApi';

// Export Order as SubscriptionOrder for backward compatibility
export type SubscriptionOrder = Order;

// Export status and type enums
export type OrderStatus = Order['status'];
export type OrderType = Order['type'];

// Re-export all types
export type { 
  Order, 
  OrderWithDetails, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderFilters,
  ItemSnapshot,
  BillingInfo
};

// Re-export helper functions
export {
  getStatusColor,
  getStatusLabel,
  getTypeColor,
  getTypeLabel
};

// Re-export API client
export const subscriptionOrderApi = ordersApi;
export default subscriptionOrderApi;