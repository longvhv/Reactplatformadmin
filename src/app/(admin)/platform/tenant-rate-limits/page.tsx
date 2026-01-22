'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { 
  Activity, Plus, Search, Filter, Trash2, Edit, CheckCircle, XCircle 
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { tenantRateLimitsApi, TenantRateLimit } from '../../../../api/tenantRateLimitsApi';
import { showToast } from '../../../../lib/toast';
import { TenantSelect } from '../../../../components/common/TenantSelect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';

export default function TenantRateLimitsPage() {
  const router = useRouter();
  const [limits, setLimits] = useState<TenantRateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await tenantRateLimitsApi.getAll();
      setLimits(data);
    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load rate limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate limit?')) return;
    try {
      await tenantRateLimitsApi.delete(id);
      showToast.success('Success', 'Rate limit deleted');
      setLimits(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to delete');
    }
  };

  const handleToggle = async (limit: TenantRateLimit) => {
    try {
      const newValue = !limit.is_enabled;
      // Optimistic update
      setLimits(prev => prev.map(l => l._id === limit._id ? { ...l, is_enabled: newValue } : l));
      await tenantRateLimitsApi.toggle(limit._id, newValue);
    } catch (err) {
      // Revert
      setLimits(prev => prev.map(l => l._id === limit._id ? { ...l, is_enabled: limit.is_enabled } : l));
      showToast.error('Error', 'Failed to update status');
    }
  };

  const filteredLimits = limits.filter(l => {
    const matchesTenant = !tenantFilter || l.tenant_id === tenantFilter;
    const matchesSearch = !searchQuery || 
      l.limit_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.limit_key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  return (
    <PageLayout
      icon={Activity}
      title="Tenant Rate Limits"
      description="Manage API quotas and throttling policies per tenant"
      actions={
        <Button onClick={() => router.push('/platform/tenant-rate-limits/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Limit
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by name or key..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-[300px]">
            <TenantSelect 
              value={tenantFilter}
              onChange={setTenantFilter}
              placeholder="Filter by Tenant"
            />
          </div>
        </div>

        {loading ? (
           <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLimits.map((limit) => (
                  <tr key={limit._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggle(limit)}>
                        {limit.is_enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{limit.limit_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{limit.limit_key}</div>
                      <div className="text-xs text-indigo-600">{limit.resource_type?.toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-50">
                          {limit.max_requests} / {limit.time_window} {limit.window_unit}(s)
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">{limit.limit_type.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="secondary" className="capitalize">{limit.limit_scope}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(limit.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/platform/tenant-rate-limits/edit/${limit._id}`)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(limit._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLimits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No rate limits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}