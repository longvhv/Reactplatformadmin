'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { runDiagnostics, getQuickStatus, type DiagnosticResult } from '../../../../lib/data-client/diagnose';
import { getSupabaseClient } from '../../../../lib/supabase';

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runFullDiagnostics = async () => {
    setLoading(true);
    setResult(null);
    setDiagnostics(null);

    try {
      console.log('[Diagnostics] Starting full diagnostic check...');
      
      const results = await runDiagnostics();
      const status = await getQuickStatus();

      console.log('[Diagnostics] Results:', results);
      console.log('[Diagnostics] Status:', status);

      setDiagnostics(results);
      setResult(status);
    } catch (err: any) {
      console.error('[Diagnostics] Error:', err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testSupabase = async () => {
    setLoading(true);
    setResult(null);
    setDiagnostics(null);

    try {
      // Test 1: Check info.tsx values
      const { projectId, publicAnonKey } = await import('../../../../utils/supabase/info');
      
      console.log('[Test] Project ID:', projectId);
      console.log('[Test] Anon Key (first 50 chars):', publicAnonKey?.substring(0, 50));

      // Test 2: Use singleton Supabase client (prevents Multiple GoTrueClient warning)
      const supabase = getSupabaseClient();

      console.log('[Test] Supabase client created');

      // Test 3: Simple query
      const { data, error } = await supabase
        .from('tenants')
        .select('count')
        .limit(1);

      console.log('[Test] Query result:', { data, error });

      setResult({
        step1_info: { projectId, anonKeyLength: publicAnonKey?.length },
        step2_client: 'Created successfully',
        step3_query: { data, error: error?.message },
      });
    } catch (err: any) {
      console.error('[Test] Error:', err);
      setResult({ error: err.message, stack: err.stack });
    } finally {
      setLoading(false);
    }
  };

  const testDataClient = async () => {
    setLoading(true);
    setResult(null);
    setDiagnostics(null);

    try {
      const { getDataClient } = await import('../../../../lib/data-client');
      const client = getDataClient();

      console.log('[Test] DataClient:', client);

      const result = await client.query('tenants', { limit: 5 });

      console.log('[Test] DataClient query result:', result);

      setResult({
        dataClientType: client.constructor.name,
        queryResult: result,
      });
    } catch (err: any) {
      console.error('[Test] DataClient error:', err);
      setResult({ error: err.message, stack: err.stack });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 border-green-500';
      case 'warning': return 'bg-yellow-100 border-yellow-500';
      case 'error': return 'bg-red-100 border-red-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Connection Diagnostics</h1>

      <div className="space-y-4 mb-8">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4">🔍 Full Diagnostic Check</h2>
          <p className="text-sm text-gray-700 mb-4">
            Runs a comprehensive check of all connection components
          </p>
          <Button onClick={runFullDiagnostics} disabled={loading} className="bg-blue-600">
            {loading ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Supabase Direct</h2>
          <Button onClick={testSupabase} disabled={loading} variant="outline">
            {loading ? 'Testing...' : 'Test Supabase Connection'}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test DataClient</h2>
          <Button onClick={testDataClient} disabled={loading} variant="outline">
            {loading ? 'Testing...' : 'Test DataClient'}
          </Button>
        </Card>
      </div>

      {/* Diagnostic Results */}
      {diagnostics && (
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Diagnostic Results</h2>
          
          {diagnostics.map((diag, idx) => (
            <Card 
              key={idx} 
              className={`p-6 border-l-4 ${getStatusColor(diag.status)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getStatusIcon(diag.status)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{diag.step}</h3>
                  <p className="text-gray-700 mb-2">{diag.message}</p>
                  {diag.details && (
                    <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-48 border">
                      {JSON.stringify(diag.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Other Results */}
      {result && !diagnostics && (
        <Card className="p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-white p-4 rounded overflow-auto max-h-96 text-sm border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      <div className="mt-8">
        <Card className="p-6 bg-orange-50 border-orange-200">
          <h3 className="font-semibold mb-3 text-lg">🔧 Common Issues & Fixes</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">❌ Invalid API key</p>
              <p className="text-gray-700 ml-4">
                → Project not set up or wrong credentials in <code>/utils/supabase/info.tsx</code>
              </p>
            </div>
            <div>
              <p className="font-medium">❌ Table doesn't exist</p>
              <p className="text-gray-700 ml-4">
                → Run database initialization: Go to <code>/setup</code> page
              </p>
            </div>
            <div>
              <p className="font-medium">❌ RLS policy error</p>
              <p className="text-gray-700 ml-4">
                → Row Level Security blocking access. Check Supabase dashboard → Authentication → Policies
              </p>
            </div>
            <div>
              <p className="font-medium">⚠️ DataClient not initialized</p>
              <p className="text-gray-700 ml-4">
                → Check if DataClientProvider is in app layout
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}