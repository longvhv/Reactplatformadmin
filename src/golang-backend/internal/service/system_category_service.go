package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type SystemCategoryService interface {
	CreateCategory(ctx context.Context, req *models.CreateSystemCategoryRequest) (*models.SystemCategory, error)
	GetCategory(ctx context.Context, id uuid.UUID) (*models.SystemCategory, error)
	GetCategoryByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SystemCategory, error)
	ListCategories(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, categoryType *string, status *int16) ([]*models.SystemCategory, int, error)
	ListCategoriesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemCategory, error)
	ListCategoriesByType(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]*models.SystemCategory, error)
	UpdateCategory(ctx context.Context, id uuid.UUID, req *models.UpdateSystemCategoryRequest) (*models.SystemCategory, error)
	DeleteCategory(ctx context.Context, id uuid.UUID) error
	SoftDeleteCategory(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
}

type systemCategoryService struct {
	repo repository.SystemCategoryRepository
}

func NewSystemCategoryService(repo repository.SystemCategoryRepository) SystemCategoryService {
	return &systemCategoryService{repo: repo}
}

func (s *systemCategoryService) CreateCategory(ctx context.Context, req *models.CreateSystemCategoryRequest) (*models.SystemCategory, error) {
	collectionName := "system_categories"
	if req.CollectionName != nil {
		collectionName = *req.CollectionName
	}

	order := 0
	if req.Order != nil {
		order = *req.Order
	}

	category := &models.SystemCategory{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		Type:            req.Type,
		Code:            req.Code,
		Name:            req.Name,
		Status:          1, // active by default
		Order:           order,
		Description:     req.Description,
		ParentID:        req.ParentID,
		GroupCategoryID: req.GroupCategoryID,
		CollectionName:  collectionName,
		ExtraFields:     req.ExtraFields,
		Metadata:        req.Metadata,
		IsSystem:        false,
		IsEditable:      true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	err := s.repo.Create(ctx, category)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (s *systemCategoryService) GetCategory(ctx context.Context, id uuid.UUID) (*models.SystemCategory, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *systemCategoryService) GetCategoryByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SystemCategory, error) {
	return s.repo.GetByCode(ctx, tenantID, code)
}

func (s *systemCategoryService) ListCategories(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, categoryType *string, status *int16) ([]*models.SystemCategory, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, categoryType, status)
}

func (s *systemCategoryService) ListCategoriesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemCategory, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *systemCategoryService) ListCategoriesByType(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]*models.SystemCategory, error) {
	return s.repo.ListByType(ctx, tenantID, categoryType)
}

func (s *systemCategoryService) UpdateCategory(ctx context.Context, id uuid.UUID, req *models.UpdateSystemCategoryRequest) (*models.SystemCategory, error) {
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
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

	err = s.repo.Update(ctx, category)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (s *systemCategoryService) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *systemCategoryService) SoftDeleteCategory(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}
