import { useState, useMemo, memo } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useDebounce } from "../../hooks/useDebounce";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  RevenueChart,
  ActivityChart,
  DeviceChart,
  TrafficChart,
} from "../../components/dashboard/Charts";
import {
  RecentActivity,
  QuickStats,
  UpcomingEvents,
  SystemHealth,
} from "../../components/dashboard/Widgets";

// Memoized StatsCard component
const StatsCard = memo(({ stat, index }: { stat: any; index: number }) => {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <Card
      className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card border-border/40 group cursor-pointer overflow-hidden relative"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              {stat.title}
            </p>
            <p className="text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </div>
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="h-12 mb-3 flex items-end gap-1">
          {stat.sparkline.map((value: number, i: number) => (
            <div
              key={i}
              className={`flex-1 bg-gradient-to-t ${stat.color} rounded-sm opacity-30 group-hover:opacity-60 transition-all duration-300`}
              style={{
                height: `${(value / Math.max(...stat.sparkline)) * 100}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
              stat.trend === "up"
                ? "text-success bg-success/10"
                : "text-destructive bg-destructive/10"
            }`}
          >
            <TrendIcon className="w-4 h-4" />
            {stat.change}
          </div>
          <span className="text-sm text-muted-foreground">
            so với tháng trước
          </span>
        </div>
      </div>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";

// Memoized TableRow component
const TableRow = memo(({ item, index }: { item: any; index: number }) => {
  return (
    <tr
      className="hover:bg-muted/30 transition-colors duration-150 group"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary group-hover:scale-110 transition-transform duration-200">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {item.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {item.email}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-accent/50 text-accent-foreground">
          {item.role}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              item.status === "Hoạt động"
                ? "bg-success animate-pulse"
                : "bg-muted-foreground"
            }`}
          />
          <span className="text-sm text-foreground">
            {item.status}
          </span>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-muted-foreground">
        {item.lastActive}
      </td>
      <td className="py-4 px-6 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:scale-105 active:scale-95 transition-transform duration-150"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          >
            <DropdownMenuItem className="cursor-pointer">
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive">
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
});

TableRow.displayName = "TableRow";

/**
 * Modern Dashboard Page
 * 
 * Features:
 * - Enterprise-level analytics dashboard
 * - Modern stats cards with trend indicators & mini sparklines
 * - Interactive charts with Recharts (Revenue, Activity, Device, Traffic)
 * - Real-time widgets (Recent Activity, Quick Stats, Events, System Health)
 * - Elegant data table with search & filters
 * - Smooth animations & micro-interactions
 * - Performance optimized with React.memo and debounce
 * - Responsive design for all screen sizes
 */
export function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounce search query để giảm số lần re-render
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const stats = useMemo(() => [
    {
      title: "Tổng người dùng",
      value: "2,543",
      change: "+12.5%",
      trend: "up" as const,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      sparkline: [20, 35, 30, 45, 40, 55, 50],
    },
    {
      title: "Hoạt động",
      value: "1,234",
      change: "+8.2%",
      trend: "up" as const,
      icon: Activity,
      color: "from-purple-500 to-purple-600",
      sparkline: [30, 25, 40, 35, 50, 45, 55],
    },
    {
      title: "Doanh thu",
      value: "45.2M",
      change: "-3.1%",
      trend: "down" as const,
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
      sparkline: [60, 55, 50, 45, 48, 42, 40],
    },
    {
      title: "Tăng trưởng",
      value: "18.3%",
      change: "+4.5%",
      trend: "up" as const,
      icon: TrendingUp,
      color: "from-amber-500 to-amber-600",
      sparkline: [10, 20, 15, 30, 25, 40, 45],
    },
  ], []);

  const tableData = useMemo(() => [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      role: "Admin",
      status: "Hoạt động",
      lastActive: "2 phút trước",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tranthib@example.com",
      role: "Editor",
      status: "Hoạt động",
      lastActive: "15 phút trước",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "levanc@example.com",
      role: "Viewer",
      status: "Offline",
      lastActive: "2 giờ trước",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      email: "phamthid@example.com",
      role: "Editor",
      status: "Hoạt động",
      lastActive: "5 phút trước",
    },
    {
      id: 5,
      name: "Hoàng Văn E",
      email: "hoangvane@example.com",
      role: "Viewer",
      status: "Offline",
      lastActive: "1 ngày trước",
    },
  ], []);

  // Memoize filtered data để tránh re-calculation không cần thiết
  const filteredData = useMemo(() => {
    return tableData.filter(
      (item) =>
        item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [tableData, debouncedSearchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              Chào mừng trở lại! 👋
            </h1>
            <p className="text-muted-foreground">
              Đây là tổng quan về hoạt động hệ thống của bạn
            </p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={stat.title} stat={stat} index={index} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <ActivityChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceChart />
        <TrafficChart />
      </div>

      {/* Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <QuickStats />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents />
        <SystemHealth />
      </div>

      {/* Elegant Table */}
      <Card className="overflow-hidden border-border/40 shadow-sm">
        {/* Table Header */}
        <div className="p-6 border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight mb-1">
                Người dùng hoạt động
              </h2>
              <p className="text-sm text-muted-foreground">
                Quản lý và theo dõi người dùng trong hệ thống
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <Button variant="outline" size="icon" className="hover:scale-105 active:scale-95 transition-transform duration-150">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="border-b border-border/40">
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Người dùng
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Vai trò
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Hoạt động
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredData.map((item, index) => (
                <TableRow key={item.id} item={item} index={index} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-border/40 bg-muted/10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{filteredData.length}</span> trong tổng số{" "}
            <span className="font-medium text-foreground">{tableData.length}</span> người dùng
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hover:scale-105 active:scale-95 transition-transform duration-150">
              Trước
            </Button>
            <Button variant="outline" size="sm" className="hover:scale-105 active:scale-95 transition-transform duration-150">
              Sau
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}