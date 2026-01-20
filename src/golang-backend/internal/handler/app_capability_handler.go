package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type AppCapabilityHandler struct {
	service service.AppCapabilityService
}

func NewAppCapabilityHandler(service service.AppCapabilityService) *AppCapabilityHandler {
	return &AppCapabilityHandler{service: service}
}

func (h *AppCapabilityHandler) CreateCapability(c *gin.Context) {
	var req models.CreateAppCapabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	capability, err := h.service.CreateCapability(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, capability)
}

func (h *AppCapabilityHandler) GetCapability(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid capability ID"})
		return
	}

	capability, err := h.service.GetCapability(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, capability)
}

func (h *AppCapabilityHandler) ListCapabilities(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID, appID *uuid.UUID
	if tid := c.Query("tenant_id"); tid != "" {
		parsed, _ := uuid.Parse(tid)
		tenantID = &parsed
	}
	if aid := c.Query("app_id"); aid != "" {
		parsed, _ := uuid.Parse(aid)
		appID = &parsed
	}

	var capabilityType *string
	if ct := c.Query("type"); ct != "" {
		capabilityType = &ct
	}

	capabilities, total, err := h.service.ListCapabilities(c.Request.Context(), page, pageSize, tenantID, appID, capabilityType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": capabilities, "total": total, "page": page, "page_size": pageSize})
}

func (h *AppCapabilityHandler) ListCapabilitiesByApp(c *gin.Context) {
	appID, err := uuid.Parse(c.Param("app_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid app ID"})
		return
	}

	capabilities, err := h.service.ListCapabilitiesByApp(c.Request.Context(), appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, capabilities)
}

func (h *AppCapabilityHandler) UpdateCapability(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid capability ID"})
		return
	}

	var req models.UpdateAppCapabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	capability, err := h.service.UpdateCapability(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, capability)
}

func (h *AppCapabilityHandler) DeleteCapability(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid capability ID"})
		return
	}

	if err := h.service.DeleteCapability(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Capability deleted successfully"})
}

func (h *AppCapabilityHandler) SoftDeleteCapability(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid capability ID"})
		return
	}

	deletedBy := uuid.Nil
	if err := h.service.SoftDeleteCapability(c.Request.Context(), id, deletedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Capability soft deleted successfully"})
}
