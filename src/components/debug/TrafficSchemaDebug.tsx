import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export function TrafficSchemaDebug() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [schemaInfo, setSchemaInfo] = useState<any>(null);

  const checkTrafficSchema = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    setSchemaInfo(null);

    try {
      // 1. Try to fetch a single record to inspect structure
      const { data, error: fetchError } = await supabase
        .schema('telemetry')
        .from('traffic_logs')
        .select('*')
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      setResults(data);

      // 2. Introspect what keys exist if data is returned
      if (data && data.length > 0) {
        setSchemaInfo(Object.keys(data[0]));
      } else {
        setSchemaInfo('No data found, but table is accessible');
      }

    } catch (err: any) {
      setError({
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        full: err
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTrafficSchema();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Traffic Schema Debugger</h1>
        <Button onClick={checkTrafficSchema} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Run Check
        </Button>
      </div>

      <Alert>
        <AlertTitle>Debug Context</AlertTitle>
        <AlertDescription>
          Checking connection to <code>telemetry.traffic_logs</code> and verifying column names.
          Expected issue: Code uses <code>access_time</code> but DB has <code>timestamp</code>.
        </AlertDescription>
      </Alert>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <XCircle className="w-5 h-5 mr-2" />
              Error Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-white p-4 rounded border overflow-auto text-xs text-red-600">
              {JSON.stringify(error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Query Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Detected Columns:</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(schemaInfo) ? (
                    schemaInfo.map((col: string) => (
                      <span key={col} className={`px-2 py-1 rounded text-xs font-mono border ${
                        col === 'timestamp' ? 'bg-green-200 border-green-300 font-bold' : 
                        col === 'access_time' ? 'bg-red-200 border-red-300 font-bold' : 
                        'bg-white border-gray-200'
                      }`}>
                        {col}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">{schemaInfo}</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Sample Data (First Record):</h3>
                <pre className="bg-white p-4 rounded border overflow-auto text-xs">
                  {JSON.stringify(results[0] || {}, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
