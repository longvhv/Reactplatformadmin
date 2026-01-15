/**
 * Invoice Detail Modal
 * ✅ Updated 2026-01-15: Schema migration (line_items→items_snapshot, customer_snapshot→billing_info)
 */

import { X, FileText, Calendar, DollarSign, CreditCard, AlertCircle, Clock, CheckCircle, XCircle, Package, Users, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice, BillingInfo, ItemSnapshot } from '../../api/invoiceApi';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, isOpen, onClose }: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
      case 'OPEN': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PAID': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'VOID': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'UNCOLLECTIBLE': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'OPEN': return <Clock className="w-4 h-4" />;
      case 'PAID': return <CheckCircle className="w-4 h-4" />;
      case 'VOID': return <XCircle className="w-4 h-4" />;
      case 'UNCOLLECTIBLE': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Check if overdue
  const isOverdue = invoice.status === 'OPEN' && new Date(invoice.due_date) < new Date();
  const daysUntilDue = Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Chi tiết Hóa đơn</h2>
              </div>
              <p className="text-indigo-100 text-sm">
                Invoice #{invoice.invoice_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invoice Number & Status */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invoice Number</div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                  {invoice.invoice_number}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  {invoice.status}
                </div>
              </div>
            </div>

            {/* Overdue Warning */}
            {isOverdue && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Overdue: {Math.abs(daysUntilDue)} ngày quá hạn</span>
              </div>
            )}

            {/* Due Date Info */}
            {invoice.status === 'OPEN' && !isOverdue && (
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Còn {daysUntilDue} ngày đến hạn thanh toán</span>
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Billing Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Thông tin khách hàng
                </h3>
                
                <div className="space-y-3">
                  {invoice.billing_info?.customer_name && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tên khách hàng</label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                        {invoice.billing_info.customer_name}
                      </div>
                    </div>
                  )}

                  {invoice.billing_info?.customer_email && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                        {invoice.billing_info.customer_email}
                      </div>
                    </div>
                  )}

                  {invoice.billing_info?.company_name && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Công ty</label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                        {invoice.billing_info.company_name}
                      </div>
                    </div>
                  )}

                  {invoice.billing_info?.tax_id && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mã số thuế</label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                        {invoice.billing_info.tax_id}
                      </div>
                    </div>
                  )}

                  {invoice.billing_info?.address && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Địa chỉ</label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                        {invoice.billing_info.address}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-5 space-y-4 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Chi tiết tài chính
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tạm tính:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.subtotal, invoice.currency_code)}
                    </span>
                  </div>

                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thuế:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.tax_amount, invoice.currency_code)}
                      </span>
                    </div>
                  )}

                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Giảm giá:</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        -{formatCurrency(invoice.discount_amount, invoice.currency_code)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900 dark:text-white">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(invoice.total_amount, invoice.currency_code)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Đã thanh toán:</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(invoice.amount_paid, invoice.currency_code)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Còn lại:</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(invoice.amount_due, invoice.currency_code)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Items Snapshot */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  Chi tiết sản phẩm/dịch vụ
                </h3>
                
                <div className="space-y-3">
                  {invoice.items_snapshot && invoice.items_snapshot.length > 0 ? (
                    invoice.items_snapshot.map((item: ItemSnapshot, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.qty} × {formatCurrency(item.price, invoice.currency_code)}
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(item.total, invoice.currency_code)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">Chưa có sản phẩm/dịch vụ</div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Thời gian
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Chu kỳ thanh toán</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                      {format(new Date(invoice.billing_period_start), 'dd/MM/yyyy')} - {format(new Date(invoice.billing_period_end), 'dd/MM/yyyy')}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hạn thanh toán</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                      {format(new Date(invoice.due_date), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>

                  {invoice.paid_at && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày thanh toán</label>
                      <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded mt-1 font-semibold">
                        {format(new Date(invoice.paid_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày tạo</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                      {format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-indigo-600" />
              Thông tin hệ thống
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Invoice ID</label>
                <div className="text-xs text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-1 truncate">
                  {invoice._id}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Version</label>
                <div className="text-xs text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-1">
                  v{invoice.version}
                </div>
              </div>

              {invoice.subscription_id && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subscription ID</label>
                  <div className="text-xs text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-1 truncate">
                    {invoice.subscription_id}
                  </div>
                </div>
              )}

              {invoice.order_id && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order ID</label>
                  <div className="text-xs text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-1 truncate">
                    {invoice.order_id}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetailModal;
