package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type SystemAnnouncementService interface {
	CreateAnnouncement(ctx context.Context, req *models.CreateSystemAnnouncementRequest) (*models.SystemAnnouncement, error)
	GetAnnouncement(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error)
	ListAnnouncements(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.SystemAnnouncement, int, error)
	ListAnnouncementsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error)
	ListPublishedAnnouncements(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error)
	UpdateAnnouncement(ctx context.Context, id uuid.UUID, req *models.UpdateSystemAnnouncementRequest) (*models.SystemAnnouncement, error)
	DeleteAnnouncement(ctx context.Context, id uuid.UUID) error
	SoftDeleteAnnouncement(ctx context.Context, id uuid.UUID, deletedBy string) error
	PublishAnnouncement(ctx context.Context, id uuid.UUID) error
	IncrementView(ctx context.Context, id uuid.UUID) error
	IncrementClick(ctx context.Context, id uuid.UUID) error
}

type systemAnnouncementService struct {
	repo repository.SystemAnnouncementRepository
}

func NewSystemAnnouncementService(repo repository.SystemAnnouncementRepository) SystemAnnouncementService {
	return &systemAnnouncementService{repo: repo}
}

func (s *systemAnnouncementService) CreateAnnouncement(ctx context.Context, req *models.CreateSystemAnnouncementRequest) (*models.SystemAnnouncement, error) {
	isPinned := false
	if req.IsPinned != nil {
		isPinned = *req.IsPinned
	}

	announcement := &models.SystemAnnouncement{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		Title:           req.Title,
		Content:         req.Content,
		Type:            req.Type,
		Priority:        req.Priority,
		Category:        req.Category,
		Status:          "draft",
		IsPublished:     false,
		IsPinned:        isPinned,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		TargetAudience:  req.TargetAudience,
		DisplayLocation: req.DisplayLocation,
		Icon:            req.Icon,
		Color:           req.Color,
		LinkURL:         req.LinkURL,
		LinkText:        req.LinkText,
		Attachments:     req.Attachments,
		Metadata:        req.Metadata,
		ViewCount:       0,
		ClickCount:      0,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	err := s.repo.Create(ctx, announcement)
	if err != nil {
		return nil, err
	}
	return announcement, nil
}

func (s *systemAnnouncementService) GetAnnouncement(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *systemAnnouncementService) ListAnnouncements(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.SystemAnnouncement, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, status)
}

func (s *systemAnnouncementService) ListAnnouncementsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *systemAnnouncementService) ListPublishedAnnouncements(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error) {
	return s.repo.ListPublished(ctx, tenantID)
}

func (s *systemAnnouncementService) UpdateAnnouncement(ctx context.Context, id uuid.UUID, req *models.UpdateSystemAnnouncementRequest) (*models.SystemAnnouncement, error) {
	announcement, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
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
	if req.Priority != nil {
		announcement.Priority = *req.Priority
	}
	if req.Category != nil {
		announcement.Category = req.Category
	}
	if req.Status != nil {
		announcement.Status = *req.Status
	}
	if req.IsPinned != nil {
		announcement.IsPinned = *req.IsPinned
	}
	if req.StartDate != nil {
		announcement.StartDate = req.StartDate
	}
	if req.EndDate != nil {
		announcement.EndDate = req.EndDate
	}
	if req.TargetAudience != nil {
		announcement.TargetAudience = req.TargetAudience
	}
	if req.DisplayLocation != nil {
		announcement.DisplayLocation = req.DisplayLocation
	}
	if req.Icon != nil {
		announcement.Icon = req.Icon
	}
	if req.Color != nil {
		announcement.Color = req.Color
	}
	if req.LinkURL != nil {
		announcement.LinkURL = req.LinkURL
	}
	if req.LinkText != nil {
		announcement.LinkText = req.LinkText
	}
	if req.Attachments != nil {
		announcement.Attachments = req.Attachments
	}
	if req.Metadata != nil {
		announcement.Metadata = req.Metadata
	}

	err = s.repo.Update(ctx, announcement)
	if err != nil {
		return nil, err
	}
	return announcement, nil
}

func (s *systemAnnouncementService) DeleteAnnouncement(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *systemAnnouncementService) SoftDeleteAnnouncement(ctx context.Context, id uuid.UUID, deletedBy string) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}

func (s *systemAnnouncementService) PublishAnnouncement(ctx context.Context, id uuid.UUID) error {
	return s.repo.Publish(ctx, id)
}

func (s *systemAnnouncementService) IncrementView(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementView(ctx, id)
}

func (s *systemAnnouncementService) IncrementClick(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementClick(ctx, id)
}
