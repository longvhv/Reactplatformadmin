/**
 * Subscription Invoices Page
 * Display and manage subscription invoices
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, RefreshCw, Receipt, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, FileText, List, Grid } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice, InvoiceStatistics } from '@/api/subscriptionInvoiceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export const SubscriptionInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
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
      showToast.error(t('invoices.errors.loadFailed'));
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
      title: t('invoices.confirmDeleteTitle'),
      description: t('invoices.confirmDeleteMessage'),
      onConfirm: async () => {
        try {
          await subscriptionInvoiceApi.softDelete(id, 'current-user');
          showToast.success(t('invoices.deleteSuccess'));
          loadInvoices();
          loadStatistics();
        } catch (error) {
          console.error('Error deleting invoice:', error);
          showToast.error(t('invoices.errors.deleteFailed'));
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
      showToast.success(t('invoices.statusUpdateSuccess'));
      loadInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error(t('invoices.errors.updateFailed'));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <PageLayout
      title={t('invoices.title')}
      description={t('invoices.subtitle')}
      icon={FileText}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Button onClick={() => navigate('/commerce/subscription-invoices/add')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('invoices.addInvoice')}
          </Button>
        </div>
      }
    >
      {statistics && (
        <StatisticsCards
          stats={[
            {
              title: t('invoices.stats.total'),
              value: statistics.total,
              currency: formatCurrency(statistics.total_amount, 'VND'),
              icon: Receipt,
              color: 'gray'
            },
            {
              title: t('invoices.stats.paid'),
              value: statistics.paid,
              currency: formatCurrency(statistics.paid_amount, 'VND'),
              icon: CheckCircle,
              color: 'green'
            },
            {
              title: 'Open',
              value: statistics.open,
              currency: formatCurrency(statistics.outstanding_amount, 'VND'),
              icon: Clock,
              color: 'blue'
            },
            {
              title: t('invoices.stats.overdue'),
              value: statistics.overdue,
              icon: AlertCircle,
              color: 'red'
            },
            {
              title: 'Amount Due',
              value: formatCurrency(statistics.amount_due, 'VND'),
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
                  placeholder={t('invoices.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('invoices.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="draft">{t('invoices.status.draft')}</SelectItem>
                <SelectItem value="sent">{t('invoices.status.sent')}</SelectItem>
                <SelectItem value="paid">{t('invoices.status.paid')}</SelectItem>
                <SelectItem value="overdue">{t('invoices.status.overdue')}</SelectItem>
                <SelectItem value="cancelled">{t('invoices.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('invoices.filterByPayment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="unpaid">{t('invoices.paymentStatus.unpaid')}</SelectItem>
                <SelectItem value="paid">{t('invoices.paymentStatus.paid')}</SelectItem>
                <SelectItem value="partially_paid">{t('invoices.paymentStatus.partiallyPaid')}</SelectItem>
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
              <p className="text-gray-500">{t('invoices.noInvoices')}</p>
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
    </PageLayout>
  );
};

export default SubscriptionInvoicesPage;