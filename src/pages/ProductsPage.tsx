/**
 * Products List Page - Aligned with Database Schema
 * Display and manage all SaaS products
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { productsApi, Product, ProductFilters } from '../api/productsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ProductTable } from '../components/products/ProductTable';
import { ProductCard } from '../components/products/ProductCard';
import { PageLayout } from '../components/layout/PageLayout';
import { StatisticsCards } from '../components/common/StatisticsCards';
import { Plus, Search, Grid, List, Package, CheckCircle, XCircle } from 'lucide-react';
import { showToast } from '../lib/toast';
import { useLanguage } from '../providers/LanguageProvider';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({});

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
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll(filters);
      setProducts(data);
    } catch (error: any) {
      showToast.error(t('products.loadError'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setFilters({ ...filters, search: searchTerm });
    } else {
      const { search, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/commerce/products/edit/${product._id}`);
  };

  const handleDelete = async (product: Product) => {
    setConfirmDialog({
      open: true,
      title: t('products.confirmDelete'),
      description: t('products.confirmDeleteMessage', { name: product.name }),
      onConfirm: async () => {
        try {
          await productsApi.delete(product._id!);
          showToast.success(t('products.deleteSuccess'), 'Đã xóa sản phẩm');
          loadProducts();
        } catch (error: any) {
          showToast.error(t('products.deleteError'), error.message);
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
      variant: 'destructive',
    });
  };

  const handleViewDetails = (product: Product) => {
    console.log('[ProductsPage] Navigate to product:', product._id, product);
    if (!product._id) {
      showToast.error('Lỗi', 'ID sản phẩm không hợp lệ');
      return;
    }
    navigate(`/commerce/products/${product._id}`);
  };

  const filteredProducts = searchTerm
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const stats = [
    {
      label: t('common.total'),
      value: products.length,
      color: 'gray' as const,
      icon: Package,
    },
    {
      label: t('products.active'),
      value: products.filter((p) => p.status === 'ACTIVE').length,
      color: 'green' as const,
      icon: CheckCircle,
    },
    {
      label: t('products.inactive'),
      value: products.filter((p) => p.status === 'INACTIVE').length,
      color: 'red' as const,
      icon: XCircle,
    },
  ];

  if (loading) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageLayout
        icon={Package}
        title={t('products.title')}
        description={t('products.description')}
        actions={
          <Button onClick={() => navigate('/commerce/products/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('products.addNew')}
          </Button>
        }
      >
        {/* Stats */}
        <StatisticsCards stats={stats} />

        {/* Search & View Toggle */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Products List */}
        {viewMode === 'table' ? (
          <ProductTable
            products={filteredProducts}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

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