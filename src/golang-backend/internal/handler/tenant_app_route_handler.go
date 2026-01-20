package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type TenantAppRouteHandler struct {
	service service.TenantAppRouteService
}

func NewTenantAppRouteHandler(service service.TenantAppRouteService) *TenantAppRouteHandler {
	return &TenantAppRouteHandler{service: service}
}

func (h *TenantAppRouteHandler) CreateRoute(c *gin.Context) {
	var req models.CreateTenantAppRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	route, err := h.service.CreateRoute(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, route)
}

func (h *TenantAppRouteHandler) ListRoutes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID *uuid.UUID
	if tenantIDStr := c.Query("tenant_id"); tenantIDStr != "" {
		parsed, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id format"})
			return
		}
		tenantID = &parsed
	}

	var appCode *string
	if ac := c.Query("app_code"); ac != "" {
		appCode = &ac
	}

	var status *string
	if st := c.Query("status"); st != "" {
		status = &st
	}

	routes, total, err := h.service.ListRoutes(c.Request.Context(), page, pageSize, tenantID, appCode, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      routes,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *TenantAppRouteHandler) GetRoute(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route ID"})
		return
	}

	route, err := h.service.GetRoute(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, route)
}

func (h *TenantAppRouteHandler) UpdateRoute(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route ID"})
		return
	}

	var req models.UpdateTenantAppRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	route, err := h.service.UpdateRoute(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, route)
}

func (h *TenantAppRouteHandler) DeleteRoute(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route ID"})
		return
	}

	if err := h.service.DeleteRoute(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *TenantAppRouteHandler) ListRoutesByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	routes, err := h.service.ListRoutesByTenant(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": routes})
}

func (h *TenantAppRouteHandler) ListRoutesByAppCode(c *gin.Context) {
	appCode := c.Param("app_code")
	if appCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_code is required"})
		return
	}

	routes, err := h.service.ListRoutesByAppCode(c.Request.Context(), appCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": routes})
}

func (h *TenantAppRouteHandler) GetRouteByDomain(c *gin.Context) {
	domain := c.Param("domain")
	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "domain is required"})
		return
	}

	route, err := h.service.GetRouteByDomain(c.Request.Context(), domain)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, route)
}

func (h *TenantAppRouteHandler) GetPrimaryRoute(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	appCode := c.Param("app_code")
	if appCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_code is required"})
		return
	}

	route, err := h.service.GetPrimaryRoute(c.Request.Context(), tenantID, appCode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, route)
}

func (h *TenantAppRouteHandler) SetPrimaryRoute(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	appCode := c.Param("app_code")
	if appCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "app_code is required"})
		return
	}

	routeID, err := uuid.Parse(c.Param("route_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route ID"})
		return
	}

	if err := h.service.SetPrimaryRoute(c.Request.Context(), tenantID, appCode, routeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "primary route set successfully"})
}

func (h *TenantAppRouteHandler) UpdateSSLStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route ID"})
		return
	}

	var req struct {
		SSLStatus string `json:"ssl_status" binding:"required,oneof=NONE PENDING ACTIVE FAILED"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateSSLStatus(c.Request.Context(), id, req.SSLStatus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "SSL status updated successfully"})
}

func (h *TenantAppRouteHandler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=ACTIVE INACTIVE MAINTENANCE PENDING_DNS"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateStatus(c.Request.Context(), id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated successfully"})
}
