/**
 * RoutingSlugFormModal Component
 * Form modal để thêm/sửa routing slug với validation theo DB constraints
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

interface RoutingSlug {
  _id: string;
  tenant_id: string;
  slug: string;
  entity_type: 'PRODUCT' | 'ARTICLE' | 'CATEGORY' | 'PAGE';
  entity_id: string;
  is_canonical: boolean;
  redirect_to: string | null;
  items_snapshot: {
    title?: string;
    thumbnail?: string;
    seo_title?: string;
  };
  created_at: string;
  updated_at: string;
}

interface RoutingSlugFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  slug?: RoutingSlug | null;
  onSlugAdded: (slug: RoutingSlug) => void;
}

export function RoutingSlugFormModal({
  isOpen,
  onClose,
  tenantId,
  slug,
  onSlugAdded
}: RoutingSlugFormModalProps) {
  const [formData, setFormData] = useState({
    slug: '',
    entity_type: 'PRODUCT' as 'PRODUCT' | 'ARTICLE' | 'CATEGORY' | 'PAGE',
    entity_id: '',
    is_canonical: true,
    redirect_to: '',
    items_snapshot: {
      title: '',
      thumbnail: '',
      seo_title: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugPreview, setSlugPreview] = useState('');

  useEffect(() => {
    if (slug) {
      setFormData({
        slug: slug.slug,
        entity_type: slug.entity_type,
        entity_id: slug.entity_id,
        is_canonical: slug.is_canonical,
        redirect_to: slug.redirect_to || '',
        items_snapshot: {
          title: slug.items_snapshot.title || '',
          thumbnail: slug.items_snapshot.thumbnail || '',
          seo_title: slug.items_snapshot.seo_title || ''
        }
      });
    } else {
      // Reset form for new slug
      setFormData({
        slug: '',
        entity_type: 'PRODUCT',
        entity_id: '',
        is_canonical: true,
        redirect_to: '',
        items_snapshot: {
          title: '',
          thumbnail: '',
          seo_title: ''
        }
      });
    }
  }, [slug, isOpen]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Validate slug format (DB constraint: ^[a-z0-9-]+$)
  const validateSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug);
  };

  // Validate redirect logic (DB constraint)
  const validateRedirectLogic = (): boolean => {
    if (formData.is_canonical && formData.redirect_to) {
      return false; // Canonical URL cannot have redirect
    }
    if (!formData.is_canonical && !formData.redirect_to) {
      return false; // Alias URL must have redirect
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    // Validate slug
    if (!formData.slug) {
      newErrors.slug = 'Slug là bắt buộc';
    } else if (!validateSlug(formData.slug)) {
      newErrors.slug = 'Slug chỉ chấp nhận ký tự a-z, 0-9 và dấu gạch ngang (-)';
    }

    // Validate entity_type
    if (!formData.entity_type) {
      newErrors.entity_type = 'Loại thực thể là bắt buộc';
    }

    // Validate entity_id
    if (!formData.entity_id) {
      newErrors.entity_id = 'ID thực thể là bắt buộc';
    }

    // Validate redirect logic
    if (!validateRedirectLogic()) {
      if (formData.is_canonical && formData.redirect_to) {
        newErrors.redirect_to = 'Canonical URL không được có redirect';
      } else if (!formData.is_canonical && !formData.redirect_to) {
        newErrors.redirect_to = 'Alias URL phải có redirect target';
      }
    }

    // Validate items_snapshot.title
    if (!formData.items_snapshot.title) {
      newErrors['items_snapshot.title'] = 'Tiêu đề là bắt buộc';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newSlug: RoutingSlug = {
      _id: slug ? slug._id : '',
      tenant_id: tenantId,
      slug: formData.slug,
      entity_type: formData.entity_type,
      entity_id: formData.entity_id,
      is_canonical: formData.is_canonical,
      redirect_to: formData.redirect_to || null,
      items_snapshot: {
        title: formData.items_snapshot.title,
        thumbnail: formData.items_snapshot.thumbnail,
        seo_title: formData.items_snapshot.seo_title
      },
      created_at: slug ? slug.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSlugAdded(newSlug);
    onClose();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      items_snapshot: {
        ...prev.items_snapshot,
        title
      }
    }));
    
    // Auto-generate slug if in add mode
    if (!slug && !formData.slug) {
      const generatedSlug = generateSlug(title);
      setSlugPreview(generatedSlug);
    }
  };

  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({ ...prev, slug }));
    setSlugPreview('');
    
    // Clear error when user types
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const applyGeneratedSlug = () => {
    if (slugPreview) {
      setFormData(prev => ({ ...prev, slug: slugPreview }));
      setSlugPreview('');
    }
  };

  const handleCanonicalToggle = (isCanonical: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_canonical: isCanonical,
      redirect_to: isCanonical ? '' : prev.redirect_to
    }));
    
    if (errors.redirect_to) {
      setErrors(prev => ({ ...prev, redirect_to: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {slug ? 'Chỉnh sửa Routing Slug' : 'Thêm Routing Slug'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.items_snapshot.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors['items_snapshot.title'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="VD: Áo thun nam basic"
              />
              {errors['items_snapshot.title'] && (
                <p className="mt-1 text-sm text-red-600">{errors['items_snapshot.title']}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm ${
                      errors.slug ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="ao-thun-nam-basic"
                  />
                </div>
                {slugPreview && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Gợi ý:</span>
                    <code className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded">/{slugPreview}</code>
                    <button
                      type="button"
                      onClick={applyGeneratedSlug}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Áp dụng
                    </button>
                  </div>
                )}
              </div>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Chỉ chấp nhận a-z, 0-9 và dấu gạch ngang (-)
              </p>
            </div>

            {/* Entity Type & Entity ID */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại thực thể <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.entity_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, entity_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="ARTICLE">Bài viết</option>
                  <option value="CATEGORY">Danh mục</option>
                  <option value="PAGE">Trang</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID thực thể <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.entity_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, entity_id: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm ${
                    errors.entity_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="prod-001"
                />
                {errors.entity_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.entity_id}</p>
                )}
              </div>
            </div>

            {/* Canonical / Alias */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại URL <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    checked={formData.is_canonical}
                    onChange={() => handleCanonicalToggle(true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">Canonical URL</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      URL chính thức, không redirect
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    checked={!formData.is_canonical}
                    onChange={() => handleCanonicalToggle(false)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-gray-900">Alias URL (301 Redirect)</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      URL phụ, redirect về URL chính
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Redirect To (only for Alias) */}
            {!formData.is_canonical && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-orange-900 mb-1">
                  Redirect đến <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-orange-700 text-sm">/</span>
                  <input
                    type="text"
                    value={formData.redirect_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, redirect_to: e.target.value }))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm ${
                      errors.redirect_to ? 'border-red-300' : 'border-orange-300'
                    }`}
                    placeholder="ao-thun-nam-basic"
                  />
                </div>
                {errors.redirect_to && (
                  <p className="mt-1 text-sm text-red-600">{errors.redirect_to}</p>
                )}
                <p className="mt-1 text-xs text-orange-700">
                  Nhập slug đích (canonical URL) để redirect
                </p>
              </div>
            )}

            {/* SEO Title (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title (Tùy chọn)
              </label>
              <input
                type="text"
                value={formData.items_snapshot.seo_title}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  items_snapshot: { ...prev.items_snapshot, seo_title: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="VD: Áo thun nam cơ bản - Chất lượng cao"
              />
            </div>

            {/* Thumbnail URL (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL (Tùy chọn)
              </label>
              <input
                type="url"
                value={formData.items_snapshot.thumbnail}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  items_snapshot: { ...prev.items_snapshot, thumbnail: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {slug ? 'Lưu' : 'Thêm'}
          </Button>
        </div>
      </div>
    </div>
  );
}