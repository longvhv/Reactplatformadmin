/**
 * Products List Page - Next.js App Router
 * ✅ REFACTORED: Batch 1.1 - Migrated from /pages/ProductsPage.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { productsApi, Product, ProductFilters } from '@/api/productsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductCard } from '@/components/products/ProductCard';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { Plus, Search, Grid, List, Package, CheckCircle, XCircle } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { useLanguage } from '@/providers/LanguageProvider';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

function ProductsPage() {
  const router = useRouter();
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
    router.push(`/commerce/products/edit/${product._id}`);
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
    router.push(`/commerce/products/${product._id}`);
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            >
              {viewMode === 'table' ? (
                <Grid className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={() => router.push('/commerce/products/add')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('products.add')}
            </Button>
          </div>
        }
      >
        <StatisticsCards stats={stats} />

        <Card className="mt-6">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                {t('common.search')}
              </Button>
            </div>

            {viewMode === 'table' ? (
              <ProductTable
                products={filteredProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </PageLayout>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </Fragment>
  );
}

export { ProductsPage };
export default ProductsPage;
