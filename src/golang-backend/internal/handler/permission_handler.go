package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

// PermissionHandler handles HTTP requests for permissions
type PermissionHandler struct {
	service *service.PermissionService
}

// NewPermissionHandler creates a new permission handler
func NewPermissionHandler(service *service.PermissionService) *PermissionHandler {
	return &PermissionHandler{service: service}
}

// GetAll handles GET /api/v1/permissions
func (h *PermissionHandler) GetAll(c *gin.Context) {
	// Parse filters from query params
	filters := models.PermissionFilters{}

	if categoryStr := c.Query("category"); categoryStr != "" {
		category := models.PermissionCategory(categoryStr)
		filters.Category = &category
	}

	if typeStr := c.Query("type"); typeStr != "" {
		permType := models.PermissionType(typeStr)
		filters.Type = &permType
	}

	if resourceType := c.Query("resource_type"); resourceType != "" {
		filters.ResourceType = &resourceType
	}

	if isSystemStr := c.Query("is_system"); isSystemStr != "" {
		isSystem := isSystemStr == "true"
		filters.IsSystem = &isSystem
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	// Get permissions
	permissions, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, permissions)
}

// GetByID handles GET /api/v1/permissions/:id
func (h *PermissionHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	permission, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "permission not found" || err.Error() == "invalid permission ID format" {
			utils.NotFoundResponse(c, "Permission")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, permission)
}

// GetByCode handles GET /api/v1/permissions/code/:code
func (h *PermissionHandler) GetByCode(c *gin.Context) {
	code := c.Param("code")

	permission, err := h.service.GetByCode(c.Request.Context(), code)
	if err != nil {
		if err.Error() == "invalid permission code format" {
			utils.ValidationErrorResponse(c, err.Error())
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	if permission == nil {
		utils.NotFoundResponse(c, "Permission")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, permission)
}

// GetByCategory handles GET /api/v1/permissions/grouped
func (h *PermissionHandler) GetByCategory(c *gin.Context) {
	grouped, err := h.service.GetByCategory(c.Request.Context())
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, grouped)
}

// ValidateCodes handles POST /api/v1/permissions/validate
func (h *PermissionHandler) ValidateCodes(c *gin.Context) {
	var req struct {
		Codes []string `json:"codes" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	valid, invalid, err := h.service.ValidatePermissionCodes(c.Request.Context(), req.Codes)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"valid":   valid,
		"invalid": invalid,
	})
}

// Create handles POST /api/v1/permissions
func (h *PermissionHandler) Create(c *gin.Context) {
	var req models.CreatePermissionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	permission, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "permission code already exists" {
			utils.ErrorResponse(c, http.StatusConflict, "CODE_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, permission)
}

// Update handles PATCH /api/v1/permissions/:id
func (h *PermissionHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	permission, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "permission not found" || err.Error() == "invalid permission ID format" {
			utils.NotFoundResponse(c, "Permission")
			return
		}
		if err.Error() == "cannot modify system permissions" {
			utils.ErrorResponse(c, http.StatusForbidden, "SYSTEM_PERMISSION", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, permission)
}

// Delete handles DELETE /api/v1/permissions/:id
func (h *PermissionHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "permission not found" || err.Error() == "invalid permission ID format" {
			utils.NotFoundResponse(c, "Permission")
			return
		}
		if err.Error() == "cannot delete system permissions" {
			utils.ErrorResponse(c, http.StatusForbidden, "SYSTEM_PERMISSION", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
