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

type TenantHandler struct {
	tenantService *service.TenantService
	authzService  *service.AuthorizationService
}

func NewTenantHandler(tenantService *service.TenantService, authzService *service.AuthorizationService) *TenantHandler {
	return &TenantHandler{
		tenantService: tenantService,
		authzService:  authzService,
	}
}

// List lists user's tenants
func (h *TenantHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	tenants, total, err := h.tenantService.ListByUser(ctx, userID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.PaginatedResponse(c, http.StatusOK, tenants, total, page, limit)
}

// GetByID gets tenant by ID
func (h *TenantHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()
	
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tenant id", nil)
		return
	}
	
	tenant, err := h.tenantService.GetByID(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "tenant not found", nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, tenant)
}

// Create creates a tenant
func (h *TenantHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()
	
	var req service.CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	tenant, err := h.tenantService.CreateTenant(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusCreated, tenant)
}

// Update updates a tenant
func (h *TenantHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()
	
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tenant id", nil)
		return
	}
	
	var req service.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	tenant, err := h.tenantService.UpdateTenant(ctx, tenantID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, tenant)
}

// Delete deletes a tenant
func (h *TenantHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()
	
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tenant id", nil)
		return
	}
	
	if err := h.tenantService.DeleteTenant(ctx, tenantID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "tenant deleted successfully"})
}

// GetSettings gets tenant settings
func (h *TenantHandler) GetSettings(c *gin.Context) {
	ctx := c.Request.Context()
	
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tenant id", nil)
		return
	}
	
	tenant, err := h.tenantService.GetByID(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "tenant not found", nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"settings": tenant.Settings})
}

// UpdateSettings updates tenant settings
func (h *TenantHandler) UpdateSettings(c *gin.Context) {
	ctx := c.Request.Context()
	
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tenant id", nil)
		return
	}
	
	var settings map[string]interface{}
	if err := c.ShouldBindJSON(&settings); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	// Update tenant with new settings
	req := service.UpdateTenantRequest{
		Settings: settings,
	}
	
	tenant, err := h.tenantService.UpdateTenant(ctx, tenantID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, tenant)
}