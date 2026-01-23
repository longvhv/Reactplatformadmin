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

type TagService struct {
	tagRepo repository.TagRepository
}

func NewTagService(tagRepo repository.TagRepository) *TagService {
	return &TagService{
		tagRepo: tagRepo,
	}
}

type CreateTagRequest struct {
	TenantID    uuid.UUID              `json:"tenant_id" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Slug        string                 `json:"slug"`
	Description *string                `json:"description"`
	Color       *string                `json:"color"`
	Icon        *string                `json:"icon"`
	Category    *string                `json:"category"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type UpdateTagRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	Color       *string                `json:"color"`
	Icon        *string                `json:"icon"`
	Category    *string                `json:"category"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// GetByID gets tag by ID
func (s *TagService) GetByID(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	return s.tagRepo.GetByID(ctx, id)
}

// GetBySlug gets tag by slug
func (s *TagService) GetBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*models.Tag, error) {
	return s.tagRepo.GetBySlug(ctx, tenantID, slug)
}

// ListByTenant lists tags by tenant
func (s *TagService) ListByTenant(ctx context.Context, tenantID uuid.UUID, category string, page, limit int) ([]*models.Tag, int64, error) {
	offset := (page - 1) * limit
	return s.tagRepo.ListByTenant(ctx, tenantID, category, limit, offset)
}

// CreateTag creates a new tag
func (s *TagService) CreateTag(ctx context.Context, req CreateTagRequest) (*models.Tag, error) {
	// Generate slug if not provided
	slug := req.Slug
	if slug == "" {
		slug = s.generateSlug(req.Name)
	}

	// Validate slug format
	if !s.isValidSlug(slug) {
		return nil, fmt.Errorf("invalid slug format, must match ^[a-z0-9-]+$")
	}

	// Check if slug exists for this tenant
	existing, err := s.tagRepo.GetBySlug(ctx, req.TenantID, slug)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("tag slug already exists for this tenant")
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	tag := &models.Tag{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		Name:        req.Name,
		Slug:        slug,
		Description: req.Description,
		Color:       req.Color,
		Icon:        req.Icon,
		Category:    req.Category,
		UsageCount:  0,
		Metadata:    metadata,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	if err := s.tagRepo.Create(ctx, tag); err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}

	return tag, nil
}

// UpdateTag updates a tag
func (s *TagService) UpdateTag(ctx context.Context, id uuid.UUID, req UpdateTagRequest) (*models.Tag, error) {
	tag, err := s.tagRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("tag not found: %w", err)
	}

	if req.Name != nil {
		tag.Name = *req.Name
		// Regenerate slug from new name
		tag.Slug = s.generateSlug(*req.Name)
	}
	if req.Description != nil {
		tag.Description = req.Description
	}
	if req.Color != nil {
		tag.Color = req.Color
	}
	if req.Icon != nil {
		tag.Icon = req.Icon
	}
	if req.Category != nil {
		tag.Category = req.Category
	}
	if req.Metadata != nil {
		tag.Metadata = req.Metadata
	}

	tag.UpdatedAt = time.Now()
	tag.Version++

	if err := s.tagRepo.Update(ctx, tag); err != nil {
		return nil, fmt.Errorf("failed to update tag: %w", err)
	}

	return tag, nil
}

// DeleteTag deletes a tag
func (s *TagService) DeleteTag(ctx context.Context, id uuid.UUID) error {
	tag, err := s.tagRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("tag not found: %w", err)
	}

	if tag.UsageCount > 0 {
		return fmt.Errorf("cannot delete tag with usage count > 0")
	}

	return s.tagRepo.Delete(ctx, id)
}

// SearchTags searches tags by name
func (s *TagService) SearchTags(ctx context.Context, tenantID uuid.UUID, query string, limit int) ([]*models.Tag, error) {
	return s.tagRepo.Search(ctx, tenantID, query, limit)
}

// GetPopularTags gets popular tags
func (s *TagService) GetPopularTags(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Tag, error) {
	return s.tagRepo.GetPopular(ctx, tenantID, limit)
}

// IncrementUsage increments tag usage count
func (s *TagService) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	tag, err := s.tagRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("tag not found: %w", err)
	}

	tag.UsageCount++
	tag.UpdatedAt = time.Now()

	return s.tagRepo.Update(ctx, tag)
}

// DecrementUsage decrements tag usage count
func (s *TagService) DecrementUsage(ctx context.Context, id uuid.UUID) error {
	tag, err := s.tagRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("tag not found: %w", err)
	}

	if tag.UsageCount > 0 {
		tag.UsageCount--
		tag.UpdatedAt = time.Now()
		return s.tagRepo.Update(ctx, tag)
	}

	return nil
}

// MergeTags merges source tag into target tag
func (s *TagService) MergeTags(ctx context.Context, sourceID, targetID uuid.UUID) (*models.Tag, error) {
	sourceTag, err := s.tagRepo.GetByID(ctx, sourceID)
	if err != nil {
		return nil, fmt.Errorf("source tag not found: %w", err)
	}

	targetTag, err := s.tagRepo.GetByID(ctx, targetID)
	if err != nil {
		return nil, fmt.Errorf("target tag not found: %w", err)
	}

	// Update target tag usage count
	targetTag.UsageCount += sourceTag.UsageCount
	targetTag.UpdatedAt = time.Now()
	targetTag.Version++

	if err := s.tagRepo.Update(ctx, targetTag); err != nil {
		return nil, fmt.Errorf("failed to update target tag: %w", err)
	}

	// Delete source tag
	if err := s.tagRepo.Delete(ctx, sourceID); err != nil {
		return nil, fmt.Errorf("failed to delete source tag: %w", err)
	}

	// TODO: Update all references from source tag to target tag in other tables

	return targetTag, nil
}

// GetOrCreateTag gets existing tag or creates new one
func (s *TagService) GetOrCreateTag(ctx context.Context, tenantID uuid.UUID, name string) (*models.Tag, error) {
	slug := s.generateSlug(name)

	// Try to get existing tag
	tag, err := s.tagRepo.GetBySlug(ctx, tenantID, slug)
	if err == nil && tag != nil {
		return tag, nil
	}

	// Create new tag
	return s.CreateTag(ctx, CreateTagRequest{
		TenantID: tenantID,
		Name:     name,
		Slug:     slug,
	})
}

// BulkGetOrCreateTags gets or creates multiple tags
func (s *TagService) BulkGetOrCreateTags(ctx context.Context, tenantID uuid.UUID, names []string) ([]*models.Tag, error) {
	tags := make([]*models.Tag, 0, len(names))

	for _, name := range names {
		tag, err := s.GetOrCreateTag(ctx, tenantID, name)
		if err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

// Helper functions
func (s *TagService) generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.TrimSpace(slug)
	
	// Replace spaces and special characters with hyphens
	slug = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(slug, "-")
	
	// Remove leading/trailing hyphens
	slug = strings.Trim(slug, "-")
	
	// Remove consecutive hyphens
	slug = regexp.MustCompile(`-+`).ReplaceAllString(slug, "-")
	
	return slug
}

func (s *TagService) isValidSlug(slug string) bool {
	pattern := regexp.MustCompile(`^[a-z0-9-]+$`)
	return pattern.MatchString(slug)
}

// GetTagsByIDs gets multiple tags by IDs
func (s *TagService) GetTagsByIDs(ctx context.Context, ids []uuid.UUID) ([]*models.Tag, error) {
	tags := make([]*models.Tag, 0, len(ids))

	for _, id := range ids {
		tag, err := s.tagRepo.GetByID(ctx, id)
		if err == nil {
			tags = append(tags, tag)
		}
	}

	return tags, nil
}
