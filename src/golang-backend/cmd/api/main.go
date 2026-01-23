package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"

	"github.com/vhv-platform/backend/internal/config"
	"github.com/vhv-platform/backend/internal/handler"
	"github.com/vhv-platform/backend/internal/service"
	yugabyte_repo "github.com/vhv-platform/backend/internal/repository/yugabyte"
	clickhouse_repo "github.com/vhv-platform/backend/internal/repository/clickhouse"
	"github.com/vhv-platform/backend/pkg/auth"
	"github.com/vhv-platform/backend/pkg/cache"
	"github.com/vhv-platform/backend/pkg/database"
	"github.com/vhv-platform/backend/pkg/logger"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		fmt.Printf("Invalid config: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	if err := logger.Init(logger.Config{
		Level:      cfg.Logger.Level,
		Format:     cfg.Logger.Format,
		Output:     cfg.Logger.Output,
		FilePath:   cfg.Logger.FilePath,
		MaxSize:    cfg.Logger.MaxSize,
		MaxBackups: cfg.Logger.MaxBackups,
		MaxAge:     cfg.Logger.MaxAge,
		Compress:   cfg.Logger.Compress,
	}); err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Starting VHV Platform API",
		zap.String("version", cfg.Server.APIVersion),
		zap.String("environment", cfg.Server.Environment),
	)

	// Initialize YugabyteDB
	logger.Info("Connecting to YugabyteDB...",
		zap.String("host", cfg.Database.Host),
		zap.Int("port", cfg.Database.Port),
	)
	yugabyte, err := database.NewYugabyteDB(cfg.Database)
	if err != nil {
		logger.Fatal("Failed to connect to YugabyteDB", zap.Error(err))
	}
	defer yugabyte.Close()
	logger.Info("Connected to YugabyteDB successfully")

	// Initialize ClickHouse
	logger.Info("Connecting to ClickHouse...",
		zap.String("host", cfg.ClickHouse.Host),
		zap.Int("port", cfg.ClickHouse.Port),
	)
	clickhouse, err := database.NewClickHouse(cfg.ClickHouse)
	if err != nil {
		logger.Fatal("Failed to connect to ClickHouse", zap.Error(err))
	}
	defer clickhouse.Close()
	logger.Info("Connected to ClickHouse successfully")

	// Initialize Dragonfly Cache
	logger.Info("Connecting to Dragonfly cache...",
		zap.String("host", cfg.Cache.Host),
		zap.Int("port", cfg.Cache.Port),
	)
	dragonfly, err := cache.NewDragonflyCache(cfg.Cache)
	if err != nil {
		logger.Fatal("Failed to connect to Dragonfly", zap.Error(err))
	}
	defer dragonfly.Close()
	logger.Info("Connected to Dragonfly cache successfully")

	// Initialize repositories
	userRepo := yugabyte_repo.NewUserRepository(yugabyte.DB)
	tenantRepo := yugabyte_repo.NewTenantRepository(yugabyte.DB)
	tenantMemberRepo := yugabyte_repo.NewTenantMemberRepository(yugabyte.DB)
	departmentRepo := yugabyte_repo.NewDepartmentRepository(yugabyte.DB)
	webhookRepo := yugabyte_repo.NewWebhookRepository(yugabyte.DB)
	roleRepo := yugabyte_repo.NewRoleRepository(yugabyte.DB)
	permissionRepo := yugabyte_repo.NewPermissionRepository(yugabyte.DB)
	applicationRepo := yugabyte_repo.NewApplicationRepository(yugabyte.DB)
	locationRepo := yugabyte_repo.NewLocationRepository(yugabyte.DB)

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenExpiry,
		cfg.JWT.RefreshTokenExpiry,
		cfg.JWT.Issuer,
		cfg.JWT.Audience,
	)

	// Initialize password validator
	passwordValidator := auth.NewPasswordValidator(
		cfg.Auth.PasswordMinLength,
		cfg.Auth.PasswordRequireUpper,
		cfg.Auth.PasswordRequireLower,
		cfg.Auth.PasswordRequireNumber,
		cfg.Auth.PasswordRequireSpecial,
	)

	// Initialize services
	authService := service.NewAuthService(userRepo, jwtManager, passwordValidator)
	userService := service.NewUserService(userRepo, dragonfly)
	tenantService := service.NewTenantService(tenantRepo, userRepo, tenantMemberRepo)
	memberService := service.NewTenantMemberService(tenantMemberRepo, userRepo, tenantRepo)
	deptService := service.NewDepartmentService(departmentRepo, tenantRepo)
	roleService := service.NewRoleService(roleRepo, permissionRepo)
	permissionService := service.NewPermissionService(permissionRepo)
	webhookService := service.NewWebhookService(webhookRepo, tenantRepo)
	appService := service.NewApplicationService(applicationRepo)
	locationService := service.NewLocationService(locationRepo, tenantRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	tenantHandler := handler.NewTenantHandler(tenantService)
	memberHandler := handler.NewTenantMemberHandler(memberService)
	deptHandler := handler.NewDepartmentHandler(deptService)
	roleHandler := handler.NewRoleHandler(roleService)
	permissionHandler := handler.NewPermissionHandler(permissionService)
	webhookHandler := handler.NewWebhookHandler(webhookService)
	appHandler := handler.NewApplicationHandler(appService)
	locationHandler := handler.NewLocationHandler(locationService)

	// Setup router
	router := handler.SetupRoutes(
		authHandler,
		userHandler,
		tenantHandler,
		memberHandler,
		deptHandler,
		roleHandler,
		permissionHandler,
		webhookHandler,
		appHandler,
		locationHandler,
		jwtManager,
	)

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	logger.Info("Starting server", zap.String("address", addr))

	server := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		logger.Fatal("Server failed to start", zap.Error(err))
	}
}