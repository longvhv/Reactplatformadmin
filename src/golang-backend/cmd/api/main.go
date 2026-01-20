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
	applicationRepo := repository.NewApplicationRepository(db)
	productRepo := repository.NewProductRepository(db)
	packageRepo := repository.NewPackageRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	invoiceRepo := repository.NewInvoiceRepository(db)
	tenantSubscriptionRepo := repository.NewTenantSubscriptionRepository(db)
	userRoleRepo := repository.NewUserRoleRepository(db)
	userSessionRepo := repository.NewUserSessionRepository(db)
	tenantDomainRepo := repository.NewTenantDomainRepository(db)
	tenantRateLimitRepo := repository.NewTenantRateLimitRepository(db)
	webhookRepo := repository.NewWebhookRepository(db)
	webhookDeliveryLogRepo := repository.NewWebhookDeliveryLogRepository(db)
	tenantApplicationRepo := repository.NewTenantApplicationRepository(db)
	// Tier 4 repositories
	tenantMemberRepo := repository.NewTenantMemberRepository(db)
	tenantInvitationRepo := repository.NewTenantInvitationRepository(db)
	apiKeyRepo := repository.NewAPIKeyRepository(db)
	serviceAccountRepo := repository.NewServiceAccountRepository(db)
	userDeviceRepo := repository.NewUserDeviceRepository(db)
	userMFAMethodRepo := repository.NewUserMFAMethodRepository(db)
	userConsentRepo := repository.NewUserConsentRepository(db)
	tenantSSOConfigRepo := repository.NewTenantSSOConfigRepository(db)
	userDelegationRepo := repository.NewUserDelegationRepository(db)
	tenantAppRouteRepo := repository.NewTenantAppRouteRepository(db)
	usageEventRepo := repository.NewUsageEventRepository(db)
	tenantDigitalAssetRepo := repository.NewTenantDigitalAssetRepository(db)
	legalDocumentRepo := repository.NewLegalDocumentRepository(db)
	notificationTemplateRepo := repository.NewNotificationTemplateRepository(db)
	featureFlagRepo := repository.NewFeatureFlagRepository(db)
	storageFileRepo := repository.NewStorageFileRepository(db)
	auditLogRepo := repository.NewAuditLogRepository(db)
	userGroupRepo := repository.NewUserGroupRepository(db)
	groupMemberRepo := repository.NewGroupMemberRepository(db)
	departmentRepo := repository.NewDepartmentRepository(db)
	departmentMemberRepo := repository.NewDepartmentMemberRepository(db)
	systemJobRepo := repository.NewSystemJobRepository(db)
	systemCategoryRepo := repository.NewSystemCategoryRepository(db)
	reservedSlugRepo := repository.NewReservedSlugRepository(db)
	tagRepo := repository.NewTagRepository(db)
	systemAnnouncementRepo := repository.NewSystemAnnouncementRepository(db)
	regionRepo := repository.NewRegionRepository(db)
	appCapabilityRepo := repository.NewAppCapabilityRepository(db)
	tenantServiceDeliveryRepo := repository.NewTenantServiceDeliveryRepository(db)
	articleTypeRepo := repository.NewArticleTypeRepository(db)
	locationTypeRepo := repository.NewLocationTypeRepository(db)
	locationRepo := repository.NewLocationRepository(db)
	saasProductTypeRepo := repository.NewSaaSProductTypeRepository(db)
	authIdentifierRepo := repository.NewAuthIdentifierRepository(db)
	userIdentityRepo := repository.NewUserIdentityRepository(db)
	authLogRepo := repository.NewAuthLogRepository(db)
	securityAuditLogRepo := repository.NewSecurityAuditLogRepository(db)
	apiUsageLogRepo := repository.NewAPIUsageLogRepository(db)
	contentViewLogRepo := repository.NewContentViewLogRepository(db)
	trafficLogRepo := repository.NewTrafficLogRepository(db)
	userRegistrationLogRepo := repository.NewUserRegistrationLogRepository(db)

	// Initialize services
	roleService := service.NewRoleService(roleRepo)
	userService := service.NewUserService(userRepo)
	tenantService := service.NewTenantService(tenantRepo)
	permissionService := service.NewPermissionService(permissionRepo)
	applicationService := service.NewApplicationService(applicationRepo)
	productService := service.NewProductService(productRepo)
	packageService := service.NewPackageService(packageRepo)
	orderService := service.NewOrderService(orderRepo)
	invoiceService := service.NewInvoiceService(invoiceRepo)
	tenantSubscriptionService := service.NewTenantSubscriptionService(tenantSubscriptionRepo)
	userRoleService := service.NewUserRoleService(userRoleRepo)
	userSessionService := service.NewUserSessionService(userSessionRepo)
	tenantDomainService := service.NewTenantDomainService(tenantDomainRepo)
	tenantRateLimitService := service.NewTenantRateLimitService(tenantRateLimitRepo)
	webhookService := service.NewWebhookService(webhookRepo)
	webhookDeliveryLogService := service.NewWebhookDeliveryLogService(webhookDeliveryLogRepo)
	tenantApplicationService := service.NewTenantApplicationService(tenantApplicationRepo)
	// Tier 4 services
	tenantMemberService := service.NewTenantMemberService(tenantMemberRepo)
	tenantInvitationService := service.NewTenantInvitationService(tenantInvitationRepo)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo)
	serviceAccountService := service.NewServiceAccountService(serviceAccountRepo)
	userDeviceService := service.NewUserDeviceService(userDeviceRepo)
	userMFAMethodService := service.NewUserMFAMethodService(userMFAMethodRepo)
	userConsentService := service.NewUserConsentService(userConsentRepo)
	tenantSSOConfigService := service.NewTenantSSOConfigService(tenantSSOConfigRepo)
	userDelegationService := service.NewUserDelegationService(userDelegationRepo)
	tenantAppRouteService := service.NewTenantAppRouteService(tenantAppRouteRepo)
	usageEventService := service.NewUsageEventService(usageEventRepo)
	tenantDigitalAssetService := service.NewTenantDigitalAssetService(tenantDigitalAssetRepo)
	legalDocumentService := service.NewLegalDocumentService(legalDocumentRepo)
	notificationTemplateService := service.NewNotificationTemplateService(notificationTemplateRepo)
	featureFlagService := service.NewFeatureFlagService(featureFlagRepo)
	storageFileService := service.NewStorageFileService(storageFileRepo)
	auditLogService := service.NewAuditLogService(auditLogRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo)
	groupMemberService := service.NewGroupMemberService(groupMemberRepo)
	departmentService := service.NewDepartmentService(departmentRepo)
	departmentMemberService := service.NewDepartmentMemberService(departmentMemberRepo)
	systemJobService := service.NewSystemJobService(systemJobRepo)
	systemCategoryService := service.NewSystemCategoryService(systemCategoryRepo)
	reservedSlugService := service.NewReservedSlugService(reservedSlugRepo)
	tagService := service.NewTagService(tagRepo)
	systemAnnouncementService := service.NewSystemAnnouncementService(systemAnnouncementRepo)
	regionService := service.NewRegionService(regionRepo)
	appCapabilityService := service.NewAppCapabilityService(appCapabilityRepo)
	tenantServiceDeliveryService := service.NewTenantServiceDeliveryService(tenantServiceDeliveryRepo)
	articleTypeService := service.NewArticleTypeService(articleTypeRepo)
	locationTypeService := service.NewLocationTypeService(locationTypeRepo)
	locationService := service.NewLocationService(locationRepo)
	saasProductTypeService := service.NewSaaSProductTypeService(saasProductTypeRepo)
	authIdentifierService := service.NewAuthIdentifierService(authIdentifierRepo)
	userIdentityService := service.NewUserIdentityService(userIdentityRepo)
	authLogService := service.NewAuthLogService(authLogRepo)
	securityAuditLogService := service.NewSecurityAuditLogService(securityAuditLogRepo)
	apiUsageLogService := service.NewAPIUsageLogService(apiUsageLogRepo)
	contentViewLogService := service.NewContentViewLogService(contentViewLogRepo)
	trafficLogService := service.NewTrafficLogService(trafficLogRepo)
	userRegistrationLogService := service.NewUserRegistrationLogService(userRegistrationLogRepo)

	// Initialize handlers
	roleHandler := handler.NewRoleHandler(roleService)
	userHandler := handler.NewUserHandler(userService)
	tenantHandler := handler.NewTenantHandler(tenantService)
	permissionHandler := handler.NewPermissionHandler(permissionService)
	applicationHandler := handler.NewApplicationHandler(applicationService)
	productHandler := handler.NewProductHandler(productService)
	packageHandler := handler.NewPackageHandler(packageService)
	orderHandler := handler.NewOrderHandler(orderService)
	invoiceHandler := handler.NewInvoiceHandler(invoiceService)
	tenantSubscriptionHandler := handler.NewTenantSubscriptionHandler(tenantSubscriptionService)
	userRoleHandler := handler.NewUserRoleHandler(userRoleService)
	userSessionHandler := handler.NewUserSessionHandler(userSessionService)
	tenantDomainHandler := handler.NewTenantDomainHandler(tenantDomainService)
	tenantRateLimitHandler := handler.NewTenantRateLimitHandler(tenantRateLimitService)
	webhookHandler := handler.NewWebhookHandler(webhookService)
	webhookDeliveryLogHandler := handler.NewWebhookDeliveryLogHandler(webhookDeliveryLogService)
	tenantApplicationHandler := handler.NewTenantApplicationHandler(tenantApplicationService)
	// Tier 4 handlers
	tenantMemberHandler := handler.NewTenantMemberHandler(tenantMemberService)
	tenantInvitationHandler := handler.NewTenantInvitationHandler(tenantInvitationService)
	apiKeyHandler := handler.NewAPIKeyHandler(apiKeyService)
	serviceAccountHandler := handler.NewServiceAccountHandler(serviceAccountService)
	userDeviceHandler := handler.NewUserDeviceHandler(userDeviceService)
	userMFAMethodHandler := handler.NewUserMFAMethodHandler(userMFAMethodService)
	userConsentHandler := handler.NewUserConsentHandler(userConsentService)
	tenantSSOConfigHandler := handler.NewTenantSSOConfigHandler(tenantSSOConfigService)
	userDelegationHandler := handler.NewUserDelegationHandler(userDelegationService)
	tenantAppRouteHandler := handler.NewTenantAppRouteHandler(tenantAppRouteService)
	usageEventHandler := handler.NewUsageEventHandler(usageEventService)
	tenantDigitalAssetHandler := handler.NewTenantDigitalAssetHandler(tenantDigitalAssetService)
	legalDocumentHandler := handler.NewLegalDocumentHandler(legalDocumentService)
	notificationTemplateHandler := handler.NewNotificationTemplateHandler(notificationTemplateService)
	featureFlagHandler := handler.NewFeatureFlagHandler(featureFlagService)
	storageFileHandler := handler.NewStorageFileHandler(storageFileService)
	auditLogHandler := handler.NewAuditLogHandler(auditLogService)
	userGroupHandler := handler.NewUserGroupHandler(userGroupService)
	groupMemberHandler := handler.NewGroupMemberHandler(groupMemberService)
	departmentHandler := handler.NewDepartmentHandler(departmentService)
	departmentMemberHandler := handler.NewDepartmentMemberHandler(departmentMemberService)
	systemJobHandler := handler.NewSystemJobHandler(systemJobService)
	systemCategoryHandler := handler.NewSystemCategoryHandler(systemCategoryService)
	reservedSlugHandler := handler.NewReservedSlugHandler(reservedSlugService)
	tagHandler := handler.NewTagHandler(tagService)
	systemAnnouncementHandler := handler.NewSystemAnnouncementHandler(systemAnnouncementService)
	regionHandler := handler.NewRegionHandler(regionService)
	appCapabilityHandler := handler.NewAppCapabilityHandler(appCapabilityService)
	tenantServiceDeliveryHandler := handler.NewTenantServiceDeliveryHandler(tenantServiceDeliveryService)
	articleTypeHandler := handler.NewArticleTypeHandler(articleTypeService)
	locationTypeHandler := handler.NewLocationTypeHandler(locationTypeService)
	locationHandler := handler.NewLocationHandler(locationService)
	saasProductTypeHandler := handler.NewSaaSProductTypeHandler(saasProductTypeService)
	authIdentifierHandler := handler.NewAuthIdentifierHandler(authIdentifierService)
	userIdentityHandler := handler.NewUserIdentityHandler(userIdentityService)
	authLogHandler := handler.NewAuthLogHandler(authLogService)
	securityAuditLogHandler := handler.NewSecurityAuditLogHandler(securityAuditLogService)
	apiUsageLogHandler := handler.NewAPIUsageLogHandler(apiUsageLogService)
	contentViewLogHandler := handler.NewContentViewLogHandler(contentViewLogService)
	trafficLogHandler := handler.NewTrafficLogHandler(trafficLogService)
	userRegistrationLogHandler := handler.NewUserRegistrationLogHandler(userRegistrationLogService)

	// Setup router
	router := setupRouter(cfg, roleHandler, userHandler, tenantHandler, permissionHandler,
		applicationHandler, productHandler, packageHandler, orderHandler, invoiceHandler,
		tenantSubscriptionHandler, userRoleHandler, userSessionHandler, tenantDomainHandler,
		tenantRateLimitHandler, webhookHandler, webhookDeliveryLogHandler, tenantApplicationHandler,
		tenantMemberHandler, tenantInvitationHandler, apiKeyHandler, serviceAccountHandler, userDeviceHandler,
		userMFAMethodHandler, userConsentHandler, tenantSSOConfigHandler, userDelegationHandler, tenantAppRouteHandler, usageEventHandler, tenantDigitalAssetHandler, legalDocumentHandler, notificationTemplateHandler, featureFlagHandler, storageFileHandler, auditLogHandler, userGroupHandler, groupMemberHandler, departmentHandler, departmentMemberHandler, systemJobHandler, systemCategoryHandler, reservedSlugHandler, tagHandler, systemAnnouncementHandler, regionHandler, appCapabilityHandler, tenantServiceDeliveryHandler, articleTypeHandler, locationTypeHandler, locationHandler, saasProductTypeHandler, authIdentifierHandler, userIdentityHandler, authLogHandler, securityAuditLogHandler, apiUsageLogHandler, contentViewLogHandler, trafficLogHandler, userRegistrationLogHandler)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Server listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRouter(cfg *config.Config, roleHandler *handler.RoleHandler, userHandler *handler.UserHandler, tenantHandler *handler.TenantHandler, permissionHandler *handler.PermissionHandler,
	applicationHandler *handler.ApplicationHandler, productHandler *handler.ProductHandler, packageHandler *handler.PackageHandler, orderHandler *handler.OrderHandler, invoiceHandler *handler.InvoiceHandler,
	tenantSubscriptionHandler *handler.TenantSubscriptionHandler, userRoleHandler *handler.UserRoleHandler, userSessionHandler *handler.UserSessionHandler, tenantDomainHandler *handler.TenantDomainHandler,
	tenantRateLimitHandler *handler.TenantRateLimitHandler, webhookHandler *handler.WebhookHandler, webhookDeliveryLogHandler *handler.WebhookDeliveryLogHandler, tenantApplicationHandler *handler.TenantApplicationHandler,
	tenantMemberHandler *handler.TenantMemberHandler, tenantInvitationHandler *handler.TenantInvitationHandler, apiKeyHandler *handler.APIKeyHandler, serviceAccountHandler *handler.ServiceAccountHandler, userDeviceHandler *handler.UserDeviceHandler,
	userMFAMethodHandler *handler.UserMFAMethodHandler, userConsentHandler *handler.UserConsentHandler, tenantSSOConfigHandler *handler.TenantSSOConfigHandler, userDelegationHandler *handler.UserDelegationHandler, tenantAppRouteHandler *handler.TenantAppRouteHandler, usageEventHandler *handler.UsageEventHandler, tenantDigitalAssetHandler *handler.TenantDigitalAssetHandler, legalDocumentHandler *handler.LegalDocumentHandler, notificationTemplateHandler *handler.NotificationTemplateHandler, featureFlagHandler *handler.FeatureFlagHandler, storageFileHandler *handler.StorageFileHandler, auditLogHandler *handler.AuditLogHandler, userGroupHandler *handler.UserGroupHandler, groupMemberHandler *handler.GroupMemberHandler, departmentHandler *handler.DepartmentHandler, departmentMemberHandler *handler.DepartmentMemberHandler, systemJobHandler *handler.SystemJobHandler, systemCategoryHandler *handler.SystemCategoryHandler, reservedSlugHandler *handler.ReservedSlugHandler, tagHandler *handler.TagHandler, systemAnnouncementHandler *handler.SystemAnnouncementHandler, regionHandler *handler.RegionHandler, appCapabilityHandler *handler.AppCapabilityHandler, tenantServiceDeliveryHandler *handler.TenantServiceDeliveryHandler, articleTypeHandler *handler.ArticleTypeHandler, locationTypeHandler *handler.LocationTypeHandler, locationHandler *handler.LocationHandler, saasProductTypeHandler *handler.SaaSProductTypeHandler, authIdentifierHandler *handler.AuthIdentifierHandler, userIdentityHandler *handler.UserIdentityHandler, authLogHandler *handler.AuthLogHandler, securityAuditLogHandler *handler.SecurityAuditLogHandler, apiUsageLogHandler *handler.APIUsageLogHandler, contentViewLogHandler *handler.ContentViewLogHandler, trafficLogHandler *handler.TrafficLogHandler, userRegistrationLogHandler *handler.UserRegistrationLogHandler) *gin.Engine {
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

		// Applications endpoints
		applications := v1.Group("/applications")
		{
			applications.GET("", applicationHandler.GetAll)
			applications.GET("/:id", applicationHandler.GetByID)
			applications.GET("/code/:code", applicationHandler.GetByCode)
			applications.POST("", applicationHandler.Create)
			applications.PATCH("/:id", applicationHandler.Update)
			applications.DELETE("/:id", applicationHandler.Delete)
		}

		// Products endpoints
		products := v1.Group("/products")
		{
			products.GET("", productHandler.GetAll)
			products.GET("/:id", productHandler.GetByID)
			products.POST("", productHandler.Create)
			products.PATCH("/:id", productHandler.Update)
			products.DELETE("/:id", productHandler.Delete)
		}

		// Packages endpoints
		packages := v1.Group("/packages")
		{
			packages.GET("", packageHandler.GetAll)
			packages.GET("/:id", packageHandler.GetByID)
			packages.POST("", packageHandler.Create)
			packages.PATCH("/:id", packageHandler.Update)
			packages.DELETE("/:id", packageHandler.Delete)
		}

		// Orders endpoints
		orders := v1.Group("/orders")
		{
			orders.GET("", orderHandler.GetAll)
			orders.GET("/:id", orderHandler.GetByID)
			orders.GET("/number/:number", orderHandler.GetByOrderNumber)
			orders.POST("", orderHandler.Create)
			orders.PATCH("/:id", orderHandler.Update)
			orders.DELETE("/:id", orderHandler.Delete)
		}

		// Invoices endpoints
		invoices := v1.Group("/invoices")
		{
			invoices.GET("", invoiceHandler.GetAll)
			invoices.GET("/:id", invoiceHandler.GetByID)
			invoices.GET("/number/:number", invoiceHandler.GetByInvoiceNumber)
			invoices.POST("", invoiceHandler.Create)
			invoices.PATCH("/:id", invoiceHandler.Update)
			invoices.DELETE("/:id", invoiceHandler.Delete)
		}

		// Tenant Subscriptions endpoints
		tenantSubscriptions := v1.Group("/tenant-subscriptions")
		{
			tenantSubscriptions.GET("", tenantSubscriptionHandler.ListSubscriptions)
			tenantSubscriptions.GET("/:id", tenantSubscriptionHandler.GetSubscription)
			tenantSubscriptions.POST("", tenantSubscriptionHandler.CreateSubscription)
			tenantSubscriptions.PUT("/:id", tenantSubscriptionHandler.UpdateSubscription)
			tenantSubscriptions.DELETE("/:id", tenantSubscriptionHandler.DeleteSubscription)
		}

		// User Roles endpoints
		userRoles := v1.Group("/user-roles")
		{
			userRoles.GET("", userRoleHandler.ListUserRoles)
			userRoles.GET("/:id", userRoleHandler.GetUserRole)
			userRoles.POST("", userRoleHandler.AssignRole)
			userRoles.PUT("/:id", userRoleHandler.UpdateUserRole)
			userRoles.DELETE("/:id", userRoleHandler.RevokeRole)
			userRoles.POST("/revoke-expired", userRoleHandler.RevokeExpiredRoles)
		}

		// Add route for user-specific roles
		users.GET("/:user_id/roles", userRoleHandler.GetUserRoles)

		// User Sessions endpoints
		userSessions := v1.Group("/user-sessions")
		{
			userSessions.GET("", userSessionHandler.ListSessions)
			userSessions.GET("/token", userSessionHandler.GetSessionByToken)
			userSessions.GET("/:id", userSessionHandler.GetSession)
			userSessions.POST("", userSessionHandler.CreateSession)
			userSessions.PUT("/:id", userSessionHandler.UpdateSession)
			userSessions.PUT("/:id/activity", userSessionHandler.UpdateSessionActivity)
			userSessions.DELETE("/:id", userSessionHandler.DeleteSession)
			userSessions.POST("/deactivate-expired", userSessionHandler.DeactivateExpiredSessions)
		}

		// Add route for user-specific sessions
		users.GET("/:user_id/sessions", userSessionHandler.GetUserSessions)
		users.DELETE("/:user_id/sessions", userSessionHandler.DeleteAllUserSessions)

		// Tenant Domains endpoints
		tenantDomains := v1.Group("/tenant-domains")
		{
			tenantDomains.GET("", tenantDomainHandler.ListDomains)
			tenantDomains.GET("/:id", tenantDomainHandler.GetDomain)
			tenantDomains.GET("/by-domain/:domain", tenantDomainHandler.GetDomainByName)
			tenantDomains.POST("", tenantDomainHandler.CreateDomain)
			tenantDomains.PUT("/:id", tenantDomainHandler.UpdateDomain)
			tenantDomains.POST("/:id/verify", tenantDomainHandler.VerifyDomain)
			tenantDomains.DELETE("/:id", tenantDomainHandler.DeleteDomain)
		}

		// Add tenant-specific domains route
		tenants.GET("/:tenant_id/domains", tenantDomainHandler.ListDomainsByTenant)

		// Tenant Rate Limits endpoints
		tenantRateLimits := v1.Group("/tenant-rate-limits")
		{
			tenantRateLimits.GET("", tenantRateLimitHandler.ListRateLimits)
			tenantRateLimits.GET("/:id", tenantRateLimitHandler.GetRateLimit)
			tenantRateLimits.POST("", tenantRateLimitHandler.CreateRateLimit)
			tenantRateLimits.PUT("/:id", tenantRateLimitHandler.UpdateRateLimit)
			tenantRateLimits.POST("/:id/increment", tenantRateLimitHandler.IncrementUsage)
			tenantRateLimits.POST("/:id/reset", tenantRateLimitHandler.ResetUsage)
			tenantRateLimits.DELETE("/:id", tenantRateLimitHandler.DeleteRateLimit)
		}

		// Add tenant-specific rate limits route
		tenants.GET("/:tenant_id/rate-limits", tenantRateLimitHandler.ListRateLimitsByTenant)

		// Webhooks endpoints
		webhooks := v1.Group("/webhooks")
		{
			webhooks.GET("", webhookHandler.ListWebhooks)
			webhooks.GET("/:id", webhookHandler.GetWebhook)
			webhooks.POST("", webhookHandler.CreateWebhook)
			webhooks.PUT("/:id", webhookHandler.UpdateWebhook)
			webhooks.POST("/:id/verify", webhookHandler.VerifyWebhook)
			webhooks.POST("/:id/stats", webhookHandler.UpdateWebhookStats)
			webhooks.DELETE("/:id", webhookHandler.DeleteWebhook)
		}

		// Add tenant-specific webhooks route
		tenants.GET("/:tenant_id/webhooks", webhookHandler.ListWebhooksByTenant)

		// Webhook Delivery Logs endpoints
		webhookDeliveryLogs := v1.Group("/webhook-delivery-logs")
		{
			webhookDeliveryLogs.GET("", webhookDeliveryLogHandler.ListLogs)
			webhookDeliveryLogs.GET("/:id", webhookDeliveryLogHandler.GetLog)
			webhookDeliveryLogs.POST("", webhookDeliveryLogHandler.CreateLog)
		}

		// Add webhook-specific delivery logs routes
		webhooks.GET("/:webhook_id/delivery-logs", webhookDeliveryLogHandler.ListLogsByWebhook)
		webhooks.GET("/:webhook_id/delivery-stats", webhookDeliveryLogHandler.GetWebhookStats)

		// Add tenant-specific webhook delivery logs route
		tenants.GET("/:tenant_id/webhook-delivery-logs", webhookDeliveryLogHandler.ListLogsByTenant)

		// Tenant Applications endpoints
		tenantApplications := v1.Group("/tenant-applications")
		{
			tenantApplications.GET("", tenantApplicationHandler.ListApplications)
			tenantApplications.GET("/:id", tenantApplicationHandler.GetApplication)
			tenantApplications.POST("", tenantApplicationHandler.CreateApplication)
			tenantApplications.PUT("/:id", tenantApplicationHandler.UpdateApplication)
			tenantApplications.POST("/:id/activate", tenantApplicationHandler.ActivateApplication)
			tenantApplications.POST("/:id/deactivate", tenantApplicationHandler.DeactivateApplication)
			tenantApplications.DELETE("/:id", tenantApplicationHandler.DeleteApplication)
		}

		// Add tenant-specific applications routes
		tenants.GET("/:tenant_id/applications", tenantApplicationHandler.ListApplicationsByTenant)
		tenants.GET("/:tenant_id/applications/:app_code", tenantApplicationHandler.GetApplicationByTenantAndApp)

		// Tenant Members endpoints
		tenantMembers := v1.Group("/tenant-members")
		{
			tenantMembers.GET("", tenantMemberHandler.ListMembers)
			tenantMembers.GET("/:id", tenantMemberHandler.GetMember)
			tenantMembers.POST("", tenantMemberHandler.CreateMember)
			tenantMembers.PUT("/:id", tenantMemberHandler.UpdateMember)
			tenantMembers.PUT("/:id/status", tenantMemberHandler.UpdateMemberStatus)
			tenantMembers.PUT("/:id/role", tenantMemberHandler.UpdateMemberRole)
			tenantMembers.DELETE("/:id", tenantMemberHandler.DeleteMember)
		}

		// Add tenant-specific members routes
		tenants.GET("/:tenant_id/members", tenantMemberHandler.ListMembersByTenant)
		tenants.GET("/:tenant_id/members/user/:user_id", tenantMemberHandler.GetMemberByTenantAndUser)
		tenants.GET("/:tenant_id/members/count", tenantMemberHandler.GetActiveCount)

		// Add tenant member-specific departments routes
		v1.GET("/tenant-members/:member_id/departments", departmentMemberHandler.ListMembersByTenantMember)

		// Tenant Invitations endpoints
		tenantInvitations := v1.Group("/tenant-invitations")
		{
			tenantInvitations.GET("", tenantInvitationHandler.ListInvitations)
			tenantInvitations.GET("/:id", tenantInvitationHandler.GetInvitation)
			tenantInvitations.GET("/by-token/:token", tenantInvitationHandler.GetInvitationByToken)
			tenantInvitations.POST("", tenantInvitationHandler.CreateInvitation)
			tenantInvitations.PUT("/:id", tenantInvitationHandler.UpdateInvitation)
			tenantInvitations.POST("/accept/:token", tenantInvitationHandler.AcceptInvitation)
			tenantInvitations.POST("/:id/revoke", tenantInvitationHandler.RevokeInvitation)
			tenantInvitations.POST("/:id/resend", tenantInvitationHandler.ResendInvitation)
			tenantInvitations.DELETE("/:id", tenantInvitationHandler.DeleteInvitation)
			tenantInvitations.POST("/expire-old", tenantInvitationHandler.ExpireOldInvitations)
		}

		// Add tenant-specific invitations routes
		tenants.GET("/:tenant_id/invitations", tenantInvitationHandler.ListInvitationsByTenant)

		// API Keys endpoints
		apiKeys := v1.Group("/api-keys")
		{
			apiKeys.GET("", apiKeyHandler.ListAPIKeys)
			apiKeys.GET("/:id", apiKeyHandler.GetAPIKey)
			apiKeys.POST("", apiKeyHandler.CreateAPIKey)
			apiKeys.PUT("/:id", apiKeyHandler.UpdateAPIKey)
			apiKeys.POST("/:id/revoke", apiKeyHandler.RevokeAPIKey)
			apiKeys.POST("/validate", apiKeyHandler.ValidateAPIKey)
			apiKeys.DELETE("/:id", apiKeyHandler.DeleteAPIKey)
		}

		// Add tenant-specific API keys routes
		tenants.GET("/:tenant_id/api-keys", apiKeyHandler.ListAPIKeysByTenant)

		// Service Accounts endpoints
		serviceAccounts := v1.Group("/service-accounts")
		{
			serviceAccounts.GET("", serviceAccountHandler.ListServiceAccounts)
			serviceAccounts.GET("/:id", serviceAccountHandler.GetServiceAccount)
			serviceAccounts.GET("/by-client-id/:client_id", serviceAccountHandler.GetServiceAccountByClientID)
			serviceAccounts.POST("", serviceAccountHandler.CreateServiceAccount)
			serviceAccounts.PUT("/:id", serviceAccountHandler.UpdateServiceAccount)
			serviceAccounts.POST("/:id/activate", serviceAccountHandler.ActivateServiceAccount)
			serviceAccounts.POST("/:id/deactivate", serviceAccountHandler.DeactivateServiceAccount)
			serviceAccounts.POST("/:id/regenerate-secret", serviceAccountHandler.RegenerateClientSecret)
			serviceAccounts.POST("/validate", serviceAccountHandler.ValidateCredentials)
			serviceAccounts.DELETE("/:id", serviceAccountHandler.DeleteServiceAccount)
		}

		// Add tenant-specific service accounts routes
		tenants.GET("/:tenant_id/service-accounts", serviceAccountHandler.ListServiceAccountsByTenant)

		// User Devices endpoints
		userDevices := v1.Group("/user-devices")
		{
			userDevices.GET("", userDeviceHandler.ListDevices)
			userDevices.GET("/:id", userDeviceHandler.GetDevice)
			userDevices.GET("/by-fingerprint", userDeviceHandler.GetDeviceByFingerprint)
			userDevices.POST("", userDeviceHandler.RegisterDevice)
			userDevices.PUT("/:id", userDeviceHandler.UpdateDevice)
			userDevices.POST("/:id/activity", userDeviceHandler.UpdateDeviceActivity)
			userDevices.POST("/:id/trust", userDeviceHandler.TrustDevice)
			userDevices.POST("/:id/untrust", userDeviceHandler.UntrustDevice)
			userDevices.POST("/:id/revoke", userDeviceHandler.RevokeDevice)
			userDevices.DELETE("/:id", userDeviceHandler.DeleteDevice)
		}

		// Add user-specific devices routes
		users.GET("/:user_id/devices", userDeviceHandler.ListDevicesByUser)
		users.GET("/:user_id/devices/count", userDeviceHandler.GetActiveDevicesCount)
		users.GET("/:user_id/devices/trusted", userDeviceHandler.ListTrustedDevices)

		// User MFA Methods endpoints
		userMFAMethods := v1.Group("/user-mfa-methods")
		{
			userMFAMethods.GET("", userMFAMethodHandler.ListMFAMethods)
			userMFAMethods.GET("/:id", userMFAMethodHandler.GetMFAMethod)
			userMFAMethods.POST("", userMFAMethodHandler.CreateMFAMethod)
			userMFAMethods.PUT("/:id", userMFAMethodHandler.UpdateMFAMethod)
			userMFAMethods.POST("/:id/activate", userMFAMethodHandler.ActivateMFAMethod)
			userMFAMethods.POST("/:id/deactivate", userMFAMethodHandler.DeactivateMFAMethod)
			userMFAMethods.POST("/:id/verify", userMFAMethodHandler.VerifyMFAMethod)
			userMFAMethods.DELETE("/:id", userMFAMethodHandler.DeleteMFAMethod)
		}

		// Add user-specific MFA methods routes
		users.GET("/:user_id/mfa-methods", userMFAMethodHandler.ListMFAMethodsByUser)
		users.GET("/:user_id/mfa-methods/primary", userMFAMethodHandler.GetPrimaryMethod)
		users.POST("/:user_id/mfa-methods/:method_id/set-primary", userMFAMethodHandler.SetPrimaryMethod)

		// User Consents endpoints
		userConsents := v1.Group("/user-consents")
		{
			userConsents.GET("", userConsentHandler.ListConsents)
			userConsents.GET("/:id", userConsentHandler.GetConsent)
			userConsents.POST("", userConsentHandler.CreateConsent)
			userConsents.POST("/:id/withdraw", userConsentHandler.WithdrawConsent)
			userConsents.POST("/:id/renew", userConsentHandler.RenewConsent)
			userConsents.DELETE("/:id", userConsentHandler.DeleteConsent)
			userConsents.GET("/expired", userConsentHandler.GetExpiredConsents)
		}

		// Add user-specific consents routes
		users.GET("/:user_id/consents", userConsentHandler.ListConsentsByUser)
		users.GET("/:user_id/consents/document/:document_id/latest", userConsentHandler.GetLatestConsent)

		// Add document-specific consents routes
		v1.GET("/documents/:document_id/consents", userConsentHandler.ListConsentsByDocument)

		// Tenant SSO Configs endpoints
		tenantSSOConfigs := v1.Group("/tenant-sso-configs")
		{
			tenantSSOConfigs.GET("", tenantSSOConfigHandler.ListSSOConfigs)
			tenantSSOConfigs.GET("/:id", tenantSSOConfigHandler.GetSSOConfig)
			tenantSSOConfigs.POST("", tenantSSOConfigHandler.CreateSSOConfig)
			tenantSSOConfigs.PUT("/:id", tenantSSOConfigHandler.UpdateSSOConfig)
			tenantSSOConfigs.POST("/:id/activate", tenantSSOConfigHandler.ActivateSSOConfig)
			tenantSSOConfigs.POST("/:id/deactivate", tenantSSOConfigHandler.DeactivateSSOConfig)
			tenantSSOConfigs.POST("/:id/test", tenantSSOConfigHandler.TestSSOConfig)
			tenantSSOConfigs.DELETE("/:id", tenantSSOConfigHandler.DeleteSSOConfig)
		}

		// Add tenant-specific SSO configs routes
		tenants.GET("/:tenant_id/sso-configs", tenantSSOConfigHandler.ListSSOConfigsByTenant)
		tenants.GET("/:tenant_id/sso-configs/provider/:provider", tenantSSOConfigHandler.GetSSOConfigByTenantAndProvider)

		// User Delegations endpoints
		userDelegations := v1.Group("/user-delegations")
		{
			userDelegations.GET("", userDelegationHandler.ListDelegations)
			userDelegations.GET("/:id", userDelegationHandler.GetDelegation)
			userDelegations.POST("", userDelegationHandler.CreateDelegation)
			userDelegations.PUT("/:id", userDelegationHandler.UpdateDelegation)
			userDelegations.POST("/:id/activate", userDelegationHandler.ActivateDelegation)
			userDelegations.POST("/:id/revoke", userDelegationHandler.RevokeDelegation)
			userDelegations.POST("/:id/suspend", userDelegationHandler.SuspendDelegation)
			userDelegations.DELETE("/:id", userDelegationHandler.DeleteDelegation)
			userDelegations.POST("/expire-old", userDelegationHandler.ExpireOldDelegations)
		}

		// Add user-specific delegations routes
		users.GET("/:delegator_id/delegations", userDelegationHandler.ListDelegationsByDelegator)
		users.GET("/:delegate_id/delegated-to-me", userDelegationHandler.ListDelegationsByDelegate)
		users.GET("/:delegator_id/delegations/active", userDelegationHandler.GetActiveDelegations)

		// Tenant App Routes endpoints
		tenantAppRoutes := v1.Group("/tenant-app-routes")
		{
			tenantAppRoutes.GET("", tenantAppRouteHandler.ListRoutes)
			tenantAppRoutes.GET("/:id", tenantAppRouteHandler.GetRoute)
			tenantAppRoutes.GET("/domain/:domain", tenantAppRouteHandler.GetRouteByDomain)
			tenantAppRoutes.POST("", tenantAppRouteHandler.CreateRoute)
			tenantAppRoutes.PUT("/:id", tenantAppRouteHandler.UpdateRoute)
			tenantAppRoutes.POST("/:id/ssl-status", tenantAppRouteHandler.UpdateSSLStatus)
			tenantAppRoutes.POST("/:id/status", tenantAppRouteHandler.UpdateStatus)
			tenantAppRoutes.DELETE("/:id", tenantAppRouteHandler.DeleteRoute)
		}

		// Add tenant-specific app routes routes
		tenants.GET("/:tenant_id/app-routes", tenantAppRouteHandler.ListRoutesByTenant)
		tenants.GET("/:tenant_id/app-routes/:app_code/primary", tenantAppRouteHandler.GetPrimaryRoute)
		tenants.POST("/:tenant_id/app-routes/:app_code/:route_id/set-primary", tenantAppRouteHandler.SetPrimaryRoute)

		// Add app-specific routes
		v1.GET("/app-routes/app/:app_code", tenantAppRouteHandler.ListRoutesByAppCode)

		// Usage Events endpoints
		usageEvents := v1.Group("/usage-events")
		{
			usageEvents.GET("", usageEventHandler.ListEvents)
			usageEvents.GET("/:id", usageEventHandler.GetEvent)
			usageEvents.POST("", usageEventHandler.CreateEvent)
			usageEvents.DELETE("/old", usageEventHandler.DeleteOldEvents)
		}

		// Add tenant-specific usage events routes
		tenants.GET("/:tenant_id/usage-events", usageEventHandler.ListEventsByTenant)
		tenants.GET("/:tenant_id/usage-summary", usageEventHandler.GetSummaryByTenant)
		tenants.GET("/:tenant_id/usage-total", usageEventHandler.GetTotalUsage)

		// Add subscription-specific usage events routes
		v1.GET("/subscriptions/:subscription_id/usage-events", usageEventHandler.ListEventsBySubscription)
		v1.GET("/subscriptions/:subscription_id/usage-summary", usageEventHandler.GetSummaryBySubscription)

		// Tenant Digital Assets endpoints
		tenantDigitalAssets := v1.Group("/tenant-digital-assets")
		{
			tenantDigitalAssets.GET("", tenantDigitalAssetHandler.ListAssets)
			tenantDigitalAssets.GET("/:id", tenantDigitalAssetHandler.GetAsset)
			tenantDigitalAssets.GET("/type/:asset_type", tenantDigitalAssetHandler.ListAssetsByType)
			tenantDigitalAssets.GET("/expiring", tenantDigitalAssetHandler.ListExpiringAssets)
			tenantDigitalAssets.POST("", tenantDigitalAssetHandler.CreateAsset)
			tenantDigitalAssets.PUT("/:id", tenantDigitalAssetHandler.UpdateAsset)
			tenantDigitalAssets.POST("/:id/activate", tenantDigitalAssetHandler.ActivateAsset)
			tenantDigitalAssets.POST("/:id/suspend", tenantDigitalAssetHandler.SuspendAsset)
			tenantDigitalAssets.POST("/:id/expire", tenantDigitalAssetHandler.ExpireAsset)
			tenantDigitalAssets.POST("/:id/status", tenantDigitalAssetHandler.UpdateAssetStatus)
			tenantDigitalAssets.DELETE("/:id", tenantDigitalAssetHandler.DeleteAsset)
		}

		// Add tenant-specific digital assets routes
		tenants.GET("/:tenant_id/digital-assets", tenantDigitalAssetHandler.ListAssetsByTenant)
		tenants.GET("/:tenant_id/digital-assets/active", tenantDigitalAssetHandler.ListActiveAssets)

		// Add order-specific digital assets route
		v1.GET("/orders/:order_id/digital-assets", tenantDigitalAssetHandler.ListAssetsByOrder)

		// Legal Documents endpoints
		legalDocuments := v1.Group("/legal-documents")
		{
			legalDocuments.GET("", legalDocumentHandler.ListDocuments)
			legalDocuments.GET("/published", legalDocumentHandler.ListPublishedDocuments)
			legalDocuments.GET("/type/:type/latest", legalDocumentHandler.GetLatestByType)
			legalDocuments.GET("/:id", legalDocumentHandler.GetDocument)
			legalDocuments.GET("/slug/:slug", legalDocumentHandler.GetDocumentBySlug)
			legalDocuments.POST("", legalDocumentHandler.CreateDocument)
			legalDocuments.PUT("/:id", legalDocumentHandler.UpdateDocument)
			legalDocuments.POST("/:id/publish", legalDocumentHandler.PublishDocument)
			legalDocuments.POST("/:id/archive", legalDocumentHandler.ArchiveDocument)
			legalDocuments.POST("/:id/accept", legalDocumentHandler.IncrementAcceptCount)
			legalDocuments.DELETE("/:id", legalDocumentHandler.DeleteDocument)
		}

		// Add tenant-specific legal documents routes
		tenants.GET("/:tenant_id/legal-documents", legalDocumentHandler.ListDocumentsByTenant)

		// Add document type-specific routes
		v1.GET("/legal-documents/type/:type", legalDocumentHandler.ListDocumentsByType)

		// Notification Templates endpoints
		notificationTemplates := v1.Group("/notification-templates")
		{
			notificationTemplates.GET("", notificationTemplateHandler.ListTemplates)
			notificationTemplates.GET("/:id", notificationTemplateHandler.GetTemplate)
			notificationTemplates.POST("", notificationTemplateHandler.CreateTemplate)
			notificationTemplates.PUT("/:id", notificationTemplateHandler.UpdateTemplate)
			notificationTemplates.DELETE("/:id", notificationTemplateHandler.DeleteTemplate)
		}

		// Add tenant-specific notification templates routes
		tenants.GET("/:tenant_id/notification-templates", notificationTemplateHandler.ListTemplatesByTenant)
		tenants.GET("/:tenant_id/notification-templates/active", notificationTemplateHandler.ListActiveTemplates)
		v1.GET("/notification-templates/code/:code", notificationTemplateHandler.GetTemplateByCode)
		v1.GET("/notification-templates/type/:type", notificationTemplateHandler.ListTemplatesByType)
		v1.GET("/notification-templates/category/:category", notificationTemplateHandler.ListTemplatesByCategory)
		v1.POST("/notification-templates/:id/soft-delete", notificationTemplateHandler.SoftDeleteTemplate)
		v1.POST("/notification-templates/:id/use", notificationTemplateHandler.IncrementUsageCount)
		v1.POST("/notification-templates/:id/stats", notificationTemplateHandler.UpdateStats)

		// Feature Flags endpoints
		featureFlags := v1.Group("/feature-flags")
		{
			featureFlags.GET("", featureFlagHandler.ListFlags)
			featureFlags.GET("/enabled", featureFlagHandler.ListEnabledFlags)
			featureFlags.GET("/:id", featureFlagHandler.GetFlag)
			featureFlags.GET("/key/:key", featureFlagHandler.GetFlagByKey)
			featureFlags.GET("/key/:key/check", featureFlagHandler.IsFeatureEnabled)
			featureFlags.POST("", featureFlagHandler.CreateFlag)
			featureFlags.PUT("/:id", featureFlagHandler.UpdateFlag)
			featureFlags.POST("/:id/enable", featureFlagHandler.EnableFlag)
			featureFlags.POST("/:id/disable", featureFlagHandler.DisableFlag)
			featureFlags.POST("/:id/rollout", featureFlagHandler.UpdateRolloutPercentage)
			featureFlags.DELETE("/:id", featureFlagHandler.DeleteFlag)
		}

		// Add environment-specific feature flags routes
		v1.GET("/feature-flags/environment/:environment", featureFlagHandler.ListFlagsByEnvironment)

		// Storage Files endpoints
		storageFiles := v1.Group("/storage-files")
		{
			storageFiles.GET("", storageFileHandler.ListFiles)
			storageFiles.GET("/:id", storageFileHandler.GetFile)
			storageFiles.GET("/parent/:parent_id", storageFileHandler.ListFilesByParent)
			storageFiles.GET("/category/:category", storageFileHandler.ListFilesByCategory)
			storageFiles.POST("", storageFileHandler.CreateFile)
			storageFiles.PUT("/:id", storageFileHandler.UpdateFile)
			storageFiles.POST("/:id/status", storageFileHandler.UpdateStatus)
			storageFiles.POST("/:id/soft-delete", storageFileHandler.SoftDeleteFile)
			storageFiles.DELETE("/:id", storageFileHandler.DeleteFile)
		}

		// Add tenant-specific storage files routes
		tenants.GET("/:tenant_id/storage-files", storageFileHandler.ListFilesByTenant)
		tenants.GET("/:tenant_id/storage-files/folders", storageFileHandler.ListFolders)
		tenants.GET("/:tenant_id/storage-files/total-size", storageFileHandler.GetTotalSize)

		// Audit Logs endpoints
		auditLogs := v1.Group("/audit-logs")
		{
			auditLogs.GET("", auditLogHandler.ListLogs)
			auditLogs.GET("/:id", auditLogHandler.GetLog)
			auditLogs.POST("", auditLogHandler.CreateLog)
			auditLogs.POST("/delete-old", auditLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific audit logs routes
		tenants.GET("/:tenant_id/audit-logs", auditLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/audit-logs/stats", auditLogHandler.GetStatsByTenant)

		// Add user-specific audit logs routes
		users.GET("/:user_id/audit-logs", auditLogHandler.ListLogsByUser)
		users.GET("/:user_id/audit-logs/stats", auditLogHandler.GetStatsByUser)

		// Add resource-specific audit logs routes
		v1.GET("/audit-logs/resource/:resource/:resource_id", auditLogHandler.ListLogsByResource)
		v1.GET("/audit-logs/action/:action", auditLogHandler.ListLogsByAction)
		v1.GET("/audit-logs/ip/:ip", auditLogHandler.ListLogsByIPAddress)

		// User Groups endpoints
		userGroups := v1.Group("/user-groups")
		{
			userGroups.GET("", userGroupHandler.ListGroups)
			userGroups.GET("/:id", userGroupHandler.GetGroup)
			userGroups.POST("", userGroupHandler.CreateGroup)
			userGroups.PUT("/:id", userGroupHandler.UpdateGroup)
			userGroups.POST("/:id/status", userGroupHandler.UpdateGroupStatus)
			userGroups.POST("/:id/soft-delete", userGroupHandler.SoftDeleteGroup)
			userGroups.DELETE("/:id", userGroupHandler.DeleteGroup)
		}

		// Add tenant-specific user groups routes
		tenants.GET("/:tenant_id/user-groups", userGroupHandler.ListGroupsByTenant)
		tenants.GET("/:tenant_id/user-groups/code/:code", userGroupHandler.GetGroupByCode)
		tenants.GET("/:tenant_id/user-groups/status/:status", userGroupHandler.ListGroupsByStatus)

		// Group Members endpoints
		groupMembers := v1.Group("/group-members")
		{
			groupMembers.GET("", groupMemberHandler.ListMembers)
			groupMembers.GET("/:id", groupMemberHandler.GetMember)
			groupMembers.POST("", groupMemberHandler.AddMember)
			groupMembers.PUT("/:id", groupMemberHandler.UpdateMember)
			groupMembers.POST("/:id/remove", groupMemberHandler.RemoveMember)
			groupMembers.POST("/:id/soft-delete", groupMemberHandler.SoftDeleteMember)
			groupMembers.DELETE("/:id", groupMemberHandler.DeleteMember)
		}

		// Add group-specific members routes
		userGroups.GET("/:group_id/members", groupMemberHandler.ListMembersByGroup)
		userGroups.GET("/:group_id/members/count", groupMemberHandler.GetActiveCount)
		userGroups.GET("/:group_id/members/:member_id", groupMemberHandler.GetByGroupAndMember)

		// Add tenant member-specific groups routes
		v1.GET("/tenant-members/:member_id/groups", groupMemberHandler.ListMembersByTenantMember)

		// Department endpoints
		departments := v1.Group("/departments")
		{
			departments.GET("", departmentHandler.ListDepartments)
			departments.GET("/:id", departmentHandler.GetDepartment)
			departments.POST("", departmentHandler.CreateDepartment)
			departments.PUT("/:id", departmentHandler.UpdateDepartment)
			departments.POST("/:id/status", departmentHandler.UpdateDepartmentStatus)
			departments.POST("/:id/soft-delete", departmentHandler.SoftDeleteDepartment)
			departments.DELETE("/:id", departmentHandler.DeleteDepartment)
		}

		// Add tenant-specific department routes
		tenants.GET("/:tenant_id/departments", departmentHandler.ListDepartmentsByTenant)
		tenants.GET("/:tenant_id/departments/code/:code", departmentHandler.GetDepartmentByCode)
		tenants.GET("/:tenant_id/departments/status/:status", departmentHandler.ListDepartmentsByStatus)

		// Department Members endpoints
		departmentMembers := v1.Group("/department-members")
		{
			departmentMembers.GET("", departmentMemberHandler.ListMembers)
			departmentMembers.GET("/:id", departmentMemberHandler.GetMember)
			departmentMembers.POST("", departmentMemberHandler.AddMember)
			departmentMembers.PUT("/:id", departmentMemberHandler.UpdateMember)
			departmentMembers.POST("/:id/remove", departmentMemberHandler.RemoveMember)
			departmentMembers.POST("/:id/soft-delete", departmentMemberHandler.SoftDeleteMember)
			departmentMembers.DELETE("/:id", departmentMemberHandler.DeleteMember)
		}

		// Add department-specific members routes
		departments.GET("/:department_id/members", departmentMemberHandler.ListMembersByDepartment)
		departments.GET("/:department_id/members/count", departmentMemberHandler.GetActiveCount)
		departments.GET("/:department_id/members/:member_id", departmentMemberHandler.GetByDepartmentAndMember)

		// Add tenant member-specific departments routes
		v1.GET("/tenant-members/:member_id/departments", departmentMemberHandler.ListMembersByTenantMember)

		// System Jobs endpoints
		systemJobs := v1.Group("/system-jobs")
		{
			systemJobs.GET("", systemJobHandler.ListJobs)
			systemJobs.GET("/:id", systemJobHandler.GetJob)
			systemJobs.GET("/pending", systemJobHandler.GetPendingJobs)
			systemJobs.GET("/type/:type", systemJobHandler.GetJobsByType)
			systemJobs.POST("", systemJobHandler.CreateJob)
			systemJobs.PUT("/:id", systemJobHandler.UpdateJob)
			systemJobs.POST("/:id/status", systemJobHandler.UpdateJobStatus)
			systemJobs.DELETE("/:id", systemJobHandler.DeleteJob)
		}

		// System Categories endpoints
		systemCategories := v1.Group("/system-categories")
		{
			systemCategories.GET("", systemCategoryHandler.ListCategories)
			systemCategories.GET("/:id", systemCategoryHandler.GetCategory)
			systemCategories.POST("", systemCategoryHandler.CreateCategory)
			systemCategories.PUT("/:id", systemCategoryHandler.UpdateCategory)
			systemCategories.POST("/:id/soft-delete", systemCategoryHandler.SoftDeleteCategory)
			systemCategories.DELETE("/:id", systemCategoryHandler.DeleteCategory)
		}

		// Add tenant-specific system categories routes
		tenants.GET("/:tenant_id/system-categories", systemCategoryHandler.ListCategoriesByTenant)
		tenants.GET("/:tenant_id/system-categories/code/:code", systemCategoryHandler.GetCategoryByCode)
		tenants.GET("/:tenant_id/system-categories/type/:type", systemCategoryHandler.ListCategoriesByType)

		// Reserved Slugs endpoints
		reservedSlugs := v1.Group("/reserved-slugs")
		{
			reservedSlugs.GET("", reservedSlugHandler.ListSlugs)
			reservedSlugs.GET("/active", reservedSlugHandler.ListActiveSlugs)
			reservedSlugs.GET("/:id", reservedSlugHandler.GetSlug)
			reservedSlugs.GET("/by-slug/:slug", reservedSlugHandler.GetSlugByName)
			reservedSlugs.GET("/type/:type", reservedSlugHandler.ListSlugsByType)
			reservedSlugs.POST("", reservedSlugHandler.CreateSlug)
			reservedSlugs.POST("/check", reservedSlugHandler.CheckSlug)
			reservedSlugs.PUT("/:id", reservedSlugHandler.UpdateSlug)
			reservedSlugs.DELETE("/:id", reservedSlugHandler.DeleteSlug)
		}

		// Tags endpoints
		tags := v1.Group("/tags")
		{
			tags.GET("", tagHandler.ListTags)
			tags.GET("/:id", tagHandler.GetTag)
			tags.POST("", tagHandler.CreateTag)
			tags.PUT("/:id", tagHandler.UpdateTag)
			tags.POST("/:id/soft-delete", tagHandler.SoftDeleteTag)
			tags.DELETE("/:id", tagHandler.DeleteTag)
		}

		// System Announcements endpoints
		systemAnnouncements := v1.Group("/system-announcements")
		{
			systemAnnouncements.GET("", systemAnnouncementHandler.ListAnnouncements)
			systemAnnouncements.GET("/:id", systemAnnouncementHandler.GetAnnouncement)
			systemAnnouncements.POST("", systemAnnouncementHandler.CreateAnnouncement)
			systemAnnouncements.PUT("/:id", systemAnnouncementHandler.UpdateAnnouncement)
			systemAnnouncements.POST("/:id/status", systemAnnouncementHandler.UpdateAnnouncementStatus)
			systemAnnouncements.DELETE("/:id", systemAnnouncementHandler.DeleteAnnouncement)
		}

		// Regions endpoints
		regions := v1.Group("/regions")
		{
			regions.GET("", regionHandler.ListRegions)
			regions.GET("/:id", regionHandler.GetRegion)
			regions.POST("", regionHandler.CreateRegion)
			regions.PUT("/:id", regionHandler.UpdateRegion)
			regions.POST("/:id/status", regionHandler.UpdateRegionStatus)
			regions.POST("/:id/soft-delete", regionHandler.SoftDeleteRegion)
			regions.DELETE("/:id", regionHandler.DeleteRegion)
		}

		// App Capabilities endpoints
		appCapabilities := v1.Group("/app-capabilities")
		{
			appCapabilities.GET("", appCapabilityHandler.ListCapabilities)
			appCapabilities.GET("/:id", appCapabilityHandler.GetCapability)
			appCapabilities.POST("", appCapabilityHandler.CreateCapability)
			appCapabilities.PUT("/:id", appCapabilityHandler.UpdateCapability)
			appCapabilities.POST("/:id/status", appCapabilityHandler.UpdateCapabilityStatus)
			appCapabilities.POST("/:id/soft-delete", appCapabilityHandler.SoftDeleteCapability)
			appCapabilities.DELETE("/:id", appCapabilityHandler.DeleteCapability)
		}

		// Tenant Service Deliveries endpoints
		tenantServiceDeliveries := v1.Group("/tenant-service-deliveries")
		{
			tenantServiceDeliveries.GET("", tenantServiceDeliveryHandler.ListDeliveries)
			tenantServiceDeliveries.GET("/:id", tenantServiceDeliveryHandler.GetDelivery)
			tenantServiceDeliveries.POST("", tenantServiceDeliveryHandler.CreateDelivery)
			tenantServiceDeliveries.PUT("/:id", tenantServiceDeliveryHandler.UpdateDelivery)
			tenantServiceDeliveries.POST("/:id/status", tenantServiceDeliveryHandler.UpdateDeliveryStatus)
			tenantServiceDeliveries.DELETE("/:id", tenantServiceDeliveryHandler.DeleteDelivery)
		}

		// Article Types endpoints
		articleTypes := v1.Group("/article-types")
		{
			articleTypes.GET("", articleTypeHandler.ListArticleTypes)
			articleTypes.GET("/:id", articleTypeHandler.GetArticleType)
			articleTypes.POST("", articleTypeHandler.CreateArticleType)
			articleTypes.PUT("/:id", articleTypeHandler.UpdateArticleType)
			articleTypes.POST("/:id/status", articleTypeHandler.UpdateArticleTypeStatus)
			articleTypes.POST("/:id/soft-delete", articleTypeHandler.SoftDeleteArticleType)
			articleTypes.DELETE("/:id", articleTypeHandler.DeleteArticleType)
		}

		// Location Types endpoints
		locationTypes := v1.Group("/location-types")
		{
			locationTypes.GET("", locationTypeHandler.ListLocationTypes)
			locationTypes.GET("/:id", locationTypeHandler.GetLocationType)
			locationTypes.POST("", locationTypeHandler.CreateLocationType)
			locationTypes.PUT("/:id", locationTypeHandler.UpdateLocationType)
			locationTypes.POST("/:id/status", locationTypeHandler.UpdateLocationTypeStatus)
			locationTypes.POST("/:id/soft-delete", locationTypeHandler.SoftDeleteLocationType)
			locationTypes.DELETE("/:id", locationTypeHandler.DeleteLocationType)
		}

		// Locations endpoints
		locations := v1.Group("/locations")
		{
			locations.GET("", locationHandler.ListLocations)
			locations.GET("/:id", locationHandler.GetLocation)
			locations.POST("", locationHandler.CreateLocation)
			locations.PUT("/:id", locationHandler.UpdateLocation)
			locations.POST("/:id/status", locationHandler.UpdateLocationStatus)
			locations.POST("/:id/soft-delete", locationHandler.SoftDeleteLocation)
			locations.DELETE("/:id", locationHandler.DeleteLocation)
		}

		// SaaS Product Types endpoints
		saaSProductTypes := v1.Group("/saas-product-types")
		{
			saaSProductTypes.GET("", saasProductTypeHandler.ListSaaSProductTypes)
			saaSProductTypes.GET("/:id", saasProductTypeHandler.GetSaaSProductType)
			saaSProductTypes.POST("", saasProductTypeHandler.CreateSaaSProductType)
			saaSProductTypes.PUT("/:id", saasProductTypeHandler.UpdateSaaSProductType)
			saaSProductTypes.POST("/:id/status", saasProductTypeHandler.UpdateSaaSProductTypeStatus)
			saaSProductTypes.POST("/:id/soft-delete", saasProductTypeHandler.SoftDeleteSaaSProductType)
			saaSProductTypes.DELETE("/:id", saasProductTypeHandler.DeleteSaaSProductType)
		}

		// Auth Identifiers endpoints
		authIdentifiers := v1.Group("/auth-identifiers")
		{
			authIdentifiers.GET("", authIdentifierHandler.ListAuthIdentifiers)
			authIdentifiers.GET("/:id", authIdentifierHandler.GetAuthIdentifier)
			authIdentifiers.POST("", authIdentifierHandler.CreateAuthIdentifier)
			authIdentifiers.PUT("/:id", authIdentifierHandler.UpdateAuthIdentifier)
			authIdentifiers.POST("/:id/status", authIdentifierHandler.UpdateAuthIdentifierStatus)
			authIdentifiers.POST("/:id/soft-delete", authIdentifierHandler.SoftDeleteAuthIdentifier)
			authIdentifiers.DELETE("/:id", authIdentifierHandler.DeleteAuthIdentifier)
		}

		// User Identities endpoints
		userIdentities := v1.Group("/user-identities")
		{
			userIdentities.GET("", userIdentityHandler.ListUserIdentities)
			userIdentities.GET("/:id", userIdentityHandler.GetUserIdentity)
			userIdentities.POST("", userIdentityHandler.CreateUserIdentity)
			userIdentities.PUT("/:id", userIdentityHandler.UpdateUserIdentity)
			userIdentities.POST("/:id/status", userIdentityHandler.UpdateUserIdentityStatus)
			userIdentities.POST("/:id/soft-delete", userIdentityHandler.SoftDeleteUserIdentity)
			userIdentities.DELETE("/:id", userIdentityHandler.DeleteUserIdentity)
		}

		// Auth Logs endpoints
		authLogs := v1.Group("/auth-logs")
		{
			authLogs.GET("", authLogHandler.ListLogs)
			authLogs.GET("/:id", authLogHandler.GetLog)
			authLogs.POST("", authLogHandler.CreateLog)
			authLogs.POST("/delete-old", authLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific auth logs routes
		tenants.GET("/:tenant_id/auth-logs", authLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/auth-logs/stats", authLogHandler.GetStatsByTenant)

		// Add user-specific auth logs routes
		users.GET("/:user_id/auth-logs", authLogHandler.ListLogsByUser)
		users.GET("/:user_id/auth-logs/stats", authLogHandler.GetStatsByUser)

		// Add resource-specific auth logs routes
		v1.GET("/auth-logs/resource/:resource/:resource_id", authLogHandler.ListLogsByResource)
		v1.GET("/auth-logs/action/:action", authLogHandler.ListLogsByAction)
		v1.GET("/auth-logs/ip/:ip", authLogHandler.ListLogsByIPAddress)

		// Security Audit Logs endpoints
		securityAuditLogs := v1.Group("/security-audit-logs")
		{
			securityAuditLogs.GET("", securityAuditLogHandler.ListLogs)
			securityAuditLogs.GET("/:id", securityAuditLogHandler.GetLog)
			securityAuditLogs.POST("", securityAuditLogHandler.CreateLog)
			securityAuditLogs.POST("/delete-old", securityAuditLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific security audit logs routes
		tenants.GET("/:tenant_id/security-audit-logs", securityAuditLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/security-audit-logs/stats", securityAuditLogHandler.GetStatsByTenant)

		// Add user-specific security audit logs routes
		users.GET("/:user_id/security-audit-logs", securityAuditLogHandler.ListLogsByUser)
		users.GET("/:user_id/security-audit-logs/stats", securityAuditLogHandler.GetStatsByUser)

		// Add resource-specific security audit logs routes
		v1.GET("/security-audit-logs/resource/:resource/:resource_id", securityAuditLogHandler.ListLogsByResource)
		v1.GET("/security-audit-logs/action/:action", securityAuditLogHandler.ListLogsByAction)
		v1.GET("/security-audit-logs/ip/:ip", securityAuditLogHandler.ListLogsByIPAddress)

		// API Usage Logs endpoints
		apiUsageLogs := v1.Group("/api-usage-logs")
		{
			apiUsageLogs.GET("", apiUsageLogHandler.ListLogs)
			apiUsageLogs.GET("/:id", apiUsageLogHandler.GetLog)
			apiUsageLogs.POST("", apiUsageLogHandler.CreateLog)
			apiUsageLogs.POST("/delete-old", apiUsageLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific API usage logs routes
		tenants.GET("/:tenant_id/api-usage-logs", apiUsageLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/api-usage-logs/stats", apiUsageLogHandler.GetStatsByTenant)

		// Add user-specific API usage logs routes
		users.GET("/:user_id/api-usage-logs", apiUsageLogHandler.ListLogsByUser)
		users.GET("/:user_id/api-usage-logs/stats", apiUsageLogHandler.GetStatsByUser)

		// Add resource-specific API usage logs routes
		v1.GET("/api-usage-logs/resource/:resource/:resource_id", apiUsageLogHandler.ListLogsByResource)
		v1.GET("/api-usage-logs/action/:action", apiUsageLogHandler.ListLogsByAction)
		v1.GET("/api-usage-logs/ip/:ip", apiUsageLogHandler.ListLogsByIPAddress)

		// Content View Logs endpoints
		contentViewLogs := v1.Group("/content-view-logs")
		{
			contentViewLogs.GET("", contentViewLogHandler.ListLogs)
			contentViewLogs.GET("/:id", contentViewLogHandler.GetLog)
			contentViewLogs.POST("", contentViewLogHandler.CreateLog)
			contentViewLogs.POST("/delete-old", contentViewLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific content view logs routes
		tenants.GET("/:tenant_id/content-view-logs", contentViewLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/content-view-logs/stats", contentViewLogHandler.GetStatsByTenant)

		// Add user-specific content view logs routes
		users.GET("/:user_id/content-view-logs", contentViewLogHandler.ListLogsByUser)
		users.GET("/:user_id/content-view-logs/stats", contentViewLogHandler.GetStatsByUser)

		// Add resource-specific content view logs routes
		v1.GET("/content-view-logs/resource/:resource/:resource_id", contentViewLogHandler.ListLogsByResource)
		v1.GET("/content-view-logs/action/:action", contentViewLogHandler.ListLogsByAction)
		v1.GET("/content-view-logs/ip/:ip", contentViewLogHandler.ListLogsByIPAddress)

		// Traffic Logs endpoints
		trafficLogs := v1.Group("/traffic-logs")
		{
			trafficLogs.GET("", trafficLogHandler.ListLogs)
			trafficLogs.GET("/:id", trafficLogHandler.GetLog)
			trafficLogs.POST("", trafficLogHandler.CreateLog)
			trafficLogs.POST("/delete-old", trafficLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific traffic logs routes
		tenants.GET("/:tenant_id/traffic-logs", trafficLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/traffic-logs/stats", trafficLogHandler.GetStatsByTenant)

		// Add user-specific traffic logs routes
		users.GET("/:user_id/traffic-logs", trafficLogHandler.ListLogsByUser)
		users.GET("/:user_id/traffic-logs/stats", trafficLogHandler.GetStatsByUser)

		// Add resource-specific traffic logs routes
		v1.GET("/traffic-logs/resource/:resource/:resource_id", trafficLogHandler.ListLogsByResource)
		v1.GET("/traffic-logs/action/:action", trafficLogHandler.ListLogsByAction)
		v1.GET("/traffic-logs/ip/:ip", trafficLogHandler.ListLogsByIPAddress)

		// User Registration Logs endpoints
		userRegistrationLogs := v1.Group("/user-registration-logs")
		{
			userRegistrationLogs.GET("", userRegistrationLogHandler.ListLogs)
			userRegistrationLogs.GET("/:id", userRegistrationLogHandler.GetLog)
			userRegistrationLogs.POST("", userRegistrationLogHandler.CreateLog)
			userRegistrationLogs.POST("/delete-old", userRegistrationLogHandler.DeleteOldLogs)
		}

		// Add tenant-specific user registration logs routes
		tenants.GET("/:tenant_id/user-registration-logs", userRegistrationLogHandler.ListLogsByTenant)
		tenants.GET("/:tenant_id/user-registration-logs/stats", userRegistrationLogHandler.GetStatsByTenant)

		// Add user-specific user registration logs routes
		users.GET("/:user_id/user-registration-logs", userRegistrationLogHandler.ListLogsByUser)
		users.GET("/:user_id/user-registration-logs/stats", userRegistrationLogHandler.GetStatsByUser)

		// Add resource-specific user registration logs routes
		v1.GET("/user-registration-logs/resource/:resource/:resource_id", userRegistrationLogHandler.ListLogsByResource)
		v1.GET("/user-registration-logs/action/:action", userRegistrationLogHandler.ListLogsByAction)
		v1.GET("/user-registration-logs/ip/:ip", userRegistrationLogHandler.ListLogsByIPAddress)
	}
}