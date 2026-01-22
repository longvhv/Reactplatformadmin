/**
 * Traffic Logs Table Component
 * Displays traffic logs in a table format
 */

import React from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import { useNavigate } from 'react-router';
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { StatusCodeBadge } from './StatusCodeBadge';
import { HttpMethodBadge } from './HttpMethodBadge';
import { TrafficLog } from '../../api/trafficLogsApi';

interface TrafficLogsTableProps {
  logs: TrafficLog[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export const TrafficLogsTable: React.FC<TrafficLogsTableProps> = ({
  logs,
  loading,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatLatency = (ms?: number | null) => {
    if (!ms && ms !== 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const truncateText = (text?: string | null, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {t('trafficLogs.noRecords')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900/50">
            <TableHead className="font-semibold">
              {t('trafficLogs.method')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('trafficLogs.path')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('trafficLogs.status')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('trafficLogs.latency')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('trafficLogs.size')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('trafficLogs.ipAddress')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('trafficLogs.timestamp')}
            </TableHead>
            <TableHead className="text-right font-semibold">
              {t('common.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log._id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/core/traffic-logs/${log._id}`)}
            >
              <TableCell>
                <HttpMethodBadge method={log.method} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-mono text-sm">
                    {truncateText(log.path, 40)}
                  </span>
                  {log.domain && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {truncateText(log.domain, 30)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusCodeBadge statusCode={log.status_code} />
              </TableCell>
              <TableCell>
                <span
                  className={`font-mono text-sm ${
                    (log.latency_ms || 0) > 1000
                      ? 'text-red-600 dark:text-red-400'
                      : (log.latency_ms || 0) > 500
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {formatLatency(log.latency_ms)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    ↑ {formatBytes(log.request_size)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ↓ {formatBytes(log.response_size)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {log.ip_address || '-'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(log.timestamp)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/core/traffic-logs/${log._id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t('common.view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/core/traffic-logs/${log._id}/edit`);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(log._id);
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};