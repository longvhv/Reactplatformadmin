package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type RegionHandler struct {
	regionService *service.RegionService
	authzService  *service.AuthorizationService
}

func NewRegionHandler(regionService *service.RegionService, authzService *service.AuthorizationService) *RegionHandler {
	return &RegionHandler{
		regionService: regionService,
		authzService:  authzService,
	}
}

// List lists regions
func (h *RegionHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	regionType := c.Query("type")
	parentID := c.Query("parent_id")
	status := c.Query("status")

	var parentUUID *uuid.UUID
	if parentID != "" {
		parsed, err := uuid.Parse(parentID)
		if err == nil {
			parentUUID = &parsed
		}
	}

	var statusInt *int
	if status != "" {
		s, _ := strconv.Atoi(status)
		statusInt = &s
	}

	regions, total, err := h.regionService.ListRegions(ctx, regionType, parentUUID, statusInt, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, regions, total, page, limit)
}

// GetByID gets region by ID
func (h *RegionHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	regionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid region id", nil)
		return
	}

	region, err := h.regionService.GetByID(ctx, regionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "region not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, region)
}

// GetByCode gets region by code
func (h *RegionHandler) GetByCode(c *gin.Context) {
	ctx := c.Request.Context()

	code := c.Param("code")
	if code == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "code required", nil)
		return
	}

	region, err := h.regionService.GetByCode(ctx, code)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "region not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, region)
}

// Create creates a region
func (h *RegionHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	region, err := h.regionService.CreateRegion(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, region)
}

// Update updates a region
func (h *RegionHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	regionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid region id", nil)
		return
	}

	var req service.UpdateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	region, err := h.regionService.UpdateRegion(ctx, regionID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, region)
}

// Delete deletes a region
func (h *RegionHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	regionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid region id", nil)
		return
	}

	if err := h.regionService.DeleteRegion(ctx, regionID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "region deleted successfully"})
}

// GetChildren gets child regions
func (h *RegionHandler) GetChildren(c *gin.Context) {
	ctx := c.Request.Context()

	parentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid region id", nil)
		return
	}

	children, err := h.regionService.GetChildren(ctx, parentID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, children)
}

// GetHierarchy gets region hierarchy tree
func (h *RegionHandler) GetHierarchy(c *gin.Context) {
	ctx := c.Request.Context()

	regionType := c.DefaultQuery("type", "NATION")

	hierarchy, err := h.regionService.GetHierarchy(ctx, regionType)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, hierarchy)
}
