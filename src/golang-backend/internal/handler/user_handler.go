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

type UserHandler struct {
	userService *service.UserService
	authzService *service.AuthorizationService
}

func NewUserHandler(userService *service.UserService, authzService *service.AuthorizationService) *UserHandler {
	return &UserHandler{
		userService: userService,
		authzService: authzService,
	}
}

// List lists users with authorization check
func (h *UserHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	
	// Get pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	// Get tenant ID from context
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	// List users (filtered by tenant)
	users, total, err := h.userService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.PaginatedResponse(c, http.StatusOK, users, total, page, limit)
}

// GetByID gets user by ID
func (h *UserHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
		return
	}
	
	user, err := h.userService.GetByID(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "user not found", nil)
		return
	}
	
	// Remove sensitive data
	user.PasswordHash = ""
	user.MFASecret = nil
	
	httputil.SuccessResponse(c, http.StatusOK, user)
}

// Create creates a new user
func (h *UserHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()
	
	var req service.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	user, err := h.userService.CreateUser(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusCreated, user)
}

// Update updates user
func (h *UserHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
		return
	}
	
	var req service.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	user, err := h.userService.UpdateUser(ctx, userID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, user)
}

// Delete deletes user
func (h *UserHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
		return
	}
	
	if err := h.userService.DeleteUser(ctx, userID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "user deleted successfully"})
}

// GetMe gets current user
func (h *UserHandler) GetMe(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}
	
	user, err := h.userService.GetByID(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "user not found", nil)
		return
	}
	
	// Remove sensitive data
	user.PasswordHash = ""
	user.MFASecret = nil
	
	httputil.SuccessResponse(c, http.StatusOK, user)
}

// UpdateMe updates current user
func (h *UserHandler) UpdateMe(c *gin.Context) {
	ctx := c.Request.Context()
	
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}
	
	var req service.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	user, err := h.userService.UpdateUser(ctx, userID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, user)
}