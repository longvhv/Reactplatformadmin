# Database Documentation API

## Overview
API endpoint để lấy thông tin về cấu trúc database schema, bao gồm danh sách tables, columns, relationships và ERD diagram.

## Base URL
```
http://localhost:8080/api/v1
```

---

## Endpoints

### 1. Get All Database Tables
Lấy danh sách tất cả các bảng trong database với metadata cơ bản.

**Endpoint:** `GET /database/tables`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "description": "Bảng quản lý thông tin người dùng trong hệ thống",
        "columnCount": 16,
        "primaryKeys": 1,
        "foreignKeys": 0,
        "uniqueKeys": 1
      },
      {
        "name": "user_sessions",
        "description": "Bảng quản lý phiên đăng nhập của người dùng",
        "columnCount": 8,
        "primaryKeys": 1,
        "foreignKeys": 1,
        "uniqueKeys": 1
      }
    ],
    "totalTables": 5,
    "totalColumns": 58,
    "totalRelations": 4
  }
}
```

---

### 2. Get Table Schema Detail
Lấy chi tiết cấu trúc của một bảng cụ thể.

**Endpoint:** `GET /database/tables/:tableName`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `tableName` (string, required): Tên bảng cần lấy thông tin

**Example Request:**
```
GET /database/tables/users
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "name": "users",
    "description": "Bảng quản lý thông tin người dùng trong hệ thống",
    "columns": [
      {
        "name": "id",
        "type": "UUID",
        "nullable": false,
        "primaryKey": true,
        "foreignKey": null,
        "unique": false,
        "default": "gen_random_uuid()",
        "description": "Mã định danh duy nhất của người dùng"
      },
      {
        "name": "email",
        "type": "VARCHAR(255)",
        "nullable": false,
        "primaryKey": false,
        "foreignKey": null,
        "unique": true,
        "default": null,
        "description": "Địa chỉ email của người dùng (dùng để đăng nhập)"
      },
      {
        "name": "password_hash",
        "type": "VARCHAR(255)",
        "nullable": false,
        "primaryKey": false,
        "foreignKey": null,
        "unique": false,
        "default": null,
        "description": "Mật khẩu đã được mã hóa (bcrypt)"
      }
    ],
    "indexes": [
      {
        "name": "idx_users_email",
        "columns": ["email"],
        "unique": true
      }
    ],
    "foreignKeyRelations": []
  }
}
```

---

### 3. Get ERD Diagram Data
Lấy dữ liệu để render ERD diagram (Entity Relationship Diagram).

**Endpoint:** `GET /database/erd`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "format": "mermaid",
    "diagram": "erDiagram\n    users ||--o{ user_sessions : \"has many\"\n    users ||--o{ user_activities : \"has many\"\n    ...",
    "relationships": [
      {
        "from": "users",
        "to": "user_sessions",
        "type": "one-to-many",
        "fromColumn": "id",
        "toColumn": "user_id"
      },
      {
        "from": "users",
        "to": "user_activities",
        "type": "one-to-many",
        "fromColumn": "id",
        "toColumn": "user_id"
      }
    ]
  }
}
```

---

### 4. Search Database Objects
Tìm kiếm tables và columns theo keyword.

**Endpoint:** `GET /database/search`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Query Parameters:**
- `q` (string, required): Keyword tìm kiếm
- `type` (string, optional): Loại đối tượng cần tìm (`table`, `column`, `all`). Default: `all`

**Example Request:**
```
GET /database/search?q=email&type=all
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "description": "Bảng quản lý thông tin người dùng trong hệ thống",
        "matchReason": "Contains column matching 'email'"
      }
    ],
    "columns": [
      {
        "tableName": "users",
        "columnName": "email",
        "type": "VARCHAR(255)",
        "description": "Địa chỉ email của người dùng (dùng để đăng nhập)"
      },
      {
        "tableName": "settings",
        "columnName": "email_notifications",
        "type": "BOOLEAN",
        "description": "Bật/tắt thông báo qua email"
      }
    ],
    "totalResults": 3
  }
}
```

---

### 5. Get Database Statistics
Lấy thống kê tổng quan về database.

**Endpoint:** `GET /database/stats`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalTables": 5,
    "totalColumns": 58,
    "totalRelations": 4,
    "totalIndexes": 8,
    "databaseSize": "142 MB",
    "tableStats": [
      {
        "name": "users",
        "rowCount": 1523,
        "sizeInMB": 12.4,
        "lastModified": "2026-01-06T10:30:00Z"
      },
      {
        "name": "user_sessions",
        "rowCount": 8456,
        "sizeInMB": 8.2,
        "lastModified": "2026-01-06T14:15:00Z"
      }
    ]
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access database documentation"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "Table 'invalid_table' does not exist"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An error occurred while fetching database schema"
  }
}
```

---

## Golang Backend Implementation

### File Structure
```
golang-backend/
├── api/
│   └── v1/
│       └── database/
│           ├── handler.go        # HTTP handlers
│           ├── service.go        # Business logic
│           └── repository.go     # Database queries
├── models/
│   └── database.go              # Data models
└── routes/
    └── database.go              # Route definitions
```

### models/database.go
```go
package models

type TableSchema struct {
    Name         string         `json:"name"`
    Description  string         `json:"description"`
    Columns      []ColumnSchema `json:"columns"`
    ColumnCount  int            `json:"columnCount"`
    PrimaryKeys  int            `json:"primaryKeys"`
    ForeignKeys  int            `json:"foreignKeys"`
    UniqueKeys   int            `json:"uniqueKeys"`
}

type ColumnSchema struct {
    Name        string        `json:"name"`
    Type        string        `json:"type"`
    Nullable    bool          `json:"nullable"`
    PrimaryKey  bool          `json:"primaryKey"`
    ForeignKey  *ForeignKey   `json:"foreignKey,omitempty"`
    Unique      bool          `json:"unique"`
    Default     *string       `json:"default,omitempty"`
    Description string        `json:"description"`
}

type ForeignKey struct {
    Table  string `json:"table"`
    Column string `json:"column"`
}

type ERDData struct {
    Format        string         `json:"format"`
    Diagram       string         `json:"diagram"`
    Relationships []Relationship `json:"relationships"`
}

type Relationship struct {
    From       string `json:"from"`
    To         string `json:"to"`
    Type       string `json:"type"`
    FromColumn string `json:"fromColumn"`
    ToColumn   string `json:"toColumn"`
}
```

### api/v1/database/handler.go
```go
package database

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type Handler struct {
    service *Service
}

func NewHandler(service *Service) *Handler {
    return &Handler{service: service}
}

func (h *Handler) GetAllTables(c *gin.Context) {
    tables, err := h.service.GetAllTables()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INTERNAL_SERVER_ERROR",
                "message": err.Error(),
            },
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    tables,
    })
}

func (h *Handler) GetTableDetail(c *gin.Context) {
    tableName := c.Param("tableName")
    
    table, err := h.service.GetTableDetail(tableName)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "TABLE_NOT_FOUND",
                "message": err.Error(),
            },
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    table,
    })
}

func (h *Handler) GetERD(c *gin.Context) {
    erd, err := h.service.GetERDData()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INTERNAL_SERVER_ERROR",
                "message": err.Error(),
            },
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    erd,
    })
}

func (h *Handler) SearchDatabase(c *gin.Context) {
    query := c.Query("q")
    searchType := c.DefaultQuery("type", "all")
    
    results, err := h.service.SearchDatabase(query, searchType)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INTERNAL_SERVER_ERROR",
                "message": err.Error(),
            },
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    results,
    })
}

func (h *Handler) GetStats(c *gin.Context) {
    stats, err := h.service.GetDatabaseStats()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INTERNAL_SERVER_ERROR",
                "message": err.Error(),
            },
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    stats,
    })
}
```

### routes/database.go
```go
package routes

import (
    "github.com/gin-gonic/gin"
    "your-project/api/v1/database"
    "your-project/middleware"
)

func RegisterDatabaseRoutes(router *gin.RouterGroup, handler *database.Handler) {
    db := router.Group("/database")
    db.Use(middleware.AuthRequired()) // JWT authentication middleware
    {
        db.GET("/tables", handler.GetAllTables)
        db.GET("/tables/:tableName", handler.GetTableDetail)
        db.GET("/erd", handler.GetERD)
        db.GET("/search", handler.SearchDatabase)
        db.GET("/stats", handler.GetStats)
    }
}
```

---

## Authentication
Tất cả endpoints yêu cầu JWT token trong Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token phải chứa claim `role` với giá trị `admin` hoặc `developer` để có quyền truy cập Database Documentation.

---

## Rate Limiting
- 100 requests/minute per user
- 1000 requests/hour per user

---

## Notes
- Database schema được cache trong 5 phút để tối ưu performance
- ERD diagram được generate real-time từ database metadata
- Search hỗ trợ full-text search và case-insensitive matching
- Chỉ admin và developer role mới có quyền truy cập API này
