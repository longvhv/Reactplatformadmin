package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantDigitalAssetService struct {
	assetRepo repository.TenantDigitalAssetRepository
}

func NewTenantDigitalAssetService(assetRepo repository.TenantDigitalAssetRepository) *TenantDigitalAssetService {
	return &TenantDigitalAssetService{
		assetRepo: assetRepo,
	}
}

type CreateTenantDigitalAssetRequest struct {
	TenantID      uuid.UUID              `json:"tenant_id" binding:"required"`
	OrderID       *uuid.UUID             `json:"order_id"`
	AssetType     string                 `json:"asset_type" binding:"required"`
	Name          string                 `json:"name" binding:"required"`
	AutoRenew     bool                   `json:"auto_renew"`
	AssetMetadata map[string]interface{} `json:"asset_metadata"`
	ExpiresAt     *string                `json:"expires_at"`
}

type UpdateTenantDigitalAssetRequest struct {
	Name          *string                `json:"name"`
	Status        *string                `json:"status"`
	AutoRenew     *bool                  `json:"auto_renew"`
	AssetMetadata map[string]interface{} `json:"asset_metadata"`
	ExpiresAt     *string                `json:"expires_at"`
}

// GetByID gets digital asset by ID
func (s *TenantDigitalAssetService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error) {
	return s.assetRepo.GetByID(ctx, id)
}

// ListByTenant lists digital assets by tenant
func (s *TenantDigitalAssetService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status, assetType string, page, limit int) ([]*models.TenantDigitalAsset, int64, error) {
	offset := (page - 1) * limit
	return s.assetRepo.ListByTenant(ctx, tenantID, status, assetType, limit, offset)
}

// CreateAsset creates a new digital asset
func (s *TenantDigitalAssetService) CreateAsset(ctx context.Context, req CreateTenantDigitalAssetRequest) (*models.TenantDigitalAsset, error) {
	assetMetadata := req.AssetMetadata
	if assetMetadata == nil {
		assetMetadata = make(map[string]interface{})
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			expiresAt = &parsed
		}
	}

	asset := &models.TenantDigitalAsset{
		ID:            uuid.New(),
		TenantID:      req.TenantID,
		OrderID:       req.OrderID,
		AssetType:     req.AssetType,
		Name:          req.Name,
		Status:        "PENDING",
		AutoRenew:     req.AutoRenew,
		AssetMetadata: assetMetadata,
		ExpiresAt:     expiresAt,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		Version:       1,
	}

	if err := s.assetRepo.Create(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to create digital asset: %w", err)
	}

	// TODO: Trigger asset provisioning process
	go s.provisionAsset(context.Background(), asset)

	return asset, nil
}

// UpdateAsset updates a digital asset
func (s *TenantDigitalAssetService) UpdateAsset(ctx context.Context, id uuid.UUID, req UpdateTenantDigitalAssetRequest) (*models.TenantDigitalAsset, error) {
	asset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
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
	if req.AssetMetadata != nil {
		asset.AssetMetadata = req.AssetMetadata
	}
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			asset.ExpiresAt = &parsed
		}
	}

	asset.UpdatedAt = time.Now()
	asset.Version++

	if err := s.assetRepo.Update(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to update asset: %w", err)
	}

	return asset, nil
}

// DeleteAsset deletes a digital asset
func (s *TenantDigitalAssetService) DeleteAsset(ctx context.Context, id uuid.UUID) error {
	asset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("asset not found: %w", err)
	}

	if asset.Status == "ACTIVE" {
		return fmt.Errorf("cannot delete active asset, suspend it first")
	}

	return s.assetRepo.Delete(ctx, id)
}

// ActivateAsset activates a digital asset
func (s *TenantDigitalAssetService) ActivateAsset(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error) {
	asset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}

	if asset.Status == "ACTIVE" {
		return asset, nil
	}

	now := time.Now()
	asset.Status = "ACTIVE"
	asset.ActivatedAt = &now
	asset.UpdatedAt = now
	asset.Version++

	if err := s.assetRepo.Update(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to activate asset: %w", err)
	}

	return asset, nil
}

// SuspendAsset suspends a digital asset
func (s *TenantDigitalAssetService) SuspendAsset(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error) {
	asset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}

	if asset.Status == "SUSPENDED" {
		return asset, nil
	}

	asset.Status = "SUSPENDED"
	asset.UpdatedAt = time.Now()
	asset.Version++

	if err := s.assetRepo.Update(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to suspend asset: %w", err)
	}

	return asset, nil
}

// RenewAsset renews a digital asset
func (s *TenantDigitalAssetService) RenewAsset(ctx context.Context, id uuid.UUID, expiresAtStr string) (*models.TenantDigitalAsset, error) {
	asset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}

	expiresAt, err := time.Parse(time.RFC3339, expiresAtStr)
	if err != nil {
		return nil, fmt.Errorf("invalid expires_at format: %w", err)
	}

	asset.ExpiresAt = &expiresAt
	asset.UpdatedAt = time.Now()
	asset.Version++

	// If asset was expired, reactivate it
	if asset.Status == "EXPIRED" {
		now := time.Now()
		asset.Status = "ACTIVE"
		asset.ActivatedAt = &now
	}

	if err := s.assetRepo.Update(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to renew asset: %w", err)
	}

	return asset, nil
}

// provisionAsset provisions a digital asset (simulation)
func (s *TenantDigitalAssetService) provisionAsset(ctx context.Context, asset *models.TenantDigitalAsset) {
	// Simulate provisioning process
	time.Sleep(3 * time.Second)

	asset.Status = "PROVISIONING"
	_ = s.assetRepo.Update(ctx, asset)

	time.Sleep(5 * time.Second)

	now := time.Now()
	asset.Status = "ACTIVE"
	asset.ActivatedAt = &now
	asset.UpdatedAt = now

	_ = s.assetRepo.Update(ctx, asset)
}

// CheckExpiredAssets checks and marks expired assets
func (s *TenantDigitalAssetService) CheckExpiredAssets(ctx context.Context) error {
	// TODO: Implement batch check for expired assets
	// This should be called by a scheduled job
	return nil
}
