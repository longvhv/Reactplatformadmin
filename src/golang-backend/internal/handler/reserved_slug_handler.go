package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type ReservedSlugHandler struct {
	service service.ReservedSlugService
}

func NewReservedSlugHandler(service service.ReservedSlugService) *ReservedSlugHandler {
	return &ReservedSlugHandler{service: service}
}

func (h *ReservedSlugHandler) CreateSlug(c *gin.Context) {
	var req models.CreateReservedSlugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	slug, err := h.service.CreateSlug(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, slug)
}

func (h *ReservedSlugHandler) GetSlug(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug ID"})
		return
	}

	slug, err := h.service.GetSlug(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, slug)
}

func (h *ReservedSlugHandler) GetSlugByName(c *gin.Context) {
	slugName := c.Param("slug")
	if slugName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	slug, err := h.service.GetSlugByName(c.Request.Context(), slugName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, slug)
}

func (h *ReservedSlugHandler) ListSlugs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var slugType *string
	if st := c.Query("type"); st != "" {
		slugType = &st
	}

	var isActive *bool
	if ia := c.Query("is_active"); ia != "" {
		active := ia == "true"
		isActive = &active
	}

	slugs, total, err := h.service.ListSlugs(c.Request.Context(), page, pageSize, slugType, isActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      slugs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *ReservedSlugHandler) ListSlugsByType(c *gin.Context) {
	slugType := c.Param("type")
	if slugType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type is required"})
		return
	}

	slugs, err := h.service.ListSlugsByType(c.Request.Context(), slugType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, slugs)
}

func (h *ReservedSlugHandler) UpdateSlug(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug ID"})
		return
	}

	var req models.UpdateReservedSlugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	slug, err := h.service.UpdateSlug(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, slug)
}

func (h *ReservedSlugHandler) DeleteSlug(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slug ID"})
		return
	}

	if err := h.service.DeleteSlug(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Slug deleted successfully"})
}

func (h *ReservedSlugHandler) CheckSlug(c *gin.Context) {
	var req models.CheckSlugRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.CheckSlug(c.Request.Context(), req.Slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *ReservedSlugHandler) ListActiveSlugs(c *gin.Context) {
	slugs, err := h.service.ListActiveSlugs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, slugs)
}
