package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	auth_middleware "github.com/vhv-platform/backend/internal/middleware"
	"github.com/vhv-platform/backend/pkg/auth"
	"github.com/vhv-platform/backend/pkg/logger"
)

// SetupRoutes configures all application routes
func SetupRoutes(
	authHandler *AuthHandler,
	userHandler *UserHandler,
	tenantHandler *TenantHandler,
	memberHandler *TenantMemberHandler,
	deptHandler *DepartmentHandler,
	roleHandler *RoleHandler,
	permissionHandler *PermissionHandler,
	webhookHandler *WebhookHandler,
	appHandler *ApplicationHandler,
	locationHandler *LocationHandler,
	jwtManager *auth.JWTManager,
) http.Handler {
	r := chi.NewRouter()

	// Get logger
	log := logger.GetLogger()

	// Global middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(auth_middleware.Recovery(log))
	r.Use(auth_middleware.RequestLogger(log))
	r.Use(middleware.Recoverer)

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":  "healthy",
			"service": "vhv-platform-api",
			"version": "1.0.0",
		})
	})

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public routes - Authentication
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.RefreshToken)
			r.Post("/logout", authHandler.Logout)
		})

		// Protected routes
		r.Group(func(r chi.Router) {
			// JWT Authentication middleware
			r.Use(auth_middleware.AuthMiddleware(jwtManager))

			// User routes
			r.Route("/users", func(r chi.Router) {
				r.Get("/me", userHandler.GetCurrentUser)
				r.Patch("/me", userHandler.UpdateCurrentUser)
				r.Get("/", userHandler.List)
				r.Get("/{id}", userHandler.GetByID)
				r.Patch("/{id}", userHandler.Update)
				r.Delete("/{id}", userHandler.Delete)
			})

			// Tenant routes
			r.Route("/tenants", func(r chi.Router) {
				r.Post("/", tenantHandler.Create)
				r.Get("/", tenantHandler.List)
				r.Get("/{id}", tenantHandler.GetByID)
				r.Get("/code/{code}", tenantHandler.GetByCode)
				r.Patch("/{id}", tenantHandler.Update)
				r.Delete("/{id}", tenantHandler.Delete)
				r.Post("/{id}/activate", tenantHandler.Activate)
				r.Post("/{id}/deactivate", tenantHandler.Deactivate)

				// Tenant members
				r.Route("/{tenantID}/members", func(r chi.Router) {
					r.Post("/", memberHandler.Create)
					r.Get("/", memberHandler.List)
				})

				// Tenant departments
				r.Route("/{tenantID}/departments", func(r chi.Router) {
					r.Post("/", deptHandler.Create)
					r.Get("/", deptHandler.List)
				})

				// Tenant webhooks
				r.Route("/{tenantID}/webhooks", func(r chi.Router) {
					r.Post("/", webhookHandler.Create)
					r.Get("/", webhookHandler.List)
				})

				// Tenant locations
				r.Route("/{tenantID}/locations", func(r chi.Router) {
					r.Post("/", locationHandler.Create)
					r.Get("/", locationHandler.List)
				})
			})

			// Tenant member routes
			r.Route("/members", func(r chi.Router) {
				r.Get("/{memberID}", memberHandler.GetByID)
				r.Patch("/{memberID}", memberHandler.Update)
				r.Delete("/{memberID}", memberHandler.Delete)
				r.Post("/{memberID}/activate", memberHandler.ActivateMember)
				r.Post("/{memberID}/deactivate", memberHandler.DeactivateMember)
			})

			// Department routes
			r.Route("/departments", func(r chi.Router) {
				r.Get("/{id}", deptHandler.GetByID)
				r.Patch("/{id}", deptHandler.Update)
				r.Delete("/{id}", deptHandler.Delete)
			})

			// Role routes
			r.Route("/roles", func(r chi.Router) {
				r.Post("/", roleHandler.Create)
				r.Get("/", roleHandler.List)
				r.Get("/{id}", roleHandler.GetByID)
				r.Patch("/{id}", roleHandler.Update)
				r.Delete("/{id}", roleHandler.Delete)
				r.Post("/{id}/permissions", roleHandler.AssignPermission)
				r.Get("/{id}/permissions", roleHandler.GetPermissions)
				r.Delete("/{id}/permissions/{permissionID}", roleHandler.RemovePermission)
			})

			// Permission routes
			r.Route("/permissions", func(r chi.Router) {
				r.Post("/", permissionHandler.Create)
				r.Get("/", permissionHandler.List)
				r.Get("/{id}", permissionHandler.GetByID)
				r.Patch("/{id}", permissionHandler.Update)
				r.Delete("/{id}", permissionHandler.Delete)
			})

			// Webhook routes
			r.Route("/webhooks", func(r chi.Router) {
				r.Get("/{id}", webhookHandler.GetByID)
				r.Patch("/{id}", webhookHandler.Update)
				r.Delete("/{id}", webhookHandler.Delete)
				r.Post("/{id}/test", webhookHandler.Test)
			})

			// Application routes
			r.Route("/applications", func(r chi.Router) {
				r.Post("/", appHandler.Create)
				r.Get("/", appHandler.List)
				r.Get("/{id}", appHandler.GetByID)
				r.Get("/code/{code}", appHandler.GetByCode)
				r.Patch("/{id}", appHandler.Update)
				r.Delete("/{id}", appHandler.Delete)
			})

			// Location routes
			r.Route("/locations", func(r chi.Router) {
				r.Get("/{id}", locationHandler.GetByID)
				r.Patch("/{id}", locationHandler.Update)
				r.Delete("/{id}", locationHandler.Delete)
			})
		})
	})

	return r
}