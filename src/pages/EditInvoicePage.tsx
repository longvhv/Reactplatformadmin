/**
 * Edit Invoice Page
 * Form to update existing subscription invoice with optimistic locking
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    status: 'DRAFT' as const,
    due_date: '',
    paid_at: '',
    version: 1,
  });

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoadingInvoice(true);
      const data = await subscriptionInvoiceApi.getById(invoiceId);
      setInvoice(data);
      setFormData({
        amount: data.amount,
        status: data.status,
        due_date: data.due_date.split('T')[0],
        paid_at: data.paid_at ? data.paid_at.split('T')[0] : '',
        version: data.version,
      });
    } catch (error: any) {
      toast.error('Không thể tải hóa đơn: ' + error.message);
      navigate('/core/subscription-invoices');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      setLoading(true);
      await subscriptionInvoiceApi.update(id, {
        amount: formData.amount,
        status: formData.status,
        due_date: formData.due_date,
        paid_at: formData.paid_at || undefined,
        version: formData.version,
      });
      toast.success('Cập nhật hóa đơn thành công!');
      navigate('/core/subscription-invoices');
    } catch (error: any) {
      if (error.message.includes('Version conflict') || error.message.includes('409')) {
        toast.error('Hóa đơn đã được cập nhật bởi người khác. Vui lòng tải lại trang.');
        if (id) loadInvoice(id);
      } else {
        toast.error('Không thể cập nhật hóa đơn: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/core/subscription-invoices')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chỉnh sửa hóa đơn</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {invoice.invoice_number} • Version: v{invoice.version}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Optimistic Locking Warning */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Optimistic Locking</p>
                <p>
                  Hóa đơn này sử dụng <strong>version control</strong> (hiện tại: v{invoice.version}). 
                  Nếu người khác đã cập nhật hóa đơn, bạn sẽ nhận được thông báo lỗi và cần tải lại trang.
                </p>
              </div>
            </div>
          </div>

          {/* Read-only Info */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin cố định (không thể sửa)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Invoice ID:</span>
                <p className="font-mono text-gray-900 dark:text-white mt-1">{invoice._id}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Mã hóa đơn:</span>
                <p className="font-mono text-gray-900 dark:text-white mt-1">{invoice.invoice_number}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tenant:</span>
                <p className="text-gray-900 dark:text-white mt-1">{invoice.tenant_name || invoice.tenant_id}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Subscription:</span>
                <p className="text-gray-900 dark:text-white mt-1">{invoice.subscription_code || invoice.subscription_id}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Chu kỳ thanh toán:</span>
                <p className="font-mono text-xs text-gray-900 dark:text-white mt-1">
                  {new Date(invoice.billing_period_start).toLocaleDateString('vi-VN')} - {new Date(invoice.billing_period_end).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tiền tệ:</span>
                <p className="font-mono text-gray-900 dark:text-white mt-1">{invoice.currency_code}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin có thể chỉnh sửa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="DRAFT">DRAFT - Nháp</option>
                  <option value="OPEN">OPEN - Mở</option>
                  <option value="PAID">PAID - Đã thanh toán</option>
                  <option value="VOID">VOID - Đã hủy</option>
                  <option value="UNCOLLECTIBLE">UNCOLLECTIBLE - Không thu được</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tổng tiền</label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hiển thị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: invoice.currency_code || 'VND' }).format(formData.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hạn thanh toán</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày thanh toán (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.paid_at}
                  onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Điền khi status = PAID</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/core/subscription-invoices')}>Hủy</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>

          <input type="hidden" value={formData.version} />
          <p className="text-xs text-gray-500 text-center">
            Current version: v{invoice.version} • Updating to: v{invoice.version + 1}
          </p>
        </form>
      </div>
    </div>
  );
}