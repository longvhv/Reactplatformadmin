/**
 * API Documentation Page
 * Trang tài liệu API
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState } from 'react';
import { Code, Search, Zap } from 'lucide-react';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  category: string;
}

function ApiDocsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const endpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/api/v1/users',
      description: 'Get list of users',
      category: 'Users',
    },
    {
      method: 'POST',
      path: '/api/v1/users',
      description: 'Create new user',
      category: 'Users',
    },
    {
      method: 'GET',
      path: '/api/v1/tenants',
      description: 'Get list of tenants',
      category: 'Tenants',
    },
    {
      method: 'GET',
      path: '/api/v1/roles',
      description: 'Get list of roles',
      category: 'Roles',
    },
  ];

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'PUT':
      case 'PATCH':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <PageLayout
      icon={Code}
      title="API Documentation"
      description="Complete API reference and documentation"
    >
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Base URL</p>
              <code className="text-sm font-mono">https://api.example.com</code>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Code className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
              <code className="text-sm font-mono">v1</code>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Search className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Endpoints</p>
              <p className="text-lg font-semibold">{endpoints.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search API endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Authentication */}
      <Card className="p-6 mb-6 bg-blue-50 dark:bg-blue-950">
        <h3 className="text-lg font-semibold mb-3">Authentication</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          All API requests require authentication using Bearer token:
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`Authorization: Bearer YOUR_ACCESS_TOKEN`}
          </pre>
        </div>
      </Card>

      {/* API Endpoints */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">API Endpoints</h3>
        <div className="space-y-3">
          {filteredEndpoints.map((endpoint, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className={`px-3 py-1 text-sm font-mono rounded ${getMethodColor(endpoint.method)}`}>
                {endpoint.method}
              </span>
              <code className="flex-1 font-mono text-sm">{endpoint.path}</code>
              <span className="text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Example Request */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Example Request</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`fetch('https://api.example.com/api/v1/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
          </pre>
        </div>
      </Card>
    </PageLayout>
  );
}

export default ApiDocsPage;