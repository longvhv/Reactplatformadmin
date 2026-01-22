'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

export default function SetupPage() {
  const [step, setStep] = useState<'init-tenant' | 'init-user' | 'complete'>('init-tenant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [tenantResult, setTenantResult] = useState<any>(null);
  const [userResult, setUserResult] = useState<any>(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  const initializeTenant = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Initializing tenant...');
      const response = await fetch(`${API_BASE}/init-tenant`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      console.log('Tenant init response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize tenant');
      }

      setTenantResult(data);
      setStep('init-user');
    } catch (err: any) {
      console.error('Error initializing tenant:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeUser = async () => {
    if (!userId) {
      setError('Please enter User ID from Supabase Auth');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Initializing admin user...');
      const response = await fetch(`${API_BASE}/init-admin-user`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          email: 'admin@saas.coquan.vn',
        }),
      });

      const data = await response.json();
      console.log('User init response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize user');
      }

      setUserResult(data);
      setStep('complete');
    } catch (err: any) {
      console.error('Error initializing user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Setup</h1>
            <p className="text-gray-600 mt-2">Initialize your SaaS platform</p>
          </div>

          {/* Step 1: Initialize Tenant */}
          {step === 'init-tenant' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Step 1: Initialize Tenant Data
                </h2>
                <p className="text-blue-800 text-sm mb-4">
                  This will create the main tenant, applications, permissions, and roles in the database.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 mb-4">
                  <li>• Tenant ID: 078e19ae-af67-4452-9ccd-10e27acb2dfe</li>
                  <li>• Domain: saas.coquan.vn</li>
                  <li>• Application: PLATFORM_ADMIN</li>
                </ul>
                <Button 
                  onClick={initializeTenant} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Initialize Tenant Data'
                  )}
                </Button>
              </div>

              {tenantResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-green-900">Tenant initialized successfully!</h3>
                      <p className="text-sm text-green-800 mt-1">
                        Created: Tenant, Application, {tenantResult.data?.permissions} permissions, Role, Subscription
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-sm text-red-800 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Initialize Admin User */}
          {step === 'init-user' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-semibold text-green-900">Step 1 Complete!</h3>
                    <p className="text-sm text-green-800 mt-1">Tenant data initialized successfully.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Step 2: Create Admin User
                </h2>
                <div className="text-sm text-blue-800 space-y-2 mb-4">
                  <p className="font-semibold">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to Supabase Dashboard → Authentication → Users</li>
                    <li>Click "Add user" → "Create new user"</li>
                    <li>Email: <code className="bg-blue-100 px-1 rounded">admin@saas.coquan.vn</code></li>
                    <li>Password: <code className="bg-blue-100 px-1 rounded">Vhv@2026</code></li>
                    <li>Click "Create user"</li>
                    <li>Copy the User ID (UUID) and paste below</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID from Supabase Auth
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button 
                    onClick={initializeUser} 
                    disabled={loading || !userId}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Admin User...
                      </>
                    ) : (
                      'Create Admin User & Assign Role'
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-sm text-red-800 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-green-900 mb-2">
                      🎉 Setup Complete!
                    </h2>
                    <p className="text-green-800 mb-4">
                      Your SaaS platform is now ready to use.
                    </p>
                    
                    <div className="bg-white border border-green-300 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Login Information:</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex">
                          <span className="text-gray-600 w-24">Email:</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded">admin@saas.coquan.vn</code>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-24">Password:</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded">Vhv@2026</code>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-24">Tenant ID:</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">078e19ae-af67-4452-9ccd-10e27acb2dfe</code>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={() => window.location.href = '/login'}
                        className="w-full"
                      >
                        Go to Login
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/admin'}
                        variant="outline"
                        className="w-full"
                      >
                        Go to Admin Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {userResult && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-700">
                    View Setup Details
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify({ tenant: tenantResult, user: userResult }, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
