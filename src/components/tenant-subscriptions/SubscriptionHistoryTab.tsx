/**
 * SubscriptionHistoryTab - Display subscription history
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, Calendar, User, RefreshCw, XCircle } from 'lucide-react';

interface SubscriptionHistoryTabProps {
  subscriptionId: string;
}

export function SubscriptionHistoryTab({ subscriptionId }: SubscriptionHistoryTabProps) {
  // Mock data - In production, fetch from API
  const historyEvents = [
    {
      id: '1',
      type: 'CREATED',
      description: 'Đăng ký được tạo',
      timestamp: new Date().toISOString(),
      user: 'System',
      metadata: { package: 'Enterprise Plan' },
    },
    {
      id: '2',
      type: 'ACTIVATED',
      description: 'Đăng ký được kích hoạt',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'Admin',
      metadata: {},
    },
  ];

  const getEventIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      CREATED: <Clock className="w-5 h-5 text-blue-600" />,
      ACTIVATED: <User className="w-5 h-5 text-green-600" />,
      RENEWED: <RefreshCw className="w-5 h-5 text-purple-600" />,
      CANCELLED: <XCircle className="w-5 h-5 text-red-600" />,
    };
    return icons[type] || <Calendar className="w-5 h-5 text-gray-600" />;
  };

  const getEventBadge = (type: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      CREATED: { color: 'bg-blue-100 text-blue-800', label: 'Tạo mới' },
      ACTIVATED: { color: 'bg-green-100 text-green-800', label: 'Kích hoạt' },
      RENEWED: { color: 'bg-purple-100 text-purple-800', label: 'Gia hạn' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Hủy' },
    };
    const config = configs[type] || { color: 'bg-gray-100 text-gray-800', label: type };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Lịch sử hoạt động
        </h2>
        <p className="text-sm text-gray-600">
          Theo dõi tất cả các sự kiện và thay đổi của đăng ký
        </p>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {historyEvents.map((event, index) => (
          <Card key={event.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 p-3 rounded-lg bg-gray-50">
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.description}
                  </h3>
                  {getEventBadge(event.type)}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.timestamp).toLocaleString('vi-VN')}
                  </span>
                  <span>•</span>
                  <span>Bởi: <strong>{event.user}</strong></span>
                </div>

                {/* Metadata */}
                {Object.keys(event.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Chi tiết:
                    </p>
                    <div className="space-y-1">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 capitalize">{key}:</span>
                          <span className="text-gray-900 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline connector */}
              {index < historyEvents.length - 1 && (
                <div className="absolute left-[52px] top-[80px] w-0.5 h-12 bg-gray-200" />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {historyEvents.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có lịch sử
          </h3>
          <p className="text-gray-600">
            Không có sự kiện nào được ghi nhận cho đăng ký này.
          </p>
        </Card>
      )}
    </div>
  );
}
