/**
 * Announcement Status Badge Component
 * Reusable badge for displaying announcement status with colors
 */

import React from 'react';
import { AnnouncementStatus, AnnouncementType, AnnouncementPriority } from '../../api/systemAnnouncementApi';

interface StatusBadgeProps {
  status: AnnouncementStatus;
  className?: string;
}

interface TypeBadgeProps {
  type: AnnouncementType;
  className?: string;
}

interface PriorityBadgeProps {
  priority: AnnouncementPriority;
  className?: string;
}

const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  active: 'bg-green-100 text-green-700 border-green-300',
  expired: 'bg-red-100 text-red-700 border-red-300',
  archived: 'bg-slate-100 text-slate-700 border-slate-300',
};

const TYPE_STYLES: Record<AnnouncementType, string> = {
  info: 'bg-blue-100 text-blue-700 border-blue-300',
  warning: 'bg-amber-100 text-amber-700 border-amber-300',
  error: 'bg-red-100 text-red-700 border-red-300',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  maintenance: 'bg-purple-100 text-purple-700 border-purple-300',
};

const PRIORITY_STYLES: Record<AnnouncementPriority, string> = {
  low: 'bg-gray-100 text-gray-600 border-gray-300',
  normal: 'bg-blue-100 text-blue-600 border-blue-300',
  high: 'bg-orange-100 text-orange-600 border-orange-300',
  critical: 'bg-red-100 text-red-600 border-red-300',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]} ${className}`}>
      {status}
    </span>
  );
}

export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_STYLES[type]} ${className}`}>
      {type}
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[priority]} ${className}`}>
      {priority}
    </span>
  );
}
