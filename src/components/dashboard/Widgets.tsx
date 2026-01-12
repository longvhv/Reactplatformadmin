import { memo } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  FileText,
  MessageSquare,
  GitCommit,
  TrendingUp,
  Target,
  Zap,
  Bell,
  Calendar,
  Package,
} from "lucide-react";

// Recent Activities Data
const activities = [
  {
    id: 1,
    type: "success",
    icon: CheckCircle2,
    title: "Triển khai thành công",
    description: "Version 2.1.0 đã được deploy lên production",
    time: "2 phút trước",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: 2,
    type: "user",
    icon: User,
    title: "Người dùng mới",
    description: "Nguyễn Văn A đã đăng ký tài khoản",
    time: "15 phút trước",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 3,
    type: "warning",
    icon: AlertTriangle,
    title: "Cảnh báo hiệu năng",
    description: "API response time đang tăng cao",
    time: "1 giờ trước",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: 4,
    type: "commit",
    icon: GitCommit,
    title: "Code commit mới",
    description: "Fix: Resolved memory leak in dashboard",
    time: "2 giờ trước",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  {
    id: 5,
    type: "message",
    icon: MessageSquare,
    title: "Tin nhắn mới",
    description: "Bạn có 3 tin nhắn chưa đọc",
    time: "3 giờ trước",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
];

// Quick Stats Data
const quickStats = [
  {
    id: 1,
    icon: Target,
    label: "Tasks hoàn thành",
    value: "24/30",
    percentage: 80,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    icon: TrendingUp,
    label: "Mục tiêu tháng",
    value: "92%",
    percentage: 92,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: 3,
    icon: Zap,
    label: "Hiệu suất",
    value: "Xuất sắc",
    percentage: 95,
    color: "from-amber-500 to-amber-600",
  },
];

// Upcoming Events Data
const upcomingEvents = [
  {
    id: 1,
    title: "Họp team standup",
    time: "10:00 AM",
    date: "Hôm nay",
    type: "meeting",
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Demo sản phẩm mới",
    time: "2:00 PM",
    date: "Hôm nay",
    type: "presentation",
    color: "bg-purple-500",
  },
  {
    id: 3,
    title: "Review code sprint",
    time: "4:00 PM",
    date: "Ngày mai",
    type: "review",
    color: "bg-emerald-500",
  },
  {
    id: 4,
    title: "Planning meeting",
    time: "9:00 AM",
    date: "Thứ 5",
    type: "planning",
    color: "bg-amber-500",
  },
];

/**
 * Recent Activity Widget
 */
export const RecentActivity = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight mb-1">
            Hoạt động gần đây
          </h3>
          <p className="text-sm text-muted-foreground">
            Theo dõi các sự kiện trong hệ thống
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          Xem tất cả
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors duration-150 group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">{activity.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {activity.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                {activity.time}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});

RecentActivity.displayName = "RecentActivity";

/**
 * Quick Stats Widget
 */
export const QuickStats = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          Thống kê nhanh
        </h3>
        <p className="text-sm text-muted-foreground">
          Tiến độ và hiệu suất của bạn
        </p>
      </div>

      <div className="space-y-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <span className="text-sm font-semibold">{stat.value}</span>
              </div>
              {/* Progress Bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-500`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});

QuickStats.displayName = "QuickStats";

/**
 * Upcoming Events Widget
 */
export const UpcomingEvents = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight mb-1">
            Sự kiện sắp tới
          </h3>
          <p className="text-sm text-muted-foreground">
            Lịch trình và cuộc họp
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          <Calendar className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors duration-150 group cursor-pointer"
          >
            <div className={`w-1 h-12 ${event.color} rounded-full flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1 line-clamp-1">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {event.time} • {event.date}
              </p>
            </div>
            <Bell className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full mt-4 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-200"
      >
        Xem lịch đầy đủ
      </Button>
    </Card>
  );
});

UpcomingEvents.displayName = "UpcomingEvents";

/**
 * System Health Widget
 */
export const SystemHealth = memo(() => {
  const metrics = [
    { label: "CPU Usage", value: 45, status: "good", color: "bg-success" },
    { label: "Memory", value: 62, status: "warning", color: "bg-warning" },
    { label: "Disk Space", value: 78, status: "critical", color: "bg-destructive" },
    { label: "Network", value: 32, status: "good", color: "bg-success" },
  ];

  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          Tình trạng hệ thống
        </h3>
        <p className="text-sm text-muted-foreground">
          Giám sát tài nguyên server
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span className="text-xs font-semibold">{metric.value}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-xl bg-muted/30 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <p className="text-xs text-muted-foreground">
          Tất cả dịch vụ đang hoạt động bình thường
        </p>
      </div>
    </Card>
  );
});

SystemHealth.displayName = "SystemHealth";
