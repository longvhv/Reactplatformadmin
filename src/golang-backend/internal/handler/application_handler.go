package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type ApplicationHandler struct {
	applicationService *service.ApplicationService
	authzService       *service.AuthorizationService
}

func NewApplicationHandler(applicationService *service.ApplicationService, authzService *service.AuthorizationService) *ApplicationHandler {
	return &ApplicationHandler{
		applicationService: applicationService,
		authzService:       authzService,
	}
}

// List lists applications
func (h *ApplicationHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	applications, total, err := h.applicationService.List(ctx, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, applications, total, page, limit)
}

// GetByID gets application by ID
func (h *ApplicationHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid application id", nil)
		return
	}

	application, err := h.applicationService.GetByID(ctx, appID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "application not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, application)
}

// GetByCode gets application by code
func (h *ApplicationHandler) GetByCode(c *gin.Context) {
	ctx := c.Request.Context()

	code := c.Param("code")
	if code == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "code required", nil)
		return
	}

	application, err := h.applicationService.GetByCode(ctx, code)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "application not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, application)
}

// Create creates an application
func (h *ApplicationHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	application, err := h.applicationService.CreateApplication(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, application)
}

// Update updates an application
func (h *ApplicationHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid application id", nil)
		return
	}

	var req service.UpdateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	application, err := h.applicationService.UpdateApplication(ctx, appID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, application)
}

// Delete deletes an application
func (h *ApplicationHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid application id", nil)
		return
	}

	if err := h.applicationService.DeleteApplication(ctx, appID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "application deleted successfully"})
}
