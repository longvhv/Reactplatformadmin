/**
 * TenantOverviewStats Component
 * Compact collapsible overview statistics for tenants list page
 */

import { 
  Building2, 
  CheckCircle, 
  Clock, 
  Crown,
  Handshake,
  Users,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface TenantOverviewStatsProps {
  stats: {
    total: number;
    active: number;
    trial: number;
    enterprise: number;
    partners: number;
    rootTenants: number;
  };
}

export function TenantOverviewStats({ stats }: TenantOverviewStatsProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('tenants_stats_expanded');
    return saved ? JSON.parse(saved) : false;
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('tenants_stats_expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const statCards = [
    {
      label: 'Total Tenants',
      value: stats.total,
      icon: Building2,
      color: 'indigo',
      show: 'always',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'green',
      show: 'always',
    },
    {
      label: 'Trial',
      value: stats.trial,
      icon: Clock,
      color: 'yellow',
      show: 'always',
    },
    {
      label: 'Enterprise',
      value: stats.enterprise,
      icon: Crown,
      color: 'purple',
      show: 'expanded',
    },
    {
      label: 'Partners',
      value: stats.partners,
      icon: Handshake,
      color: 'blue',
      show: 'expanded',
    },
    {
      label: 'Root Tenants',
      value: stats.rootTenants,
      icon: Users,
      color: 'gray',
      show: 'expanded',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-900', icon: 'text-indigo-600' },
      green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-900', icon: 'text-yellow-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-900', icon: 'text-purple-600' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-900', icon: 'text-gray-600' },
    };
    return colors[color] || colors.gray;
  };

  const visibleStats = isExpanded 
    ? statCards 
    : statCards.filter(s => s.show === 'always');

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {visibleStats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);

          return (
            <Card 
              key={index} 
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {stat.label}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Expand/Collapse Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Show More Stats</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}