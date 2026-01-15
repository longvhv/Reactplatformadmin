# Service Packages - Use Cases & Business Scenarios

## 📋 Overview

This document describes real-world use cases and business scenarios for the **Service Packages** module.

---

## 🎯 Use Case Categories

1. **Package Management** - Creating and managing subscription tiers
2. **Pricing Strategy** - Different pricing models and strategies
3. **Entitlements Configuration** - Setting up features and limits
4. **Public Pricing Page** - Displaying packages to customers
5. **Subscription Flow** - Package selection and checkout
6. **Package Lifecycle** - Status changes and archiving
7. **Analytics & Reporting** - Package performance metrics

---

## 1. Package Management

### UC-1.1: Create Tiered Pricing (Starter, Pro, Enterprise)

**Scenario:** Admin creates 3-tier pricing for HRM product

**Steps:**
1. Create Starter package (entry-level)
2. Create Professional package (mid-tier)
3. Create Enterprise package (premium)

**Implementation:**

```typescript
// Create Starter Package
const starterPackage = {
  saas_product_id: 'hrm-product-uuid',
  code: 'hrm-starter',
  name: 'HRM Starter',
  description: 'Perfect for small businesses (1-10 employees)',
  price_amount: 990000,
  currency_code: 'VND',
  billing_cycle: 'MONTHLY',
  display_order: 1,
  trial_days: 7,
  max_users: 10,
  max_storage: 10,
  entitlements_config: {
    apps: {
      hrm: {
        enabled: true,
        features: {
          employee_management: true,
          attendance: true,
          payroll: false,
          advanced_reports: false
        }
      }
    }
  },
  features: {
    highlighted: ['Email Support', 'Basic Attendance Tracking'],
    included: {
      support_level: 'email',
      sla_response: '48h'
    }
  },
  status: 'ACTIVE',
  is_public: true
};

// Create Professional Package
const proPackage = {
  saas_product_id: 'hrm-product-uuid',
  code: 'hrm-professional',
  name: 'HRM Professional',
  description: 'Best for growing companies (11-50 employees)',
  price_amount: 2990000,
  currency_code: 'VND',
  billing_cycle: 'MONTHLY',
  display_order: 2,
  trial_days: 14,
  max_users: 50,
  max_storage: 100,
  entitlements_config: {
    apps: {
      hrm: {
        enabled: true,
        features: {
          employee_management: true,
          attendance: true,
          payroll: true,
          advanced_reports: true,
          performance_review: true
        }
      }
    }
  },
  features: {
    highlighted: ['Priority Support', 'Payroll Module', 'Advanced Analytics'],
    badge: 'Most Popular',
    included: {
      support_level: 'priority',
      sla_response: '24h'
    }
  },
  status: 'ACTIVE',
  is_public: true
};

// Create Enterprise Package
const enterprisePackage = {
  saas_product_id: 'hrm-product-uuid',
  code: 'hrm-enterprise',
  name: 'HRM Enterprise',
  description: 'For large organizations (50+ employees)',
  price_amount: 9990000,
  currency_code: 'VND',
  billing_cycle: 'MONTHLY',
  display_order: 3,
  trial_days: 30,
  max_users: null, // Unlimited
  max_storage: null, // Unlimited
  entitlements_config: {
    apps: {
      hrm: {
        enabled: true,
        features: {
          employee_management: true,
          attendance: true,
          payroll: true,
          advanced_reports: true,
          performance_review: true,
          recruitment: true,
          ai_insights: true
        }
      }
    }
  },
  features: {
    highlighted: ['24/7 Support', 'Dedicated Account Manager', 'Custom Integrations'],
    included: {
      support_level: 'dedicated',
      sla_response: '1h',
      sla_uptime: '99.99%'
    }
  },
  status: 'ACTIVE',
  is_public: true
};
```

---

### UC-1.2: Create Bundle Package (Multiple Apps)

**Scenario:** Create "Business Suite" package with HRM + CRM + Accounting

```typescript
const businessSuite = {
  code: 'business-suite-pro',
  name: 'Business Suite Professional',
  price_amount: 4990000, // Cheaper than buying separately
  entitlements_config: {
    apps: {
      hrm: {
        enabled: true,
        features: { /* all HRM features */ }
      },
      crm: {
        enabled: true,
        features: { /* all CRM features */ }
      },
      accounting: {
        enabled: true,
        features: { /* all Accounting features */ }
      }
    },
    shared_quotas: {
      users: 50,
      storage_gb: 200,
      api_calls_per_month: 500000
    }
  },
  metadata: {
    bundle_discount: 0.30, // 30% off
    included_apps: ['hrm', 'crm', 'accounting']
  }
};
```

---

## 2. Pricing Strategy

### UC-2.1: Freemium Model

**Scenario:** Free tier with limited features to attract users

```typescript
const freePackage = {
  code: 'hrm-free',
  name: 'HRM Free Forever',
  price_amount: 0,
  trial_days: 0, // No trial, always free
  max_users: 3,
  max_storage: 1,
  entitlements_config: {
    apps: {
      hrm: {
        enabled: true,
        features: {
          employee_management: true,
          attendance: false,
          payroll: false
        },
        limits: {
          max_employees: 3,
          export_limit_per_month: 10
        }
      }
    }
  },
  features: {
    highlighted: ['Forever Free', 'Up to 3 Employees'],
    limitations: ['Community Support Only', 'No Payroll', 'Limited Exports']
  }
};
```

### UC-2.2: Annual Billing with Discount

```typescript
const proAnnual = {
  code: 'hrm-pro-annual',
  name: 'HRM Professional (Annual)',
  price_amount: 29900000, // 2 months free (10 * 2,990,000)
  currency_code: 'VND',
  billing_cycle: 'YEARLY',
  metadata: {
    monthly_equivalent: 2990000,
    savings: 5980000,
    discount_percentage: 0.17 // 17% off
  }
};
```

### UC-2.3: Usage-Based Pricing

```typescript
const payPerUserPackage = {
  code: 'hrm-pay-per-user',
  name: 'HRM Pay Per User',
  price_amount: 99000, // Per user per month
  metadata: {
    pricing_model: 'per_user',
    minimum_users: 5,
    price_per_additional_user: 99000
  }
};
```

---

## 3. Entitlements Configuration

### UC-3.1: Feature Gating

**Scenario:** Different features available in different tiers

```typescript
// Starter: Basic features only
entitlements_config: {
  apps: {
    hrm: {
      features: {
        employee_management: true,
        attendance: true,
        payroll: false, // ❌ Not available
        advanced_reports: false // ❌ Not available
      }
    }
  }
}

// Professional: Add payroll
entitlements_config: {
  apps: {
    hrm: {
      features: {
        employee_management: true,
        attendance: true,
        payroll: true, // ✅ Available
        advanced_reports: true // ✅ Available
      }
    }
  }
}
```

### UC-3.2: Quota Management

```typescript
entitlements_config: {
  shared_quotas: {
    users: 50,
    storage_gb: 100,
    api_calls_per_month: 100000,
    email_sends_per_month: 10000,
    report_exports_per_month: 500
  }
}
```

---

## 4. Public Pricing Page

### UC-4.1: Display Active Public Packages

**SQL Query:**
```sql
SELECT * FROM service_packages
WHERE status = 'ACTIVE' 
  AND is_public = TRUE 
  AND deleted_at IS NULL
ORDER BY display_order ASC;
```

**UI Display:**
```
┌─────────────┬──────────────────┬────────────────────┐
│   Starter   │   Professional   │    Enterprise      │
├─────────────┼──────────────────┼────────────────────┤
│ 990,000đ/mo │  2,990,000đ/mo   │   9,990,000đ/mo    │
│             │  [Most Popular]  │                    │
│ • 10 users  │  • 50 users      │  • Unlimited users │
│ • 10GB      │  • 100GB         │  • Unlimited       │
│ • Basic     │  • Priority      │  • 24/7 Support    │
└─────────────┴──────────────────┴────────────────────┘
```

---

## 5. Subscription Flow

### UC-5.1: Customer Selects Package

**Flow:**
1. Customer browses pricing page
2. Clicks "Get Started" on Professional package
3. System creates subscription with package snapshot

```typescript
const subscription = {
  tenant_id: customer.tenant_id,
  package_id: proPackage._id,
  // Snapshot of package at purchase time
  package_snapshot: {
    code: proPackage.code,
    name: proPackage.name,
    price_amount: proPackage.price_amount,
    entitlements_config: proPackage.entitlements_config
  },
  price_amount: proPackage.price_amount,
  currency_code: proPackage.currency_code,
  billing_cycle: proPackage.billing_cycle,
  start_date: new Date(),
  trial_end_date: addDays(new Date(), proPackage.trial_days),
  status: 'trial'
};
```

### UC-5.2: Grandfather Pricing

**Scenario:** Price increases, but existing customers keep old price

```typescript
// Admin increases price
await updatePackage('hrm-pro', {
  price_amount: 3490000, // Increased from 2,990,000
  version: currentVersion
});

// Existing subscriptions still pay old price
const existingSubscription = {
  package_id: 'hrm-pro-uuid',
  package_snapshot: {
    price_amount: 2990000 // Old price preserved
  }
};

// New subscriptions pay new price
const newSubscription = {
  package_id: 'hrm-pro-uuid',
  package_snapshot: {
    price_amount: 3490000 // New price
  }
};
```

---

## 6. Package Lifecycle

### UC-6.1: Sunset Old Package

**Scenario:** Discontinue old package, redirect to new one

```typescript
// Step 1: Mark old package as INACTIVE
await updatePackage('hrm-classic', {
  status: 'INACTIVE',
  is_public: false,
  metadata: {
    sunset_date: '2025-06-30',
    replacement_package: 'hrm-professional'
  }
});

// Step 2: Notify existing subscribers
// Step 3: After grace period, archive package
await updatePackage('hrm-classic', {
  status: 'ARCHIVED'
});
```

### UC-6.2: Limited Time Offer

```typescript
const blackFridayPackage = {
  code: 'hrm-pro-bf2025',
  name: 'HRM Pro - Black Friday 2025',
  price_amount: 1990000, // 33% off
  is_public: true,
  metadata: {
    promotion: 'black_friday_2025',
    original_price: 2990000,
    expires_at: '2025-11-30T23:59:59Z'
  }
};

// After expiry, set to INACTIVE
```

---

## 7. Analytics & Reporting

### UC-7.1: Package Performance Dashboard

```sql
-- Most popular packages
SELECT 
  sp.code,
  sp.name,
  COUNT(ts._id) as subscription_count,
  SUM(ts.price_amount) as total_revenue
FROM service_packages sp
LEFT JOIN tenant_subscriptions ts ON ts.package_id = sp._id
WHERE sp.deleted_at IS NULL
GROUP BY sp._id
ORDER BY subscription_count DESC;
```

### UC-7.2: Conversion Rate by Package

```sql
-- Trial to paid conversion
SELECT 
  sp.name,
  COUNT(CASE WHEN ts.status = 'trial' THEN 1 END) as trials,
  COUNT(CASE WHEN ts.status = 'active' THEN 1 END) as active,
  ROUND(
    COUNT(CASE WHEN ts.status = 'active' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(CASE WHEN ts.status = 'trial' THEN 1 END), 0),
    2
  ) as conversion_rate
FROM service_packages sp
LEFT JOIN tenant_subscriptions ts ON ts.package_id = sp._id
GROUP BY sp.name;
```

---

## 🎯 Advanced Scenarios

### Scenario 1: A/B Testing Different Prices

```typescript
// Create variant A
const variantA = {
  code: 'hrm-pro-test-a',
  name: 'HRM Pro',
  price_amount: 2490000,
  is_public: false, // Not on main page
  metadata: { ab_test: 'price_test_2025_01', variant: 'A' }
};

// Create variant B
const variantB = {
  code: 'hrm-pro-test-b',
  name: 'HRM Pro',
  price_amount: 3490000,
  is_public: false,
  metadata: { ab_test: 'price_test_2025_01', variant: 'B' }
};

// Show different prices to different user segments
```

### Scenario 2: Enterprise Custom Pricing

```typescript
const enterpriseCustom = {
  code: 'enterprise-custom-acme-corp',
  name: 'Enterprise Custom - ACME Corp',
  price_amount: 25000000, // Negotiated price
  is_public: false, // Hidden from pricing page
  entitlements_config: {
    // Custom entitlements per contract
  },
  metadata: {
    contract_id: 'CONTRACT-2025-001',
    account_manager: 'john.doe@company.com',
    custom_terms: true
  }
};
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
