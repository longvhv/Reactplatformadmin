package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type ReservedSlugHandler struct {
	slugService  *service.ReservedSlugService
	authzService *service.AuthorizationService
}

func NewReservedSlugHandler(slugService *service.ReservedSlugService, authzService *service.AuthorizationService) *ReservedSlugHandler {
	return &ReservedSlugHandler{
		slugService:  slugService,
		authzService: authzService,
	}
}

// List lists reserved slugs
func (h *ReservedSlugHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	slugType := c.Query("type")
	matchType := c.Query("match_type")

	slugs, total, err := h.slugService.ListSlugs(ctx, slugType, matchType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, slugs, total, page, limit)
}

// GetByID gets reserved slug by ID
func (h *ReservedSlugHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	slugID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid slug id", nil)
		return
	}

	slug, err := h.slugService.GetByID(ctx, slugID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "slug not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, slug)
}

// CheckSlug checks if a slug is reserved
func (h *ReservedSlugHandler) CheckSlug(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		Slug string `json:"slug" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	isReserved, reason, err := h.slugService.IsSlugReserved(ctx, req.Slug)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"slug":        req.Slug,
		"is_reserved": isReserved,
		"reason":      reason,
	})
}

// Create creates a reserved slug
func (h *ReservedSlugHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateReservedSlugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	slug, err := h.slugService.CreateSlug(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, slug)
}

// Update updates a reserved slug
func (h *ReservedSlugHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	slugID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid slug id", nil)
		return
	}

	var req service.UpdateReservedSlugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	slug, err := h.slugService.UpdateSlug(ctx, slugID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, slug)
}

// Delete deletes a reserved slug
func (h *ReservedSlugHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	slugID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid slug id", nil)
		return
	}

	if err := h.slugService.DeleteSlug(ctx, slugID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "slug deleted successfully"})
}
