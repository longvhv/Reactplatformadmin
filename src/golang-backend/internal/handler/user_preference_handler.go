package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type UserPreferenceHandler struct {
	preferenceService *service.UserPreferenceService
	authzService      *service.AuthorizationService
}

func NewUserPreferenceHandler(preferenceService *service.UserPreferenceService, authzService *service.AuthorizationService) *UserPreferenceHandler {
	return &UserPreferenceHandler{
		preferenceService: preferenceService,
		authzService:      authzService,
	}
}

// Get gets user preferences
func (h *UserPreferenceHandler) Get(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	preferences, err := h.preferenceService.GetPreferences(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, preferences)
}

// Update updates user preferences
func (h *UserPreferenceHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	var req service.UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	preferences, err := h.preferenceService.UpdatePreferences(ctx, userID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, preferences)
}

// GetValue gets a specific preference value
func (h *UserPreferenceHandler) GetValue(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	value, err := h.preferenceService.GetValue(ctx, userID, key)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"key":   key,
		"value": value,
	})
}

// SetValue sets a specific preference value
func (h *UserPreferenceHandler) SetValue(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	var req struct {
		Value interface{} `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	if err := h.preferenceService.SetValue(ctx, userID, key, req.Value); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"key":   key,
		"value": req.Value,
	})
}

// DeleteValue deletes a specific preference value
func (h *UserPreferenceHandler) DeleteValue(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	if err := h.preferenceService.DeleteValue(ctx, userID, key); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "preference deleted successfully"})
}

// Reset resets all preferences to default
func (h *UserPreferenceHandler) Reset(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	preferences, err := h.preferenceService.ResetToDefaults(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, preferences)
}

// Export exports user preferences
func (h *UserPreferenceHandler) Export(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	data, err := h.preferenceService.ExportPreferences(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, data)
}

// Import imports user preferences
func (h *UserPreferenceHandler) Import(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	preferences, err := h.preferenceService.ImportPreferences(ctx, userID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, preferences)
}
