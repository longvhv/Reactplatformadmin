'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';
import { getSupabaseClient } from '../../../../lib/supabase';

export default function QuickFixPage() {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFn();
      setResults(prev => [...prev, { test: testName, success: true, result }]);
      return result;
    } catch (error: any) {
      setResults(prev => [...prev, { test: testName, success: false, error: error.message }]);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const step1_checkConfig = async () => {
    await runTest('Check Configuration', async () => {
      const { projectId, publicAnonKey } = await import('../../../../utils/supabase/info');
      
      if (!projectId || projectId === 'your-project-id') {
        throw new Error('Project ID not configured');
      }
      
      if (!publicAnonKey || publicAnonKey.length < 100) {
        throw new Error('Public Anon Key looks invalid');
      }
      
      return { projectId, keyLength: publicAnonKey.length };
    });
    setStep(2);
  };

  const step2_testConnection = async () => {
    await runTest('Test Supabase Connection', async () => {
      const { projectId } = await import('../../../../utils/supabase/info');
      
      // Use singleton Supabase client (prevents Multiple GoTrueClient warning)
      const supabase = getSupabaseClient();
      
      // Try to query - this will fail with specific error
      const { data, error } = await supabase
        .from('tenants')
        .select('_id')
        .limit(1);
      
      if (error) {
        throw new Error(`${error.message} (Code: ${error.code})`);
      }
      
      return { recordCount: data?.length || 0 };
    });
    setStep(3);
  };

  const step3_diagnose = async () => {
    const lastResult = results[results.length - 1];
    
    if (lastResult?.error?.includes('Invalid API key')) {
      setStep(4); // Go to API key fix
    } else if (lastResult?.error?.includes('relation') || lastResult?.error?.includes('does not exist')) {
      setStep(5); // Go to table creation
    } else if (lastResult?.error?.includes('permission') || lastResult?.error?.includes('RLS')) {
      setStep(6); // Go to RLS fix
    } else if (lastResult?.success) {
      setStep(7); // Success
    }
  };

  const resetTest = () => {
    setStep(0);
    setResults([]);
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Quick Fix Wizard</h1>
        <p className="text-gray-600">
          Step-by-step guide to fix database connection issues
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {['Start', 'Config', 'Connect', 'Diagnose', 'Fix', 'Done'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
              ${idx <= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
              {idx + 1}
            </div>
            {idx < 5 && <div className="w-8 h-0.5 bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 0: Start */}
      {step === 0 && (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Let's fix your database connection</h2>
          <p className="text-gray-600 mb-6">
            This wizard will diagnose and help fix the "Invalid API key" error
          </p>
          <Button onClick={() => setStep(1)} size="lg" className="bg-blue-600">
            Start Diagnosis
          </Button>
        </Card>
      )}

      {/* Step 1: Check Config */}
      {step === 1 && (
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4">Step 1: Check Configuration</h2>
          <p className="text-gray-600 mb-6">
            Verify that Supabase credentials are configured correctly
          </p>
          <Button onClick={step1_checkConfig} disabled={loading}>
            {loading ? 'Checking...' : 'Check Configuration'}
          </Button>
        </Card>
      )}

      {/* Step 2: Test Connection */}
      {step === 2 && (
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4">Step 2: Test Connection</h2>
          <p className="text-gray-600 mb-6">
            Attempt to connect to Supabase database
          </p>
          <Button onClick={step2_testConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
        </Card>
      )}

      {/* Step 3: Auto Diagnose */}
      {step === 3 && (
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4">Step 3: Analyzing Error...</h2>
          <p className="text-gray-600 mb-6">
            Determining the root cause of the issue
          </p>
          <Button onClick={step3_diagnose}>
            Continue
          </Button>
        </Card>
      )}

      {/* Step 4: Fix Invalid API Key */}
      {step === 4 && (
        <Card className="p-8">
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertTitle className="text-red-800">❌ Invalid API Key Detected</AlertTitle>
            <AlertDescription className="text-red-700">
              The API key or project ID is incorrect, or the Supabase project doesn't exist.
            </AlertDescription>
          </Alert>

          <h2 className="text-xl font-bold mb-4">How to Fix:</h2>
          
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-semibold mb-2">Option 1: Check Supabase Dashboard</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Go to <a href="https://app.supabase.com" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a></li>
                <li>Select your project (or create new one)</li>
                <li>Go to Settings → API</li>
                <li>Copy <strong>Project URL</strong> and <strong>anon public</strong> key</li>
                <li>Check if they match the values in <code>/utils/supabase/info.tsx</code></li>
              </ol>
            </div>

            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h3 className="font-semibold mb-2">Option 2: Verify Project Exists</h3>
              <p className="text-sm text-gray-700 mb-2">
                Check that your Supabase project is active and not paused/deleted
              </p>
              <code className="text-xs bg-gray-100 p-2 block rounded">
                Project ID: {results[0]?.result?.projectId || 'unknown'}
              </code>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-semibold mb-2">Option 3: Database Not Initialized</h3>
              <p className="text-sm text-gray-700 mb-2">
                The error might actually be because tables don't exist yet
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/setup'}
              >
                Go to Setup Page
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={resetTest} variant="outline">
              Start Over
            </Button>
            <Button onClick={() => setStep(2)}>
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Fix Missing Tables */}
      {step === 5 && (
        <Card className="p-8">
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <AlertTitle className="text-yellow-800">⚠️ Table Not Found</AlertTitle>
            <AlertDescription className="text-yellow-700">
              The database tables haven't been created yet.
            </AlertDescription>
          </Alert>

          <h2 className="text-xl font-bold mb-4">How to Fix:</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3">Initialize Database</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to the <strong>Setup Page</strong></li>
              <li>Click <strong>"Initialize Database"</strong> button</li>
              <li>Wait for all tables to be created</li>
              <li>Return here and retry</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button onClick={resetTest} variant="outline">
              Start Over
            </Button>
            <Button 
              onClick={() => window.location.href = '/setup'}
              className="bg-blue-600"
            >
              Go to Setup Page
            </Button>
          </div>
        </Card>
      )}

      {/* Step 6: Fix RLS Policies */}
      {step === 6 && (
        <Card className="p-8">
          <Alert className="mb-6 border-orange-500 bg-orange-50">
            <AlertTitle className="text-orange-800">🔒 RLS Policy Blocking Access</AlertTitle>
            <AlertDescription className="text-orange-700">
              Row Level Security is preventing anonymous access to the database.
            </AlertDescription>
          </Alert>

          <h2 className="text-xl font-bold mb-4">How to Fix:</h2>
          
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold mb-2 text-red-700">⚡ Quick Fix (Development Only)</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 mb-3">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Run this command:</li>
              </ol>
              <code className="text-xs bg-gray-900 text-green-400 p-3 block rounded">
                ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
              </code>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ WARNING: Only use in development! Not secure for production.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-semibold mb-2">🔐 Proper Fix (Recommended)</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 mb-3">
                <li>Open <code>/scripts/fix-rls-policies.sql</code></li>
                <li>Copy the SQL code (Option 2 - with policies)</li>
                <li>Run in Supabase SQL Editor</li>
                <li>This adds proper policies for anon access</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={resetTest} variant="outline">
              Start Over
            </Button>
            <Button onClick={() => setStep(2)}>
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* Step 7: Success */}
      {step === 7 && (
        <Card className="p-8 bg-green-50 border-green-500">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Connection Successful!</h2>
            <p className="text-green-700 mb-6">
              Your database is configured correctly and accessible.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetTest} variant="outline">
                Test Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin/tenants'}
                className="bg-green-600"
              >
                Go to Tenants Page
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Test Results Log */}
      {results.length > 0 && (
        <Card className="p-6 mt-8 bg-gray-50">
          <h3 className="font-semibold mb-4">Test Results:</h3>
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded border-l-4 ${
                  result.success 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{result.success ? '✅' : '❌'}</span>
                  <strong className="text-sm">{result.test}</strong>
                </div>
                {result.error && (
                  <p className="text-xs text-red-700 ml-6">{result.error}</p>
                )}
                {result.result && (
                  <pre className="text-xs text-gray-700 ml-6 mt-1">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}