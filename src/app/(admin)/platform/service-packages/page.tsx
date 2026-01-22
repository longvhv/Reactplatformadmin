/**
 * Service Packages List Page
 * ✅ REFACTORED: Improved UI and structure
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Package, Plus, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { servicePackagesApi, ServicePackage } from '@/api/servicePackagesApi';
import { showToast } from '@/lib/toast';

function ServicePackagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await servicePackagesApi.getAll();
      setItems(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load service packages');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.package_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Package}
      title="Service Packages"
      description="Manage service pricing packages and plans"
      actions={
        <Button onClick={() => router.push('/platform/service-packages/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </Button>
      }
    >
      <Card className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No service packages found.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Package Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Billing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr 
                    key={item._id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/platform/service-packages/${item._id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.package_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {item.package_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      {item.price.toLocaleString()} {item.currency}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.billing_cycle}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export { ServicePackagesPage };
export default ServicePackagesPage;
