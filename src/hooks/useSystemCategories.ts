/**
 * System Categories Hook
 * Manages system categories with localStorage persistence and seed data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  systemCategoryApi,
  SystemCategoryGroup,
  SystemCategoryType,
  CategoryInstance,
  SystemCategory,
} from '../api/systemCategoryApi';
import { systemCategoriesSeed } from '../data/system-categories-seed';

const STORAGE_KEY = 'system_categories_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: SystemCategory[];
  timestamp: number;
}

export function useSystemCategories() {
  const [allCategories, setAllCategories] = useState<SystemCategory[]>([]);
  const [groups, setGroups] = useState<SystemCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from cache or fetch
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // ALWAYS try API first (skip cache for initial load)
      console.log('🔄 [System Categories] Fetching from API...');
      
      try {
        const apiGroups = await systemCategoryApi.getActiveGroups();
        console.log('✅ [System Categories] API Groups:', apiGroups.length, apiGroups);
        
        if (apiGroups.length > 0) {
          // API has data, fetch all categories
          console.log('🔄 [System Categories] Fetching all types...');
          const allTypes = await systemCategoryApi.getAllTypes();
          console.log('✅ [System Categories] API Types:', allTypes.length, allTypes);
          
          // Fetch categories for each type
          const categoryPromises = allTypes
            .filter(type => type.status === 1) // Only active types
            .map(async type => {
              try {
                const cats = await systemCategoryApi.getCategoriesByType(type.code);
                console.log(`✅ [System Categories] Categories for ${type.code}:`, cats.length);
                return cats;
              } catch (err) {
                console.warn(`⚠️ [System Categories] Failed to fetch categories for ${type.code}:`, err);
                return [];
              }
            });
          
          const categoriesArrays = await Promise.all(categoryPromises);
          const allCats = categoriesArrays.flat();
          console.log('✅ [System Categories] Total categories:', allCats.length);
          
          // Combine all data
          const combinedData = [
            ...apiGroups,
            ...allTypes,
            ...allCats,
          ] as SystemCategory[];
          
          console.log('✅ [System Categories] Combined data from API:', combinedData.length, 'items');
          setAllCategories(combinedData);
          updateGroups(combinedData);
          saveToCache(combinedData);
          setLoading(false);
          return;
        } else {
          console.log('⚠️ [System Categories] No groups from API, using seed data');
          await initializeFromSeed();
        }
      } catch (apiError: any) {
        console.error('❌ [System Categories] API error:', apiError);
        console.log('⚠️ [System Categories] Falling back to seed data');
        await initializeFromSeed();
      }
    } catch (err: any) {
      console.error('❌ [System Categories] Failed to load:', err);
      setError(err.message);
      // Last resort fallback
      await initializeFromSeed();
    } finally {
      setLoading(false);
    }
  };

  const initializeFromSeed = async () => {
    console.log('Initializing system categories from seed data...');
    setAllCategories(systemCategoriesSeed);
    updateGroups(systemCategoriesSeed);
    saveToCache(systemCategoriesSeed);
  };

  const updateGroups = (data: SystemCategory[]) => {
    const groupItems = data.filter(
      item => item.type === 'SYSTEM_CATEGORY_GROUP'
    ) as SystemCategoryGroup[];
    
    // De-duplicate groups by code to prevent duplicate rendering
    const uniqueGroups = Array.from(
      new Map(groupItems.map(g => [g.code, g])).values()
    );
    
    setGroups(uniqueGroups.sort((a, b) => (a.order || 0) - (b.order || 0)));
  };

  const loadFromCache = (): SystemCategory[] | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) return null;

      const parsed: CachedData = JSON.parse(cached);
      const now = Date.now();

      if (now - parsed.timestamp > CACHE_DURATION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed.data;
    } catch (err) {
      console.error('Failed to load from cache:', err);
      return null;
    }
  };

  const saveToCache = (data: SystemCategory[]) => {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Failed to save to cache:', err);
    }
  };

  // Get types by group code
  const getTypesByGroup = useCallback(async (groupCode: string): Promise<SystemCategoryType[]> => {
    try {
      // Call API directly instead of filtering local data
      const types = await systemCategoryApi.getTypesByGroup(groupCode);
      console.log(`✅ [useSystemCategories] Types for group ${groupCode}:`, types.length, types);
      return types;
    } catch (error) {
      console.error(`❌ [useSystemCategories] Failed to get types for group ${groupCode}:`, error);
      
      // Fallback: try to filter local data
      const group = groups.find(g => g.code === groupCode);
      if (!group || !group.id) return [];
      
      const types = allCategories
        .filter(
          item =>
            item.type === 'SYSTEM_CATEGORY_TYPE' &&
            item.group_category_id === group.id
        ) as SystemCategoryType[];
      
      // De-duplicate types by code
      const uniqueTypes = Array.from(
        new Map(types.map(t => [t.code, t])).values()
      );
      
      return uniqueTypes.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  }, [allCategories, groups]);

  // Get categories by type code
  const getCategoriesByType = useCallback(async (typeCode: string): Promise<CategoryInstance[]> => {
    console.log(`🔍 [getCategoriesByType] Filtering for typeCode: "${typeCode}"`);
    console.log(`🔍 [getCategoriesByType] Total allCategories:`, allCategories.length);
    
    // First, try filtering from local data
    const localCategories = allCategories.filter(item => {
      const isMatch = item.type === typeCode;
      if (isMatch) {
        console.log(`✅ [getCategoriesByType] Found match:`, item);
      }
      return isMatch;
    }) as CategoryInstance[];
    
    console.log(`✅ [getCategoriesByType] Found ${localCategories.length} categories from local data`);
    
    // If we have local data, use it
    if (localCategories.length > 0) {
      // De-duplicate categories by code
      const uniqueCategories = Array.from(
        new Map(localCategories.map(c => [c.code, c])).values()
      );
      
      console.log(`✅ [getCategoriesByType] After dedup: ${uniqueCategories.length} unique categories`);
      return uniqueCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // If no local data, try fetching from API directly
    console.log(`⚠️ [getCategoriesByType] No local data, fetching from API for "${typeCode}"`);
    try {
      const apiCategories = await systemCategoryApi.getCategoriesByType(typeCode);
      console.log(`✅ [getCategoriesByType] Fetched ${apiCategories.length} categories from API`);
      
      // Update local state with fetched categories
      if (apiCategories.length > 0) {
        const newAllCategories = [...allCategories, ...apiCategories];
        setAllCategories(newAllCategories);
        saveToCache(newAllCategories);
      }
      
      return apiCategories;
    } catch (error) {
      console.error(`❌ [getCategoriesByType] Failed to fetch from API:`, error);
      return [];
    }
  }, [allCategories]);

  // Create a new category
  const createCategory = async (data: Partial<SystemCategory>): Promise<SystemCategory> => {
    try {
      // Try API first
      const created = await systemCategoryApi.create(data);
      
      // Update local state
      const newCategories = [...allCategories, created];
      setAllCategories(newCategories);
      updateGroups(newCategories);
      saveToCache(newCategories);
      
      return created;
    } catch (apiError) {
      console.warn('API create failed, saving locally:', apiError);
      
      // Fallback: create locally
      const newCategory: SystemCategory = {
        ...data,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: data.status ?? 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as SystemCategory;
      
      const newCategories = [...allCategories, newCategory];
      setAllCategories(newCategories);
      updateGroups(newCategories);
      saveToCache(newCategories);
      
      return newCategory;
    }
  };

  // Update a category
  const updateCategory = async (
    id: string,
    data: Partial<SystemCategory>
  ): Promise<SystemCategory> => {
    try {
      // Try API first
      const updated = await systemCategoryApi.update(id, data);
      
      // Update local state
      const newCategories = allCategories.map(cat =>
        cat.id === id ? { ...cat, ...updated } : cat
      );
      setAllCategories(newCategories);
      updateGroups(newCategories);
      saveToCache(newCategories);
      
      return updated;
    } catch (apiError) {
      console.warn('API update failed, updating locally:', apiError);
      
      // Fallback: update locally
      const newCategories = allCategories.map(cat =>
        cat.id === id
          ? { ...cat, ...data, updated_at: new Date().toISOString() }
          : cat
      );
      setAllCategories(newCategories);
      updateGroups(newCategories);
      saveToCache(newCategories);
      
      const updated = newCategories.find(cat => cat.id === id);
      if (!updated) throw new Error('Category not found');
      return updated;
    }
  };

  // Delete a category
  const deleteCategory = async (id: string): Promise<void> => {
    try {
      // Try API first
      await systemCategoryApi.hardDelete(id);
      
      // Update local state
      const newCategories = allCategories.filter(cat => cat.id !== id);
      setAllCategories(newCategories);
      updateGroups(newCategories);
      saveToCache(newCategories);
    } catch (apiError) {
      console.warn('API delete failed, deleting locally:', apiError);
      
      // Fallback: delete locally
      const newCategories = allCategories.filter(cat => cat.id !== id);
      setAllCategories(newCategories);
      updateGroups(newCategories);
      saveToCache(newCategories);
    }
  };

  // Refresh data
  const refresh = async () => {
    localStorage.removeItem(STORAGE_KEY);
    await loadCategories();
  };

  return {
    // State
    groups,
    loading,
    error,
    
    // Methods
    getTypesByGroup,
    getCategoriesByType,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
  };
}

export default useSystemCategories;