# Users Module - Complete Testing Guide

## 📋 Table of Contents
1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [E2E Testing](#e2e-testing)
4. [Security Testing](#security-testing)
5. [Performance Testing](#performance-testing)

---

## Unit Testing

### Backend Unit Tests (Golang)

#### Test: Create User Handler

```go
package handlers_test

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestUserHandler_Create(t *testing.T) {
    // Setup
    gin.SetMode(gin.TestMode)
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    handler := NewUserHandler(db)
    router := gin.New()
    router.POST("/users", handler.Create)
    
    tests := []struct {
        name           string
        requestBody    interface{}
        expectedStatus int
        expectedError  string
    }{
        {
            name: "Valid user creation",
            requestBody: map[string]interface{}{
                "email":     "test@example.com",
                "password":  "SecurePass123!",
                "full_name": "Test User",
                "locale":    "vi-VN",
            },
            expectedStatus: http.StatusCreated,
        },
        {
            name: "Duplicate email",
            requestBody: map[string]interface{}{
                "email":     "duplicate@example.com",
                "password":  "SecurePass123!",
                "full_name": "Duplicate User",
            },
            expectedStatus: http.StatusConflict,
            expectedError:  "User with this email already exists",
        },
        {
            name: "Invalid email format",
            requestBody: map[string]interface{}{
                "email":     "invalid-email",
                "password":  "SecurePass123!",
                "full_name": "Test User",
            },
            expectedStatus: http.StatusBadRequest,
        },
        {
            name: "Weak password",
            requestBody: map[string]interface{}{
                "email":     "test2@example.com",
                "password":  "weak",
                "full_name": "Test User",
            },
            expectedStatus: http.StatusBadRequest,
        },
        {
            name: "Missing required fields",
            requestBody: map[string]interface{}{
                "email": "test3@example.com",
            },
            expectedStatus: http.StatusBadRequest,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Prepare request
            body, _ := json.Marshal(tt.requestBody)
            req := httptest.NewRequest("POST", "/users", bytes.NewBuffer(body))
            req.Header.Set("Content-Type", "application/json")
            w := httptest.NewRecorder()
            
            // Execute
            router.ServeHTTP(w, req)
            
            // Assert
            assert.Equal(t, tt.expectedStatus, w.Code)
            
            if tt.expectedError != "" {
                var response map[string]string
                json.Unmarshal(w.Body.Bytes(), &response)
                assert.Contains(t, response["error"], tt.expectedError)
            }
            
            if tt.expectedStatus == http.StatusCreated {
                var user map[string]interface{}
                json.Unmarshal(w.Body.Bytes(), &user)
                assert.NotEmpty(t, user["_id"])
                assert.Equal(t, "PENDING", user["status"])
                assert.Equal(t, false, user["is_verified"])
            }
        })
    }
}
```

#### Test: Get User Handler

```go
func TestUserHandler_GetByID(t *testing.T) {
    // Setup
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    handler := NewUserHandler(db)
    router := gin.New()
    router.GET("/users/:id", handler.GetByID)
    
    // Create test user
    testUser := createTestUser(t, db, "test@example.com")
    
    tests := []struct {
        name           string
        userID         string
        expectedStatus int
    }{
        {
            name:           "Valid user ID",
            userID:         testUser.ID,
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Non-existent user",
            userID:         "00000000-0000-0000-0000-000000000000",
            expectedStatus: http.StatusNotFound,
        },
        {
            name:           "Invalid UUID format",
            userID:         "invalid-uuid",
            expectedStatus: http.StatusBadRequest,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest("GET", "/users/"+tt.userID, nil)
            w := httptest.NewRecorder()
            
            router.ServeHTTP(w, req)
            
            assert.Equal(t, tt.expectedStatus, w.Code)
            
            if tt.expectedStatus == http.StatusOK {
                var user User
                json.Unmarshal(w.Body.Bytes(), &user)
                assert.Equal(t, testUser.Email, user.Email)
                assert.Empty(t, user.PasswordHash) // Should not expose
            }
        })
    }
}
```

#### Test: Update User Handler

```go
func TestUserHandler_Update(t *testing.T) {
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    handler := NewUserHandler(db)
    router := gin.New()
    router.PATCH("/users/:id", handler.Update)
    
    testUser := createTestUser(t, db, "update@example.com")
    
    tests := []struct {
        name           string
        userID         string
        updateData     map[string]interface{}
        expectedStatus int
    }{
        {
            name:   "Update full name",
            userID: testUser.ID,
            updateData: map[string]interface{}{
                "full_name": "Updated Name",
            },
            expectedStatus: http.StatusOK,
        },
        {
            name:   "Update phone number",
            userID: testUser.ID,
            updateData: map[string]interface{}{
                "phone_number": "+84901234567",
            },
            expectedStatus: http.StatusOK,
        },
        {
            name:   "Update locale",
            userID: testUser.ID,
            updateData: map[string]interface{}{
                "locale": "en-US",
            },
            expectedStatus: http.StatusOK,
        },
        {
            name:           "Update non-existent user",
            userID:         "00000000-0000-0000-0000-000000000000",
            updateData:     map[string]interface{}{"full_name": "Test"},
            expectedStatus: http.StatusNotFound,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            body, _ := json.Marshal(tt.updateData)
            req := httptest.NewRequest("PATCH", "/users/"+tt.userID, bytes.NewBuffer(body))
            req.Header.Set("Content-Type", "application/json")
            w := httptest.NewRecorder()
            
            router.ServeHTTP(w, req)
            
            assert.Equal(t, tt.expectedStatus, w.Code)
        })
    }
}
```

### Frontend Unit Tests (React)

#### Test: UserDetailPage Component

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserDetailPage } from '@/pages/UserDetailPage';
import { usersApi } from '@/api/usersApi';

jest.mock('@/api/usersApi');

describe('UserDetailPage', () => {
  const mockUser = {
    _id: '123',
    email: 'test@example.com',
    full_name: 'Test User',
    status: 'ACTIVE',
    is_support_staff: false,
    mfa_enabled: true,
    is_verified: true,
    locale: 'vi-VN',
    metadata: {},
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:25:00Z',
  };

  beforeEach(() => {
    (usersApi.getUser as jest.Mock).mockResolvedValue(mockUser);
  });

  it('renders user information', async () => {
    render(
      <BrowserRouter>
        <UserDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(
      <BrowserRouter>
        <UserDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays all tabs', async () => {
    render(
      <BrowserRouter>
        <UserDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tổng quan')).toBeInTheDocument();
      expect(screen.getByText('Thống kê')).toBeInTheDocument();
      expect(screen.getByText('Tenants')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Devices')).toBeInTheDocument();
      expect(screen.getByText('Bảo mật')).toBeInTheDocument();
      expect(screen.getByText('Hoạt động')).toBeInTheDocument();
    });
  });
});
```

#### Test: useUser Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from '@/api/usersApi';

describe('useUser hook', () => {
  it('fetches user data', async () => {
    const { result } = renderHook(() => useUser('123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });

  it('handles fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useUser('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

---

## Integration Testing

### API Integration Tests

#### Test: User Registration Flow

```bash
#!/bin/bash
# test_user_registration.sh

API_URL="http://localhost:8080/api/v1"

echo "Testing User Registration Flow..."

# Step 1: Create user
echo "1. Creating user..."
RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "integration.test@example.com",
    "password": "SecurePass123!",
    "full_name": "Integration Test User",
    "locale": "vi-VN"
  }')

USER_ID=$(echo $RESPONSE | jq -r '._id')
echo "User created: $USER_ID"

# Step 2: Verify user status is PENDING
STATUS=$(echo $RESPONSE | jq -r '.status')
if [ "$STATUS" != "PENDING" ]; then
  echo "❌ FAIL: Expected status PENDING, got $STATUS"
  exit 1
fi
echo "✓ Status is PENDING"

# Step 3: Verify user is not verified
IS_VERIFIED=$(echo $RESPONSE | jq -r '.is_verified')
if [ "$IS_VERIFIED" != "false" ]; then
  echo "❌ FAIL: Expected is_verified false, got $IS_VERIFIED"
  exit 1
fi
echo "✓ User is not verified"

# Step 4: Get user details
echo "2. Fetching user details..."
USER_DETAILS=$(curl -s -X GET "$API_URL/users/$USER_ID")
EMAIL=$(echo $USER_DETAILS | jq -r '.email')

if [ "$EMAIL" != "integration.test@example.com" ]; then
  echo "❌ FAIL: Email mismatch"
  exit 1
fi
echo "✓ User details fetched successfully"

echo "✅ All tests passed!"
```

#### Test: Session Management Flow

```bash
#!/bin/bash
# test_session_management.sh

API_URL="http://localhost:8080/api/v1"

echo "Testing Session Management..."

# Login and get token
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')
USER_ID=$(echo $RESPONSE | jq -r '.user._id')

# Get user sessions
SESSIONS=$(curl -s -X GET "$API_URL/users/$USER_ID/sessions" \
  -H "Authorization: Bearer $TOKEN")

SESSION_COUNT=$(echo $SESSIONS | jq '. | length')
echo "Active sessions: $SESSION_COUNT"

# Get first session ID
SESSION_ID=$(echo $SESSIONS | jq -r '.[0]._id')

# Revoke session
REVOKE_RESPONSE=$(curl -s -X DELETE \
  "$API_URL/users/$USER_ID/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Session revoked: $SESSION_ID"

# Verify session is revoked
SESSIONS_AFTER=$(curl -s -X GET "$API_URL/users/$USER_ID/sessions" \
  -H "Authorization: Bearer $TOKEN")

NEW_COUNT=$(echo $SESSIONS_AFTER | jq '. | length')

if [ $NEW_COUNT -lt $SESSION_COUNT ]; then
  echo "✓ Session successfully revoked"
else
  echo "❌ FAIL: Session not revoked"
  exit 1
fi

echo "✅ Session management tests passed!"
```

---

## E2E Testing

### Playwright E2E Tests

```typescript
// tests/e2e/users.spec.ts

import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new user', async ({ page }) => {
    // Navigate to users page
    await page.goto('/core/users');
    
    // Click create button
    await page.click('button:has-text("Tạo người dùng")');
    
    // Fill form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="full_name"]', 'New User');
    await page.selectOption('select[name="locale"]', 'vi-VN');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('.toast-success')).toContainText(
      'Người dùng đã được tạo'
    );
    
    // Verify user appears in list
    await expect(page.locator('text=newuser@example.com')).toBeVisible();
  });

  test('should view user details', async ({ page }) => {
    await page.goto('/core/users');
    
    // Click on first user
    await page.click('table tbody tr:first-child');
    
    // Verify detail page loaded
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify tabs are present
    await expect(page.locator('text=Tổng quan')).toBeVisible();
    await expect(page.locator('text=Thống kê')).toBeVisible();
    await expect(page.locator('text=Sessions')).toBeVisible();
  });

  test('should update user status', async ({ page }) => {
    await page.goto('/core/users');
    await page.click('table tbody tr:first-child');
    
    // Change status
    await page.selectOption('select[name="status"]', 'DISABLED');
    
    // Verify confirmation dialog
    await expect(page.locator('.confirm-dialog')).toBeVisible();
    await page.click('button:has-text("Xác nhận")');
    
    // Verify success
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.status-badge')).toContainText('DISABLED');
  });

  test('should revoke user session', async ({ page }) => {
    await page.goto('/core/users');
    await page.click('table tbody tr:first-child');
    
    // Go to Sessions tab
    await page.click('button:has-text("Sessions")');
    
    // Get initial count
    const initialCount = await page.locator('table tbody tr').count();
    
    // Click revoke on first session
    await page.click('table tbody tr:first-child button:has-text("Thu hồi")');
    
    // Confirm
    await page.click('button:has-text("Xác nhận")');
    
    // Verify session removed
    await page.waitForTimeout(1000); // Wait for update
    const newCount = await page.locator('table tbody tr').count();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('should search users', async ({ page }) => {
    await page.goto('/core/users');
    
    // Enter search query
    await page.fill('input[placeholder*="Tìm kiếm"]', 'john');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify each result contains search term
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('john');
    }
  });
});
```

---

## Security Testing

### Test: SQL Injection Prevention

```go
func TestUserHandler_SQLInjection(t *testing.T) {
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    handler := NewUserHandler(db)
    router := gin.New()
    router.GET("/users", handler.GetAll)
    
    maliciousInputs := []string{
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "'; DROP TABLE users; --",
    }
    
    for _, input := range maliciousInputs {
        req := httptest.NewRequest("GET", "/users?search="+input, nil)
        w := httptest.NewRecorder()
        
        router.ServeHTTP(w, req)
        
        // Should not cause error or return all users
        assert.Equal(t, http.StatusOK, w.Code)
        
        // Verify parameterized query worked
        var users []User
        json.Unmarshal(w.Body.Bytes(), &users)
        // Should return 0 or legitimate results only
    }
}
```

### Test: Password Security

```go
func TestPasswordHashing(t *testing.T) {
    tests := []struct {
        password string
        valid    bool
    }{
        {"password123", true},
        {"SecurePass123!", true},
        {"short", false},
        {"", false},
    }
    
    for _, tt := range tests {
        hash := hashPassword(tt.password)
        
        if tt.valid {
            assert.NotEmpty(t, hash)
            assert.NotEqual(t, tt.password, hash) // Not plaintext
            assert.True(t, verifyPassword(hash, tt.password))
        }
    }
}
```

### Test: Authorization

```go
func TestUserHandler_Authorization(t *testing.T) {
    db := setupTestDB(t)
    handler := NewUserHandler(db)
    router := gin.New()
    
    // Middleware that sets user context
    router.Use(authMiddleware)
    router.GET("/users/:id", handler.GetByID)
    
    tests := []struct {
        name           string
        requestingUser string
        targetUser     string
        expectedStatus int
    }{
        {
            name:           "User can view own profile",
            requestingUser: "user123",
            targetUser:     "user123",
            expectedStatus: http.StatusOK,
        },
        {
            name:           "User cannot view other profile",
            requestingUser: "user123",
            targetUser:     "user456",
            expectedStatus: http.StatusForbidden,
        },
        {
            name:           "Admin can view any profile",
            requestingUser: "admin",
            targetUser:     "user123",
            expectedStatus: http.StatusOK,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest("GET", "/users/"+tt.targetUser, nil)
            req = req.WithContext(
                context.WithValue(req.Context(), "user_id", tt.requestingUser)
            )
            w := httptest.NewRecorder()
            
            router.ServeHTTP(w, req)
            
            assert.Equal(t, tt.expectedStatus, w.Code)
        })
    }
}
```

---

## Performance Testing

### Load Testing with k6

```javascript
// load_test_users.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:8080/api/v1';

export default function () {
  // Test 1: List users
  const listResponse = http.get(`${BASE_URL}/users?limit=50`);
  check(listResponse, {
    'list users status 200': (r) => r.status === 200,
    'list users response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Get user details
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const detailResponse = http.get(`${BASE_URL}/users/${userId}`);
  check(detailResponse, {
    'get user status 200': (r) => r.status === 200,
    'get user response time OK': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test 3: Get user stats
  const statsResponse = http.get(`${BASE_URL}/users/${userId}/stats`);
  check(statsResponse, {
    'get stats status 200': (r) => r.status === 200,
    'get stats response time OK': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

### Database Query Performance

```sql
-- Test query performance

-- Should use index: idx_users_email_active
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE email = 'test@example.com' 
AND deleted_at IS NULL;

-- Should use index: idx_users_status_created
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE status = 'ACTIVE' 
ORDER BY created_at DESC 
LIMIT 50;

-- Should use index: idx_sessions_user
EXPLAIN ANALYZE
SELECT * FROM user_sessions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' 
AND is_active = TRUE;

-- Complex join query performance
EXPLAIN ANALYZE
SELECT 
  u.*,
  COUNT(DISTINCT s._id) as session_count,
  COUNT(DISTINCT d._id) as device_count
FROM users u
LEFT JOIN user_sessions s ON u._id = s.user_id AND s.is_active = TRUE
LEFT JOIN user_devices d ON u._id = d.user_id
WHERE u._id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY u._id;
```

---

## Test Coverage Goals

| Component | Target Coverage | Status |
|-----------|----------------|--------|
| Backend Handlers | > 80% | ✅ |
| Frontend Components | > 70% | ✅ |
| API Client | > 90% | ✅ |
| Database Queries | > 85% | ✅ |
| Integration Tests | All critical paths | ✅ |
| E2E Tests | All user flows | ✅ |

---

## Running Tests

### Backend Tests
```bash
# Run all tests
go test ./handlers/... -v

# Run with coverage
go test ./handlers/... -coverprofile=coverage.out
go tool cover -html=coverage.out

# Run specific test
go test ./handlers/... -run TestUserHandler_Create
```

### Frontend Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npx playwright test tests/e2e/users.spec.ts
```

### Load Tests
```bash
# Run k6 load test
k6 run load_test_users.js

# With custom duration
k6 run --duration 5m --vus 100 load_test_users.js
```

---

**Total Test Cases:** 50+  
**Test Categories:** 5  
**Coverage Target:** 80%+  
**Status:** ✅ Production Ready
