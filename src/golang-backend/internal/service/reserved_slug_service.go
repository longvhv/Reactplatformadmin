package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type ReservedSlugService struct {
	slugRepo repository.ReservedSlugRepository
}

func NewReservedSlugService(slugRepo repository.ReservedSlugRepository) *ReservedSlugService {
	return &ReservedSlugService{
		slugRepo: slugRepo,
	}
}

type CreateReservedSlugRequest struct {
	Slug          string                 `json:"slug" binding:"required"`
	Type          string                 `json:"type" binding:"required"`
	MatchType     string                 `json:"match_type"`
	ItemsSnapshot map[string]interface{} `json:"items_snapshot"`
	Reason        *string                `json:"reason"`
	IsActive      bool                   `json:"is_active"`
}

type UpdateReservedSlugRequest struct {
	Type          *string                `json:"type"`
	MatchType     *string                `json:"match_type"`
	ItemsSnapshot map[string]interface{} `json:"items_snapshot"`
	Reason        *string                `json:"reason"`
	IsActive      *bool                  `json:"is_active"`
}

// GetByID gets reserved slug by ID
func (s *ReservedSlugService) GetByID(ctx context.Context, id uuid.UUID) (*models.ReservedSlug, error) {
	return s.slugRepo.GetByID(ctx, id)
}

// GetBySlug gets reserved slug by slug string
func (s *ReservedSlugService) GetBySlug(ctx context.Context, slug string) (*models.ReservedSlug, error) {
	return s.slugRepo.GetBySlug(ctx, slug)
}

// ListSlugs lists all reserved slugs
func (s *ReservedSlugService) ListSlugs(ctx context.Context, slugType, matchType string, page, limit int) ([]*models.ReservedSlug, int64, error) {
	offset := (page - 1) * limit
	return s.slugRepo.List(ctx, slugType, matchType, limit, offset)
}

// IsSlugReserved checks if a slug is reserved
func (s *ReservedSlugService) IsSlugReserved(ctx context.Context, slug string) (bool, string, error) {
	// Normalize slug
	normalizedSlug := strings.ToLower(strings.TrimSpace(slug))

	// Get all active reserved slugs
	allSlugs, _, err := s.slugRepo.List(ctx, "", "", 1000, 0)
	if err != nil {
		return false, "", fmt.Errorf("failed to get reserved slugs: %w", err)
	}

	for _, reserved := range allSlugs {
		if !reserved.IsActive {
			continue
		}

		isMatch := false
		switch reserved.MatchType {
		case "EXACT":
			isMatch = normalizedSlug == strings.ToLower(reserved.Slug)
		case "PREFIX":
			isMatch = strings.HasPrefix(normalizedSlug, strings.ToLower(reserved.Slug))
		case "REGEX":
			pattern, err := regexp.Compile(reserved.Slug)
			if err == nil {
				isMatch = pattern.MatchString(normalizedSlug)
			}
		}

		if isMatch {
			reason := "Slug is reserved"
			if reserved.Reason != nil {
				reason = *reserved.Reason
			}
			return true, reason, nil
		}
	}

	return false, "", nil
}

// CreateSlug creates a new reserved slug
func (s *ReservedSlugService) CreateSlug(ctx context.Context, req CreateReservedSlugRequest) (*models.ReservedSlug, error) {
	// Validate slug format
	if !s.isValidSlugFormat(req.Slug) {
		return nil, fmt.Errorf("invalid slug format, must match ^[a-z0-9-]+$")
	}

	// Check if slug already exists (for EXACT match type)
	if req.MatchType == "" || req.MatchType == "EXACT" {
		existing, err := s.slugRepo.GetBySlug(ctx, req.Slug)
		if err == nil && existing != nil {
			return nil, fmt.Errorf("slug already reserved")
		}
	}

	matchType := req.MatchType
	if matchType == "" {
		matchType = "EXACT"
	}

	itemsSnapshot := req.ItemsSnapshot
	if itemsSnapshot == nil {
		itemsSnapshot = make(map[string]interface{})
	}

	slug := &models.ReservedSlug{
		ID:            uuid.New(),
		Slug:          req.Slug,
		Type:          req.Type,
		MatchType:     matchType,
		ItemsSnapshot: itemsSnapshot,
		Reason:        req.Reason,
		IsActive:      req.IsActive,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		Version:       1,
	}

	if err := s.slugRepo.Create(ctx, slug); err != nil {
		return nil, fmt.Errorf("failed to create reserved slug: %w", err)
	}

	return slug, nil
}

// UpdateSlug updates a reserved slug
func (s *ReservedSlugService) UpdateSlug(ctx context.Context, id uuid.UUID, req UpdateReservedSlugRequest) (*models.ReservedSlug, error) {
	slug, err := s.slugRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("slug not found: %w", err)
	}

	if req.Type != nil {
		slug.Type = *req.Type
	}
	if req.MatchType != nil {
		slug.MatchType = *req.MatchType
	}
	if req.ItemsSnapshot != nil {
		slug.ItemsSnapshot = req.ItemsSnapshot
	}
	if req.Reason != nil {
		slug.Reason = req.Reason
	}
	if req.IsActive != nil {
		slug.IsActive = *req.IsActive
	}

	slug.UpdatedAt = time.Now()
	slug.Version++

	if err := s.slugRepo.Update(ctx, slug); err != nil {
		return nil, fmt.Errorf("failed to update slug: %w", err)
	}

	return slug, nil
}

// DeleteSlug deletes a reserved slug
func (s *ReservedSlugService) DeleteSlug(ctx context.Context, id uuid.UUID) error {
	return s.slugRepo.Delete(ctx, id)
}

// Helper functions
func (s *ReservedSlugService) isValidSlugFormat(slug string) bool {
	pattern := regexp.MustCompile(`^[a-z0-9-]+$`)
	return pattern.MatchString(slug)
}

// BulkCheckSlugs checks multiple slugs at once
func (s *ReservedSlugService) BulkCheckSlugs(ctx context.Context, slugs []string) (map[string]bool, error) {
	results := make(map[string]bool)

	for _, slug := range slugs {
		isReserved, _, err := s.IsSlugReserved(ctx, slug)
		if err != nil {
			return nil, err
		}
		results[slug] = isReserved
	}

	return results, nil
}

// GetReservedSlugsByType gets reserved slugs by type
func (s *ReservedSlugService) GetReservedSlugsByType(ctx context.Context, slugType string) ([]*models.ReservedSlug, error) {
	slugs, _, err := s.slugRepo.List(ctx, slugType, "", 1000, 0)
	return slugs, err
}
