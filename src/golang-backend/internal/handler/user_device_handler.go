package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

// UserDeviceHandler handles HTTP requests for user devices
type UserDeviceHandler struct {
	service service.UserDeviceService
}

// NewUserDeviceHandler creates a new user device handler
func NewUserDeviceHandler(service service.UserDeviceService) *UserDeviceHandler {
	return &UserDeviceHandler{service: service}
}

// RegisterDevice registers a new device
// @Summary Register device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param request body models.CreateUserDeviceRequest true "Device details"
// @Success 201 {object} models.UserDevice
// @Router /api/v1/user-devices [post]
func (h *UserDeviceHandler) RegisterDevice(c *gin.Context) {
	var req models.CreateUserDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	device, err := h.service.RegisterDevice(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, device)
}

// ListDevices lists devices with pagination and filters
// @Summary List devices
// @Tags user-devices
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param user_id query string false "Filter by user ID"
// @Param status query string false "Filter by status"
// @Param device_type query string false "Filter by device type"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/user-devices [get]
func (h *UserDeviceHandler) ListDevices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var userID *uuid.UUID
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		parsed, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
			return
		}
		userID = &parsed
	}

	var status *string
	if statusStr := c.Query("status"); statusStr != "" {
		status = &statusStr
	}

	var deviceType *string
	if deviceTypeStr := c.Query("device_type"); deviceTypeStr != "" {
		deviceType = &deviceTypeStr
	}

	devices, total, err := h.service.ListDevices(c.Request.Context(), page, pageSize, userID, status, deviceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      devices,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetDevice gets a device by ID
// @Summary Get device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Success 200 {object} models.UserDevice
// @Router /api/v1/user-devices/{id} [get]
func (h *UserDeviceHandler) GetDevice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	device, err := h.service.GetDevice(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

// GetDeviceByFingerprint gets a device by user ID and fingerprint
// @Summary Get device by fingerprint
// @Tags user-devices
// @Accept json
// @Produce json
// @Param user_id query string true "User ID"
// @Param fingerprint query string true "Device fingerprint"
// @Success 200 {object} models.UserDevice
// @Router /api/v1/user-devices/by-fingerprint [get]
func (h *UserDeviceHandler) GetDeviceByFingerprint(c *gin.Context) {
	userIDStr := c.Query("user_id")
	fingerprint := c.Query("fingerprint")

	if userIDStr == "" || fingerprint == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id and fingerprint are required"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
		return
	}

	device, err := h.service.GetDeviceByFingerprint(c.Request.Context(), userID, fingerprint)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

// UpdateDevice updates a device
// @Summary Update device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Param request body models.UpdateUserDeviceRequest true "Update details"
// @Success 200 {object} models.UserDevice
// @Router /api/v1/user-devices/{id} [put]
func (h *UserDeviceHandler) UpdateDevice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	var req models.UpdateUserDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	device, err := h.service.UpdateDevice(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

// DeleteDevice deletes a device
// @Summary Delete device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Success 204
// @Router /api/v1/user-devices/{id} [delete]
func (h *UserDeviceHandler) DeleteDevice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	if err := h.service.DeleteDevice(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// UpdateDeviceActivity updates device activity
// @Summary Update device activity
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/user-devices/{id}/activity [post]
func (h *UserDeviceHandler) UpdateDeviceActivity(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	if err := h.service.UpdateDeviceActivity(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "device activity updated successfully"})
}

// TrustDevice marks a device as trusted
// @Summary Trust device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/user-devices/{id}/trust [post]
func (h *UserDeviceHandler) TrustDevice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	if err := h.service.TrustDevice(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "device trusted successfully"})
}

// UntrustDevice marks a device as untrusted
// @Summary Untrust device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/user-devices/{id}/untrust [post]
func (h *UserDeviceHandler) UntrustDevice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	if err := h.service.UntrustDevice(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "device untrusted successfully"})
}

// RevokeDevice revokes a device
// @Summary Revoke device
// @Tags user-devices
// @Accept json
// @Produce json
// @Param id path string true "Device ID"
// @Param request body map[string]string true "Revoke details"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/user-devices/{id}/revoke [post]
func (h *UserDeviceHandler) RevokeDevice(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid device ID"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.RevokeDevice(c.Request.Context(), id, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "device revoked successfully"})
}

// ListDevicesByUser lists devices for a specific user
// @Summary List user devices
// @Tags user-devices
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/users/{user_id}/devices [get]
func (h *UserDeviceHandler) ListDevicesByUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	devices, total, err := h.service.ListDevicesByUser(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      devices,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetActiveDevicesCount gets the count of active devices for a user
// @Summary Get active devices count
// @Tags user-devices
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/users/{user_id}/devices/count [get]
func (h *UserDeviceHandler) GetActiveDevicesCount(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	count, err := h.service.GetActiveDevicesCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// ListTrustedDevices lists trusted devices for a user
// @Summary List trusted devices
// @Tags user-devices
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/users/{user_id}/devices/trusted [get]
func (h *UserDeviceHandler) ListTrustedDevices(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	devices, err := h.service.ListTrustedDevices(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": devices})
}

// RegisterUserDeviceRoutes registers user device routes
func RegisterUserDeviceRoutes(router *gin.Engine, handler *UserDeviceHandler) {
	api := router.Group("/api/v1")
	{
		// Device routes
		api.POST("/user-devices", handler.RegisterDevice)
		api.GET("/user-devices", handler.ListDevices)
		api.GET("/user-devices/:id", handler.GetDevice)
		api.GET("/user-devices/by-fingerprint", handler.GetDeviceByFingerprint)
		api.PUT("/user-devices/:id", handler.UpdateDevice)
		api.DELETE("/user-devices/:id", handler.DeleteDevice)
		api.POST("/user-devices/:id/activity", handler.UpdateDeviceActivity)
		api.POST("/user-devices/:id/trust", handler.TrustDevice)
		api.POST("/user-devices/:id/untrust", handler.UntrustDevice)
		api.POST("/user-devices/:id/revoke", handler.RevokeDevice)

		// User-specific routes
		api.GET("/users/:user_id/devices", handler.ListDevicesByUser)
		api.GET("/users/:user_id/devices/count", handler.GetActiveDevicesCount)
		api.GET("/users/:user_id/devices/trusted", handler.ListTrustedDevices)
	}
}
