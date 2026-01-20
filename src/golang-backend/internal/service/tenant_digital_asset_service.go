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

type TenantDigitalAssetService interface {
	CreateAsset(ctx context.Context, req *models.CreateTenantDigitalAssetRequest) (*models.TenantDigitalAsset, error)
	GetAsset(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error)
	ListAssets(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, assetType, status *string) ([]*models.TenantDigitalAsset, int, error)
	ListAssetsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error)
	ListAssetsByOrder(ctx context.Context, orderID uuid.UUID) ([]*models.TenantDigitalAsset, error)
	ListAssetsByType(ctx context.Context, assetType string) ([]*models.TenantDigitalAsset, error)
	ListActiveAssets(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error)
	ListExpiringAssets(ctx context.Context, daysAhead int) ([]*models.TenantDigitalAsset, error)
	UpdateAsset(ctx context.Context, id uuid.UUID, req *models.UpdateTenantDigitalAssetRequest) (*models.TenantDigitalAsset, error)
	ActivateAsset(ctx context.Context, id uuid.UUID) error
	SuspendAsset(ctx context.Context, id uuid.UUID) error
	ExpireAsset(ctx context.Context, id uuid.UUID) error
	UpdateAssetStatus(ctx context.Context, id uuid.UUID, status string) error
	DeleteAsset(ctx context.Context, id uuid.UUID) error
}

type tenantDigitalAssetService struct {
	repo repository.TenantDigitalAssetRepository
}

func NewTenantDigitalAssetService(repo repository.TenantDigitalAssetRepository) TenantDigitalAssetService {
	return &tenantDigitalAssetService{repo: repo}
}

func (s *tenantDigitalAssetService) CreateAsset(ctx context.Context, req *models.CreateTenantDigitalAssetRequest) (*models.TenantDigitalAsset, error) {
	now := time.Now()
	asset := &models.TenantDigitalAsset{
		ID:        uuid.New(),
		TenantID:  req.TenantID,
		AssetType: req.AssetType,
		Name:      req.Name,
		Status:    "PENDING",
		AutoRenew: req.AutoRenew,
		CreatedAt: now,
		UpdatedAt: now,
		Version:   1,
	}

	if req.OrderID != nil {
		asset.OrderID.String = req.OrderID.String()
		asset.OrderID.Valid = true
	}

	if req.ExpiresAt != nil {
		asset.ExpiresAt.Time = *req.ExpiresAt
		asset.ExpiresAt.Valid = true
	}

	// Set asset metadata
	if req.AssetMetadata != nil {
		metadataJSON, err := json.Marshal(req.AssetMetadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal asset_metadata: %w", err)
		}
		asset.AssetMetadata = metadataJSON
	} else {
		asset.AssetMetadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to create digital asset: %w", err)
	}

	return asset, nil
}

func (s *tenantDigitalAssetService) GetAsset(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *tenantDigitalAssetService) ListAssets(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, assetType, status *string) ([]*models.TenantDigitalAsset, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, assetType, status)
}

func (s *tenantDigitalAssetService) ListAssetsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *tenantDigitalAssetService) ListAssetsByOrder(ctx context.Context, orderID uuid.UUID) ([]*models.TenantDigitalAsset, error) {
	return s.repo.ListByOrderID(ctx, orderID)
}

func (s *tenantDigitalAssetService) ListAssetsByType(ctx context.Context, assetType string) ([]*models.TenantDigitalAsset, error) {
	return s.repo.ListByAssetType(ctx, assetType)
}

func (s *tenantDigitalAssetService) ListActiveAssets(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error) {
	return s.repo.ListActiveAssets(ctx, tenantID)
}

func (s *tenantDigitalAssetService) ListExpiringAssets(ctx context.Context, daysAhead int) ([]*models.TenantDigitalAsset, error) {
	if daysAhead <= 0 {
		daysAhead = 30 // Default to 30 days
	}

	beforeDate := time.Now().AddDate(0, 0, daysAhead)
	return s.repo.ListExpiringAssets(ctx, beforeDate)
}

func (s *tenantDigitalAssetService) UpdateAsset(ctx context.Context, id uuid.UUID, req *models.UpdateTenantDigitalAssetRequest) (*models.TenantDigitalAsset, error) {
	asset, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		asset.Name = *req.Name
	}

	if req.Status != nil {
		asset.Status = *req.Status
	}

	if req.AutoRenew != nil {
		asset.AutoRenew = *req.AutoRenew
	}

	if req.ExpiresAt != nil {
		asset.ExpiresAt.Time = *req.ExpiresAt
		asset.ExpiresAt.Valid = true
	}

	if req.AssetMetadata != nil {
		metadataJSON, err := json.Marshal(*req.AssetMetadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal asset_metadata: %w", err)
		}
		asset.AssetMetadata = metadataJSON
	}

	asset.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to update digital asset: %w", err)
	}

	return asset, nil
}

func (s *tenantDigitalAssetService) ActivateAsset(ctx context.Context, id uuid.UUID) error {
	return s.repo.Activate(ctx, id)
}

func (s *tenantDigitalAssetService) SuspendAsset(ctx context.Context, id uuid.UUID) error {
	return s.repo.Suspend(ctx, id)
}

func (s *tenantDigitalAssetService) ExpireAsset(ctx context.Context, id uuid.UUID) error {
	return s.repo.Expire(ctx, id)
}

func (s *tenantDigitalAssetService) UpdateAssetStatus(ctx context.Context, id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *tenantDigitalAssetService) DeleteAsset(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
