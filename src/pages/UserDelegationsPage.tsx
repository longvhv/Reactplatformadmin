/**
 * User Delegations Page
 * Quản lý ủy quyền giữa các users
 * 
 * ⚠️ UNDER DEVELOPMENT - Production-ready template
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  UserCog, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ArrowRight,
  Edit2,
  Trash2,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

// ==================== TYPES ====================

type DelegationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';

interface UserDelegation {
  _id: string;
  delegator_id: string;      // User ủy quyền
  delegator_name: string;
  delegator_email: string;
  
  delegate_id: string;        // User được ủy quyền
  delegate_name: string;
  delegate_email: string;
  
  permissions: string[];      // Danh sách quyền được ủy quyền
  scope?: string;             // Phạm vi (ALL, SPECIFIC_RESOURCES, etc.)
  
  start_date: string;
  end_date: string;
  status: DelegationStatus;
  
  reason?: string;            // Lý do ủy quyền
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface DelegationStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  pending: number;
}

// ==================== MOCK DATA ====================

const MOCK_DELEGATIONS: UserDelegation[] = [
  {
    _id: '1',
    delegator_id: 'user-1',
    delegator_name: 'Nguyễn Văn A',
    delegator_email: 'nguyenvana@example.com',
    delegate_id: 'user-2',
    delegate_name: 'Trần Thị B',
    delegate_email: 'tranthib@example.com',
    permissions: ['APPROVE_REQUESTS', 'VIEW_REPORTS', 'MANAGE_USERS'],
    scope: 'ALL',
    start_date: '2026-01-10T00:00:00Z',
    end_date: '2026-02-10T00:00:00Z',
    status: 'ACTIVE',
    reason: 'Nghỉ phép 1 tháng',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    _id: '2',
    delegator_id: 'user-3',
    delegator_name: 'Lê Văn C',
    delegator_email: 'levanc@example.com',
    delegate_id: 'user-1',
    delegate_name: 'Nguyễn Văn A',
    delegate_email: 'nguyenvana@example.com',
    permissions: ['VIEW_REPORTS'],
    scope: 'SPECIFIC_RESOURCES',
    start_date: '2025-12-01T00:00:00Z',
    end_date: '2026-01-01T00:00:00Z',
    status: 'EXPIRED',
    reason: 'Công tác ngắn hạn',
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-01T08:00:00Z',
  },
  {
    _id: '3',
    delegator_id: 'user-4',
    delegator_name: 'Phạm Thị D',
    delegator_email: 'phamthid@example.com',
    delegate_id: 'user-5',
    delegate_name: 'Hoàng Văn E',
    delegate_email: 'hoangvane@example.com',
    permissions: ['MANAGE_USERS', 'APPROVE_REQUESTS'],
    scope: 'ALL',
    start_date: '2026-01-20T00:00:00Z',
    end_date: '2026-03-20T00:00:00Z',
    status: 'PENDING',
    reason: 'Cần hỗ trợ trong dự án mới',
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
];

const MOCK_STATS: DelegationStats = {
  total: 3,
  active: 1,
  expired: 1,
  revoked: 0,
  pending: 1,
};

// ==================== PAGE COMPONENT ====================

export default function UserDelegationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [delegations, setDelegations] = useState<UserDelegation[]>(MOCK_DELEGATIONS);
  const [filteredDelegations, setFilteredDelegations] = useState<UserDelegation[]>(MOCK_DELEGATIONS);
  const [stats, setStats] = useState<DelegationStats>(MOCK_STATS);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    applyFilters();
  }, [delegations, searchTerm, statusFilter]);

  const applyFilters = () => {
    let filtered = [...delegations];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.delegator_name.toLowerCase().includes(search) ||
        d.delegator_email.toLowerCase().includes(search) ||
        d.delegate_name.toLowerCase().includes(search) ||
        d.delegate_email.toLowerCase().includes(search) ||
        d.reason?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    setFilteredDelegations(filtered);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Đã làm mới danh sách');
    }, 500);
  };

  const handleRevoke = (delegation: UserDelegation) => {
    if (!confirm(`Bạn có chắc muốn thu hồi ủy quyền từ "${delegation.delegator_name}" đến "${delegation.delegate_name}"?`)) {
      return;
    }

    // TODO: API call to revoke
    toast.success('Đã thu hồi ủy quyền');
    
    // Update local state
    setDelegations(prev => prev.map(d => 
      d._id === delegation._id ? { ...d, status: 'REVOKED' as DelegationStatus } : d
    ));
  };

  const handleDelete = (delegation: UserDelegation) => {
    if (!confirm(`Bạn có chắc muốn xóa ủy quyền này?`)) {
      return;
    }

    // TODO: API call to delete
    toast.success('Đã xóa ủy quyền');
    
    // Update local state
    setDelegations(prev => prev.filter(d => d._id !== delegation._id));
  };

  const getStatusBadge = (status: DelegationStatus) => {
    const config = {
      ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle, label: 'Đang hoạt động' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', icon: XCircle, label: 'Đã hết hạn' },
      REVOKED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle, label: 'Đã thu hồi' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock, label: 'Chờ kích hoạt' },
    };
    
    const { color, icon: Icon, label } = config[status];
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <UserCog className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Ủy quyền
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý ủy quyền giữa các users
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              onClick={() => toast.info('Tính năng "Thêm ủy quyền" đang được phát triển')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm ủy quyền
            </Button>
          </div>
        </div>

        {/* Development Notice */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">🚧 Under Development</p>
                <p>
                  Module này đang trong quá trình phát triển. Hiện tại đang hiển thị mock data để demo UI/UX.
                  API integration và full CRUD operations sẽ được implement sau.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đang hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chờ kích hoạt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đã hết hạn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đã thu hồi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, lý do..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="PENDING">Chờ kích hoạt</SelectItem>
                  <SelectItem value="EXPIRED">Đã hết hạn</SelectItem>
                  <SelectItem value="REVOKED">Đã thu hồi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Delegations List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách ủy quyền ({filteredDelegations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDelegations.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Không có ủy quyền nào</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Không tìm thấy kết quả phù hợp với bộ lọc'
                    : 'Chưa có ủy quyền nào được tạo'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDelegations.map((delegation) => (
                  <Card key={delegation._id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Delegator → Delegate */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            {/* Delegator */}
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{delegation.delegator_name}</div>
                                <div className="text-xs text-muted-foreground">{delegation.delegator_email}</div>
                              </div>
                            </div>

                            {/* Arrow */}
                            <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                            {/* Delegate */}
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{delegation.delegate_name}</div>
                                <div className="text-xs text-muted-foreground">{delegation.delegate_email}</div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground mb-1">Quyền được ủy quyền</div>
                              <div className="flex flex-wrap gap-1">
                                {delegation.permissions.slice(0, 2).map((perm, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {perm}
                                  </Badge>
                                ))}
                                {delegation.permissions.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{delegation.permissions.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-muted-foreground mb-1">Thời gian</div>
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="w-3 h-3" />
                                {formatDate(delegation.start_date)} - {formatDate(delegation.end_date)}
                              </div>
                            </div>

                            <div>
                              <div className="text-muted-foreground mb-1">Trạng thái</div>
                              {getStatusBadge(delegation.status)}
                            </div>
                          </div>

                          {delegation.reason && (
                            <div className="mt-3 text-sm">
                              <span className="text-muted-foreground">Lý do: </span>
                              <span className="italic">{delegation.reason}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex md:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('Tính năng "Xem chi tiết" đang được phát triển')}
                          >
                            <Info className="w-4 h-4 md:mr-0 mr-2" />
                            <span className="md:hidden">Chi tiết</span>
                          </Button>
                          
                          {delegation.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevoke(delegation)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <XCircle className="w-4 h-4 md:mr-0 mr-2" />
                              <span className="md:hidden">Thu hồi</span>
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(delegation)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                            <span className="md:hidden">Xóa</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
