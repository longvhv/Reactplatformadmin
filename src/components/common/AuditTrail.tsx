/**
 * AuditTrail Component
 * Reusable component to display audit information (created_by, updated_by, etc.)
 * 
 * ✅ CREATED 2026-01-15: Reusable across all features
 * Usage: <AuditTrail data={department} />
 */

import React, { useState, useEffect } from 'react';
import { User, Calendar, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Audit Data Interface
 * Any entity with audit fields can use this component
 */
export interface AuditData {
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version?: number;
}

export interface AuditTrailProps {
  data: AuditData;
  className?: string;
  showVersion?: boolean;
  showDeleted?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  
  // Optional: User lookup function
  getUserName?: (userId: string) => Promise<string> | string;
}

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Recent times
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Absolute date
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

/**
 * Format user ID to display name
 */
const formatUserId = (userId: string): string => {
  // Extract first 8 characters for display
  if (userId.length > 8) {
    return `${userId.substring(0, 8)}...`;
  }
  return userId;
};

export function AuditTrail({
  data,
  className = '',
  showVersion = true,
  showDeleted = true,
  collapsible = false,
  defaultExpanded = false,
  getUserName,
}: AuditTrailProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Load user names if getUserName is provided
  const loadUserName = async (userId: string) => {
    if (!userId || userNames[userId]) return;
    if (!getUserName) return;

    try {
      const name = await getUserName(userId);
      setUserNames(prev => ({ ...prev, [userId]: name }));
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  // Load user names on mount
  useEffect(() => {
    if (getUserName) {
      if (data.created_by) loadUserName(data.created_by);
      if (data.updated_by) loadUserName(data.updated_by);
      if (data.deleted_by) loadUserName(data.deleted_by);
    }
  }, [data.created_by, data.updated_by, data.deleted_by]);

  const displayUserName = (userId?: string): string => {
    if (!userId) return 'Không xác định';
    return userNames[userId] || formatUserId(userId);
  };

  // Check if has any audit data
  const hasAuditData = data.created_at || data.updated_at || data.deleted_at;
  
  if (!hasAuditData) {
    return null;
  }

  const content = (
    <div className="space-y-3">
      {/* Created Info */}
      {data.created_at && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <User className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tạo bởi
              </span>
              {data.created_by && (
                <Badge variant="outline" className="text-xs">
                  {displayUserName(data.created_by)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(data.created_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Updated Info */}
      {data.updated_at && data.updated_at !== data.created_at && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
            <History className="w-4 h-4 text-green-700 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cập nhật bởi
              </span>
              {data.updated_by && (
                <Badge variant="outline" className="text-xs">
                  {displayUserName(data.updated_by)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(data.updated_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Info */}
      {showDeleted && data.deleted_at && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
            <User className="w-4 h-4 text-red-700 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Xóa bởi
              </span>
              {data.deleted_by && (
                <Badge variant="outline" className="text-xs text-red-600">
                  {displayUserName(data.deleted_by)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(data.deleted_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Version Info */}
      {showVersion && data.version !== undefined && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Phiên bản
            </span>
            <Badge variant="secondary" className="text-xs font-mono">
              v{data.version}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Card className={`p-4 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-2"
        >
          <span className="text-sm font-medium">Thông tin kiểm toán</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
        {isExpanded && content}
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Thông tin kiểm toán
      </h3>
      {content}
    </Card>
  );
}

/**
 * Compact version - shows only minimal info
 */
export function AuditTrailCompact({
  data,
  className = '',
}: {
  data: AuditData;
  className?: string;
}) {
  if (!data.created_at && !data.updated_at) return null;

  return (
    <div className={`flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {data.created_at && (
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>Tạo: {formatDate(data.created_at)}</span>
        </div>
      )}
      {data.updated_at && data.updated_at !== data.created_at && (
        <div className="flex items-center gap-1">
          <History className="w-3 h-3" />
          <span>Sửa: {formatDate(data.updated_at)}</span>
        </div>
      )}
      {data.version !== undefined && (
        <Badge variant="secondary" className="text-xs font-mono">
          v{data.version}
        </Badge>
      )}
    </div>
  );
}

/**
 * Inline version - single line display
 */
export function AuditTrailInline({
  data,
  className = '',
}: {
  data: AuditData;
  className?: string;
}) {
  if (!data.updated_at && !data.created_at) return null;

  const displayDate = data.updated_at || data.created_at;
  
  return (
    <span className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {data.updated_at ? 'Sửa' : 'Tạo'}: {displayDate ? formatDate(displayDate) : 'N/A'}
      {data.version !== undefined && ` (v${data.version})`}
    </span>
  );
}

export default AuditTrail;