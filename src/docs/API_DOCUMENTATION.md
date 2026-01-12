# API Documentation System

## Tổng quan

Hệ thống tài liệu API được xây dựng theo chuẩn OpenAPI 3.0.3, cho phép tra cứu và test các endpoints một cách trực quan.

## Kiến trúc

```
/data/openapi.json          # OpenAPI specification
/pages/ApiDocsPage.tsx      # Main API documentation page
/components/api/
  └── ApiEndpoint.tsx       # Component hiển thị từng endpoint
```

## OpenAPI Specification

### Cấu trúc file `/data/openapi.json`

```json
{
  "openapi": "3.0.3",
  "info": {...},
  "servers": [...],
  "tags": [...],
  "paths": {...},
  "components": {
    "securitySchemes": {...},
    "schemas": {...}
  }
}
```

### Tags (Nhóm API)

- **Authentication**: Login, Register
- **Users**: User management
- **Dashboard**: Analytics & statistics
- **Profile**: User profile management
- **Notifications**: Notification system

## Endpoints đã implement

### 1. Authentication

#### POST /auth/login
- **Description**: Authenticate user and return JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: JWT token + user object

#### POST /auth/register
- **Description**: Register new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

### 2. Users

#### GET /users
- **Description**: Get paginated list of users
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `role`: Filter by role (admin|manager|user)
  - `status`: Filter by status (active|inactive)
- **Security**: Requires Bearer token

#### POST /users
- **Description**: Create new user
- **Security**: Requires Bearer token

#### GET /users/{id}
- **Description**: Get user by ID
- **Security**: Requires Bearer token

#### PUT /users/{id}
- **Description**: Update user
- **Security**: Requires Bearer token

#### DELETE /users/{id}
- **Description**: Delete user
- **Security**: Requires Bearer token

### 3. Dashboard

#### GET /dashboard/stats
- **Description**: Get dashboard statistics
- **Response**:
  ```json
  {
    "totalUsers": 150,
    "activeUsers": 120,
    "totalRevenue": 50000,
    "growth": 15.5
  }
  ```
- **Security**: Requires Bearer token

### 4. Profile

#### GET /profile
- **Description**: Get current user profile
- **Security**: Requires Bearer token

#### PUT /profile
- **Description**: Update current user profile
- **Security**: Requires Bearer token

### 5. Notifications

#### GET /notifications
- **Description**: Get user notifications
- **Query Parameters**:
  - `read`: Filter by read status (boolean)
- **Security**: Requires Bearer token

#### PUT /notifications/{id}/read
- **Description**: Mark notification as read
- **Security**: Requires Bearer token

## Authentication

Hầu hết endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

## Cách sử dụng

### Truy cập API Documentation

1. Click vào menu user avatar (góc phải trên)
2. Chọn "Tài liệu API" (hoặc "API Documentation")
3. Trang API Documentation sẽ mở ra

### Tính năng

#### 1. Filter by Tag
- Click vào tag bên trái để lọc endpoints theo nhóm
- "All endpoints" để xem tất cả

#### 2. Search
- Gõ vào ô search để tìm endpoint theo path, summary hoặc description

#### 3. Xem chi tiết endpoint
- Click vào endpoint để expand
- Hiển thị:
  - Method (GET, POST, PUT, DELETE)
  - Path
  - Summary & Description
  - Parameters
  - Request Body schema
  - Response schemas
  - Authentication requirements

#### 4. Copy code
- Click nút "Copy" để copy request/response schema
- Tiện lợi cho việc test API

## Thêm endpoint mới

### Bước 1: Cập nhật OpenAPI spec

Mở `/data/openapi.json` và thêm endpoint:

```json
{
  "paths": {
    "/your-endpoint": {
      "get": {
        "tags": ["YourTag"],
        "summary": "Your summary",
        "description": "Your description",
        "operationId": "yourOperationId",
        "security": [{"bearerAuth": []}],
        "parameters": [...],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/YourSchema"}
              }
            }
          }
        }
      }
    }
  }
}
```

### Bước 2: Thêm schema (nếu cần)

```json
{
  "components": {
    "schemas": {
      "YourSchema": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "name": {"type": "string"}
        }
      }
    }
  }
}
```

### Bước 3: Test

1. Refresh trang API Documentation
2. Endpoint mới sẽ tự động hiển thị
3. Kiểm tra filter by tag, search

## Method Colors

- **GET**: Blue (`bg-blue-500`)
- **POST**: Green (`bg-green-500`)
- **PUT**: Yellow (`bg-yellow-500`)
- **DELETE**: Red (`bg-red-500`)
- **PATCH**: Purple (`bg-purple-500`)

## Response Status Colors

- **2xx**: Green (Success)
- **4xx**: Yellow (Client Error)
- **5xx**: Red (Server Error)

## i18n Support

API Documentation hỗ trợ đa ngôn ngữ:
- Tiếng Việt
- English
- Español
- 日本語
- 한국어
- 中文

Translation keys: `api.*`

## Best Practices

1. **Luôn cập nhật OpenAPI spec khi thêm/sửa API**
2. **Sử dụng $ref để tái sử dụng schemas**
3. **Thêm examples cho request/response**
4. **Ghi rõ security requirements**
5. **Viết description chi tiết**
6. **Group endpoints theo tags hợp lý**

## Tích hợp với Golang Backend

File OpenAPI spec này đồng bộ với Golang backend tại `/golang-backend/`.

Khi implement endpoint mới:
1. Cập nhật OpenAPI spec ở frontend
2. Implement endpoint ở Golang backend
3. Đảm bảo request/response schema khớp nhau
4. Test integration

## Troubleshooting

### Endpoint không hiển thị
- Kiểm tra JSON syntax trong openapi.json
- Đảm bảo path được khai báo đúng
- Check tag có trong danh sách tags

### Schema không hiển thị đúng
- Kiểm tra $ref path
- Đảm bảo schema được define trong components/schemas

### Không filter được
- Kiểm tra tags array trong endpoint
- Đảm bảo tag name chính xác

## Future Enhancements

- [ ] Try it out feature (test API trực tiếp)
- [ ] Code generation (curl, JS, Python)
- [ ] API versioning
- [ ] Export OpenAPI spec
- [ ] Import Postman collection
- [ ] Real-time API testing
- [ ] Mock server integration
