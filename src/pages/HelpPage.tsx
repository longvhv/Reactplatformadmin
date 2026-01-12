import { useState } from "react";
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  FileText,
  Video,
  Code,
  Lightbulb,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

/**
 * Help Page - Help center and documentation
 * 
 * Features:
 * - Search help articles
 * - Quick links
 * - Contact support
 * - Documentation
 */
export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const quickLinks = [
    {
      icon: Book,
      title: "Hướng dẫn bắt đầu",
      description: "Tìm hiểu cách sử dụng VHV Platform",
      color: "from-blue-500 to-blue-600",
      articles: 12,
    },
    {
      icon: Video,
      title: "Video tutorials",
      description: "Xem video hướng dẫn chi tiết",
      color: "from-purple-500 to-purple-600",
      articles: 8,
    },
    {
      icon: Code,
      title: "API Documentation",
      description: "Tài liệu API cho developers",
      color: "from-green-500 to-green-600",
      articles: 24,
    },
    {
      icon: Lightbulb,
      title: "Tips & Tricks",
      description: "Mẹo và thủ thuật hữu ích",
      color: "from-orange-500 to-orange-600",
      articles: 15,
    },
  ];

  const popularArticles = [
    { title: "Cách tạo dự án mới", views: "2.4k", time: "5 phút đọc" },
    { title: "Quản lý team members", views: "1.8k", time: "7 phút đọc" },
    { title: "Tùy chỉnh dashboard", views: "1.5k", time: "4 phút đọc" },
    { title: "Tích hợp với tools khác", views: "1.2k", time: "10 phút đọc" },
    { title: "Báo cáo và analytics", views: "980", time: "6 phút đọc" },
  ];

  const faqs = [
    {
      question: "Làm thế nào để reset mật khẩu?",
      answer: "Bạn có thể reset mật khẩu trong trang Cài đặt > Bảo mật > Đổi mật khẩu.",
    },
    {
      question: "Tôi có thể mời bao nhiêu thành viên?",
      answer: "Số lượng thành viên phụ thuộc vào gói đăng ký của bạn. Gói miễn phí cho phép tối đa 5 thành viên.",
    },
    {
      question: "Dữ liệu của tôi có được bảo mật không?",
      answer: "Tất cả dữ liệu được mã hóa end-to-end và lưu trữ trên server bảo mật cao.",
    },
    {
      question: "Làm thế nào để xuất dữ liệu?",
      answer: "Vào Cài đặt > Dữ liệu > Xuất dữ liệu, chọn định dạng và tải xuống.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Trung tâm trợ giúp</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tìm câu trả lời, hướng dẫn và tài liệu để sử dụng VHV Platform hiệu quả
        </p>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết, hướng dẫn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-base"
          />
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <Card
              key={link.title}
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors duration-200">
                {link.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{link.articles} bài viết</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Popular Articles */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Bài viết phổ biến</h2>
            <p className="text-sm text-muted-foreground">Các bài viết được xem nhiều nhất</p>
          </div>
        </div>

        <div className="space-y-2">
          {popularArticles.map((article, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 group text-left"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-semibold text-sm group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-primary transition-colors duration-200">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{article.views} lượt xem</span>
                    <span>•</span>
                    <span>{article.time}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
            </button>
          ))}
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Câu hỏi thường gặp</h2>
            <p className="text-sm text-muted-foreground">Giải đáp các thắc mắc phổ biến</p>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200"
            >
              <h3 className="font-medium mb-2 flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                {faq.question}
              </h3>
              <p className="text-sm text-muted-foreground pl-7">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Support */}
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Cần thêm trợ giúp?</h2>
            <p className="text-muted-foreground">
              Đội ngũ support luôn sẵn sàng hỗ trợ bạn 24/7
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat với Support
            </Button>
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Gửi Email
            </Button>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Xem Docs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
