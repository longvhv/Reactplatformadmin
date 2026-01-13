/**
 * Products List Page
 * Display and manage all SaaS products
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saasProductApi, SaaSProduct, ProductFilters } from '../api/saasProductApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProductTable } from '../components/products/ProductTable';
import { ProductCard } from '../components/products/ProductCard';
import { Plus, Search, Grid, List, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function ProductsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [products, setProducts] = useState<SaaSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    tenant_id: '00000000-0000-0000-0000-000000000001', // Demo tenant
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await saasProductApi.getAll(filters);
      setProducts(data);
    } catch (error: any) {
      toast.error(t('products.loadError', { error: error.message }));
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

  const handleDelete = async (product: SaaSProduct) => {
    if (!confirm(t('products.confirmDeleteTitle', { name: product.name }))) return;

    try {
      await saasProductApi.softDelete(product._id!);
      toast.success(t('products.deleteSuccess'));
      loadProducts();
    } catch (error: any) {
      toast.error(t('products.deleteError', { error: error.message }));
    }
  };

  const handleToggleFeatured = async (product: SaaSProduct) => {
    try {
      await saasProductApi.toggleFeatured(product._id!, product.version!);
      toast.success(product.is_featured ? t('products.toggleUnfeaturedSuccess') : t('products.toggleFeaturedSuccess'));
      loadProducts();
    } catch (error: any) {
      toast.error(t('products.updateError', { error: error.message }));
    }
  };

  const handleDuplicate = async (product: SaaSProduct) => {
    const newCode = prompt(t('products.duplicatePromptCode'), `${product.code}-copy`);
    if (!newCode) return;

    const newName = prompt(t('products.duplicatePromptName'), `${product.name} (Copy)`);
    if (!newName) return;

    try {
      await saasProductApi.duplicate(product._id!, newCode, newName);
      toast.success(t('products.duplicateSuccess'));
      loadProducts();
    } catch (error: any) {
      toast.error(t('products.duplicateError', { error: error.message }));
    }
  };

  const filteredProducts = searchTerm
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('products.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredProducts.length} {t('products.products')}
          </p>
        </div>
        <Button onClick={() => navigate('/core/products/add')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('products.addProduct')}
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value ? (e.target.value as any) : undefined,
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">{t('products.allStatuses')}</option>
            <option value="active">{t('products.active')}</option>
            <option value="inactive">{t('products.inactive')}</option>
            <option value="archived">Archived</option>
          </select>

          {/* Featured Filter */}
          <select
            value={filters.is_featured === undefined ? '' : String(filters.is_featured)}
            onChange={(e) =>
              setFilters({
                ...filters,
                is_featured: e.target.value ? e.target.value === 'true' : undefined,
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">{t('products.allProducts')}</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'table' ? (
          <ProductTable
            products={filteredProducts}
            onEdit={(product) => navigate(`/core/products/edit/${product._id}`)}
            onDelete={handleDelete}
            onView={(product) => navigate(`/core/products/${product._id}`)}
            onDuplicate={handleDuplicate}
            onToggleFeatured={handleToggleFeatured}
            loading={loading}
          />
        ) : (
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">{t('products.noProductsMessage')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onEdit={(p) => navigate(`/core/products/edit/${p._id}`)}
                    onDelete={handleDelete}
                    onView={(p) => navigate(`/core/products/${p._id}`)}
                    onDuplicate={handleDuplicate}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}