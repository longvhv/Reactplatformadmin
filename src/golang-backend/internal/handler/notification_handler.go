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

type NotificationHandler struct {
	notificationService *service.NotificationService
	authzService        *service.AuthorizationService
}

func NewNotificationHandler(notificationService *service.NotificationService, authzService *service.AuthorizationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
		authzService:        authzService,
	}
}

// List lists user notifications
func (h *NotificationHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	notifications, total, err := h.notificationService.ListByUser(ctx, userID, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, notifications, total, page, limit)
}

// GetByID gets notification by ID
func (h *NotificationHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid notification id", nil)
		return
	}

	notification, err := h.notificationService.GetByID(ctx, notificationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "notification not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, notification)
}

// GetUnread gets unread notifications
func (h *NotificationHandler) GetUnread(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	notifications, err := h.notificationService.GetUnreadNotifications(ctx, userID, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, notifications)
}

// GetUnreadCount gets unread notification count
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	count, err := h.notificationService.GetUnreadCount(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"count": count})
}

// Send sends a notification
func (h *NotificationHandler) Send(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.SendNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	notification, err := h.notificationService.SendNotification(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, notification)
}

// SendBulk sends bulk notifications
func (h *NotificationHandler) SendBulk(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.SendBulkNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	count, err := h.notificationService.SendBulkNotification(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, gin.H{
		"message": "notifications sent successfully",
		"count":   count,
	})
}

// MarkAsRead marks notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	ctx := c.Request.Context()

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid notification id", nil)
		return
	}

	notification, err := h.notificationService.MarkAsRead(ctx, notificationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, notification)
}

// MarkAllAsRead marks all notifications as read
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	count, err := h.notificationService.MarkAllAsRead(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "all notifications marked as read",
		"count":   count,
	})
}

// Delete deletes a notification
func (h *NotificationHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid notification id", nil)
		return
	}

	if err := h.notificationService.DeleteNotification(ctx, notificationID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "notification deleted successfully"})
}

// DeleteAll deletes all notifications
func (h *NotificationHandler) DeleteAll(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	count, err := h.notificationService.DeleteAllNotifications(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "all notifications deleted",
		"count":   count,
	})
}

// Archive archives a notification
func (h *NotificationHandler) Archive(c *gin.Context) {
	ctx := c.Request.Context()

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid notification id", nil)
		return
	}

	notification, err := h.notificationService.ArchiveNotification(ctx, notificationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, notification)
}

// GetPreferences gets notification preferences
func (h *NotificationHandler) GetPreferences(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	preferences, err := h.notificationService.GetNotificationPreferences(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, preferences)
}

// UpdatePreferences updates notification preferences
func (h *NotificationHandler) UpdatePreferences(c *gin.Context) {
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

	preferences, err := h.notificationService.UpdateNotificationPreferences(ctx, userID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, preferences)
}
