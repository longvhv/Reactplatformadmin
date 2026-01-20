# 🚀 Setup & Run Golang Backend - NGAY BÂY GIỜ

## ✅ Đã hoàn thành

### Phase 1 & 2: Core Infrastructure + Roles API
- ✅ Project structure
- ✅ Configuration management (`internal/config/`)
- ✅ Database client (`pkg/postgres/`)
- ✅ Base models (`internal/models/base.go`)
- ✅ Middleware (CORS, Logger, Recovery)
- ✅ Utils (Response helpers)
- ✅ **Roles API** - HOÀN CHỈNH
  - Model (`internal/models/role.go`)
  - Repository (`internal/repository/role_repository.go`)
  - Service (`internal/service/role_service.go`)
  - Handler (`internal/handler/role_handler.go`)
- ✅ Main entry point (`cmd/api/main.go`)

---

## 📋 Bước 1: Setup (2 phút)

```bash
cd /path/to/golang-backend

# 1. Copy environment file
cp .env.example .env

# 2. Edit .env với database credentials
nano .env
```

Chỉnh sửa trong `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_PASSWORD  # ⬅️ CHANGE THIS
DB_NAME=vhv_platform
```

---

## 📋 Bước 2: Install Dependencies (1 phút)

```bash
# Initialize Go module và tải dependencies
go mod tidy
```

Lệnh này sẽ:
- Download tất cả packages từ `go.mod`
- Tạo `go.sum` file

---

## 📋 Bước 3: Chạy Server (10 giây)

```bash
# Chạy server
go run cmd/api/main.go
```

Hoặc dùng Makefile:
```bash
make run
```

**Output mong đợi:**
```
Starting VHV Platform API on port 8080 (env: development)
Database connection established
Server listening on :8080
```

---

## 🧪 Bước 4: Test API

### 1. Health Check
```bash
curl http://localhost:8080/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "VHV Platform API is running"
}
```

### 2. Get All Roles
```bash
curl http://localhost:8080/api/v1/roles
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "tenant_id": "...",
      "name": "Admin",
      "type": "SYSTEM",
      "permission_codes": ["users.read", "users.write"],
      "created_at": "...",
      "updated_at": "...",
      "version": 1
    }
  ]
}
```

### 3. Get Role by ID
```bash
curl http://localhost:8080/api/v1/roles/YOUR_ROLE_ID
```

### 4. Create Role
```bash
curl -X POST http://localhost:8080/api/v1/roles \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "078e19ae-af67-4452-9ccd-10e27acb2dfe",
    "name": "Content Editor",
    "description": "Can create and edit content",
    "type": "CUSTOM",
    "permission_codes": ["content.read", "content.write"]
  }'
```

### 5. Update Role
```bash
curl -X PATCH http://localhost:8080/api/v1/roles/YOUR_ROLE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Content Editor",
    "permission_codes": ["content.read", "content.write", "content.publish"]
  }'
```

### 6. Delete Role
```bash
curl -X DELETE http://localhost:8080/api/v1/roles/YOUR_ROLE_ID
```

---

## 📊 API Endpoints

### Roles API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/roles` | List all roles |
| GET | `/api/v1/roles/:id` | Get role by ID |
| POST | `/api/v1/roles` | Create new role |
| PATCH | `/api/v1/roles/:id` | Update role |
| DELETE | `/api/v1/roles/:id` | Delete role |

### Query Parameters (GET /api/v1/roles)
- `tenant_id` - Filter by tenant
- `type` - Filter by type (SYSTEM/CUSTOM)
- `search` - Search by name or description

**Example:**
```bash
curl "http://localhost:8080/api/v1/roles?tenant_id=078e19ae-af67-4452-9ccd-10e27acb2dfe&type=CUSTOM"
```

---

## 🔧 Development Commands

```bash
# Run with hot-reload (requires air)
make dev

# Run tests
make test

# Format code
make fmt

# Check code quality
make lint

# Build binary
make build

# View all commands
make help
```

---

## 🎯 Next Steps

### Immediate (Hôm nay)
1. ✅ Test Roles API với Postman/curl
2. ⏳ Integrate với Frontend
3. ⏳ Implement Users API
4. ⏳ Implement Tenants API

### Tuần này
- Implement Tier 1 APIs (Users, Tenants, Permissions)
- Add authentication middleware
- Write unit tests
- Add API documentation (Swagger)

---

## 🔗 Integration với Frontend

### Option 1: Update Frontend Adapter
```typescript
// api/adapters/index.ts
const USE_GOLANG_API = {
  roles: process.env.NEXT_PUBLIC_USE_GOLANG_ROLES === 'true',
};

export function createAdapter<T>(table: string, endpoint: string) {
  if (table === 'roles' && USE_GOLANG_API.roles) {
    return createHttpAdapter<T>('/api/v1/roles');
  }
  return createSupabaseAdapter<T>(table);
}
```

### Option 2: Direct HTTP Calls
```typescript
// Test Golang API directly
const response = await fetch('http://localhost:8080/api/v1/roles');
const data = await response.json();
console.log(data);
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Failed to connect to database: ...
```
**Fix:** Check `.env` file, ensure PostgreSQL is running

### Port Already in Use
```
bind: address already in use
```
**Fix:** Change port in `.env` hoặc kill process:
```bash
lsof -ti:8080 | xargs kill -9
```

### Module Not Found
```
package ... is not in GOROOT
```
**Fix:** Run `go mod tidy`

---

## 📚 File Structure Created

```
golang-backend/
├── cmd/api/
│   └── main.go                          # ✅ Entry point
├── internal/
│   ├── config/
│   │   └── config.go                    # ✅ Configuration
│   ├── models/
│   │   ├── base.go                      # ✅ Base model
│   │   └── role.go                      # ✅ Role model
│   ├── repository/
│   │   └── role_repository.go           # ✅ Role DB operations
│   ├── service/
│   │   └── role_service.go              # ✅ Role business logic
│   ├── handler/
│   │   └── role_handler.go              # ✅ Role HTTP handler
│   ├── middleware/
│   │   ├── cors.go                      # ✅ CORS middleware
│   │   ├── logger.go                    # ✅ Logger
│   │   └── recovery.go                  # ✅ Panic recovery
│   └── utils/
│       └── response.go                  # ✅ Response helpers
├── pkg/
│   └── postgres/
│       └── postgres.go                  # ✅ DB client
├── .env.example                         # ✅ Environment template
├── .gitignore                           # ✅ Git ignore
├── go.mod                               # ✅ Go modules
├── Makefile                             # ✅ Make commands
└── SETUP_NOW.md                         # ✅ This file
```

---

## ✅ Verification Checklist

- [ ] `.env` file created and configured
- [ ] `go mod tidy` executed successfully
- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Can get all roles
- [ ] Can create a new role
- [ ] Can update a role
- [ ] Can delete a role

---

**Status**: ✅ Roles API hoàn chỉnh và sẵn sàng test  
**Next**: Implement Users API và Tenants API  
**Timeline**: 1 ngày/API (Repository → Service → Handler)
