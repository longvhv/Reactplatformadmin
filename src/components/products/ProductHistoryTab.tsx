/**
 * ProductHistoryTab - Product change history and audit log
 * ✅ Professional UI with dark mode support
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { History, User, Calendar, Edit, Trash2, Plus, Power } from 'lucide-react';

interface ProductHistoryTabProps {
  productId: string;
}

interface HistoryEvent {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  user: string;
  timestamp: string;
  changes?: { field: string; oldValue: string; newValue: string }[];
  description: string;
}

export function ProductHistoryTab({ productId }: ProductHistoryTabProps) {
  // Mock data - replace with real API call
  const historyEvents: HistoryEvent[] = [
    {
      id: '1',
      action: 'updated',
      user: 'admin@example.com',
      timestamp: new Date().toISOString(),
      changes: [
        { field: 'base_price', oldValue: '99.00', newValue: '149.00' },
        { field: 'trial_days', oldValue: '14', newValue: '30' },
      ],
      description: 'Updated pricing and trial period',
    },
    {
      id: '2',
      action: 'activated',
      user: 'manager@example.com',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      description: 'Product activated for public',
    },
    {
      id: '3',
      action: 'created',
      user: 'admin@example.com',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      description: 'Product created',
    },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4" />;
      case 'updated':
        return <Edit className="w-4 h-4" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4" />;
      case 'activated':
      case 'deactivated':
        return <Power className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'updated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'activated':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'deactivated':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Change History
          </h3>
        </div>

        <div className="space-y-4">
          {historyEvents.map((event, index) => (
            <div
              key={event.id}
              className="relative pl-8 pb-8 last:pb-0"
            >
              {/* Timeline line */}
              {index !== historyEvents.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              )}

              {/* Timeline dot */}
              <div className={`absolute left-0 top-1 p-2 rounded-full ${getActionColor(event.action)}`}>
                {getActionIcon(event.action)}
              </div>

              {/* Event content */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={getActionColor(event.action)}>
                      {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                    </Badge>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Changes */}
                {event.changes && event.changes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {event.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {change.field}:
                        </span>
                        <span className="text-red-600 dark:text-red-400 line-through ml-2">
                          {change.oldValue}
                        </span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600 dark:text-green-400">
                          {change.newValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{event.user}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(event.timestamp).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
