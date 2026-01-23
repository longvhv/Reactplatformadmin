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

type UserDeviceHandler struct {
	deviceService *service.UserDeviceService
	authzService  *service.AuthorizationService
}

func NewUserDeviceHandler(deviceService *service.UserDeviceService, authzService *service.AuthorizationService) *UserDeviceHandler {
	return &UserDeviceHandler{
		deviceService: deviceService,
		authzService:  authzService,
	}
}

// List lists user devices
func (h *UserDeviceHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	devices, total, err := h.deviceService.ListByUser(ctx, userID, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, devices, total, page, limit)
}

// GetByID gets device by ID
func (h *UserDeviceHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	device, err := h.deviceService.GetByID(ctx, deviceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "device not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, device)
}

// Register registers a device
func (h *UserDeviceHandler) Register(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.RegisterDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UserID = userID

	// Get client info
	req.IPAddress = c.ClientIP()
	req.UserAgent = c.GetHeader("User-Agent")

	device, err := h.deviceService.RegisterDevice(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, device)
}

// Update updates a device
func (h *UserDeviceHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	var req service.UpdateDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	device, err := h.deviceService.UpdateDevice(ctx, deviceID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, device)
}

// Delete deletes a device
func (h *UserDeviceHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	if err := h.deviceService.DeleteDevice(ctx, deviceID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "device deleted successfully"})
}

// Revoke revokes a device
func (h *UserDeviceHandler) Revoke(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	device, err := h.deviceService.RevokeDevice(ctx, deviceID, req.Reason)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, device)
}

// Trust trusts a device
func (h *UserDeviceHandler) Trust(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	device, err := h.deviceService.TrustDevice(ctx, deviceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, device)
}

// Untrust untrusts a device
func (h *UserDeviceHandler) Untrust(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	device, err := h.deviceService.UntrustDevice(ctx, deviceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, device)
}

// UpdateActivity updates device activity
func (h *UserDeviceHandler) UpdateActivity(c *gin.Context) {
	ctx := c.Request.Context()

	deviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid device id", nil)
		return
	}

	device, err := h.deviceService.UpdateActivity(ctx, deviceID, c.ClientIP())
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, device)
}

// GetTrusted gets trusted devices
func (h *UserDeviceHandler) GetTrusted(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	devices, err := h.deviceService.GetTrustedDevices(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, devices)
}

// RevokeAll revokes all user devices
func (h *UserDeviceHandler) RevokeAll(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	var req struct {
		ExceptCurrent bool   `json:"except_current"`
		Reason        string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	count, err := h.deviceService.RevokeAllDevices(ctx, userID, req.ExceptCurrent, req.Reason)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message":        "devices revoked successfully",
		"revoked_count":  count,
	})
}
