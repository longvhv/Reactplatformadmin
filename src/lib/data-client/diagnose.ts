/**
 * Diagnostic utilities for DataClient
 * Helps debug connection and configuration issues
 */

import { projectId, publicAnonKey } from '@/utils/supabase/info';

export interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

/**
 * Run full diagnostic check
 */
export async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Step 1: Check project configuration
  results.push(checkProjectConfig());

  // Step 2: Check Supabase client creation
  results.push(await checkSupabaseClient());

  // Step 3: Check database connectivity
  results.push(await checkDatabaseConnectivity());

  // Step 4: Check DataClient initialization
  results.push(await checkDataClientInit());

  return results;
}

/**
 * Check project configuration
 */
function checkProjectConfig(): DiagnosticResult {
  if (!projectId || projectId === 'your-project-id') {
    return {
      step: '1. Project Configuration',
      status: 'error',
      message: 'Project ID not configured',
      details: {
        projectId,
        hint: 'Update utils/supabase/info.tsx with real Supabase project ID',
      },
    };
  }

  if (!publicAnonKey || publicAnonKey === 'your-anon-key') {
    return {
      step: '1. Project Configuration',
      status: 'error',
      message: 'Public Anon Key not configured',
      details: {
        anonKeyLength: publicAnonKey?.length,
        hint: 'Update utils/supabase/info.tsx with real Supabase anon key',
      },
    };
  }

  // Check if anon key looks valid (JWT format)
  const jwtPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  if (!jwtPattern.test(publicAnonKey)) {
    return {
      step: '1. Project Configuration',
      status: 'warning',
      message: 'Anon key format looks suspicious',
      details: {
        anonKeyStart: publicAnonKey.substring(0, 20),
        hint: 'Should be a JWT token starting with "eyJ"',
      },
    };
  }

  return {
    step: '1. Project Configuration',
    status: 'success',
    message: 'Project config looks good',
    details: {
      projectId,
      anonKeyLength: publicAnonKey.length,
      url: `https://${projectId}.supabase.co`,
    },
  };
}

/**
 * Check Supabase client creation
 */
async function checkSupabaseClient(): Promise<DiagnosticResult> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );

    return {
      step: '2. Supabase Client',
      status: 'success',
      message: 'Supabase client created successfully',
      details: {
        clientType: supabase.constructor.name,
      },
    };
  } catch (err: any) {
    return {
      step: '2. Supabase Client',
      status: 'error',
      message: 'Failed to create Supabase client',
      details: {
        error: err.message,
      },
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnectivity(): Promise<DiagnosticResult> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );

    // Try a simple query
    const { data, error } = await supabase
      .from('tenants')
      .select('_id')
      .limit(1);

    if (error) {
      // Specific error handling
      if (error.message?.includes('Invalid API key')) {
        return {
          step: '3. Database Connectivity',
          status: 'error',
          message: 'Invalid API key - credentials may be wrong or project not set up',
          details: {
            error: error.message,
            hint: 'Check if Supabase project exists and credentials are correct',
            code: error.code,
          },
        };
      }

      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return {
          step: '3. Database Connectivity',
          status: 'error',
          message: 'Table "tenants" does not exist',
          details: {
            error: error.message,
            hint: 'Run database initialization scripts',
          },
        };
      }

      if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        return {
          step: '3. Database Connectivity',
          status: 'error',
          message: 'Row Level Security policy blocking access',
          details: {
            error: error.message,
            hint: 'Check RLS policies on "tenants" table',
          },
        };
      }

      return {
        step: '3. Database Connectivity',
        status: 'error',
        message: 'Database query failed',
        details: {
          error: error.message,
          code: error.code,
        },
      };
    }

    return {
      step: '3. Database Connectivity',
      status: 'success',
      message: 'Database connection successful',
      details: {
        recordsFound: data?.length || 0,
      },
    };
  } catch (err: any) {
    return {
      step: '3. Database Connectivity',
      status: 'error',
      message: 'Unexpected error during database test',
      details: {
        error: err.message,
      },
    };
  }
}

/**
 * Check DataClient initialization
 */
async function checkDataClientInit(): Promise<DiagnosticResult> {
  try {
    const { getDataClient } = await import('./index');
    const client = getDataClient();

    if (!client) {
      return {
        step: '4. DataClient Initialization',
        status: 'error',
        message: 'DataClient not initialized',
        details: {
          hint: 'Check if DataClientProvider is in app layout',
        },
      };
    }

    // Try a query
    const result = await client.query('tenants', { limit: 1 });

    return {
      step: '4. DataClient Initialization',
      status: 'success',
      message: 'DataClient working correctly',
      details: {
        clientType: client.constructor.name,
        recordsFound: result.data.length,
        totalRecords: result.total,
      },
    };
  } catch (err: any) {
    return {
      step: '4. DataClient Initialization',
      status: 'error',
      message: 'DataClient query failed',
      details: {
        error: err.message,
      },
    };
  }
}

/**
 * Get quick status summary
 */
export async function getQuickStatus(): Promise<{
  overall: 'healthy' | 'degraded' | 'down';
  summary: string;
}> {
  const results = await runDiagnostics();
  const errors = results.filter((r) => r.status === 'error');
  const warnings = results.filter((r) => r.status === 'warning');

  if (errors.length === 0) {
    return {
      overall: 'healthy',
      summary: 'All systems operational',
    };
  }

  if (errors.length >= 3) {
    return {
      overall: 'down',
      summary: `${errors.length} critical errors detected`,
    };
  }

  return {
    overall: 'degraded',
    summary: `${errors.length} errors, ${warnings.length} warnings`,
  };
}
