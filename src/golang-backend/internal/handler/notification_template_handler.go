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

type NotificationTemplateHandler struct {
	templateService *service.NotificationTemplateService
	authzService    *service.AuthorizationService
}

func NewNotificationTemplateHandler(templateService *service.NotificationTemplateService, authzService *service.AuthorizationService) *NotificationTemplateHandler {
	return &NotificationTemplateHandler{
		templateService: templateService,
		authzService:    authzService,
	}
}

// List lists templates
func (h *NotificationTemplateHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	channel := c.Query("channel")

	templates, total, err := h.templateService.ListByTenant(ctx, tenantID, channel, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, templates, total, page, limit)
}

// GetByID gets template by ID
func (h *NotificationTemplateHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid template id", nil)
		return
	}

	template, err := h.templateService.GetByID(ctx, templateID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "template not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, template)
}

// GetByCode gets template by code
func (h *NotificationTemplateHandler) GetByCode(c *gin.Context) {
	ctx := c.Request.Context()

	code := c.Param("code")
	if code == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "code required", nil)
		return
	}

	template, err := h.templateService.GetByCode(ctx, code)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "template not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, template)
}

// Create creates a template
func (h *NotificationTemplateHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateNotificationTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID.String()

	template, err := h.templateService.CreateTemplate(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, template)
}

// Update updates a template
func (h *NotificationTemplateHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid template id", nil)
		return
	}

	var req service.UpdateNotificationTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID.String()

	template, err := h.templateService.UpdateTemplate(ctx, templateID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, template)
}

// Delete deletes a template
func (h *NotificationTemplateHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid template id", nil)
		return
	}

	if err := h.templateService.DeleteTemplate(ctx, templateID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "template deleted successfully"})
}

// Render renders a template with variables
func (h *NotificationTemplateHandler) Render(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		TemplateCode string                 `json:"template_code" binding:"required"`
		Variables    map[string]interface{} `json:"variables"`
		Language     string                 `json:"language"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	result, err := h.templateService.RenderTemplate(ctx, req.TemplateCode, req.Variables, req.Language)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// Preview previews a template
func (h *NotificationTemplateHandler) Preview(c *gin.Context) {
	ctx := c.Request.Context()

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid template id", nil)
		return
	}

	var req struct {
		Variables map[string]interface{} `json:"variables"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	result, err := h.templateService.PreviewTemplate(ctx, templateID, req.Variables)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// Clone clones a template
func (h *NotificationTemplateHandler) Clone(c *gin.Context) {
	ctx := c.Request.Context()

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid template id", nil)
		return
	}

	var req struct {
		NewCode string `json:"new_code" binding:"required"`
		NewName string `json:"new_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)

	template, err := h.templateService.CloneTemplate(ctx, templateID, req.NewCode, req.NewName, userID.String())
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, template)
}
