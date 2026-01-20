package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type FeatureFlagService interface {
	CreateFlag(ctx context.Context, req *models.CreateFeatureFlagRequest) (*models.FeatureFlag, error)
	GetFlag(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error)
	GetFlagByKey(ctx context.Context, key string) (*models.FeatureFlag, error)
	ListFlags(ctx context.Context, page, pageSize int, environment *string, isEnabled *bool) ([]*models.FeatureFlag, int, error)
	ListFlagsByEnvironment(ctx context.Context, environment string) ([]*models.FeatureFlag, error)
	ListEnabledFlags(ctx context.Context, environment string) ([]*models.FeatureFlag, error)
	UpdateFlag(ctx context.Context, id uuid.UUID, req *models.UpdateFeatureFlagRequest) (*models.FeatureFlag, error)
	EnableFlag(ctx context.Context, id uuid.UUID) error
	DisableFlag(ctx context.Context, id uuid.UUID) error
	UpdateRolloutPercentage(ctx context.Context, id uuid.UUID, percentage int) error
	DeleteFlag(ctx context.Context, id uuid.UUID) error
	IsFeatureEnabled(ctx context.Context, key string, environment string) (bool, error)
}

type featureFlagService struct {
	repo repository.FeatureFlagRepository
}

func NewFeatureFlagService(repo repository.FeatureFlagRepository) FeatureFlagService {
	return &featureFlagService{repo: repo}
}

func (s *featureFlagService) CreateFlag(ctx context.Context, req *models.CreateFeatureFlagRequest) (*models.FeatureFlag, error) {
	now := time.Now()
	flag := &models.FeatureFlag{
		ID:                uuid.New(),
		FlagKey:           req.FlagKey,
		FlagName:          req.FlagName,
		IsEnabled:         req.IsEnabled,
		Environment:       "production",
		FlagType:          "boolean",
		PercentageRollout: 0,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if req.Description != "" {
		flag.Description.String = req.Description
		flag.Description.Valid = true
	}

	if req.Environment != "" {
		flag.Environment = req.Environment
	}

	if req.FlagType != "" {
		flag.FlagType = req.FlagType
	}

	if req.TargetAudience != "" {
		flag.TargetAudience.String = req.TargetAudience
		flag.TargetAudience.Valid = true
	}

	if req.PercentageRollout > 0 {
		flag.PercentageRollout = req.PercentageRollout
	}

	if req.CreatedBy != "" {
		flag.CreatedBy.String = req.CreatedBy
		flag.CreatedBy.Valid = true
	}

	// Set conditions
	if req.Conditions != nil {
		conditionsJSON, err := json.Marshal(req.Conditions)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal conditions: %w", err)
		}
		flag.Conditions = conditionsJSON
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		flag.Metadata = metadataJSON
	}

	if flag.IsEnabled {
		flag.EnabledAt.Time = now
		flag.EnabledAt.Valid = true
	}

	if err := s.repo.Create(ctx, flag); err != nil {
		return nil, fmt.Errorf("failed to create feature flag: %w", err)
	}

	return flag, nil
}

func (s *featureFlagService) GetFlag(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *featureFlagService) GetFlagByKey(ctx context.Context, key string) (*models.FeatureFlag, error) {
	return s.repo.GetByKey(ctx, key)
}

func (s *featureFlagService) ListFlags(ctx context.Context, page, pageSize int, environment *string, isEnabled *bool) ([]*models.FeatureFlag, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, environment, isEnabled)
}

func (s *featureFlagService) ListFlagsByEnvironment(ctx context.Context, environment string) ([]*models.FeatureFlag, error) {
	return s.repo.ListByEnvironment(ctx, environment)
}

func (s *featureFlagService) ListEnabledFlags(ctx context.Context, environment string) ([]*models.FeatureFlag, error) {
	return s.repo.ListEnabled(ctx, environment)
}

func (s *featureFlagService) UpdateFlag(ctx context.Context, id uuid.UUID, req *models.UpdateFeatureFlagRequest) (*models.FeatureFlag, error) {
	flag, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.FlagName != nil {
		flag.FlagName = *req.FlagName
	}

	if req.Description != nil {
		if *req.Description == "" {
			flag.Description.Valid = false
		} else {
			flag.Description.String = *req.Description
			flag.Description.Valid = true
		}
	}

	if req.IsEnabled != nil {
		flag.IsEnabled = *req.IsEnabled
	}

	if req.Environment != nil {
		flag.Environment = *req.Environment
	}

	if req.FlagType != nil {
		flag.FlagType = *req.FlagType
	}

	if req.TargetAudience != nil {
		if *req.TargetAudience == "" {
			flag.TargetAudience.Valid = false
		} else {
			flag.TargetAudience.String = *req.TargetAudience
			flag.TargetAudience.Valid = true
		}
	}

	if req.PercentageRollout != nil {
		flag.PercentageRollout = *req.PercentageRollout
	}

	if req.Conditions != nil {
		conditionsJSON, err := json.Marshal(*req.Conditions)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal conditions: %w", err)
		}
		flag.Conditions = conditionsJSON
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		flag.Metadata = metadataJSON
	}

	flag.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, flag); err != nil {
		return nil, fmt.Errorf("failed to update feature flag: %w", err)
	}

	return flag, nil
}

func (s *featureFlagService) EnableFlag(ctx context.Context, id uuid.UUID) error {
	return s.repo.Enable(ctx, id)
}

func (s *featureFlagService) DisableFlag(ctx context.Context, id uuid.UUID) error {
	return s.repo.Disable(ctx, id)
}

func (s *featureFlagService) UpdateRolloutPercentage(ctx context.Context, id uuid.UUID, percentage int) error {
	if percentage < 0 || percentage > 100 {
		return fmt.Errorf("percentage must be between 0 and 100")
	}
	return s.repo.UpdateRolloutPercentage(ctx, id, percentage)
}

func (s *featureFlagService) DeleteFlag(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *featureFlagService) IsFeatureEnabled(ctx context.Context, key string, environment string) (bool, error) {
	flag, err := s.repo.GetByKey(ctx, key)
	if err != nil {
		return false, err
	}

	if flag.Environment != environment {
		return false, nil
	}

	return flag.IsEnabled, nil
}
