/**
 * Location Types Management Page
 * Manages location type definitions with extra fields
 * ✅ MIGRATED: Fixed confirm → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional list page
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  Settings,
  Tag,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useLocationTypes } from '../hooks/useLocationTypes';
import { LocationTypeFormDialog } from '../components/locationTypes/LocationTypeFormDialog';
import { LocationType } from '../api/locationTypesApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { showToast } from '../lib/toast';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageLayout } from '../components/layout/PageLayout';

export function LocationTypesPage() {
  const navigate = useNavigate();
  const {
    locationTypes,
    loading,
    error,
    createLocationType,
    updateLocationType,
    deleteLocationType,
    toggleActive,
    getStats,
  } = useLocationTypes();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<LocationType | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSystem, setFilterSystem] = useState<'all' | 'system' | 'custom'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<LocationType | null>(null);

  // Get current tenant (TODO: Replace with actual tenant from context)
  const currentTenantId = 'tenant-1'; // Replace with actual tenant

  // Filter location types
  const filteredTypes = useMemo(() => {
    return locationTypes.filter(type => {
      const matchesSearch =
        type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesActive =
        filterActive === 'all' ||
        (filterActive === 'active' && type.is_active) ||
        (filterActive === 'inactive' && !type.is_active);

      const matchesSystem =
        filterSystem === 'all' ||
        (filterSystem === 'system' && type.is_system) ||
        (filterSystem === 'custom' && !type.is_system);

      return matchesSearch && matchesActive && matchesSystem;
    });
  }, [locationTypes, searchTerm, filterActive, filterSystem]);

  // Stats
  const stats = getStats();

  // Handlers
  const handleAdd = () => {
    setEditingType(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (type: LocationType) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async (type: LocationType) => {
    if (type.is_system) {
      showToast.error('Lỗi', 'Cannot delete system location type');
      return;
    }

    setDeletingId(type._id);
    try {
      await deleteLocationType(type._id);
      showToast.success('Thành công', 'Location type deleted successfully');
    } catch (err: any) {
      showToast.error('Lỗi', err.message || 'Failed to delete location type');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setTypeToDelete(null);
    }
  };

  const handleToggleActive = async (type: LocationType) => {
    try {
      await toggleActive(type._id, type.version);
      showToast.success('Thành công', `Location type ${type.is_active ? 'deactivated' : 'activated'}`);
    } catch (err: any) {
      showToast.error('Lỗi', err.message || 'Failed to toggle status');
    }
  };

  const handleFormSubmit = async (data: any, id?: string) => {
    try {
      if (id) {
        await updateLocationType(id, data);
        showToast.success('Thành công', 'Location type updated successfully');
      } else {
        await createLocationType(data);
        showToast.success('Thành công', 'Location type created successfully');
      }
      setIsFormOpen(false);
    } catch (err: any) {
      throw err; // Let form handle the error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading location types...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      icon={MapPin}
      title="Location Types"
      description="Manage location type definitions and custom fields"
      actions={
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Location Type
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">{stats.inactive}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">System</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{stats.system}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Custom</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{stats.custom}</p>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, name..."
              className="pl-10"
            />
          </div>

          {/* Active Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white dark:bg-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* System Filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value as any)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white dark:bg-gray-900"
            >
              <option value="all">All Types</option>
              <option value="system">System Only</option>
              <option value="custom">Custom Only</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extra Fields
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm || filterActive !== 'all' || filterSystem !== 'all'
                        ? 'No location types match your filters'
                        : 'No location types yet'}
                    </p>
                    {!searchTerm && filterActive === 'all' && filterSystem === 'all' && (
                      <Button
                        onClick={handleAdd}
                        size="sm"
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add First Location Type
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr
                    key={type._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {type.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {type.name}
                        </div>
                        {type.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {type.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Extra Fields Count */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Settings className="w-4 h-4" />
                        <span>{type.extra_fields.length} fields</span>
                      </div>
                    </td>

                    {/* System/Custom Badge */}
                    <td className="px-4 py-3">
                      {type.is_system ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          System
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          Custom
                        </Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(type)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          type.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {type.is_active ? (
                          <>
                            <Power className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(type)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!type.is_system && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setTypeToDelete(type);
                              setShowDeleteDialog(true);
                            }}
                            disabled={deletingId === type._id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results Count */}
        {filteredTypes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing {filteredTypes.length} of {locationTypes.length} location types
            </p>
          </div>
        )}
      </Card>

      {/* Form Dialog */}
      <LocationTypeFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editData={editingType}
        tenantId={currentTenantId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          if (typeToDelete) {
            handleDelete(typeToDelete);
          }
        }}
        title="Xác nhận xóa location type"
        description={`Bạn có chắc chắn muốn xóa location type "${typeToDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </PageLayout>
  );
}

export default LocationTypesPage;