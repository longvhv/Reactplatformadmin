/**
 * SaaS Product Types Page
 * Production-ready with stats, filters, and full CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  saasProductTypesApi,
  SaasProductType,
  useSaasProductTypeStats,
  normalizeCode,
  validateCode,
  useCodeChecker,
} from '../api/saasProductTypesApi';
import { useSaasProductTypes } from '../hooks/useSaasProductTypes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Plus,
  Search,
  Filter,
  Package,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function SaasProductTypesPage() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh: refreshStats } = useSaasProductTypeStats();

  const [productTypes, setProductTypes] = useState<SaasProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductType, setEditingProductType] = useState<SaasProductType | null>(null);

  useEffect(() => {
    loadProductTypes();
  }, [activeFilter]);

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (activeFilter !== 'all') filters.is_active = activeFilter === 'active';

      const data = await saasProductTypesApi.getAll(filters);
      setProductTypes(data);
    } catch (error: any) {
      toast.error('Failed to load product types: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete product type "${code}"?`)) return;

    try {
      await saasProductTypesApi.delete(id);
      toast.success(`Deleted "${code}"`);
      loadProductTypes();
      refreshStats();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleToggleActive = async (productType: SaasProductType) => {
    try {
      if (productType.is_active) {
        await saasProductTypesApi.deactivate(productType._id);
        toast.success(`Deactivated "${productType.code}"`);
      } else {
        await saasProductTypesApi.activate(productType._id);
        toast.success(`Activated "${productType.code}"`);
      }
      loadProductTypes();
      refreshStats();
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  };

  // Filter by search
  const filteredProductTypes = productTypes.filter(pt => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      pt.code.toLowerCase().includes(query) ||
      pt.name.toLowerCase().includes(query) ||
      pt.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SaaS Product Types</h1>
            <p className="text-gray-600 mt-1">Manage product type categories</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product Type
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-indigo-600 mr-3" />
                  <div className="text-3xl font-bold">{stats.total}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <div className="text-3xl font-bold text-green-600">{stats.active}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-gray-400 mr-3" />
                  <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">New (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                  <div className="text-3xl font-bold text-blue-600">{stats.recently_created}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Updated (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-purple-600 mr-3" />
                  <div className="text-3xl font-bold text-purple-600">{stats.recently_updated}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by code or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Active Filter */}
              <div className="flex gap-2">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('all')}
                  className={activeFilter === 'all' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  All
                </Button>
                <Button
                  variant={activeFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('active')}
                  className={activeFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Active
                </Button>
                <Button
                  variant={activeFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setActiveFilter('inactive')}
                  className={activeFilter === 'inactive' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                >
                  Inactive
                </Button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                onClick={() => {
                  loadProductTypes();
                  refreshStats();
                }}
                disabled={loading || statsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Types List */}
        <Card>
          <CardHeader>
            <CardTitle>Product Types ({filteredProductTypes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredProductTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {search ? 'No product types found matching your search' : 'No product types yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProductTypes.map((pt) => (
                      <tr key={pt._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <code className="px-2 py-1 bg-gray-100 text-indigo-600 rounded text-sm font-mono">
                            {pt.code}
                          </code>
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">{pt.name}</td>
                        <td className="px-4 py-4 text-gray-600 max-w-md truncate">
                          {pt.description || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            className={
                              pt.is_active
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {pt.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(pt.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(pt)}
                              title={pt.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {pt.is_active ? (
                                <XCircle className="w-4 h-4 text-gray-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProductType(pt);
                                setShowEditModal(true);
                              }}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-indigo-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(pt._id, pt.code)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateProductTypeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              loadProductTypes();
              refreshStats();
              setShowCreateModal(false);
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && editingProductType && (
          <EditProductTypeModal
            productType={editingProductType}
            onClose={() => {
              setShowEditModal(false);
              setEditingProductType(null);
            }}
            onSuccess={() => {
              loadProductTypes();
              refreshStats();
              setShowEditModal(false);
              setEditingProductType(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Modal Component
function CreateProductTypeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { exists, checking } = useCodeChecker(code);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const normalizedCode = normalizeCode(code);
    
    if (!validateCode(normalizedCode)) {
      toast.error('Code must contain only uppercase letters, numbers, and underscores');
      return;
    }

    if (exists) {
      toast.error('This code already exists');
      return;
    }

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      await saasProductTypesApi.create({
        code: normalizedCode,
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
      });
      toast.success('Product type created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create Product Type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., SAAS_BASIC, ENTERPRISE_PLAN"
              required
              className={exists ? 'border-red-500' : ''}
            />
            {checking && <p className="text-sm text-gray-500 mt-1">Checking...</p>}
            {exists && <p className="text-sm text-red-500 mt-1">This code already exists</p>}
            {code && !exists && !checking && (
              <p className="text-sm text-green-600 mt-1">Code is available</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Uppercase letters, numbers, and underscores only
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Basic SaaS Plan"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || exists || checking}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditProductTypeModal({
  productType,
  onClose,
  onSuccess,
}: {
  productType: SaasProductType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(productType.name);
  const [description, setDescription] = useState(productType.description || '');
  const [isActive, setIsActive] = useState(productType.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      await saasProductTypesApi.update(productType._id, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
        version: productType.version,
      });
      toast.success('Product type updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Product Type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <Input type="text" value={productType.code} disabled className="bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="edit_is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
