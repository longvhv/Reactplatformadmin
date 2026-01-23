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

type FileUploadHandler struct {
	fileService  *service.FileUploadService
	authzService *service.AuthorizationService
}

func NewFileUploadHandler(fileService *service.FileUploadService, authzService *service.AuthorizationService) *FileUploadHandler {
	return &FileUploadHandler{
		fileService:  fileService,
		authzService: authzService,
	}
}

// Upload uploads a file
func (h *FileUploadHandler) Upload(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	tenantID, _ := contextutil.GetTenantID(ctx)

	file, err := c.FormFile("file")
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "file is required", nil)
		return
	}

	category := c.PostForm("category")
	description := c.PostForm("description")
	isPublic := c.PostForm("is_public") == "true"

	uploadedFile, err := h.fileService.UploadFile(ctx, service.UploadFileRequest{
		TenantID:    tenantID,
		UploadedBy:  userID,
		File:        file,
		Category:    category,
		Description: description,
		IsPublic:    isPublic,
	})

	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, uploadedFile)
}

// List lists files
func (h *FileUploadHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	category := c.Query("category")
	fileType := c.Query("file_type")

	files, total, err := h.fileService.ListFiles(ctx, tenantID, category, fileType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, files, total, page, limit)
}

// GetByID gets file by ID
func (h *FileUploadHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	file, err := h.fileService.GetByID(ctx, fileID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "file not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, file)
}

// Download downloads a file
func (h *FileUploadHandler) Download(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	fileData, fileName, err := h.fileService.DownloadFile(ctx, fileID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, err.Error(), nil)
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, "application/octet-stream", fileData)
}

// Update updates file metadata
func (h *FileUploadHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	var req service.UpdateFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	file, err := h.fileService.UpdateFile(ctx, fileID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, file)
}

// Delete deletes a file
func (h *FileUploadHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	if err := h.fileService.DeleteFile(ctx, fileID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "file deleted successfully"})
}

// GetPublicURL gets public URL for file
func (h *FileUploadHandler) GetPublicURL(c *gin.Context) {
	ctx := c.Request.Context()

	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid file id", nil)
		return
	}

	expiresIn := 3600 // 1 hour default
	if exp := c.Query("expires_in"); exp != "" {
		if parsed, err := strconv.Atoi(exp); err == nil {
			expiresIn = parsed
		}
	}

	url, err := h.fileService.GetPublicURL(ctx, fileID, expiresIn)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"url":        url,
		"expires_in": expiresIn,
	})
}

// GetStats gets file statistics
func (h *FileUploadHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	stats, err := h.fileService.GetStats(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, stats)
}
