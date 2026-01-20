package service

import (
	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type WebhookService struct {
	repo *repository.WebhookRepository
}

func NewWebhookService(repo *repository.WebhookRepository) *WebhookService {
	return &WebhookService{repo: repo}
}

func (s *WebhookService) CreateWebhook(req *models.CreateWebhookRequest) (*models.Webhook, error) {
	webhook := &models.Webhook{
		ID:                uuid.New().String(),
		TenantID:          req.TenantID,
		Name:              req.Name,
		Description:       req.Description,
		URL:               req.URL,
		Method:            req.Method,
		EventTypes:        models.StringArray(req.EventTypes),
		EventFilter:       req.EventFilter,
		SecretKey:         generateSecretKey(),
		AuthType:          req.AuthType,
		AuthConfig:        req.AuthConfig,
		Headers:           req.Headers,
		TimeoutMs:         req.TimeoutMs,
		RetryConfig:       req.RetryConfig,
		IsActive:          req.IsActive,
		IsVerified:        false,
		VerificationToken: stringPtr(uuid.New().String()),
		SuccessCount:      0,
		FailureCount:      0,
		TotalCount:        0,
		BatchSize:         req.BatchSize,
		RateLimit:         req.RateLimit,
		Priority:          req.Priority,
		Tags:              models.StringArray(req.Tags),
		Metadata:          req.Metadata,
		CreatedBy:         req.CreatedBy,
	}

	err := s.repo.Create(webhook)
	if err != nil {
		return nil, err
	}

	return webhook, nil
}

func (s *WebhookService) GetWebhook(id string) (*models.Webhook, error) {
	return s.repo.GetByID(id)
}

func (s *WebhookService) ListWebhooks(tenantID *string, isActive *bool, page, pageSize int) ([]models.Webhook, int, error) {
	return s.repo.List(tenantID, isActive, page, pageSize)
}

func (s *WebhookService) ListWebhooksByTenant(tenantID string) ([]models.Webhook, error) {
	return s.repo.ListByTenantID(tenantID)
}

func (s *WebhookService) UpdateWebhook(id string, req *models.UpdateWebhookRequest) error {
	return s.repo.Update(id, req)
}

func (s *WebhookService) DeleteWebhook(id string) error {
	return s.repo.Delete(id)
}

func (s *WebhookService) VerifyWebhook(id string) error {
	return s.repo.VerifyWebhook(id)
}

func (s *WebhookService) UpdateStats(id string, isSuccess bool, responseTimeMs int) error {
	return s.repo.UpdateStats(id, isSuccess, responseTimeMs)
}

func generateSecretKey() *string {
	key := uuid.New().String()
	return &key
}

func stringPtr(s string) *string {
	return &s
}
