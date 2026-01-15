/**
 * System Categories Management Page
 * 3-Level Hierarchy: Group -> Type -> Category
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import {
  SystemCategoryGroup,
  SystemCategoryType,
  CategoryInstance,
  CategoryStatusHelper,
} from '../api/systemCategoryApi';
import { Button } from '../components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CategoryGroupSelector } from '../components/systemCategories/CategoryGroupSelector';
import { CategoryTypeSelector } from '../components/systemCategories/CategoryTypeSelector';
import { CategoryTable } from '../components/systemCategories/CategoryTable';
import { CategoryFormDialog } from '../components/systemCategories/CategoryFormDialog';
import { useSystemCategories } from '../hooks/useSystemCategories';

export function SystemCategoriesPage() {
  const { t } = useLanguage();
  const {
    groups,
    loading: hookLoading,
    error: hookError,
    getTypesByGroup,
    getCategoriesByType,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
  } = useSystemCategories();
  
  // State for 3-level selection
  const [selectedGroup, setSelectedGroup] = useState<SystemCategoryGroup | null>(null);
  const [selectedType, setSelectedType] = useState<SystemCategoryType | null>(null);
  
  // Data state
  const [types, setTypes] = useState<SystemCategoryType[]>([]);
  const [categories, setCategories] = useState<CategoryInstance[]>([]);
  
  // UI state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInstance | null>(null);

  // Auto-select first group when groups are loaded
  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups]);

  // Load types when group changes
  useEffect(() => {
    const loadTypes = async () => {
      if (selectedGroup) {
        try {
          const groupTypes = await getTypesByGroup(selectedGroup.code);
          setTypes(groupTypes);
          
          // Auto-select first type if available
          if (groupTypes.length > 0) {
            setSelectedType(groupTypes[0]);
          } else {
            setSelectedType(null);
            setCategories([]);
          }
        } catch (error) {
          console.error('Failed to load types:', error);
          setTypes([]);
          setSelectedType(null);
          setCategories([]);
        }
      } else {
        setTypes([]);
        setSelectedType(null);
        setCategories([]);
      }
    };
    
    loadTypes();
  }, [selectedGroup, getTypesByGroup]);

  // Load categories when type changes
  useEffect(() => {
    const loadCategories = async () => {
      if (selectedType) {
        try {
          const typeCats = await getCategoriesByType(selectedType.code);
          setCategories(typeCats);
        } catch (error) {
          console.error('Failed to load categories:', error);
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    };
    
    loadCategories();
  }, [selectedType, getCategoriesByType]);

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
      await deleteCategory(id);
      toast.success('Đã xóa danh mục');
      // Reload categories after delete
      if (selectedType) {
        const typeCats = await getCategoriesByType(selectedType.code);
        setCategories(typeCats);
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
      
      await updateCategory(category.id!, { status: newStatus });
      toast.success('Đã cập nhật trạng thái');
      
      // Reload categories after update
      if (selectedType) {
        const typeCats = await getCategoriesByType(selectedType.code);
        setCategories(typeCats);
      }
    } catch (error: any) {
      toast.error('Không thể cập nhật trạng thái: ' + error.message);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id!, data);
        toast.success('Đã cập nhật danh mục');
      } else {
        // Create new category with type from selected type
        await createCategory({
          ...data,
          type: selectedType!.code,
          group_category_id: selectedGroup!.code,
        });
        toast.success('Đã tạo danh mục mới');
      }
      
      setShowFormDialog(false);
      setEditingCategory(null);
      
      // Reload categories after create/update
      if (selectedType) {
        const typeCats = await getCategoriesByType(selectedType.code);
        setCategories(typeCats);
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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              localStorage.removeItem('system_categories_data');
              toast.info('Đã xóa cache');
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Xóa cache
          </Button>
          <Button
            onClick={async () => {
              toast.info('Đang tải lại dữ liệu từ API...');
              await refresh();
              toast.success('Đã làm mới dữ liệu');
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hookError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                Lỗi khi tải dữ liệu
              </h4>
              <p className="text-sm text-red-700 dark:text-red-500 mt-1">
                {hookError}
              </p>
            </div>
            <Button
              onClick={refresh}
              variant="ghost"
              size="sm"
              className="text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Thử lại
            </Button>
          </div>
        </div>
      )}

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
            loading={hookLoading}
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
            loading={hookLoading}
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
            loading={hookLoading}
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