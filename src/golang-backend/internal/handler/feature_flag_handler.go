package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type FeatureFlagHandler struct {
	flagService  *service.FeatureFlagService
	authzService *service.AuthorizationService
}

func NewFeatureFlagHandler(flagService *service.FeatureFlagService, authzService *service.AuthorizationService) *FeatureFlagHandler {
	return &FeatureFlagHandler{
		flagService:  flagService,
		authzService: authzService,
	}
}

// List lists feature flags
func (h *FeatureFlagHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	category := c.Query("category")

	flags, total, err := h.flagService.ListFlags(ctx, category, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, flags, total, page, limit)
}

// GetByID gets flag by ID
func (h *FeatureFlagHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	flagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid flag id", nil)
		return
	}

	flag, err := h.flagService.GetByID(ctx, flagID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "flag not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, flag)
}

// GetByKey gets flag by key
func (h *FeatureFlagHandler) GetByKey(c *gin.Context) {
	ctx := c.Request.Context()

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	flag, err := h.flagService.GetByKey(ctx, key)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "flag not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, flag)
}

// Create creates a flag
func (h *FeatureFlagHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateFeatureFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	flag, err := h.flagService.CreateFlag(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, flag)
}

// Update updates a flag
func (h *FeatureFlagHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	flagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid flag id", nil)
		return
	}

	var req service.UpdateFeatureFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	flag, err := h.flagService.UpdateFlag(ctx, flagID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, flag)
}

// Delete deletes a flag
func (h *FeatureFlagHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	flagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid flag id", nil)
		return
	}

	if err := h.flagService.DeleteFlag(ctx, flagID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "flag deleted successfully"})
}

// Enable enables a flag
func (h *FeatureFlagHandler) Enable(c *gin.Context) {
	ctx := c.Request.Context()

	flagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid flag id", nil)
		return
	}

	flag, err := h.flagService.EnableFlag(ctx, flagID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, flag)
}

// Disable disables a flag
func (h *FeatureFlagHandler) Disable(c *gin.Context) {
	ctx := c.Request.Context()

	flagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid flag id", nil)
		return
	}

	flag, err := h.flagService.DisableFlag(ctx, flagID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, flag)
}

// Evaluate evaluates a flag for a context
func (h *FeatureFlagHandler) Evaluate(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		FlagKey      string                 `json:"flag_key" binding:"required"`
		UserID       *string                `json:"user_id"`
		TenantID     *string                `json:"tenant_id"`
		Context      map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	var userID, tenantID *uuid.UUID
	if req.UserID != nil {
		parsed, err := uuid.Parse(*req.UserID)
		if err == nil {
			userID = &parsed
		}
	}
	if req.TenantID != nil {
		parsed, err := uuid.Parse(*req.TenantID)
		if err == nil {
			tenantID = &parsed
		}
	}

	isEnabled, err := h.flagService.EvaluateFlag(ctx, req.FlagKey, userID, tenantID, req.Context)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"flag_key":   req.FlagKey,
		"is_enabled": isEnabled,
	})
}
