/**
 * UserActivityTab Component
 * Display user activity logs
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface UserActivityTabProps {
  userId: string;
}

interface UserActivity {
  _id: string;
  user_id: string;
  tenant_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: string;
  ip_address: string;
  user_agent: string;
  status: 'SUCCESS' | 'FAILED';
  event_time: string;
}

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  useEffect(() => {
    filterActivities();
  }, [searchQuery, actionFilter, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/users/${userId}/activities?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
      setFilteredActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let result = [...activities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.action.toLowerCase().includes(query) ||
          a.resource.toLowerCase().includes(query) ||
          a.details.toLowerCase().includes(query) ||
          a.ip_address.includes(query)
      );
    }

    if (actionFilter !== 'all') {
      result = result.filter((a) => a.action === actionFilter);
    }

    setFilteredActivities(result);
  };

  const getActionBadge = (action: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      CREATE: { color: 'bg-green-100 text-green-800', label: 'Create' },
      UPDATE: { color: 'bg-blue-100 text-blue-800', label: 'Update' },
      DELETE: { color: 'bg-red-100 text-red-800', label: 'Delete' },
      LOGIN: { color: 'bg-purple-100 text-purple-800', label: 'Login' },
      LOGOUT: { color: 'bg-gray-100 text-gray-800', label: 'Logout' },
      VIEW: { color: 'bg-indigo-100 text-indigo-800', label: 'View' },
    };

    const config = configs[action] || { color: 'bg-gray-100 text-gray-800', label: action };

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: UserActivity['status']) => {
    return status === 'SUCCESS' ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  const uniqueActions = Array.from(new Set(activities.map((a) => a.action)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoạt động</h2>
          <p className="text-sm text-gray-600">
            Lịch sử hoạt động của người dùng
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thành công</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.status === 'SUCCESS').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thất bại</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.status === 'FAILED').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Loại hành động</p>
              <p className="text-2xl font-bold text-gray-900">
                {uniqueActions.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm hoạt động..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tất cả hành động</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Activities Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hành động</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  Không tìm thấy hoạt động nào
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => (
                <TableRow key={activity._id}>
                  <TableCell>{getActionBadge(activity.action)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {activity.resource}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {activity.details}
                    </p>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm font-mono text-gray-600">
                      {activity.ip_address}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(activity.status)}
                      <span className="text-sm text-gray-600">
                        {activity.status}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(activity.event_time)}
                    </div>
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
