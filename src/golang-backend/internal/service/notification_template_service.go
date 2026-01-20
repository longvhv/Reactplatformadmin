package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type NotificationTemplateService interface {
	CreateTemplate(ctx context.Context, req *models.CreateNotificationTemplateRequest) (*models.NotificationTemplate, error)
	GetTemplate(ctx context.Context, id uuid.UUID) (*models.NotificationTemplate, error)
	GetTemplateByCode(ctx context.Context, code string) (*models.NotificationTemplate, error)
	ListTemplates(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, notificationType, status, category *string) ([]*models.NotificationTemplate, int, error)
	ListTemplatesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error)
	ListTemplatesByType(ctx context.Context, notificationType string) ([]*models.NotificationTemplate, error)
	ListTemplatesByCategory(ctx context.Context, category string) ([]*models.NotificationTemplate, error)
	ListActiveTemplates(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error)
	UpdateTemplate(ctx context.Context, id uuid.UUID, req *models.UpdateNotificationTemplateRequest) (*models.NotificationTemplate, error)
	DeleteTemplate(ctx context.Context, id uuid.UUID) error
	SoftDeleteTemplate(ctx context.Context, id uuid.UUID, deletedBy string) error
	IncrementUsageCount(ctx context.Context, id uuid.UUID) error
	UpdateStats(ctx context.Context, id uuid.UUID, success bool) error
}

type notificationTemplateService struct {
	repo repository.NotificationTemplateRepository
}

func NewNotificationTemplateService(repo repository.NotificationTemplateRepository) NotificationTemplateService {
	return &notificationTemplateService{repo: repo}
}

func (s *notificationTemplateService) CreateTemplate(ctx context.Context, req *models.CreateNotificationTemplateRequest) (*models.NotificationTemplate, error) {
	now := time.Now()
	template := &models.NotificationTemplate{
		ID:               uuid.New(),
		TenantID:         req.TenantID,
		TemplateCode:     req.TemplateCode,
		TemplateName:     req.TemplateName,
		NotificationType: req.NotificationType,
		Priority:         "normal",
		LanguageCode:     "vi",
		SendImmediately:  req.SendImmediately,
		Status:           "active",
		IsSystemTemplate: false,
		IsEditable:       true,
		UsageCount:       0,
		SuccessCount:     0,
		FailureCount:     0,
		Version:          1,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if req.Description != "" {
		template.Description.String = req.Description
		template.Description.Valid = true
	}

	if req.Subject != "" {
		template.Subject.String = req.Subject
		template.Subject.Valid = true
	}

	if req.BodyText != "" {
		template.BodyText.String = req.BodyText
		template.BodyText.Valid = true
	}

	if req.BodyHTML != "" {
		template.BodyHTML.String = req.BodyHTML
		template.BodyHTML.Valid = true
	}

	if req.Category != "" {
		template.Category.String = req.Category
		template.Category.Valid = true
	}

	if req.Priority != "" {
		template.Priority = req.Priority
	}

	if req.LanguageCode != "" {
		template.LanguageCode = req.LanguageCode
	}

	if req.ScheduledSendTime != "" {
		template.ScheduledSendTime.String = req.ScheduledSendTime
		template.ScheduledSendTime.Valid = true
	}

	if req.ParentTemplateID != nil {
		template.ParentTemplateID.String = req.ParentTemplateID.String()
		template.ParentTemplateID.Valid = true
	}

	if req.CreatedBy != "" {
		template.CreatedBy.String = req.CreatedBy
		template.CreatedBy.Valid = true
	}

	// Set variables
	if req.Variables != nil {
		variablesJSON, err := json.Marshal(req.Variables)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal variables: %w", err)
		}
		template.Variables = variablesJSON
	} else {
		template.Variables = []byte("[]")
	}

	// Set sample data
	if req.SampleData != nil {
		sampleDataJSON, err := json.Marshal(req.SampleData)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal sample_data: %w", err)
		}
		template.SampleData = sampleDataJSON
	}

	// Set delivery channels
	if req.DeliveryChannels != nil {
		template.DeliveryChannels = pq.StringArray(req.DeliveryChannels)
	} else {
		template.DeliveryChannels = pq.StringArray{"email"}
	}

	// Set attachments
	if req.Attachments != nil {
		attachmentsJSON, err := json.Marshal(req.Attachments)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal attachments: %w", err)
		}
		template.Attachments = attachmentsJSON
	}

	// Set headers
	if req.Headers != nil {
		headersJSON, err := json.Marshal(req.Headers)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal headers: %w", err)
		}
		template.Headers = headersJSON
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		template.Metadata = metadataJSON
	}

	// Set tags
	if req.Tags != nil {
		template.Tags = pq.StringArray(req.Tags)
	}

	if err := s.repo.Create(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to create notification template: %w", err)
	}

	return template, nil
}

func (s *notificationTemplateService) GetTemplate(ctx context.Context, id uuid.UUID) (*models.NotificationTemplate, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *notificationTemplateService) GetTemplateByCode(ctx context.Context, code string) (*models.NotificationTemplate, error) {
	return s.repo.GetByCode(ctx, code)
}

func (s *notificationTemplateService) ListTemplates(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, notificationType, status, category *string) ([]*models.NotificationTemplate, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, notificationType, status, category)
}

func (s *notificationTemplateService) ListTemplatesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *notificationTemplateService) ListTemplatesByType(ctx context.Context, notificationType string) ([]*models.NotificationTemplate, error) {
	return s.repo.ListByType(ctx, notificationType)
}

func (s *notificationTemplateService) ListTemplatesByCategory(ctx context.Context, category string) ([]*models.NotificationTemplate, error) {
	return s.repo.ListByCategory(ctx, category)
}

func (s *notificationTemplateService) ListActiveTemplates(ctx context.Context, tenantID uuid.UUID) ([]*models.NotificationTemplate, error) {
	return s.repo.ListActive(ctx, tenantID)
}

func (s *notificationTemplateService) UpdateTemplate(ctx context.Context, id uuid.UUID, req *models.UpdateNotificationTemplateRequest) (*models.NotificationTemplate, error) {
	template, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.TemplateName != nil {
		template.TemplateName = *req.TemplateName
	}

	if req.Description != nil {
		if *req.Description == "" {
			template.Description.Valid = false
		} else {
			template.Description.String = *req.Description
			template.Description.Valid = true
		}
	}

	if req.Subject != nil {
		if *req.Subject == "" {
			template.Subject.Valid = false
		} else {
			template.Subject.String = *req.Subject
			template.Subject.Valid = true
		}
	}

	if req.BodyText != nil {
		if *req.BodyText == "" {
			template.BodyText.Valid = false
		} else {
			template.BodyText.String = *req.BodyText
			template.BodyText.Valid = true
		}
	}

	if req.BodyHTML != nil {
		if *req.BodyHTML == "" {
			template.BodyHTML.Valid = false
		} else {
			template.BodyHTML.String = *req.BodyHTML
			template.BodyHTML.Valid = true
		}
	}

	if req.Category != nil {
		if *req.Category == "" {
			template.Category.Valid = false
		} else {
			template.Category.String = *req.Category
			template.Category.Valid = true
		}
	}

	if req.Priority != nil {
		template.Priority = *req.Priority
	}

	if req.LanguageCode != nil {
		template.LanguageCode = *req.LanguageCode
	}

	if req.SendImmediately != nil {
		template.SendImmediately = *req.SendImmediately
	}

	if req.ScheduledSendTime != nil {
		if *req.ScheduledSendTime == "" {
			template.ScheduledSendTime.Valid = false
		} else {
			template.ScheduledSendTime.String = *req.ScheduledSendTime
			template.ScheduledSendTime.Valid = true
		}
	}

	if req.Status != nil {
		template.Status = *req.Status
	}

	if req.Variables != nil {
		variablesJSON, err := json.Marshal(*req.Variables)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal variables: %w", err)
		}
		template.Variables = variablesJSON
	}

	if req.SampleData != nil {
		sampleDataJSON, err := json.Marshal(*req.SampleData)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal sample_data: %w", err)
		}
		template.SampleData = sampleDataJSON
	}

	if req.DeliveryChannels != nil {
		template.DeliveryChannels = pq.StringArray(*req.DeliveryChannels)
	}

	if req.Attachments != nil {
		attachmentsJSON, err := json.Marshal(*req.Attachments)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal attachments: %w", err)
		}
		template.Attachments = attachmentsJSON
	}

	if req.Headers != nil {
		headersJSON, err := json.Marshal(*req.Headers)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal headers: %w", err)
		}
		template.Headers = headersJSON
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		template.Metadata = metadataJSON
	}

	if req.Tags != nil {
		template.Tags = pq.StringArray(*req.Tags)
	}

	if req.UpdatedBy != nil {
		template.UpdatedBy.String = *req.UpdatedBy
		template.UpdatedBy.Valid = true
	}

	template.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to update notification template: %w", err)
	}

	return template, nil
}

func (s *notificationTemplateService) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *notificationTemplateService) SoftDeleteTemplate(ctx context.Context, id uuid.UUID, deletedBy string) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}

func (s *notificationTemplateService) IncrementUsageCount(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementUsageCount(ctx, id)
}

func (s *notificationTemplateService) UpdateStats(ctx context.Context, id uuid.UUID, success bool) error {
	return s.repo.UpdateStats(ctx, id, success)
}
