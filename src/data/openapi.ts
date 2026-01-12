/**
 * OpenAPI 3.0.3 Specification
 * VHV Platform API Documentation
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "VHV Platform API",
    description: "Comprehensive API documentation for VHV Platform - React Framework with modular architecture",
    version: "1.0.0",
    contact: {
      name: "VHV Platform Team",
      url: "https://github.com/vhvplatform/react-framework"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:8080/api/v1",
      description: "Development server"
    },
    {
      url: "https://api.vhvplatform.com/v1",
      description: "Production server"
    }
  ],
  tags: [
    {
      name: "Authentication",
      description: "Authentication and authorization endpoints"
    },
    {
      name: "Users",
      description: "User management operations"
    },
    {
      name: "Dashboard",
      description: "Dashboard data and analytics"
    },
    {
      name: "Profile",
      description: "User profile management"
    },
    {
      name: "Notifications",
      description: "Notification system"
    }
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        description: "Authenticate user and return JWT token",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse"
                }
              }
            }
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "User registration",
        description: "Register new user account",
        operationId: "register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse"
                }
              }
            }
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users",
        description: "Get paginated list of users with optional filters",
        operationId: "getUsers",
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: {
              type: "integer",
              default: 1
            }
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              default: 10
            }
          },
          {
            name: "role",
            in: "query",
            schema: {
              type: "string",
              enum: ["admin", "manager", "user"]
            }
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["active", "inactive"]
            }
          }
        ],
        responses: {
          "200": {
            description: "Users retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UsersListResponse"
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Create new user",
        description: "Create a new user account",
        operationId: "createUser",
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateUserRequest"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        operationId: "getUserById",
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          "200": {
            description: "User retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          },
          "404": {
            description: "User not found"
          }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        operationId: "updateUser",
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateUserRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User"
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        operationId: "deleteUser",
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],
        responses: {
          "204": {
            description: "User deleted successfully"
          }
        }
      }
    },
    "/dashboard/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard statistics",
        operationId: "getDashboardStats",
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          "200": {
            description: "Dashboard stats retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DashboardStats"
                }
              }
            }
          }
        }
      }
    },
    "/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get current user profile",
        operationId: "getProfile",
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          "200": {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Profile"
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Profile"],
        summary: "Update profile",
        operationId: "updateProfile",
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateProfileRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Profile"
                }
              }
            }
          }
        }
      }
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notifications",
        operationId: "getNotifications",
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: "read",
            in: "query",
            schema: {
              type: "boolean"
            }
          }
        ],
        responses: {
          "200": {
            description: "Notifications retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationsList"
                }
              }
            }
          }
        }
      }
    },
    "/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        operationId: "markNotificationRead",
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Notification marked as read"
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com"
          },
          password: {
            type: "string",
            format: "password",
            example: "password123"
          }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: {
            type: "string",
            format: "email"
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8
          },
          firstName: {
            type: "string"
          },
          lastName: {
            type: "string"
          }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: {
            type: "string"
          },
          user: {
            $ref: "#/components/schemas/User"
          }
        }
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "integer"
          },
          firstName: {
            type: "string"
          },
          lastName: {
            type: "string"
          },
          email: {
            type: "string",
            format: "email"
          },
          role: {
            type: "string",
            enum: ["admin", "manager", "user"]
          },
          status: {
            type: "string",
            enum: ["active", "inactive"]
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          updatedAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "firstName", "lastName", "role"],
        properties: {
          email: {
            type: "string",
            format: "email"
          },
          firstName: {
            type: "string"
          },
          lastName: {
            type: "string"
          },
          role: {
            type: "string",
            enum: ["admin", "manager", "user"]
          },
          phone: {
            type: "string"
          },
          department: {
            type: "string"
          }
        }
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          firstName: {
            type: "string"
          },
          lastName: {
            type: "string"
          },
          role: {
            type: "string"
          },
          status: {
            type: "string"
          }
        }
      },
      UsersListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/User"
            }
          },
          pagination: {
            $ref: "#/components/schemas/Pagination"
          }
        }
      },
      DashboardStats: {
        type: "object",
        properties: {
          totalUsers: {
            type: "integer"
          },
          activeUsers: {
            type: "integer"
          },
          totalRevenue: {
            type: "number"
          },
          growth: {
            type: "number"
          }
        }
      },
      Profile: {
        type: "object",
        properties: {
          id: {
            type: "integer"
          },
          firstName: {
            type: "string"
          },
          lastName: {
            type: "string"
          },
          email: {
            type: "string"
          },
          phone: {
            type: "string"
          },
          bio: {
            type: "string"
          },
          avatar: {
            type: "string"
          }
        }
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          firstName: {
            type: "string"
          },
          lastName: {
            type: "string"
          },
          phone: {
            type: "string"
          },
          bio: {
            type: "string"
          }
        }
      },
      NotificationsList: {
        type: "object",
        properties: {
          notifications: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Notification"
            }
          },
          unreadCount: {
            type: "integer"
          }
        }
      },
      Notification: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          type: {
            type: "string",
            enum: ["info", "success", "warning", "error"]
          },
          title: {
            type: "string"
          },
          message: {
            type: "string"
          },
          read: {
            type: "boolean"
          },
          createdAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer"
          },
          limit: {
            type: "integer"
          },
          total: {
            type: "integer"
          },
          totalPages: {
            type: "integer"
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string"
          },
          message: {
            type: "string"
          },
          code: {
            type: "string"
          }
        }
      }
    }
  }
} as const;

export default openApiSpec;
