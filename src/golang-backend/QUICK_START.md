# 🚀 Quick Start Guide - Golang Backend

## Bước 1: Gộp golang-api (30 giây)

```bash
cd golang-backend
make merge-golang-api
```

Lệnh này sẽ:
- Copy handlers từ `/golang-api/handlers/` → `/golang-backend/internal/handler/legacy/`
- Copy docs từ `/golang-api/*.md` → `/golang-backend/docs/migration/`

## Bước 2: Setup Project (2 phút)

```bash
# Initialize và install dependencies
make setup-dev

# Kết quả: 
# ✅ Go module initialized
# ✅ Dependencies downloaded
# ✅ .env file created (cần edit)
```

## Bước 3: Configure Database (1 phút)

```bash
# Edit .env file
nano .env

# Chỉnh sửa:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=vhv_platform
```

## Bước 4: Run Server (10 giây)

```bash
# Development mode with hot-reload
make dev

# Production mode
make run

# Server running at: http://localhost:8080
```

## Test API

```bash
# Health check
curl http://localhost:8080/health

# Get tenants
curl http://localhost:8080/api/v1/tenants

# Get users
curl http://localhost:8080/api/v1/users

# Get roles
curl http://localhost:8080/api/v1/roles
```

## Lộ Trình Triển Khai (8 tuần)

### ✅ Tuần 1-2: Core Setup
- [x] Project structure
- [ ] Configuration management
- [ ] Database connection
- [ ] Middleware (CORS, Auth, Logging)
- [ ] Router setup

### 📋 Tuần 3-4: Tier 1 APIs (Core)
- [ ] Tenants API (models, repo, service, handler)
- [ ] Users API
- [ ] Roles API
- [ ] Permissions API

### 📋 Tuần 5-6: Tier 2 APIs (Platform)
- [ ] Applications API
- [ ] Products API
- [ ] Packages API
- [ ] Orders API
- [ ] Invoices API

### 📋 Tuần 7-8: Tier 3 + Migration
- [ ] Subscriptions API
- [ ] Webhooks API
- [ ] Testing (80% coverage)
- [ ] Migration scripts
- [ ] Production deployment

## Useful Commands

```bash
# Development
make dev            # Run with hot-reload
make test           # Run tests
make lint           # Check code quality

# Database
make migrate-up     # Run migrations
make migrate-down   # Rollback
make migrate-create name=add_users  # Create migration

# Build
make build          # Build binary
make docker-build   # Build Docker image

# Help
make help           # Show all commands
```

## Next Steps

1. **Read Documentation**
   - [MIGRATION_PLAN.md](MIGRATION_PLAN.md) - Detailed plan
   - [README.md](README.md) - Full documentation

2. **Start Implementation**
   - Begin with Tier 1 APIs (Tenants, Users, Roles)
   - Follow the structure in MIGRATION_PLAN.md
   - Write tests alongside code

3. **Integration**
   - Update frontend adapters to support Golang API
   - Add feature flags for gradual rollout
   - Monitor performance metrics

## Support

- **Documentation**: `/golang-backend/docs/`
- **Migration Docs**: `/golang-backend/docs/migration/`
- **Issues**: Create GitHub issue

---

**Estimated Total Time**: 
- Setup: 5 minutes
- First API Implementation: 2-3 days
- Full Migration: 8 weeks

**Ready to start? Run:** `make merge-golang-api && make setup-dev`
