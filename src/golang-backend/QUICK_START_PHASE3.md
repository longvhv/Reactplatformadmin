# Phase 3 - Quick Start Guide

## ✅ Phase 3 Completed Features

### Infrastructure
- ✅ YugabyteDB (PostgreSQL-compatible distributed SQL)
- ✅ ClickHouse (Analytics & Logging)
- ✅ Dragonfly (High-performance Redis alternative)
- ✅ Docker Compose configuration

### Core Implementation
- ✅ Clean Architecture structure
- ✅ Repository pattern (User, Tenant)
- ✅ Service layer (Auth, User)
- ✅ Handler layer (REST API)
- ✅ Middleware (Auth, Logging, Rate Limiting)

### Authentication & Security
- ✅ JWT token management
- ✅ Password hashing (bcrypt)
- ✅ Password validation
- ✅ Rate limiting
- ✅ CORS configuration

### Logging & Monitoring
- ✅ Structured logging (Zap)
- ✅ ClickHouse logging repository
- ✅ Auth logs, Audit logs, Traffic logs
- ✅ Error logging

## 🚀 Quick Start

### 1. Start Infrastructure

```bash
# Start databases and cache
docker-compose up -d yugabyte clickhouse dragonfly

# Check services health
docker-compose ps
```

### 2. Run Migrations

**YugabyteDB:**
```bash
# Connect to YugabyteDB
docker exec -it vhv-yugabyte bin/ysqlsh -h localhost -U yugabyte

# Run migration
\i /path/to/migrations/yugabyte/000001_init_schema.up.sql
```

**ClickHouse:**
```bash
# Connect to ClickHouse
docker exec -it vhv-clickhouse clickhouse-client

# Run migration
SOURCE /path/to/migrations/clickhouse/001_init_logs.sql;
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (YugabyteDB port is 5433, ClickHouse 9000, Dragonfly 6379)
nano .env
```

Key configurations:
```env
# YugabyteDB
DB_HOST=localhost
DB_PORT=5433
DB_NAME=vhv_platform
DB_USER=yugabyte
DB_PASSWORD=yugabyte

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=clickhouse123

# Dragonfly
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Install Dependencies

```bash
go mod download
go mod tidy
```

### 5. Run Application

```bash
# Development mode with hot reload
make dev

# Or standard run
go run cmd/api/main.go
```

## 📡 API Endpoints

### Public Endpoints

**Register:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Refresh Token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your-refresh-token"
  }'
```

### Protected Endpoints

**Get Current User:**
```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Profile:**
```bash
curl -X PATCH http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "timezone": "Asia/Ho_Chi_Minh"
  }'
```

**List Users:**
```bash
curl -X GET "http://localhost:8080/api/v1/users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Logout:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔍 Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "services": {
    "yugabyte": "healthy",
    "clickhouse": "healthy",
    "dragonfly": "healthy"
  }
}
```

## 🏗️ Project Structure

```
golang-backend/
├── cmd/api/
│   └── main.go                 # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go          # Configuration management
│   ├── handler/
│   │   ├── auth_handler.go    # Auth endpoints
│   │   ├── user_handler.go    # User endpoints
│   │   └── context.go         # Context helpers
│   ├── middleware/
│   │   ├── auth.go            # JWT authentication
│   │   ├── logging.go         # Request logging
│   │   └── rate_limit.go      # Rate limiting
│   ├── models/
│   │   ├── base.go            # Base model & responses
│   │   └── user.go            # User, Tenant, Role models
│   ├── repository/
│   │   ├── repository.go      # Repository interfaces
│   │   ├── yugabyte/
│   │   │   ├── user_repository.go
│   │   │   └── tenant_repository.go
│   │   └── clickhouse/
│   │       └── log_repository.go
│   └── service/
│       ├── auth_service.go    # Auth business logic
│       └── user_service.go    # User business logic
├── pkg/
│   ├── auth/
│   │   ├── jwt.go             # JWT management
│   │   └── password.go        # Password utilities
│   ├── cache/
│   │   └── dragonfly.go       # Cache client
│   ├── database/
│   │   ├── yugabyte.go        # YugabyteDB client
│   │   └── clickhouse.go      # ClickHouse client
│   └── logger/
│       └── logger.go          # Structured logging
└── migrations/
    ├── yugabyte/
    │   └── 000001_init_schema.up.sql
    └── clickhouse/
        └── 001_init_logs.sql
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
make coverage

# Run specific package
go test ./internal/service/...
```

## 📊 Database Access

**YugabyteDB:**
```bash
docker exec -it vhv-yugabyte bin/ysqlsh -h localhost -U yugabyte -d vhv_platform
```

**ClickHouse:**
```bash
docker exec -it vhv-clickhouse clickhouse-client
```

**Dragonfly:**
```bash
docker exec -it vhv-dragonfly redis-cli
```

## 🔧 Development Commands

```bash
# Validate code
make lint

# Format code
make fmt

# Build binary
make build

# Clean build artifacts
make clean

# Hot reload development
make dev
```

## 📝 Next Steps (Phase 4)

- [ ] Implement remaining 56 entities
- [ ] Add comprehensive tests
- [ ] Complete RBAC implementation
- [ ] Add API documentation (Swagger)
- [ ] Implement advanced features (MFA, SSO)
- [ ] Add performance monitoring
- [ ] Implement event sourcing
- [ ] Add GraphQL layer

## 🐛 Troubleshooting

**YugabyteDB connection failed:**
- Check if container is running: `docker ps | grep yugabyte`
- Verify port 5433 is available
- Check credentials in .env

**ClickHouse connection failed:**
- Ensure port 9000 is not blocked
- Verify password in docker-compose.yaml

**Dragonfly connection failed:**
- Check if port 6379 is available
- Verify no other Redis instance running

## 📚 References

- [YugabyteDB Docs](https://docs.yugabyte.com/)
- [ClickHouse Docs](https://clickhouse.com/docs)
- [Dragonfly Docs](https://www.dragonflydb.io/docs)
- [Go Chi Router](https://go-chi.io/)
- [Zap Logger](https://github.com/uber-go/zap)
