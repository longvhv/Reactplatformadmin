package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type SystemAnnouncementHandler struct {
	service service.SystemAnnouncementService
}

func NewSystemAnnouncementHandler(service service.SystemAnnouncementService) *SystemAnnouncementHandler {
	return &SystemAnnouncementHandler{service: service}
}

func (h *SystemAnnouncementHandler) CreateAnnouncement(c *gin.Context) {
	var req models.CreateSystemAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	announcement, err := h.service.CreateAnnouncement(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, announcement)
}

func (h *SystemAnnouncementHandler) GetAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	announcement, err := h.service.GetAnnouncement(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcement)
}

func (h *SystemAnnouncementHandler) ListAnnouncements(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID *uuid.UUID
	if tid := c.Query("tenant_id"); tid != "" {
		parsed, err := uuid.Parse(tid)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id"})
			return
		}
		tenantID = &parsed
	}

	var status *string
	if st := c.Query("status"); st != "" {
		status = &st
	}

	announcements, total, err := h.service.ListAnnouncements(c.Request.Context(), page, pageSize, tenantID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      announcements,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *SystemAnnouncementHandler) ListAnnouncementsByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	announcements, err := h.service.ListAnnouncementsByTenant(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func (h *SystemAnnouncementHandler) ListPublishedAnnouncements(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	announcements, err := h.service.ListPublishedAnnouncements(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func (h *SystemAnnouncementHandler) UpdateAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	var req models.UpdateSystemAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	announcement, err := h.service.UpdateAnnouncement(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcement)
}

func (h *SystemAnnouncementHandler) DeleteAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	if err := h.service.DeleteAnnouncement(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}

func (h *SystemAnnouncementHandler) SoftDeleteAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	// TODO: Get deletedBy from auth context
	deletedBy := "system"

	if err := h.service.SoftDeleteAnnouncement(c.Request.Context(), id, deletedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement soft deleted successfully"})
}

func (h *SystemAnnouncementHandler) PublishAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	if err := h.service.PublishAnnouncement(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement published successfully"})
}

func (h *SystemAnnouncementHandler) IncrementView(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	if err := h.service.IncrementView(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "View count incremented"})
}

func (h *SystemAnnouncementHandler) IncrementClick(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid announcement ID"})
		return
	}

	if err := h.service.IncrementClick(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Click count incremented"})
}
