package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type LocationTypeService interface {
	CreateLocationType(ctx context.Context, req *models.CreateLocationTypeRequest) (*models.LocationType, error)
	GetLocationType(ctx context.Context, id uuid.UUID) (*models.LocationType, error)
	GetLocationTypeByCode(ctx context.Context, code string) (*models.LocationType, error)
	ListLocationTypes(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.LocationType, int, error)
	ListActiveLocationTypes(ctx context.Context) ([]*models.LocationType, error)
	UpdateLocationType(ctx context.Context, id uuid.UUID, req *models.UpdateLocationTypeRequest) (*models.LocationType, error)
	DeleteLocationType(ctx context.Context, id uuid.UUID) error
}

type locationTypeService struct {
	repo repository.LocationTypeRepository
}

func NewLocationTypeService(repo repository.LocationTypeRepository) LocationTypeService {
	return &locationTypeService{repo: repo}
}

func (s *locationTypeService) CreateLocationType(ctx context.Context, req *models.CreateLocationTypeRequest) (*models.LocationType, error) {
	locationType := &models.LocationType{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		ExtraFields: req.ExtraFields,
		IsSystem:    false,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}
	err := s.repo.Create(ctx, locationType)
	return locationType, err
}

func (s *locationTypeService) GetLocationType(ctx context.Context, id uuid.UUID) (*models.LocationType, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *locationTypeService) GetLocationTypeByCode(ctx context.Context, code string) (*models.LocationType, error) {
	return s.repo.GetByCode(ctx, code)
}

func (s *locationTypeService) ListLocationTypes(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.LocationType, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID)
}

func (s *locationTypeService) ListActiveLocationTypes(ctx context.Context) ([]*models.LocationType, error) {
	return s.repo.ListActive(ctx)
}

func (s *locationTypeService) UpdateLocationType(ctx context.Context, id uuid.UUID, req *models.UpdateLocationTypeRequest) (*models.LocationType, error) {
	locationType, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		locationType.Name = *req.Name
	}
	if req.Description != nil {
		locationType.Description = req.Description
	}
	if req.ExtraFields != nil {
		locationType.ExtraFields = req.ExtraFields
	}
	if req.IsActive != nil {
		locationType.IsActive = *req.IsActive
	}
	err = s.repo.Update(ctx, locationType)
	return locationType, err
}

func (s *locationTypeService) DeleteLocationType(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
