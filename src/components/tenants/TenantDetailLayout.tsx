/**
 * Tenant Detail Layout Component
 * Wraps tenant detail pages with sidebar navigation
 */

import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { TenantDetailSidebar } from './TenantDetailSidebar';
import { Loader2 } from 'lucide-react';

interface TenantDetailLayoutProps {
  children: ReactNode;
}

interface Tenant {
  _id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  slug?: string;
  email?: string;
}

export function TenantDetailLayout({ children }: TenantDetailLayoutProps) {
  const { tenant_id } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch for "new" route and set loading to false
    if (!tenant_id || tenant_id === 'new') {
      setLoading(false);
      return;
    }

    // Fetch tenant data
    const fetchTenant = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const response = await fetch(`/api/v1/tenants/${tenant_id}`);
        // const data = await response.json();

        // Mock data for now
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockTenant: Tenant = {
          _id: tenant_id,
          name: 'Acme Corporation',
          status: 'active',
          slug: 'acme-corp',
          email: 'admin@acme.com',
        };

        setTenant(mockTenant);
      } catch (err) {
        setError('Failed to load tenant data');
        console.error('Error fetching tenant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenant_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tenant...</p>
        </div>
      </div>
    );
  }

  // Skip error check for "new" route
  if (tenant_id !== 'new' && (error || !tenant)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Tenant not found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'The requested tenant could not be found.'}
          </p>
          <a
            href="/admin/tenants"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Tenants
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - only render if we have tenant data or it's "new" route */}
      {(tenant || tenant_id === 'new') && <TenantDetailSidebar tenant={tenant} />}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}