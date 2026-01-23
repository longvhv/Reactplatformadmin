# VHV Platform Backend API

Production-ready Golang backend for VHV Platform with Clean Architecture, YugabyteDB, ClickHouse, and Dragonfly cache.

## 🚀 Quick Start

### Prerequisites

- Go 1.22+
- Docker & Docker Compose
- golang-migrate CLI tool

### One-Command Setup

```bash
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

This will:
- ✅ Check all requirements
- ✅ Create .env file
- ✅ Start YugabyteDB, ClickHouse, Dragonfly
- ✅ Run database migrations
- ✅ Seed test data
- ✅ Download dependencies

### Start Development Server

```bash
make dev
```

API will be available at `http://localhost:8080`

### Test Credentials

```
Email:    admin@saas.coquan.vn
Password: Admin@2026
```

## 📦 Project Structure

```
golang-backend/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration management
│   ├── handler/                 # HTTP handlers (controllers)
│   ├── middleware/              # HTTP middleware
│   ├── models/                  # Domain models
│   ├── repository/              # Data access layer
│   │   ├── yugabyte/           # YugabyteDB repositories
│   │   └── clickhouse/         # ClickHouse repositories
│   └── service/                # Business logic layer
├── pkg/
│   ├── auth/                   # Authentication & authorization
│   ├── cache/                  # Cache management
│   ├── database/               # Database connections
│   └── logger/                 # Logging utilities
├── migrations/                 # Database migrations
├── scripts/                    # Utility scripts
├── docker-compose.yaml         # Docker services configuration
├── Makefile                    # Build & development commands
└── .env                        # Environment variables
```

## 🏗️ Architecture

### Clean Architecture Layers

1. **Handler Layer** (`internal/handler/`)
   - HTTP request/response handling
   - Input validation
   - Route definitions

2. **Service Layer** (`internal/service/`)
   - Business logic
   - Use case implementation
   - Cross-cutting concerns

3. **Repository Layer** (`internal/repository/`)
   - Data persistence
   - Database queries
   - External data sources

4. **Models Layer** (`internal/models/`)
   - Domain entities
   - Value objects
   - DTOs

### Technology Stack

- **Framework**: Chi Router
- **Primary Database**: YugabyteDB (distributed SQL)
- **Analytics Database**: ClickHouse
- **Cache**: Dragonfly (Redis-compatible)
- **Authentication**: JWT
- **Logging**: Zap
- **Migrations**: golang-migrate

## 🔌 API Endpoints

### Authentication (4 endpoints)
```
POST   /api/v1/auth/register     - Register new user
POST   /api/v1/auth/login        - Login user
POST   /api/v1/auth/refresh      - Refresh access token
POST   /api/v1/auth/logout       - Logout user
```

### Users (6 endpoints)
```
GET    /api/v1/users/me          - Get current user
PATCH  /api/v1/users/me          - Update current user
GET    /api/v1/users             - List users
GET    /api/v1/users/:id         - Get user by ID
PATCH  /api/v1/users/:id         - Update user
DELETE /api/v1/users/:id         - Delete user
```

### Tenants (10 endpoints)
```
POST   /api/v1/tenants                    - Create tenant
GET    /api/v1/tenants                    - List tenants
GET    /api/v1/tenants/:id                - Get tenant
GET    /api/v1/tenants/code/:code         - Get tenant by code
PATCH  /api/v1/tenants/:id                - Update tenant
DELETE /api/v1/tenants/:id                - Delete tenant
POST   /api/v1/tenants/:id/activate       - Activate tenant
POST   /api/v1/tenants/:id/deactivate     - Deactivate tenant
POST   /api/v1/tenants/:tenantID/members  - Add member
GET    /api/v1/tenants/:tenantID/members  - List members
```

### Departments (5 endpoints)
```
POST   /api/v1/tenants/:tenantID/departments  - Create department
GET    /api/v1/tenants/:tenantID/departments  - List departments
GET    /api/v1/departments/:id                - Get department
PATCH  /api/v1/departments/:id                - Update department
DELETE /api/v1/departments/:id                - Delete department
```

### Roles (8 endpoints)
```
POST   /api/v1/roles                          - Create role
GET    /api/v1/roles                          - List roles
GET    /api/v1/roles/:id                      - Get role
PATCH  /api/v1/roles/:id                      - Update role
DELETE /api/v1/roles/:id                      - Delete role
POST   /api/v1/roles/:id/permissions          - Assign permission
GET    /api/v1/roles/:id/permissions          - Get role permissions
DELETE /api/v1/roles/:id/permissions/:permID  - Remove permission
```

### Permissions (5 endpoints)
```
POST   /api/v1/permissions      - Create permission
GET    /api/v1/permissions      - List permissions
GET    /api/v1/permissions/:id  - Get permission
PATCH  /api/v1/permissions/:id  - Update permission
DELETE /api/v1/permissions/:id  - Delete permission
```

### Webhooks (6 endpoints)
```
POST   /api/v1/tenants/:tenantID/webhooks  - Create webhook
GET    /api/v1/tenants/:tenantID/webhooks  - List webhooks
GET    /api/v1/webhooks/:id                - Get webhook
PATCH  /api/v1/webhooks/:id                - Update webhook
DELETE /api/v1/webhooks/:id                - Delete webhook
POST   /api/v1/webhooks/:id/test           - Test webhook
```

### Applications (6 endpoints)
```
POST   /api/v1/applications           - Create application
GET    /api/v1/applications           - List applications
GET    /api/v1/applications/:id       - Get application
GET    /api/v1/applications/code/:code - Get by code
PATCH  /api/v1/applications/:id       - Update application
DELETE /api/v1/applications/:id       - Delete application
```

### Locations (5 endpoints)
```
POST   /api/v1/tenants/:tenantID/locations  - Create location
GET    /api/v1/tenants/:tenantID/locations  - List locations
GET    /api/v1/locations/:id                - Get location
PATCH  /api/v1/locations/:id                - Update location
DELETE /api/v1/locations/:id                - Delete location
```

**Total: 51 API Endpoints**

## 🛠️ Makefile Commands

### Development
```bash
make dev              # Start with hot reload
make run              # Run without hot reload
make build            # Build binary
```

### Docker
```bash
make docker-up        # Start infrastructure
make docker-down      # Stop all services
make docker-full      # Start all including API
make docker-logs      # View logs
```

### Database
```bash
make migrate-up       # Run migrations
make migrate-down     # Rollback last migration
make migrate-reset    # Reset database
make migrate-create   # Create new migration
make seed             # Seed test data
```

### Database Shells
```bash
make db-shell-yugabyte    # YugabyteDB shell
make db-shell-clickhouse  # ClickHouse shell
make cache-shell          # Redis/Dragonfly shell
```

### Testing
```bash
make test             # Run tests
make test-coverage    # Run with coverage
make check-api        # Test API endpoints
```

### Code Quality
```bash
make fmt              # Format code
make lint             # Run linter
make vet              # Run go vet
```

### Utilities
```bash
make help             # Show all commands
make clean            # Clean build artifacts
make backup-db        # Backup database
make install-tools    # Install dev tools
```

## 🔧 Configuration

Configuration is loaded from environment variables. Copy `.env.example` to `.env` and update values:

```env
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=yugabyte
DB_PASSWORD=yugabyte
DB_NAME=vhv_platform

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=168h
```

## 📊 Database Schema

### Core Tables
- `users` - User accounts
- `tenants` - Tenant organizations
- `tenant_members` - Tenant membership
- `departments` - Organizational departments
- `locations` - Physical/virtual locations
- `roles` - Access control roles
- `permissions` - Granular permissions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission assignments
- `webhooks` - Webhook configurations
- `applications` - Application registry

### Analytics Tables (ClickHouse)
- `activity_logs` - User activity tracking
- `api_logs` - API request logs
- `webhook_logs` - Webhook delivery logs

## 🧪 Testing

### Run All Tests
```bash
make test
```

### Test Specific Package
```bash
go test -v ./internal/service/...
```

### Run API Integration Tests
```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

### Test with Coverage
```bash
make test-coverage
open coverage.html
```

## 📝 API Examples

### Register User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass@123",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saas.coquan.vn",
    "password": "Admin@2026"
  }'
```

### Get Current User
```bash
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Tenant
```bash
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACME",
    "name": "ACME Corporation",
    "type": "enterprise"
  }'
```

## 🚀 Deployment

### Build for Production
```bash
make build
```

### Run Production Build
```bash
./bin/vhv-api
```

### Docker Deployment
```bash
docker-compose --profile full up -d
```

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Request ID tracking
- ✅ Rate limiting ready
- ✅ SQL injection prevention
- ✅ Input validation

## 📈 Performance

- ✅ Database connection pooling
- ✅ Redis caching layer
- ✅ Query optimization with indexes
- ✅ Pagination support
- ✅ Distributed database (YugabyteDB)
- ✅ Hot reload for development

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if services are running
docker-compose ps

# Restart services
make docker-restart
```

### Migration Failed
```bash
# Reset and rerun migrations
make migrate-reset
```

### Port Already in Use
```bash
# Change port in .env
SERVER_PORT=8081
```

## 📚 Documentation

- API Documentation: See `API_REFERENCE.md`
- Architecture: See `ARCHITECTURE.md`
- Database Schema: See `docs/Tables.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Format code: `make fmt`
6. Submit a pull request

## 📄 License

Copyright © 2026 VHV Platform

## 💬 Support

For issues and questions:
- Create an issue in the repository
- Contact: admin@saas.coquan.vn
