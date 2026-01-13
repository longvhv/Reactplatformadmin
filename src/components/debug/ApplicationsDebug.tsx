/**
 * Applications Debug Component
 * Component để debug và kiểm tra Applications API
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

export function ApplicationsDebug() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testDebugEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications/debug`;
      console.log('Testing debug endpoint:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Debug response:', data);

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Debug test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications API Debug</CardTitle>
        <CardDescription>
          Kiểm tra kết nối và trạng thái của bảng applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testDebugEndpoint}
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Debug Endpoint
        </Button>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-mono text-xs whitespace-pre-wrap">{error}</div>
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Status: {result.status}</div>
                <div>{result.message}</div>
                <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 overflow-auto">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
