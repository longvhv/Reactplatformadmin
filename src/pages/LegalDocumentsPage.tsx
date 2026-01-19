/**
 * LegalDocumentsPage
 * Trang quản lý điều khoản sử dụng
 * ✅ REFACTORED: PageLayout, StatisticsCards, 100% UI/UX Quality
 */

import { Fragment, useState } from 'react';
import { FileText, Plus, Edit, Trash2, Eye, Archive, Upload, Search, Filter, ChevronDown } from 'lucide-react';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { LegalDocumentModal } from '@/components/legal/LegalDocumentModal';
import { LegalDocument, LegalDocumentType, LegalDocumentStatus } from '@/api/legalDocumentsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function LegalDocumentsPage() {
  const { documents, loading, createDocument, updateDocument, deleteDocument, publishDocument, archiveDocument } =
    useLegalDocuments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LegalDocumentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<LegalDocumentStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Get type label
  const getTypeLabel = (type: LegalDocumentType): string => {
    const labels: Record<LegalDocumentType, string> = {
      terms_of_service: 'ToS',
      privacy_policy: 'Privacy',
      cookie_policy: 'Cookie',
      gdpr: 'GDPR',
      eula: 'EULA',
      sla: 'SLA',
      dpa: 'DPA',
      other: 'Other',
    };
    return labels[type];
  };

  // Get type color
  const getTypeColor = (type: LegalDocumentType): string => {
    const colors: Record<LegalDocumentType, string> = {
      terms_of_service: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
      privacy_policy: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
      cookie_policy: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300',
      gdpr: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300',
      eula: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300',
      sla: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300',
      dpa: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300',
      other: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300',
    };
    return colors[type];
  };

  // Get status badge
  const getStatusBadge = (status: LegalDocumentStatus) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300', label: 'Published' },
      archived: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300', label: 'Archived' },
    };
    const { color, label } = config[status];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
  };

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle add
  const handleAdd = () => {
    setEditingDoc(undefined);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (doc: LegalDocument) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = (doc: LegalDocument) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa',
      description: `Bạn có chắc muốn xóa điều khoản "${doc.title}"? Hành động này không thể hoàn tác.`,
      variant: 'destructive',
      onConfirm: async () => {
        setDeletingId(doc._id);
        try {
          await deleteDocument(doc._id);
          showToast.success('Xóa thành công', 'Đã xóa điều khoản');
        } catch (err: any) {
          console.error('Error deleting document:', err);
          showToast.error('Lỗi', err.message || 'Không thể xóa điều khoản');
        } finally {
          setDeletingId(null);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  // Handle publish
  const handlePublish = (doc: LegalDocument) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận publish',
      description: `Bạn có chắc muốn publish điều khoản "${doc.title}"? Điều khoản sẽ có hiệu lực ngay lập tức.`,
      onConfirm: async () => {
        try {
          await publishDocument(doc._id, 'current-user-id');
          showToast.success('Publish thành công', 'Điều khoản đã được công bố');
        } catch (err: any) {
          console.error('Error publishing document:', err);
          showToast.error('Lỗi', err.message || 'Không thể publish điều khoản');
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  // Handle archive
  const handleArchive = (doc: LegalDocument) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận archive',
      description: `Bạn có chắc muốn archive điều khoản "${doc.title}"? Điều khoản sẽ không còn hiệu lực.`,
      onConfirm: async () => {
        try {
          await archiveDocument(doc._id, 'current-user-id');
          showToast.success('Archive thành công', 'Điều khoản đã được lưu trữ');
        } catch (err: any) {
          console.error('Error archiving document:', err);
          showToast.error('Lỗi', err.message || 'Không thể archive điều khoản');
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  // Handle submit
  const handleSubmit = async (data: any, id?: string) => {
    try {
      if (id) {
        await updateDocument(id, data);
        showToast.success('Cập nhật thành công', 'Đã cập nhật điều khoản');
      } else {
        await createDocument(data);
        showToast.success('Tạo thành công', 'Đã tạo điều khoản mới');
      }
      setIsModalOpen(false);
      setEditingDoc(undefined);
    } catch (err: any) {
      console.error('Error saving document:', err);
      showToast.error('Lỗi', err.message || 'Không thể lưu điều khoản');
    }
  };

  // Stats
  const stats = [
    { label: 'Tổng số', value: documents.length, color: 'gray' as const, icon: FileText },
    { label: 'Published', value: documents.filter((d) => d.status === 'published').length, color: 'green' as const, icon: FileText },
    { label: 'Draft', value: documents.filter((d) => d.status === 'draft').length, color: 'gray' as const, icon: FileText },
    { label: 'Archived', value: documents.filter((d) => d.status === 'archived').length, color: 'orange' as const, icon: Archive },
  ];

  if (loading) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageLayout
        icon={FileText}
        title="Điều khoản sử dụng"
        description="Quản lý các điều khoản, chính sách pháp lý"
        actions={
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        }
      >
        {/* Stats */}
        <StatisticsCards stats={stats} columns={4} />

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="terms_of_service">Terms of Service</option>
                <option value="privacy_policy">Privacy Policy</option>
                <option value="cookie_policy">Cookie Policy</option>
                <option value="gdpr">GDPR</option>
                <option value="eula">EULA</option>
                <option value="sla">SLA</option>
                <option value="dpa">DPA</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tiêu đề</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ngày HL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                          ? 'Không tìm thấy kết quả'
                          : 'Chưa có điều khoản nào'}
                      </p>
                      {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                        <Button onClick={handleAdd} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Thêm điều khoản đầu tiên
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{doc.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getTypeColor(doc.type)}>
                          {getTypeLabel(doc.type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">{doc.version}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">{formatDate(doc.effective_date)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Eye className="w-4 h-4 text-gray-400" />
                          {doc.view_count}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublish(doc)}
                              className="text-green-600 hover:text-green-700"
                              title="Publish"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          )}
                          {doc.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(doc)}
                              className="text-orange-600 hover:text-orange-700"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(doc)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc._id}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal */}
        <LegalDocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDoc(undefined);
          }}
          onSubmit={handleSubmit}
          editData={editingDoc}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
          confirmLabel="Xác nhận"
          cancelLabel="Hủy"
        />
      </PageLayout>
    </Fragment>
  );
}
