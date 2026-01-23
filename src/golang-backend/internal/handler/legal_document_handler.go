package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type LegalDocumentHandler struct {
	docService   *service.LegalDocumentService
	authzService *service.AuthorizationService
}

func NewLegalDocumentHandler(docService *service.LegalDocumentService, authzService *service.AuthorizationService) *LegalDocumentHandler {
	return &LegalDocumentHandler{
		docService:   docService,
		authzService: authzService,
	}
}

// List lists legal documents
func (h *LegalDocumentHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	docType := c.Query("type")
	status := c.Query("status")

	var tenantID *uuid.UUID
	if tid, ok := contextutil.GetTenantID(ctx); ok {
		tenantID = &tid
	}

	docs, total, err := h.docService.ListDocuments(ctx, tenantID, docType, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, docs, total, page, limit)
}

// GetByID gets document by ID
func (h *LegalDocumentHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid document id", nil)
		return
	}

	doc, err := h.docService.GetByID(ctx, docID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "document not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, doc)
}

// GetBySlug gets document by slug
func (h *LegalDocumentHandler) GetBySlug(c *gin.Context) {
	ctx := c.Request.Context()

	slug := c.Param("slug")
	if slug == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "slug required", nil)
		return
	}

	doc, err := h.docService.GetBySlug(ctx, slug)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "document not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, doc)
}

// GetLatestByType gets latest document by type
func (h *LegalDocumentHandler) GetLatestByType(c *gin.Context) {
	ctx := c.Request.Context()

	docType := c.Param("type")
	if docType == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "type required", nil)
		return
	}

	doc, err := h.docService.GetLatestByType(ctx, docType)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "document not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, doc)
}

// Create creates a document
func (h *LegalDocumentHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateLegalDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	doc, err := h.docService.CreateDocument(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, doc)
}

// Update updates a document
func (h *LegalDocumentHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid document id", nil)
		return
	}

	var req service.UpdateLegalDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	doc, err := h.docService.UpdateDocument(ctx, docID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, doc)
}

// Delete deletes a document
func (h *LegalDocumentHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid document id", nil)
		return
	}

	if err := h.docService.DeleteDocument(ctx, docID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "document deleted successfully"})
}

// Publish publishes a document
func (h *LegalDocumentHandler) Publish(c *gin.Context) {
	ctx := c.Request.Context()

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid document id", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)

	doc, err := h.docService.PublishDocument(ctx, docID, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, doc)
}

// Archive archives a document
func (h *LegalDocumentHandler) Archive(c *gin.Context) {
	ctx := c.Request.Context()

	docID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid document id", nil)
		return
	}

	doc, err := h.docService.ArchiveDocument(ctx, docID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, doc)
}

// RecordConsent records user consent
func (h *LegalDocumentHandler) RecordConsent(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateUserConsentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	consent, err := h.docService.RecordConsent(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, consent)
}

// GetUserConsents gets user consents
func (h *LegalDocumentHandler) GetUserConsents(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid user id", nil)
		return
	}

	consents, err := h.docService.GetUserConsents(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, consents)
}
