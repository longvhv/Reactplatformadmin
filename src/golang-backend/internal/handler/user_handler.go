package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

// UserHandler handles HTTP requests for users
type UserHandler struct {
	service *service.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// GetAll handles GET /api/v1/users
func (h *UserHandler) GetAll(c *gin.Context) {
	// Parse filters from query params
	filters := models.UserFilters{}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.UserStatus(statusStr)
		filters.Status = &status
	}

	if isSupportStr := c.Query("is_support_staff"); isSupportStr != "" {
		isSupport := isSupportStr == "true"
		filters.IsSupportStaff = &isSupport
	}

	if mfaStr := c.Query("mfa_enabled"); mfaStr != "" {
		mfa := mfaStr == "true"
		filters.MFAEnabled = &mfa
	}

	if locale := c.Query("locale"); locale != "" {
		filters.Locale = &locale
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	// Get users
	users, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, users)
}

// GetByID handles GET /api/v1/users/:id
func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	user, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "invalid user ID format" {
			utils.NotFoundResponse(c, "User")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// GetByEmail handles GET /api/v1/users/email/:email
func (h *UserHandler) GetByEmail(c *gin.Context) {
	email := c.Param("email")

	user, err := h.service.GetByEmail(c.Request.Context(), email)
	if err != nil {
		if err.Error() == "invalid email format" {
			utils.ValidationErrorResponse(c, err.Error())
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	if user == nil {
		utils.NotFoundResponse(c, "User")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// Create handles POST /api/v1/users
func (h *UserHandler) Create(c *gin.Context) {
	var req models.CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	user, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "email already exists" {
			utils.ErrorResponse(c, http.StatusConflict, "EMAIL_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, user)
}

// Update handles PATCH /api/v1/users/:id
func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	user, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "invalid user ID format" {
			utils.NotFoundResponse(c, "User")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// Delete handles DELETE /api/v1/users/:id
func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "invalid user ID format" {
			utils.NotFoundResponse(c, "User")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}

// UpdateStatus handles PATCH /api/v1/users/:id/status
func (h *UserHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status models.UserStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	user, err := h.service.UpdateStatus(c.Request.Context(), id, req.Status)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "invalid user ID format" {
			utils.NotFoundResponse(c, "User")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// EnableMFA handles POST /api/v1/users/:id/mfa/enable
func (h *UserHandler) EnableMFA(c *gin.Context) {
	id := c.Param("id")

	user, err := h.service.EnableMFA(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "invalid user ID format" {
			utils.NotFoundResponse(c, "User")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// DisableMFA handles POST /api/v1/users/:id/mfa/disable
func (h *UserHandler) DisableMFA(c *gin.Context) {
	id := c.Param("id")

	user, err := h.service.DisableMFA(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "user not found" || err.Error() == "invalid user ID format" {
			utils.NotFoundResponse(c, "User")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}
