# VHV Platform API - OpenAPI 3.0 Specification

Complete OpenAPI 3.0 specification for VHV Platform multi-tenant SaaS API.

## 📊 Specification Coverage

- **Total Endpoints**: 330+
- **Database Entities**: 58
- **API Resources**: 58
- **Tags/Categories**: 40+
- **Schema Files**: 58+
- **Path Files**: 58

## 🏗️ Architecture

```
api/openapi/
├── openapi.yaml                 # Main specification file
├── components/
│   ├── schemas/                 # Entity schemas (58 files)
│   │   ├── common.yaml         # Base models and shared types
│   │   ├── user.yaml
│   │   ├── tenant.yaml
│   │   └── ...
│   ├── parameters/              # Reusable parameters
│   │   ├── common.yaml         # ID, sorting params
│   │   ├── pagination.yaml     # Page, limit params
│   │   └── filters.yaml        # Search, filter params
│   └── responses/               # Standard responses
│       ├── success.yaml        # 200, 201, 204
│       └── errors.yaml         # 400, 401, 403, 404, 500
└── paths/                       # API endpoints (58 files)
    ├── auth.yaml               # Authentication endpoints
    ├── users.yaml              # User management
    ├── tenants.yaml            # Tenant management
    └── ...
```

## 🎯 Entity Categories

### Tier 1: Foundation (5 entities)
- Authentication & Authorization
- Users, Tenants, Roles, Permissions

### Tier 2: Business Core (5 entities)
- Applications, Products, Packages
- Orders, Invoices

### Tier 3: Extended Features (6 entities)
- Tenant Subscriptions, Members, Invitations
- Tenant Domains, Rate Limits, Applications

### Tier 4: Advanced Features (3 entities)
- API Keys, User Devices, Tenant App Routes

### Tier 5: System & Support (13 entities)
- Notification Templates, Feature Flags, Storage Files
- Audit Logs, Auth Logs, User Groups, Departments
- System Categories, Reserved Slugs, Tags, Regions
- App Capabilities

### Tier 6: Telemetry & Metadata (26 entities)
- Locations, Webhooks, User Sessions, Delegations
- User Consents, MFA Methods, Service Accounts
- Legal Documents, SSO Configs, Usage Events
- System Jobs, Security Audits, Registration Logs
- Traffic Logs, Content Views, Business Reports
- Article Types, Product Types, System Announcements
- Digital Assets, Service Deliveries

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js 18+
# Install Redocly CLI
npm install -g @redocly/cli
```

### Validation

```bash
# Validate specification
make openapi-validate

# Or using npm
npm run validate
```

### Generate Documentation

```bash
# Bundle into single file
make openapi-bundle

# Generate HTML documentation
make openapi-docs

# Preview documentation locally
make openapi-serve
```

### Using Scripts

```bash
# Comprehensive validation with stats
bash scripts/validate-openapi.sh

# Get statistics
make openapi-stats
```

## 📖 Documentation

### View Documentation

1. **Local Preview**:
   ```bash
   npm run serve
   # Opens at http://localhost:8080
   ```

2. **Static HTML**:
   ```bash
   npm run docs
   # Generated at api/docs/index.html
   ```

3. **Bundled Spec**:
   ```bash
   npm run bundle
   # Output: api/openapi/bundled.yaml
   ```

## 🔧 Development

### Adding New Endpoints

1. **Create Schema** (if needed):
   ```yaml
   # api/openapi/components/schemas/my-entity.yaml
   MyEntity:
     allOf:
       - $ref: './common.yaml#/BaseModel'
       - type: object
         properties:
           name:
             type: string
   ```

2. **Create Paths**:
   ```yaml
   # api/openapi/paths/my-entities.yaml
   /my-entities:
     get:
       summary: List entities
       tags:
         - My Entities
       responses:
         '200':
           description: Success
   ```

3. **Register in Main Spec**:
   ```yaml
   # api/openapi/openapi.yaml
   paths:
     /my-entities:
       $ref: './paths/my-entities.yaml#/~1my-entities'
   ```

4. **Validate**:
   ```bash
   make openapi-validate
   ```

### Naming Conventions

- **Endpoints**: kebab-case (`/user-devices`, `/tenant-subscriptions`)
- **Schemas**: PascalCase (`UserDevice`, `TenantSubscription`)
- **Parameters**: snake_case (`user_id`, `tenant_id`)
- **Files**: kebab-case (`user-device.yaml`, `tenant-subscription.yaml`)

## 📋 Endpoint Patterns

### Standard CRUD

```yaml
# List
GET /entities?page=1&limit=20

# Get by ID
GET /entities/{id}

# Create
POST /entities

# Update
PATCH /entities/{id}

# Delete
DELETE /entities/{id}
```

### Common Actions

```yaml
# Activate/Deactivate
POST /entities/{id}/activate
POST /entities/{id}/deactivate

# Enable/Disable
POST /entities/{id}/enable
POST /entities/{id}/disable

# Revoke/Cancel
POST /entities/{id}/revoke
POST /entities/{id}/cancel

# Publish
POST /entities/{id}/publish

# Test/Verify
POST /entities/{id}/test
POST /entities/{id}/verify
```

### Analytics Endpoints

```yaml
# Statistics
GET /entities/stats

# Analytics
GET /entities/analytics

# Reports
GET /entities/summary
GET /entities/export
```

## 🔐 Authentication

All endpoints (except `/auth/*` and `/health`) require Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Auth Flow

1. **Login**: `POST /auth/login`
2. **Get Token**: Receive JWT in response
3. **Use Token**: Include in Authorization header
4. **Refresh**: `POST /auth/refresh` (when expired)
5. **Logout**: `POST /auth/logout`

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* entity or array */ },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Error Response

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

## 🎨 Common Schemas

### BaseModel

All entities extend BaseModel:

```yaml
BaseModel:
  type: object
  properties:
    _id:
      type: string
      format: uuid
    created_at:
      type: string
      format: date-time
    updated_at:
      type: string
      format: date-time
    created_by:
      type: string
      format: uuid
    updated_by:
      type: string
      format: uuid
    deleted_at:
      type: string
      format: date-time
    deleted_by:
      type: string
      format: uuid
    version:
      type: integer
```

### Pagination

```yaml
PaginationMeta:
  type: object
  properties:
    page:
      type: integer
    limit:
      type: integer
    total:
      type: integer
    total_pages:
      type: integer
```

## 🧪 Testing

### Using Postman

1. Import bundled spec:
   ```bash
   make openapi-bundle
   ```

2. Import `api/openapi/bundled.yaml` into Postman

3. Configure environment:
   - `baseUrl`: http://localhost:8080/api/v1
   - `token`: Your JWT token

### Using cURL

```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# List users (with token)
curl -X GET http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📦 Bundling

Create a single-file spec for distribution:

```bash
# Dereferenced (all $refs resolved)
npx @redocly/cli bundle api/openapi/openapi.yaml \
  --dereferenced \
  -o api/openapi/bundled.yaml

# Keep references
npx @redocly/cli bundle api/openapi/openapi.yaml \
  -o api/openapi/bundled.yaml
```

## 🔍 Linting Rules

Configured in `.redocly.yaml`:

- ✅ Operation summaries required
- ✅ Tags required for all operations
- ✅ Security schemes must be defined
- ✅ 2xx responses required
- ⚠️  Descriptions recommended
- ⚠️  4xx responses recommended

## 📈 Statistics

Run stats to see specification metrics:

```bash
make openapi-stats
```

Output:
```
Total path files: 58
Total schema files: 58
Total endpoints: 330+

Endpoints by tag:
  45 - Users
  38 - Tenants
  25 - Authentication
  ...
```

## 🛠️ Tools & Commands

### Makefile Commands

```bash
make openapi-validate    # Validate spec
make openapi-bundle      # Create bundled spec
make openapi-docs        # Generate HTML docs
make openapi-serve       # Preview docs
make openapi-stats       # Show statistics
make openapi-all         # Validate + bundle + docs
```

### NPM Scripts

```bash
npm run validate    # Validate with Redocly
npm run bundle      # Bundle into single file
npm run docs        # Generate documentation
npm run serve       # Preview documentation
npm run lint        # Strict linting
npm run stats       # Run validation script
```

## 🎯 Phase 2 Completion

✅ **Completed**:
- [x] 58 entity schemas (100% database coverage)
- [x] 330+ endpoints documented
- [x] Complete CRUD operations
- [x] Advanced operations (activate, publish, test, etc.)
- [x] Analytics and reporting endpoints
- [x] Comprehensive parameter definitions
- [x] Standard error responses
- [x] Authentication & authorization
- [x] Pagination & filtering
- [x] Validation scripts
- [x] Documentation generation
- [x] Bundling & distribution

## 🚦 Next Steps (Phase 3)

1. Generate Golang code from OpenAPI spec
2. Implement repository layer
3. Implement service layer
4. Implement HTTP handlers
5. Add middleware (auth, logging, rate limiting)
6. Integration tests
7. API documentation deployment

## 📚 Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Redocly CLI Documentation](https://redocly.com/docs/cli/)
- [Best Practices](https://redocly.com/docs/openapi-best-practices/)

## 🤝 Contributing

1. Follow naming conventions
2. Validate before committing: `make openapi-validate`
3. Update documentation if adding new endpoints
4. Run stats to verify coverage: `make openapi-stats`

## 📄 License

MIT License - See LICENSE file for details
