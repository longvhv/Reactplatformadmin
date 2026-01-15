/**
 * Products List Page - Aligned with Database Schema
 * Display and manage all SaaS products (APP, DOMAIN, SSL, SERVICE)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saasProductApi, SaaSProduct, ProductFilters, ProductType } from '../api/saasProductApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProductTable } from '../components/products/ProductTable';
import { ProductCard } from '../components/products/ProductCard';
import { Plus, Search, Grid, List, Package } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [products, setProducts] = useState<SaaSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({});

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

  const handleViewDetails = (product: SaaSProduct) => {
    console.log('[ProductsPage] Navigate to product:', product._id, product);
    if (!product._id) {
      toast.error('ID sản phẩm không hợp lệ');
      return;
    }
    navigate(`/core/products/${product._id}`);
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
          <h1 className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-foreground">
              {t('products.title')}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredProducts.length} {t('products.products')}
          </p>
        </div>
        <Button onClick={() => navigate('/core/products/add')} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {t('products.addProduct')}
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px] flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

          {/* Product Type Filter */}
          <select
            value={filters.product_type || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                product_type: e.target.value ? (e.target.value as ProductType) : undefined,
              })
            }
            className="px-3 py-2 border border-border rounded-md bg-card text-foreground"
          >
            <option value="">{t('products.allTypes')}</option>
            <option value="APP">APP</option>
            <option value="DOMAIN">DOMAIN</option>
            <option value="SSL">SSL</option>
            <option value="SERVICE">SERVICE</option>
          </select>

          {/* Active/Inactive Filter */}
          <select
            value={filters.is_active === undefined ? '' : String(filters.is_active)}
            onChange={(e) =>
              setFilters({
                ...filters,
                is_active: e.target.value ? e.target.value === 'true' : undefined,
              })
            }
            className="px-3 py-2 border border-border rounded-md bg-card text-foreground"
          >
            <option value="">{t('products.allStatuses')}</option>
            <option value="true">{t('products.active')}</option>
            <option value="false">{t('products.inactive')}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 border border-border rounded-md">
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
      <div className="bg-card rounded-lg border border-border">
        {viewMode === 'table' ? (
          <ProductTable
            products={filteredProducts}
            onEdit={(product) => navigate(`/core/products/edit/${product._id}`)}
            onDelete={handleDelete}
            onView={handleViewDetails}
            loading={loading}
          />
        ) : (
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('products.noProductsMessage')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onEdit={(p) => navigate(`/core/products/edit/${p._id}`)}
                    onDelete={handleDelete}
                    onView={handleViewDetails}
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