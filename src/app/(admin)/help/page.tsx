/**
 * Help Page
 * Trang trợ giúp và hỗ trợ người dùng
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState } from 'react';
import { HelpCircle, Search, MessageCircle, Book, Mail } from 'lucide-react';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: typeof Book;
}

function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const helpArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'Bắt đầu với hệ thống',
      category: 'Getting Started',
      description: 'Hướng dẫn cơ bản để bắt đầu sử dụng hệ thống',
      icon: Book,
    },
    {
      id: '2',
      title: 'Quản lý người dùng',
      category: 'User Management',
      description: 'Cách tạo, chỉnh sửa và quản lý người dùng',
      icon: Book,
    },
    {
      id: '3',
      title: 'Phân quyền',
      category: 'Permissions',
      description: 'Thiết lập và quản lý phân quyền người dùng',
      icon: Book,
    },
    {
      id: '4',
      title: 'Video hướng dẫn',
      category: 'Tutorials',
      description: 'Xem các video hướng dẫn chi tiết',
      icon: Book,
    },
  ];

  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={HelpCircle}
      title="Trợ giúp"
      description="Tìm câu trả lời và hướng dẫn sử dụng hệ thống"
    >
      {/* Search */}
      <Card className="p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm trợ giúp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 text-lg h-12"
          />
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Book className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold mb-2">Tài liệu</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xem tài liệu hướng dẫn đầy đủ
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Book className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold mb-2">Video</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xem video hướng dẫn
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Book className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="font-semibold mb-2">API Docs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tài liệu API cho developers
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <MessageCircle className="w-8 h-8 text-orange-500 mb-3" />
          <h3 className="font-semibold mb-2">Liên hệ</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Liên hệ support team
          </p>
        </Card>
      </div>

      {/* Help Articles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Bài viết phổ biến</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article) => {
            const Icon = article.icon;
            return (
              <Card
                key={article.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {article.category}
                    </span>
                    <h3 className="font-semibold mt-1 mb-2">{article.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {article.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Support */}
      <Card className="p-8 mt-8 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Cần thêm trợ giúp?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Đội ngũ support luôn sẵn sàng hỗ trợ bạn
        </p>
        <Button size="lg">
          <MessageCircle className="w-4 h-4 mr-2" />
          Liên hệ Support
        </Button>
      </Card>
    </PageLayout>
  );
}

export default HelpPage;