package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type UserConsentHandler struct {
	service service.UserConsentService
}

func NewUserConsentHandler(service service.UserConsentService) *UserConsentHandler {
	return &UserConsentHandler{service: service}
}

func (h *UserConsentHandler) CreateConsent(c *gin.Context) {
	var req models.CreateUserConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	consent, err := h.service.CreateConsent(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, consent)
}

func (h *UserConsentHandler) ListConsents(c *gin.Context) {
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

	var documentID *uuid.UUID
	if docIDStr := c.Query("document_id"); docIDStr != "" {
		parsed, err := uuid.Parse(docIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document_id format"})
			return
		}
		documentID = &parsed
	}

	var withdrawn *bool
	if withdrawnStr := c.Query("withdrawn"); withdrawnStr != "" {
		val, err := strconv.ParseBool(withdrawnStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid withdrawn format"})
			return
		}
		withdrawn = &val
	}

	consents, total, err := h.service.ListConsents(c.Request.Context(), page, pageSize, userID, documentID, withdrawn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      consents,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *UserConsentHandler) GetConsent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consent ID"})
		return
	}

	consent, err := h.service.GetConsent(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, consent)
}

func (h *UserConsentHandler) DeleteConsent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consent ID"})
		return
	}

	if err := h.service.DeleteConsent(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserConsentHandler) WithdrawConsent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consent ID"})
		return
	}

	var req models.WithdrawConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.WithdrawConsent(c.Request.Context(), id, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "consent withdrawn successfully"})
}

func (h *UserConsentHandler) RenewConsent(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consent ID"})
		return
	}

	if err := h.service.RenewConsent(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "consent renewed successfully"})
}

func (h *UserConsentHandler) ListConsentsByUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	consents, err := h.service.ListConsentsByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": consents})
}

func (h *UserConsentHandler) ListConsentsByDocument(c *gin.Context) {
	documentID, err := uuid.Parse(c.Param("document_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	consents, err := h.service.ListConsentsByDocument(c.Request.Context(), documentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": consents})
}

func (h *UserConsentHandler) GetLatestConsent(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	documentID, err := uuid.Parse(c.Param("document_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	consent, err := h.service.GetLatestConsent(c.Request.Context(), userID, documentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, consent)
}

func (h *UserConsentHandler) GetExpiredConsents(c *gin.Context) {
	consents, err := h.service.GetExpiredConsents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": consents})
}
