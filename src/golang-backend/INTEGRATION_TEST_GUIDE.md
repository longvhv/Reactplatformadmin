# 🔗 INTEGRATION TEST GUIDE - GOLANG BACKEND

**Complete guide for writing and running integration tests with real database**

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Writing Integration Tests](#writing-integration-tests)
4. [Database Management](#database-management)
5. [Running Tests](#running-tests)
6. [Best Practices](#best-practices)

---

## 🎯 OVERVIEW

### What are Integration Tests?

Integration tests verify that multiple components work together correctly:
- Service + Database interaction
- Service + Redis cache
- Service + External APIs
- Complete request/response flow

### Differences from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **Dependencies** | Mocked | Real (DB, Redis, etc.) |
| **Speed** | Fast (<3 min) | Slower (5-10 min) |
| **Scope** | Single function | Multiple components |
| **Setup** | Simple mocks | Database, services |
| **Isolation** | Complete | Partial |
| **When to Run** | Every commit | Before merge/deploy |

### Current Status

✅ **Unit Tests:** 56/56 services (100%)  
🎯 **Integration Tests:** Next phase  
📊 **Coverage Target:** 80%+ for critical flows

---

## 🛠️ TEST ENVIRONMENT SETUP

### Prerequisites

```bash
# Install required tools
brew install postgresql@15    # or apt-get install postgresql-15
brew install redis            # or apt-get install redis
go install github.com/pressly/goose/v3/cmd/goose@latest
```

### Environment Variables

Create `.env.test`:

```bash
# Database
DATABASE_URL=postgres://test_user:test_pass@localhost:5432/vhv_test?sslmode=disable
DATABASE_MAX_CONNS=25
DATABASE_MAX_IDLE_CONNS=10

# Redis
REDIS_URL=redis://localhost:6379/1
REDIS_MAX_CONNS=50

# Application
GO_ENV=test
JWT_SECRET=test-secret-key-do-not-use-in-production
API_PORT=8081

# External Services (use test/staging endpoints)
STRIPE_API_KEY=sk_test_...
SENDGRID_API_KEY=SG.test...
```

### Docker Compose for Tests

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    container_name: vhv_postgres_test
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
      POSTGRES_DB: vhv_test
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    container_name: vhv_redis_test
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_test_data:
```

### Start Test Services

```bash
# Start test database and redis
docker-compose -f docker-compose.test.yml up -d

# Wait for health checks
docker-compose -f docker-compose.test.yml ps

# Run migrations
goose -dir ./migrations postgres "$DATABASE_URL" up
```

---

## ✍️ WRITING INTEGRATION TESTS

### Project Structure

```
golang-backend/
├── internal/
│   ├── service/
│   │   ├── region_service.go
│   │   ├── region_service_test.go          # Unit tests
│   │   └── region_service_integration_test.go  # Integration tests
│   ├── repository/
│   │   ├── region_repository.go
│   │   └── region_repository_integration_test.go
│   └── api/
│       ├── region_handler.go
│       └── region_handler_integration_test.go
└── tests/
    ├── integration/
    │   ├── testutil/                # Test utilities
    │   │   ├── database.go          # DB test helpers
    │   │   ├── fixtures.go          # Test data
    │   │   └── assertions.go        # Custom assertions
    │   └── scenarios/               # Full scenario tests
    │       ├── user_registration_test.go
    │       └── subscription_flow_test.go
```

### Test Helper - Database Setup

Create `tests/integration/testutil/database.go`:

```go
package testutil

import (
    "context"
    "database/sql"
    "fmt"
    "testing"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

var testDB *sqlx.DB

// SetupTestDB initializes test database
func SetupTestDB(t *testing.T) *sqlx.DB {
    t.Helper()

    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        t.Fatal("DATABASE_URL not set")
    }

    db, err := sqlx.Connect("postgres", dbURL)
    if err != nil {
        t.Fatalf("Failed to connect to test database: %v", err)
    }

    db.SetMaxOpenConns(10)
    db.SetMaxIdleConns(5)

    testDB = db
    return db
}

// CleanupTestDB cleans up test database
func CleanupTestDB(t *testing.T) {
    t.Helper()

    if testDB == nil {
        return
    }

    // Truncate all tables in reverse order
    tables := []string{
        "user_roles",
        "tenant_members",
        "users",
        "tenants",
        "regions",
        // ... add all tables
    }

    ctx := context.Background()
    for _, table := range tables {
        _, err := testDB.ExecContext(ctx, fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
        if err != nil {
            t.Logf("Warning: Failed to truncate %s: %v", table, err)
        }
    }
}

// TruncateTable truncates a specific table
func TruncateTable(t *testing.T, db *sqlx.DB, table string) {
    t.Helper()

    _, err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
    if err != nil {
        t.Fatalf("Failed to truncate table %s: %v", table, err)
    }
}

// BeginTx starts a transaction for testing
func BeginTx(t *testing.T, db *sqlx.DB) *sqlx.Tx {
    t.Helper()

    tx, err := db.Beginx()
    if err != nil {
        t.Fatalf("Failed to begin transaction: %v", err)
    }

    return tx
}

// RollbackTx rolls back transaction
func RollbackTx(t *testing.T, tx *sqlx.Tx) {
    t.Helper()

    if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
        t.Logf("Failed to rollback transaction: %v", err)
    }
}
```

### Test Helper - Fixtures

Create `tests/integration/testutil/fixtures.go`:

```go
package testutil

import (
    "context"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/jmoiron/sqlx"
    "golang-backend/internal/models"
)

// CreateTestTenant creates a test tenant
func CreateTestTenant(t *testing.T, db *sqlx.DB) *models.Tenant {
    t.Helper()

    tenant := &models.Tenant{
        ID:          uuid.New(),
        Name:        "Test Tenant " + uuid.New().String()[:8],
        Slug:        "test-" + uuid.New().String()[:8],
        Status:      "ACTIVE",
        Plan:        "FREE",
        MaxUsers:    10,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }

    query := `
        INSERT INTO tenants (id, name, slug, status, plan, max_users, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
    _, err := db.Exec(query, tenant.ID, tenant.Name, tenant.Slug, tenant.Status,
        tenant.Plan, tenant.MaxUsers, tenant.CreatedAt, tenant.UpdatedAt)
    if err != nil {
        t.Fatalf("Failed to create test tenant: %v", err)
    }

    return tenant
}

// CreateTestUser creates a test user
func CreateTestUser(t *testing.T, db *sqlx.DB, tenantID uuid.UUID) *models.User {
    t.Helper()

    user := &models.User{
        ID:        uuid.New(),
        TenantID:  tenantID,
        Email:     "test-" + uuid.New().String()[:8] + "@example.com",
        Username:  "user_" + uuid.New().String()[:8],
        Status:    "ACTIVE",
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }

    query := `
        INSERT INTO users (id, tenant_id, email, username, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
    _, err := db.Exec(query, user.ID, user.TenantID, user.Email, user.Username,
        user.Status, user.CreatedAt, user.UpdatedAt)
    if err != nil {
        t.Fatalf("Failed to create test user: %v", err)
    }

    return user
}

// CreateTestRegion creates a test region
func CreateTestRegion(t *testing.T, db *sqlx.DB, parentID *uuid.UUID) *models.Region {
    t.Helper()

    region := &models.Region{
        ID:          uuid.New(),
        Code:        "TEST-" + uuid.New().String()[:8],
        Name:        "Test Region",
        Type:        "COUNTRY",
        ParentID:    parentID,
        DisplayOrder: 0,
        IsActive:    true,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }

    query := `
        INSERT INTO regions (id, code, name, type, parent_id, display_order, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    _, err := db.Exec(query, region.ID, region.Code, region.Name, region.Type,
        region.ParentID, region.DisplayOrder, region.IsActive, region.CreatedAt, region.UpdatedAt)
    if err != nil {
        t.Fatalf("Failed to create test region: %v", err)
    }

    return region
}
```

### Example Integration Test - Repository

Create `internal/repository/region_repository_integration_test.go`:

```go
// +build integration

package repository

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "golang-backend/tests/integration/testutil"
)

func TestRegionRepository_Integration(t *testing.T) {
    // Setup
    db := testutil.SetupTestDB(t)
    defer testutil.CleanupTestDB(t)

    repo := NewRegionRepository(db)
    ctx := context.Background()

    t.Run("Create and Get", func(t *testing.T) {
        // Clean before test
        testutil.TruncateTable(t, db, "regions")

        // Create region
        region := testutil.CreateTestRegion(t, db, nil)

        // Get by ID
        found, err := repo.GetByID(ctx, region.ID)

        // Assert
        require.NoError(t, err)
        assert.NotNil(t, found)
        assert.Equal(t, region.ID, found.ID)
        assert.Equal(t, region.Name, found.Name)
        assert.Equal(t, region.Code, found.Code)
    })

    t.Run("List with Pagination", func(t *testing.T) {
        testutil.TruncateTable(t, db, "regions")

        // Create multiple regions
        for i := 0; i < 5; i++ {
            testutil.CreateTestRegion(t, db, nil)
        }

        // List with pagination
        regions, total, err := repo.List(ctx, 2, 0)

        // Assert
        require.NoError(t, err)
        assert.Len(t, regions, 2)
        assert.Equal(t, int64(5), total)
    })

    t.Run("Update Region", func(t *testing.T) {
        testutil.TruncateTable(t, db, "regions")

        // Create region
        region := testutil.CreateTestRegion(t, db, nil)

        // Update
        region.Name = "Updated Name"
        err := repo.Update(ctx, region)
        require.NoError(t, err)

        // Verify
        updated, err := repo.GetByID(ctx, region.ID)
        require.NoError(t, err)
        assert.Equal(t, "Updated Name", updated.Name)
    })

    t.Run("Delete Region", func(t *testing.T) {
        testutil.TruncateTable(t, db, "regions")

        // Create region
        region := testutil.CreateTestRegion(t, db, nil)

        // Delete
        err := repo.Delete(ctx, region.ID)
        require.NoError(t, err)

        // Verify deleted
        found, err := repo.GetByID(ctx, region.ID)
        assert.Error(t, err)
        assert.Nil(t, found)
    })
}
```

### Example Integration Test - Service

Create `internal/service/region_service_integration_test.go`:

```go
// +build integration

package service

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "golang-backend/internal/repository"
    "golang-backend/tests/integration/testutil"
)

func TestRegionService_Integration(t *testing.T) {
    // Setup
    db := testutil.SetupTestDB(t)
    defer testutil.CleanupTestDB(t)

    repo := repository.NewRegionRepository(db)
    service := NewRegionService(repo)
    ctx := context.Background()

    t.Run("Complete Region Hierarchy", func(t *testing.T) {
        testutil.TruncateTable(t, db, "regions")

        // Create parent region (country)
        parent := testutil.CreateTestRegion(t, db, nil)

        // Create child region (state)
        child := testutil.CreateTestRegion(t, db, &parent.ID)

        // Get hierarchy
        hierarchy, err := service.GetHierarchy(ctx, parent.ID)

        // Assert
        require.NoError(t, err)
        assert.NotNil(t, hierarchy)
        assert.Len(t, hierarchy.Children, 1)
        assert.Equal(t, child.ID, hierarchy.Children[0].ID)
    })

    t.Run("Business Rule: Cannot Delete Region with Children", func(t *testing.T) {
        testutil.TruncateTable(t, db, "regions")

        // Create parent and child
        parent := testutil.CreateTestRegion(t, db, nil)
        testutil.CreateTestRegion(t, db, &parent.ID)

        // Try to delete parent
        err := service.DeleteRegion(ctx, parent.ID)

        // Should fail
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "has children")
    })
}
```

---

## 🗄️ DATABASE MANAGEMENT

### Running Migrations

```bash
# Up migrations
goose -dir ./migrations postgres "$DATABASE_URL" up

# Down migrations
goose -dir ./migrations postgres "$DATABASE_URL" down

# Reset database
goose -dir ./migrations postgres "$DATABASE_URL" reset

# Status
goose -dir ./migrations postgres "$DATABASE_URL" status
```

### Test Data Seeds

Create `tests/integration/seeds/seed.go`:

```go
package seeds

import (
    "github.com/jmoiron/sqlx"
    "golang-backend/tests/integration/testutil"
)

func SeedBasicData(db *sqlx.DB) error {
    // Seed regions
    // Seed categories
    // Seed system data
    return nil
}

func SeedTestUsers(db *sqlx.DB, count int) error {
    // Create test users
    return nil
}
```

---

## 🚀 RUNNING TESTS

### Using Build Tags

```bash
# Run only integration tests
go test -tags=integration ./...

# Run unit tests (exclude integration)
go test -short ./...

# Run all tests
go test ./...
```

### With Make

Add to `Makefile.mk`:

```makefile
test-integration: ## Run integration tests
	@echo "Starting test services..."
	@docker-compose -f docker-compose.test.yml up -d
	@sleep 5
	@echo "Running migrations..."
	@goose -dir ./migrations postgres "$(TEST_DATABASE_URL)" up
	@echo "Running integration tests..."
	@go test -tags=integration -v ./...
	@docker-compose -f docker-compose.test.yml down

test-integration-keep: ## Run integration tests (keep services running)
	@echo "Running integration tests..."
	@go test -tags=integration -v ./...

test-all: test test-integration ## Run all tests
```

### Run Commands

```bash
# Run integration tests
make test-integration

# Keep services running for faster iteration
docker-compose -f docker-compose.test.yml up -d
make test-integration-keep

# Run specific integration test
go test -tags=integration -v -run TestRegionRepository_Integration ./internal/repository/

# With coverage
go test -tags=integration -coverprofile=coverage-integration.out ./...
```

---

## 📋 BEST PRACTICES

### 1. Test Isolation

```go
// ✅ Good: Clean state before each test
t.Run("test case", func(t *testing.T) {
    testutil.TruncateTable(t, db, "regions")
    // test code
})

// ❌ Bad: Shared state between tests
func TestRegions(t *testing.T) {
    // No cleanup - tests depend on each other
}
```

### 2. Use Transactions

```go
// ✅ Good: Use transaction for rollback
t.Run("test case", func(t *testing.T) {
    tx := testutil.BeginTx(t, db)
    defer testutil.RollbackTx(t, tx)
    
    // test code with tx
})
```

### 3. Test Data Factories

```go
// ✅ Good: Use helper functions
tenant := testutil.CreateTestTenant(t, db)
user := testutil.CreateTestUser(t, db, tenant.ID)

// ❌ Bad: Manual data creation in each test
tenant := &models.Tenant{/* lots of fields */}
db.Exec(/* complex query */)
```

### 4. Meaningful Test Names

```go
// ✅ Good
t.Run("Create_ValidInput_Success", func(t *testing.T) { })
t.Run("Delete_WithChildren_ReturnsError", func(t *testing.T) { })

// ❌ Bad
t.Run("test1", func(t *testing.T) { })
t.Run("error_case", func(t *testing.T) { })
```

### 5. Check Both Success and Failure

```go
t.Run("Success case", func(t *testing.T) {
    result, err := service.Method(valid)
    require.NoError(t, err)
    assert.NotNil(t, result)
})

t.Run("Validation error", func(t *testing.T) {
    result, err := service.Method(invalid)
    assert.Error(t, err)
    assert.Nil(t, result)
})
```

---

## 📊 COVERAGE TRACKING

### Separate Coverage Reports

```bash
# Unit test coverage
go test -coverprofile=coverage-unit.out ./...

# Integration test coverage
go test -tags=integration -coverprofile=coverage-integration.out ./...

# Merge coverage reports
gocovmerge coverage-unit.out coverage-integration.out > coverage-total.out
```

---

## 🎯 NEXT STEPS

1. ✅ Unit tests complete (56/56)
2. 🎯 Write integration tests for critical services
3. 🎯 Add E2E API tests
4. 🎯 Performance testing
5. 🎯 Production deployment

---

**Guide Version:** 1.0  
**Last Updated:** 2026-01-23  
**Status:** Ready for implementation
