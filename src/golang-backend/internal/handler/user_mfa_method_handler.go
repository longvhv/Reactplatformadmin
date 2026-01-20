package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type UserMFAMethodHandler struct {
	service service.UserMFAMethodService
}

func NewUserMFAMethodHandler(service service.UserMFAMethodService) *UserMFAMethodHandler {
	return &UserMFAMethodHandler{service: service}
}

func (h *UserMFAMethodHandler) CreateMFAMethod(c *gin.Context) {
	var req models.CreateUserMFAMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	method, err := h.service.CreateMFAMethod(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, method)
}

func (h *UserMFAMethodHandler) ListMFAMethods(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var userID *uuid.UUID
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		parsed, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
			return
		}
		userID = &parsed
	}

	var methodType *string
	if mt := c.Query("method_type"); mt != "" {
		methodType = &mt
	}

	var status *string
	if st := c.Query("status"); st != "" {
		status = &st
	}

	methods, total, err := h.service.ListMFAMethods(c.Request.Context(), page, pageSize, userID, methodType, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      methods,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *UserMFAMethodHandler) GetMFAMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid MFA method ID"})
		return
	}

	method, err := h.service.GetMFAMethod(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, method)
}

func (h *UserMFAMethodHandler) UpdateMFAMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid MFA method ID"})
		return
	}

	var req models.UpdateUserMFAMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	method, err := h.service.UpdateMFAMethod(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, method)
}

func (h *UserMFAMethodHandler) DeleteMFAMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid MFA method ID"})
		return
	}

	if err := h.service.DeleteMFAMethod(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserMFAMethodHandler) ActivateMFAMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid MFA method ID"})
		return
	}

	if err := h.service.ActivateMFAMethod(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "MFA method activated successfully"})
}

func (h *UserMFAMethodHandler) DeactivateMFAMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid MFA method ID"})
		return
	}

	if err := h.service.DeactivateMFAMethod(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "MFA method deactivated successfully"})
}

func (h *UserMFAMethodHandler) VerifyMFAMethod(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid MFA method ID"})
		return
	}

	var req models.VerifyMFAMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.VerifyMFAMethod(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "MFA method verified successfully"})
}

func (h *UserMFAMethodHandler) SetPrimaryMethod(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	methodID, err := uuid.Parse(c.Param("method_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid method ID"})
		return
	}

	if err := h.service.SetPrimaryMethod(c.Request.Context(), userID, methodID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "primary MFA method set successfully"})
}

func (h *UserMFAMethodHandler) ListMFAMethodsByUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	methods, err := h.service.ListMFAMethodsByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": methods})
}

func (h *UserMFAMethodHandler) GetPrimaryMethod(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	method, err := h.service.GetPrimaryMethod(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, method)
}
