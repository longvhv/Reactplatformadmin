/**
 * Subscription Invoices List Page
 * Main page for viewing and managing invoices
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, RefreshCw, Grid, List } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice, InvoiceFilters, InvoiceStatistics } from '../api/subscriptionInvoiceApi';
import { InvoiceTable } from '../components/invoices/InvoiceTable';
import { InvoiceCard } from '../components/invoices/InvoiceCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

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
      toast.error(t('invoices.errors.loadFailed'));
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
      filtered = filtered.filter(inv => 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(inv => inv.payment_status === paymentFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('invoices.confirmDeleteMessage'))) return;
    
    try {
      await subscriptionInvoiceApi.softDelete(id, 'current-user');
      toast.success(t('invoices.deleteSuccess'));
      loadInvoices();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(t('invoices.errors.deleteFailed'));
    }
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      const invoice = invoices.find(i => i._id === id);
      if (!invoice) return;
      
      await subscriptionInvoiceApi.changeStatus(id, newStatus, invoice.version || 1);
      toast.success(t('invoices.statusUpdateSuccess'));
      loadInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('invoices.errors.updateFailed'));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('invoices.title')}</h1>
          <p className="text-gray-500 mt-1">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Button onClick={() => navigate('/core/subscription-invoices/add')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('invoices.addInvoice')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t('invoices.stats.total')}</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t('invoices.stats.paid')}</div>
              <div className="text-2xl font-bold text-green-600">{statistics.paid}</div>
              <div className="text-xs text-gray-500">
                {formatCurrency(statistics.paid_amount, 'USD')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t('invoices.stats.overdue')}</div>
              <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">{t('invoices.stats.outstanding')}</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(statistics.outstanding_amount, 'USD')}
              </div>
            </CardContent>
          </Card>
        </div>
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
    </div>
  );
};

export default SubscriptionInvoicesPage;