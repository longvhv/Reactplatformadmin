package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type UsageEventService interface {
	CreateEvent(ctx context.Context, req *models.CreateUsageEventRequest) (*models.UsageEvent, error)
	GetEvent(ctx context.Context, id uuid.UUID) (*models.UsageEvent, error)
	ListEvents(ctx context.Context, page, pageSize int, tenantID, subscriptionID *uuid.UUID, appCode, eventType *string, startTime, endTime *time.Time) ([]*models.UsageEvent, int, error)
	ListEventsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error)
	ListEventsBySubscription(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error)
	GetSummaryByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error)
	GetSummaryBySubscription(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error)
	GetTotalUsage(ctx context.Context, tenantID uuid.UUID, eventType string, startTime, endTime time.Time) (float64, error)
	DeleteOldEvents(ctx context.Context, retentionDays int) error
}

type usageEventService struct {
	repo repository.UsageEventRepository
}

func NewUsageEventService(repo repository.UsageEventRepository) UsageEventService {
	return &usageEventService{repo: repo}
}

func (s *usageEventService) CreateEvent(ctx context.Context, req *models.CreateUsageEventRequest) (*models.UsageEvent, error) {
	now := time.Now()
	event := &models.UsageEvent{
		ID:        uuid.New(),
		Quantity:  req.Quantity,
		Timestamp: now,
	}

	if req.TenantID != nil {
		event.TenantID.String = req.TenantID.String()
		event.TenantID.Valid = true
	}

	if req.SubscriptionID != nil {
		event.SubscriptionID.String = req.SubscriptionID.String()
		event.SubscriptionID.Valid = true
	}

	if req.AppCode != "" {
		event.AppCode.String = req.AppCode
		event.AppCode.Valid = true
	}

	if req.EventType != "" {
		event.EventType.String = req.EventType
		event.EventType.Valid = true
	}

	if req.Unit != "" {
		event.Unit.String = req.Unit
		event.Unit.Valid = true
	}

	if req.DataRegion != "" {
		event.DataRegion.String = req.DataRegion
		event.DataRegion.Valid = true
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		event.Metadata = metadataJSON
	} else {
		event.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, event); err != nil {
		return nil, fmt.Errorf("failed to create usage event: %w", err)
	}

	return event, nil
}

func (s *usageEventService) GetEvent(ctx context.Context, id uuid.UUID) (*models.UsageEvent, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *usageEventService) ListEvents(ctx context.Context, page, pageSize int, tenantID, subscriptionID *uuid.UUID, appCode, eventType *string, startTime, endTime *time.Time) ([]*models.UsageEvent, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, subscriptionID, appCode, eventType, startTime, endTime)
}

func (s *usageEventService) ListEventsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error) {
	return s.repo.ListByTenantID(ctx, tenantID, startTime, endTime)
}

func (s *usageEventService) ListEventsBySubscription(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEvent, error) {
	return s.repo.ListBySubscriptionID(ctx, subscriptionID, startTime, endTime)
}

func (s *usageEventService) GetSummaryByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error) {
	return s.repo.GetSummaryByTenant(ctx, tenantID, startTime, endTime)
}

func (s *usageEventService) GetSummaryBySubscription(ctx context.Context, subscriptionID uuid.UUID, startTime, endTime time.Time) ([]*models.UsageEventSummary, error) {
	return s.repo.GetSummaryBySubscription(ctx, subscriptionID, startTime, endTime)
}

func (s *usageEventService) GetTotalUsage(ctx context.Context, tenantID uuid.UUID, eventType string, startTime, endTime time.Time) (float64, error) {
	return s.repo.GetTotalUsage(ctx, tenantID, eventType, startTime, endTime)
}

func (s *usageEventService) DeleteOldEvents(ctx context.Context, retentionDays int) error {
	if retentionDays <= 0 {
		return fmt.Errorf("retention days must be greater than 0")
	}

	beforeDate := time.Now().AddDate(0, 0, -retentionDays)
	return s.repo.DeleteOldEvents(ctx, beforeDate)
}
