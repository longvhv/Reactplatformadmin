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

type DataExportHandler struct {
	exportService *service.DataExportService
	authzService  *service.AuthorizationService
}

func NewDataExportHandler(exportService *service.DataExportService, authzService *service.AuthorizationService) *DataExportHandler {
	return &DataExportHandler{
		exportService: exportService,
		authzService:  authzService,
	}
}

// List lists exports
func (h *DataExportHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	exports, total, err := h.exportService.ListByTenant(ctx, tenantID, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, exports, total, page, limit)
}

// GetByID gets export by ID
func (h *DataExportHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	exportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid export id", nil)
		return
	}

	export, err := h.exportService.GetByID(ctx, exportID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "export not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, export)
}

// Create creates an export request
func (h *DataExportHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateDataExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.RequestedBy = userID

	export, err := h.exportService.CreateExport(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, export)
}

// Cancel cancels an export
func (h *DataExportHandler) Cancel(c *gin.Context) {
	ctx := c.Request.Context()

	exportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid export id", nil)
		return
	}

	export, err := h.exportService.CancelExport(ctx, exportID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, export)
}

// Download downloads exported file
func (h *DataExportHandler) Download(c *gin.Context) {
	ctx := c.Request.Context()

	exportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid export id", nil)
		return
	}

	fileData, fileName, err := h.exportService.DownloadExport(ctx, exportID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, err.Error(), nil)
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, "application/octet-stream", fileData)
}

// Retry retries a failed export
func (h *DataExportHandler) Retry(c *gin.Context) {
	ctx := c.Request.Context()

	exportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid export id", nil)
		return
	}

	export, err := h.exportService.RetryExport(ctx, exportID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, export)
}

// Delete deletes an export
func (h *DataExportHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	exportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid export id", nil)
		return
	}

	if err := h.exportService.DeleteExport(ctx, exportID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "export deleted successfully"})
}

// GetStats gets export statistics
func (h *DataExportHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	stats, err := h.exportService.GetStats(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, stats)
}
