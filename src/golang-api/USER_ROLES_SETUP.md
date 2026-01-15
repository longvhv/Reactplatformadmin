# 🔐 User Roles Module - Setup Guide

## ✅ Files Created (3 files - <500 lines each)

### Backend (Golang)
- `/golang-api/handlers/user_roles_handler.go` - 360 lines ✅

### Frontend (TypeScript/React)  
- `/api/userRolesApi.ts` - 130 lines ✅
- `/pages/UserRolesPage.tsx` - 340 lines ✅
- `/components/user-roles/UserRoleDialog.tsx` - 230 lines ✅
- `/modules/user-roles/index.tsx` - 30 lines ✅

## 📊 Database Schema

```sql
CREATE TABLE user_roles (
    _id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(_id),
    role_id UUID NOT NULL REFERENCES roles(_id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(_id),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    UNIQUE(user_id, role_id) WHERE deleted_at IS NULL
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id) WHERE deleted_at IS NULL;
```

## 🚀 Register Routes in Golang

```go
import "your-project/handlers"

func setupRoutes(router *gin.Engine, db *sql.DB) {
    userRoleHandler := handlers.NewUserRoleHandler(db)
    
    v1 := router.Group("/api/v1")
    {
        userRoles := v1.Group("/user-roles")
        {
            userRoles.GET("", userRoleHandler.GetAll)           // List with filters
            userRoles.GET("/:id", userRoleHandler.GetByID)      // Get by ID
            userRoles.POST("", userRoleHandler.Create)          // Create
            userRoles.PATCH("/:id", userRoleHandler.Update)     // Update
            userRoles.DELETE("/:id", userRoleHandler.Delete)    // Delete (soft)
            userRoles.POST("/bulk-assign", userRoleHandler.BulkAssign) // Bulk assign
        }
    }
}
```

## 🎯 Features

### ✅ CRUD Operations
- List user roles (with filters: user_id, role_id, is_active)
- Get user role by ID
- Create user role (validate unique user_id + role_id)
- Update user role (is_active, expires_at, assigned_by)
- Delete user role (soft delete)
- Bulk assign multiple roles to user

### ✅ Validation
- Unique constraint: user_id + role_id
- Required fields: user_id, role_id
- Optional: expires_at, assigned_by

### ✅ UI Features
- Stats cards (Total, Active, Inactive, Expired)
- Search (user email, name, role name, slug)
- Filter (All, Active, Inactive)
- Table view with joined data
- Create/Edit dialog with dropdowns
- Delete confirmation
- Expired role badge

## 📝 API Examples

### 1. List User Roles
```bash
curl http://localhost:8080/api/v1/user-roles

# Filter by user
curl http://localhost:8080/api/v1/user-roles?user_id=xxx

# Filter by role
curl http://localhost:8080/api/v1/user-roles?role_id=xxx

# Filter active only
curl http://localhost:8080/api/v1/user-roles?is_active=true
```

### 2. Create User Role
```bash
curl -X POST http://localhost:8080/api/v1/user-roles \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "660e8400-e29b-41d4-a716-446655440001",
    "is_active": true,
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

### 3. Update User Role
```bash
curl -X PATCH http://localhost:8080/api/v1/user-roles/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

### 4. Delete User Role
```bash
curl -X DELETE http://localhost:8080/api/v1/user-roles/{id}
```

### 5. Bulk Assign Roles
```bash
curl -X POST http://localhost:8080/api/v1/user-roles/bulk-assign \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_ids": ["role1", "role2", "role3"]
  }'
```

## ✅ Code Quality (SonarQube)

### ✅ No Code Duplication
- Kế thừa pattern từ RolesPage
- Reuse Dialog components
- Shared API pattern

### ✅ File Size < 500 Lines
- user_roles_handler.go: 360 lines ✅
- UserRolesPage.tsx: 340 lines ✅
- UserRoleDialog.tsx: 230 lines ✅
- userRolesApi.ts: 130 lines ✅

### ✅ Clean Code
- Clear function names
- Single responsibility
- Error handling
- Type safety
- Comments

## 🎨 UI Screenshots

```
┌─────────────────────────────────────────────────┐
│ 🔐 Phân quyền người dùng                        │
├─────────────────────────────────────────────────┤
│ Stats:                                          │
│ [Tổng: 45] [Hoạt động: 42] [Vô hiệu: 3] [Hết hạn: 2] │
├─────────────────────────────────────────────────┤
│ [Search] [All] [Active] [Inactive] [+ Thêm]    │
├─────────────────────────────────────────────────┤
│ User        │ Role      │ Status  │ Assigned  │ Actions │
│ John Doe    │ Admin     │ Active  │ 01/15/24  │ [Edit] [Delete] │
│ jane@e.com  │ admin     │         │           │         │
└─────────────────────────────────────────────────┘
```

## 📍 Navigation

- Sidebar: "Phân quyền" menu (UserCog icon)
- URL: `/core/user-roles`
- Position: After "Users", before "Help"

## 🔄 Complete Flow

1. User clicks "Phân quyền" in sidebar
2. Page loads user roles from Supabase
3. Shows stats (total, active, inactive, expired)
4. User can search/filter
5. Click "+ Thêm phân quyền"
6. Dialog opens with user/role dropdowns
7. Select user, role, optional expiry
8. Submit → API creates record in Supabase
9. Success toast + table refreshes
10. User can edit (change is_active, expires_at)
11. User can delete (soft delete)

## ✅ Status

- Backend: ✅ Ready (360 lines)
- Frontend: ✅ Ready (600 lines total)
- Database: ⏳ Need to create table
- Routes: ⏳ Need to register
- Testing: ⏳ Need to test

**Next:** Register routes & create table!
