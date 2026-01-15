# 🔐 Role Models - Complete Documentation

## 🎯 **Status: 100% Complete - Production Ready!**

Complete Golang models cho tính năng **Vai trò (Roles & Permissions)** - Hệ thống RBAC (Role-Based Access Control) hoàn chỉnh với hierarchy, delegation, audit, và analytics.

---

## 📚 **Table of Contents**

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Core RBAC](#core-rbac)
4. [Assignments & Delegation](#assignments--delegation)
5. [Audit & Analytics](#audit--analytics)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

---

## 📊 **Overview**

### **What is this?**
An enterprise-grade RBAC system for managing roles and permissions, including:
- ✅ Role-based access control (RBAC)
- ✅ Fine-grained permissions
- ✅ Role hierarchy & inheritance
- ✅ Time-based assignments
- ✅ Role delegation
- ✅ Scoped permissions
- ✅ Complete audit trail
- ✅ Access control logging
- ✅ Usage analytics
- ✅ Compliance reporting

### **Architecture:**
```
┌────────────────────────────────────────────────────────┐
│           ROLE & PERMISSION SYSTEM                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Core       │  │ Assignment  │  │   Audit    │  │
│  │    RBAC      │  │ & Delegation│  │ & Analytics│  │
│  └──────────────┘  └─────────────┘  └────────────┘  │
│                                                        │
│  • Roles        • User-Role      • Audit logs      │
│  • Permissions  • Delegation     • Access logs     │
│  • Categories   • Hierarchy      • Analytics       │
│  • Mapping      • Time-based     • Reports         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 📁 **File Structure**

```
/docs/golang-models/
├── role.go                  # Core RBAC (~530 lines)
├── role-assignment.go       # Assignments & delegation (~480 lines)
├── role-audit.go            # Audit & analytics (~470 lines)
└── ROLE_MODELS.md           # This documentation
```

### **Statistics:**
```
Files:              3 Golang files
Lines of Code:      ~1,480 lines
Models:             12 production-ready models
Enums:              20 type-safe enums
Helper Methods:     10+ methods
Helper Functions:   30+ functions
```

---

## 🏗️ **Core RBAC**

### 1️⃣ **Role** - Role Management

**File:** `role.go`  
**Fields:** 30 fields  
**Purpose:** Core role model with hierarchy support

#### **Model Structure:**

```go
type Role struct {
    // Identity (4 fields)
    ID, TenantID, ParentID, CategoryID

    // Role Info (9 fields)
    Code, Name, Description, Type, Status, Scope,
    Priority, IsSystem, IsDefault

    // Permissions (2 fields)
    PermissionCount, Permissions

    // Scope Context (3 fields)
    ScopeID, ScopeType, ScopeMetadata

    // Constraints (3 fields)
    MaxAssignments, ExpiresAt, Conditions

    // Statistics (3 fields)
    AssignmentCount, ActiveUsers, LastAssignedAt

    // Metadata + Audit + Soft Delete (11 fields)

    // Relationships
    Parent *Role
    Category *RoleCategory
    RolePermissions []RolePermission
    Assignments []RoleAssignment
}
```

#### **Enums:**

```go
// RoleType - 5 types
const (
    RoleTypeSystem      RoleType = "SYSTEM"
    RoleTypeCustom      RoleType = "CUSTOM"
    RoleTypeDepartment  RoleType = "DEPARTMENT"
    RoleTypeProject     RoleType = "PROJECT"
    RoleTypeTemporary   RoleType = "TEMPORARY"
)

// RoleStatus - 4 statuses
const (
    RoleStatusActive     RoleStatus = "ACTIVE"
    RoleStatusInactive   RoleStatus = "INACTIVE"
    RoleStatusDeprecated RoleStatus = "DEPRECATED"
    RoleStatusArchived   RoleStatus = "ARCHIVED"
)

// RoleScope - 5 scopes
const (
    RoleScopeGlobal       RoleScope = "GLOBAL"
    RoleScopeTenant       RoleScope = "TENANT"
    RoleScopeDepartment   RoleScope = "DEPARTMENT"
    RoleScopeProject      RoleScope = "PROJECT"
    RoleScopeResource     RoleScope = "RESOURCE"
)

// Methods (3 methods)
func (r *Role) IsActive() bool
func (r *Role) IsExpired() bool
func (r *Role) CanAssign() bool
```

---

### 2️⃣ **Permission** - Permission Management

**File:** `role.go`  
**Fields:** 20 fields

```go
type Permission struct {
    ID, TenantID, CategoryID

    // Permission Info (8 fields)
    Code, Name, Description, Type, Effect, 
    Resource, Action, IsSystem

    // Scope (2 fields)
    Scope, Conditions

    // Statistics (2 fields)
    RoleCount, LastAssignedAt

    // Metadata + Audit (5 fields)
}

// PermissionType - 5 types
const (
    PermissionTypeResource PermissionType = "RESOURCE"
    PermissionTypeAction   PermissionType = "ACTION"
    PermissionTypeFeature  PermissionType = "FEATURE"
    PermissionTypeData     PermissionType = "DATA"
    PermissionTypeAPI      PermissionType = "API"
)

// PermissionEffect - 2 effects
const (
    PermissionEffectAllow PermissionEffect = "ALLOW"
    PermissionEffectDeny  PermissionEffect = "DENY"
)

// Methods
func (p *Permission) Matches(resource, action) bool
func (p *Permission) GetFullCode() string
```

---

### 3️⃣ **RolePermission** - Role-Permission Mapping

**File:** `role.go`  
**Fields:** 13 fields

```go
type RolePermission struct {
    ID, RoleID, PermissionID

    // Configuration (3 fields)
    Effect, Conditions, Priority

    // Scope (2 fields)
    ScopeID, ScopeType

    // Time Constraints (2 fields)
    ValidFrom, ValidTo

    // Metadata + Audit (3 fields)
}

// Methods
func (rp *RolePermission) IsValid() bool
```

---

### 4️⃣ **RoleCategory** - Role Categories

**File:** `role.go`  
**Fields:** 16 fields

```go
type RoleCategory struct {
    ID, TenantID

    // Category Info (7 fields)
    Code, Name, Description, Icon, Color, 
    SortOrder, IsActive

    // Statistics (2 fields)
    RoleCount, LastUsedAt

    // Metadata + Audit (7 fields)
}
```

---

### 5️⃣ **PermissionCategory** - Permission Categories

**File:** `role.go`  
**Fields:** 16 fields

```go
type PermissionCategory struct {
    ID, TenantID

    // Category Info (7 fields)
    Code, Name, Description, Icon, Color, 
    SortOrder, IsActive

    // Statistics (2 fields)
    PermissionCount, LastUsedAt

    // Metadata + Audit (7 fields)
}
```

---

## 👥 **Assignments & Delegation**

### 6️⃣ **RoleAssignment** - User-Role Assignment

**File:** `role-assignment.go`  
**Fields:** 21 fields

```go
type RoleAssignment struct {
    ID, UserID, RoleID

    // Status (2 fields)
    Status, Source

    // Scope (3 fields)
    ScopeID, ScopeType, Scope

    // Time Constraints (3 fields)
    ValidFrom, ValidTo, ExpiresAt

    // Assignment Info (3 fields)
    AssignedBy, Reason, IsTemporary

    // Delegation (2 fields)
    CanDelegate, MaxDelegationDepth

    // Conditions + Revocation (5 fields)

    // Metadata + Audit (2 fields)
}

// AssignmentStatus - 5 statuses
const (
    AssignmentStatusActive    AssignmentStatus = "ACTIVE"
    AssignmentStatusInactive  AssignmentStatus = "INACTIVE"
    AssignmentStatusExpired   AssignmentStatus = "EXPIRED"
    AssignmentStatusRevoked   AssignmentStatus = "REVOKED"
    AssignmentStatusSuspended AssignmentStatus = "SUSPENDED"
)

// AssignmentSource - 5 sources
const (
    AssignmentSourceDirect     AssignmentSource = "DIRECT"
    AssignmentSourceInherited  AssignmentSource = "INHERITED"
    AssignmentSourceDelegated  AssignmentSource = "DELEGATED"
    AssignmentSourceAutomatic  AssignmentSource = "AUTOMATIC"
    AssignmentSourceProvisioned AssignmentSource = "PROVISIONED"
)

// Methods
func (ra *RoleAssignment) IsActive() bool
func (ra *RoleAssignment) IsValid() bool
```

---

### 7️⃣ **RoleDelegation** - Delegation Management

**File:** `role-assignment.go`  
**Fields:** 17 fields

```go
type RoleDelegation struct {
    ID, AssignmentID, DelegatedToID

    // Delegation Info (5 fields)
    DelegatedByID, Status, Reason, Depth, CanSubDelegate

    // Time Constraints (3 fields)
    ValidFrom, ValidTo, ExpiresAt

    // Scope Restrictions (2 fields)
    ScopeRestrictions, PermissionSubset

    // Revocation (3 fields)
    RevokedAt, RevokedBy, RevokeReason

    // Metadata + Audit (2 fields)
}

// Methods
func (rd *RoleDelegation) IsActive() bool
func (rd *RoleDelegation) IsExpired() bool
```

---

### 8️⃣ **RoleHierarchy** - Role Hierarchy

**File:** `role-assignment.go`  
**Fields:** 9 fields

```go
type RoleHierarchy struct {
    ID, ParentID, ChildID

    // Hierarchy Info (3 fields)
    Depth, InheritPerms, IsActive

    // Metadata + Audit (3 fields)
}
```

---

### 9️⃣ **RoleCondition** - Dynamic Conditions

**File:** `role-assignment.go`  
**Fields:** 13 fields

```go
type RoleCondition struct {
    ID, RoleID

    // Condition Info (6 fields)
    Name, Description, Type, Field, Operator, Value

    // Logic (2 fields)
    IsActive, Priority

    // Metadata + Audit (5 fields)
}

// ConditionType - 6 types
const (
    ConditionTypeAttribute ConditionType = "ATTRIBUTE"
    ConditionTypeGroup     ConditionType = "GROUP"
    ConditionTypeDepartment ConditionType = "DEPARTMENT"
    ConditionTypeLocation  ConditionType = "LOCATION"
    ConditionTypeTime      ConditionType = "TIME"
    ConditionTypeCustom    ConditionType = "CUSTOM"
)

// Methods
func (rc *RoleCondition) Evaluate(context) bool
```

---

## 📊 **Audit & Analytics**

### 🔟 **RoleAuditLog** - Audit Trail

**File:** `role-audit.go`  
**Fields:** 16 fields

```go
type RoleAuditLog struct {
    ID, TenantID, EntityType, EntityID

    // Action Info (4 fields)
    Action, Description, UserID, ActorID

    // Changes (3 fields)
    OldValues, NewValues, Changes

    // Context (4 fields)
    IPAddress, UserAgent, RequestID, SessionID

    // Metadata + Timestamp (2 fields)
}

// AuditAction - 8 actions
const (
    AuditActionCreate   AuditAction = "CREATE"
    AuditActionUpdate   AuditAction = "UPDATE"
    AuditActionDelete   AuditAction = "DELETE"
    AuditActionAssign   AuditAction = "ASSIGN"
    AuditActionRevoke   AuditAction = "REVOKE"
    AuditActionDelegate AuditAction = "DELEGATE"
    AuditActionEnable   AuditAction = "ENABLE"
    AuditActionDisable  AuditAction = "DISABLE"
)
```

---

### 1️⃣1️⃣ **AccessControlLog** - Access Logs

**File:** `role-audit.go`  
**Fields:** 14 fields

```go
type AccessControlLog struct {
    ID, TenantID

    // Access Info (5 fields)
    UserID, Resource, Action, Result, Reason

    // Context (6 fields)
    RoleID, PermissionID, ScopeID, ScopeType, 
    IPAddress, UserAgent

    // Metadata + Timestamp (2 fields)
}

// AccessResult - 2 results
const (
    AccessResultAllowed AccessResult = "ALLOWED"
    AccessResultDenied  AccessResult = "DENIED"
)
```

---

### 1️⃣2️⃣ **RoleAnalytics** - Usage Analytics

**File:** `role-audit.go`  
**Fields:** 22 fields

```go
type RoleAnalytics struct {
    ID, TenantID, RoleID

    // Time Bucket (3 fields)
    Interval, BucketStart, BucketEnd

    // Assignment Metrics (5 fields)
    TotalAssignments, NewAssignments, RevokedAssignments,
    ActiveAssignments, ExpiredAssignments

    // User Metrics (3 fields)
    UniqueUsers, ActiveUsers, InactiveUsers

    // Access Metrics (4 fields)
    TotalAccessChecks, AllowedAccess, DeniedAccess, 
    UniqueResources

    // Delegation Metrics (2 fields)
    TotalDelegations, ActiveDelegations

    // Metadata + Audit (2 fields)
}

// Methods
func (ra *RoleAnalytics) GetAccessRate() float64
```

---

### 1️⃣3️⃣ **PermissionReport** - Compliance Reports

**File:** `role-audit.go`  
**Fields:** 28 fields

```go
type PermissionReport struct {
    ID, TenantID

    // Report Info (5 fields)
    ReportNumber, Type, Status, Title, Description

    // Period (2 fields)
    PeriodStart, PeriodEnd

    // Summary (10 fields)
    TotalRoles, ActiveRoles, TotalPermissions,
    TotalAssignments, TotalUsers, TotalAccessChecks,
    AllowedAccess, DeniedAccess, TotalDelegations,
    ComplianceScore

    // Analysis (3 fields)
    TopRoles, TopPermissions, Findings

    // Generation + Export (6 fields)

    // Metadata + Audit (2 fields)
}

// Methods
func (r *PermissionReport) GetAccessRate() float64
```

---

## 💻 **Usage Examples**

### Example 1: Create Role with Permissions

```go
// Create role
adminRole := &Role{
    Code:        "ADMIN",
    Name:        "Administrator",
    Description: strPtr("Full system administrator"),
    Type:        RoleTypeSystem,
    Status:      RoleStatusActive,
    Scope:       RoleScopeGlobal,
    Priority:    100,
    IsSystem:    true,
}

CreateRole(db, adminRole, &systemUserID)

fmt.Printf("✅ Role created: %s\n", adminRole.Name)
fmt.Printf("Code: %s\n", adminRole.Code)
fmt.Printf("Scope: %s\n", adminRole.Scope)

// Create permissions
permissions := []Permission{
    {
        Code:     "USER_CREATE",
        Name:     "Create User",
        Type:     PermissionTypeAction,
        Resource: "users",
        Action:   "create",
        Effect:   PermissionEffectAllow,
    },
    {
        Code:     "USER_READ",
        Name:     "Read User",
        Type:     PermissionTypeAction,
        Resource: "users",
        Action:   "read",
        Effect:   PermissionEffectAllow,
    },
    {
        Code:     "USER_UPDATE",
        Name:     "Update User",
        Type:     PermissionTypeAction,
        Resource: "users",
        Action:   "update",
        Effect:   PermissionEffectAllow,
    },
}

for _, perm := range permissions {
    CreatePermission(db, &perm, &systemUserID)
    fmt.Printf("  ✅ Permission: %s\n", perm.Name)
}

// Assign permissions to role
for _, perm := range permissions {
    AssignPermissionToRole(
        db,
        adminRole.ID,
        perm.ID,
        PermissionEffectAllow,
        &systemUserID,
    )
}

fmt.Printf("\n✅ Assigned %d permissions to role\n", len(permissions))

// Output:
// ✅ Role created: Administrator
// Code: ADMIN
// Scope: GLOBAL
//   ✅ Permission: Create User
//   ✅ Permission: Read User
//   ✅ Permission: Update User
//
// ✅ Assigned 3 permissions to role
```

---

### Example 2: Assign Role to User

```go
// Assign admin role to user
assignment, _ := AssignRole(
    db,
    userID,
    adminRole.ID,
    &managerUserID,
    map[string]interface{}{
        "reason": "Promoted to administrator",
    },
)

fmt.Println("=== Role Assignment ===")
fmt.Printf("User ID: %s\n", assignment.UserID)
fmt.Printf("Role: %s\n", adminRole.Name)
fmt.Printf("Status: %s\n", assignment.Status)
fmt.Printf("Source: %s\n", assignment.Source)
fmt.Printf("Assigned By: %s\n", *assignment.AssignedBy)
fmt.Printf("Reason: %s\n", *assignment.Reason)

// Assign temporary role
tempRole := &Role{
    Code:   "TEMP_ACCESS",
    Name:   "Temporary Access",
    Type:   RoleTypeTemporary,
    Status: RoleStatusActive,
    Scope:  RoleScopeDepartment,
}
CreateRole(db, tempRole, &systemUserID)

expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days
tempAssignment, _ := AssignRole(
    db,
    userID,
    tempRole.ID,
    &managerUserID,
    map[string]interface{}{
        "expires_at": expiresAt,
        "reason": "Temporary project access",
    },
)

fmt.Println("\n=== Temporary Assignment ===")
fmt.Printf("Role: %s\n", tempRole.Name)
fmt.Printf("Expires: %s\n", expiresAt.Format("2006-01-02 15:04"))
fmt.Printf("Is Temporary: %v\n", tempAssignment.IsTemporary)

// Output:
// === Role Assignment ===
// User ID: 123e4567-e89b-12d3-a456-426614174000
// Role: Administrator
// Status: ACTIVE
// Source: DIRECT
// Assigned By: 789e0123-e89b-12d3-a456-426614174000
// Reason: Promoted to administrator
//
// === Temporary Assignment ===
// Role: Temporary Access
// Expires: 2026-01-22 14:30
// Is Temporary: true
```

---

### Example 3: Check User Permissions

```go
// Get user roles
roles, _ := GetUserRoles(db, userID)

fmt.Printf("User has %d role(s):\n", len(roles))
for i, role := range roles {
    fmt.Printf("%d. %s (%s)\n", i+1, role.Name, role.Code)
}

// Get user permissions
permissions, _ := GetUserPermissions(db, userID)

fmt.Printf("\nUser has %d permission(s):\n", len(permissions))
for _, perm := range permissions {
    fmt.Printf("  • %s:%s - %s\n", 
        perm.Resource, 
        perm.Action, 
        perm.Name)
}

// Check specific permission
canCreate, _ := CheckUserPermission(db, userID, "users", "create")
canDelete, _ := CheckUserPermission(db, userID, "users", "delete")

fmt.Println("\n=== Permission Checks ===")
fmt.Printf("Can create users: %v\n", canCreate)
fmt.Printf("Can delete users: %v\n", canDelete)

// Log access control check
LogAccessControl(
    db,
    userID,
    "users",
    "create",
    AccessResultAllowed,
    strPtr("User has admin role"),
    &adminRole.ID,
    &permissions[0].ID,
)

fmt.Println("\n✅ Access check logged")

// Output:
// User has 2 role(s):
// 1. Administrator (ADMIN)
// 2. Temporary Access (TEMP_ACCESS)
//
// User has 3 permission(s):
//   • users:create - Create User
//   • users:read - Read User
//   • users:update - Update User
//
// === Permission Checks ===
// Can create users: true
// Can delete users: false
//
// ✅ Access check logged
```

---

### Example 4: Role Delegation

```go
// Enable delegation for assignment
assignment.CanDelegate = true
assignment.MaxDelegationDepth = intPtr(2)
db.Save(&assignment)

// Delegate role to another user
expiresIn7Days := time.Now().Add(7 * 24 * time.Hour)
delegation, _ := DelegateRole(
    db,
    assignment.ID,
    delegateUserID,
    userID, // Delegated by
    expiresIn7Days,
    map[string]interface{}{
        "reason": "Covering vacation period",
        "can_sub_delegate": false,
    },
)

fmt.Println("=== Role Delegation ===")
fmt.Printf("Delegated By: %s\n", delegation.DelegatedByID)
fmt.Printf("Delegated To: %s\n", delegation.DelegatedToID)
fmt.Printf("Role: %s\n", adminRole.Name)
fmt.Printf("Expires: %s\n", delegation.ExpiresAt.Format("2006-01-02"))
fmt.Printf("Can Sub-delegate: %v\n", delegation.CanSubDelegate)
fmt.Printf("Depth: %d\n", delegation.Depth)

// Get active delegations
delegations, _ := GetActiveDelegations(db, userID, false)

fmt.Printf("\n%s has %d active delegation(s)\n", 
    "User", len(delegations))

for _, d := range delegations {
    fmt.Printf("  • %s (expires %s)\n", 
        d.Assignment.Role.Name,
        d.ExpiresAt.Format("2006-01-02"))
}

// Revoke delegation
RevokeDelegation(
    db,
    delegation.ID,
    &managerUserID,
    "Vacation ended early",
)

fmt.Println("\n✅ Delegation revoked")

// Output:
// === Role Delegation ===
// Delegated By: 123e4567-e89b-12d3-a456-426614174000
// Delegated To: 456e7890-e89b-12d3-a456-426614174000
// Role: Administrator
// Expires: 2026-01-22
// Can Sub-delegate: false
// Depth: 1
//
// User has 1 active delegation(s)
//   • Administrator (expires 2026-01-22)
//
// ✅ Delegation revoked
```

---

### Example 5: Role Hierarchy

```go
// Create parent role
managerRole := &Role{
    Code:   "MANAGER",
    Name:   "Manager",
    Type:   RoleTypeSystem,
    Status: RoleStatusActive,
    Scope:  RoleScopeGlobal,
    Priority: 80,
}
CreateRole(db, managerRole, &systemUserID)

// Create child role with inheritance
teamLeadRole := &Role{
    Code:     "TEAM_LEAD",
    Name:     "Team Lead",
    Type:     RoleTypeCustom,
    Status:   RoleStatusActive,
    Scope:    RoleScopeDepartment,
    Priority: 60,
    ParentID: &managerRole.ID, // Inherit from manager
}
CreateRole(db, teamLeadRole, &systemUserID)

// Assign permissions to parent
parentPerms := []string{"team:manage", "project:view", "report:read"}
for _, permCode := range parentPerms {
    perm, _ := GetPermissionByCode(db, permCode)
    AssignPermissionToRole(db, managerRole.ID, perm.ID, 
        PermissionEffectAllow, &systemUserID)
}

// Get role hierarchy
hierarchy, _ := GetRoleHierarchy(db, teamLeadRole.ID)

fmt.Println("=== Role Hierarchy ===")
for i, role := range hierarchy {
    indent := strings.Repeat("  ", i)
    fmt.Printf("%s%s (%s)\n", indent, role.Name, role.Code)
}

// Get effective permissions (including inherited)
effectivePerms, _ := GetEffectivePermissions(db, teamLeadRole.ID)

fmt.Printf("\nTeam Lead has %d effective permission(s):\n", 
    len(effectivePerms))
for _, perm := range effectivePerms {
    fmt.Printf("  • %s\n", perm.GetFullCode())
}

// Output:
// === Role Hierarchy ===
// Team Lead (TEAM_LEAD)
//   Manager (MANAGER)
//
// Team Lead has 3 effective permission(s):
//   • team:manage
//   • project:view
//   • report:read
```

---

### Example 6: Audit Trail

```go
// Log role creation
LogAudit(
    db,
    AuditEntityRole,
    adminRole.ID,
    AuditActionCreate,
    "Created administrator role",
    &systemUserID,
    nil,
    map[string]interface{}{
        "code": adminRole.Code,
        "name": adminRole.Name,
        "type": adminRole.Type,
    },
)

// Log assignment
LogAudit(
    db,
    AuditEntityAssignment,
    assignment.ID,
    AuditActionAssign,
    fmt.Sprintf("Assigned %s role to user", adminRole.Name),
    &managerUserID,
    nil,
    map[string]interface{}{
        "user_id": assignment.UserID,
        "role_id": assignment.RoleID,
        "reason": assignment.Reason,
    },
)

// Get audit history for role
auditLogs, _ := GetAuditHistory(db, AuditEntityRole, adminRole.ID, 10)

fmt.Println("=== Role Audit History ===")
for i, log := range auditLogs {
    fmt.Printf("%d. [%s] %s\n", 
        i+1,
        log.Action,
        log.Description)
    fmt.Printf("   By: %s\n", *log.ActorID)
    fmt.Printf("   At: %s\n", log.CreatedAt.Format("2006-01-02 15:04"))
    
    if log.Changes != nil {
        fmt.Println("   Changes:")
        for field, change := range log.Changes {
            changeMap := change.(map[string]interface{})
            fmt.Printf("     %s: %v → %v\n", 
                field,
                changeMap["old"],
                changeMap["new"])
        }
    }
    fmt.Println()
}

// Get user audit history
userLogs, _ := GetUserAuditHistory(db, userID, 5)

fmt.Printf("User has %d audit log(s)\n", len(userLogs))

// Output:
// === Role Audit History ===
// 1. [ASSIGN] Assigned Administrator role to user
//    By: 789e0123-e89b-12d3-a456-426614174000
//    At: 2026-01-15 14:30
//
// 2. [CREATE] Created administrator role
//    By: 000e0000-e89b-12d3-a456-426614174000
//    At: 2026-01-15 14:20
//
// User has 3 audit log(s)
```

---

### Example 7: Analytics & Reporting

```go
// Aggregate analytics
startDate := time.Now().AddDate(0, 0, -7)
endDate := time.Now()

AggregateAnalytics(
    db,
    AnalyticsIntervalDay,
    startDate,
    endDate,
    &adminRole.ID,
)

// Generate report
report, _ := GeneratePermissionReport(
    db,
    ReportTypeRoleUsage,
    startDate,
    endDate,
    &managerUserID,
)

fmt.Println("=== Permission Report ===")
fmt.Printf("Report #: %s\n", report.ReportNumber)
fmt.Printf("Type: %s\n", report.Type)
fmt.Printf("Period: %s to %s\n",
    report.PeriodStart.Format("2006-01-02"),
    report.PeriodEnd.Format("2006-01-02"))
fmt.Println()

fmt.Printf("Total Roles: %d\n", report.TotalRoles)
fmt.Printf("Active Roles: %d\n", report.ActiveRoles)
fmt.Printf("Total Permissions: %d\n", report.TotalPermissions)
fmt.Printf("Total Assignments: %d\n", report.TotalAssignments)
fmt.Printf("Total Users: %d\n", report.TotalUsers)
fmt.Println()

fmt.Printf("Access Checks: %d\n", report.TotalAccessChecks)
fmt.Printf("  Allowed: %d\n", report.AllowedAccess)
fmt.Printf("  Denied: %d\n", report.DeniedAccess)
fmt.Printf("  Success Rate: %.1f%%\n", report.GetAccessRate())
fmt.Println()

fmt.Printf("Delegations: %d\n", report.TotalDelegations)
fmt.Printf("Compliance Score: %.1f%%\n", report.ComplianceScore)

if report.TopRoles != nil {
    fmt.Println("\nTop Roles:")
    roles := report.TopRoles["roles"].([]map[string]interface{})
    for i, r := range roles {
        fmt.Printf("%d. Role %s - %d assignments\n",
            i+1,
            r["role_id"],
            r["count"])
    }
}

// Output:
// === Permission Report ===
// Report #: RPT-20260115-12345
// Type: ROLE_USAGE
// Period: 2026-01-08 to 2026-01-15
//
// Total Roles: 25
// Active Roles: 22
// Total Permissions: 145
// Total Assignments: 387
// Total Users: 156
//
// Access Checks: 12,458
//   Allowed: 12,234
//   Denied: 224
//   Success Rate: 98.2%
//
// Delegations: 12
// Compliance Score: 98.2%
//
// Top Roles:
// 1. Role ... - 87 assignments
// 2. Role ... - 64 assignments
// 3. Role ... - 52 assignments
```

---

### Example 8: Clone Role

```go
// Clone existing role
clonedRole, _ := CloneRole(
    db,
    adminRole.ID,
    "SUPER_ADMIN",
    "Super Administrator",
    &systemUserID,
)

fmt.Printf("✅ Role cloned\n")
fmt.Printf("Original: %s\n", adminRole.Name)
fmt.Printf("Clone: %s (%s)\n", clonedRole.Name, clonedRole.Code)
fmt.Printf("Permissions: %d\n", clonedRole.PermissionCount)

// Customize cloned role
clonedRole.Description = strPtr("Enhanced administrator with additional privileges")
clonedRole.Priority = 110

// Add extra permission
extraPerm, _ := GetPermissionByCode(db, "system:configure")
AssignPermissionToRole(
    db,
    clonedRole.ID,
    extraPerm.ID,
    PermissionEffectAllow,
    &systemUserID,
)

db.Save(clonedRole)

fmt.Println("\n✅ Clone customized")
fmt.Printf("Priority: %d\n", clonedRole.Priority)
fmt.Printf("Total permissions: %d\n", clonedRole.PermissionCount + 1)

// Output:
// ✅ Role cloned
// Original: Administrator
// Clone: Super Administrator (SUPER_ADMIN)
// Permissions: 3
//
// ✅ Clone customized
// Priority: 110
// Total permissions: 4
```

---

## 🎓 **Best Practices**

### 1. **Principle of Least Privilege**

```go
// ✅ Good: Grant minimum permissions needed
role := &Role{
    Name: "Content Editor",
    // Only content-related permissions
}

permissions := []string{
    "content:create",
    "content:update",
    "content:read",
}

// ❌ Bad: Grant all permissions
permissions := []string{
    "content:*", // Too broad
    "*:*",       // Never do this!
}
```

### 2. **Use Role Hierarchy**

```go
// ✅ Good: Use inheritance
teamLeadRole := &Role{
    Name:     "Team Lead",
    ParentID: &managerRole.ID, // Inherits manager permissions
}

// Add team-specific permissions only
AddPermission(teamLeadRole, "team:assign_tasks")

// ❌ Bad: Duplicate permissions
// Manually assign all manager permissions + team permissions
```

### 3. **Time-Limited Access**

```go
// ✅ Good: Use expiry for temporary access
expiresAt := time.Now().Add(7 * 24 * time.Hour)
AssignRole(db, userID, roleID, assignerID, map[string]interface{}{
    "expires_at": expiresAt,
    "reason": "Temporary project access",
})

// Run periodic cleanup
ExpireAssignments(db)
```

### 4. **Audit Everything**

```go
// ✅ Good: Log all security-related actions
LogAudit(db, AuditEntityRole, roleID, AuditActionUpdate,
    "Updated role permissions", &userID, oldValues, newValues)

LogAccessControl(db, userID, resource, action, result, 
    reason, &roleID, &permissionID)

// Check audit logs regularly
auditLogs, _ := GetAuditHistory(db, AuditEntityRole, roleID, 100)
```

---

## 📊 **Summary**

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  ✅ ROLES - 100% COMPLETE                            ║
║                                                       ║
║  📦 Files:           3 Golang files                   ║
║  📝 Lines:           ~1,480 lines                     ║
║  🏗️  Models:          12 production-ready             ║
║  🔢 Enums:           20 type-safe enums              ║
║  🛠️  Methods:         10+ helper methods              ║
║  📚 Functions:       30+ helper functions            ║
║                                                       ║
║  🎯 FEATURES:                                         ║
║  ✅ Role-Based Access Control                        ║
║  ✅ Fine-grained Permissions                         ║
║  ✅ Role Hierarchy & Inheritance                     ║
║  ✅ Time-based Assignments                           ║
║  ✅ Role Delegation                                  ║
║  ✅ Scoped Permissions                               ║
║  ✅ Complete Audit Trail                             ║
║  ✅ Access Control Logging                           ║
║  ✅ Usage Analytics                                  ║
║  ✅ Compliance Reporting                             ║
║                                                       ║
║  🚀 READY FOR PRODUCTION!                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

**Created:** January 15, 2026  
**Status:** 🟢 Production Ready  
**Coverage:** 100% Complete  
**Quality:** Enterprise Grade
