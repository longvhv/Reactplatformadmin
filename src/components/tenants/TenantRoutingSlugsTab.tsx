/**
 * TenantRoutingSlugsTab Component
 * Quản lý routing slugs (SEO-friendly URLs) cho tenant
 */

import { useState, useEffect } from 'react';
import { 
  Link2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RoutingSlugFormModal } from './RoutingSlugFormModal';

// Types matching DB schema
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
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

interface TenantRoutingSlugsTabProps {
  tenantId: string;
}

export function TenantRoutingSlugsTab({ tenantId }: TenantRoutingSlugsTabProps) {
  const [slugs, setSlugs] = useState<RoutingSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlug, setEditingSlug] = useState<RoutingSlug | null>(null);

  // Mock data - sẽ thay bằng API call thực tế
  useEffect(() => {
    const mockSlugs: RoutingSlug[] = [
      {
        _id: '1',
        tenant_id: tenantId,
        slug: 'ao-thun-nam-basic',
        entity_type: 'PRODUCT',
        entity_id: 'prod-001',
        is_canonical: true,
        redirect_to: null,
        items_snapshot: {
          title: 'Áo thun nam basic',
          thumbnail: 'https://picsum.photos/seed/product1/200',
          seo_title: 'Áo thun nam cơ bản - Chất lượng cao'
        },
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        _id: '2',
        tenant_id: tenantId,
        slug: 'ao-thun-nam',
        entity_type: 'PRODUCT',
        entity_id: 'prod-001',
        is_canonical: false,
        redirect_to: 'ao-thun-nam-basic',
        items_snapshot: {
          title: 'Áo thun nam basic'
        },
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z'
      },
      {
        _id: '3',
        tenant_id: tenantId,
        slug: 'huong-dan-su-dung',
        entity_type: 'ARTICLE',
        entity_id: 'article-001',
        is_canonical: true,
        redirect_to: null,
        items_snapshot: {
          title: 'Hướng dẫn sử dụng',
          seo_title: 'Hướng dẫn sử dụng chi tiết'
        },
        created_at: '2024-01-12T10:00:00Z',
        updated_at: '2024-01-12T10:00:00Z'
      },
      {
        _id: '4',
        tenant_id: tenantId,
        slug: 'thoi-trang-nam',
        entity_type: 'CATEGORY',
        entity_id: 'cat-001',
        is_canonical: true,
        redirect_to: null,
        items_snapshot: {
          title: 'Thời trang nam',
          seo_title: 'Bộ sưu tập thời trang nam'
        },
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z'
      }
    ];

    setTimeout(() => {
      setSlugs(mockSlugs);
      setLoading(false);
    }, 500);
  }, [tenantId]);

  // Filter slugs based on search and type
  const filteredSlugs = slugs.filter(slug => {
    const matchesSearch = slug.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slug.items_snapshot.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || slug.entity_type === filterType;
    return matchesSearch && matchesType;
  });

  const getEntityTypeBadge = (type: string) => {
    const colors = {
      PRODUCT: 'bg-blue-100 text-blue-700 border-blue-200',
      ARTICLE: 'bg-green-100 text-green-700 border-green-200',
      CATEGORY: 'bg-purple-100 text-purple-700 border-purple-200',
      PAGE: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleDelete = (slug: RoutingSlug) => {
    if (confirm(`Bạn có chắc muốn xóa slug "${slug.slug}"?`)) {
      setSlugs(prev => prev.filter(s => s._id !== slug._id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Routing Slugs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý ánh xạ SEO-friendly URLs cho các thực thể
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Slug
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm slug hoặc tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Loại:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">Tất cả</option>
            <option value="PRODUCT">Sản phẩm</option>
            <option value="ARTICLE">Bài viết</option>
            <option value="CATEGORY">Danh mục</option>
            <option value="PAGE">Trang</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Tổng slugs</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{slugs.length}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Canonical</div>
          <div className="text-2xl font-bold text-green-700 mt-1">
            {slugs.filter(s => s.is_canonical).length}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="text-orange-600 text-sm font-medium">Redirects</div>
          <div className="text-2xl font-bold text-orange-700 mt-1">
            {slugs.filter(s => !s.is_canonical).length}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">Sản phẩm</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {slugs.filter(s => s.entity_type === 'PRODUCT').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thực thể
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Redirect
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSlugs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-gray-400">
                    <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Không tìm thấy routing slug nào</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSlugs.map((slug) => (
                <tr key={slug._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        /{slug.slug}
                      </code>
                      {slug.is_canonical && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" title="Canonical URL" />
                      )}
                    </div>
                    {slug.items_snapshot.title && (
                      <div className="text-xs text-gray-500 mt-1">{slug.items_snapshot.title}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getEntityTypeBadge(slug.entity_type)}>
                      {slug.entity_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs text-gray-600 font-mono">{slug.entity_id}</code>
                  </td>
                  <td className="px-6 py-4">
                    {slug.is_canonical ? (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Canonical</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Alias</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {slug.redirect_to ? (
                      <code className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-mono">
                        → /{slug.redirect_to}
                      </code>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => window.open(`/${slug.slug}`, '_blank')}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Xem trước"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSlug(slug);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(slug)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Về Routing Slugs</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Canonical URL</strong>: URL chính thức cho thực thể (is_canonical = true)</li>
              <li><strong>Alias URL</strong>: URL phụ redirect 301 về canonical URL</li>
              <li><strong>Format slug</strong>: Chỉ chấp nhận ký tự a-z, 0-9 và dấu gạch ngang (-)</li>
              <li><strong>Entity Types</strong>: PRODUCT, ARTICLE, CATEGORY, PAGE</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <RoutingSlugFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSlug(null);
        }}
        tenantId={tenantId}
        slug={editingSlug}
        onSlugAdded={(newSlug) => {
          if (editingSlug) {
            setSlugs(prev => prev.map(s => s._id === editingSlug._id ? newSlug : s));
          } else {
            setSlugs(prev => [...prev, { ...newSlug, _id: `slug-${Date.now()}` }]);
          }
          setShowAddModal(false);
          setEditingSlug(null);
        }}
      />
    </div>
  );
}