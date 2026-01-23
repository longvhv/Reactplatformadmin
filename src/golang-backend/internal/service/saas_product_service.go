package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/cache"
)

type SaaSProductService struct {
	productRepo repository.SaaSProductRepository
	cache       cache.Cache
}

func NewSaaSProductService(productRepo repository.SaaSProductRepository, cache cache.Cache) *SaaSProductService {
	return &SaaSProductService{
		productRepo: productRepo,
		cache:       cache,
	}
}

type CreateSaaSProductRequest struct {
	TenantID        uuid.UUID              `json:"tenant_id" binding:"required"`
	Code            string                 `json:"code" binding:"required"`
	Name            string                 `json:"name" binding:"required"`
	Description     *string                `json:"description"`
	ProductTypeCode *string                `json:"product_type_code"`
	BasePrice       float64                `json:"base_price" binding:"min=0"`
	Currency        string                 `json:"currency"`
	BillingCycle    string                 `json:"billing_cycle"`
	TrialDays       int                    `json:"trial_days" binding:"min=0"`
	Features        map[string]interface{} `json:"features"`
	Limits          map[string]interface{} `json:"limits"`
	IsFeatured      bool                   `json:"is_featured"`
	DisplayOrder    int                    `json:"display_order"`
	Metadata        map[string]interface{} `json:"metadata"`
	CreatedBy       uuid.UUID              `json:"-"`
}

type UpdateSaaSProductRequest struct {
	Name            *string                `json:"name"`
	Description     *string                `json:"description"`
	ProductTypeCode *string                `json:"product_type_code"`
	BasePrice       *float64               `json:"base_price"`
	Currency        *string                `json:"currency"`
	BillingCycle    *string                `json:"billing_cycle"`
	TrialDays       *int                   `json:"trial_days"`
	Features        map[string]interface{} `json:"features"`
	Limits          map[string]interface{} `json:"limits"`
	Status          *string                `json:"status"`
	IsFeatured      *bool                  `json:"is_featured"`
	DisplayOrder    *int                   `json:"display_order"`
	Metadata        map[string]interface{} `json:"metadata"`
	UpdatedBy       uuid.UUID              `json:"-"`
}

// GetByID gets product by ID
func (s *SaaSProductService) GetByID(ctx context.Context, id uuid.UUID) (*models.SaaSProduct, error) {
	cacheKey := cache.ProductCacheKey(id.String())
	var product models.SaaSProduct
	err := s.cache.GetJSON(ctx, cacheKey, &product)
	if err == nil {
		return &product, nil
	}

	dbProduct, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	_ = s.cache.SetJSON(ctx, cacheKey, dbProduct, cache.ProductTTL)
	return dbProduct, nil
}

// GetByCode gets product by code
func (s *SaaSProductService) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SaaSProduct, error) {
	cacheKey := cache.ProductCacheKey(fmt.Sprintf("code:%s:%s", tenantID.String(), code))
	var product models.SaaSProduct
	err := s.cache.GetJSON(ctx, cacheKey, &product)
	if err == nil {
		return &product, nil
	}

	dbProduct, err := s.productRepo.GetByCode(ctx, tenantID, code)
	if err != nil {
		return nil, err
	}

	_ = s.cache.SetJSON(ctx, cacheKey, dbProduct, cache.ProductTTL)
	return dbProduct, nil
}

// ListByTenant lists products by tenant
func (s *SaaSProductService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, isFeatured bool, page, limit int) ([]*models.SaaSProduct, int64, error) {
	offset := (page - 1) * limit
	return s.productRepo.ListByTenant(ctx, tenantID, status, isFeatured, limit, offset)
}

// GetPublicProducts gets active public products
func (s *SaaSProductService) GetPublicProducts(ctx context.Context, tenantID uuid.UUID) ([]*models.SaaSProduct, error) {
	return s.productRepo.GetPublicProducts(ctx, tenantID)
}

// CreateProduct creates a new product
func (s *SaaSProductService) CreateProduct(ctx context.Context, req CreateSaaSProductRequest) (*models.SaaSProduct, error) {
	// Normalize code
	code := strings.ToLower(strings.TrimSpace(req.Code))
	if code == "" {
		return nil, fmt.Errorf("code is required")
	}

	// Check if code exists
	exists, err := s.productRepo.ExistsByCode(ctx, req.TenantID, code)
	if err != nil {
		return nil, fmt.Errorf("failed to check code: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("product code already exists")
	}

	currency := req.Currency
	if currency == "" {
		currency = "VND"
	}

	billingCycle := req.BillingCycle
	if billingCycle == "" {
		billingCycle = "MONTHLY"
	}

	features := req.Features
	if features == nil {
		features = make(map[string]interface{})
	}

	limits := req.Limits
	if limits == nil {
		limits = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	product := &models.SaaSProduct{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		Code:            code,
		Name:            req.Name,
		Description:     req.Description,
		ProductTypeCode: req.ProductTypeCode,
		BasePrice:       req.BasePrice,
		Currency:        currency,
		BillingCycle:    billingCycle,
		TrialDays:       req.TrialDays,
		Features:        features,
		Limits:          limits,
		Status:          "active",
		IsFeatured:      req.IsFeatured,
		DisplayOrder:    req.DisplayOrder,
		Metadata:        metadata,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		CreatedBy:       &req.CreatedBy,
		Version:         1,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	return product, nil
}

// UpdateProduct updates a product
func (s *SaaSProductService) UpdateProduct(ctx context.Context, id uuid.UUID, req UpdateSaaSProductRequest) (*models.SaaSProduct, error) {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = req.Description
	}
	if req.ProductTypeCode != nil {
		product.ProductTypeCode = req.ProductTypeCode
	}
	if req.BasePrice != nil {
		product.BasePrice = *req.BasePrice
	}
	if req.Currency != nil {
		product.Currency = *req.Currency
	}
	if req.BillingCycle != nil {
		product.BillingCycle = *req.BillingCycle
	}
	if req.TrialDays != nil {
		product.TrialDays = *req.TrialDays
	}
	if req.Features != nil {
		product.Features = req.Features
	}
	if req.Limits != nil {
		product.Limits = req.Limits
	}
	if req.Status != nil {
		product.Status = *req.Status
	}
	if req.IsFeatured != nil {
		product.IsFeatured = *req.IsFeatured
	}
	if req.DisplayOrder != nil {
		product.DisplayOrder = *req.DisplayOrder
	}
	if req.Metadata != nil {
		product.Metadata = req.Metadata
	}

	product.UpdatedAt = time.Now()
	product.UpdatedBy = &req.UpdatedBy
	product.Version++

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	// Invalidate cache
	cacheKey1 := cache.ProductCacheKey(id.String())
	cacheKey2 := cache.ProductCacheKey(fmt.Sprintf("code:%s:%s", product.TenantID.String(), product.Code))
	_ = s.cache.Delete(ctx, cacheKey1)
	_ = s.cache.Delete(ctx, cacheKey2)

	return product, nil
}

// DeleteProduct deletes a product (soft delete)
func (s *SaaSProductService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	if err := s.productRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	// Invalidate cache
	cacheKey1 := cache.ProductCacheKey(id.String())
	cacheKey2 := cache.ProductCacheKey(fmt.Sprintf("code:%s:%s", product.TenantID.String(), product.Code))
	_ = s.cache.Delete(ctx, cacheKey1)
	_ = s.cache.Delete(ctx, cacheKey2)

	return nil
}
