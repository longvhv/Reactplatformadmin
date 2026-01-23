package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type SystemJobHandler struct {
	jobService   *service.SystemJobService
	authzService *service.AuthorizationService
}

func NewSystemJobHandler(jobService *service.SystemJobService, authzService *service.AuthorizationService) *SystemJobHandler {
	return &SystemJobHandler{
		jobService:   jobService,
		authzService: authzService,
	}
}

// List lists jobs
func (h *SystemJobHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	jobType := c.Query("job_type")
	status := c.Query("status")

	jobs, total, err := h.jobService.ListJobs(ctx, jobType, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, jobs, total, page, limit)
}

// GetByID gets job by ID
func (h *SystemJobHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid job id", nil)
		return
	}

	job, err := h.jobService.GetByID(ctx, jobID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "job not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, job)
}

// Create creates a job
func (h *SystemJobHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSystemJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	job, err := h.jobService.CreateJob(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, job)
}

// Update updates a job
func (h *SystemJobHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid job id", nil)
		return
	}

	var req service.UpdateSystemJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	job, err := h.jobService.UpdateJob(ctx, jobID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, job)
}

// Delete deletes a job
func (h *SystemJobHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid job id", nil)
		return
	}

	if err := h.jobService.DeleteJob(ctx, jobID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "job deleted successfully"})
}

// Execute executes a job
func (h *SystemJobHandler) Execute(c *gin.Context) {
	ctx := c.Request.Context()

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid job id", nil)
		return
	}

	job, err := h.jobService.ExecuteJob(ctx, jobID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, job)
}

// Cancel cancels a job
func (h *SystemJobHandler) Cancel(c *gin.Context) {
	ctx := c.Request.Context()

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid job id", nil)
		return
	}

	job, err := h.jobService.CancelJob(ctx, jobID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, job)
}

// Retry retries a job
func (h *SystemJobHandler) Retry(c *gin.Context) {
	ctx := c.Request.Context()

	jobID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid job id", nil)
		return
	}

	job, err := h.jobService.RetryJob(ctx, jobID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, job)
}

// GetPending gets pending jobs
func (h *SystemJobHandler) GetPending(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	jobs, err := h.jobService.GetPendingJobs(ctx, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, jobs)
}

// GetRunning gets running jobs
func (h *SystemJobHandler) GetRunning(c *gin.Context) {
	ctx := c.Request.Context()

	jobs, err := h.jobService.GetRunningJobs(ctx)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, jobs)
}

// GetStats gets job statistics
func (h *SystemJobHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	stats, err := h.jobService.GetJobStats(ctx)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, stats)
}
