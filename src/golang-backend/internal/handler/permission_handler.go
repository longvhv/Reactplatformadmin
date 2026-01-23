package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type PermissionHandler struct {
	permissionService *service.PermissionService
	authzService      *service.AuthorizationService
}

func NewPermissionHandler(permissionService *service.PermissionService, authzService *service.AuthorizationService) *PermissionHandler {
	return &PermissionHandler{
		permissionService: permissionService,
		authzService:      authzService,
	}
}

// ListAll lists all permissions
func (h *PermissionHandler) ListAll(c *gin.Context) {
	ctx := c.Request.Context()
	
	appCode := c.Query("app_code")
	
	permissions, err := h.permissionService.ListAll(ctx, appCode)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, permissions)
}

// GetMyPermissions gets current user's permissions in a tenant
func (h *PermissionHandler) GetMyPermissions(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	permissions, err := h.authzService.GetUserPermissions(ctx, userID, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"permissions": permissions})
}

// GetUserPermissions gets user's permissions in a tenant
func (h *PermissionHandler) GetUserPermissions(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
		return
	}
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	permissions, err := h.authzService.GetUserPermissions(ctx, userID, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"permissions": permissions})
}

// CheckPermission checks if user has a specific permission
func (h *PermissionHandler) CheckPermission(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	permissionCode := c.Query("code")
	if permissionCode == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "permission code required", nil)
		return
	}
	
	hasPermission, err := h.authzService.HasPermission(ctx, userID, tenantID, permissionCode)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"has_permission": hasPermission})
}
