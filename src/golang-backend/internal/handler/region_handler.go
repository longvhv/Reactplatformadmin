package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type RegionHandler struct {
	service service.RegionService
}

func NewRegionHandler(service service.RegionService) *RegionHandler {
	return &RegionHandler{service: service}
}

func (h *RegionHandler) CreateRegion(c *gin.Context) {
	var req models.CreateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	region, err := h.service.CreateRegion(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, region)
}

func (h *RegionHandler) GetRegion(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid region ID"})
		return
	}

	region, err := h.service.GetRegion(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, region)
}

func (h *RegionHandler) GetRegionByCode(c *gin.Context) {
	code := c.Param("code")
	region, err := h.service.GetRegionByCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, region)
}

func (h *RegionHandler) ListRegions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var regionType *string
	if rt := c.Query("type"); rt != "" {
		regionType = &rt
	}

	var parentID *uuid.UUID
	if pid := c.Query("parent_id"); pid != "" {
		parsed, err := uuid.Parse(pid)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid parent_id"})
			return
		}
		parentID = &parsed
	}

	regions, total, err := h.service.ListRegions(c.Request.Context(), page, pageSize, regionType, parentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      regions,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *RegionHandler) ListRegionsByType(c *gin.Context) {
	regionType := c.Param("type")
	regions, err := h.service.ListRegionsByType(c.Request.Context(), regionType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, regions)
}

func (h *RegionHandler) ListRegionsByParent(c *gin.Context) {
	parentID, err := uuid.Parse(c.Param("parent_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid parent ID"})
		return
	}

	regions, err := h.service.ListRegionsByParent(c.Request.Context(), parentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, regions)
}

func (h *RegionHandler) UpdateRegion(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid region ID"})
		return
	}

	var req models.UpdateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	region, err := h.service.UpdateRegion(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, region)
}

func (h *RegionHandler) DeleteRegion(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid region ID"})
		return
	}

	if err := h.service.DeleteRegion(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Region deleted successfully"})
}

func (h *RegionHandler) SoftDeleteRegion(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid region ID"})
		return
	}

	// TODO: Get deletedBy from auth context
	deletedBy := uuid.Nil

	if err := h.service.SoftDeleteRegion(c.Request.Context(), id, deletedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Region soft deleted successfully"})
}
