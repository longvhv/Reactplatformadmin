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

type RoleHandler struct {
	roleService  *service.RoleService
	authzService *service.AuthorizationService
}

func NewRoleHandler(roleService *service.RoleService, authzService *service.AuthorizationService) *RoleHandler {
	return &RoleHandler{
		roleService:  roleService,
		authzService: authzService,
	}
}

// List lists roles in a tenant
func (h *RoleHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	roles, total, err := h.roleService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.PaginatedResponse(c, http.StatusOK, roles, total, page, limit)
}

// GetByID gets role by ID
func (h *RoleHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()
	
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid role id", nil)
		return
	}
	
	role, err := h.roleService.GetByID(ctx, roleID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "role not found", nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, role)
}

// Create creates a role
func (h *RoleHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()
	
	var req service.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	role, err := h.roleService.CreateRole(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusCreated, role)
}

// Update updates a role
func (h *RoleHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()
	
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid role id", nil)
		return
	}
	
	var req service.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	role, err := h.roleService.UpdateRole(ctx, roleID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, role)
}

// Delete deletes a role
func (h *RoleHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()
	
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid role id", nil)
		return
	}
	
	if err := h.roleService.DeleteRole(ctx, roleID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "role deleted successfully"})
}

// AssignToUser assigns role to user
func (h *RoleHandler) AssignToUser(c *gin.Context) {
	ctx := c.Request.Context()
	
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid role id", nil)
		return
	}
	
	var req struct {
		UserID uuid.UUID `json:"user_id" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	currentUserID, _ := contextutil.GetUserID(ctx)
	
	if err := h.authzService.GrantRole(ctx, req.UserID, roleID, tenantID, currentUserID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "role assigned successfully"})
}

// RevokeFromUser revokes role from user
func (h *RoleHandler) RevokeFromUser(c *gin.Context) {
	ctx := c.Request.Context()
	
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid role id", nil)
		return
	}
	
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
	
	if err := h.authzService.RevokeRole(ctx, userID, roleID, tenantID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "role revoked successfully"})
}
