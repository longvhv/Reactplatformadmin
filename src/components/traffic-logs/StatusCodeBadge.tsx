/**
 * Status Code Badge Component
 * Displays HTTP status codes with appropriate styling
 */

import React from 'react';
import { Badge } from '../ui/badge';

interface StatusCodeBadgeProps {
  statusCode?: number | null;
}

export const StatusCodeBadge: React.FC<StatusCodeBadgeProps> = ({ statusCode }) => {
  if (!statusCode) {
    return (
      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
        -
      </Badge>
    );
  }

  // Determine color based on status code
  let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'default';
  let className = '';

  if (statusCode >= 200 && statusCode < 300) {
    // Success - Green
    className = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
  } else if (statusCode >= 300 && statusCode < 400) {
    // Redirect - Blue
    className = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
  } else if (statusCode >= 400 && statusCode < 500) {
    // Client Error - Orange
    className = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
  } else if (statusCode >= 500) {
    // Server Error - Red
    className = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
  } else {
    // Other - Gray
    className = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  }

  return (
    <Badge variant="outline" className={`${className} font-mono font-semibold`}>
      {statusCode}
    </Badge>
  );
};
