/**
 * Automated Navigation Testing Script
 * 
 * Kiểm tra toàn bộ navigation routes trong ứng dụng
 * để phát hiện các vấn đề về navigation, redirect, và import issues
 */

interface TestRoute {
  path: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  expectedElements?: string[]; // CSS selectors to verify page loaded
}

interface TestResult {
  path: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

// ============================================================================
// TEST ROUTES CONFIGURATION
// ============================================================================

const TEST_ROUTES: TestRoute[] = [
  // ADMIN SECTION - Priority: High
  { path: '/admin/dashboard', category: 'admin', priority: 'high', expectedElements: ['.stats-cards'] },
  { path: '/admin/roles', category: 'admin', priority: 'high', expectedElements: ['table', '.roles-list'] },
  { path: '/admin/roles/create', category: 'admin', priority: 'high', expectedElements: ['form', '.role-form'] },
  { path: '/admin/permissions', category: 'admin', priority: 'high', expectedElements: ['table', '.permissions-table'] },
  { path: '/admin/tenants', category: 'admin', priority: 'high', expectedElements: ['table', '.tenants-table'] },
  { path: '/admin/tenants/create', category: 'admin', priority: 'high', expectedElements: ['form', '.tenant-form'] },
  { path: '/admin/audit-logs', category: 'admin', priority: 'medium', expectedElements: ['table'] },
  { path: '/admin/system-logs', category: 'admin', priority: 'medium', expectedElements: ['table'] },
  { path: '/admin/auth-logs', category: 'admin', priority: 'medium', expectedElements: ['table'] },
  
  // PLATFORM SECTION - Priority: High
  { path: '/platform/users', category: 'platform', priority: 'high', expectedElements: ['table', '.users-table'] },
  { path: '/platform/users/create', category: 'platform', priority: 'high', expectedElements: ['form', '.user-form'] },
  { path: '/platform/roles', category: 'platform', priority: 'high', expectedElements: ['table'] },
  { path: '/platform/roles/create', category: 'platform', priority: 'high', expectedElements: ['form'] },
  { path: '/platform/permissions', category: 'platform', priority: 'high', expectedElements: ['table'] },
  { path: '/platform/permissions/create', category: 'platform', priority: 'medium', expectedElements: ['form'] },
  { path: '/platform/applications', category: 'platform', priority: 'high', expectedElements: ['table'] },
  { path: '/platform/applications/create', category: 'platform', priority: 'medium', expectedElements: ['form'] },
  { path: '/platform/feature-flags', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/webhooks', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/legal-documents', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/notification-templates', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/system-announcements', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/user-consents', category: 'platform', priority: 'low', expectedElements: ['table'] },
  { path: '/platform/user-sessions', category: 'platform', priority: 'low', expectedElements: ['table'] },
  { path: '/platform/user-roles', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/user-devices', category: 'platform', priority: 'low', expectedElements: ['table'] },
  { path: '/platform/user-delegations', category: 'platform', priority: 'low', expectedElements: ['table'] },
  { path: '/platform/tenant-rate-limits', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  { path: '/platform/tenant-subscriptions', category: 'platform', priority: 'medium', expectedElements: ['table'] },
  
  // COMMERCE SECTION - Priority: Medium
  { path: '/commerce/products', category: 'commerce', priority: 'medium', expectedElements: ['table'] },
  { path: '/commerce/products/create', category: 'commerce', priority: 'medium', expectedElements: ['form'] },
  { path: '/commerce/invoices', category: 'commerce', priority: 'medium', expectedElements: ['table'] },
  { path: '/commerce/invoices/create', category: 'commerce', priority: 'medium', expectedElements: ['form'] },
  { path: '/commerce/subscriptions', category: 'commerce', priority: 'medium', expectedElements: ['table'] },
  
  // TOOLS SECTION - Priority: Low
  { path: '/tools/bulk-operations', category: 'tools', priority: 'low', expectedElements: ['form', '.bulk-operations'] },
  { path: '/tools/data-cleanup', category: 'tools', priority: 'low', expectedElements: ['.data-cleanup'] },
  { path: '/tools/import-export', category: 'tools', priority: 'low', expectedElements: ['.import-export'] },
  
  // SETTINGS SECTION - Priority: Medium
  { path: '/settings/general', category: 'settings', priority: 'medium', expectedElements: ['form'] },
  { path: '/settings/security', category: 'settings', priority: 'medium', expectedElements: ['form'] },
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

class NavigationTester {
  private results: TestResult[] = [];
  private errorLog: string[] = [];
  
  /**
   * Wait for navigation to complete
   */
  private async waitForNavigation(timeout = 2000): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }
  
  /**
   * Check if element exists on page
   */
  private elementExists(selector: string): boolean {
    return !!document.querySelector(selector);
  }
  
  /**
   * Check for console errors
   */
  private checkConsoleErrors(): string[] {
    const errors: string[] = [];
    
    // Check if there are navigation-related errors in console
    // This is a simplified check - in real implementation, 
    // you'd need to capture console.error calls
    
    return errors;
  }
  
  /**
   * Test a single route
   */
  async testRoute(route: TestRoute): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log(`🧪 Testing: ${route.path}`);
    
    try {
      // 1. Find and click the navigation link
      const link = document.querySelector(`a[href="${route.path}"]`);
      
      if (!link) {
        errors.push(`Navigation link not found for ${route.path}`);
        return {
          path: route.path,
          passed: false,
          errors,
          warnings,
          duration: Date.now() - startTime,
        };
      }
      
      // 2. Click the link
      (link as HTMLElement).click();
      
      // 3. Wait for navigation
      await this.waitForNavigation(1000);
      
      // 4. Check if URL matches
      if (window.location.pathname !== route.path) {
        errors.push(
          `URL mismatch: expected ${route.path}, got ${window.location.pathname}`
        );
      }
      
      // 5. Check if redirected to dashboard (common issue)
      if (window.location.pathname === '/admin/dashboard' && route.path !== '/admin/dashboard') {
        errors.push(`Redirected to dashboard instead of ${route.path}`);
      }
      
      // 6. Check if expected elements exist
      if (route.expectedElements) {
        for (const selector of route.expectedElements) {
          if (!this.elementExists(selector)) {
            warnings.push(`Expected element not found: ${selector}`);
          }
        }
      }
      
      // 7. Check for console errors
      const consoleErrors = this.checkConsoleErrors();
      if (consoleErrors.length > 0) {
        errors.push(...consoleErrors);
      }
      
      // 8. Check for loading state stuck
      const loadingSpinner = document.querySelector('.animate-spin, .loading');
      if (loadingSpinner) {
        warnings.push('Loading spinner still visible after navigation');
      }
      
    } catch (error: any) {
      errors.push(`Exception during test: ${error.message}`);
    }
    
    const duration = Date.now() - startTime;
    const passed = errors.length === 0;
    
    if (passed) {
      console.log(`✅ ${route.path} - PASSED (${duration}ms)`);
    } else {
      console.error(`❌ ${route.path} - FAILED (${duration}ms)`, errors);
    }
    
    return {
      path: route.path,
      passed,
      errors,
      warnings,
      duration,
    };
  }
  
  /**
   * Run all tests
   */
  async runAllTests(filterPriority?: 'high' | 'medium' | 'low'): Promise<void> {
    console.log('🚀 Starting Navigation Tests...\n');
    
    const routes = filterPriority
      ? TEST_ROUTES.filter(r => r.priority === filterPriority)
      : TEST_ROUTES;
    
    for (const route of routes) {
      const result = await this.testRoute(route);
      this.results.push(result);
      
      // Small delay between tests
      await this.waitForNavigation(500);
    }
    
    this.printReport();
  }
  
  /**
   * Print test report
   */
  private printReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 NAVIGATION TEST REPORT');
    console.log('='.repeat(80) + '\n');
    
    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const passRate = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate}%\n`);
    
    // Category breakdown
    const byCategory = this.groupByCategory();
    console.log('📂 By Category:');
    for (const [category, results] of Object.entries(byCategory)) {
      const categoryPassed = results.filter(r => r.passed).length;
      const categoryTotal = results.length;
      console.log(
        `  ${category}: ${categoryPassed}/${categoryTotal} passed`
      );
    }
    console.log('');
    
    // Failed tests
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`\n  ${test.path}`);
        test.errors.forEach(error => {
          console.log(`    • ${error}`);
        });
      });
      console.log('');
    }
    
    // Tests with warnings
    const testsWithWarnings = this.results.filter(r => r.warnings.length > 0);
    if (testsWithWarnings.length > 0) {
      console.log('⚠️  Tests with Warnings:');
      testsWithWarnings.forEach(test => {
        console.log(`\n  ${test.path}`);
        test.warnings.forEach(warning => {
          console.log(`    • ${warning}`);
        });
      });
      console.log('');
    }
    
    // Performance
    const avgDuration = Math.round(
      this.results.reduce((sum, r) => sum + r.duration, 0) / total
    );
    const slowTests = this.results.filter(r => r.duration > 2000);
    
    console.log('⏱️  Performance:');
    console.log(`  Average Duration: ${avgDuration}ms`);
    if (slowTests.length > 0) {
      console.log(`  Slow Tests (>2s): ${slowTests.length}`);
      slowTests.forEach(test => {
        console.log(`    • ${test.path}: ${test.duration}ms`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  /**
   * Group results by category
   */
  private groupByCategory(): Record<string, TestResult[]> {
    const grouped: Record<string, TestResult[]> = {};
    
    this.results.forEach(result => {
      const route = TEST_ROUTES.find(r => r.path === result.path);
      if (route) {
        if (!grouped[route.category]) {
          grouped[route.category] = [];
        }
        grouped[route.category].push(result);
      }
    });
    
    return grouped;
  }
  
  /**
   * Export results as JSON
   */
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      results: this.results,
    }, null, 2);
  }
}

// ============================================================================
// EXPORT & USAGE
// ============================================================================

export { NavigationTester, TEST_ROUTES };
export type { TestRoute, TestResult };

// Usage in console:
// const tester = new NavigationTester();
// await tester.runAllTests(); // Run all tests
// await tester.runAllTests('high'); // Run only high priority tests
// console.log(tester.exportResults()); // Export results
