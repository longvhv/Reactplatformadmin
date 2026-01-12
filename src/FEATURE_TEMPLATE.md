# Feature: [Feature Name]

## 📋 Overview

**Feature ID:** `FEAT-XXX`  
**Priority:** High / Medium / Low  
**Status:** Planning / In Progress / Testing / Deployed  
**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD

### Description
[Brief description of the feature]

### User Story
As a [user type], I want to [action] so that [benefit].

---

## 🎯 Requirements

### Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Non-Functional Requirements
- [ ] Performance
- [ ] Security
- [ ] Scalability
- [ ] Accessibility

---

## 🔧 Technical Design

### API Endpoints

#### Backend (Golang)

```yaml
# List all
GET /api/v1/{resource}
Response: { items: [], total: number }

# Get single
GET /api/v1/{resource}/:id
Response: { id, ...fields }

# Create
POST /api/v1/{resource}
Request: { field1, field2 }
Response: { id, ...fields }

# Update
PUT /api/v1/{resource}/:id
Request: { field1, field2 }
Response: { id, ...fields }

# Delete
DELETE /api/v1/{resource}/:id
Response: { success: true }
```

### Data Models

#### Backend (Golang)
```go
type Feature struct {
    ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    FeatureID string            `json:"featureId" bson:"featureId"`
    Name      string            `json:"name" bson:"name"`
    Status    string            `json:"status" bson:"status"`
    CreatedAt time.Time         `json:"createdAt" bson:"createdAt"`
    UpdatedAt time.Time         `json:"updatedAt" bson:"updatedAt"`
}
```

#### Frontend (TypeScript)
```typescript
interface Feature {
  featureId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}
```

---

## ✅ Implementation Checklist

### 🔙 Backend (Golang)

#### 1. Models & Types
- [ ] Create `internal/{feature}/models.go`
- [ ] Define request/response structs
- [ ] Add validation tags
- [ ] Add BSON tags for MongoDB

#### 2. Repository Layer
- [ ] Create `internal/{feature}/repository.go`
- [ ] Implement CRUD operations
  - [ ] Create
  - [ ] Read (single & list)
  - [ ] Update
  - [ ] Delete
  - [ ] Count/Exists
- [ ] Use `github.com/vhvplatform/go-shared/mongodb`
- [ ] Handle errors properly

#### 3. Service Layer
- [ ] Create `internal/{feature}/service.go`
- [ ] Implement business logic
- [ ] Add validation
- [ ] Add error handling
- [ ] Add logging

#### 4. Handler Layer
- [ ] Create `internal/{feature}/handler.go`
- [ ] Implement HTTP handlers
  - [ ] List handler
  - [ ] Get by ID handler
  - [ ] Create handler
  - [ ] Update handler
  - [ ] Delete handler
- [ ] Add request validation
- [ ] Add response formatting

#### 5. Routes
- [ ] Register routes in `cmd/api/main.go`
- [ ] Add middleware (auth, etc.)
- [ ] Group routes properly

#### 6. Tests
- [ ] Create `repository_test.go`
  - [ ] Test all repository methods
  - [ ] Mock MongoDB operations
  - [ ] Test error cases
- [ ] Create `service_test.go`
  - [ ] Test business logic
  - [ ] Mock repository
  - [ ] Test validations
- [ ] Run `make test-{feature}`
- [ ] Check coverage (target: >85%)

#### 7. Documentation
- [ ] Add code comments
- [ ] Update API documentation
- [ ] Add examples to README
- [ ] Update MONGODB_QUERIES.md if needed

---

### 🎨 Frontend (React + TypeScript)

#### 1. Types
- [ ] Create `src/types/{feature}.types.ts`
- [ ] Define interfaces matching backend
- [ ] Export all types

#### 2. Services
- [ ] Create `src/services/{feature}.service.ts`
- [ ] Implement API calls
  - [ ] list()
  - [ ] getById()
  - [ ] create()
  - [ ] update()
  - [ ] delete()
- [ ] Add error handling
- [ ] Add TypeScript types

#### 3. Components
- [ ] Create `src/components/{feature}/`
- [ ] List component
- [ ] Detail/View component
- [ ] Create/Edit form component
- [ ] Delete confirmation component
- [ ] Loading states
- [ ] Error states

#### 4. Hooks (if needed)
- [ ] Create `src/hooks/use{Feature}.ts`
- [ ] Implement custom hooks
- [ ] Add loading/error states
- [ ] Add caching if needed

#### 5. Translations (i18n)
- [ ] Update `src/i18n/locales/vi.json`
- [ ] Update `src/i18n/locales/en.json`
- [ ] Update `src/i18n/locales/es.json`
- [ ] Update `src/i18n/locales/fr.json`
- [ ] Update `src/i18n/locales/zh.json`
- [ ] Update `src/i18n/locales/ja.json`
- [ ] Update `src/i18n/locales/ko.json`

#### 6. Routes
- [ ] Add routes to `src/App.tsx` or routing config
- [ ] Add to navigation menu
- [ ] Add breadcrumbs

#### 7. Styling
- [ ] Follow design system
- [ ] Use Tailwind CSS classes
- [ ] Add responsive design
- [ ] Add animations/transitions
- [ ] Follow glassmorphism style guide

#### 8. Tests
- [ ] Unit tests for components
- [ ] Tests for services
- [ ] Tests for hooks
- [ ] Integration tests
- [ ] Run `npm test`

---

## 🗄️ Database

### Collections/Tables
- [ ] Collection name: `{feature_name}`
- [ ] Indexes needed:
  - [ ] Index 1
  - [ ] Index 2

### Migrations
- [ ] Create migration file
- [ ] Test migration up
- [ ] Test migration down
- [ ] Add to `migrations/` folder

---

## 🔒 Security

- [ ] Authentication required?
- [ ] Authorization/Permissions
- [ ] Input validation
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

---

## 🧪 Testing

### Backend Tests
```bash
# Unit tests
make test-{feature}

# Integration tests
make test-integration

# Coverage
make test-coverage
# Target: >85%
```

### Frontend Tests
```bash
# Unit tests
npm test

# Coverage
npm run test:coverage
# Target: >80%
```

### Manual Testing
- [ ] Test all CRUD operations
- [ ] Test validation
- [ ] Test error handling
- [ ] Test permissions
- [ ] Test pagination
- [ ] Test search/filter
- [ ] Test on different browsers
- [ ] Test on mobile

---

## 📝 API Documentation

### Swagger/OpenAPI
- [ ] Add to OpenAPI spec
- [ ] Document all endpoints
- [ ] Add examples
- [ ] Document error responses

### Postman/Thunder Client
- [ ] Create collection
- [ ] Add all endpoints
- [ ] Add examples
- [ ] Export and share

---

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] All tests passing (Backend)
- [ ] All tests passing (Frontend)
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Translations complete
- [ ] Database migrations ready
- [ ] Environment variables configured

### Deployment Order
1. [ ] Deploy Backend to dev
2. [ ] Test Backend endpoints
3. [ ] Deploy Frontend to dev
4. [ ] Test integration
5. [ ] Deploy to staging
6. [ ] Test staging
7. [ ] Deploy to production

### Post-Deployment
- [ ] Monitor logs
- [ ] Check error rates
- [ ] Verify functionality
- [ ] Update status page

---

## 📊 Performance

### Backend
- [ ] Response time < 200ms
- [ ] Memory usage acceptable
- [ ] No N+1 queries
- [ ] Proper indexing

### Frontend
- [ ] First contentful paint < 1.5s
- [ ] Time to interactive < 3s
- [ ] Bundle size optimized
- [ ] Lazy loading implemented

---

## 🐛 Known Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| - | - | - | - |

---

## 📚 References

- Backend API: `/golang-backend/internal/{feature}/`
- Frontend Components: `/src/components/{feature}/`
- Types: `/src/types/{feature}.types.ts`
- Tests: See repository_test.go and service_test.go

---

## 📝 Notes

[Any additional notes or considerations]

---

## ✅ Sign-off

- [ ] Backend Developer: ___________
- [ ] Frontend Developer: ___________
- [ ] QA: ___________
- [ ] Product Owner: ___________

---

**Status:** [Planning / In Progress / Testing / Deployed]  
**Last Updated:** YYYY-MM-DD
