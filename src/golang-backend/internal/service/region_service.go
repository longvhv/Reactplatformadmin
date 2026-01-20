package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type RegionService interface {
	CreateRegion(ctx context.Context, req *models.CreateRegionRequest) (*models.Region, error)
	GetRegion(ctx context.Context, id uuid.UUID) (*models.Region, error)
	GetRegionByCode(ctx context.Context, code string) (*models.Region, error)
	ListRegions(ctx context.Context, page, pageSize int, regionType *string, parentID *uuid.UUID) ([]*models.Region, int, error)
	ListRegionsByType(ctx context.Context, regionType string) ([]*models.Region, error)
	ListRegionsByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Region, error)
	UpdateRegion(ctx context.Context, id uuid.UUID, req *models.UpdateRegionRequest) (*models.Region, error)
	DeleteRegion(ctx context.Context, id uuid.UUID) error
	SoftDeleteRegion(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
}

type regionService struct {
	repo repository.RegionRepository
}

func NewRegionService(repo repository.RegionRepository) RegionService {
	return &regionService{repo: repo}
}

func (s *regionService) CreateRegion(ctx context.Context, req *models.CreateRegionRequest) (*models.Region, error) {
	order := 0
	if req.Order != nil {
		order = *req.Order
	}

	region := &models.Region{
		ID:          uuid.New(),
		Code:        req.Code,
		Name:        req.Name,
		Type:        req.Type,
		Order:       order,
		Status:      1,
		ParentID:    req.ParentID,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		HistoryData: req.HistoryData,
		Metadata:    req.Metadata,
		IsSystem:    false,
		IsEditable:  true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	err := s.repo.Create(ctx, region)
	if err != nil {
		return nil, err
	}
	return region, nil
}

func (s *regionService) GetRegion(ctx context.Context, id uuid.UUID) (*models.Region, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *regionService) GetRegionByCode(ctx context.Context, code string) (*models.Region, error) {
	return s.repo.GetByCode(ctx, code)
}

func (s *regionService) ListRegions(ctx context.Context, page, pageSize int, regionType *string, parentID *uuid.UUID) ([]*models.Region, int, error) {
	return s.repo.List(ctx, page, pageSize, regionType, parentID)
}

func (s *regionService) ListRegionsByType(ctx context.Context, regionType string) ([]*models.Region, error) {
	return s.repo.ListByType(ctx, regionType)
}

func (s *regionService) ListRegionsByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Region, error) {
	return s.repo.ListByParent(ctx, parentID)
}

func (s *regionService) UpdateRegion(ctx context.Context, id uuid.UUID, req *models.UpdateRegionRequest) (*models.Region, error) {
	region, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		region.Name = *req.Name
	}
	if req.Order != nil {
		region.Order = *req.Order
	}
	if req.Status != nil {
		region.Status = *req.Status
	}
	if req.ParentID != nil {
		region.ParentID = req.ParentID
	}
	if req.StartDate != nil {
		region.StartDate = req.StartDate
	}
	if req.EndDate != nil {
		region.EndDate = req.EndDate
	}
	if req.HistoryData != nil {
		region.HistoryData = req.HistoryData
	}
	if req.Metadata != nil {
		region.Metadata = req.Metadata
	}

	err = s.repo.Update(ctx, region)
	if err != nil {
		return nil, err
	}
	return region, nil
}

func (s *regionService) DeleteRegion(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *regionService) SoftDeleteRegion(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}
