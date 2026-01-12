import { memo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "../../components/ui/card";

// Revenue Chart Data
const revenueData = [
  { month: "Jan", revenue: 4000, expenses: 2400, profit: 1600 },
  { month: "Feb", revenue: 3000, expenses: 1398, profit: 1602 },
  { month: "Mar", revenue: 5000, expenses: 3800, profit: 1200 },
  { month: "Apr", revenue: 4780, expenses: 3908, profit: 872 },
  { month: "May", revenue: 5890, expenses: 4800, profit: 1090 },
  { month: "Jun", revenue: 6390, expenses: 3800, profit: 2590 },
  { month: "Jul", revenue: 7490, expenses: 4300, profit: 3190 },
];

// User Activity Data
const activityData = [
  { day: "Mon", users: 320 },
  { day: "Tue", users: 450 },
  { day: "Wed", users: 380 },
  { day: "Thu", users: 520 },
  { day: "Fri", users: 590 },
  { day: "Sat", users: 420 },
  { day: "Sun", users: 350 },
];

// Device Distribution Data
const deviceData = [
  { name: "Desktop", value: 45, color: "#6366f1" },
  { name: "Mobile", value: 35, color: "#a855f7" },
  { name: "Tablet", value: 20, color: "#ec4899" },
];

// Traffic Sources Data
const trafficData = [
  { source: "Organic", visits: 4200 },
  { source: "Direct", visits: 3100 },
  { source: "Referral", visits: 2800 },
  { source: "Social", visits: 1900 },
  { source: "Email", visits: 1200 },
];

/**
 * Revenue Overview Chart
 */
export const RevenueChart = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          Tổng quan doanh thu
        </h3>
        <p className="text-sm text-muted-foreground">
          Doanh thu, chi phí và lợi nhuận theo tháng
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Doanh thu"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorExpenses)"
            name="Chi phí"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
});

RevenueChart.displayName = "RevenueChart";

/**
 * User Activity Chart
 */
export const ActivityChart = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          Hoạt động người dùng
        </h3>
        <p className="text-sm text-muted-foreground">
          Số người dùng hoạt động trong tuần
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={activityData}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="day"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
          />
          <Bar
            dataKey="users"
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
            name="Người dùng"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
});

ActivityChart.displayName = "ActivityChart";

/**
 * Device Distribution Chart
 */
export const DeviceChart = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          Phân bố thiết bị
        </h3>
        <p className="text-sm text-muted-foreground">
          Tỷ lệ truy cập theo thiết bị
        </p>
      </div>
      <div className="flex items-center justify-between">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={deviceData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {deviceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {deviceData.map((device) => (
            <div key={device.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: device.color }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
});

DeviceChart.displayName = "DeviceChart";

/**
 * Traffic Sources Chart
 */
export const TrafficChart = memo(() => {
  return (
    <Card className="p-6 border-border/40 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight mb-1">
          Nguồn truy cập
        </h3>
        <p className="text-sm text-muted-foreground">
          Số lượng truy cập theo nguồn
        </p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={trafficData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis type="number" stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <YAxis
            type="category"
            dataKey="source"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
          />
          <Bar
            dataKey="visits"
            fill="#6366f1"
            radius={[0, 8, 8, 0]}
            name="Lượt truy cập"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
});

TrafficChart.displayName = "TrafficChart";
