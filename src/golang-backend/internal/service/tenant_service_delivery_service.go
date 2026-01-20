package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type TenantServiceDeliveryService interface {
	CreateDelivery(ctx context.Context, req *models.CreateTenantServiceDeliveryRequest) (*models.TenantServiceDelivery, error)
	GetDelivery(ctx context.Context, id uuid.UUID) (*models.TenantServiceDelivery, error)
	ListDeliveries(ctx context.Context, page, pageSize int, tenantID, productID *uuid.UUID, status *string) ([]*models.TenantServiceDelivery, int, error)
	ListDeliveriesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantServiceDelivery, error)
	ListDeliveriesBySubscription(ctx context.Context, subscriptionID uuid.UUID) ([]*models.TenantServiceDelivery, error)
	UpdateDelivery(ctx context.Context, id uuid.UUID, req *models.UpdateTenantServiceDeliveryRequest) (*models.TenantServiceDelivery, error)
	UpdateProgress(ctx context.Context, id uuid.UUID, req *models.UpdateDeliveryProgressRequest) error
	DeleteDelivery(ctx context.Context, id uuid.UUID) error
}

type tenantServiceDeliveryService struct {
	repo repository.TenantServiceDeliveryRepository
}

func NewTenantServiceDeliveryService(repo repository.TenantServiceDeliveryRepository) TenantServiceDeliveryService {
	return &tenantServiceDeliveryService{repo: repo}
}

func (s *tenantServiceDeliveryService) CreateDelivery(ctx context.Context, req *models.CreateTenantServiceDeliveryRequest) (*models.TenantServiceDelivery, error) {
	currencyCode := "VND"
	if req.CurrencyCode != "" {
		currencyCode = req.CurrencyCode
	}

	delivery := &models.TenantServiceDelivery{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		ProductID:       req.ProductID,
		SubscriptionID:  req.SubscriptionID,
		UnitType:        req.UnitType,
		TotalUnits:      req.TotalUnits,
		DeliveredUnits:  0,
		UnitPrice:       req.UnitPrice,
		CurrencyCode:    currencyCode,
		Status:          "PENDING",
		ServiceMetadata: req.ServiceMetadata,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	err := s.repo.Create(ctx, delivery)
	if err != nil {
		return nil, err
	}
	return delivery, nil
}

func (s *tenantServiceDeliveryService) GetDelivery(ctx context.Context, id uuid.UUID) (*models.TenantServiceDelivery, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *tenantServiceDeliveryService) ListDeliveries(ctx context.Context, page, pageSize int, tenantID, productID *uuid.UUID, status *string) ([]*models.TenantServiceDelivery, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, productID, status)
}

func (s *tenantServiceDeliveryService) ListDeliveriesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantServiceDelivery, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *tenantServiceDeliveryService) ListDeliveriesBySubscription(ctx context.Context, subscriptionID uuid.UUID) ([]*models.TenantServiceDelivery, error) {
	return s.repo.ListBySubscription(ctx, subscriptionID)
}

func (s *tenantServiceDeliveryService) UpdateDelivery(ctx context.Context, id uuid.UUID, req *models.UpdateTenantServiceDeliveryRequest) (*models.TenantServiceDelivery, error) {
	delivery, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.DeliveredUnits != nil {
		delivery.DeliveredUnits = *req.DeliveredUnits
	}
	if req.Status != nil {
		delivery.Status = *req.Status
	}
	if req.ServiceMetadata != nil {
		delivery.ServiceMetadata = req.ServiceMetadata
	}

	err = s.repo.Update(ctx, delivery)
	if err != nil {
		return nil, err
	}
	return delivery, nil
}

func (s *tenantServiceDeliveryService) UpdateProgress(ctx context.Context, id uuid.UUID, req *models.UpdateDeliveryProgressRequest) error {
	return s.repo.UpdateProgress(ctx, id, req.DeliveredUnits)
}

func (s *tenantServiceDeliveryService) DeleteDelivery(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
