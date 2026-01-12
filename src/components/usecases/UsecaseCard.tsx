/**
 * Usecase Card Component
 * 
 * Displays individual usecase information
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Tag, User, AlertCircle, Check } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Usecase } from '../../data/usecases';
import { useLanguage } from '../../providers/LanguageProvider';

interface UsecaseCardProps {
  usecase: Usecase;
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500'
};

const statusColors = {
  completed: 'bg-green-500',
  'in-progress': 'bg-yellow-500',
  planned: 'bg-gray-500'
};

export function UsecaseCard({ usecase }: UsecaseCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header - Always visible */}
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Expand Icon */}
          <div className="mt-1">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-primary" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Title and Badges */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {usecase.id}
                  </Badge>
                  <Badge className={`${priorityColors[usecase.priority]} text-white text-xs`}>
                    {t(`usecases.priority.${usecase.priority}`)}
                  </Badge>
                  <Badge className={`${statusColors[usecase.status]} text-white text-xs`}>
                    {t(`usecases.status.${usecase.status}`)}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-1">{usecase.title}</h3>
                <p className="text-sm text-muted-foreground">{usecase.description}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{usecase.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{usecase.actor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-0 space-y-6 border-t border-border/40 mt-4">
          {/* Preconditions */}
          {usecase.preconditions && usecase.preconditions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                {t('usecases.preconditions')}
              </h4>
              <ul className="space-y-1 ml-6">
                {usecase.preconditions.map((condition, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground list-disc">
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Flow */}
          {usecase.steps && usecase.steps.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t('usecases.mainFlow')}
              </h4>
              <ol className="space-y-2 ml-6">
                {usecase.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground list-decimal">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Postconditions */}
          {usecase.postconditions && usecase.postconditions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t('usecases.postconditions')}
              </h4>
              <ul className="space-y-1 ml-6">
                {usecase.postconditions.map((condition, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground list-disc">
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternative Flows */}
          {usecase.alternativeFlows && usecase.alternativeFlows.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                {t('usecases.alternativeFlows')}
              </h4>
              <ul className="space-y-1 ml-6">
                {usecase.alternativeFlows.map((flow, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground list-disc">
                    {flow}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exception Flows */}
          {usecase.exceptionFlows && usecase.exceptionFlows.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                {t('usecases.exceptionFlows')}
              </h4>
              <ul className="space-y-1 ml-6">
                {usecase.exceptionFlows.map((flow, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground list-disc">
                    {flow}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related APIs */}
          {usecase.relatedAPIs && usecase.relatedAPIs.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">{t('usecases.relatedAPIs')}</h4>
              <div className="flex flex-wrap gap-2">
                {usecase.relatedAPIs.map((api, idx) => (
                  <Badge key={idx} variant="outline" className="font-mono text-xs">
                    {api}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}