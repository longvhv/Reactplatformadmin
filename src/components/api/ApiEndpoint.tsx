/**
 * API Endpoint Component
 * 
 * Displays individual API endpoint with request/response details
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApiEndpointProps {
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  security?: any[];
  endpoint?: any; // Support passing full endpoint object
}

const methodColors: Record<string, string> = {
  get: 'bg-blue-500',
  post: 'bg-green-500',
  put: 'bg-yellow-500',
  delete: 'bg-red-500',
  patch: 'bg-purple-500',
};

export function ApiEndpoint(props: ApiEndpointProps) {
  // Support both destructured props and endpoint object
  const endpoint = props.endpoint || props;
  const {
    method,
    path,
    summary,
    description,
    parameters,
    requestBody,
    responses,
    security,
  } = endpoint;

  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatJson = (obj: any) => JSON.stringify(obj, null, 2);

  // Safety check
  if (!method || !path) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
        
        <Badge className={`${methodColors[method?.toLowerCase() || 'get']} text-white font-mono uppercase text-xs min-w-[60px] justify-center`}>
          {method || 'GET'}
        </Badge>
        
        <code className="font-mono text-sm text-gray-700 dark:text-gray-300 flex-1 text-left">
          {path}
        </code>
        
        <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
          {summary}
        </span>

        {security && security.length > 0 && (
          <Badge variant="outline" className="text-xs">
            🔒 Auth
          </Badge>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-6 space-y-6">
            {/* Description */}
            {description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              </div>
            )}

            {/* Parameters */}
            {parameters && parameters.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Parameters
                </h4>
                <div className="space-y-2">
                  {parameters.map((param, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-[#6366f1]">
                            {param.name}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {param.in}
                          </Badge>
                          {param.required && (
                            <Badge variant="destructive" className="text-xs">
                              required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {param.schema?.type || 'string'}
                          {param.schema?.enum && ` (${param.schema.enum.join(' | ')})`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {requestBody && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Request Body
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(formatJson(requestBody), 'request')}
                    className="h-7 text-xs"
                  >
                    {copiedSection === 'request' ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedSection === 'request' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="p-4 bg-gray-900 dark:bg-black text-gray-100 rounded-lg overflow-x-auto text-xs">
                  <code>{formatJson(requestBody)}</code>
                </pre>
              </div>
            )}

            {/* Responses */}
            {responses && (
              <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Responses
                </h4>
                <div className="space-y-3">
                  {Object.entries(responses).map(([status, response]: [string, any]) => (
                    <div key={status} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800">
                        <Badge
                          className={`${
                            status.startsWith('2')
                              ? 'bg-green-500'
                              : status.startsWith('4')
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          } text-white`}
                        >
                          {status}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {response.description}
                        </span>
                      </div>
                      {response.content?.['application/json']?.schema && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                            <code>
                              {formatJson(response.content['application/json'].schema)}
                            </code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}