# 🚀 VHV Platform - Golang Backend API

Production-ready RESTful API backend cho VHV Platform, được xây dựng với Golang, PostgreSQL, và tuân thủ các best practices enterprise.

---

## 📋 **Tổng quan**

**VHV Platform Backend** là microservice API server viết bằng Golang, cung cấp:

- ✅ RESTful API với architecture chuẩn
- ✅ Multi-tenancy support
- ✅ Authentication & Authorization (JWT, OAuth2)
- ✅ Role-Based Access Control (RBAC)
- ✅ Soft delete & Audit trail
- ✅ Database migration system
- ✅ Comprehensive API documentation
- ✅ Production-ready error handling
- ✅ Rate limiting & Security headers
- ✅ Metrics & Monitoring

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────┐
│                  Client (React)                  │
└────────────────────┬────────────────────────────┘
                     │ HTTPS/JSON
┌────────────────────▼────────────────────────────┐
│           API Gateway / Load Balancer            │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              Golang API Server                   │
│  ┌─────────────────────────────────────────┐   │
│  │         Handler Layer (HTTP)            │   │
│  │  - Request parsing & validation         │   │
│  │  - Response formatting                  │   │
│  └──────────────────┬──────────────────────┘   │
│  ┌──────────────────▼──────────────────────┐   │
│  │      Service Layer (Business Logic)     │   │
│  │  - Transaction management               │   │
│  │  - Business rules enforcement           │   │
│  └──────────────────┬──────────────────────┘   │
│  ┌──────────────────▼──────────────────────┐   │
│  │       Model Layer (Data Access)         │   │
│  │  - Database queries                     │   │
│  │  - Data validation                      │   │
│  └─────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │ SQL
┌────────────────────▼────────────────────────────┐
│              PostgreSQL Database                 │
│  - Multi-tenant data isolation                  │
│  - JSONB for flexible metadata                  │
│  - Soft delete support                          │
└─────────────────────────────────────────────────┘
```

---

## 📁 **Cấu trúc thư mục**

```
golang-backend/
├── api/                           # HTTP Handlers
│   ├── announcements_handler.go   # Quản lý thông báo
│   ├── applications_handler.go    # Quản lý ứng dụng
│   ├── roles_handler.go           # Quản lý vai trò
│   ├── tenant_api.go              # Tenant API router
│   ├── tenant_detail_handler.go   # Chi tiết tenant
│   ├── tenants_handler.go         # CRUD tenants
│   └── users_handler.go           # Quản lý người dùng ⭐ NEW
│
├── models/                        # Data Models & DTOs
│   └── user.go                    # User models ⭐ NEW
│
├── services/                      # Business Logic Layer
│   └── user_service.go            # User service ⭐ NEW
│
├── migrations/                    # Database Migrations
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   └── README.md
│
├── docs/                          # API Documentation
│   └── USER_MANAGEMENT_API.md     # User API docs ⭐ NEW
│
├── config/                        # Configuration
│   └── config.go
│
├── middleware/                    # HTTP Middlewares
│   ├── auth.go
│   ├── logging.go
│   └── rate_limit.go
│
├── utils/                         # Utilities
│   ├── validator.go
│   ├── jwt.go
│   └── crypto.go
│
├── main.go                        # Application entry point
├── go.mod                         # Go modules
├── go.sum
└── README.md                      # This file
```

---

## 🎯 **Modules đã hoàn thiện**

### **✅ User Management** (Quản lý Người dùng)

**Files:**
- `api/users_handler.go` - HTTP handlers
- `models/user.go` - Data models & DTOs
- `services/user_service.go` - Business logic
- `docs/USER_MANAGEMENT_API.md` - API documentation

**Features:**
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ User search & filtering
- ✅ Password management (hashing, change password)
- ✅ Email verification
- ✅ Multi-Factor Authentication (MFA/2FA)
- ✅ Bulk operations
- ✅ User statistics
- ✅ Soft delete
- ✅ Pagination

**Endpoints:**
```
GET    /api/users                 - List users
GET    /api/users/{id}            - Get user by ID
GET    /api/users/email/{email}   - Get user by email
POST   /api/users                 - Create user
PATCH  /api/users/{id}            - Update user
DELETE /api/users/{id}            - Delete user (soft)
GET    /api/users/search          - Search users
PATCH  /api/users/{id}/password   - Change password
POST   /api/users/{id}/verify     - Verify email
PATCH  /api/users/{id}/mfa        - Toggle MFA
POST   /api/users/bulk            - Bulk actions
```

---

### **✅ Tenant Management** (Quản lý Tổ chức)

**Features:**
- Multi-tenant architecture
- Tenant isolation
- Subscription management

---

### **✅ Roles & Permissions** (Vai trò & Quyền hạn)

**Features:**
- RBAC (Role-Based Access Control)
- Permission management
- User-role assignment

---

### **✅ Announcements** (Thông báo hệ thống)

**Features:**
- System-wide announcements
- User notifications

---

### **✅ Applications** (Quản lý Ứng dụng)

**Features:**
- Application registry
- API keys management

---

## 🔧 **Technology Stack**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Go** | 1.21+ | Programming language |
| **PostgreSQL** | 14+ | Primary database |
| **Gorilla Mux** | Latest | HTTP router |
| **GORM** | Latest | ORM (optional) |
| **JWT** | Latest | Authentication tokens |
| **Bcrypt** | Latest | Password hashing |
| **UUID** | Latest | Unique identifiers |
| **Validator** | v10 | Input validation |

---

## 🚀 **Installation & Setup**

### **Prerequisites:**

```bash
# Go 1.21 or higher
go version

# PostgreSQL 14+
psql --version

# Environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=vhvplatform
export DB_USER=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret
export PORT=8080
```

### **1. Clone Repository**

```bash
git clone https://github.com/your-org/vhvplatform.git
cd vhvplatform/golang-backend
```

### **2. Install Dependencies**

```bash
go mod download
```

### **3. Setup Database**

```bash
# Create database
createdb vhvplatform

# Run migrations
psql -U postgres -d vhvplatform -f migrations/001_create_tenants.sql
psql -U postgres -d vhvplatform -f migrations/002_create_users.sql
```

### **4. Run Server**

```bash
# Development
go run main.go

# Production
go build -o vhvplatform-api
./vhvplatform-api
```

Server will start on `http://localhost:8080`

---

## 🧪 **Testing**

### **Run Tests:**

```bash
# All tests
go test ./...

# Specific package
go test ./services

# With coverage
go test -cover ./...

# Verbose
go test -v ./...
```

### **API Testing with cURL:**

```bash
# Create user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'

# List users
curl -X GET "http://localhost:8080/api/users?page=1&limit=10"

# Get user by ID
curl -X GET http://localhost:8080/api/users/{id}
```

---

## 📊 **Database Schema**

### **Key Tables:**

```sql
-- Global Users (Toàn hệ thống)
CREATE TABLE users (
  _id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  ...
);

-- Tenants (Tổ chức)
CREATE TABLE tenants (
  _id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'TRIAL',
  ...
);

-- Tenant Members (Nhân viên thuộc Tổ chức)
CREATE TABLE tenant_members (
  _id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(_id),
  user_id UUID REFERENCES users(_id),
  role VARCHAR(50),
  ...
);
```

**Database Standards:**
- Primary key: `_id` (UUID)
- Timestamps: `created_at`, `updated_at`
- Soft delete: `deleted_at`
- Multi-tenancy: `tenant_id` in most tables
- Metadata: JSONB fields for flexibility

---

## 🔒 **Security**

### **Authentication:**
- JWT tokens (Access + Refresh)
- Bcrypt password hashing (cost: 10)
- Session management

### **Authorization:**
- Role-Based Access Control (RBAC)
- Permission checks on endpoints
- Tenant isolation

### **Input Validation:**
- Struct validation with `validator/v10`
- SQL injection prevention (prepared statements)
- XSS protection

### **Security Headers:**
```go
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 📈 **Performance**

### **Optimization:**
- Database connection pooling
- Query optimization with indexes
- Prepared statements
- GZIP compression
- Response caching (Redis - optional)

### **Rate Limiting:**
- 100 requests/minute per user
- Configurable per endpoint
- IP-based fallback

### **Monitoring:**
- Request logging
- Error tracking
- Performance metrics
- Health check endpoint: `/health`

---

## 🔄 **Database Migrations**

```bash
# Create new migration
cat > migrations/003_create_orders.sql << EOF
-- UP
CREATE TABLE orders (...);

-- DOWN
DROP TABLE orders;
EOF

# Apply migrations
psql -U postgres -d vhvplatform -f migrations/003_create_orders.sql
```

**Migration Guidelines:**
- Always include UP and DOWN scripts
- Use transaction blocks
- Test on staging first
- Document breaking changes

---

## 📖 **API Documentation**

Full API documentation available in:

- [User Management API](./docs/USER_MANAGEMENT_API.md)
- [Tenant Management API](./docs/TENANT_MANAGEMENT_API.md)
- [Authentication API](./docs/AUTH_API.md)
- [RBAC API](./docs/RBAC_API.md)

**Swagger/OpenAPI:**  
Coming soon - Generate from code annotations

---

## 🛠️ **Development Workflow**

### **1. Feature Development:**

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# - Update models in models/
# - Add business logic in services/
# - Create handlers in api/
# - Write tests

# Test
go test ./...

# Commit
git commit -m "feat: add new feature"

# Push
git push origin feature/new-feature
```

### **2. Code Quality:**

```bash
# Format code
go fmt ./...

# Lint
golangci-lint run

# Vet
go vet ./...

# Security scan
gosec ./...
```

### **3. Pre-commit Checklist:**

- [ ] All tests pass
- [ ] Code formatted (`go fmt`)
- [ ] No linter warnings
- [ ] Documentation updated
- [ ] Migration scripts (if DB changes)
- [ ] API docs updated

---

## 🐛 **Troubleshooting**

### **Common Issues:**

**1. Database connection failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials
psql -U postgres -d vhvplatform
```

**2. Port already in use:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

**3. Migration failed:**
```bash
# Rollback migration
psql -U postgres -d vhvplatform -c "DROP TABLE IF EXISTS users CASCADE;"

# Re-run
psql -U postgres -d vhvplatform -f migrations/002_create_users.sql
```

---

## 📝 **Contributing**

### **Code Style:**
- Follow [Effective Go](https://golang.org/doc/effective_go)
- Use meaningful variable names
- Comment exported functions
- Keep functions < 50 lines
- Follow SonarQube standards

### **Commit Messages:**
```
feat: Add user authentication
fix: Fix password hashing issue
docs: Update API documentation
refactor: Simplify user service
test: Add tests for user CRUD
```

### **Pull Request Process:**
1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Pass all CI checks
5. Request review
6. Merge after approval

---

## 📚 **Resources**

- [Golang Official Docs](https://golang.org/doc/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Gorilla Mux Guide](https://github.com/gorilla/mux)
- [JWT Best Practices](https://jwt.io/)
- [Database Schema Standards](../DATABASE_SCHEMA_STANDARD.md)

---

## 🎯 **Roadmap**

### **Phase 1: Core APIs** ✅ (Current)
- [x] User Management
- [x] Tenant Management
- [x] Roles & Permissions
- [x] Announcements
- [x] Applications

### **Phase 2: Advanced Features** (Q1 2026)
- [ ] OAuth2 integration
- [ ] WebSocket support
- [ ] File upload/download
- [ ] Email notifications
- [ ] SMS verification

### **Phase 3: Optimization** (Q2 2026)
- [ ] Redis caching
- [ ] GraphQL support
- [ ] gRPC endpoints
- [ ] Microservices architecture
- [ ] Kubernetes deployment

---

## 📞 **Support**

- **Email:** support@vhvplatform.com
- **Slack:** #vhv-backend-dev
- **Issues:** GitHub Issues
- **Wiki:** Internal Confluence

---

## 📄 **License**

Copyright © 2026 VHV Platform. All rights reserved.

---

**Version:** 1.0.0  
**Last Updated:** January 15, 2026  
**Maintained by:** Backend Team
