# Data Access Layer - Implementation Roadmap

Chi tiết từng bước implement với timeline và priorities.

---

## 📅 TIMELINE OVERVIEW

**Total Duration**: 3-4 tuần  
**Effort**: ~80-100 giờ  
**Team Size**: 1-2 developers  

```
Week 1: Foundation & Core Implementation
Week 2: Pilot Migration & Testing  
Week 3: Mass Migration (Hooks)
Week 4: Polish & Documentation
```

---

## 🎯 PHASE 1: FOUNDATION (Week 1, Days 1-2)

### Day 1 Morning: Setup Structure

**Time**: 2-3 giờ

**Tasks**:
1. Tạo folder structure:
   ```
   /lib/data-client/
     ├── types.ts
     ├── SupabaseDataClient.ts
     ├── GolangApiDataClient.ts
     ├── DataClientFactory.ts
     └── __tests__/
   ```

2. Copy code từ plan document:
   - `/docs/DATA_ACCESS_STANDARDIZATION_PLAN.md` sections 1.1-1.4
   - Paste vào files tương ứng

3. Fix imports và dependencies:
   ```typescript
   // Check tất cả imports hoạt động
   npm run build  # hoặc tsc --noEmit
   ```

**Deliverables**:
- ✅ 4 files mới trong `/lib/data-client/`
- ✅ No TypeScript errors
- ✅ Code compiles successfully

---

### Day 1 Afternoon: Configure & Initialize

**Time**: 2-3 giờ

**Tasks**:
1. Update app initialization:
   ```typescript
   // /app/layout.tsx (hoặc _app.tsx)
   
   import { DataClientFactory } from '@/lib/data-client/DataClientFactory';
   import { projectId, publicAnonKey } from '@/utils/supabase/info';

   // Add early in file, before any component
   if (typeof window !== 'undefined') {
     DataClientFactory.configure({
       type: 'supabase',
       supabase: {
         url: `https://${projectId}.supabase.co`,
         anonKey: publicAnonKey,
       },
     });
   }
   ```

2. Create helper exports:
   ```typescript
   // /lib/data-client/index.ts
   
   export { DataClientFactory, getDataClient } from './DataClientFactory';
   export type {
     IDataClient,
     QueryOptions,
     QueryResult,
   } from './types';
   export { SupabaseDataClient } from './SupabaseDataClient';
   export { GolangApiDataClient } from './GolangApiDataClient';
   ```

3. Test initialization:
   ```bash
   npm run dev
   # Check console: [DataClientFactory] Initialized supabase client
   ```

**Deliverables**:
- ✅ DataClientFactory initialized on app start
- ✅ No console errors
- ✅ App runs normally

---

### Day 2: Unit Tests

**Time**: 4-6 giờ

**Tasks**:
1. Setup test framework (nếu chưa có):
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom jest
   ```

2. Create test files:
   ```typescript
   // /lib/data-client/__tests__/SupabaseDataClient.test.ts
   // /lib/data-client/__tests__/DataClientFactory.test.ts
   ```

3. Write basic tests:
   - Factory configuration
   - Client initialization
   - Query building
   - Filter application
   - Error handling

4. Run tests:
   ```bash
   npm test
   ```

**Deliverables**:
- ✅ Test files với >80% coverage
- ✅ All tests passing
- ✅ CI/CD integration (optional)

---

## 🧪 PHASE 2: PILOT MIGRATION (Week 1 Day 3 - Week 2)

### Day 3: Migrate useTenants (Pilot Hook)

**Time**: 3-4 giờ

**Tasks**:
1. Backup current file:
   ```bash
   cp /hooks/useTenants.ts /hooks/useTenants.ts.backup
   ```

2. Rewrite hook theo pattern mới:
   - Replace Supabase client với DataClient
   - Update all CRUD methods
   - Keep caching logic
   - Keep error handling

3. Test thoroughly:
   - Load tenants list
   - Create new tenant
   - Update tenant
   - Delete tenant
   - Filter by status/tier
   - Pagination
   - Error scenarios

4. Compare behavior với old version:
   - Same data returned?
   - Same performance?
   - Same error messages?

**Deliverables**:
- ✅ useTenants migrated
- ✅ All features working
- ✅ No regressions

---

### Day 4: Migrate useTenant (Second Pilot)

**Time**: 2-3 giờ

**Tasks**:
1. Backup file:
   ```bash
   cp /hooks/useTenant.ts /hooks/useTenant.ts.backup
   ```

2. Migrate hook:
   - Replace fetch() với dataClient.get()
   - Update updateTenant method

3. Test:
   - Load single tenant by ID
   - Update tenant details
   - Handle not found (404)
   - Error handling

**Deliverables**:
- ✅ useTenant migrated
- ✅ Works with useTenants
- ✅ All edge cases handled

---

### Day 5: Testing & Validation

**Time**: Full day

**Tasks**:
1. Integration testing:
   - Test tenant management flow end-to-end
   - Create → View → Edit → Delete

2. Performance testing:
   - Compare load times với old version
   - Check memory usage
   - Check network requests

3. Error scenario testing:
   - Network offline
   - API errors
   - Invalid data
   - Permission denied

4. Code review:
   - Review changes với team
   - Address feedback
   - Document learnings

**Deliverables**:
- ✅ Integration tests passing
- ✅ Performance acceptable
- ✅ Error handling robust
- ✅ Code reviewed & approved

---

## 🚀 PHASE 3: MASS MIGRATION (Week 2-3)

### Priority Groups

**Group A: Core Entities** (Week 2, Days 1-2)
- [ ] `useUsers.ts` - User management
- [ ] `useUser.ts` - Single user
- [ ] `useTenantMembers.ts` - Tenant members
- [ ] `useRoles.ts` - Role management
- [ ] `usePermissions.ts` - Permission management

**Estimated**: 2-3 giờ per hook, ~12-15 giờ total

**Group B: Business Entities** (Week 2, Days 3-5)
- [ ] `useProducts.ts`
- [ ] `useServicePackages.ts`
- [ ] `useSubscriptions.ts`
- [ ] `useSubscriptionOrders.ts`
- [ ] `useSubscriptionInvoices.ts`

**Estimated**: 2-3 giờ per hook, ~12-15 giờ total

**Group C: System Entities** (Week 3, Days 1-2)
- [ ] `useSystemJobs.ts`
- [ ] `useWebhooks.ts`
- [ ] `useTrafficLogs.ts`
- [ ] `useApplications.ts`
- [ ] `useAuditLogs.ts`

**Estimated**: 2-3 giờ per hook, ~12-15 giờ total

**Group D: Remaining Hooks** (Week 3, Days 3-5)
- [ ] All other custom hooks (~10-15 hooks)

**Estimated**: 1-2 giờ per hook, ~15-30 giờ total

---

### Migration Process (Per Hook)

**Step 1: Analyze** (15 mins)
- Đọc code hiện tại
- Identify data operations:
  - Query list?
  - Get single?
  - Create?
  - Update?
  - Delete?
  - Custom operations?
- Check dependencies

**Step 2: Backup** (2 mins)
```bash
cp /hooks/useXxx.ts /hooks/useXxx.ts.backup
```

**Step 3: Migrate** (1-2 giờ)
- Replace data access code
- Keep business logic unchanged
- Update error handling if needed
- Add TypeScript generics

**Step 4: Test** (30-60 mins)
- Manual testing in UI
- Check all CRUD operations
- Test error scenarios
- Test loading states

**Step 5: Document** (10 mins)
- Add JSDoc comments if needed
- Update migration log

**Step 6: Commit** (5 mins)
```bash
git add /hooks/useXxx.ts
git commit -m "feat: migrate useXxx to DataClient pattern"
```

---

### Daily Schedule Example

**Morning** (9:00 - 12:00)
- Migrate 2-3 hooks
- Quick testing

**Lunch Break** (12:00 - 13:00)

**Afternoon** (13:00 - 17:00)
- Migrate 1-2 hooks
- Thorough testing
- Fix issues
- Code review prep

**Daily Target**: 3-5 hooks migrated

---

## 🎨 PHASE 4: POLISH & DOCUMENTATION (Week 4)

### Day 1: Integration Testing

**Tasks**:
1. End-to-end testing:
   - Complete user flows
   - Cross-entity operations
   - Permission checks

2. Performance audit:
   - Page load times
   - API call counts
   - Memory usage
   - Bundle size

3. Fix issues:
   - Address bugs found
   - Optimize slow queries
   - Reduce redundant calls

**Deliverables**:
- ✅ All flows tested
- ✅ Performance metrics documented
- ✅ Critical issues fixed

---

### Day 2: Error Handling & Edge Cases

**Tasks**:
1. Error scenario testing:
   - Network timeout
   - 401/403 errors
   - 404 not found
   - 500 server errors
   - Validation errors

2. Edge case testing:
   - Empty states
   - Large datasets
   - Concurrent operations
   - Stale data

3. Improve error messages:
   - User-friendly messages
   - Actionable suggestions
   - Clear error states in UI

**Deliverables**:
- ✅ All error scenarios handled
- ✅ Edge cases covered
- ✅ Error UX improved

---

### Day 3: Code Review & Refactoring

**Tasks**:
1. Self-review:
   - Check consistency
   - Look for duplications
   - Identify optimization opportunities

2. Team review:
   - Present changes to team
   - Gather feedback
   - Address comments

3. Refactoring:
   - Extract common patterns
   - Create utility functions
   - Simplify complex logic

**Deliverables**:
- ✅ Code reviewed
- ✅ Feedback addressed
- ✅ Code quality improved

---

### Day 4: Documentation

**Tasks**:
1. Update existing docs:
   - `/docs/DATA_ACCESS_STANDARDIZATION_PLAN.md`
   - `/docs/DATA_CLIENT_QUICK_START.md`
   - Add examples from actual implementation

2. Create new docs:
   - `/docs/api/DATA_CLIENT_API_REFERENCE.md`
   - `/docs/guides/MIGRATING_HOOKS.md`
   - `/docs/guides/TESTING_DATA_CLIENT.md`

3. Add inline documentation:
   - JSDoc comments
   - Code examples
   - Usage notes

**Deliverables**:
- ✅ Docs updated
- ✅ API reference complete
- ✅ Migration guide ready

---

### Day 5: Deployment Prep & Training

**Tasks**:
1. Deployment checklist:
   - [ ] All tests passing
   - [ ] No console errors
   - [ ] Performance acceptable
   - [ ] Documentation complete
   - [ ] Rollback plan ready

2. Team training:
   - Demo new pattern
   - Q&A session
   - Share best practices
   - Provide examples

3. Monitoring setup:
   - Add logging
   - Setup error tracking
   - Create dashboards

**Deliverables**:
- ✅ Ready for deployment
- ✅ Team trained
- ✅ Monitoring ready

---

## 📊 TRACKING & METRICS

### Migration Progress Tracker

Create a spreadsheet or issue board:

| Hook | Status | Time Spent | Issues | Notes |
|------|--------|------------|--------|-------|
| useTenants | ✅ Done | 3h | - | Pilot hook |
| useTenant | ✅ Done | 2h | - | - |
| useUsers | 🔄 In Progress | 1.5h | #123 | Waiting review |
| useRoles | 📝 Todo | - | - | - |
| ... | | | | |

**Statuses**:
- 📝 Todo
- 🔄 In Progress
- ✅ Done
- ⚠️ Blocked
- ❌ Skipped

---

### Success Metrics

Track these metrics:

**Coverage**:
- [ ] X% hooks migrated (Target: 100%)
- [ ] X% code coverage (Target: >80%)

**Quality**:
- [ ] 0 critical bugs
- [ ] <5 minor bugs
- [ ] All tests passing

**Performance**:
- [ ] Page load time: <target>ms
- [ ] API response time: <target>ms
- [ ] Bundle size increase: <target>KB

**Adoption**:
- [ ] X team members trained
- [ ] X code reviews completed
- [ ] Documentation complete

---

## 🚨 RISK MANAGEMENT

### Risk 1: Breaking Changes

**Probability**: Medium  
**Impact**: High

**Mitigation**:
- Thorough testing before merge
- Feature flags for gradual rollout
- Quick rollback plan

**Rollback Plan**:
```bash
# Revert commits
git revert <commit-hash>

# Or restore backups
cp /hooks/useXxx.ts.backup /hooks/useXxx.ts
```

---

### Risk 2: Performance Degradation

**Probability**: Low  
**Impact**: Medium

**Mitigation**:
- Performance testing during migration
- Caching implementation
- Query optimization

**Monitoring**:
- Setup performance alerts
- Track key metrics
- User feedback

---

### Risk 3: Timeline Slippage

**Probability**: Medium  
**Impact**: Medium

**Mitigation**:
- Buffer time in estimates
- Daily progress tracking
- Prioritize critical hooks

**Contingency**:
- Extend timeline if needed
- Add resources (pair programming)
- Simplify scope (migrate critical hooks first)

---

## ✅ COMPLETION CHECKLIST

### Phase 1: Foundation
- [ ] Data client files created
- [ ] Factory configured
- [ ] Unit tests written
- [ ] Tests passing

### Phase 2: Pilot
- [ ] 2-3 pilot hooks migrated
- [ ] Thoroughly tested
- [ ] Code reviewed
- [ ] No regressions

### Phase 3: Mass Migration
- [ ] All core hooks migrated
- [ ] All business hooks migrated
- [ ] All system hooks migrated
- [ ] All remaining hooks migrated

### Phase 4: Polish
- [ ] Integration testing complete
- [ ] Error handling robust
- [ ] Code reviewed & refactored
- [ ] Documentation complete
- [ ] Team trained

### Deployment
- [ ] All tests passing
- [ ] Performance validated
- [ ] Monitoring setup
- [ ] Rollback plan ready
- [ ] Deployed to production

---

## 🎉 POST-MIGRATION

### Week 5: Monitoring & Support

**Tasks**:
1. Monitor production:
   - Check error rates
   - Track performance
   - Gather user feedback

2. Quick fixes:
   - Address urgent issues
   - Optimize slow queries
   - Improve error messages

3. Documentation updates:
   - Add FAQs
   - Document gotchas
   - Share lessons learned

---

### Long-term Maintenance

**Monthly**:
- Review performance metrics
- Update documentation
- Refactor as needed

**Quarterly**:
- Audit data access patterns
- Identify optimization opportunities
- Plan improvements

---

## 📞 SUPPORT & QUESTIONS

**Questions about migration?**
- Slack: #data-access-migration
- Email: dev-team@company.com
- Docs: `/docs/DATA_CLIENT_QUICK_START.md`

**Found a bug?**
- Create issue: [link to issue tracker]
- Tag: `data-client`, `migration`

**Need help?**
- Pair programming sessions available
- Office hours: Mon/Wed 2-3pm

---

**Good luck with the migration!** 🚀

**Remember**: Slow and steady wins the race. Migrate carefully, test thoroughly, and don't hesitate to ask for help!
