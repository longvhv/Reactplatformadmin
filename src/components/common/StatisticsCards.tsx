/**
 * StatisticsCards Component
 * Unified statistics cards for all list pages
 * Matches Rate Limits page design for consistency
 * ✅ UPDATED 2026-01-16: Added emoji support and null safety
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCard {
  label: string;
  value: number | string;
  color?: 'gray' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'yellow' | 'indigo';
  icon?: LucideIcon | string; // ✅ Support both Lucide icons and emoji strings
}

interface StatisticsCardsProps {
  stats?: StatCard[];
  cards?: StatCard[]; // Alias for compatibility
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

export function StatisticsCards({ stats, cards, columns = 5, className = '' }: StatisticsCardsProps) {
  // ✅ Support both props names and provide default empty array
  const data = stats || cards || [];
  
  // ✅ Early return if no data
  if (data.length === 0) {
    return null;
  }

  const getColorClasses = (color: StatCard['color']) => {
    const colorMap = {
      gray: 'text-gray-900',
      green: 'text-green-600',
      blue: 'text-blue-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      yellow: 'text-yellow-600',
      indigo: 'text-indigo-600',
    };
    return colorMap[color || 'gray'];
  };

  const gridColsClass = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns];

  return (
    <div className={`grid ${gridColsClass} gap-4 ${className}`}>
      {data.map((stat, index) => {
        const Icon = stat.icon;
        const colorClass = getColorClasses(stat.color);
        
        // ✅ Check if icon is a string (emoji) or React component
        const isStringIcon = typeof Icon === 'string';

        return (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Icon (optional) - supports both Lucide icons and emoji strings */}
            {Icon && (
              <div className="mb-2">
                {isStringIcon ? (
                  // ✅ Render emoji as text
                  <span className="text-2xl">{Icon}</span>
                ) : (
                  // ✅ Render Lucide icon as component
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                )}
              </div>
            )}
            
            {/* Label */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            
            {/* Value */}
            <p className={`text-2xl font-bold mt-1 ${colorClass}`}>
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}