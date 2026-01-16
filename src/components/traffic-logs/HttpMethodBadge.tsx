/**
 * HTTP Method Badge Component
 * Displays HTTP methods with appropriate styling
 */

import React from 'react';
import { Badge } from '../ui/badge';

interface HttpMethodBadgeProps {
  method?: string | null;
}

export const HttpMethodBadge: React.FC<HttpMethodBadgeProps> = ({ method }) => {
  if (!method) {
    return (
      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
        -
      </Badge>
    );
  }

  // Determine color based on HTTP method
  let className = '';

  switch (method.toUpperCase()) {
    case 'GET':
      className = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      break;
    case 'POST':
      className = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      break;
    case 'PUT':
    case 'PATCH':
      className = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      break;
    case 'DELETE':
      className = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      break;
    case 'HEAD':
    case 'OPTIONS':
      className = 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      break;
    default:
      className = 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  }

  return (
    <Badge variant="outline" className={`${className} font-mono font-semibold min-w-[60px] justify-center`}>
      {method.toUpperCase()}
    </Badge>
  );
};
