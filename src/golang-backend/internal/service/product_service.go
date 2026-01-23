package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/cache"
)

type ProductService struct {
	productRepo repository.ProductRepository
	cache       cache.Cache
}

func NewProductService(productRepo repository.ProductRepository, cache cache.Cache) *ProductService {
	return &ProductService{
		productRepo: productRepo,
		cache:       cache,
	}
}

// GetByID gets product by ID
func (s *ProductService) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	// Try cache first
	cacheKey := cache.ProductCacheKey(id.String())
	var product models.Product
	err := s.cache.GetJSON(ctx, cacheKey, &product)
	if err == nil {
		return &product, nil
	}

	// Get from database
	dbProduct, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache product
	_ = s.cache.SetJSON(ctx, cacheKey, dbProduct, cache.ProductTTL)

	return dbProduct, nil
}

// ListByTenant lists products by tenant
func (s *ProductService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Product, int64, error) {
	offset := (page - 1) * limit
	products, total, err := s.productRepo.ListByTenant(ctx, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

// CreateProduct creates a new product
func (s *ProductService) CreateProduct(ctx context.Context, req CreateProductRequest) (*models.Product, error) {
	// Validate product code
	if req.Code == "" {
		return nil, fmt.Errorf("product code is required")
	}

	// Check if code exists in tenant
	exists, err := s.productRepo.ExistsByCode(ctx, req.TenantID, req.Code)
	if err != nil {
		return nil, fmt.Errorf("failed to check product code: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("product code already exists")
	}

	// Create product
	product := &models.Product{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		Name:           req.Name,
		Code:           req.Code,
		Description:    req.Description,
		Type:           req.Type,
		Category:       req.Category,
		Price:          req.Price,
		Currency:       req.Currency,
		IsActive:       req.IsActive,
		IsVisible:      req.IsVisible,
		Features:       req.Features,
		Specifications: req.Specifications,
		Metadata:       req.Metadata,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	return product, nil
}

// UpdateProduct updates a product
func (s *ProductService) UpdateProduct(ctx context.Context, id uuid.UUID, req UpdateProductRequest) (*models.Product, error) {
	// Get existing product
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	// Update fields
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = req.Description
	}
	if req.Type != nil {
		product.Type = *req.Type
	}
	if req.Category != nil {
		product.Category = req.Category
	}
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.Currency != nil {
		product.Currency = *req.Currency
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
	if req.IsVisible != nil {
		product.IsVisible = *req.IsVisible
	}
	if req.Features != nil {
		product.Features = req.Features
	}
	if req.Specifications != nil {
		product.Specifications = req.Specifications
	}
	if req.Metadata != nil {
		product.Metadata = req.Metadata
	}

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.ProductCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return product, nil
}

// DeleteProduct deletes a product
func (s *ProductService) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	if err := s.productRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.ProductCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}