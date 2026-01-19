/**
 * Debug utility để verify schema của webhooks tables
 * ✅ UPDATED: Match với actual schema (is_active, không có is_deleted/health_status)
 */

import { supabase } from '../supabase/client';

export async function verifyWebhooksSchema() {
  console.group('🔍 Verifying Webhooks Schema');

  try {
    // Test 1: Check if public.webhooks table exists và có data không
    console.log('\n📊 Test 1: Checking public.webhooks table...');
    const { data: webhooksData, error: webhooksError, count } = await supabase
      .from('webhooks')
      .select('*', { count: 'exact' })
      .limit(1);

    if (webhooksError) {
      console.error('❌ Error querying webhooks table:', {
        message: webhooksError.message,
        code: webhooksError.code,
        details: webhooksError.details,
        hint: webhooksError.hint,
      });
    } else {
      console.log('✅ Table exists, total rows:', count);
      if (webhooksData && webhooksData.length > 0) {
        console.log('Sample row columns:', Object.keys(webhooksData[0]));
        console.log('Sample data (first row):', webhooksData[0]);
      } else {
        console.log('⚠️  Table is empty - no data to verify');
      }
    }

    // Test 2: Check required columns (is_active, failure_count, success_count)
    // ✅ ACTUAL SCHEMA: is_active (boolean), failure_count (integer), success_count (integer)
    console.log('\n📊 Test 2: Checking required columns (is_active, failure_count, success_count)...');
    const { data: testQuery, error: testError } = await supabase
      .from('webhooks')
      .select('is_active, failure_count, success_count')
      .limit(1);

    if (testError) {
      console.error('❌ Missing columns or wrong schema:', {
        message: testError.message,
        code: testError.code,
        hint: testError.hint,
      });
      console.log('💡 Hint: Schema should have is_active, failure_count, success_count');
    } else {
      console.log('✅ Required columns exist');
      if (testQuery && testQuery.length > 0) {
        console.log('Sample values:', testQuery[0]);
      }
    }

    // Test 3: Test Query 1 - Active webhooks (is_active = true)
    console.log('\n📊 Test 3: Testing Query 1 (Active webhooks: is_active = true)...');
    const { count: activeCount, error: activeError } = await supabase
      .from('webhooks')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Query 1 failed:', {
        message: activeError.message,
        code: activeError.code,
        details: activeError.details,
      });
    } else {
      console.log('✅ Query 1 success, active webhooks count:', activeCount);
    }

    // Test 4: Test Query 2 - Problematic webhooks (failure_count > 0)
    console.log('\n📊 Test 4: Testing Query 2 (Problematic webhooks: is_active=true AND failure_count>0)...');
    const { count: unhealthyCount, error: unhealthyError } = await supabase
      .from('webhooks')
      .select('failure_count, success_count', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('failure_count', 0);

    if (unhealthyError) {
      console.error('❌ Query 2 failed:', {
        message: unhealthyError.message,
        code: unhealthyError.code,
      });
    } else {
      console.log('✅ Query 2 success, problematic webhooks count:', unhealthyCount);
    }

    // Test 5: Check telemetry.webhook_delivery_logs table
    console.log('\n📊 Test 5: Checking telemetry.webhook_delivery_logs table...');
    const { data: logsData, error: logsError, count: logsCount } = await supabase
      .schema('telemetry')
      .from('webhook_delivery_logs')
      .select('*', { count: 'exact' })
      .limit(1);

    if (logsError) {
      console.error('❌ Error querying webhook_delivery_logs:', {
        message: logsError.message,
        code: logsError.code,
        details: logsError.details,
        hint: logsError.hint,
      });
    } else {
      console.log('✅ Table exists, total rows:', logsCount);
      if (logsData && logsData.length > 0) {
        console.log('Sample row columns:', Object.keys(logsData[0]));
      } else {
        console.log('⚠️  Table is empty - no delivery logs yet');
      }
    }

    // Test 6: Test Query 3 - Total deliveries
    console.log('\n📊 Test 6: Testing Query 3 (Total deliveries count)...');
    const { count: deliveriesCount, error: deliveriesError } = await supabase
      .schema('telemetry')
      .from('webhook_delivery_logs')
      .select('*', { count: 'exact', head: true });

    if (deliveriesError) {
      console.error('❌ Query 3 failed:', {
        message: deliveriesError.message,
        code: deliveriesError.code,
      });
    } else {
      console.log('✅ Query 3 success, total deliveries count:', deliveriesCount);
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('====================');
    if (!webhooksError && !activeError && !unhealthyError && !deliveriesError) {
      console.log('✅ ALL TESTS PASSED - Webhooks stats should work!');
      console.log('Expected stats:', {
        active: activeCount || 0,
        unhealthy: unhealthyCount || 0,
        total_deliveries: deliveriesCount || 0,
      });
      console.log('\n💡 If you still see errors in dashboard:');
      console.log('   1. Refresh the dashboard page');
      console.log('   2. Check browser console for other errors');
      console.log('   3. Verify SUPABASE_ANON_KEY has correct permissions');
    } else {
      console.log('❌ SOME TESTS FAILED - Check errors above');
      console.log('\nNext steps:');
      console.log('1. Fix any missing columns shown above');
      console.log('2. Check RLS policies (may need to disable for development)');
      console.log('3. Verify telemetry schema is accessible');
    }

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
  }

  console.groupEnd();
}

// Alternative: Test với columns có tên khác (legacy check)
export async function verifyWebhooksSchemaAlternative() {
  console.group('🔍 Alternative Column Names Check (Legacy)');

  // Common alternative column names (for reference only)
  const alternativeNames = {
    is_active: ['is_active', 'enabled', 'is_enabled', 'active'],
    failure_count: ['failure_count', 'failed_count', 'failures'],
    success_count: ['success_count', 'successful_count', 'successes'],
  };

  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Cannot query webhooks:', error);
      console.groupEnd();
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  Table is empty - cannot check columns');
      console.groupEnd();
      return;
    }

    const actualColumns = Object.keys(data[0]);
    console.log('📋 Actual columns in table:', actualColumns);

    // Check for each required column
    console.log('\n🔍 Checking for alternative names:');
    
    for (const [required, alternatives] of Object.entries(alternativeNames)) {
      const found = alternatives.find(alt => actualColumns.includes(alt));
      if (found) {
        if (found === required) {
          console.log(`✅ ${required}: Found (exact match)`);
        } else {
          console.log(`⚠️  ${required}: Found as "${found}" (different name)`);
        }
      } else {
        console.log(`❌ ${required}: NOT FOUND (tried: ${alternatives.join(', ')})`);
      }
    }

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
  }

  console.groupEnd();
}
