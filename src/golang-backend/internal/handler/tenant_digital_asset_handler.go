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

type TenantDigitalAssetHandler struct {
	assetService *service.TenantDigitalAssetService
	authzService *service.AuthorizationService
}

func NewTenantDigitalAssetHandler(assetService *service.TenantDigitalAssetService, authzService *service.AuthorizationService) *TenantDigitalAssetHandler {
	return &TenantDigitalAssetHandler{
		assetService: assetService,
		authzService: authzService,
	}
}

// List lists tenant digital assets
func (h *TenantDigitalAssetHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	assetType := c.Query("asset_type")

	assets, total, err := h.assetService.ListByTenant(ctx, tenantID, status, assetType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, assets, total, page, limit)
}

// GetByID gets digital asset by ID
func (h *TenantDigitalAssetHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid asset id", nil)
		return
	}

	asset, err := h.assetService.GetByID(ctx, assetID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "asset not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, asset)
}

// Create creates a digital asset
func (h *TenantDigitalAssetHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantDigitalAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	asset, err := h.assetService.CreateAsset(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, asset)
}

// Update updates a digital asset
func (h *TenantDigitalAssetHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid asset id", nil)
		return
	}

	var req service.UpdateTenantDigitalAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	asset, err := h.assetService.UpdateAsset(ctx, assetID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, asset)
}

// Delete deletes a digital asset
func (h *TenantDigitalAssetHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid asset id", nil)
		return
	}

	if err := h.assetService.DeleteAsset(ctx, assetID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "asset deleted successfully"})
}

// Activate activates a digital asset
func (h *TenantDigitalAssetHandler) Activate(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid asset id", nil)
		return
	}

	asset, err := h.assetService.ActivateAsset(ctx, assetID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, asset)
}

// Suspend suspends a digital asset
func (h *TenantDigitalAssetHandler) Suspend(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid asset id", nil)
		return
	}

	asset, err := h.assetService.SuspendAsset(ctx, assetID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, asset)
}

// Renew renews a digital asset
func (h *TenantDigitalAssetHandler) Renew(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid asset id", nil)
		return
	}

	var req struct {
		ExpiresAt string `json:"expires_at" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	asset, err := h.assetService.RenewAsset(ctx, assetID, req.ExpiresAt)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, asset)
}
