import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export function UsersSchemaDebug() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [schemaInfo, setSchemaInfo] = useState<any>({});

  const checkSchema = async () => {
    setLoading(true);
    setResults({});
    setErrors({});
    setSchemaInfo({});

    const table = 'users';
    
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
        <h1 className="text-2xl font-bold">Users Schema Debugger</h1>
        <Button onClick={checkSchema} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Run Check
        </Button>
      </div>

      <Alert>
        <AlertTitle>Debug Context</AlertTitle>
        <AlertDescription>
          Checking <code>users</code> for column existence (specifically <code>is_deleted</code> vs <code>deleted_at</code> and <code>id</code> vs <code>_id</code>).
        </AlertDescription>
      </Alert>

      <Card className={`border ${errors['users'] ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center ${errors['users'] ? 'text-red-700' : 'text-green-700'}`}>
            {errors['users'] ? <XCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            Table: users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors['users'] ? (
            <pre className="bg-white p-4 rounded border overflow-auto text-xs text-red-600">
              {JSON.stringify(errors['users'], null, 2)}
            </pre>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Detected Columns:</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(schemaInfo['users']) ? (
                    schemaInfo['users'].map((col: string) => (
                      <span key={col} className={`px-2 py-1 rounded text-xs font-mono border ${
                        col === 'is_deleted' ? 'bg-red-200 border-red-300 font-bold' : 
                        col === 'deleted_at' ? 'bg-green-200 border-green-300 font-bold' :
                        col === '_id' ? 'bg-blue-200 border-blue-300 font-bold' :
                        'bg-white border-gray-200'
                      }`}>
                        {col}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">{schemaInfo['users']}</span>
                  )}
                </div>
              </div>
              
              {results['users'] && results['users'].length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Sample Data:</h3>
                  <pre className="bg-white p-4 rounded border overflow-auto text-xs">
                    {JSON.stringify(results['users'][0], null, 2)}
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
