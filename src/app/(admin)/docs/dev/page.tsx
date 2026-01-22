/**
 * Developer Documentation Page
 * Trang tài liệu dành cho developers
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState } from 'react';
import { Code2, Search, Book } from 'lucide-react';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { useRouter } from '../../../../components/shim/next-navigation';

interface DocSection {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: typeof Book;
}

function DevDocsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Hướng dẫn bắt đầu phát triển với hệ thống',
      link: '/docs/dev/getting-started',
      icon: Book,
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      description: 'Tổng quan về kiến trúc hệ thống',
      link: '/docs/dev/architecture',
      icon: Book,
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      description: 'Tài liệu tham khảo API đầy đủ',
      link: '/docs/api',
      icon: Code2,
    },
    {
      id: 'database-schema',
      title: 'Database Schema',
      description: 'Cấu trúc và schema của database',
      link: '/docs/database',
      icon: Book,
    },
  ];

  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Code2}
      title="Developer Documentation"
      description="Tài liệu kỹ thuật và hướng dẫn phát triển"
    >
      {/* Search */}
      <Card className="p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 text-lg h-12"
          />
        </div>
      </Card>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push('/docs/api')}
        >
          <Code2 className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">API Documentation</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tài liệu API đầy đủ với examples và use cases
          </p>
          <div className="flex items-center text-blue-500">
            Xem tài liệu
            <ExternalLink className="w-4 h-4 ml-2" />
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push('/docs/database')}
        >
          <FileText className="w-10 h-10 text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Database Schema</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Cấu trúc database, relationships và indexes
          </p>
          <div className="flex items-center text-purple-500">
            Xem schema
            <ExternalLink className="w-4 h-4 ml-2" />
          </div>
        </Card>
      </div>

      {/* Documentation Sections */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Tài liệu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(section.link)}
              >
                <Icon className="w-8 h-8 text-gray-600 dark:text-gray-300 mb-3" />
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Code Examples */}
      <Card className="p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Code Examples</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`// Example: Fetch data from API
const response = await fetch('/api/v1/users', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
          </pre>
        </div>
      </Card>
    </PageLayout>
  );
}

export default DevDocsPage;