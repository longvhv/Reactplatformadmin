/**
 * UserConsentsTab Component
 * Tab hiển thị các điều khoản user đã chấp nhận
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Check,
  X,
  AlertCircle,
  Calendar,
  Globe,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
} from 'lucide-react';
import { useUserConsents } from '../../hooks/useUserConsents';
import { UserConsent } from '../../api/userConsentsApi';

interface UserConsentsTabProps {
  userId: string;
}

export function UserConsentsTab({ userId }: UserConsentsTabProps) {
  const { consents, loading, withdrawConsent, renewConsent, deleteConsent, getUserStats } = useUserConsents({
    user_id: userId,
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withdrawn: 0,
    requiresRenewal: 0,
    expiringSoon: 0,
  });

  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      const userStats = await getUserStats(userId);
      setStats(userStats);
    };
    loadStats();
  }, [userId, consents, getUserStats]);

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get type badge
  const getTypeBadge = (type?: string) => {
    if (!type) return null;
    
    const colors: Record<string, string> = {
      terms_of_service: 'bg-blue-50 text-blue-700 border-blue-200',
      privacy_policy: 'bg-purple-50 text-purple-700 border-purple-200',
      cookie_policy: 'bg-orange-50 text-orange-700 border-orange-200',
      gdpr: 'bg-green-50 text-green-700 border-green-200',
      eula: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      sla: 'bg-pink-50 text-pink-700 border-pink-200',
      dpa: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    const labels: Record<string, string> = {
      terms_of_service: 'ToS',
      privacy_policy: 'Privacy',
      cookie_policy: 'Cookie',
      gdpr: 'GDPR',
      eula: 'EULA',
      sla: 'SLA',
      dpa: 'DPA',
      other: 'Other',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[type] || colors.other}`}>
        {labels[type] || type}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (consent: UserConsent) => {
    if (consent.withdrawn) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <X className="w-3 h-3" />
          Withdrawn
        </span>
      );
    }

    if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          <AlertCircle className="w-3 h-3" />
          Expired
        </span>
      );
    }

    if (consent.consent_given) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Check className="w-3 h-3" />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Pending
      </span>
    );
  };

  // Check if expiring soon
  const isExpiringSoon = (consent: UserConsent) => {
    if (!consent.expires_at) return false;
    const expiryDate = new Date(consent.expires_at);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate > now && expiryDate < thirtyDaysFromNow;
  };

  // Handle withdraw
  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn thu hồi sự chấp nhận này?')) return;

    setWithdrawingId(id);
    try {
      await withdrawConsent(id, {
        withdrawn_reason: 'User requested withdrawal',
      });
    } catch (err) {
      console.error('Error withdrawing consent:', err);
      alert('Failed to withdraw consent');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Handle renew
  const handleRenew = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn gia hạn sự chấp nhận này?')) return;

    setRenewingId(id);
    try {
      await renewConsent(id);
    } catch (err) {
      console.error('Error renewing consent:', err);
      alert('Failed to renew consent');
    } finally {
      setRenewingId(null);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi này?')) return;

    setDeletingId(id);
    try {
      await deleteConsent(id);
    } catch (err) {
      console.error('Error deleting consent:', err);
      alert('Failed to delete consent');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Tổng số</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Đã thu hồi</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.withdrawn}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Cần gia hạn</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.requiresRenewal}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Sắp hết hạn</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Consents List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {consents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Người dùng chưa chấp nhận điều khoản nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tài liệu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phiên bản</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày chấp nhận</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương thức</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hết hạn</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {consents.map((consent) => (
                  <tr
                    key={consent._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      consent.withdrawn ? 'bg-red-50' : isExpiringSoon(consent) ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {consent.legal_document?.title || consent.document_title}
                        </span>
                        {consent.legal_document?.slug && (
                          <span className="text-xs text-gray-500">{consent.legal_document.slug}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getTypeBadge(consent.legal_document?.type || consent.document_type)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {consent.legal_document?.version || consent.document_version}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(consent)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(consent.consent_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 capitalize">
                        {consent.consent_method || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {consent.expires_at ? (
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDate(consent.expires_at)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {consent.withdrawn ? (
                          <button
                            onClick={() => handleRenew(consent._id)}
                            disabled={renewingId === consent._id}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Renew"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleWithdraw(consent._id)}
                            disabled={withdrawingId === consent._id}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                            title="Withdraw"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(consent._id)}
                          disabled={deletingId === consent._id}
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
        )}
      </div>

      {/* Additional Info */}
      {consents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Thông tin về Consents:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Các consents được snapshot tại thời điểm user chấp nhận</li>
                <li>Withdrawn consents có thể được renew lại</li>
                <li>Consents có thể có ngày hết hạn hoặc yêu cầu gia hạn định kỳ</li>
                <li>Mỗi user chỉ có thể có 1 consent cho mỗi document</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserConsentsTab;
