package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository/yugabyte"
)

// LocationService handles location business logic
type LocationService struct {
	locationRepo *yugabyte.LocationRepository
	tenantRepo   *yugabyte.TenantRepository
}

// NewLocationService creates a new location service
func NewLocationService(
	locationRepo *yugabyte.LocationRepository,
	tenantRepo *yugabyte.TenantRepository,
) *LocationService {
	return &LocationService{
		locationRepo: locationRepo,
		tenantRepo:   tenantRepo,
	}
}

// CreateLocationRequest represents create location request
type CreateLocationRequest struct {
	TenantID      uuid.UUID      `json:"tenant_id" validate:"required"`
	Code          string         `json:"code" validate:"required"`
	Name          string         `json:"name" validate:"required"`
	TypeID        uuid.UUID      `json:"type_id" validate:"required"`
	ParentID      *uuid.UUID     `json:"parent_id,omitempty"`
	Address       map[string]any `json:"address,omitempty"`
	Coordinates   *string        `json:"coordinates,omitempty"`
	RadiusMeters  *int           `json:"radius_meters,omitempty"`
	Timezone      *string        `json:"timezone,omitempty"`
	IsHeadquarter *bool          `json:"is_headquarter,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
}

// CreateLocation creates a new location
func (s *LocationService) CreateLocation(ctx context.Context, req CreateLocationRequest) (*models.Location, error) {
	// Validate code format
	req.Code = strings.ToUpper(req.Code)
	if !isValidCode(req.Code) {
		return nil, fmt.Errorf("invalid location code format")
	}

	// Validate tenant exists
	_, err := s.tenantRepo.GetByID(ctx, req.TenantID)
	if err != nil {
		return nil, fmt.Errorf("tenant not found")
	}

	// Check if code already exists in tenant (if code provided)
	if req.Code != "" {
		exists, err := s.locationRepo.ExistsByCode(ctx, req.TenantID, req.Code)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, fmt.Errorf("location code already exists in this tenant")
		}
	}

	// Create location
	location := models.NewLocation(req.TenantID, req.Code, req.Name, req.TypeID)
	location.ParentID = req.ParentID
	
	if req.Address != nil {
		location.Address = req.Address
	}
	if req.Coordinates != nil {
		location.Coordinates = req.Coordinates
	}
	if req.RadiusMeters != nil {
		location.RadiusMeters = req.RadiusMeters
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

	if err := s.locationRepo.Create(ctx, location); err != nil {
		return nil, fmt.Errorf("failed to create location: %w", err)
	}

	return location, nil
}

// GetLocation gets location by ID
func (s *LocationService) GetLocation(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	return s.locationRepo.GetByID(ctx, id)
}

// GetLocationByCode gets location by code
func (s *LocationService) GetLocationByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Location, error) {
	return s.locationRepo.GetByCode(ctx, tenantID, code)
}

// ListLocations lists locations for a tenant
func (s *LocationService) ListLocations(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Location, *models.PaginationMeta, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	locations, total, err := s.locationRepo.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	meta := models.NewPaginationMeta(page, limit, total)
	return locations, &meta, nil
}

// ListLocationsByType lists locations by type
func (s *LocationService) ListLocationsByType(ctx context.Context, tenantID, typeID uuid.UUID, page, limit int) ([]*models.Location, *models.PaginationMeta, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	locations, total, err := s.locationRepo.ListByType(ctx, tenantID, typeID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	meta := models.NewPaginationMeta(page, limit, total)
	return locations, &meta, nil
}

// UpdateLocationRequest represents update location request
type UpdateLocationRequest struct {
	Name          *string        `json:"name,omitempty"`
	ParentID      *uuid.UUID     `json:"parent_id,omitempty"`
	Address       map[string]any `json:"address,omitempty"`
	Coordinates   *string        `json:"coordinates,omitempty"`
	RadiusMeters  *int           `json:"radius_meters,omitempty"`
	Timezone      *string        `json:"timezone,omitempty"`
	IsHeadquarter *bool          `json:"is_headquarter,omitempty"`
	Status        *string        `json:"status,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
}

// UpdateLocation updates location
func (s *LocationService) UpdateLocation(ctx context.Context, id uuid.UUID, req UpdateLocationRequest) (*models.Location, error) {
	location, err := s.locationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		location.Name = *req.Name
	}
	if req.ParentID != nil {
		location.ParentID = req.ParentID
	}
	if req.Address != nil {
		location.Address = req.Address
	}
	if req.Coordinates != nil {
		location.Coordinates = req.Coordinates
	}
	if req.RadiusMeters != nil {
		location.RadiusMeters = req.RadiusMeters
	}
	if req.Timezone != nil {
		location.Timezone = *req.Timezone
	}
	if req.IsHeadquarter != nil {
		location.IsHeadquarter = *req.IsHeadquarter
	}
	if req.Status != nil {
		location.Status = *req.Status
	}
	if req.Metadata != nil {
		location.Metadata = req.Metadata
	}

	location.Touch()

	if err := s.locationRepo.Update(ctx, location); err != nil {
		return nil, err
	}

	return location, nil
}

// DeleteLocation deletes location
func (s *LocationService) DeleteLocation(ctx context.Context, id uuid.UUID) error {
	return s.locationRepo.Delete(ctx, id)
}