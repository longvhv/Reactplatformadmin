/**
 * Subscription Invoices Page
 * Display and manage subscription invoices
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 * ✅ FIXED: Import paths corrected to 4 levels (path has 5 slashes)
 * ✅ FIXED 2026-01-22: Removed named export to fix Next.js error
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Plus, Search, RefreshCw, Receipt, DollarSign, Clock, CheckCircle, AlertCircle, FileText, List, Grid } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice, InvoiceStatistics } from '../../../../api/subscriptionInvoiceApi';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { InvoiceTable } from '../../../../components/invoices/InvoiceTable';
import { InvoiceCard } from '../../../../components/invoices/InvoiceCard';
import { useLanguage } from '../../../../providers/LanguageProvider';
import { showToast } from '../../../../lib/toast';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { StatisticsCards } from '../../../../components/common/StatisticsCards';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

export default function SubscriptionInvoicesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<SubscriptionInvoice[]>([]);
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Confirm dialog state
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
    variant: 'default'
  });

  useEffect(() => {
    loadInvoices();
    loadStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchTerm, statusFilter, paymentFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await subscriptionInvoiceApi.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast.error(t('invoices.errors.loadFailed') || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await subscriptionInvoiceApi.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(inv => {
        const customerName = inv.customer_snapshot?.name || '';
        const customerEmail = inv.customer_snapshot?.email || '';
        
        return (
          inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (paymentFilter !== 'all') {
      // Map payment filter to status logic
      if (paymentFilter === 'unpaid') {
        filtered = filtered.filter(inv => inv.amount_due > 0);
      } else if (paymentFilter === 'paid') {
        filtered = filtered.filter(inv => inv.status === 'PAID');
      } else if (paymentFilter === 'partially_paid') {
        filtered = filtered.filter(inv => 
          inv.amount_paid > 0 && inv.amount_due > 0
        );
      }
    }

    setFilteredInvoices(filtered);
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: t('invoices.confirmDeleteTitle') || 'Delete Invoice',
      description: t('invoices.confirmDeleteMessage') || 'Are you sure you want to delete this invoice?',
      onConfirm: async () => {
        try {
          await subscriptionInvoiceApi.softDelete(id, 'current-user');
          showToast.success(t('invoices.deleteSuccess') || 'Invoice deleted');
          loadInvoices();
          loadStatistics();
        } catch (error) {
          console.error('Error deleting invoice:', error);
          showToast.error(t('invoices.errors.deleteFailed') || 'Failed to delete invoice');
        }
      },
      variant: 'destructive'
    });
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      const invoice = invoices.find(i => i._id === id);
      if (!invoice) return;
      
      await subscriptionInvoiceApi.changeStatus(id, newStatus, invoice.version || 1);
      showToast.success(t('invoices.statusUpdateSuccess') || 'Status updated');
      loadInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error(t('invoices.errors.updateFailed') || 'Failed to update status');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <Fragment>
      <PageLayout
        title={t('invoices.title') || 'Subscription Invoices'}
        description={t('invoices.subtitle') || 'Manage subscription invoices'}
        icon={FileText}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadInvoices}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh') || 'Refresh'}
            </Button>
            <Button onClick={() => router.push('/commerce/subscription-invoices/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('invoices.addInvoice') || 'Add Invoice'}
            </Button>
          </div>
        }
      >
        {statistics && (
          <StatisticsCards
            stats={[
              {
                title: t('invoices.stats.total') || 'Total Invoices',
                value: statistics.total,
                description: formatCurrency(statistics.total_amount, 'VND'),
                icon: Receipt,
                color: 'gray'
              },
              {
                title: t('invoices.stats.paid') || 'Paid',
                value: statistics.paid,
                description: formatCurrency(statistics.paid_amount, 'VND'),
                icon: CheckCircle,
                color: 'green'
              },
              {
                title: 'Open',
                value: statistics.open,
                description: formatCurrency(statistics.outstanding_amount, 'VND'),
                icon: Clock,
                color: 'blue'
              },
              {
                title: t('invoices.stats.overdue') || 'Overdue',
                value: statistics.overdue,
                description: 'Overdue Invoices',
                icon: AlertCircle,
                color: 'red'
              },
              {
                title: 'Amount Due',
                value: statistics.amount_due, // Assuming value expects number, and description is the formatted string? Wait, StatisticsCards props might differ.
                // The provided code used currency: ... which is not standard in StatisticsCards usually.
                // Checking usage: { title, value, currency, icon, color }
                // I will use description for now to be safe, or just pass it if the component supports it.
                // The interface usually is { title, value, icon, color, description? }
                // I'll put the formatted currency in description.
                description: formatCurrency(statistics.amount_due, 'VND'),
                icon: DollarSign,
                color: 'orange'
              }
            ]}
          />
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('invoices.searchPlaceholder') || 'Search invoices...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('invoices.filterByStatus') || 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                  <SelectItem value="draft">{t('invoices.status.draft') || 'Draft'}</SelectItem>
                  <SelectItem value="sent">{t('invoices.status.sent') || 'Sent'}</SelectItem>
                  <SelectItem value="paid">{t('invoices.status.paid') || 'Paid'}</SelectItem>
                  <SelectItem value="overdue">{t('invoices.status.overdue') || 'Overdue'}</SelectItem>
                  <SelectItem value="cancelled">{t('invoices.status.cancelled') || 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t('invoices.filterByPayment') || 'Payment'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                  <SelectItem value="unpaid">{t('invoices.paymentStatus.unpaid') || 'Unpaid'}</SelectItem>
                  <SelectItem value="paid">{t('invoices.paymentStatus.paid') || 'Paid'}</SelectItem>
                  <SelectItem value="partially_paid">{t('invoices.paymentStatus.partiallyPaid') || 'Partially Paid'}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        {viewMode === 'table' ? (
          <InvoiceTable
            invoices={filteredInvoices}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">{t('invoices.noInvoices') || 'No invoices found'}</p>
              </div>
            ) : (
              filteredInvoices.map(invoice => (
                <InvoiceCard
                  key={invoice._id}
                  invoice={invoice}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        )}
        
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
        />
      </PageLayout>
    </Fragment>
  );
}