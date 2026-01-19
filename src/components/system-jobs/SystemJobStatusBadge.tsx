/**
 * System Job Status Badge Component
 * Displays job status with appropriate styling
 */

import React from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import { Badge } from '../ui/badge';

interface SystemJobStatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  className?: string;
}

export const SystemJobStatusBadge: React.FC<SystemJobStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Badge className={`${getStatusColor()} ${className}`}>
      {t(`systemJobs.statusValues.${status}`)}
    </Badge>
  );
};