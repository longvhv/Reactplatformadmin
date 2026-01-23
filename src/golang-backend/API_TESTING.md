# VHV Platform API Testing Guide

## Prerequisites

Start the services:
```bash
cd golang-backend
make docker-up
make migrate-up
make seed
make dev
```

## Base URL
```
http://localhost:8080/api/v1
```

## 1. Health Check

```bash
curl -X GET http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "vhv-platform-api",
  "version": "1.0.0"
}
```

## 2. Authentication

### Register New User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewUser@2026",
    "first_name": "New",
    "last_name": "User"
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

Expected response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "_id": "uuid-here",
      "email": "admin@saas.coquan.vn",
      "first_name": "Super",
      "last_name": "Admin"
    }
  }
}
```

**Save the access_token for subsequent requests!**

### Refresh Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Logout
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 3. User Management

**Note:** Replace `YOUR_ACCESS_TOKEN` with the token from login response.

### Get Current User Profile
```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Current User Profile
```bash
curl -X PATCH http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name",
    "phone_number": "+84901234567"
  }'
```

### List All Users (Paginated)
```bash
# Default pagination
curl -X GET http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# With pagination params
curl -X GET "http://localhost:8080/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# With search
curl -X GET "http://localhost:8080/api/v1/users?search=admin&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get User by ID
```bash
curl -X GET http://localhost:8080/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update User
```bash
curl -X PATCH http://localhost:8080/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "status": "ACTIVE"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:8080/api/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 4. Tenant Management

### Create Tenant
```bash
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "code": "ACME_CORP",
    "description": "Acme Corporation tenant",
    "industry": "Technology",
    "company_size": "51-200",
    "country": "Vietnam",
    "city": "Ho Chi Minh",
    "website": "https://acme.com",
    "billing_email": "billing@acme.com",
    "owner_id": "USER_ID"
  }'
```

### List Tenants
```bash
# All tenants
curl -X GET http://localhost:8080/api/v1/tenants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# With filters
curl -X GET "http://localhost:8080/api/v1/tenants?is_active=true&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Search by name
curl -X GET "http://localhost:8080/api/v1/tenants?search=acme" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Tenant by ID
```bash
curl -X GET http://localhost:8080/api/v1/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Tenant by Code
```bash
curl -X GET http://localhost:8080/api/v1/tenants/code/VHV_PLATFORM \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Tenant
```bash
curl -X PATCH http://localhost:8080/api/v1/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Tenant Name",
    "description": "Updated description",
    "website": "https://updated-website.com"
  }'
```

### Deactivate Tenant
```bash
curl -X POST http://localhost:8080/api/v1/tenants/TENANT_ID/deactivate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Activate Tenant
```bash
curl -X POST http://localhost:8080/api/v1/tenants/TENANT_ID/activate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Delete Tenant
```bash
curl -X DELETE http://localhost:8080/api/v1/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 5. Tenant Members

### Add Member to Tenant
```bash
curl -X POST http://localhost:8080/api/v1/tenants/TENANT_ID/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "job_title": "Software Engineer",
    "department": "Engineering",
    "work_email": "engineer@company.com",
    "work_phone": "+84901234567"
  }'
```

### List Tenant Members
```bash
# All members of a tenant
curl -X GET http://localhost:8080/api/v1/tenants/TENANT_ID/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# With pagination
curl -X GET "http://localhost:8080/api/v1/tenants/TENANT_ID/members?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Member by ID
```bash
curl -X GET http://localhost:8080/api/v1/members/MEMBER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Member
```bash
curl -X PATCH http://localhost:8080/api/v1/members/MEMBER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Software Engineer",
    "department": "Engineering",
    "status": "ACTIVE"
  }'
```

### Deactivate Member
```bash
curl -X POST http://localhost:8080/api/v1/members/MEMBER_ID/deactivate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Activate Member
```bash
curl -X POST http://localhost:8080/api/v1/members/MEMBER_ID/activate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Remove Member
```bash
curl -X DELETE http://localhost:8080/api/v1/members/MEMBER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Your data here
  }
}
```

### Success with Pagination
```json
{
  "success": true,
  "data": [...],
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
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Testing Script

Save as `test-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:8080/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Testing VHV Platform API"
echo "=============================="

# 1. Health Check
echo -e "\n${GREEN}1. Health Check${NC}"
curl -s -X GET http://localhost:8080/health | jq .

# 2. Login
echo -e "\n${GREEN}2. Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saas.coquan.vn",
    "password": "Admin@2026"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
echo "Access Token: ${ACCESS_TOKEN:0:50}..."

# 3. Get Current User
echo -e "\n${GREEN}3. Get Current User${NC}"
curl -s -X GET $API_URL/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 4. List Tenants
echo -e "\n${GREEN}4. List Tenants${NC}"
curl -s -X GET $API_URL/tenants \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 5. List Users
echo -e "\n${GREEN}5. List Users${NC}"
curl -s -X GET "$API_URL/users?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo -e "\n${GREEN}✅ Tests completed!${NC}"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

## Postman Collection

Import this JSON to Postman:

```json
{
  "info": {
    "name": "VHV Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080/api/v1"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```

## Environment Variables for Testing

Create `.env.test`:
```env
SERVER_PORT=8081
DB_NAME=vhv_platform_test
CLICKHOUSE_DB=vhv_logs_test
JWT_SECRET=test-secret-key
LOG_LEVEL=debug
```

Run tests:
```bash
ENV=test go test ./...
```
