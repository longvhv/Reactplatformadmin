package service

import (
	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type WebhookDeliveryLogService struct {
	repo *repository.WebhookDeliveryLogRepository
}

func NewWebhookDeliveryLogService(repo *repository.WebhookDeliveryLogRepository) *WebhookDeliveryLogService {
	return &WebhookDeliveryLogService{repo: repo}
}

func (s *WebhookDeliveryLogService) CreateLog(req *models.CreateWebhookDeliveryLogRequest) (*models.WebhookDeliveryLog, error) {
	log := &models.WebhookDeliveryLog{
		ID:            uuid.New().String(),
		TenantID:      req.TenantID,
		WebhookID:     req.WebhookID,
		EventType:     req.EventType,
		TargetURL:     req.TargetURL,
		Payload:       req.Payload,
		ResponseBody:  req.ResponseBody,
		StatusCode:    req.StatusCode,
		IsSuccess:     req.IsSuccess,
		LatencyMs:     req.LatencyMs,
		AttemptNumber: req.AttemptNumber,
	}

	err := s.repo.Create(log)
	if err != nil {
		return nil, err
	}

	return log, nil
}

func (s *WebhookDeliveryLogService) GetLog(id string) (*models.WebhookDeliveryLog, error) {
	return s.repo.GetByID(id)
}

func (s *WebhookDeliveryLogService) ListLogs(tenantID, webhookID *string, isSuccess *bool, page, pageSize int) ([]models.WebhookDeliveryLog, int, error) {
	return s.repo.List(tenantID, webhookID, isSuccess, page, pageSize)
}

func (s *WebhookDeliveryLogService) ListLogsByWebhook(webhookID string, page, pageSize int) ([]models.WebhookDeliveryLog, int, error) {
	return s.repo.ListByWebhookID(webhookID, page, pageSize)
}

func (s *WebhookDeliveryLogService) ListLogsByTenant(tenantID string, page, pageSize int) ([]models.WebhookDeliveryLog, int, error) {
	return s.repo.ListByTenantID(tenantID, page, pageSize)
}

func (s *WebhookDeliveryLogService) GetStats(webhookID string) (map[string]interface{}, error) {
	return s.repo.GetStats(webhookID)
}
