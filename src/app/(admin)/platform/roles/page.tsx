import React, { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { 
  Shield, Plus, Search, Filter, Eye, MoreVertical, 
  Lock, Edit, Trash2, Loader2, Users 
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { rolesApi, Role } from '../../../../api/rolesApi';
import { showToast } from '../../../../lib/toast';
import { getCurrentTenant } from '../../../../lib/currentTenant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { TenantSelect } from '../../../../components/common/TenantSelect';

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'SYSTEM' | 'CUSTOM'>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const tenant = await getCurrentTenant();
        if (tenant) {
          setTenantFilter(tenant._id);
        }
        await loadRoles();
      } catch (error) {
        console.error('Failed to initialize roles page:', error);
      }
    };
    init();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getAll();
      setRoles(data);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.')) return;
    try {
      await rolesApi.delete(id);
      showToast.success('Thành công', 'Đã xóa vai trò');
      setRoles(prev => prev.filter(r => r._id !== id));
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể xóa vai trò: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  // Filter Logic
  const filteredRoles = roles.filter(role => {
    // Tenant Filter
    if (tenantFilter && role.tenant_id !== tenantFilter) return false;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = role.name.toLowerCase().includes(query);
      const matchesDesc = role.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesDesc) return false;
    }

    // Type Filter
    if (typeFilter !== 'all' && role.type !== typeFilter) return false;

    return true;
  });

  const getStatusBadge = (type: string) => {
    switch(type) {
      case 'SYSTEM': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">System</Badge>;
      case 'CUSTOM': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Custom</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <PageLayout
      icon={Shield}
      title="Quản lý Vai trò (Roles)"
      description="Định nghĩa vai trò và phân quyền cho người dùng trong hệ thống"
      actions={
        <Button onClick={() => router.push('/platform/roles/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo Vai Trò
        </Button>
      }
    >
      <Card className="p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="Tìm kiếm theo tên hoặc mô tả..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tenant</label>
                <TenantSelect
                  value={tenantFilter}
                  onChange={setTenantFilter}
                  placeholder="Lọc theo Tenant"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại vai trò</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Tất cả</option>
                  <option value="SYSTEM">Hệ thống (System)</option>
                  <option value="CUSTOM">Tùy chỉnh (Custom)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setTenantFilter('');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Vai Trò</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quyền hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map((role) => (
                  <tr key={role._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/platform/roles/edit/${role._id}`);
                          }}
                          className="font-medium text-gray-900 hover:text-indigo-600 hover:underline cursor-pointer text-left"
                        >
                          {role.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(role.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Lock className="w-3 h-3" />
                        <span>{role.permission_codes?.length || 0} quyền</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 truncate max-w-[300px]">
                        {role.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/platform/roles/edit/${role._id}`)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {role.type !== 'SYSTEM' && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(role._id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa vai trò
                              </DropdownMenuItem>
                            )}
                            {role.type === 'SYSTEM' && (
                              <DropdownMenuItem disabled>
                                <Lock className="w-4 h-4 mr-2" />
                                Không thể xóa (System)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy vai trò nào phù hợp
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