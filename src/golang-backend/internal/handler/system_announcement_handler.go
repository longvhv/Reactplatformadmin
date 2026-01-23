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

type SystemAnnouncementHandler struct {
	announcementService *service.SystemAnnouncementService
	authzService        *service.AuthorizationService
}

func NewSystemAnnouncementHandler(announcementService *service.SystemAnnouncementService, authzService *service.AuthorizationService) *SystemAnnouncementHandler {
	return &SystemAnnouncementHandler{
		announcementService: announcementService,
		authzService:        authzService,
	}
}

// List lists announcements
func (h *SystemAnnouncementHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	announcementType := c.Query("type")
	status := c.Query("status")

	announcements, total, err := h.announcementService.ListByTenant(ctx, tenantID, announcementType, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, announcements, total, page, limit)
}

// GetActive gets active announcements
func (h *SystemAnnouncementHandler) GetActive(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	announcements, err := h.announcementService.GetActiveAnnouncements(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, announcements)
}

// GetByID gets announcement by ID
func (h *SystemAnnouncementHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid announcement id", nil)
		return
	}

	announcement, err := h.announcementService.GetByID(ctx, announcementID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "announcement not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, announcement)
}

// Create creates an announcement
func (h *SystemAnnouncementHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSystemAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID.String()

	announcement, err := h.announcementService.CreateAnnouncement(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, announcement)
}

// Update updates an announcement
func (h *SystemAnnouncementHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid announcement id", nil)
		return
	}

	var req service.UpdateSystemAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID.String()

	announcement, err := h.announcementService.UpdateAnnouncement(ctx, announcementID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, announcement)
}

// Delete deletes an announcement
func (h *SystemAnnouncementHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid announcement id", nil)
		return
	}

	if err := h.announcementService.DeleteAnnouncement(ctx, announcementID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "announcement deleted successfully"})
}

// Publish publishes an announcement
func (h *SystemAnnouncementHandler) Publish(c *gin.Context) {
	ctx := c.Request.Context()

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid announcement id", nil)
		return
	}

	announcement, err := h.announcementService.PublishAnnouncement(ctx, announcementID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, announcement)
}

// Archive archives an announcement
func (h *SystemAnnouncementHandler) Archive(c *gin.Context) {
	ctx := c.Request.Context()

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid announcement id", nil)
		return
	}

	announcement, err := h.announcementService.ArchiveAnnouncement(ctx, announcementID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, announcement)
}

// MarkAsRead marks announcement as read
func (h *SystemAnnouncementHandler) MarkAsRead(c *gin.Context) {
	ctx := c.Request.Context()

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid announcement id", nil)
		return
	}

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	if err := h.announcementService.MarkAsRead(ctx, announcementID, userID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "marked as read"})
}
