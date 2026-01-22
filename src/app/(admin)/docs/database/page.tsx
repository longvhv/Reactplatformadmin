/**
 * Database Documentation Page
 * Trang tài liệu database schema
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState } from 'react';
import { Database, Search } from 'lucide-react';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';

interface TableSchema {
  name: string;
  description: string;
  columns: number;
}

function DatabaseDocsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const tables: TableSchema[] = [
    {
      name: 'users',
      description: 'User accounts and authentication data',
      columns: 15,
    },
    {
      name: 'tenants',
      description: 'Multi-tenant organization data',
      columns: 12,
    },
    {
      name: 'roles',
      description: 'Role-based access control',
      columns: 8,
    },
    {
      name: 'permissions',
      description: 'Permission definitions',
      columns: 10,
    },
    {
      name: 'audit_logs',
      description: 'System audit trail',
      columns: 12,
    },
  ];

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Database}
      title="Database Documentation"
      description="Database schema, tables, and relationships"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Database</p>
              <p className="font-semibold">PostgreSQL 15</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Table className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tables</p>
              <p className="text-lg font-semibold">{tables.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Search className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Indexes</p>
              <p className="text-lg font-semibold">42</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Schema Overview */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Schema Overview</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`-- Multi-tenant Architecture
-- All tables include tenant_id for data isolation

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
          </pre>
        </div>
      </Card>

      {/* Tables List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Database Tables</h3>
        <div className="space-y-3">
          {filteredTables.map((table) => (
            <div
              key={table.name}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Table className="w-5 h-5 text-blue-500" />
                <div>
                  <code className="font-mono font-semibold">{table.name}</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {table.description}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {table.columns} columns
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Relationships */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Key Relationships</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <code>users.tenant_id</code> → <code>tenants.id</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <code>user_roles.user_id</code> → <code>users.id</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <code>user_roles.role_id</code> → <code>roles.id</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <code>role_permissions.permission_id</code> → <code>permissions.id</code>
          </li>
        </ul>
      </Card>
    </PageLayout>
  );
}

export default DatabaseDocsPage;