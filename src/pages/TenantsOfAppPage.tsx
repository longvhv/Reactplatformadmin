/**
 * Tenants Of App Page
 * Hiển thị danh sách tenants đang sử dụng một application
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Loader2, 
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Tenant {
  _id: string;
  code: string;
  name: string;
  tier: string;
  status: string;
  data_region: string;
  created_at: string;
}

interface TenantApplication {
  _id: string;
  tenant_id: string;
  app_code: string;
  is_active: boolean;
  license_type: string;
  max_users: number;
  expires_at: string | null;
  activated_at: string | null;
  created_at: string;
  tenants: Tenant;
}

interface Application {
  code: string;
  name: string;
}

export function TenantsOfAppPage() {
  const { id } = useParams<{ id: string }>();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [tenantApps, setTenantApps] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch application data
  useEffect(() => {
    if (!id) return;
    
    const fetchApplication = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setApplication(data);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      }
    };

    fetchApplication();
  }, [id]);

  // Fetch tenants using this app
  const fetchTenants = async () => {
    if (!application) return;

    try {
      setLoading(true);
      const url = new URL(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-applications/by-app/${application.code}`
      );

      if (statusFilter !== 'all') {
        url.searchParams.append('is_active', statusFilter);
      }
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }

      const result = await response.json();
      setTenantApps(result.data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Không thể tải danh sách tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (application) {
      fetchTenants();
    }
  }, [application, statusFilter]);

  // Search with debounce
  useEffect(() => {
    if (!application) return;

    const timer = setTimeout(() => {
      fetchTenants();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Get badge variant for license type
  const getLicenseBadgeVariant = (licenseType: string) => {
    switch (licenseType) {
      case 'ENTERPRISE':
        return 'default';
      case 'PREMIUM':
        return 'default';
      case 'BASIC':
        return 'secondary';
      case 'TRIAL':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Statistics
  const totalTenants = tenantApps.length;
  const activeTenants = tenantApps.filter(ta => ta.is_active).length;
  const inactiveTenants = totalTenants - activeTenants;

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">
            Danh sách tenants đang sử dụng <strong>{application.name}</strong>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTenants}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div className="text-2xl font-bold">{totalTenants}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{activeTenants}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Không hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div className="text-2xl font-bold text-gray-500">{inactiveTenants}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Tìm kiếm tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Tenants</CardTitle>
          <CardDescription>
            Hiển thị {tenantApps.length} tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
            </div>
          ) : tenantApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">
                Chưa có tenant nào sử dụng ứng dụng này
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Max Users</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Kích hoạt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantApps.map((ta) => (
                    <TableRow key={ta._id}>
                      <TableCell className="font-medium">
                        {ta.tenants?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ta.tenants?.code || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLicenseBadgeVariant(ta.license_type)}>
                          {ta.license_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{ta.max_users}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ta.tenants?.tier || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ta.tenants?.data_region || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {ta.is_active ? (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(ta.activated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TenantsOfAppPage;
