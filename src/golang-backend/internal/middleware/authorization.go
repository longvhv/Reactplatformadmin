package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

// RequirePermission checks if user has specific permission
func RequirePermission(authzService *service.AuthorizationService, permissionCode string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, ok := contextutil.GetUserID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
			c.Abort()
			return
		}

		// Get tenant ID from context
		tenantID, ok := contextutil.GetTenantID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
			c.Abort()
			return
		}

		// Check permission
		hasPermission, err := authzService.HasPermission(c.Request.Context(), userID, tenantID, permissionCode)
		if err != nil {
			httputil.ErrorResponse(c, http.StatusInternalServerError, "failed to check permission", nil)
			c.Abort()
			return
		}

		if !hasPermission {
			httputil.ErrorResponse(c, http.StatusForbidden, "permission denied", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission checks if user has any of the specified permissions
func RequireAnyPermission(authzService *service.AuthorizationService, permissionCodes []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := contextutil.GetUserID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
			c.Abort()
			return
		}

		tenantID, ok := contextutil.GetTenantID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
			c.Abort()
			return
		}

		hasPermission, err := authzService.HasAnyPermission(c.Request.Context(), userID, tenantID, permissionCodes)
		if err != nil {
			httputil.ErrorResponse(c, http.StatusInternalServerError, "failed to check permission", nil)
			c.Abort()
			return
		}

		if !hasPermission {
			httputil.ErrorResponse(c, http.StatusForbidden, "permission denied", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAllPermissions checks if user has all of the specified permissions
func RequireAllPermissions(authzService *service.AuthorizationService, permissionCodes []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := contextutil.GetUserID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
			c.Abort()
			return
		}

		tenantID, ok := contextutil.GetTenantID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
			c.Abort()
			return
		}

		hasPermission, err := authzService.HasAllPermissions(c.Request.Context(), userID, tenantID, permissionCodes)
		if err != nil {
			httputil.ErrorResponse(c, http.StatusInternalServerError, "failed to check permission", nil)
			c.Abort()
			return
		}

		if !hasPermission {
			httputil.ErrorResponse(c, http.StatusForbidden, "permission denied", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireTenantOwner checks if user is tenant owner
func RequireTenantOwner(authzService *service.AuthorizationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := contextutil.GetUserID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
			c.Abort()
			return
		}

		tenantID, ok := contextutil.GetTenantID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
			c.Abort()
			return
		}

		isOwner, err := authzService.IsTenantOwner(c.Request.Context(), userID, tenantID)
		if err != nil {
			httputil.ErrorResponse(c, http.StatusInternalServerError, "failed to check ownership", nil)
			c.Abort()
			return
		}

		if !isOwner {
			httputil.ErrorResponse(c, http.StatusForbidden, "only tenant owner can perform this action", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireTenantAdmin checks if user is tenant admin or owner
func RequireTenantAdmin(authzService *service.AuthorizationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := contextutil.GetUserID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
			c.Abort()
			return
		}

		tenantID, ok := contextutil.GetTenantID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
			c.Abort()
			return
		}

		isAdmin, err := authzService.IsTenantAdmin(c.Request.Context(), userID, tenantID)
		if err != nil {
			httputil.ErrorResponse(c, http.StatusInternalServerError, "failed to check admin status", nil)
			c.Abort()
			return
		}

		if !isAdmin {
			httputil.ErrorResponse(c, http.StatusForbidden, "admin access required", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireResourceOwner checks if user owns the resource
func RequireResourceOwner(authzService *service.AuthorizationService, resourceUserIDParam string) gin.HandlerFunc {
	return func(c *gin.Context) {
		currentUserID, ok := contextutil.GetUserID(c.Request.Context())
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
			c.Abort()
			return
		}

		// Get resource owner ID from URL param
		resourceUserIDStr := c.Param(resourceUserIDParam)
		resourceUserID, err := uuid.Parse(resourceUserIDStr)
		if err != nil {
			httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
			c.Abort()
			return
		}

		// Check if current user is the resource owner
		if currentUserID != resourceUserID {
			// Allow tenant admin to access
			tenantID, ok := contextutil.GetTenantID(c.Request.Context())
			if ok {
				isAdmin, err := authzService.IsTenantAdmin(c.Request.Context(), currentUserID, tenantID)
				if err == nil && isAdmin {
					c.Next()
					return
				}
			}

			httputil.ErrorResponse(c, http.StatusForbidden, "access denied", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
