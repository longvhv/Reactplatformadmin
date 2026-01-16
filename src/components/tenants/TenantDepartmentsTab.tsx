/**
 * TenantDepartmentsTab Component
 * Quản lý departments trong tenant với hierarchical tree structure
 * 
 * ✅ REWRITTEN 2026-01-14: Uses departmentsApi with 17 fields
 */

import { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  UserCog,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { departmentsApi, DepartmentTreeNode, Department } from '../../api/departmentsApi';
import { tenantMembersApi, TenantMember } from '../../api/tenantMembersApi';
import { DepartmentDetailView } from '../departments/DepartmentDetailView';
import { toast } from 'sonner@2.0.3';

interface TenantDepartmentsTabProps {
  tenantId: string;
}

export function TenantDepartmentsTab({ tenantId }: TenantDepartmentsTabProps) {
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentTreeNode | null>(null);
  const [parentDept, setParentDept] = useState<DepartmentTreeNode | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  useEffect(() => {
    loadDepartments();
  }, [tenantId]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const tree = await departmentsApi.getTree(tenantId);
      setDepartments(tree);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Không thể tải danh sách phòng ban');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleCreate = () => {
    setEditingDept(null);
    setParentDept(null);
    setShowDialog(true);
  };

  const handleCreateChild = (parent: DepartmentTreeNode) => {
    setEditingDept(null);
    setParentDept(parent);
    setShowDialog(true);
  };

  const handleEdit = (dept: DepartmentTreeNode) => {
    setEditingDept(dept);
    setParentDept(null);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    // Check if can delete
    try {
      const check = await departmentsApi.canDelete(id);
      if (!check.can_delete) {
        toast.error(`Không thể xóa: ${check.reason}`);
        return;
      }
    } catch (error) {
      console.error('Error checking delete:', error);
    }

    if (!confirm('Bạn có chắc muốn xóa phòng ban này?')) return;

    try {
      await departmentsApi.delete(id);
      toast.success('Đã xóa phòng ban');
      await loadDepartments();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast.error(`Không thể xóa: ${error.message}`);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await departmentsApi.archive(id);
      toast.success('Đã lưu trữ phòng ban');
      await loadDepartments();
    } catch (error: any) {
      console.error('Error archiving department:', error);
      toast.error(`Không thể lưu trữ: ${error.message}`);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await departmentsApi.activate(id);
      toast.success('Đã kích hoạt phòng ban');
      await loadDepartments();
    } catch (error: any) {
      console.error('Error activating department:', error);
      toast.error(`Không thể kích hoạt: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      INACTIVE: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
      ARCHIVED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
  };

  const renderDepartmentNode = (dept: DepartmentTreeNode, level: number = 0) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedIds.has(dept._id);

    return (
      <div key={dept._id}>
        <div
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}
        >
          {/* Expand/Collapse */}
          <div className="w-6 flex-shrink-0">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(dept._id)}
                className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
          </div>

          {/* Icon */}
          <div className={`p-2 rounded-lg ${getStatusColor(dept.status).split(' ')[0]}`}>
            <Building2 className={`w-4 h-4 ${getStatusColor(dept.status).split(' ')[1]}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">{dept.name}</p>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">({dept.code})</span>
              <Badge className={getStatusColor(dept.status)}>{dept.status}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              {dept.member_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{dept.member_count} thành viên</span>
                </div>
              )}
              {dept.manager_id && (
                <div className="flex items-center gap-1">
                  <UserCog className="w-3 h-3" />
                  <span>Có trưởng phòng</span>
                </div>
              )}
              {dept.level !== undefined && (
                <span>Cấp {dept.level}</span>
              )}
            </div>
            {dept.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                {dept.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateChild(dept);
              }}
              title="Thêm phòng ban con"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(dept);
              }}
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </Button>
            {dept.status === 'ACTIVE' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive(dept._id);
                }}
                title="Lưu trữ"
              >
                <Archive className="w-4 h-4 text-orange-600" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivate(dept._id);
                }}
                title="Kích hoạt"
              >
                <ArchiveRestore className="w-4 h-4 text-green-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(dept._id);
              }}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDept(dept);
              }}
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {dept.children!.map((child) => renderDepartmentNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const countByStatus = (depts: DepartmentTreeNode[], status: string): number => {
    let count = depts.filter(d => d.status === status).length;
    depts.forEach(d => {
      if (d.children) {
        count += countByStatus(d.children, status);
      }
    });
    return count;
  };

  const activeCount = countByStatus(departments, 'ACTIVE');
  const inactiveCount = countByStatus(departments, 'INACTIVE');
  const archivedCount = countByStatus(departments, 'ARCHIVED');

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Phòng ban</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quản lý cấu trúc tổ chức và phân cấp phòng ban
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadDepartments} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm phòng ban
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <FolderTree className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Archive className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Archived</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{archivedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Tree */}
      <Card className="p-6">
        {departments.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Chưa có phòng ban nào</p>
            <Button onClick={handleCreate} className="mt-4">
              Tạo phòng ban đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((dept) => renderDepartmentNode(dept))}
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog - Placeholder */}
      {showDialog && (
        <DepartmentDialog
          department={editingDept}
          parentDepartment={parentDept}
          tenantId={tenantId}
          onClose={() => {
            setShowDialog(false);
            setEditingDept(null);
            setParentDept(null);
          }}
          onSuccess={() => {
            setShowDialog(false);
            setEditingDept(null);
            setParentDept(null);
            loadDepartments();
          }}
        />
      )}

      {/* Department Detail View */}
      {selectedDept && (
        <DepartmentDetailView
          department={selectedDept}
          onClose={() => setSelectedDept(null)}
        />
      )}
    </div>
  );
}

// ==================== DEPARTMENT DIALOG ====================

interface DepartmentDialogProps {
  department?: DepartmentTreeNode | null;
  parentDepartment?: DepartmentTreeNode | null;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function DepartmentDialog({
  department,
  parentDepartment,
  tenantId,
  onClose,
  onSuccess,
}: DepartmentDialogProps) {
  const [formData, setFormData] = useState({
    code: department?.code || '',
    name: department?.name || '',
    description: department?.description || '',
    status: department?.status || 'ACTIVE',
    order: department?.order?.toString() || '0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code.trim() || !formData.name.trim()) {
      setError('Mã code và tên phòng ban là bắt buộc');
      return;
    }

    try {
      setSubmitting(true);

      if (department) {
        // Update existing - ✅ Include version
        await departmentsApi.update(department._id, {
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status as any,
          order: parseInt(formData.order) || 0,
          version: department.version,  // ✅ Required for optimistic locking
        });
        toast.success('Đã cập nhật phòng ban');
      } else {
        // Create new
        await departmentsApi.create({
          tenant_id: tenantId,
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          parent_department_id: parentDepartment?._id,
          status: formData.status as any,
          order: parseInt(formData.order) || 0,
        });
        toast.success('Đã tạo phòng ban mới');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving department:', error);
      setError(error.message || 'Không thể lưu phòng ban');
      toast.error(error.message || 'Không thể lưu phòng ban');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {department ? 'Chỉnh sửa phòng ban' : parentDepartment ? 'Thêm phòng ban con' : 'Tạo phòng ban mới'}
          </h3>
          {parentDepartment && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Phòng ban cha: <span className="font-semibold">{parentDepartment.name}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="VD: ENG"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên phòng ban <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Engineering"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả phòng ban..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thứ tự</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : department ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TenantDepartmentsTab;