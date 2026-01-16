/**
 * User Registration Table Component
 * Displays registration logs in a table format
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { RegistrationSourceBadge } from './RegistrationSourceBadge';
import { DataRegionBadge } from './DataRegionBadge';
import { UserRegistrationLog } from '../../api/userRegistrationLogsApi';

interface UserRegistrationTableProps {
  logs: UserRegistrationLog[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export const UserRegistrationTable: React.FC<UserRegistrationTableProps> = ({
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
    });
  };

  const truncateId = (id?: string | null) => {
    if (!id) return '-';
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
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
          {t('userRegistration.noRecords')}
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
              {t('userRegistration.registrationId')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('userRegistration.userId')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('userRegistration.tenantId')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('userRegistration.registrationSource')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('userRegistration.dataRegion')}
            </TableHead>
            <TableHead className="font-semibold">
              {t('userRegistration.createdAt')}
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
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => navigate(`/core/user-registration-telemetry/${log._id}`)}
            >
              <TableCell className="font-medium font-mono text-sm">
                {truncateId(log._id)}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {truncateId(log.user_id)}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {truncateId(log.tenant_id)}
              </TableCell>
              <TableCell>
                <RegistrationSourceBadge source={log.registration_source} />
              </TableCell>
              <TableCell>
                <DataRegionBadge region={log.data_region} />
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(log.created_at)}
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
                        navigate(`/core/user-registration-telemetry/${log._id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t('common.viewDetails')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/core/user-registration-telemetry/edit/${log._id}`);
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
