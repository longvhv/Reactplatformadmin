/**
 * ProductRevenueTab - Revenue analytics for product
 */

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CHART_COLORS } from '../../constants/chartColors';

interface ProductRevenueTabProps {
  productId: string;
}

interface ProductRevenue {
  month: string;
  revenue: number;
  subscriptions: number;
  new_subscribers: number;
}

export function ProductRevenueTab({ productId }: ProductRevenueTabProps) {
  const [revenues, setRevenues] = useState<ProductRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    fetchRevenue();
  }, [productId, months]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/products/${productId}/revenue?months=${months}`);
      if (!response.ok) throw new Error('Failed to fetch revenue');
      const data = await response.json();
      setRevenues(data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenues.reduce((sum, r) => sum + r.revenue, 0);
  const totalSubs = revenues.reduce((sum, r) => sum + r.subscriptions, 0);
  const totalNewSubs = revenues.reduce((sum, r) => sum + r.new_subscribers, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doanh thu</h2>
          <p className="text-sm text-gray-600 mt-1">
            Thống kê doanh thu theo tháng
          </p>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value={3}>3 tháng</option>
          <option value={6}>6 tháng</option>
          <option value={12}>12 tháng</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalRevenue.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSubs}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Khách hàng mới</p>
              <p className="text-2xl font-bold text-gray-900">{totalNewSubs}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Biểu đồ doanh thu
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenues}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill={CHART_COLORS.primary} name="Doanh thu" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết doanh thu</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Tháng
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Doanh thu
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Subscriptions
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Khách hàng mới
                </th>
              </tr>
            </thead>
            <tbody>
              {revenues.map((rev) => (
                <tr key={rev.month} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {rev.month}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                    {rev.revenue.toLocaleString('vi-VN')} VND
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">
                    {rev.subscriptions}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">
                    {rev.new_subscribers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}