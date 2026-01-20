package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

type ApplicationHandler struct {
	service *service.ApplicationService
}

func NewApplicationHandler(service *service.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{service: service}
}

func (h *ApplicationHandler) GetAll(c *gin.Context) {
	filters := models.ApplicationFilters{}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.ApplicationStatus(statusStr)
		filters.Status = &status
	}

	if ownerID := c.Query("owner_tenant_id"); ownerID != "" {
		filters.OwnerTenantID = &ownerID
	}

	if isPublicStr := c.Query("is_public"); isPublicStr != "" {
		isPublic := isPublicStr == "true"
		filters.IsPublic = &isPublic
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	apps, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, apps)
}

func (h *ApplicationHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	app, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "application not found" || err.Error() == "invalid application ID format" {
			utils.NotFoundResponse(c, "Application")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, app)
}

func (h *ApplicationHandler) GetByCode(c *gin.Context) {
	code := c.Param("code")

	app, err := h.service.GetByCode(c.Request.Context(), code)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	if app == nil {
		utils.NotFoundResponse(c, "Application")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, app)
}

func (h *ApplicationHandler) Create(c *gin.Context) {
	var req models.CreateApplicationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	app, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "application code already exists" {
			utils.ErrorResponse(c, http.StatusConflict, "CODE_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, app)
}

func (h *ApplicationHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	app, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "application not found" || err.Error() == "invalid application ID format" {
			utils.NotFoundResponse(c, "Application")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, app)
}

func (h *ApplicationHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "application not found" || err.Error() == "invalid application ID format" {
			utils.NotFoundResponse(c, "Application")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
