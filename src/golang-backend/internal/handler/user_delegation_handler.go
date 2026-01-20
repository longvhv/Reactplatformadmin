package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type UserDelegationHandler struct {
	service service.UserDelegationService
}

func NewUserDelegationHandler(service service.UserDelegationService) *UserDelegationHandler {
	return &UserDelegationHandler{service: service}
}

func (h *UserDelegationHandler) CreateDelegation(c *gin.Context) {
	var req models.CreateUserDelegationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	delegation, err := h.service.CreateDelegation(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, delegation)
}

func (h *UserDelegationHandler) ListDelegations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var delegatorID *uuid.UUID
	if delegatorIDStr := c.Query("delegator_id"); delegatorIDStr != "" {
		parsed, err := uuid.Parse(delegatorIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegator_id format"})
			return
		}
		delegatorID = &parsed
	}

	var delegateID *uuid.UUID
	if delegateIDStr := c.Query("delegate_id"); delegateIDStr != "" {
		parsed, err := uuid.Parse(delegateIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegate_id format"})
			return
		}
		delegateID = &parsed
	}

	var tenantID *uuid.UUID
	if tenantIDStr := c.Query("tenant_id"); tenantIDStr != "" {
		parsed, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id format"})
			return
		}
		tenantID = &parsed
	}

	var status *string
	if st := c.Query("status"); st != "" {
		status = &st
	}

	delegations, total, err := h.service.ListDelegations(c.Request.Context(), page, pageSize, delegatorID, delegateID, tenantID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      delegations,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *UserDelegationHandler) GetDelegation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegation ID"})
		return
	}

	delegation, err := h.service.GetDelegation(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, delegation)
}

func (h *UserDelegationHandler) UpdateDelegation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegation ID"})
		return
	}

	var req models.UpdateUserDelegationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	delegation, err := h.service.UpdateDelegation(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, delegation)
}

func (h *UserDelegationHandler) DeleteDelegation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegation ID"})
		return
	}

	if err := h.service.DeleteDelegation(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserDelegationHandler) ActivateDelegation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegation ID"})
		return
	}

	if err := h.service.ActivateDelegation(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "delegation activated successfully"})
}

func (h *UserDelegationHandler) RevokeDelegation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegation ID"})
		return
	}

	var req models.RevokeDelegationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Get revokedBy from authentication context
	revokedBy := uuid.New() // Placeholder

	if err := h.service.RevokeDelegation(c.Request.Context(), id, revokedBy, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "delegation revoked successfully"})
}

func (h *UserDelegationHandler) SuspendDelegation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegation ID"})
		return
	}

	if err := h.service.SuspendDelegation(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "delegation suspended successfully"})
}

func (h *UserDelegationHandler) ListDelegationsByDelegator(c *gin.Context) {
	delegatorID, err := uuid.Parse(c.Param("delegator_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegator ID"})
		return
	}

	delegations, err := h.service.ListDelegationsByDelegator(c.Request.Context(), delegatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": delegations})
}

func (h *UserDelegationHandler) ListDelegationsByDelegate(c *gin.Context) {
	delegateID, err := uuid.Parse(c.Param("delegate_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegate ID"})
		return
	}

	delegations, err := h.service.ListDelegationsByDelegate(c.Request.Context(), delegateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": delegations})
}

func (h *UserDelegationHandler) GetActiveDelegations(c *gin.Context) {
	delegatorID, err := uuid.Parse(c.Param("delegator_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid delegator ID"})
		return
	}

	delegations, err := h.service.GetActiveDelegations(c.Request.Context(), delegatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": delegations})
}

func (h *UserDelegationHandler) ExpireOldDelegations(c *gin.Context) {
	if err := h.service.ExpireOldDelegations(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "old delegations expired successfully"})
}
