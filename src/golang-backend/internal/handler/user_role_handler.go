package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type UserRoleHandler struct {
	userRoleService *service.UserRoleService
	authzService    *service.AuthorizationService
}

func NewUserRoleHandler(userRoleService *service.UserRoleService, authzService *service.AuthorizationService) *UserRoleHandler {
	return &UserRoleHandler{
		userRoleService: userRoleService,
		authzService:    authzService,
	}
}

// List lists user roles
func (h *UserRoleHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := uuid.Parse(c.Query("user_id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user_id", nil)
		return
	}

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	userRoles, total, err := h.userRoleService.ListByUserAndTenant(ctx, userID, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, userRoles, total, page, limit)
}

// GetMyRoles gets current user's roles
func (h *UserRoleHandler) GetMyRoles(c *gin.Context) {
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

	roles, err := h.authzService.GetUserRoles(ctx, userID, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"roles": roles})
}

// Assign assigns a role to user
func (h *UserRoleHandler) Assign(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	currentUserID, _ := contextutil.GetUserID(ctx)

	if err := h.userRoleService.AssignRole(ctx, req, currentUserID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "role assigned successfully"})
}

// Revoke revokes a role from user
func (h *UserRoleHandler) Revoke(c *gin.Context) {
	ctx := c.Request.Context()

	userRoleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user_role id", nil)
		return
	}

	if err := h.userRoleService.RevokeRole(ctx, userRoleID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "role revoked successfully"})
}
