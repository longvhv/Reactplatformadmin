package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type TenantServiceDeliveryHandler struct {
	service service.TenantServiceDeliveryService
}

func NewTenantServiceDeliveryHandler(service service.TenantServiceDeliveryService) *TenantServiceDeliveryHandler {
	return &TenantServiceDeliveryHandler{service: service}
}

func (h *TenantServiceDeliveryHandler) CreateDelivery(c *gin.Context) {
	var req models.CreateTenantServiceDeliveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	delivery, err := h.service.CreateDelivery(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, delivery)
}

func (h *TenantServiceDeliveryHandler) GetDelivery(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery ID"})
		return
	}

	delivery, err := h.service.GetDelivery(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, delivery)
}

func (h *TenantServiceDeliveryHandler) ListDeliveries(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID, productID *uuid.UUID
	if tid := c.Query("tenant_id"); tid != "" {
		parsed, _ := uuid.Parse(tid)
		tenantID = &parsed
	}
	if pid := c.Query("product_id"); pid != "" {
		parsed, _ := uuid.Parse(pid)
		productID = &parsed
	}

	var status *string
	if st := c.Query("status"); st != "" {
		status = &st
	}

	deliveries, total, err := h.service.ListDeliveries(c.Request.Context(), page, pageSize, tenantID, productID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": deliveries, "total": total, "page": page, "page_size": pageSize})
}

func (h *TenantServiceDeliveryHandler) ListDeliveriesByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	deliveries, err := h.service.ListDeliveriesByTenant(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deliveries)
}

func (h *TenantServiceDeliveryHandler) ListDeliveriesBySubscription(c *gin.Context) {
	subscriptionID, err := uuid.Parse(c.Param("subscription_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription ID"})
		return
	}

	deliveries, err := h.service.ListDeliveriesBySubscription(c.Request.Context(), subscriptionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deliveries)
}

func (h *TenantServiceDeliveryHandler) UpdateDelivery(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery ID"})
		return
	}

	var req models.UpdateTenantServiceDeliveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	delivery, err := h.service.UpdateDelivery(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, delivery)
}

func (h *TenantServiceDeliveryHandler) UpdateProgress(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery ID"})
		return
	}

	var req models.UpdateDeliveryProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateProgress(c.Request.Context(), id, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress updated successfully"})
}

func (h *TenantServiceDeliveryHandler) DeleteDelivery(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delivery ID"})
		return
	}

	if err := h.service.DeleteDelivery(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delivery deleted successfully"})
}
