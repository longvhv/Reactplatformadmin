import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export function JobsSchemaDebug() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [schemaInfo, setSchemaInfo] = useState<any>({});

  const checkSchema = async () => {
    setLoading(true);
    setResults({});
    setErrors({});
    setSchemaInfo({});

    const table = 'system_jobs';
    
    try {
      // 1. Try to fetch a single record to inspect structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        setErrors({ [table]: error });
      } else {
        setResults({ [table]: data });
        
        // 2. Introspect keys
        if (data && data.length > 0) {
          setSchemaInfo({ [table]: Object.keys(data[0]) });
        } else {
          setSchemaInfo({ [table]: 'Table accessible (No data)' });
        }
      }
    } catch (err: any) {
      setErrors({ [table]: { message: err.message, full: err } });
    }

    setLoading(false);
  };

  useEffect(() => {
    checkSchema();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs Schema Debugger</h1>
        <Button onClick={checkSchema} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Run Check
        </Button>
      </div>

      <Alert>
        <AlertTitle>Debug Context</AlertTitle>
        <AlertDescription>
          Checking <code>system_jobs</code> for column existence (specifically <code>is_deleted</code> vs <code>is_active</code>).
        </AlertDescription>
      </Alert>

      <Card className={`border ${errors['system_jobs'] ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center ${errors['system_jobs'] ? 'text-red-700' : 'text-green-700'}`}>
            {errors['system_jobs'] ? <XCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            Table: system_jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors['system_jobs'] ? (
            <pre className="bg-white p-4 rounded border overflow-auto text-xs text-red-600">
              {JSON.stringify(errors['system_jobs'], null, 2)}
            </pre>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Detected Columns:</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(schemaInfo['system_jobs']) ? (
                    schemaInfo['system_jobs'].map((col: string) => (
                      <span key={col} className={`px-2 py-1 rounded text-xs font-mono border ${
                        col === 'is_deleted' ? 'bg-red-200 border-red-300 font-bold' : 
                        col === 'is_active' ? 'bg-green-200 border-green-300 font-bold' : 
                        'bg-white border-gray-200'
                      }`}>
                        {col}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">{schemaInfo['system_jobs']}</span>
                  )}
                </div>
              </div>
              
              {results['system_jobs'] && results['system_jobs'].length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Sample Data:</h3>
                  <pre className="bg-white p-4 rounded border overflow-auto text-xs">
                    {JSON.stringify(results['system_jobs'][0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
