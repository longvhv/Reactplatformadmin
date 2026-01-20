package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type SaaSProductTypeService interface {
	CreateProductType(ctx context.Context, req *models.CreateSaaSProductTypeRequest) (*models.SaaSProductType, error)
	GetProductType(ctx context.Context, id uuid.UUID) (*models.SaaSProductType, error)
	GetProductTypeByCode(ctx context.Context, code string) (*models.SaaSProductType, error)
	ListProductTypes(ctx context.Context, page, pageSize int) ([]*models.SaaSProductType, int, error)
	ListActiveProductTypes(ctx context.Context) ([]*models.SaaSProductType, error)
	UpdateProductType(ctx context.Context, id uuid.UUID, req *models.UpdateSaaSProductTypeRequest) (*models.SaaSProductType, error)
	DeleteProductType(ctx context.Context, id uuid.UUID) error
}

type saasProductTypeService struct {
	repo repository.SaaSProductTypeRepository
}

func NewSaaSProductTypeService(repo repository.SaaSProductTypeRepository) SaaSProductTypeService {
	return &saasProductTypeService{repo: repo}
}

func (s *saasProductTypeService) CreateProductType(ctx context.Context, req *models.CreateSaaSProductTypeRequest) (*models.SaaSProductType, error) {
	productType := &models.SaaSProductType{
		ID:          uuid.New(),
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}
	err := s.repo.Create(ctx, productType)
	return productType, err
}

func (s *saasProductTypeService) GetProductType(ctx context.Context, id uuid.UUID) (*models.SaaSProductType, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *saasProductTypeService) GetProductTypeByCode(ctx context.Context, code string) (*models.SaaSProductType, error) {
	return s.repo.GetByCode(ctx, code)
}

func (s *saasProductTypeService) ListProductTypes(ctx context.Context, page, pageSize int) ([]*models.SaaSProductType, int, error) {
	return s.repo.List(ctx, page, pageSize)
}

func (s *saasProductTypeService) ListActiveProductTypes(ctx context.Context) ([]*models.SaaSProductType, error) {
	return s.repo.ListActive(ctx)
}

func (s *saasProductTypeService) UpdateProductType(ctx context.Context, id uuid.UUID, req *models.UpdateSaaSProductTypeRequest) (*models.SaaSProductType, error) {
	productType, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		productType.Name = *req.Name
	}
	if req.Description != nil {
		productType.Description = req.Description
	}
	if req.IsActive != nil {
		productType.IsActive = *req.IsActive
	}
	err = s.repo.Update(ctx, productType)
	return productType, err
}

func (s *saasProductTypeService) DeleteProductType(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
