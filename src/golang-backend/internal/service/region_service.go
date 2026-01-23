package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type RegionService struct {
	regionRepo repository.RegionRepository
}

func NewRegionService(regionRepo repository.RegionRepository) *RegionService {
	return &RegionService{
		regionRepo: regionRepo,
	}
}

type CreateRegionRequest struct {
	Code        string                 `json:"code" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Type        string                 `json:"type" binding:"required"`
	Order       int                    `json:"order"`
	Status      int                    `json:"status"`
	ParentID    *uuid.UUID             `json:"parent_id"`
	StartDate   *string                `json:"start_date"`
	EndDate     *string                `json:"end_date"`
	HistoryData []interface{}          `json:"history_data"`
	Metadata    map[string]interface{} `json:"metadata"`
	IsSystem    bool                   `json:"is_system"`
	IsEditable  bool                   `json:"is_editable"`
}

type UpdateRegionRequest struct {
	Name        *string                `json:"name"`
	Order       *int                   `json:"order"`
	Status      *int                   `json:"status"`
	StartDate   *string                `json:"start_date"`
	EndDate     *string                `json:"end_date"`
	HistoryData []interface{}          `json:"history_data"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// GetByID gets region by ID
func (s *RegionService) GetByID(ctx context.Context, id uuid.UUID) (*models.Region, error) {
	return s.regionRepo.GetByID(ctx, id)
}

// GetByCode gets region by code
func (s *RegionService) GetByCode(ctx context.Context, code string) (*models.Region, error) {
	return s.regionRepo.GetByCode(ctx, code)
}

// ListRegions lists all regions
func (s *RegionService) ListRegions(ctx context.Context, regionType string, parentID *uuid.UUID, status *int, page, limit int) ([]*models.Region, int64, error) {
	offset := (page - 1) * limit
	return s.regionRepo.List(ctx, regionType, parentID, status, limit, offset)
}

// GetChildren gets child regions
func (s *RegionService) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Region, error) {
	return s.regionRepo.GetChildren(ctx, parentID)
}

// GetHierarchy gets region hierarchy tree
func (s *RegionService) GetHierarchy(ctx context.Context, rootType string) ([]map[string]interface{}, error) {
	// Get root regions (no parent)
	roots, _, err := s.regionRepo.List(ctx, rootType, nil, nil, 100, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to get root regions: %w", err)
	}

	hierarchy := make([]map[string]interface{}, 0)
	for _, root := range roots {
		node := s.buildHierarchyNode(ctx, root)
		hierarchy = append(hierarchy, node)
	}

	return hierarchy, nil
}

// buildHierarchyNode builds hierarchy node recursively
func (s *RegionService) buildHierarchyNode(ctx context.Context, region *models.Region) map[string]interface{} {
	node := map[string]interface{}{
		"id":      region.ID,
		"code":    region.Code,
		"name":    region.Name,
		"type":    region.Type,
		"order":   region.Order,
		"status":  region.Status,
		"children": []map[string]interface{}{},
	}

	// Get children
	children, err := s.regionRepo.GetChildren(ctx, region.ID)
	if err == nil && len(children) > 0 {
		childNodes := make([]map[string]interface{}, 0)
		for _, child := range children {
			childNode := s.buildHierarchyNode(ctx, child)
			childNodes = append(childNodes, childNode)
		}
		node["children"] = childNodes
	}

	return node
}

// CreateRegion creates a new region
func (s *RegionService) CreateRegion(ctx context.Context, req CreateRegionRequest) (*models.Region, error) {
	// Check if code exists
	existing, err := s.regionRepo.GetByCode(ctx, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("region code already exists")
	}

	status := req.Status
	if status == 0 {
		status = 1
	}

	historyData := req.HistoryData
	if historyData == nil {
		historyData = []interface{}{}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	var startDate, endDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			startDate = &parsed
		}
	}
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			endDate = &parsed
		}
	}

	region := &models.Region{
		ID:          uuid.New(),
		Code:        req.Code,
		Name:        req.Name,
		Type:        req.Type,
		Order:       req.Order,
		Status:      status,
		ParentID:    req.ParentID,
		StartDate:   startDate,
		EndDate:     endDate,
		HistoryData: historyData,
		Metadata:    metadata,
		IsSystem:    req.IsSystem,
		IsEditable:  req.IsEditable,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	if err := s.regionRepo.Create(ctx, region); err != nil {
		return nil, fmt.Errorf("failed to create region: %w", err)
	}

	return region, nil
}

// UpdateRegion updates a region
func (s *RegionService) UpdateRegion(ctx context.Context, id uuid.UUID, req UpdateRegionRequest) (*models.Region, error) {
	region, err := s.regionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("region not found: %w", err)
	}

	if !region.IsEditable {
		return nil, fmt.Errorf("region is not editable")
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
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			region.StartDate = &parsed
		}
	}
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			region.EndDate = &parsed
		}
	}
	if req.HistoryData != nil {
		region.HistoryData = req.HistoryData
	}
	if req.Metadata != nil {
		region.Metadata = req.Metadata
	}

	region.UpdatedAt = time.Now()
	region.Version++

	if err := s.regionRepo.Update(ctx, region); err != nil {
		return nil, fmt.Errorf("failed to update region: %w", err)
	}

	return region, nil
}

// DeleteRegion deletes a region
func (s *RegionService) DeleteRegion(ctx context.Context, id uuid.UUID) error {
	region, err := s.regionRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("region not found: %w", err)
	}

	if region.IsSystem {
		return fmt.Errorf("cannot delete system region")
	}

	if !region.IsEditable {
		return fmt.Errorf("region is not editable")
	}

	// Check if region has children
	children, err := s.regionRepo.GetChildren(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check children: %w", err)
	}
	if len(children) > 0 {
		return fmt.Errorf("cannot delete region with children")
	}

	return s.regionRepo.Delete(ctx, id)
}
