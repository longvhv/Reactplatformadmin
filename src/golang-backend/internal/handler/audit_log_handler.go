package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type AuditLogHandler struct {
	service service.AuditLogService
}

func NewAuditLogHandler(service service.AuditLogService) *AuditLogHandler {
	return &AuditLogHandler{service: service}
}

func (h *AuditLogHandler) CreateLog(c *gin.Context) {
	var req models.CreateAuditLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log, err := h.service.CreateLog(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, log)
}

func (h *AuditLogHandler) ListLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	var tenantID *uuid.UUID
	if tenantIDStr := c.Query("tenant_id"); tenantIDStr != "" {
		parsed, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id format"})
			return
		}
		tenantID = &parsed
	}

	var userID *uuid.UUID
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		parsed, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
			return
		}
		userID = &parsed
	}

	var action *string
	if act := c.Query("action"); act != "" {
		action = &act
	}

	var resource *string
	if res := c.Query("resource"); res != "" {
		resource = &res
	}

	var status *string
	if st := c.Query("status"); st != "" {
		status = &st
	}

	var startTime *time.Time
	if startStr := c.Query("start_time"); startStr != "" {
		parsed, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format, use RFC3339"})
			return
		}
		startTime = &parsed
	}

	var endTime *time.Time
	if endStr := c.Query("end_time"); endStr != "" {
		parsed, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format, use RFC3339"})
			return
		}
		endTime = &parsed
	}

	logs, total, err := h.service.ListLogs(c.Request.Context(), page, pageSize, tenantID, userID, action, resource, status, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *AuditLogHandler) GetLog(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid log ID"})
		return
	}

	log, err := h.service.GetLog(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, log)
}

func (h *AuditLogHandler) ListLogsByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	logs, err := h.service.ListLogsByTenant(c.Request.Context(), tenantID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func (h *AuditLogHandler) ListLogsByUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	logs, err := h.service.ListLogsByUser(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func (h *AuditLogHandler) ListLogsByResource(c *gin.Context) {
	resource := c.Param("resource")
	resourceID := c.Param("resource_id")

	if resource == "" || resourceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "resource and resource_id are required"})
		return
	}

	logs, err := h.service.ListLogsByResource(c.Request.Context(), resource, resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func (h *AuditLogHandler) ListLogsByAction(c *gin.Context) {
	action := c.Param("action")
	if action == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action is required"})
		return
	}

	logs, err := h.service.ListLogsByAction(c.Request.Context(), action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func (h *AuditLogHandler) ListLogsByIPAddress(c *gin.Context) {
	ipAddress := c.Param("ip")
	if ipAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ip_address is required"})
		return
	}

	logs, err := h.service.ListLogsByIPAddress(c.Request.Context(), ipAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func (h *AuditLogHandler) DeleteOldLogs(c *gin.Context) {
	var req struct {
		Days int `json:"days" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deletedCount, err := h.service.DeleteOldLogs(c.Request.Context(), req.Days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "old logs deleted successfully",
		"deleted_count": deletedCount,
	})
}

func (h *AuditLogHandler) GetStatsByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	startStr := c.Query("start_time")
	endStr := c.Query("end_time")

	var startTime, endTime time.Time
	if startStr != "" {
		startTime, err = time.Parse(time.RFC3339, startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format, use RFC3339"})
			return
		}
	} else {
		startTime = time.Now().AddDate(0, 0, -30) // Default to last 30 days
	}

	if endStr != "" {
		endTime, err = time.Parse(time.RFC3339, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format, use RFC3339"})
			return
		}
	} else {
		endTime = time.Now()
	}

	stats, err := h.service.GetStatsByTenant(c.Request.Context(), tenantID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *AuditLogHandler) GetStatsByUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	startStr := c.Query("start_time")
	endStr := c.Query("end_time")

	var startTime, endTime time.Time
	if startStr != "" {
		startTime, err = time.Parse(time.RFC3339, startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format, use RFC3339"})
			return
		}
	} else {
		startTime = time.Now().AddDate(0, 0, -30) // Default to last 30 days
	}

	if endStr != "" {
		endTime, err = time.Parse(time.RFC3339, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format, use RFC3339"})
			return
		}
	} else {
		endTime = time.Now()
	}

	stats, err := h.service.GetStatsByUser(c.Request.Context(), userID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
