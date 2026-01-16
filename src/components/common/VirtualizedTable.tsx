/**
 * Virtualized Table Component
 * 
 * Wrapper around VirtualList for table rendering with large datasets
 * Optimized for performance with 1000+ rows
 * 
 * ✅ Features:
 * - Virtual scrolling for large datasets
 * - Configurable row height
 * - Support for sticky headers
 * - Optimized rendering (only visible rows)
 * 
 * @example
 * <VirtualizedTable
 *   data={users}
 *   columns={columns}
 *   rowHeight={60}
 *   renderRow={(item) => <UserRow user={item} />}
 * />
 */

import { ReactNode, useRef, useEffect, useState } from 'react';
import { VirtualList } from '../VirtualList';

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (item: T) => ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  renderRow?: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
  onRowClick?: (item: T, index: number) => void;
  // Header customization
  stickyHeader?: boolean;
  headerHeight?: number;
  // Loading state
  loading?: boolean;
  emptyMessage?: string;
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 60,
  renderRow,
  className = '',
  overscan = 5,
  onRowClick,
  stickyHeader = true,
  headerHeight = 44,
  loading = false,
  emptyMessage = 'No data available',
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Default row renderer if not provided
  const defaultRenderRow = (item: T, index: number) => (
    <div
      className={`flex items-center border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        onRowClick ? 'cursor-pointer' : ''
      }`}
      style={{ height: rowHeight }}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-4 text-sm text-gray-900 dark:text-white truncate"
          style={{ width: column.width || `${100 / columns.length}%` }}
        >
          {column.render ? column.render(item) : item[column.key]}
        </div>
      ))}
    </div>
  );

  const rowRenderer = renderRow || defaultRenderRow;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${className}`}>
      {/* Table Header */}
      {stickyHeader && (
        <div
          className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
          style={{ height: headerHeight }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300 truncate"
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              {column.label}
            </div>
          ))}
        </div>
      )}

      {/* Virtual List */}
      <div className="flex-1 overflow-hidden">
        <VirtualList
          items={data}
          itemHeight={rowHeight}
          renderItem={rowRenderer}
          overscan={overscan}
          className="h-full"
        />
      </div>

      {/* Footer with count */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div>
          Showing {data.length.toLocaleString()} rows
          {data.length >= 100 && (
            <span className="ml-2 text-green-600 dark:text-green-400">
              • Virtual scrolling active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to use with VirtualizedTable for data management
 */
export function useVirtualizedTableData<T>(
  data: T[],
  options?: {
    filterFn?: (item: T, searchTerm: string) => boolean;
    sortFn?: (a: T, b: T) => number;
  }
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const processedData = data
    .filter((item) => {
      if (!searchTerm) return true;
      if (options?.filterFn) {
        return options.filterFn(item, searchTerm);
      }
      // Default: search in all string fields
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      if (options?.sortFn) return options.sortFn(a, b);

      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return {
    data: processedData,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSort: (key: keyof T) => {
      if (sortBy === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(key);
        setSortOrder('asc');
      }
    },
  };
}

/**
 * Example usage:
 * 
 * const columns = [
 *   { key: 'name', label: 'Name', width: '30%' },
 *   { key: 'email', label: 'Email', width: '40%' },
 *   { 
 *     key: 'status', 
 *     label: 'Status', 
 *     width: '30%',
 *     render: (user) => <Badge status={user.status} />
 *   },
 * ];
 * 
 * const { data, setSearchTerm } = useVirtualizedTableData(users);
 * 
 * <VirtualizedTable
 *   data={data}
 *   columns={columns}
 *   rowHeight={60}
 *   onRowClick={(user) => navigate(`/users/${user.id}`)}
 * />
 */
