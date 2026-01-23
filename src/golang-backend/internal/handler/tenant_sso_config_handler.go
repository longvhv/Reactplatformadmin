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

type TenantSSOConfigHandler struct {
	ssoService   *service.TenantSSOConfigService
	authzService *service.AuthorizationService
}

func NewTenantSSOConfigHandler(ssoService *service.TenantSSOConfigService, authzService *service.AuthorizationService) *TenantSSOConfigHandler {
	return &TenantSSOConfigHandler{
		ssoService:   ssoService,
		authzService: authzService,
	}
}

// List lists SSO configs
func (h *TenantSSOConfigHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	provider := c.Query("provider")

	configs, total, err := h.ssoService.ListByTenant(ctx, tenantID, provider, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, configs, total, page, limit)
}

// GetByID gets SSO config by ID
func (h *TenantSSOConfigHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	config, err := h.ssoService.GetByID(ctx, configID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "config not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, config)
}

// Create creates SSO config
func (h *TenantSSOConfigHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantSSOConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	config, err := h.ssoService.CreateConfig(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, config)
}

// Update updates SSO config
func (h *TenantSSOConfigHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	var req service.UpdateTenantSSOConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	config, err := h.ssoService.UpdateConfig(ctx, configID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, config)
}

// Delete deletes SSO config
func (h *TenantSSOConfigHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	if err := h.ssoService.DeleteConfig(ctx, configID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "SSO config deleted successfully"})
}

// Enable enables SSO config
func (h *TenantSSOConfigHandler) Enable(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	config, err := h.ssoService.EnableConfig(ctx, configID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, config)
}

// Disable disables SSO config
func (h *TenantSSOConfigHandler) Disable(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	config, err := h.ssoService.DisableConfig(ctx, configID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, config)
}

// TestConnection tests SSO connection
func (h *TenantSSOConfigHandler) TestConnection(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	result, err := h.ssoService.TestConnection(ctx, configID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// GetMetadata gets SSO provider metadata
func (h *TenantSSOConfigHandler) GetMetadata(c *gin.Context) {
	ctx := c.Request.Context()

	configID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid config id", nil)
		return
	}

	metadata, err := h.ssoService.GetMetadata(ctx, configID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, metadata)
}
