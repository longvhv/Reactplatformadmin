package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type LocationService interface {
	CreateLocation(ctx context.Context, req *models.CreateLocationRequest) (*models.Location, error)
	GetLocation(ctx context.Context, id uuid.UUID) (*models.Location, error)
	ListLocations(ctx context.Context, page, pageSize int, tenantID, typeID *uuid.UUID, status *string) ([]*models.Location, int, error)
	ListLocationsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Location, error)
	ListLocationsByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Location, error)
	UpdateLocation(ctx context.Context, id uuid.UUID, req *models.UpdateLocationRequest) (*models.Location, error)
	DeleteLocation(ctx context.Context, id uuid.UUID) error
	SoftDeleteLocation(ctx context.Context, id uuid.UUID) error
}

type locationService struct {
	repo repository.LocationRepository
}

func NewLocationService(repo repository.LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func (s *locationService) CreateLocation(ctx context.Context, req *models.CreateLocationRequest) (*models.Location, error) {
	radiusMeters := 100
	if req.RadiusMeters != nil {
		radiusMeters = *req.RadiusMeters
	}
	timezone := "UTC"
	if req.Timezone != nil {
		timezone = *req.Timezone
	}
	isHeadquarter := false
	if req.IsHeadquarter != nil {
		isHeadquarter = *req.IsHeadquarter
	}

	location := &models.Location{
		ID:            uuid.New(),
		TenantID:      req.TenantID,
		ParentID:      req.ParentID,
		TypeID:        req.TypeID,
		Name:          req.Name,
		Code:          req.Code,
		Status:        "ACTIVE",
		Address:       req.Address,
		Coordinates:   req.Coordinates,
		RadiusMeters:  radiusMeters,
		Timezone:      timezone,
		IsHeadquarter: isHeadquarter,
		Metadata:      req.Metadata,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		Version:       1,
	}
	err := s.repo.Create(ctx, location)
	return location, err
}

func (s *locationService) GetLocation(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *locationService) ListLocations(ctx context.Context, page, pageSize int, tenantID, typeID *uuid.UUID, status *string) ([]*models.Location, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, typeID, status)
}

func (s *locationService) ListLocationsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Location, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *locationService) ListLocationsByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Location, error) {
	return s.repo.ListByParent(ctx, parentID)
}

func (s *locationService) UpdateLocation(ctx context.Context, id uuid.UUID, req *models.UpdateLocationRequest) (*models.Location, error) {
	location, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		location.Name = *req.Name
	}
	if req.Code != nil {
		location.Code = req.Code
	}
	if req.Status != nil {
		location.Status = *req.Status
	}
	if req.Address != nil {
		location.Address = req.Address
	}
	if req.Coordinates != nil {
		location.Coordinates = req.Coordinates
	}
	if req.RadiusMeters != nil {
		location.RadiusMeters = *req.RadiusMeters
	}
	if req.Timezone != nil {
		location.Timezone = *req.Timezone
	}
	if req.IsHeadquarter != nil {
		location.IsHeadquarter = *req.IsHeadquarter
	}
	if req.Metadata != nil {
		location.Metadata = req.Metadata
	}
	err = s.repo.Update(ctx, location)
	return location, err
}

func (s *locationService) DeleteLocation(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *locationService) SoftDeleteLocation(ctx context.Context, id uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id)
}
