package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/config"
	"github.com/vhv-platform/backend/internal/handler"
	"github.com/vhv-platform/backend/internal/middleware"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/postgres"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	log.Printf("Starting VHV Platform API on port %s (env: %s)", cfg.Server.Port, cfg.Server.Environment)

	// Initialize database
	db, err := postgres.NewPostgresDB(cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("Database connection established")

	// Initialize repositories
	roleRepo := repository.NewRoleRepository(db)
	userRepo := repository.NewUserRepository(db)
	tenantRepo := repository.NewTenantRepository(db)
	permissionRepo := repository.NewPermissionRepository(db)

	// Initialize services
	roleService := service.NewRoleService(roleRepo)
	userService := service.NewUserService(userRepo)
	tenantService := service.NewTenantService(tenantRepo)
	permissionService := service.NewPermissionService(permissionRepo)

	// Initialize handlers
	roleHandler := handler.NewRoleHandler(roleService)
	userHandler := handler.NewUserHandler(userService)
	tenantHandler := handler.NewTenantHandler(tenantService)
	permissionHandler := handler.NewPermissionHandler(permissionService)

	// Setup router
	router := setupRouter(cfg, roleHandler, userHandler, tenantHandler, permissionHandler)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Server listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRouter(cfg *config.Config, roleHandler *handler.RoleHandler, userHandler *handler.UserHandler, tenantHandler *handler.TenantHandler, permissionHandler *handler.PermissionHandler) *gin.Engine {
	// Set Gin mode
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Middleware
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.CORS(cfg.CORS.Origins))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "VHV Platform API is running",
		})
	})

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Roles endpoints
		roles := v1.Group("/roles")
		{
			roles.GET("", roleHandler.GetAll)
			roles.GET("/:id", roleHandler.GetByID)
			roles.POST("", roleHandler.Create)
			roles.PATCH("/:id", roleHandler.Update)
			roles.DELETE("/:id", roleHandler.Delete)
		}

		// Users endpoints
		users := v1.Group("/users")
		{
			users.GET("", userHandler.GetAll)
			users.GET("/:id", userHandler.GetByID)
			users.GET("/email/:email", userHandler.GetByEmail)
			users.POST("", userHandler.Create)
			users.PATCH("/:id", userHandler.Update)
			users.PATCH("/:id/status", userHandler.UpdateStatus)
			users.POST("/:id/mfa/enable", userHandler.EnableMFA)
			users.POST("/:id/mfa/disable", userHandler.DisableMFA)
			users.DELETE("/:id", userHandler.Delete)
		}

		// Tenants endpoints
		tenants := v1.Group("/tenants")
		{
			tenants.GET("", tenantHandler.GetAll)
			tenants.GET("/:id", tenantHandler.GetByID)
			tenants.GET("/code/:code", tenantHandler.GetByCode)
			tenants.POST("", tenantHandler.Create)
			tenants.PATCH("/:id", tenantHandler.Update)
			tenants.DELETE("/:id", tenantHandler.Delete)
		}

		// Permissions endpoints
		permissions := v1.Group("/permissions")
		{
			permissions.GET("", permissionHandler.GetAll)
			permissions.GET("/grouped", permissionHandler.GetByCategory)
			permissions.GET("/:id", permissionHandler.GetByID)
			permissions.GET("/code/:code", permissionHandler.GetByCode)
			permissions.POST("", permissionHandler.Create)
			permissions.POST("/validate", permissionHandler.ValidateCodes)
			permissions.PATCH("/:id", permissionHandler.Update)
			permissions.DELETE("/:id", permissionHandler.Delete)
		}
	}

	return router
}