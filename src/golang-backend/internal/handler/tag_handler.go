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

type TagHandler struct {
	tagService   *service.TagService
	authzService *service.AuthorizationService
}

func NewTagHandler(tagService *service.TagService, authzService *service.AuthorizationService) *TagHandler {
	return &TagHandler{
		tagService:   tagService,
		authzService: authzService,
	}
}

// List lists tags
func (h *TagHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	category := c.Query("category")

	tags, total, err := h.tagService.ListByTenant(ctx, tenantID, category, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, tags, total, page, limit)
}

// GetByID gets tag by ID
func (h *TagHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	tagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tag id", nil)
		return
	}

	tag, err := h.tagService.GetByID(ctx, tagID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "tag not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tag)
}

// GetBySlug gets tag by slug
func (h *TagHandler) GetBySlug(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	slug := c.Param("slug")
	if slug == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "slug required", nil)
		return
	}

	tag, err := h.tagService.GetBySlug(ctx, tenantID, slug)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "tag not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tag)
}

// Create creates a tag
func (h *TagHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	tag, err := h.tagService.CreateTag(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, tag)
}

// Update updates a tag
func (h *TagHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	tagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tag id", nil)
		return
	}

	var req service.UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	tag, err := h.tagService.UpdateTag(ctx, tagID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tag)
}

// Delete deletes a tag
func (h *TagHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	tagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid tag id", nil)
		return
	}

	if err := h.tagService.DeleteTag(ctx, tagID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "tag deleted successfully"})
}

// Search searches tags
func (h *TagHandler) Search(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	query := c.Query("q")
	if query == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "query required", nil)
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	tags, err := h.tagService.SearchTags(ctx, tenantID, query, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tags)
}

// GetPopular gets popular tags
func (h *TagHandler) GetPopular(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	tags, err := h.tagService.GetPopularTags(ctx, tenantID, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tags)
}

// Merge merges tags
func (h *TagHandler) Merge(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		SourceTagID uuid.UUID `json:"source_tag_id" binding:"required"`
		TargetTagID uuid.UUID `json:"target_tag_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	tag, err := h.tagService.MergeTags(ctx, req.SourceTagID, req.TargetTagID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tag)
}
