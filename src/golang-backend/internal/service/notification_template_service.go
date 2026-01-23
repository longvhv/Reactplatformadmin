package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type NotificationTemplateService struct {
	templateRepo repository.NotificationTemplateRepository
}

func NewNotificationTemplateService(templateRepo repository.NotificationTemplateRepository) *NotificationTemplateService {
	return &NotificationTemplateService{
		templateRepo: templateRepo,
	}
}

type CreateNotificationTemplateRequest struct {
	TenantID           uuid.UUID              `json:"tenant_id" binding:"required"`
	TemplateCode       string                 `json:"template_code" binding:"required"`
	TemplateName       string                 `json:"template_name" binding:"required"`
	Description        *string                `json:"description"`
	Channel            string                 `json:"channel" binding:"required"`
	Subject            *string                `json:"subject"`
	BodyTemplate       string                 `json:"body_template" binding:"required"`
	SMSTemplate        *string                `json:"sms_template"`
	PushTemplate       *string                `json:"push_template"`
	Language           string                 `json:"language"`
	Variables          []string               `json:"variables"`
	DefaultValues      map[string]interface{} `json:"default_values"`
	LayoutTemplate     *string                `json:"layout_template"`
	SenderName         *string                `json:"sender_name"`
	SenderEmail        *string                `json:"sender_email"`
	ReplyTo            *string                `json:"reply_to"`
	CCRecipients       []string               `json:"cc_recipients"`
	BCCRecipients      []string               `json:"bcc_recipients"`
	Priority           string                 `json:"priority"`
	Category           *string                `json:"category"`
	Tags               []string               `json:"tags"`
	ParentTemplateID   *uuid.UUID             `json:"parent_template_id"`
	VersionNumber      int                    `json:"version_number"`
	IsActive           bool                   `json:"is_active"`
	Metadata           map[string]interface{} `json:"metadata"`
	CreatedBy          string                 `json:"-"`
}

type UpdateNotificationTemplateRequest struct {
	TemplateName    *string                `json:"template_name"`
	Description     *string                `json:"description"`
	Subject         *string                `json:"subject"`
	BodyTemplate    *string                `json:"body_template"`
	SMSTemplate     *string                `json:"sms_template"`
	PushTemplate    *string                `json:"push_template"`
	Variables       []string               `json:"variables"`
	DefaultValues   map[string]interface{} `json:"default_values"`
	LayoutTemplate  *string                `json:"layout_template"`
	SenderName      *string                `json:"sender_name"`
	SenderEmail     *string                `json:"sender_email"`
	ReplyTo         *string                `json:"reply_to"`
	CCRecipients    []string               `json:"cc_recipients"`
	BCCRecipients   []string               `json:"bcc_recipients"`
	Priority        *string                `json:"priority"`
	Category        *string                `json:"category"`
	Tags            []string               `json:"tags"`
	IsActive        *bool                  `json:"is_active"`
	Metadata        map[string]interface{} `json:"metadata"`
	UpdatedBy       string                 `json:"-"`
}

// GetByID gets template by ID
func (s *NotificationTemplateService) GetByID(ctx context.Context, id uuid.UUID) (*models.NotificationTemplate, error) {
	return s.templateRepo.GetByID(ctx, id)
}

// GetByCode gets template by code
func (s *NotificationTemplateService) GetByCode(ctx context.Context, code string) (*models.NotificationTemplate, error) {
	return s.templateRepo.GetByCode(ctx, code)
}

// ListByTenant lists templates by tenant
func (s *NotificationTemplateService) ListByTenant(ctx context.Context, tenantID uuid.UUID, channel string, page, limit int) ([]*models.NotificationTemplate, int64, error) {
	offset := (page - 1) * limit
	return s.templateRepo.ListByTenant(ctx, tenantID, channel, limit, offset)
}

// CreateTemplate creates a new template
func (s *NotificationTemplateService) CreateTemplate(ctx context.Context, req CreateNotificationTemplateRequest) (*models.NotificationTemplate, error) {
	// Check if code exists
	existing, err := s.templateRepo.GetByCode(ctx, req.TemplateCode)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("template code already exists")
	}

	// Validate channel
	validChannels := []string{"EMAIL", "SMS", "PUSH", "IN_APP", "WEBHOOK", "SLACK", "TEAMS"}
	if !containsStr(validChannels, req.Channel) {
		return nil, fmt.Errorf("invalid channel, must be one of: %v", validChannels)
	}

	language := req.Language
	if language == "" {
		language = "vi-VN"
	}

	priority := req.Priority
	if priority == "" {
		priority = "normal"
	}

	versionNumber := req.VersionNumber
	if versionNumber == 0 {
		versionNumber = 1
	}

	variables := req.Variables
	if variables == nil {
		variables = []string{}
	}

	defaultValues := req.DefaultValues
	if defaultValues == nil {
		defaultValues = make(map[string]interface{})
	}

	ccRecipients := req.CCRecipients
	if ccRecipients == nil {
		ccRecipients = []string{}
	}

	bccRecipients := req.BCCRecipients
	if bccRecipients == nil {
		bccRecipients = []string{}
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	template := &models.NotificationTemplate{
		ID:               uuid.New(),
		TenantID:         req.TenantID,
		TemplateCode:     req.TemplateCode,
		TemplateName:     req.TemplateName,
		Description:      req.Description,
		Channel:          req.Channel,
		Subject:          req.Subject,
		BodyTemplate:     req.BodyTemplate,
		SMSTemplate:      req.SMSTemplate,
		PushTemplate:     req.PushTemplate,
		Language:         language,
		Variables:        variables,
		DefaultValues:    defaultValues,
		LayoutTemplate:   req.LayoutTemplate,
		SenderName:       req.SenderName,
		SenderEmail:      req.SenderEmail,
		ReplyTo:          req.ReplyTo,
		CCRecipients:     ccRecipients,
		BCCRecipients:    bccRecipients,
		Priority:         priority,
		Category:         req.Category,
		Tags:             tags,
		ParentTemplateID: req.ParentTemplateID,
		VersionNumber:    versionNumber,
		IsActive:         req.IsActive,
		Metadata:         metadata,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		CreatedBy:        &req.CreatedBy,
	}

	if err := s.templateRepo.Create(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to create template: %w", err)
	}

	return template, nil
}

// UpdateTemplate updates a template
func (s *NotificationTemplateService) UpdateTemplate(ctx context.Context, id uuid.UUID, req UpdateNotificationTemplateRequest) (*models.NotificationTemplate, error) {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	if req.TemplateName != nil {
		template.TemplateName = *req.TemplateName
	}
	if req.Description != nil {
		template.Description = req.Description
	}
	if req.Subject != nil {
		template.Subject = req.Subject
	}
	if req.BodyTemplate != nil {
		template.BodyTemplate = *req.BodyTemplate
	}
	if req.SMSTemplate != nil {
		template.SMSTemplate = req.SMSTemplate
	}
	if req.PushTemplate != nil {
		template.PushTemplate = req.PushTemplate
	}
	if req.Variables != nil {
		template.Variables = req.Variables
	}
	if req.DefaultValues != nil {
		template.DefaultValues = req.DefaultValues
	}
	if req.LayoutTemplate != nil {
		template.LayoutTemplate = req.LayoutTemplate
	}
	if req.SenderName != nil {
		template.SenderName = req.SenderName
	}
	if req.SenderEmail != nil {
		template.SenderEmail = req.SenderEmail
	}
	if req.ReplyTo != nil {
		template.ReplyTo = req.ReplyTo
	}
	if req.CCRecipients != nil {
		template.CCRecipients = req.CCRecipients
	}
	if req.BCCRecipients != nil {
		template.BCCRecipients = req.BCCRecipients
	}
	if req.Priority != nil {
		template.Priority = *req.Priority
	}
	if req.Category != nil {
		template.Category = req.Category
	}
	if req.Tags != nil {
		template.Tags = req.Tags
	}
	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}
	if req.Metadata != nil {
		template.Metadata = req.Metadata
	}

	template.UpdatedAt = time.Now()
	template.UpdatedBy = &req.UpdatedBy

	if err := s.templateRepo.Update(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to update template: %w", err)
	}

	return template, nil
}

// DeleteTemplate deletes a template
func (s *NotificationTemplateService) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return s.templateRepo.Delete(ctx, id)
}

// RenderTemplate renders a template with variables
func (s *NotificationTemplateService) RenderTemplate(ctx context.Context, code string, variables map[string]interface{}, language string) (map[string]interface{}, error) {
	template, err := s.templateRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	if !template.IsActive {
		return nil, fmt.Errorf("template is not active")
	}

	// Merge default values with provided variables
	mergedVars := make(map[string]interface{})
	for k, v := range template.DefaultValues {
		mergedVars[k] = v
	}
	for k, v := range variables {
		mergedVars[k] = v
	}

	// Render body
	body := s.renderString(template.BodyTemplate, mergedVars)

	// Render subject if exists
	var subject string
	if template.Subject != nil {
		subject = s.renderString(*template.Subject, mergedVars)
	}

	// Render SMS template if exists
	var sms string
	if template.SMSTemplate != nil {
		sms = s.renderString(*template.SMSTemplate, mergedVars)
	}

	// Render push template if exists
	var push string
	if template.PushTemplate != nil {
		push = s.renderString(*template.PushTemplate, mergedVars)
	}

	result := map[string]interface{}{
		"template_code": template.TemplateCode,
		"channel":       template.Channel,
		"subject":       subject,
		"body":          body,
		"sms":           sms,
		"push":          push,
		"sender_name":   template.SenderName,
		"sender_email":  template.SenderEmail,
		"reply_to":      template.ReplyTo,
		"cc_recipients": template.CCRecipients,
		"bcc_recipients": template.BCCRecipients,
		"priority":      template.Priority,
	}

	return result, nil
}

// PreviewTemplate previews a template
func (s *NotificationTemplateService) PreviewTemplate(ctx context.Context, id uuid.UUID, variables map[string]interface{}) (map[string]interface{}, error) {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	return s.RenderTemplate(ctx, template.TemplateCode, variables, template.Language)
}

// CloneTemplate clones a template
func (s *NotificationTemplateService) CloneTemplate(ctx context.Context, id uuid.UUID, newCode, newName, createdBy string) (*models.NotificationTemplate, error) {
	original, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	// Check if new code exists
	existing, err := s.templateRepo.GetByCode(ctx, newCode)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("template code already exists")
	}

	clone := &models.NotificationTemplate{
		ID:               uuid.New(),
		TenantID:         original.TenantID,
		TemplateCode:     newCode,
		TemplateName:     newName,
		Description:      original.Description,
		Channel:          original.Channel,
		Subject:          original.Subject,
		BodyTemplate:     original.BodyTemplate,
		SMSTemplate:      original.SMSTemplate,
		PushTemplate:     original.PushTemplate,
		Language:         original.Language,
		Variables:        original.Variables,
		DefaultValues:    original.DefaultValues,
		LayoutTemplate:   original.LayoutTemplate,
		SenderName:       original.SenderName,
		SenderEmail:      original.SenderEmail,
		ReplyTo:          original.ReplyTo,
		CCRecipients:     original.CCRecipients,
		BCCRecipients:    original.BCCRecipients,
		Priority:         original.Priority,
		Category:         original.Category,
		Tags:             original.Tags,
		ParentTemplateID: &original.ID,
		VersionNumber:    1,
		IsActive:         false,
		Metadata:         original.Metadata,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		CreatedBy:        &createdBy,
	}

	if err := s.templateRepo.Create(ctx, clone); err != nil {
		return nil, fmt.Errorf("failed to clone template: %w", err)
	}

	return clone, nil
}

// Helper function to render template string
func (s *NotificationTemplateService) renderString(template string, variables map[string]interface{}) string {
	result := template
	for key, value := range variables {
		placeholder := fmt.Sprintf("{{%s}}", key)
		result = strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value))
	}
	return result
}

func containsStr(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
