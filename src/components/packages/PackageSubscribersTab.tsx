/**
 * PackageSubscribersTab - List subscribers of package
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

interface PackageSubscribersTabProps {
  packageId: string;
}

interface PackageSubscriber {
  _id: string;
  tenant_id: string;
  tenant_name: string;
  status: string;
  start_date: string;
  end_date?: string;
  price: number;
  currency: string;
  created_at: string;
}

export function PackageSubscribersTab({ packageId }: PackageSubscribersTabProps) {
  const [subscribers, setSubscribers] = useState<PackageSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, [packageId, statusFilter]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/v1/packages/${packageId}/subscribers?status=${statusFilter}`
        : `/api/v1/packages/${packageId}/subscribers`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      const data = await response.json();
      setSubscribers(data);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', label: 'Expired' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      PAST_DUE: { color: 'bg-yellow-100 text-yellow-800', label: 'Past Due' },
    };

    const config = configs[status] || configs.ACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Khách hàng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Danh sách khách hàng đăng ký gói này
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PAST_DUE">Past Due</option>
          </select>
          <Badge className="bg-blue-100 text-blue-800">
            {subscribers.length} khách hàng
          </Badge>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  Chưa có khách hàng nào
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((sub) => (
                <TableRow key={sub._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {sub.tenant_name}
                        </p>
                        <p className="text-sm text-gray-600 font-mono">
                          {sub.tenant_id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(sub.status)}</TableCell>

                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {new Date(sub.start_date).toLocaleDateString('vi-VN')}
                    </span>
                  </TableCell>

                  <TableCell>
                    {sub.end_date ? (
                      <span className="text-sm text-gray-900">
                        {new Date(sub.end_date).toLocaleDateString('vi-VN')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      {sub.price.toLocaleString('vi-VN')} {sub.currency}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Link to={`/core/tenants/${sub.tenant_id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
