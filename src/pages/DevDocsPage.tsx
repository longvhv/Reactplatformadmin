/**
 * Developer Documentation Page
 * 
 * Unified documentation for API and Database
 * Features:
 * - 4 tabs: API, Bảng dữ liệu, Sơ đồ ERD, Usecases
 * - Search and filter functionality
 * - i18n support
 * - Download usecase documents
 */

import { useState, useMemo } from 'react';
import { Search, BookOpen, Database, GitBranch, Filter, FileText, Download } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ApiEndpoint } from '../components/api/ApiEndpoint';
import { DatabaseTable } from '../components/database/DatabaseTable';
import { ERDiagram } from '../components/database/ERDiagram';
import { UsecaseCard } from '../components/usecases/UsecaseCard';
import { SeedDataButton } from '../components/SeedDataButton';
import { openApiSpec } from '../data/openapi';
import { databaseSchema, erdDiagram } from '../data/database-schema';
import { usecases, usecaseCategories, Usecase } from '../data/usecases';
import { generateAllUsecasesDocx } from '../utils/usecaseDocGenerator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export function DevDocsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // === API TAB DATA ===
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

  // Filter endpoints for API tab
  const filteredEndpoints = useMemo(() => {
    let filtered = endpoints;

    if (selectedTag) {
      filtered = filtered.filter((endpoint) =>
        endpoint.tags?.includes(selectedTag)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (endpoint) =>
          endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [endpoints, selectedTag, searchQuery]);

  // === DATABASE TAB DATA ===
  // Filter tables for Database tab
  const filteredTables = useMemo(() => {
    if (!searchQuery) return databaseSchema;

    return databaseSchema.filter(
      (table) =>
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.columns.some((col) =>
          col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          col.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [searchQuery]);

  // === USECASES TAB DATA ===
  // Filter usecases for Usecases tab
  const filteredUsecases = useMemo(() => {
    let filtered = usecases;

    if (selectedCategory) {
      filtered = filtered.filter((usecase) =>
        usecase.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (usecase) =>
          usecase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          usecase.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [usecases, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('devDocs.title')}</h1>
              <p className="text-muted-foreground">{t('devDocs.subtitle')}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('devDocs.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="api" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {t('devDocs.apiTab')}
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Database className="w-4 h-4" />
              {t('devDocs.tablesTab')}
            </TabsTrigger>
            <TabsTrigger value="erd" className="gap-2">
              <GitBranch className="w-4 h-4" />
              {t('devDocs.erdTab')}
            </TabsTrigger>
            <TabsTrigger value="usecases" className="gap-2">
              <FileText className="w-4 h-4" />
              {t('devDocs.usecasesTab')}
            </TabsTrigger>
          </TabsList>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            {/* API Info Card */}
            <div className="bg-card rounded-xl border border-border/40 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{info.title}</h2>
                  <p className="text-muted-foreground">{info.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{info.version}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {tags && tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={selectedTag === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  {t('api.allTags')}
                </Button>
                {tags.map((tag) => (
                  <Button
                    key={tag.name}
                    variant={selectedTag === tag.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag(tag.name)}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Endpoints List */}
            <div className="space-y-4">
              {filteredEndpoints.length > 0 ? (
                filteredEndpoints.map((endpoint, index) => (
                  <ApiEndpoint key={`${endpoint.method}-${endpoint.path}-${index}`} endpoint={endpoint} />
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('api.noResults')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('database.totalTables')}</p>
                    <p className="text-2xl font-bold">{databaseSchema.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">GLOBAL Tables</p>
                    <p className="text-2xl font-bold">
                      {databaseSchema.filter(t => t.tableType === 'GLOBAL').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <GitBranch className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TENANT-SPECIFIC</p>
                    <p className="text-2xl font-bold">
                      {databaseSchema.filter(t => t.tableType === 'TENANT-SPECIFIC').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('database.totalColumns')}</p>
                    <p className="text-2xl font-bold">
                      {databaseSchema.reduce((sum, table) => sum + table.columns.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables List with Accordion */}
            <div className="space-y-6">
              {filteredTables.length > 0 ? (
                <Accordion type="multiple" className="space-y-4">
                  {filteredTables.map((table) => (
                    <AccordionItem 
                      key={table.name} 
                      value={table.name}
                      className="bg-card rounded-xl border border-border/40 px-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Database className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-lg">{table.name}</h3>
                            <p className="text-sm text-muted-foreground">{table.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <DatabaseTable table={table} compact />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('database.noResults')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ERD Tab */}
          <TabsContent value="erd" className="space-y-6">
            <div className="bg-card rounded-xl border border-border/40 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GitBranch className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{t('database.erdTitle')}</h2>
                    <p className="text-sm text-muted-foreground">{t('database.erdSubtitle')}</p>
                  </div>
                </div>
                <ERDiagram diagram={erdDiagram} />
              </div>
            </div>
          </TabsContent>

          {/* Usecases Tab */}
          <TabsContent value="usecases" className="space-y-6">
            {/* Header with Download Button */}
            <div className="flex items-center justify-between gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  {t('usecases.allCategories')}
                </Button>
                {usecaseCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Download Button */}
              <Button
                size="default"
                onClick={() => generateAllUsecasesDocx(usecases)}
                className="gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                {t('usecases.download')}
              </Button>
            </div>

            {/* Usecases List */}
            <div className="space-y-4">
              {filteredUsecases.length > 0 ? (
                filteredUsecases.map((usecase) => (
                  <UsecaseCard 
                    key={usecase.id} 
                    usecase={usecase}
                  />
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('usecases.noResults')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}