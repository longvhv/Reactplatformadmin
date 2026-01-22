/**
 * TenantDomainsTab Component
 * Manages domain verification and policies for a tenant
 * Design inspired by Stripe/GitHub/Vercel domain management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider'; // Adjusted import path
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  Edit,
} from 'lucide-react';
import {
  tenantDomainsApi,
  TenantDomain,
  DomainPolicy,
  VerificationStatus,
  CreateDomainRequest,
  UpdateDomainRequest
} from '../../api/tenantDomainsApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TenantDomainModal } from './TenantDomainModal';
import { toast } from 'sonner';

interface TenantDomainsTabProps {
  tenantId: string;
}

export const TenantDomainsTab: React.FC<TenantDomainsTabProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<TenantDomain | null>(null);

  // Load domains
  const loadDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantDomainsApi.getByTenant(tenantId);
      setDomains(data);
    } catch (err) {
      setError('Không thể tải danh sách tên miền');
      console.error('Error loading domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadDomains();
    }
  }, [tenantId]);

  // Handle create/edit
  const handleSave = async (data: CreateDomainRequest | UpdateDomainRequest) => {
    try {
      if (selectedDomain) {
        // Edit
        await tenantDomainsApi.update(selectedDomain._id, data as UpdateDomainRequest);
        toast.success('Cập nhật tên miền thành công');
      } else {
        // Create
        await tenantDomainsApi.create(data as CreateDomainRequest);
        toast.success('Thêm tên miền thành công');
      }
      loadDomains();
    } catch (error: any) {
      throw error; // Let modal handle error display
    }
  };

  // Handle delete
  const handleDelete = async (id: string, domain: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tên miền ${domain}?`)) return;

    try {
      await tenantDomainsApi.delete(id);
      toast.success('Đã xóa tên miền');
      loadDomains();
    } catch (err) {
      toast.error('Lỗi khi xóa tn miền');
      console.error('Error deleting domain:', err);
    }
  };

  // Handle verify trigger
  const handleVerifyCheck = async (id: string) => {
    try {
      const result = await tenantDomainsApi.verifyDomain(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
      loadDomains();
    } catch (err) {
      toast.error('Lỗi khi kiểm tra xác thực');
      console.error('Error verifying domain:', err);
    }
  };

  // Handle mark as verified (admin/debug action - usually hidden in prod)
  const handleMarkVerified = async (id: string) => {
    if (!confirm('Hành động này sẽ đánh dấu tên miền là ĐÃ XÁC MINH thủ công. Tiếp tục?')) return;

    try {
      await tenantDomainsApi.markAsVerified(id);
      toast.success('Đã đánh dấu xác minh thủ công');
      loadDomains();
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
      console.error('Error marking as verified:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quản lý Tên miền</h2>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập tên miền riêng và chính sách bảo mật cho tenant
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedDomain(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm Tên miền
        </Button>
      </div>

      {/* Stats */}
      {domains.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-2">
                <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng tên miền</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{domains.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Đã xác minh</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {domains.filter(d => d.verification_status === 'VERIFIED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chờ xác minh</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {domains.filter(d => d.verification_status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      {domains.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tên miền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chính sách
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {domains.map((domain) => (
                  <tr key={domain._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {domain.verification_status === 'VERIFIED' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {domain.verification_method === 'DNS_TXT' ? 'DNS TXT' : 'HTML File'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        domain.policy === 'NONE' 
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' 
                          : domain.policy === 'CAPTURE'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {domain.policy}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(domain.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {domain.verification_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerifyCheck(domain._id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Kiểm tra xác thực"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMarkVerified(domain._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Đánh dấu đã xác thực (Thủ công)"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDomain(domain);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Chỉnh sửa / Xem hướng dẫn"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(domain._id, domain.domain)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa tên miền"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có tên miền nào được định nghĩa</p>
          <Button onClick={() => {
            setSelectedDomain(null);
            setIsModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm tên miền đầu tiên
          </Button>
        </div>
      )}

      {/* Modal */}
      <TenantDomainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        domain={selectedDomain}
        tenantId={tenantId}
      />
    </div>
  );
};

export default TenantDomainsTab;