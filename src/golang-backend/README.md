# VHV Platform - Golang Backend API

Golang backend API cho VHV Platform - High-performance, scalable API server thay thế Supabase.

## 🚀 Quick Start

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 14+
- Redis (optional, for caching)
- Make (for using Makefile commands)

### Installation

1. **Clone và setup:**
```bash
cd golang-backend
make setup-dev
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run migrations:**
```bash
make migrate-up
```

4. **Start server:**
```bash
make run
# hoặc với hot-reload:
make dev
```

Server sẽ chạy tại `http://localhost:8080`

## 📁 Project Structure

```
golang-backend/
├── cmd/api/              # Application entry point
├── internal/             # Private application code
│   ├── config/          # Configuration management
│   ├── models/          # Data models (structs)
│   ├── repository/      # Database operations
│   ├── service/         # Business logic
│   ├── handler/         # HTTP handlers (controllers)
│   ├── middleware/      # HTTP middleware
│   ├── validator/       # Validation logic
│   └── utils/           # Utilities
├── pkg/                  # Public libraries
├── migrations/           # Database migrations
├── docs/                 # Documentation
├── scripts/              # Helper scripts
└── test/                 # Tests
```

## 🛠️ Available Commands

### Development
```bash
make help           # Show all available commands
make init           # Initialize project
make deps           # Download dependencies
make build          # Build binary
make run            # Run application
make dev            # Run with hot-reload
```

### Testing
```bash
make test           # Run all tests
make test-unit      # Run unit tests only
make test-integration  # Run integration tests
make coverage       # Generate coverage report
make benchmark      # Run benchmarks
```

### Code Quality
```bash
make lint           # Run linter
make fmt            # Format code
make vet            # Run go vet
make check          # Run lint + vet + test
```

### Database
```bash
make migrate-create name=migration_name  # Create new migration
make migrate-up     # Run migrations
make migrate-down   # Rollback last migration
make migrate-reset  # Reset all migrations
```

### Docker
```bash
make docker-build   # Build Docker image
make docker-run     # Run in Docker container
make docker-compose-up    # Start all services
make docker-compose-down  # Stop all services
```

### Migration from golang-api
```bash
make merge-golang-api  # Merge golang-api handlers into this project
```

## 📚 API Documentation

### Health Check
```bash
GET /health
```

### Tenants API
```bash
GET    /api/v1/tenants           # List all tenants
GET    /api/v1/tenants/:id       # Get tenant by ID
POST   /api/v1/tenants           # Create tenant
PATCH  /api/v1/tenants/:id       # Update tenant
DELETE /api/v1/tenants/:id       # Delete tenant
```

### Users API
```bash
GET    /api/v1/users             # List all users
GET    /api/v1/users/:id         # Get user by ID
POST   /api/v1/users             # Create user
PATCH  /api/v1/users/:id         # Update user
DELETE /api/v1/users/:id         # Delete user
```

### Roles API
```bash
GET    /api/v1/roles             # List all roles
GET    /api/v1/roles/:id         # Get role by ID
POST   /api/v1/roles             # Create role
PATCH  /api/v1/roles/:id         # Update role
DELETE /api/v1/roles/:id         # Delete role
```

**Full API documentation:** [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=8080
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=vhv_platform
DB_SSL_MODE=disable

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# CORS
CORS_ORIGINS=http://localhost:3000
```

## 🧪 Testing

### Run Tests
```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests
make test-integration

# With coverage
make coverage
```

### Example Test
```go
func TestTenantService_Create(t *testing.T) {
    service := setupTestService()
    
    tenant := &models.Tenant{
        Code: "test",
        Name: "Test Tenant",
        Tier: "FREE",
    }
    
    err := service.Create(context.Background(), tenant)
    assert.NoError(t, err)
}
```

## 📊 Performance

Target metrics:
- **Response Time**: < 100ms (p95)
- **Throughput**: > 1000 req/s
- **Memory**: < 500MB
- **CPU**: < 50%

## 🔄 Migration from Supabase

See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for detailed migration strategy.

### Dual-Stack Approach
1. Implement Golang API alongside Supabase
2. Use feature flags to switch between backends
3. Migrate module by module
4. Validate each migration
5. Gradual rollout

## 📖 Additional Documentation

- [Migration Plan](MIGRATION_PLAN.md) - Complete migration strategy
- [API Documentation](docs/API_DOCUMENTATION.md) - Full API reference
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Architecture](docs/ARCHITECTURE.md) - System architecture

## 🤝 Contributing

1. Follow Go best practices
2. Write tests for new features
3. Update documentation
4. Run `make check` before committing

## 📝 License

Proprietary - VHV Platform

## 👥 Team

VHV Platform Development Team

---

**Last Updated**: 2026-01-20  
**Version**: 1.0.0