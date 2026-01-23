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

type ActivityLogHandler struct {
	activityService *service.ActivityLogService
	authzService    *service.AuthorizationService
}

func NewActivityLogHandler(activityService *service.ActivityLogService, authzService *service.AuthorizationService) *ActivityLogHandler {
	return &ActivityLogHandler{
		activityService: activityService,
		authzService:    authzService,
	}
}

// List lists activity logs
func (h *ActivityLogHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	activityType := c.Query("activity_type")
	entityType := c.Query("entity_type")

	logs, total, err := h.activityService.ListByTenant(ctx, tenantID, activityType, entityType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, logs, total, page, limit)
}

// GetByID gets activity log by ID
func (h *ActivityLogHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	logID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid log id", nil)
		return
	}

	log, err := h.activityService.GetByID(ctx, logID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "activity log not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, log)
}

// GetByUser gets activity logs by user
func (h *ActivityLogHandler) GetByUser(c *gin.Context) {
	ctx := c.Request.Context()

	userIDParam := c.Param("user_id")
	if userIDParam == "me" {
		uid, ok := contextutil.GetUserID(ctx)
		if !ok {
			httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
			return
		}
		userIDParam = uid.String()
	}

	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	logs, total, err := h.activityService.GetByUser(ctx, userID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, logs, total, page, limit)
}

// GetByEntity gets activity logs by entity
func (h *ActivityLogHandler) GetByEntity(c *gin.Context) {
	ctx := c.Request.Context()

	entityType := c.Param("entity_type")
	entityID, err := uuid.Parse(c.Param("entity_id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid entity id", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	logs, total, err := h.activityService.GetByEntity(ctx, entityType, entityID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, logs, total, page, limit)
}

// Search searches activity logs
func (h *ActivityLogHandler) Search(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	var req service.SearchActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	req.TenantID = tenantID

	logs, total, err := h.activityService.Search(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, logs, total, req.Page, req.Limit)
}

// GetStats gets activity statistics
func (h *ActivityLogHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	stats, err := h.activityService.GetStats(ctx, tenantID, startDate, endDate)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, stats)
}

// GetTimeline gets activity timeline
func (h *ActivityLogHandler) GetTimeline(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))

	timeline, err := h.activityService.GetTimeline(ctx, tenantID, days)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, timeline)
}

// Export exports activity logs
func (h *ActivityLogHandler) Export(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	format := c.DefaultQuery("format", "csv")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	data, fileName, err := h.activityService.Export(ctx, tenantID, format, startDate, endDate)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, "application/octet-stream", data)
}
