# Schema Compliance Documentation - Navigation Guide

**Last Updated:** 2026-01-15  
**Purpose:** Central hub for all schema compliance checks and fixes

---

## 📚 Quick Navigation

### 🔍 Compliance Checks
1. [Service Packages Check](/docs/CHECK-2026-01-15-service-packages-schema-compliance.md) - 85/100 score
2. [Subscription Invoices Check](/docs/CHECK-2026-01-15-subscription-invoices-schema-compliance.md) - 65/100 score
3. [Comparison Report](/docs/COMPARISON-schema-compliance-checks.md) - Side-by-side analysis

### 🔧 Bugfix Plans
1. [Service Packages Gaps](/docs/bugfix/CHECK-2026-01-15-service-packages-schema-gaps.md) - Detailed fix plan
2. [Subscription Invoices Gaps](/docs/bugfix/CHECK-2026-01-15-subscription-invoices-schema-gaps.md) - Step-by-step migration
3. [Subscription Invoices Summary](/docs/bugfix/SUMMARY-subscription-invoices-fixes.md) - Quick reference

### 📖 Database Schema References
1. [Service Packages DB Schema](/docs/developer/service-packages-erd-diagram.md)
2. [Subscription Invoices DB Schema](/docs/developer/subscription-invoices-database-schema.md)
3. [Full Database Schema](/data/database-schema.ts)

---

## 🎯 Current Status (2026-01-15)

### Modules Checked

| Module | Score | Status | Priority | Docs |
|--------|-------|--------|----------|------|
| **Service Packages** | 85/100 | ⚠️ NEEDS FIXES | P1 | [Check](/docs/CHECK-2026-01-15-service-packages-schema-compliance.md) \| [Fixes](/docs/bugfix/CHECK-2026-01-15-service-packages-schema-gaps.md) |
| **Subscription Invoices** | 65/100 | 🔴 CRITICAL | P0 | [Check](/docs/CHECK-2026-01-15-subscription-invoices-schema-compliance.md) \| [Fixes](/docs/bugfix/CHECK-2026-01-15-subscription-invoices-schema-gaps.md) |

### Modules Pending Check
- [ ] Subscription Orders
- [ ] Tenant Subscriptions
- [ ] Digital Assets
- [ ] Products
- [ ] Tenants
- [ ] Users
- [ ] Payment Transactions

---

## 📊 Compliance Score Breakdown

### Service Packages (85/100)
- ✅ **Schema Match:** 90/100 - Minor JSONB structure issues
- ✅ **Type Safety:** 85/100 - Enum value mismatches
- ✅ **Validation:** 85/100 - Good coverage
- ⚠️ **JSONB Handling:** 75/100 - Need field migration

**Key Issues (3):**
1. 🟡 Form fields not in schema (`trial_days`, `max_users`, `max_storage`)
2. 🟡 Billing cycle enum mismatch (missing `DAILY`, `WEEKLY`, `LIFETIME`)
3. 🟠 No `ARCHIVED` status support

### Subscription Invoices (65/100)
- ⚠️ **Schema Match:** 60/100 - Many field mismatches
- ⚠️ **Type Safety:** 50/100 - Deprecated types
- ⚠️ **Validation:** 70/100 - Missing required field validation
- ⚠️ **JSONB Handling:** 75/100 - Needs improvement

**Key Issues (8):**
1. 🔴 `payment_status` field doesn't exist
2. 🔴 Flat fields vs JSONB structure
3. 🔴 `invoice_date` field doesn't exist
4. 🔴 Multiple field name mismatches
5. 🟡 Missing required field validation
6. 🟡 Deprecated types exported
7. 🟠 Wrong JSONB access patterns
8. 🟠 Status case sensitivity

---

## 🚀 Quick Start Guide

### For New Developers

1. **Understand the Problem**
   ```
   Read: /docs/COMPARISON-schema-compliance-checks.md
   Purpose: Get overview of all issues
   Time: 15 minutes
   ```

2. **Pick a Module to Fix**
   ```
   Priority Order:
   1. Subscription Invoices (P0 - CRITICAL)
   2. Service Packages (P1 - HIGH)
   ```

3. **Read the Detailed Fix Plan**
   ```
   For Subscription Invoices:
   → /docs/bugfix/CHECK-2026-01-15-subscription-invoices-schema-gaps.md
   
   For Service Packages:
   → /docs/bugfix/CHECK-2026-01-15-service-packages-schema-gaps.md
   ```

4. **Follow the Implementation Checklist**
   ```
   Each bugfix doc has a comprehensive checklist
   Check off items as you complete them
   ```

5. **Run Tests**
   ```
   See testing sections in bugfix documents
   Ensure all tests pass before PR
   ```

### For Reviewers

1. **Check Compliance Score**
   ```
   Verify score improved from original
   Target: 95+ for both modules
   ```

2. **Verify All Checklist Items**
   ```
   Ensure all items in bugfix doc are completed
   No skipped items without justification
   ```

3. **Test Schema Alignment**
   ```
   Manually verify field names match DB
   Test JSONB structures
   Validate enum values
   ```

4. **Review Breaking Changes**
   ```
   Ensure migration guide is complete
   Backward compatibility considered
   Documentation updated
   ```

---

## 📋 Issue Categories Explained

### 🔴 CRITICAL
**Definition:** Issues causing runtime errors or data corruption  
**Impact:** Application crashes, data loss, API failures  
**SLA:** Fix within 24 hours  
**Examples:**
- Non-existent fields being accessed
- Type errors causing runtime exceptions
- Database constraint violations

### 🟡 HIGH
**Definition:** Issues causing incorrect behavior or poor UX  
**Impact:** Wrong data displayed, validation failures, type confusion  
**SLA:** Fix within 1 week  
**Examples:**
- Field name mismatches (API calls fail)
- Missing validation (bad data persisted)
- Deprecated types causing confusion

### 🟠 MEDIUM
**Definition:** Technical debt or optimization issues  
**Impact:** Code maintainability, developer experience  
**SLA:** Fix within 2 weeks  
**Examples:**
- Inefficient JSONB access patterns
- Missing documentation
- Code duplication

### 🟢 LOW
**Definition:** Minor improvements or polish  
**Impact:** Code quality, consistency  
**SLA:** Fix when convenient  
**Examples:**
- Code style improvements
- Better error messages
- Enhanced documentation

---

## 🔧 Common Patterns & Solutions

### Pattern 1: JSONB Field Misuse

**Problem:**
```typescript
// ❌ Wrong: Using flat fields
invoice.customer_name
invoice.customer_email
```

**Solution:**
```typescript
// ✅ Correct: Using JSONB structure
invoice.billing_info?.customer_name
invoice.billing_info?.customer_email
```

**Modules Affected:** Service Packages, Subscription Invoices

---

### Pattern 2: Field Name Mismatch

**Problem:**
```typescript
// ❌ Wrong: Field name doesn't match DB
invoice.currency
invoice.line_items
```

**Solution:**
```typescript
// ✅ Correct: Match DB schema exactly
invoice.currency_code
invoice.items_snapshot
```

**Modules Affected:** Subscription Invoices

---

### Pattern 3: Non-existent Field

**Problem:**
```typescript
// ❌ Wrong: Field doesn't exist in DB
invoice.payment_status
invoice.invoice_date
```

**Solution:**
```typescript
// ✅ Correct: Use existing fields or derive
const paymentStatus = getPaymentStatus(invoice); // Derived
const invoiceDate = invoice.billing_period_start; // Use existing
```

**Modules Affected:** Subscription Invoices

---

### Pattern 4: Enum Value Mismatch

**Problem:**
```typescript
// ❌ Wrong: Enum values don't match DB
type BillingCycle = 'monthly' | 'quarterly' | 'yearly'; // Missing DAILY, WEEKLY, LIFETIME
```

**Solution:**
```typescript
// ✅ Correct: Complete enum from DB constraint
type BillingCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
```

**Modules Affected:** Service Packages

---

### Pattern 5: Missing Required Validation

**Problem:**
```typescript
// ❌ Wrong: Not validating required fields
if (!invoiceNumber) { /* error */ }
// Missing: billing_period_start, billing_period_end
```

**Solution:**
```typescript
// ✅ Correct: Validate all required fields
if (!invoiceNumber) { errors.invoice_number = 'Required'; }
if (!billingPeriodStart) { errors.billing_period_start = 'Required'; }
if (!billingPeriodEnd) { errors.billing_period_end = 'Required'; }
```

**Modules Affected:** Subscription Invoices

---

## 📈 Progress Tracking

### Sprint 1 Goals (Week 1)
- [ ] Complete Subscription Invoices critical fixes (P0)
- [ ] Target score: 65 → 90
- [ ] All tests passing
- [ ] Documentation updated

### Sprint 2 Goals (Week 2)
- [ ] Complete Service Packages fixes (P1)
- [ ] Polish Subscription Invoices to 95+
- [ ] Target scores: Both modules 95+
- [ ] Migration guides complete

### Future Improvements
- [ ] Automated schema compliance checks
- [ ] TypeScript type generation from DB schema
- [ ] Runtime schema validation
- [ ] Compliance dashboard

---

## 🧪 Testing Guidelines

### Unit Tests Required
```typescript
// 1. Type validation
✓ All fields match DB schema
✓ JSONB structures correct
✓ Enum values match DB constraints

// 2. Field access
✓ JSONB fields accessed safely
✓ Optional chaining used
✓ Default values provided

// 3. Validation
✓ Required fields validated
✓ JSONB structures validated
✓ Business rules enforced
```

### Integration Tests Required
```typescript
// 1. CRUD operations
✓ Create with correct schema
✓ Read with JSONB parsing
✓ Update preserving structure
✓ Delete (soft delete)

// 2. API integration
✓ Request types match DB
✓ Response types match DB
✓ Error handling correct
```

---

## 📚 Related Resources

### Internal Documentation
- [Database Schema](/data/database-schema.ts) - Full schema definition
- [Service Packages ERD](/docs/developer/service-packages-erd-diagram.md)
- [Subscription Invoices ERD](/docs/developer/subscription-invoices-erd-diagram.md)
- [API Reference](/docs/developer/) - All API documentation

### External Resources
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [TypeScript Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [React Hook Form](https://react-hook-form.com/)

---

## 🤝 Contributing

### Adding a New Compliance Check

1. **Run the Check**
   ```
   Compare module code against DB schema
   Document all discrepancies
   Calculate compliance score
   ```

2. **Create Check Document**
   ```
   Use template from existing checks
   Include executive summary
   List all issues with severity
   Calculate scores
   ```

3. **Create Bugfix Plan**
   ```
   Step-by-step fix instructions
   Code examples for each fix
   Testing requirements
   Timeline estimation
   ```

4. **Update This README**
   ```
   Add module to status table
   Update progress tracking
   Link to new documents
   ```

### Document Templates

All compliance check documents should include:
- ✅ Executive Summary with score
- ✅ Database schema reference
- ✅ Issue breakdown by severity
- ✅ Compliance checklist
- ✅ Priority fixes section
- ✅ Score breakdown table

All bugfix documents should include:
- ✅ Overview with effort estimate
- ✅ Issues summary table
- ✅ Detailed fix plans with code
- ✅ Testing strategy
- ✅ Implementation checklist
- ✅ Success criteria

---

## ❓ FAQ

### Q: Why are we doing compliance checks?
**A:** To ensure code exactly matches database schema, preventing runtime errors and data corruption when migrating to Golang microservices.

### Q: What's the target compliance score?
**A:** 95+ for all modules. 100/100 is ideal but 95+ is acceptable for complex modules.

### Q: How often should we run compliance checks?
**A:** 
- After major schema changes: Immediately
- Regular cadence: Every 2 weeks
- Before production deploy: Always

### Q: Who is responsible for fixing compliance issues?
**A:** 
- P0 (Critical): Team lead assigns immediately
- P1 (High): Module owner
- P2 (Medium): Any developer during sprint
- P3 (Low): Nice to have, assign when available

### Q: Can I skip some checklist items?
**A:** Only with team lead approval and documented justification. All P0 items must be completed.

---

## 📞 Support

### Questions?
- **Technical Questions:** Ask in #vhv-platform-dev channel
- **Schema Questions:** Check database schema docs first
- **Urgent Issues:** Contact team lead directly

### Found a Bug in Documentation?
1. Create issue in project tracker
2. Tag with `documentation` label
3. Assign to documentation maintainer

---

**Maintained by:** VHV Platform Team  
**Last Review:** 2026-01-15  
**Next Review:** After Sprint 1 completion (2026-01-22)  
**Status:** 🟢 Active Development
