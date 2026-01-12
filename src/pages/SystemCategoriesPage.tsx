/**
 * System Categories Management Page
 * 3-Level Hierarchy: Group -> Type -> Category
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import {
  systemCategoryApi,
  SystemCategoryGroup,
  SystemCategoryType,
  CategoryInstance,
  CategoryStatusHelper,
} from '../api/systemCategoryApi';
import { Button } from '../components/ui/button';
import { Plus, Layers, FolderTree, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CategoryGroupSelector } from '../components/systemCategories/CategoryGroupSelector';
import { CategoryTypeSelector } from '../components/systemCategories/CategoryTypeSelector';
import { CategoryTable } from '../components/systemCategories/CategoryTable';
import { CategoryFormDialog } from '../components/systemCategories/CategoryFormDialog';

export function SystemCategoriesPage() {
  const { t } = useLanguage();
  
  // State for 3-level selection
  const [selectedGroup, setSelectedGroup] = useState<SystemCategoryGroup | null>(null);
  const [selectedType, setSelectedType] = useState<SystemCategoryType | null>(null);
  
  // Data state
  const [groups, setGroups] = useState<SystemCategoryGroup[]>([]);
  const [types, setTypes] = useState<SystemCategoryType[]>([]);
  const [categories, setCategories] = useState<CategoryInstance[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInstance | null>(null);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load types when group changes
  useEffect(() => {
    if (selectedGroup) {
      loadTypes(selectedGroup.code);
      setSelectedType(null);
      setCategories([]);
    } else {
      setTypes([]);
      setSelectedType(null);
      setCategories([]);
    }
  }, [selectedGroup]);

  // Load categories when type changes
  useEffect(() => {
    if (selectedType) {
      loadCategories(selectedType.code);
    } else {
      setCategories([]);
    }
  }, [selectedType]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await systemCategoryApi.getActiveGroups();
      setGroups(data);
      
      // Auto-select first group if available
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    } catch (error: any) {
      toast.error('Không thể tải nhóm danh mục: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async (groupCode: string) => {
    try {
      setLoading(true);
      const data = await systemCategoryApi.getTypesByGroup(groupCode);
      setTypes(data);
      
      // Auto-select first type if available
      if (data.length > 0) {
        setSelectedType(data[0]);
      }
    } catch (error: any) {
      toast.error('Không thể tải loại danh mục: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (typeCode: string) => {
    try {
      setLoading(true);
      const data = await systemCategoryApi.getCategoriesByType(typeCode);
      setCategories(data);
    } catch (error: any) {
      toast.error('Không thể tải danh mục: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!selectedType) {
      toast.error('Vui lòng chọn loại danh mục trước');
      return;
    }
    setEditingCategory(null);
    setShowFormDialog(true);
  };

  const handleEditCategory = (category: CategoryInstance) => {
    setEditingCategory(category);
    setShowFormDialog(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      await systemCategoryApi.hardDelete(id);
      toast.success('Đã xóa danh mục');
      if (selectedType) {
        loadCategories(selectedType.code);
      }
    } catch (error: any) {
      toast.error('Không thể xóa danh mục: ' + error.message);
    }
  };

  const handleToggleStatus = async (category: CategoryInstance) => {
    try {
      const newStatus = CategoryStatusHelper.isActive(category.status)
        ? CategoryStatusHelper.INACTIVE
        : CategoryStatusHelper.ACTIVE;
      
      await systemCategoryApi.update(category.id!, { status: newStatus });
      toast.success('Đã cập nhật trạng thái');
      
      if (selectedType) {
        loadCategories(selectedType.code);
      }
    } catch (error: any) {
      toast.error('Không thể cập nhật trạng thái: ' + error.message);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await systemCategoryApi.update(editingCategory.id!, data);
        toast.success('Đã cập nhật danh mục');
      } else {
        // Create new category with type from selected type
        await systemCategoryApi.create({
          ...data,
          type: selectedType!.code,
          groupCategoryId: selectedGroup!.code,
        });
        toast.success('Đã tạo danh mục mới');
      }
      
      setShowFormDialog(false);
      setEditingCategory(null);
      
      if (selectedType) {
        loadCategories(selectedType.code);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quản lý Danh mục Hệ thống
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý cấu trúc danh mục 3 cấp: Nhóm → Loại → Danh mục
          </p>
        </div>
      </div>

      {/* Level Selectors Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Level 1: Group Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Cấp 1: Nhóm danh mục
            </h3>
          </div>
          <CategoryGroupSelector
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            loading={loading}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Level 2: Type Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Cấp 2: Loại danh mục
            </h3>
            {selectedType && (
              <span className="text-xs text-gray-500">
                {categories.length} danh mục
              </span>
            )}
          </div>
          <CategoryTypeSelector
            types={types}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            loading={loading}
            disabled={!selectedGroup}
          />
        </div>

        {/* Selected Type Info & Add Button */}
        {selectedType && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedType.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedType.description}
                    </p>
                  </div>
                  {selectedType.extra_fields && selectedType.extra_fields.length > 0 && (
                    <div className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                      {selectedType.extra_fields.length} trường bổ sung
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleAddCategory}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm danh mục
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Level 3: Category Table */}
      {selectedType && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Cấp 3: Danh mục
            </h3>
          </div>
          <CategoryTable
            categories={categories}
            categoryType={selectedType}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            onToggleStatus={handleToggleStatus}
            loading={loading}
          />
        </div>
      )}

      {/* Form Dialog */}
      {showFormDialog && (
        <CategoryFormDialog
          category={editingCategory}
          categoryType={selectedType!}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowFormDialog(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

export default SystemCategoriesPage;