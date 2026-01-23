package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type SystemSettingHandler struct {
	settingService *service.SystemSettingService
	authzService   *service.AuthorizationService
}

func NewSystemSettingHandler(settingService *service.SystemSettingService, authzService *service.AuthorizationService) *SystemSettingHandler {
	return &SystemSettingHandler{
		settingService: settingService,
		authzService:   authzService,
	}
}

// GetAll gets all system settings
func (h *SystemSettingHandler) GetAll(c *gin.Context) {
	ctx := c.Request.Context()

	category := c.Query("category")
	isPublic := c.Query("is_public") == "true"

	settings, err := h.settingService.GetAllSettings(ctx, category, isPublic)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, settings)
}

// GetByKey gets setting by key
func (h *SystemSettingHandler) GetByKey(c *gin.Context) {
	ctx := c.Request.Context()

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	setting, err := h.settingService.GetByKey(ctx, key)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "setting not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, setting)
}

// GetValue gets setting value by key
func (h *SystemSettingHandler) GetValue(c *gin.Context) {
	ctx := c.Request.Context()

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	value, err := h.settingService.GetValue(ctx, key)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"key":   key,
		"value": value,
	})
}

// SetValue sets setting value
func (h *SystemSettingHandler) SetValue(c *gin.Context) {
	ctx := c.Request.Context()

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

	userID, _ := contextutil.GetUserID(ctx)

	setting, err := h.settingService.SetValue(ctx, key, req.Value, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, setting)
}

// Update updates a setting
func (h *SystemSettingHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	var req service.UpdateSystemSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	setting, err := h.settingService.UpdateSetting(ctx, key, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, setting)
}

// Create creates a new setting
func (h *SystemSettingHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSystemSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	setting, err := h.settingService.CreateSetting(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, setting)
}

// Delete deletes a setting
func (h *SystemSettingHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	key := c.Param("key")
	if key == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	if err := h.settingService.DeleteSetting(ctx, key); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "setting deleted successfully"})
}

// GetByCategory gets settings by category
func (h *SystemSettingHandler) GetByCategory(c *gin.Context) {
	ctx := c.Request.Context()

	category := c.Param("category")
	if category == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "category required", nil)
		return
	}

	settings, err := h.settingService.GetByCategory(ctx, category)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, settings)
}

// GetPublic gets public settings
func (h *SystemSettingHandler) GetPublic(c *gin.Context) {
	ctx := c.Request.Context()

	settings, err := h.settingService.GetPublicSettings(ctx)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, settings)
}

// BulkUpdate updates multiple settings
func (h *SystemSettingHandler) BulkUpdate(c *gin.Context) {
	ctx := c.Request.Context()

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)

	count, err := h.settingService.BulkUpdate(ctx, req, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "settings updated successfully",
		"count":   count,
	})
}

// Export exports all settings
func (h *SystemSettingHandler) Export(c *gin.Context) {
	ctx := c.Request.Context()

	data, err := h.settingService.ExportSettings(ctx)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, data)
}

// Import imports settings
func (h *SystemSettingHandler) Import(c *gin.Context) {
	ctx := c.Request.Context()

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)

	count, err := h.settingService.ImportSettings(ctx, req, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "settings imported successfully",
		"count":   count,
	})
}

// Reset resets settings to defaults
func (h *SystemSettingHandler) Reset(c *gin.Context) {
	ctx := c.Request.Context()

	category := c.Query("category")
	userID, _ := contextutil.GetUserID(ctx)

	count, err := h.settingService.ResetToDefaults(ctx, category, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "settings reset successfully",
		"count":   count,
	})
}
