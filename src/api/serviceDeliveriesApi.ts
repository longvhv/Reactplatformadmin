/**
 * Service Deliveries API Client
 * Manages service deliveries like consulting hours, training sessions
 * Uses Adapter pattern - Ready for Golang migration
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type ServiceUnitType = 'HOUR' | 'SESSION' | 'DAY' | 'PROJECT';
export type ServiceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface DeliveryNote {
  date: string;
  units_used: number;
  description: string;
  performed_by?: string;
  notes?: string;
}

export interface ServiceDelivery {
  // I. ĐỊNH DANH & TENANCY
  _id: string;
  tenant_id: string;
  order_id: string;
  
  // II. THÔNG TIN DỊCH VỤ
  service_name: string;
  total_units: number; // VD: 10 giờ
  used_units: number; // VD: Đã dùng 2 giờ
  unit_type: ServiceUnitType;
  
  // III. TRẠNG THÁI
  status: ServiceStatus;
  
  // IV. DELIVERY TRACKING
  delivery_notes: DeliveryNote[]; // Nhật ký thực hiện dịch vụ
  
  // V. THỜI GIAN
  created_at: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ServiceDeliveryWithDetails extends ServiceDelivery {
  tenant_name?: string;
  order_number?: string;
  remaining_units?: number;
  progress_percentage?: number;
}

export interface CreateServiceDeliveryRequest {
  tenant_id: string;
  order_id: string;
  service_name: string;
  total_units: number;
  used_units?: number;
  unit_type: ServiceUnitType;
  status?: ServiceStatus;
  delivery_notes?: DeliveryNote[];
  started_at?: string;
}

export interface UpdateServiceDeliveryRequest {
  service_name?: string;
  total_units?: number;
  used_units?: number;
  status?: ServiceStatus;
  delivery_notes?: DeliveryNote[];
  started_at?: string;
  completed_at?: string;
}

export interface AddDeliveryNoteRequest {
  units_used: number;
  description: string;
  performed_by?: string;
  notes?: string;
}

export interface ServiceDeliveryFilters extends BaseFilters {
  tenant_id?: string;
  order_id?: string;
  status?: ServiceStatus;
  unit_type?: ServiceUnitType;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<ServiceDelivery, CreateServiceDeliveryRequest, UpdateServiceDeliveryRequest>(
  'tenant_service_deliveries',
  '/service-deliveries'
);

// ==================== API CLIENT ====================

export const serviceDeliveriesApi = {
  /**
   * GET /service-deliveries
   */
  getAll: async (filters?: ServiceDeliveryFilters): Promise<ServiceDelivery[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /service-deliveries/:id with joined data
   */
  getById: async (id: string): Promise<ServiceDeliveryWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get service delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from('tenant_service_deliveries')
      .select('*')
      .eq('_id', id)
      .single();

    if (deliveryError || !delivery) {
      throw new Error(`Service delivery not found: ${deliveryError?.message || 'Unknown error'}`);
    }

    // Get tenant name
    let tenant_name: string | undefined;
    if (delivery.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('_id', delivery.tenant_id)
        .single();
      tenant_name = tenant?.name;
    }

    // Get order number
    let order_number: string | undefined;
    if (delivery.order_id) {
      const { data: order } = await supabase
        .from('subscription_orders')
        .select('order_number')
        .eq('_id', delivery.order_id)
        .single();
      order_number = order?.order_number;
    }

    // Calculate derived fields
    const remaining_units = delivery.total_units - delivery.used_units;
    const progress_percentage = (delivery.used_units / delivery.total_units) * 100;

    return {
      ...delivery,
      tenant_name,
      order_number,
      remaining_units,
      progress_percentage,
    } as ServiceDeliveryWithDetails;
  },

  /**
   * POST /service-deliveries
   */
  create: async (data: CreateServiceDeliveryRequest): Promise<ServiceDelivery> => {
    return adapter.create(data);
  },

  /**
   * PATCH /service-deliveries/:id
   */
  update: async (id: string, data: UpdateServiceDeliveryRequest): Promise<ServiceDelivery> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /service-deliveries/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /service-deliveries/:id/start
   * Start service delivery
   */
  start: async (id: string): Promise<ServiceDelivery> => {
    return adapter.update(id, {
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
    });
  },

  /**
   * POST /service-deliveries/:id/complete
   * Complete service delivery
   */
  complete: async (id: string): Promise<ServiceDelivery> => {
    return adapter.update(id, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    });
  },

  /**
   * POST /service-deliveries/:id/cancel
   * Cancel service delivery
   */
  cancel: async (id: string): Promise<ServiceDelivery> => {
    return adapter.update(id, {
      status: 'CANCELLED',
    });
  },

  /**
   * POST /service-deliveries/:id/add-note
   * Add a delivery note and update used units
   */
  addNote: async (id: string, noteData: AddDeliveryNoteRequest): Promise<ServiceDelivery> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current delivery
    const { data: delivery, error: fetchError } = await supabase
      .from('tenant_service_deliveries')
      .select('*')
      .eq('_id', id)
      .single();

    if (fetchError || !delivery) {
      throw new Error(`Service delivery not found: ${fetchError?.message || 'Unknown error'}`);
    }

    // Create new note
    const newNote: DeliveryNote = {
      date: new Date().toISOString(),
      units_used: noteData.units_used,
      description: noteData.description,
      performed_by: noteData.performed_by,
      notes: noteData.notes,
    };

    // Update delivery with new note and used units
    const updatedNotes = [...(delivery.delivery_notes || []), newNote];
    const updatedUsedUnits = delivery.used_units + noteData.units_used;

    // Determine if delivery should be completed
    const shouldComplete = updatedUsedUnits >= delivery.total_units;

    return adapter.update(id, {
      delivery_notes: updatedNotes,
      used_units: updatedUsedUnits,
      status: shouldComplete ? 'COMPLETED' : delivery.status === 'PENDING' ? 'IN_PROGRESS' : delivery.status,
      ...(shouldComplete && !delivery.completed_at ? { completed_at: new Date().toISOString() } : {}),
      ...(delivery.status === 'PENDING' && !delivery.started_at ? { started_at: new Date().toISOString() } : {}),
    });
  },

  /**
   * GET /service-deliveries by order
   * Get all service deliveries for a specific order
   */
  getByOrderId: async (orderId: string): Promise<ServiceDelivery[]> => {
    return adapter.getAll({ order_id: orderId });
  },

  /**
   * GET /service-deliveries by tenant
   * Get all service deliveries for a specific tenant
   */
  getByTenantId: async (tenantId: string): Promise<ServiceDelivery[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },
};

// ==================== HOOKS ====================

/**
 * Hook to fetch service delivery details
 */
export function useServiceDeliveryDetails(id: string | undefined) {
  const [delivery, setDelivery] = useState<ServiceDeliveryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await serviceDeliveriesApi.getById(id);
      setDelivery(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service delivery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { delivery, loading, error, refresh };
}

/**
 * Hook to fetch deliveries by order
 */
export function useServiceDeliveriesByOrder(orderId: string | undefined) {
  const [deliveries, setDeliveries] = useState<ServiceDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await serviceDeliveriesApi.getByOrderId(orderId);
      setDeliveries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [orderId]);

  return { deliveries, loading, error, refresh };
}

/**
 * Hook to fetch deliveries by tenant
 */
export function useServiceDeliveriesByTenant(tenantId: string | undefined) {
  const [deliveries, setDeliveries] = useState<ServiceDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await serviceDeliveriesApi.getByTenantId(tenantId);
      setDeliveries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [tenantId]);

  return { deliveries, loading, error, refresh };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get unit type label
 */
export function getUnitTypeLabel(type: ServiceUnitType): string {
  switch (type) {
    case 'HOUR':
      return 'Giờ';
    case 'SESSION':
      return 'Buổi';
    case 'DAY':
      return 'Ngày';
    case 'PROJECT':
      return 'Dự án';
    default:
      return type;
  }
}

/**
 * Get service status label
 */
export function getServiceStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ thực hiện';
    case 'IN_PROGRESS':
      return 'Đang thực hiện';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
}

/**
 * Get service status color
 */
export function getServiceStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(delivery: ServiceDelivery): number {
  if (delivery.total_units === 0) return 0;
  return Math.min(100, (delivery.used_units / delivery.total_units) * 100);
}

/**
 * Get remaining units
 */
export function getRemainingUnits(delivery: ServiceDelivery): number {
  return Math.max(0, delivery.total_units - delivery.used_units);
}

/**
 * Check if delivery is overdue (no progress after 30 days)
 */
export function isDeliveryOverdue(delivery: ServiceDelivery): boolean {
  if (delivery.status !== 'PENDING') return false;
  
  const createdDate = new Date(delivery.created_at);
  const today = new Date();
  const daysSinceCreated = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceCreated > 30;
}

export default serviceDeliveriesApi;
