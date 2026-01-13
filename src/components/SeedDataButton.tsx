/**
 * Seed Data Button Component
 * UI component to initialize demo data
 */

import { useState } from 'react';
import { Database, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

interface SeedStatus {
  tenants: {
    existing: number;
    expected: number;
    seeded: boolean;
  };
  users: {
    existing: number;
    expected: number;
    seeded: boolean;
  };
}

interface SeedResults {
  tenants: {
    created: number;
    errors: any[];
  };
  users: {
    created: number;
    errors: any[];
  };
  summary: string;
}

export function SeedDataButton() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: SeedResults } | null>(null);

  const checkSeedStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/seed/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to check status');

      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      console.error('Error checking status:', err);
      setResult({
        success: false,
        message: 'Failed to check seed status',
      });
    } finally {
      setChecking(false);
    }
  };

  const seedData = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/seed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed data');
      }

      // Cache seed data in localStorage for offline fallback
      if (data.data) {
        if (data.data.tenants) {
          localStorage.setItem('seed_tenants', JSON.stringify(data.data.tenants));
          localStorage.setItem('tenants_cache', JSON.stringify({
            data: data.data.tenants,
            timestamp: Date.now()
          }));
        }
        if (data.data.users) {
          localStorage.setItem('seed_users', JSON.stringify(data.data.users));
          localStorage.setItem('users_cache', JSON.stringify({
            data: data.data.users,
            timestamp: Date.now()
          }));
        }
        if (data.data.tenant_members) {
          localStorage.setItem('seed_tenant_members', JSON.stringify(data.data.tenant_members));
        }
      }

      setResult(data);
      // Refresh status after seeding
      await checkSeedStatus();
    } catch (err: any) {
      console.error('Error seeding data:', err);
      setResult({
        success: false,
        message: err.message || 'Failed to seed data',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    setResult(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/seed`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear data');
      }

      // Clear localStorage caches
      localStorage.removeItem('seed_tenants');
      localStorage.removeItem('seed_users');
      localStorage.removeItem('seed_tenant_members');
      localStorage.removeItem('tenants_cache');
      localStorage.removeItem('users_cache');

      setResult(data);
      setStatus(null);
      // Refresh status after clearing
      await checkSeedStatus();
    } catch (err: any) {
      console.error('Error clearing data:', err);
      setResult({
        success: false,
        message: err.message || 'Failed to clear data',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Demo Data Management
            </CardTitle>
            <CardDescription>
              Initialize or clear demo data for tenants and users
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSeedStatus}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Check Status</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                Tenants
                {status.tenants.seeded ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {status.tenants.existing} / {status.tenants.expected} seeded
              </div>
              {status.tenants.existing > 0 && status.tenants.existing !== status.tenants.expected && (
                <div className="text-xs text-amber-600 mt-1">
                  Partial data detected
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                Users
                {status.users.seeded ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {status.users.existing} / {status.users.expected} seeded
              </div>
              {status.users.existing > 0 && status.users.existing !== status.users.expected && (
                <div className="text-xs text-amber-600 mt-1">
                  Partial data detected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Messages */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <AlertDescription>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-semibold">{result.message}</span>
              </div>
              {result.results && (
                <div className="mt-2 space-y-1 text-sm">
                  <div>✓ Tenants created: {result.results.tenants.created}</div>
                  <div>✓ Users created: {result.results.users.created}</div>
                  {result.results.tenants.errors.length > 0 && (
                    <div className="text-amber-600">
                      ⚠ {result.results.tenants.errors.length} tenant errors
                    </div>
                  )}
                  {result.results.users.errors.length > 0 && (
                    <div className="text-amber-600">
                      ⚠ {result.results.users.errors.length} user errors
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={seedData}
            disabled={loading || clearing}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Seed Demo Data
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={loading || clearing || (status && !status.tenants.seeded && !status.users.seeded)}
            className="flex-1"
          >
            {clearing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Demo Data
              </>
            )}
          </Button>
        </div>

        {/* Demo Data Info */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded">
          <div className="font-semibold mb-1">Demo Data Includes:</div>
          <div>• 7 Tenants (hierarchical: Platform → Enterprise → Division → Team)</div>
          <div>• 6 Users (Super Admin, Admin, Users, Moderator, Viewer)</div>
          <div>• Default passwords: Admin@123456 (admins), User@123456 (users)</div>
          <div>• All demo users have email_verified = true</div>
        </div>
      </CardContent>
    </Card>
  );
}