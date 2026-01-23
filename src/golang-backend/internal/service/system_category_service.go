package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type SystemCategoryService struct {
	categoryRepo repository.SystemCategoryRepository
}

func NewSystemCategoryService(categoryRepo repository.SystemCategoryRepository) *SystemCategoryService {
	return &SystemCategoryService{
		categoryRepo: categoryRepo,
	}
}

type CreateSystemCategoryRequest struct {
	TenantID        uuid.UUID              `json:"tenant_id" binding:"required"`
	Type            string                 `json:"type" binding:"required"`
	Code            string                 `json:"code" binding:"required"`
	Name            string                 `json:"name" binding:"required"`
	Status          int                    `json:"status"`
	Order           int                    `json:"order"`
	Description     *string                `json:"description"`
	ParentID        *string                `json:"parent_id"`
	GroupCategoryID *string                `json:"group_category_id"`
	CollectionName  string                 `json:"collection_name"`
	ExtraFields     []interface{}          `json:"extra_fields"`
	Metadata        map[string]interface{} `json:"metadata"`
	IsSystem        bool                   `json:"is_system"`
	IsEditable      bool                   `json:"is_editable"`
	CreatedBy       uuid.UUID              `json:"-"`
}

type UpdateSystemCategoryRequest struct {
	Name            *string                `json:"name"`
	Status          *int                   `json:"status"`
	Order           *int                   `json:"order"`
	Description     *string                `json:"description"`
	ParentID        *string                `json:"parent_id"`
	GroupCategoryID *string                `json:"group_category_id"`
	ExtraFields     []interface{}          `json:"extra_fields"`
	Metadata        map[string]interface{} `json:"metadata"`
	UpdatedBy       uuid.UUID              `json:"-"`
}

// GetByID gets category by ID
func (s *SystemCategoryService) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemCategory, error) {
	return s.categoryRepo.GetByID(ctx, id)
}

// GetByCode gets category by code
func (s *SystemCategoryService) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SystemCategory, error) {
	return s.categoryRepo.GetByCode(ctx, tenantID, code)
}

// ListByTenant lists categories by tenant
func (s *SystemCategoryService) ListByTenant(ctx context.Context, tenantID uuid.UUID, categoryType string, status *int, page, limit int) ([]*models.SystemCategory, int64, error) {
	offset := (page - 1) * limit
	return s.categoryRepo.ListByTenant(ctx, tenantID, categoryType, status, limit, offset)
}

// GetByType gets categories by type
func (s *SystemCategoryService) GetByType(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]*models.SystemCategory, error) {
	categories, _, err := s.categoryRepo.ListByTenant(ctx, tenantID, categoryType, nil, 1000, 0)
	return categories, err
}

// CreateCategory creates a new category
func (s *SystemCategoryService) CreateCategory(ctx context.Context, req CreateSystemCategoryRequest) (*models.SystemCategory, error) {
	// Check if code exists for this tenant
	existing, err := s.categoryRepo.GetByCode(ctx, req.TenantID, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("category code already exists for this tenant")
	}

	status := req.Status
	if status == 0 {
		status = 1
	}

	collectionName := req.CollectionName
	if collectionName == "" {
		collectionName = "system_categories"
	}

	extraFields := req.ExtraFields
	if extraFields == nil {
		extraFields = []interface{}{}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	category := &models.SystemCategory{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		Type:            req.Type,
		Code:            req.Code,
		Name:            req.Name,
		Status:          status,
		Order:           req.Order,
		Description:     req.Description,
		ParentID:        req.ParentID,
		GroupCategoryID: req.GroupCategoryID,
		CollectionName:  collectionName,
		ExtraFields:     extraFields,
		Metadata:        metadata,
		IsSystem:        req.IsSystem,
		IsEditable:      req.IsEditable,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		CreatedBy:       &req.CreatedBy,
		Version:         1,
	}

	if err := s.categoryRepo.Create(ctx, category); err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return category, nil
}

// UpdateCategory updates a category
func (s *SystemCategoryService) UpdateCategory(ctx context.Context, id uuid.UUID, req UpdateSystemCategoryRequest) (*models.SystemCategory, error) {
	category, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("category not found: %w", err)
	}

	if !category.IsEditable {
		return nil, fmt.Errorf("category is not editable")
	}

	if req.Name != nil {
		category.Name = *req.Name
	}
	if req.Status != nil {
		category.Status = *req.Status
	}
	if req.Order != nil {
		category.Order = *req.Order
	}
	if req.Description != nil {
		category.Description = req.Description
	}
	if req.ParentID != nil {
		category.ParentID = req.ParentID
	}
	if req.GroupCategoryID != nil {
		category.GroupCategoryID = req.GroupCategoryID
	}
	if req.ExtraFields != nil {
		category.ExtraFields = req.ExtraFields
	}
	if req.Metadata != nil {
		category.Metadata = req.Metadata
	}

	category.UpdatedAt = time.Now()
	category.UpdatedBy = &req.UpdatedBy
	category.Version++

	if err := s.categoryRepo.Update(ctx, category); err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return category, nil
}

// DeleteCategory deletes a category
func (s *SystemCategoryService) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	category, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("category not found: %w", err)
	}

	if category.IsSystem {
		return fmt.Errorf("cannot delete system category")
	}

	if !category.IsEditable {
		return fmt.Errorf("category is not editable")
	}

	return s.categoryRepo.Delete(ctx, id)
}

// GetChildren gets child categories
func (s *SystemCategoryService) GetChildren(ctx context.Context, tenantID uuid.UUID, parentCode string) ([]*models.SystemCategory, error) {
	return s.categoryRepo.GetChildren(ctx, tenantID, parentCode)
}

// GetByGroup gets categories by group
func (s *SystemCategoryService) GetByGroup(ctx context.Context, tenantID uuid.UUID, groupID string) ([]*models.SystemCategory, error) {
	return s.categoryRepo.GetByGroup(ctx, tenantID, groupID)
}
