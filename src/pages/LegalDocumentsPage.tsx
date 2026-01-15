/**
 * LegalDocumentsPage
 * Trang quản lý điều khoản sử dụng
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  Archive,
  Upload,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useLegalDocuments } from '../hooks/useLegalDocuments';
import { LegalDocumentModal } from '../components/legal/LegalDocumentModal';
import { LegalDocument, LegalDocumentType, LegalDocumentStatus } from '../api/legalDocumentsApi';

export function LegalDocumentsPage() {
  const { documents, loading, createDocument, updateDocument, deleteDocument, publishDocument, archiveDocument } =
    useLegalDocuments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LegalDocumentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<LegalDocumentStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      terms_of_service: 'bg-blue-50 text-blue-700 border-blue-200',
      privacy_policy: 'bg-purple-50 text-purple-700 border-purple-200',
      cookie_policy: 'bg-orange-50 text-orange-700 border-orange-200',
      gdpr: 'bg-green-50 text-green-700 border-green-200',
      eula: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      sla: 'bg-pink-50 text-pink-700 border-pink-200',
      dpa: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[type];
  };

  // Get status badge
  const getStatusBadge = (status: LegalDocumentStatus) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-700', label: 'Published' },
      archived: { color: 'bg-orange-100 text-orange-700', label: 'Archived' },
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
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa điều khoản này?')) return;

    setDeletingId(id);
    try {
      await deleteDocument(id);
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle publish
  const handlePublish = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn publish điều khoản này?')) return;

    try {
      await publishDocument(id, 'current-user-id'); // TODO: Get from auth context
    } catch (err) {
      console.error('Error publishing document:', err);
      alert('Failed to publish document');
    }
  };

  // Handle archive
  const handleArchive = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn archive điều khoản này?')) return;

    try {
      await archiveDocument(id, 'current-user-id'); // TODO: Get from auth context
    } catch (err) {
      console.error('Error archiving document:', err);
      alert('Failed to archive document');
    }
  };

  // Handle submit
  const handleSubmit = async (data: any, id?: string) => {
    if (id) {
      await updateDocument(id, data);
    } else {
      await createDocument(data);
    }
  };

  // Stats
  const stats = {
    total: documents.length,
    published: documents.filter((d) => d.status === 'published').length,
    draft: documents.filter((d) => d.status === 'draft').length,
    archived: documents.filter((d) => d.status === 'archived').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Điều khoản sử dụng</h1>
                <p className="text-gray-500 mt-1">Quản lý các điều khoản, chính sách pháp lý</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm mới
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Published</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.published}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Draft</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.draft}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Archived</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.archived}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày HL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                        <span className="text-xs text-gray-500">{doc.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                          doc.type
                        )}`}
                      >
                        {getTypeLabel(doc.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{doc.version}</span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{formatDate(doc.effective_date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {doc.view_count}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(doc._id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Publish"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                        {doc.status === 'published' && (
                          <button
                            onClick={() => handleArchive(doc._id)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(doc)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          disabled={deletingId === doc._id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Không tìm thấy kết quả'
                  : 'Chưa có điều khoản nào'}
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm điều khoản đầu tiên
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <LegalDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editingDoc}
      />
    </div>
  );
}

export default LegalDocumentsPage;
