/**
 * API Documentation Page
 * 
 * Displays OpenAPI specification in a user-friendly format
 * Features:
 * - Filter by tag
 * - Search endpoints
 * - Copy examples
 * - Authentication info
 * - i18n support
 */

import { useState, useMemo } from 'react';
import { Search, BookOpen, Server, Shield } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { ApiEndpoint } from '@/components/api/ApiEndpoint';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { openApiSpec } from '@/data/openapi';

export function ApiDocsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Parse OpenAPI spec
  const { info, servers, tags, paths } = openApiSpec;

  // Convert paths to array of endpoints
  const endpoints = useMemo(() => {
    const result: any[] = [];
    
    Object.entries(paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        result.push({
          method,
          path,
          ...details,
        });
      });
    });

    return result;
  }, [paths]);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    let filtered = endpoints;

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(endpoint => 
        endpoint.tags?.includes(selectedTag)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(endpoint =>
        endpoint.path.toLowerCase().includes(query) ||
        endpoint.summary?.toLowerCase().includes(query) ||
        endpoint.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [endpoints, selectedTag, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-[#6366f1] rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {info.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {info.description}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="text-xs">
                  v{info.version}
                </Badge>
                <a
                  href={info.contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#6366f1] hover:underline"
                >
                  {info.contact.name}
                </a>
              </div>
            </div>
          </div>

          {/* Servers */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
              {t('api.servers')}
            </h3>
            <div className="space-y-2">
              {servers.map((server: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <Badge variant="outline" className="text-xs">
                    {server.description}
                  </Badge>
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                    {server.url}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Authentication */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {t('api.authentication')}
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  {t('api.authDescription')}
                </p>
                <code className="text-xs font-mono text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                  Authorization: Bearer {'<token>'}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tags */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('api.tags')}
              </h3>
              <div className="space-y-1">
                <Button
                  variant={selectedTag === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                  className="w-full justify-start"
                >
                  {t('api.allEndpoints')} ({endpoints.length})
                </Button>
                {tags.map((tag: any) => {
                  const count = endpoints.filter(e => e.tags?.includes(tag.name)).length;
                  return (
                    <Button
                      key={tag.name}
                      variant={selectedTag === tag.name ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedTag(tag.name)}
                      className="w-full justify-start"
                    >
                      {tag.name} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Endpoints List */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('api.searchEndpoints')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('api.showing')} {filteredEndpoints.length} {t('api.endpoints')}
                {selectedTag && (
                  <span className="ml-1">
                    {t('api.in')} <strong>{selectedTag}</strong>
                  </span>
                )}
              </p>
            </div>

            {/* Endpoints */}
            <div className="space-y-3">
              {filteredEndpoints.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('api.noEndpointsFound')}
                  </p>
                </div>
              ) : (
                filteredEndpoints.map((endpoint, index) => (
                  <ApiEndpoint
                    key={`${endpoint.method}-${endpoint.path}-${index}`}
                    method={endpoint.method}
                    path={endpoint.path}
                    summary={endpoint.summary}
                    description={endpoint.description}
                    parameters={endpoint.parameters}
                    requestBody={endpoint.requestBody?.content?.['application/json']?.schema}
                    responses={endpoint.responses}
                    security={endpoint.security}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}