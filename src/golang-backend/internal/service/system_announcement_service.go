package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type SystemAnnouncementService struct {
	announcementRepo repository.SystemAnnouncementRepository
	cacheService     *CacheService
}

func NewSystemAnnouncementService(announcementRepo repository.SystemAnnouncementRepository, cacheService *CacheService) *SystemAnnouncementService {
	return &SystemAnnouncementService{
		announcementRepo: announcementRepo,
		cacheService:     cacheService,
	}
}

type CreateSystemAnnouncementRequest struct {
	TenantID       uuid.UUID              `json:"tenant_id" binding:"required"`
	Title          string                 `json:"title" binding:"required"`
	Content        string                 `json:"content" binding:"required"`
	Type           string                 `json:"type"`
	Severity       string                 `json:"severity"`
	TargetAudience string                 `json:"target_audience"`
	StartDate      *string                `json:"start_date"`
	EndDate        *string                `json:"end_date"`
	IsPinned       bool                   `json:"is_pinned"`
	IsGlobal       bool                   `json:"is_global"`
	Tags           []string               `json:"tags"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedBy      string                 `json:"-"`
}

type UpdateSystemAnnouncementRequest struct {
	Title          *string                `json:"title"`
	Content        *string                `json:"content"`
	Type           *string                `json:"type"`
	Severity       *string                `json:"severity"`
	TargetAudience *string                `json:"target_audience"`
	StartDate      *string                `json:"start_date"`
	EndDate        *string                `json:"end_date"`
	IsPinned       *bool                  `json:"is_pinned"`
	IsGlobal       *bool                  `json:"is_global"`
	Tags           []string               `json:"tags"`
	Metadata       map[string]interface{} `json:"metadata"`
	UpdatedBy      string                 `json:"-"`
}

// GetByID gets announcement by ID
func (s *SystemAnnouncementService) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error) {
	return s.announcementRepo.GetByID(ctx, id)
}

// ListByTenant lists announcements by tenant
func (s *SystemAnnouncementService) ListByTenant(ctx context.Context, tenantID uuid.UUID, announcementType, status string, page, limit int) ([]*models.SystemAnnouncement, int64, error) {
	offset := (page - 1) * limit
	return s.announcementRepo.ListByTenant(ctx, tenantID, announcementType, status, limit, offset)
}

// GetActiveAnnouncements gets active announcements
func (s *SystemAnnouncementService) GetActiveAnnouncements(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("active_announcements:tenant:%s", tenantID)
	var cached []*models.SystemAnnouncement
	if s.cacheService != nil && s.cacheService.Get(ctx, cacheKey, &cached) == nil {
		return cached, nil
	}

	announcements, _, err := s.announcementRepo.ListByTenant(ctx, tenantID, "", "PUBLISHED", 1000, 0)
	if err != nil {
		return nil, err
	}

	// Filter active announcements
	now := time.Now()
	active := make([]*models.SystemAnnouncement, 0)
	for _, a := range announcements {
		if a.Status == "PUBLISHED" {
			// Check date range
			if a.StartDate != nil && a.StartDate.After(now) {
				continue
			}
			if a.EndDate != nil && a.EndDate.Before(now) {
				continue
			}
			active = append(active, a)
		}
	}

	// Cache for 5 minutes
	if s.cacheService != nil {
		_ = s.cacheService.Set(ctx, cacheKey, active, 5*time.Minute)
	}

	return active, nil
}

// CreateAnnouncement creates a new announcement
func (s *SystemAnnouncementService) CreateAnnouncement(ctx context.Context, req CreateSystemAnnouncementRequest) (*models.SystemAnnouncement, error) {
	announcementType := req.Type
	if announcementType == "" {
		announcementType = "info"
	}

	severity := req.Severity
	if severity == "" {
		severity = "normal"
	}

	targetAudience := req.TargetAudience
	if targetAudience == "" {
		targetAudience = "all"
	}

	var startDate, endDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.StartDate)
		if err == nil {
			startDate = &parsed
		}
	}
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EndDate)
		if err == nil {
			endDate = &parsed
		}
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	announcement := &models.SystemAnnouncement{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		Title:          req.Title,
		Content:        req.Content,
		Type:           announcementType,
		Severity:       severity,
		TargetAudience: targetAudience,
		Status:         "DRAFT",
		StartDate:      startDate,
		EndDate:        endDate,
		IsPinned:       req.IsPinned,
		IsGlobal:       req.IsGlobal,
		ReadCount:      0,
		ViewCount:      0,
		Tags:           tags,
		Metadata:       metadata,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		CreatedBy:      &req.CreatedBy,
		Version:        1,
	}

	if err := s.announcementRepo.Create(ctx, announcement); err != nil {
		return nil, fmt.Errorf("failed to create announcement: %w", err)
	}

	return announcement, nil
}

// UpdateAnnouncement updates an announcement
func (s *SystemAnnouncementService) UpdateAnnouncement(ctx context.Context, id uuid.UUID, req UpdateSystemAnnouncementRequest) (*models.SystemAnnouncement, error) {
	announcement, err := s.announcementRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("announcement not found: %w", err)
	}

	if req.Title != nil {
		announcement.Title = *req.Title
	}
	if req.Content != nil {
		announcement.Content = *req.Content
	}
	if req.Type != nil {
		announcement.Type = *req.Type
	}
	if req.Severity != nil {
		announcement.Severity = *req.Severity
	}
	if req.TargetAudience != nil {
		announcement.TargetAudience = *req.TargetAudience
	}
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.StartDate)
		if err == nil {
			announcement.StartDate = &parsed
		}
	}
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EndDate)
		if err == nil {
			announcement.EndDate = &parsed
		}
	}
	if req.IsPinned != nil {
		announcement.IsPinned = *req.IsPinned
	}
	if req.IsGlobal != nil {
		announcement.IsGlobal = *req.IsGlobal
	}
	if req.Tags != nil {
		announcement.Tags = req.Tags
	}
	if req.Metadata != nil {
		announcement.Metadata = req.Metadata
	}

	announcement.UpdatedAt = time.Now()
	announcement.UpdatedBy = &req.UpdatedBy
	announcement.Version++

	if err := s.announcementRepo.Update(ctx, announcement); err != nil {
		return nil, fmt.Errorf("failed to update announcement: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, announcement.TenantID)

	return announcement, nil
}

// DeleteAnnouncement deletes an announcement
func (s *SystemAnnouncementService) DeleteAnnouncement(ctx context.Context, id uuid.UUID) error {
	announcement, err := s.announcementRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.announcementRepo.Delete(ctx, id); err != nil {
		return err
	}

	// Invalidate cache
	s.invalidateCache(ctx, announcement.TenantID)

	return nil
}

// PublishAnnouncement publishes an announcement
func (s *SystemAnnouncementService) PublishAnnouncement(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error) {
	announcement, err := s.announcementRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("announcement not found: %w", err)
	}

	now := time.Now()
	announcement.Status = "PUBLISHED"
	announcement.PublishedAt = &now
	announcement.UpdatedAt = now
	announcement.Version++

	if err := s.announcementRepo.Update(ctx, announcement); err != nil {
		return nil, fmt.Errorf("failed to publish announcement: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, announcement.TenantID)

	return announcement, nil
}

// ArchiveAnnouncement archives an announcement
func (s *SystemAnnouncementService) ArchiveAnnouncement(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error) {
	announcement, err := s.announcementRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("announcement not found: %w", err)
	}

	now := time.Now()
	announcement.Status = "ARCHIVED"
	announcement.ArchivedAt = &now
	announcement.UpdatedAt = now
	announcement.Version++

	if err := s.announcementRepo.Update(ctx, announcement); err != nil {
		return nil, fmt.Errorf("failed to archive announcement: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, announcement.TenantID)

	return announcement, nil
}

// MarkAsRead marks announcement as read by user
func (s *SystemAnnouncementService) MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error {
	announcement, err := s.announcementRepo.GetByID(ctx, announcementID)
	if err != nil {
		return fmt.Errorf("announcement not found: %w", err)
	}

	// Increment read count
	announcement.ReadCount++
	announcement.UpdatedAt = time.Now()

	// Store user read record (would typically be in a separate table)
	// For now, just update the announcement

	return s.announcementRepo.Update(ctx, announcement)
}

// IncrementViewCount increments view count
func (s *SystemAnnouncementService) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	announcement, err := s.announcementRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	announcement.ViewCount++
	announcement.UpdatedAt = time.Now()

	return s.announcementRepo.Update(ctx, announcement)
}

// Helper functions
func (s *SystemAnnouncementService) invalidateCache(ctx context.Context, tenantID uuid.UUID) {
	if s.cacheService != nil {
		cacheKey := fmt.Sprintf("active_announcements:tenant:%s", tenantID)
		_ = s.cacheService.Delete(ctx, cacheKey)
	}
}
