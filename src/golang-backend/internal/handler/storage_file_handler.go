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

type StorageFileHandler struct {
	storageService *service.StorageFileService
	authzService   *service.AuthorizationService
}

func NewStorageFileHandler(storageService *service.StorageFileService, authzService *service.AuthorizationService) *StorageFileHandler {
	return &StorageFileHandler{
		storageService: storageService,
		authzService:   authzService,
	}
}

// List lists storage files
func (h *StorageFileHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	category := c.Query("category")
	parentID := c.Query("parent_id")

	var parentUUID *uuid.UUID
	if parentID != "" {
		parsed, err := uuid.Parse(parentID)
		if err == nil {
			parentUUID = &parsed
		}
	}

	files, total, err := h.storageService.ListByTenant(ctx, tenantID, category, parentUUID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, files, total, page, limit)
}

// GetByID gets file by ID
func (h *StorageFileHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	file, err := h.storageService.GetByID(ctx, fileID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "file not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, file)
}

// Upload uploads a file
func (h *StorageFileHandler) Upload(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.UploadFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UploadedBy = userID

	file, err := h.storageService.UploadFile(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, file)
}

// CreateFolder creates a folder
func (h *StorageFileHandler) CreateFolder(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UploadedBy = userID

	folder, err := h.storageService.CreateFolder(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, folder)
}

// Update updates a file
func (h *StorageFileHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	var req service.UpdateStorageFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	file, err := h.storageService.UpdateFile(ctx, fileID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, file)
}

// Delete deletes a file
func (h *StorageFileHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	if err := h.storageService.DeleteFile(ctx, fileID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "file deleted successfully"})
}

// Move moves a file to another folder
func (h *StorageFileHandler) Move(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	var req struct {
		ParentID *uuid.UUID `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	file, err := h.storageService.MoveFile(ctx, fileID, req.ParentID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, file)
}

// GetPublicURL gets public URL for a file
func (h *StorageFileHandler) GetPublicURL(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	url, err := h.storageService.GetPublicURL(ctx, fileID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"public_url": url})
}
