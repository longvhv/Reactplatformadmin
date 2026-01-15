/**
 * ResolvedRoutesViewer Component
 * Hiển thị routes với tất cả domains đã resolve
 * Hỗ trợ Inherited Routing visualization
 */

import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Layers, AlertTriangle } from 'lucide-react';
import { useTenantAppRoutesResolver } from '../../hooks/useTenantAppRoutesResolver';
import { ResolvedRoute } from '../../api/tenantAppRoutesResolverApi';

interface ResolvedRoutesViewerProps {
  tenantId: string;
}

export function ResolvedRoutesViewer({ tenantId }: ResolvedRoutesViewerProps) {
  const { resolvedRoutes, loading, checkConflicts, getResolvedStats } = useTenantAppRoutesResolver(tenantId);
  const [conflicts, setConflicts] = useState<any>(null);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    const loadConflicts = async () => {
      const result = await checkConflicts();
      setConflicts(result);
    };
    loadConflicts();
  }, [resolvedRoutes]);

  const stats = getResolvedStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600">Total Routes</div>
          <div className="text-xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600">Specific Domain</div>
          <div className="text-xl font-bold text-indigo-600">{stats.specific_domain}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600">All My Domains</div>
          <div className="text-xl font-bold text-blue-600">{stats.all_my_domains}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600">Inherited</div>
          <div className="text-xl font-bold text-purple-600">{stats.inherited}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600">Total URLs</div>
          <div className="text-xl font-bold text-green-600">{stats.total_effective_urls}</div>
        </div>
      </div>

      {/* Conflicts Warning */}
      {conflicts?.hasConflict && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-900">
                Phát hiện {conflicts.conflicts.length} routing conflict(s)
              </div>
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className="text-sm text-yellow-700 underline mt-1"
              >
                {showConflicts ? 'Ẩn chi tiết' : 'Xem chi tiết'}
              </button>
              {showConflicts && (
                <div className="mt-3 space-y-2">
                  {conflicts.conflicts.map((conflict: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-3 text-sm">
                      <div className="font-mono text-xs text-gray-900">
                        {conflict.domain}{conflict.path}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {conflict.routes.length} routes tranh giành URL này
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolved Routes List */}
      <div className="space-y-4">
        {resolvedRoutes.map((route) => (
          <div key={route._id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{route.app_code}</div>
                  <div className="text-sm text-gray-500">{route.path_prefix}</div>
                </div>
              </div>
              <div>
                {route.route_scope === 'SPECIFIC_DOMAIN' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    Specific Domain
                  </span>
                )}
                {route.route_scope === 'ALL_MY_DOMAINS' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    All My Domains
                  </span>
                )}
                {route.route_scope === 'INHERITED' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                    Inherited
                  </span>
                )}
              </div>
            </div>

            {/* Resolved Domains */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">
                Effective URLs ({route.effective_urls.length}):
              </div>
              {route.effective_urls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-indigo-600 hover:text-indigo-700 flex-1 truncate"
                  >
                    {url}
                  </a>
                  <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  {route.resolved_domains[idx]?.is_inherited && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex-shrink-0">
                      from parent
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Source Info */}
            {route.tenant && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                Tenant: {route.tenant.name}
                {route.parent_tenant && (
                  <span className="ml-2">
                    (Parent: {route.parent_tenant.name})
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {resolvedRoutes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có route nào được cấu hình
          </div>
        )}
      </div>
    </div>
  );
}

export default ResolvedRoutesViewer;
