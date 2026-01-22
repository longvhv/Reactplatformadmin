/**
 * ProductDocumentationTab - Product documentation and guides
 * ✅ Professional UI with dark mode support
 */

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BookOpen, FileText, Video, Code, ExternalLink } from 'lucide-react';

interface ProductDocumentationTabProps {
  productId: string;
}

interface DocItem {
  id: string;
  title: string;
  type: 'guide' | 'api' | 'video' | 'tutorial';
  url: string;
  description: string;
  lastUpdated: string;
}

export function ProductDocumentationTab({ productId }: ProductDocumentationTabProps) {
  const docs: DocItem[] = [
    {
      id: '1',
      title: 'Getting Started Guide',
      type: 'guide',
      url: '/docs/getting-started',
      description: 'Learn the basics and set up your first project',
      lastUpdated: '2024-01-15',
    },
    {
      id: '2',
      title: 'API Reference',
      type: 'api',
      url: '/docs/api-reference',
      description: 'Complete API documentation with examples',
      lastUpdated: '2024-01-20',
    },
    {
      id: '3',
      title: 'Video Tutorial: Advanced Features',
      type: 'video',
      url: '/docs/video-tutorials',
      description: 'Watch step-by-step video guides',
      lastUpdated: '2024-01-10',
    },
    {
      id: '4',
      title: 'Integration Tutorial',
      type: 'tutorial',
      url: '/docs/integrations',
      description: 'Connect with third-party services',
      lastUpdated: '2024-01-18',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <BookOpen className="w-5 h-5" />;
      case 'api':
        return <Code className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'tutorial':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const configs = {
      guide: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      api: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      video: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      tutorial: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return configs[type as keyof typeof configs] || configs.guide;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Documentation & Resources
          </h3>
        </div>

        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {getTypeIcon(doc.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {doc.title}
                    </h4>
                    <Badge className={getTypeBadge(doc.type)}>
                      {doc.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {doc.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Last updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Links */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
          >
            <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">API Documentation</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Complete reference</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-colors"
          >
            <Video className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Video Tutorials</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Step-by-step guides</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
          >
            <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Sample Code</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Code examples</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">User Guide</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Getting started</p>
            </div>
          </a>
        </div>
      </Card>

      {/* Support Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Support Resources
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">Knowledge Base</span>
            <Button variant="ghost" size="sm">
              Visit →
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">Community Forum</span>
            <Button variant="ghost" size="sm">
              Visit →
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">Contact Support</span>
            <Button variant="ghost" size="sm">
              Contact →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
