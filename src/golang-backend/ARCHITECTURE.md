# VHV Platform API - Architecture Documentation

## Overview

VHV Platform API là một multi-tenant SaaS platform backend được xây dựng với:
- **Language**: Go 1.21+
- **Framework**: Chi Router + Clean Architecture
- **Database**: PostgreSQL 15+ (Supabase)
- **Cache**: Redis 7+
- **API Spec**: OpenAPI 3.0
- **Auth**: JWT + Supabase Auth

## Project Structure

```
golang-backend/
├── api/                          # API Specifications
│   ├── openapi/                  # OpenAPI 3.0 specs
│   │   ├── openapi.yaml         # Main spec file
│   │   ├── components/          # Reusable components
│   │   │   ├── schemas/         # 58 entity schemas
│   │   │   ├── parameters/      # Common parameters
│   │   │   └── responses/       # Standard responses
│   │   └── paths/               # 58 endpoint files (330+ endpoints)
│   └── docs/                    # Generated documentation
│
├── cmd/                         # Application entrypoints
│   └── api/
│       └── main.go             # Main server
│
├── internal/                    # Private application code
│   ├── config/                 # Configuration management
│   ├── domain/                 # Domain entities (58 entities)
│   │   ├── user/
│   │   ├── tenant/
│   │   └── ...
│   ├── repository/             # Data access layer
│   │   ├── postgres/           # PostgreSQL implementations
│   │   └── redis/              # Redis implementations
│   ├── service/                # Business logic layer
│   │   ├── user/
│   │   ├── tenant/
│   │   └── ...
│   ├── handler/                # HTTP handlers
│   │   ├── rest/               # REST API handlers
│   │   └── middleware/         # HTTP middleware
│   ├── generated/              # Generated from OpenAPI
│   │   ├── models/             # Type definitions
│   │   ├── server/             # Server interfaces
│   │   └── client/             # API client
│   └── pkg/                    # Internal packages
│       ├── auth/               # Authentication
│       ├── logger/             # Logging
│       ├── validator/          # Validation
│       └── errors/             # Error handling
│
├── pkg/                        # Public packages
│   ├── database/              # Database utilities
│   ├── cache/                 # Cache utilities
│   └── utils/                 # Common utilities
│
├── migrations/                # Database migrations
│   ├── 000001_init.up.sql
│   └── ...
│
├── scripts/                   # Build and deployment scripts
│   ├── validate-openapi.sh   # OpenAPI validation
│   └── generate-from-openapi.sh  # Code generation
│
├── docs/                      # Documentation
│   ├── Tables.md             # Database schema
│   └── ...
│
├── tools/                     # Development tools config
│   └── oapi-codegen.yaml     # Code generation config
│
├── .github/                   # GitHub workflows
│   └── workflows/
│       └── ci.yaml           # CI/CD pipeline
│
├── Makefile                   # Build automation
├── Dockerfile                 # Docker image
├── docker-compose.yaml        # Local development
├── .env.example              # Environment template
└── go.mod                    # Go dependencies
```

## Architecture Layers

### 1. API Layer (OpenAPI Specification)
- **Location**: `api/openapi/`
- **Purpose**: Contract-first API design
- **Coverage**: 
  - 58 entities (100% database coverage)
  - 330+ endpoints
  - Complete CRUD operations
  - Advanced operations (activate, publish, analytics)

### 2. Handler Layer
- **Location**: `internal/handler/`
- **Responsibilities**:
  - HTTP request/response handling
  - Input validation
  - Request routing
  - Response formatting
- **Pattern**: Thin handlers, delegate to services

### 3. Service Layer
- **Location**: `internal/service/`
- **Responsibilities**:
  - Business logic
  - Transaction management
  - Data validation
  - Authorization checks
- **Pattern**: Use case oriented

### 4. Repository Layer
- **Location**: `internal/repository/`
- **Responsibilities**:
  - Data persistence
  - Database queries
  - Cache operations
- **Pattern**: Repository pattern with interfaces

### 5. Domain Layer
- **Location**: `internal/domain/`
- **Responsibilities**:
  - Core business entities
  - Domain logic
  - Validation rules
- **Pattern**: Rich domain models

## Database Architecture

### Schema Organization

```sql
-- Public Schema (Main entities)
public.users
public.tenants
public.roles
public.permissions
... (45 more tables)

-- Telemetry Schema (Logging & Analytics)
telemetry.auth_logs
telemetry.audit_logs
telemetry.traffic_logs
... (7 tables)
```

### Entity Tiers

**Tier 1: Foundation (5 entities)**
- Authentication, Users, Tenants, Roles, Permissions

**Tier 2: Business Core (5 entities)**
- Applications, Products, Packages, Orders, Invoices

**Tier 3: Extended Features (6 entities)**
- Tenant subscriptions, members, domains, rate limits

**Tier 4: Advanced Features (3 entities)**
- API keys, user devices, app routes

**Tier 5: System & Support (13 entities)**
- Notifications, feature flags, storage, logs, groups, departments

**Tier 6: Telemetry & Metadata (26 entities)**
- Locations, webhooks, sessions, MFA, SSO, analytics

## API Design Principles

### RESTful Conventions

```
GET    /api/v1/entities          # List
POST   /api/v1/entities          # Create
GET    /api/v1/entities/{id}     # Get by ID
PATCH  /api/v1/entities/{id}     # Update
DELETE /api/v1/entities/{id}     # Delete
```

### Action Endpoints

```
POST /api/v1/entities/{id}/activate
POST /api/v1/entities/{id}/deactivate
POST /api/v1/entities/{id}/publish
POST /api/v1/entities/{id}/verify
```

### Analytics Endpoints

```
GET /api/v1/entities/stats
GET /api/v1/entities/analytics
GET /api/v1/entities/summary
GET /api/v1/entities/export
```

## Authentication & Authorization

### JWT Flow

```
1. POST /auth/login → JWT tokens (access + refresh)
2. Use access token in Authorization: Bearer {token}
3. POST /auth/refresh → New access token
4. POST /auth/logout → Invalidate tokens
```

### Multi-tenant Isolation

- Tenant ID in JWT claims
- Row-level security (RLS) in Supabase
- Tenant context in all queries
- Tenant-scoped permissions

### RBAC Implementation

```
User → User_Roles → Roles → Permissions
```

- Global roles (platform-wide)
- Tenant roles (tenant-specific)
- Permission inheritance
- Dynamic permission checking

## Data Flow

### Request Flow

```
HTTP Request
    ↓
Middleware (Auth, CORS, Logging)
    ↓
Handler (Validation, Parsing)
    ↓
Service (Business Logic)
    ↓
Repository (Database)
    ↓
Database/Cache
```

### Response Flow

```
Database Result
    ↓
Repository (Mapping)
    ↓
Service (Business Rules)
    ↓
Handler (Response Formatting)
    ↓
Middleware (Logging, Metrics)
    ↓
HTTP Response
```

## Caching Strategy

### Cache Layers

1. **Redis** - Application cache
   - User sessions
   - Permission cache
   - Rate limiting
   - Feature flags

2. **In-memory** - Request cache
   - Configuration
   - Static data

### Cache Patterns

```go
// Cache-aside
func GetUser(id string) (*User, error) {
    // Try cache first
    if cached := cache.Get("user:" + id); cached != nil {
        return cached, nil
    }
    
    // Fetch from DB
    user := db.GetUser(id)
    
    // Update cache
    cache.Set("user:" + id, user, 10*time.Minute)
    
    return user, nil
}
```

## Error Handling

### Error Types

```go
type ErrorCode string

const (
    ErrValidation     ErrorCode = "VALIDATION_ERROR"
    ErrUnauthorized   ErrorCode = "UNAUTHORIZED"
    ErrForbidden      ErrorCode = "FORBIDDEN"
    ErrNotFound       ErrorCode = "NOT_FOUND"
    ErrConflict       ErrorCode = "CONFLICT"
    ErrInternal       ErrorCode = "INTERNAL_ERROR"
)
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid format"
    }
  }
}
```

## Logging & Monitoring

### Structured Logging

```go
log.Info("User created",
    "user_id", userID,
    "tenant_id", tenantID,
    "email", email,
)
```

### Metrics

- Request count
- Response time
- Error rate
- Cache hit rate
- Database query time

### Tracing

- Request ID propagation
- Distributed tracing (Jaeger)
- Performance profiling

## Security

### Best Practices

1. **Input Validation**
   - Validate all inputs
   - Sanitize user data
   - Use parameterized queries

2. **Authentication**
   - JWT with short expiry
   - Refresh token rotation
   - Secure session storage

3. **Authorization**
   - Permission-based access
   - Tenant isolation
   - Resource-level checks

4. **Data Protection**
   - Encryption at rest
   - TLS in transit
   - Sensitive data masking

5. **Rate Limiting**
   - Per-user limits
   - Per-tenant limits
   - Global limits

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t vhv-platform-api .

# Run with docker-compose
docker-compose up -d
```

### Environment Variables

See `.env.example` for all configuration options

### Database Migrations

```bash
# Run migrations
make migrate-up

# Rollback
make migrate-down

# Create new migration
make migrate-create name=add_new_table
```

## Development Workflow

### Setup

```bash
# Install dependencies
make init

# Setup environment
cp .env.example .env

# Start services
docker-compose up -d postgres redis

# Run migrations
make migrate-up

# Start dev server with hot reload
make dev
```

### Code Generation

```bash
# Generate from OpenAPI spec
bash scripts/generate-from-openapi.sh

# Generate mocks
make generate
```

### Testing

```bash
# Run all tests
make test

# Unit tests only
make test-unit

# Integration tests
make test-integration

# With coverage
make coverage
```

### Validation

```bash
# Validate OpenAPI spec
make openapi-validate

# Lint code
make lint

# Format code
make fmt

# Run all checks
make check
```

## Performance Optimization

### Database

- Connection pooling
- Query optimization
- Index strategy
- Read replicas

### Caching

- Multi-level caching
- Cache warming
- TTL management
- Cache invalidation

### API

- Response pagination
- Selective fields
- Batch operations
- Compression

## Scalability

### Horizontal Scaling

- Stateless services
- Load balancing
- Session in Redis
- Distributed cache

### Vertical Scaling

- Connection pooling
- Resource limits
- Performance tuning

## Future Enhancements

- [ ] GraphQL API
- [ ] gRPC endpoints
- [ ] Event-driven architecture
- [ ] Message queue integration
- [ ] Advanced analytics
- [ ] AI/ML integration
- [ ] Mobile SDK
- [ ] API rate limiting tiers
- [ ] API versioning strategy
- [ ] Multi-region deployment

## References

- [OpenAPI Specification](api/openapi/README.md)
- [Database Schema](docs/Tables.md)
- [API Reference](API_REFERENCE.md)
- [Migration Plan](MIGRATION_PLAN.md)
