package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type FeatureFlagService struct {
	flagRepo repository.FeatureFlagRepository
}

func NewFeatureFlagService(flagRepo repository.FeatureFlagRepository) *FeatureFlagService {
	return &FeatureFlagService{
		flagRepo: flagRepo,
	}
}

type CreateFeatureFlagRequest struct {
	FlagKey           string                 `json:"flag_key" binding:"required"`
	FlagName          string                 `json:"flag_name" binding:"required"`
	Description       *string                `json:"description"`
	IsEnabled         bool                   `json:"is_enabled"`
	Category          *string                `json:"category"`
	TargetAudience    *string                `json:"target_audience"`
	PercentageRollout int                    `json:"percentage_rollout"`
	Conditions        map[string]interface{} `json:"conditions"`
	Metadata          map[string]interface{} `json:"metadata"`
	CreatedBy         *string                `json:"created_by"`
}

type UpdateFeatureFlagRequest struct {
	FlagName          *string                `json:"flag_name"`
	Description       *string                `json:"description"`
	Category          *string                `json:"category"`
	TargetAudience    *string                `json:"target_audience"`
	PercentageRollout *int                   `json:"percentage_rollout"`
	Conditions        map[string]interface{} `json:"conditions"`
	Metadata          map[string]interface{} `json:"metadata"`
}

// GetByID gets flag by ID
func (s *FeatureFlagService) GetByID(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error) {
	return s.flagRepo.GetByID(ctx, id)
}

// GetByKey gets flag by key
func (s *FeatureFlagService) GetByKey(ctx context.Context, key string) (*models.FeatureFlag, error) {
	return s.flagRepo.GetByKey(ctx, key)
}

// ListFlags lists all flags
func (s *FeatureFlagService) ListFlags(ctx context.Context, category string, page, limit int) ([]*models.FeatureFlag, int64, error) {
	offset := (page - 1) * limit
	return s.flagRepo.List(ctx, category, limit, offset)
}

// CreateFlag creates a new flag
func (s *FeatureFlagService) CreateFlag(ctx context.Context, req CreateFeatureFlagRequest) (*models.FeatureFlag, error) {
	// Check if key exists
	existing, err := s.flagRepo.GetByKey(ctx, req.FlagKey)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("flag key already exists")
	}

	conditions := req.Conditions
	if conditions == nil {
		conditions = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	flag := &models.FeatureFlag{
		ID:                uuid.New(),
		FlagKey:           req.FlagKey,
		FlagName:          req.FlagName,
		Description:       req.Description,
		IsEnabled:         req.IsEnabled,
		Category:          req.Category,
		TargetAudience:    req.TargetAudience,
		PercentageRollout: req.PercentageRollout,
		Conditions:        conditions,
		Metadata:          metadata,
		CreatedBy:         req.CreatedBy,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if req.IsEnabled {
		now := time.Now()
		flag.EnabledAt = &now
	}

	if err := s.flagRepo.Create(ctx, flag); err != nil {
		return nil, fmt.Errorf("failed to create flag: %w", err)
	}

	return flag, nil
}

// UpdateFlag updates a flag
func (s *FeatureFlagService) UpdateFlag(ctx context.Context, id uuid.UUID, req UpdateFeatureFlagRequest) (*models.FeatureFlag, error) {
	flag, err := s.flagRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("flag not found: %w", err)
	}

	if req.FlagName != nil {
		flag.FlagName = *req.FlagName
	}
	if req.Description != nil {
		flag.Description = req.Description
	}
	if req.Category != nil {
		flag.Category = req.Category
	}
	if req.TargetAudience != nil {
		flag.TargetAudience = req.TargetAudience
	}
	if req.PercentageRollout != nil {
		flag.PercentageRollout = *req.PercentageRollout
	}
	if req.Conditions != nil {
		flag.Conditions = req.Conditions
	}
	if req.Metadata != nil {
		flag.Metadata = req.Metadata
	}

	flag.UpdatedAt = time.Now()

	if err := s.flagRepo.Update(ctx, flag); err != nil {
		return nil, fmt.Errorf("failed to update flag: %w", err)
	}

	return flag, nil
}

// DeleteFlag deletes a flag
func (s *FeatureFlagService) DeleteFlag(ctx context.Context, id uuid.UUID) error {
	return s.flagRepo.Delete(ctx, id)
}

// EnableFlag enables a flag
func (s *FeatureFlagService) EnableFlag(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error) {
	flag, err := s.flagRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("flag not found: %w", err)
	}

	if flag.IsEnabled {
		return flag, nil
	}

	now := time.Now()
	flag.IsEnabled = true
	flag.EnabledAt = &now
	flag.DisabledAt = nil
	flag.UpdatedAt = now

	if err := s.flagRepo.Update(ctx, flag); err != nil {
		return nil, fmt.Errorf("failed to enable flag: %w", err)
	}

	return flag, nil
}

// DisableFlag disables a flag
func (s *FeatureFlagService) DisableFlag(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error) {
	flag, err := s.flagRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("flag not found: %w", err)
	}

	if !flag.IsEnabled {
		return flag, nil
	}

	now := time.Now()
	flag.IsEnabled = false
	flag.DisabledAt = &now
	flag.UpdatedAt = now

	if err := s.flagRepo.Update(ctx, flag); err != nil {
		return nil, fmt.Errorf("failed to disable flag: %w", err)
	}

	return flag, nil
}

// EvaluateFlag evaluates a feature flag
func (s *FeatureFlagService) EvaluateFlag(ctx context.Context, flagKey string, userID, tenantID *uuid.UUID, evalContext map[string]interface{}) (bool, error) {
	flag, err := s.flagRepo.GetByKey(ctx, flagKey)
	if err != nil {
		// If flag not found, default to false
		return false, nil
	}

	// If globally disabled
	if !flag.IsEnabled {
		return false, nil
	}

	// Check percentage rollout (simple hash-based)
	if flag.PercentageRollout < 100 {
		if userID != nil {
			// Simple percentage check based on user ID
			hashVal := s.hashUUID(*userID) % 100
			if hashVal >= flag.PercentageRollout {
				return false, nil
			}
		} else if tenantID != nil {
			hashVal := s.hashUUID(*tenantID) % 100
			if hashVal >= flag.PercentageRollout {
				return false, nil
			}
		}
	}

	// TODO: Evaluate conditions from flag.Conditions
	// This is a simplified version - you can add more complex logic

	return true, nil
}

// Helper function to hash UUID for percentage rollout
func (s *FeatureFlagService) hashUUID(id uuid.UUID) int {
	bytes := []byte(id.String())
	sum := 0
	for _, b := range bytes {
		sum += int(b)
	}
	return sum % 100
}

// GetEnabledFlags gets all enabled flags
func (s *FeatureFlagService) GetEnabledFlags(ctx context.Context) ([]*models.FeatureFlag, error) {
	flags, _, err := s.flagRepo.List(ctx, "", 1000, 0)
	if err != nil {
		return nil, err
	}

	enabled := make([]*models.FeatureFlag, 0)
	for _, flag := range flags {
		if flag.IsEnabled {
			enabled = append(enabled, flag)
		}
	}

	return enabled, nil
}
