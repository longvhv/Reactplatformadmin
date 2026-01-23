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

type TenantApplicationHandler struct {
	tenantAppService *service.TenantApplicationService
	authzService     *service.AuthorizationService
}

func NewTenantApplicationHandler(tenantAppService *service.TenantApplicationService, authzService *service.AuthorizationService) *TenantApplicationHandler {
	return &TenantApplicationHandler{
		tenantAppService: tenantAppService,
		authzService:     authzService,
	}
}

// List lists tenant applications
func (h *TenantApplicationHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	isActive := c.Query("is_active")

	var isActivePtr *bool
	if isActive != "" {
		val := isActive == "true"
		isActivePtr = &val
	}

	apps, total, err := h.tenantAppService.ListByTenant(ctx, tenantID, isActivePtr, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, apps, total, page, limit)
}

// GetByID gets tenant application by ID
func (h *TenantApplicationHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid app id", nil)
		return
	}

	app, err := h.tenantAppService.GetByID(ctx, appID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "application not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, app)
}

// GetByAppCode gets tenant application by app code
func (h *TenantApplicationHandler) GetByAppCode(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	appCode := c.Param("code")
	if appCode == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "app code required", nil)
		return
	}

	app, err := h.tenantAppService.GetByAppCode(ctx, tenantID, appCode)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "application not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, app)
}

// Create creates a tenant application
func (h *TenantApplicationHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	app, err := h.tenantAppService.CreateTenantApplication(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, app)
}

// Update updates a tenant application
func (h *TenantApplicationHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid app id", nil)
		return
	}

	var req service.UpdateTenantApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	app, err := h.tenantAppService.UpdateTenantApplication(ctx, appID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, app)
}

// Delete deletes a tenant application
func (h *TenantApplicationHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid app id", nil)
		return
	}

	if err := h.tenantAppService.DeleteTenantApplication(ctx, appID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "application deleted successfully"})
}

// Activate activates a tenant application
func (h *TenantApplicationHandler) Activate(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid app id", nil)
		return
	}

	app, err := h.tenantAppService.ActivateApplication(ctx, appID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, app)
}

// Deactivate deactivates a tenant application
func (h *TenantApplicationHandler) Deactivate(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid app id", nil)
		return
	}

	app, err := h.tenantAppService.DeactivateApplication(ctx, appID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, app)
}
