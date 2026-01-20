package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type FeatureFlagHandler struct {
	service service.FeatureFlagService
}

func NewFeatureFlagHandler(service service.FeatureFlagService) *FeatureFlagHandler {
	return &FeatureFlagHandler{service: service}
}

func (h *FeatureFlagHandler) CreateFlag(c *gin.Context) {
	var req models.CreateFeatureFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	flag, err := h.service.CreateFlag(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, flag)
}

func (h *FeatureFlagHandler) ListFlags(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var environment *string
	if env := c.Query("environment"); env != "" {
		environment = &env
	}

	var isEnabled *bool
	if enabledStr := c.Query("is_enabled"); enabledStr != "" {
		enabled := enabledStr == "true"
		isEnabled = &enabled
	}

	flags, total, err := h.service.ListFlags(c.Request.Context(), page, pageSize, environment, isEnabled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      flags,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *FeatureFlagHandler) GetFlag(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flag ID"})
		return
	}

	flag, err := h.service.GetFlag(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, flag)
}

func (h *FeatureFlagHandler) GetFlagByKey(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key is required"})
		return
	}

	flag, err := h.service.GetFlagByKey(c.Request.Context(), key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, flag)
}

func (h *FeatureFlagHandler) UpdateFlag(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flag ID"})
		return
	}

	var req models.UpdateFeatureFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	flag, err := h.service.UpdateFlag(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, flag)
}

func (h *FeatureFlagHandler) DeleteFlag(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flag ID"})
		return
	}

	if err := h.service.DeleteFlag(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *FeatureFlagHandler) ListFlagsByEnvironment(c *gin.Context) {
	environment := c.Param("environment")
	if environment == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "environment is required"})
		return
	}

	flags, err := h.service.ListFlagsByEnvironment(c.Request.Context(), environment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": flags})
}

func (h *FeatureFlagHandler) ListEnabledFlags(c *gin.Context) {
	environment := c.DefaultQuery("environment", "production")

	flags, err := h.service.ListEnabledFlags(c.Request.Context(), environment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": flags})
}

func (h *FeatureFlagHandler) EnableFlag(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flag ID"})
		return
	}

	if err := h.service.EnableFlag(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "flag enabled successfully"})
}

func (h *FeatureFlagHandler) DisableFlag(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flag ID"})
		return
	}

	if err := h.service.DisableFlag(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "flag disabled successfully"})
}

func (h *FeatureFlagHandler) UpdateRolloutPercentage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid flag ID"})
		return
	}

	var req struct {
		Percentage int `json:"percentage" binding:"required,min=0,max=100"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateRolloutPercentage(c.Request.Context(), id, req.Percentage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "rollout percentage updated successfully"})
}

func (h *FeatureFlagHandler) IsFeatureEnabled(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key is required"})
		return
	}

	environment := c.DefaultQuery("environment", "production")

	enabled, err := h.service.IsFeatureEnabled(c.Request.Context(), key, environment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"key":         key,
		"environment": environment,
		"enabled":     enabled,
	})
}
