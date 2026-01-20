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

type UsageEventHandler struct {
	service service.UsageEventService
}

func NewUsageEventHandler(service service.UsageEventService) *UsageEventHandler {
	return &UsageEventHandler{service: service}
}

func (h *UsageEventHandler) CreateEvent(c *gin.Context) {
	var req models.CreateUsageEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := h.service.CreateEvent(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (h *UsageEventHandler) ListEvents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID *uuid.UUID
	if tenantIDStr := c.Query("tenant_id"); tenantIDStr != "" {
		parsed, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id format"})
			return
		}
		tenantID = &parsed
	}

	var subscriptionID *uuid.UUID
	if subIDStr := c.Query("subscription_id"); subIDStr != "" {
		parsed, err := uuid.Parse(subIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription_id format"})
			return
		}
		subscriptionID = &parsed
	}

	var appCode *string
	if ac := c.Query("app_code"); ac != "" {
		appCode = &ac
	}

	var eventType *string
	if et := c.Query("event_type"); et != "" {
		eventType = &et
	}

	var startTime *time.Time
	if st := c.Query("start_time"); st != "" {
		parsed, err := time.Parse(time.RFC3339, st)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format, use RFC3339"})
			return
		}
		startTime = &parsed
	}

	var endTime *time.Time
	if et := c.Query("end_time"); et != "" {
		parsed, err := time.Parse(time.RFC3339, et)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format, use RFC3339"})
			return
		}
		endTime = &parsed
	}

	events, total, err := h.service.ListEvents(c.Request.Context(), page, pageSize, tenantID, subscriptionID, appCode, eventType, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      events,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *UsageEventHandler) GetEvent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	event, err := h.service.GetEvent(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *UsageEventHandler) ListEventsByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, c.DefaultQuery("start_time", time.Now().AddDate(0, -1, 0).Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, c.DefaultQuery("end_time", time.Now().Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format"})
		return
	}

	events, err := h.service.ListEventsByTenant(c.Request.Context(), tenantID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": events})
}

func (h *UsageEventHandler) ListEventsBySubscription(c *gin.Context) {
	subscriptionID, err := uuid.Parse(c.Param("subscription_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, c.DefaultQuery("start_time", time.Now().AddDate(0, -1, 0).Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, c.DefaultQuery("end_time", time.Now().Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format"})
		return
	}

	events, err := h.service.ListEventsBySubscription(c.Request.Context(), subscriptionID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": events})
}

func (h *UsageEventHandler) GetSummaryByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, c.DefaultQuery("start_time", time.Now().AddDate(0, -1, 0).Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, c.DefaultQuery("end_time", time.Now().Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format"})
		return
	}

	summaries, err := h.service.GetSummaryByTenant(c.Request.Context(), tenantID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": summaries})
}

func (h *UsageEventHandler) GetSummaryBySubscription(c *gin.Context) {
	subscriptionID, err := uuid.Parse(c.Param("subscription_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, c.DefaultQuery("start_time", time.Now().AddDate(0, -1, 0).Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, c.DefaultQuery("end_time", time.Now().Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format"})
		return
	}

	summaries, err := h.service.GetSummaryBySubscription(c.Request.Context(), subscriptionID, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": summaries})
}

func (h *UsageEventHandler) GetTotalUsage(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	eventType := c.Query("event_type")
	if eventType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_type is required"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, c.DefaultQuery("start_time", time.Now().AddDate(0, -1, 0).Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format"})
		return
	}

	endTime, err := time.Parse(time.RFC3339, c.DefaultQuery("end_time", time.Now().Format(time.RFC3339)))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format"})
		return
	}

	total, err := h.service.GetTotalUsage(c.Request.Context(), tenantID, eventType, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"event_type": eventType,
		"total":      total,
		"start_time": startTime,
		"end_time":   endTime,
	})
}

func (h *UsageEventHandler) DeleteOldEvents(c *gin.Context) {
	retentionDays, _ := strconv.Atoi(c.DefaultQuery("retention_days", "90"))

	if err := h.service.DeleteOldEvents(c.Request.Context(), retentionDays); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "old events deleted successfully"})
}
