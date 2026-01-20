package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type ReservedSlugService interface {
	CreateSlug(ctx context.Context, req *models.CreateReservedSlugRequest) (*models.ReservedSlug, error)
	GetSlug(ctx context.Context, id uuid.UUID) (*models.ReservedSlug, error)
	GetSlugByName(ctx context.Context, slug string) (*models.ReservedSlug, error)
	ListSlugs(ctx context.Context, page, pageSize int, slugType *string, isActive *bool) ([]*models.ReservedSlug, int, error)
	ListSlugsByType(ctx context.Context, slugType string) ([]*models.ReservedSlug, error)
	UpdateSlug(ctx context.Context, id uuid.UUID, req *models.UpdateReservedSlugRequest) (*models.ReservedSlug, error)
	DeleteSlug(ctx context.Context, id uuid.UUID) error
	CheckSlug(ctx context.Context, slug string) (*models.CheckSlugResponse, error)
	ListActiveSlugs(ctx context.Context) ([]*models.ReservedSlug, error)
}

type reservedSlugService struct {
	repo repository.ReservedSlugRepository
}

func NewReservedSlugService(repo repository.ReservedSlugRepository) ReservedSlugService {
	return &reservedSlugService{repo: repo}
}

func (s *reservedSlugService) CreateSlug(ctx context.Context, req *models.CreateReservedSlugRequest) (*models.ReservedSlug, error) {
	slug := &models.ReservedSlug{
		ID:            uuid.New(),
		Slug:          req.Slug,
		Type:          req.Type,
		MatchType:     req.MatchType,
		ItemsSnapshot: req.ItemsSnapshot,
		Reason:        req.Reason,
		IsActive:      true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		Version:       1,
	}

	err := s.repo.Create(ctx, slug)
	if err != nil {
		return nil, err
	}

	return slug, nil
}

func (s *reservedSlugService) GetSlug(ctx context.Context, id uuid.UUID) (*models.ReservedSlug, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *reservedSlugService) GetSlugByName(ctx context.Context, slug string) (*models.ReservedSlug, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *reservedSlugService) ListSlugs(ctx context.Context, page, pageSize int, slugType *string, isActive *bool) ([]*models.ReservedSlug, int, error) {
	return s.repo.List(ctx, page, pageSize, slugType, isActive)
}

func (s *reservedSlugService) ListSlugsByType(ctx context.Context, slugType string) ([]*models.ReservedSlug, error) {
	return s.repo.ListByType(ctx, slugType)
}

func (s *reservedSlugService) UpdateSlug(ctx context.Context, id uuid.UUID, req *models.UpdateReservedSlugRequest) (*models.ReservedSlug, error) {
	slug, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
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

	err = s.repo.Update(ctx, slug)
	if err != nil {
		return nil, err
	}

	return slug, nil
}

func (s *reservedSlugService) DeleteSlug(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *reservedSlugService) CheckSlug(ctx context.Context, slug string) (*models.CheckSlugResponse, error) {
	isReserved, reservedSlug, err := s.repo.CheckSlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	response := &models.CheckSlugResponse{
		IsReserved: isReserved,
	}

	if isReserved && reservedSlug != nil {
		response.Type = reservedSlug.Type
		if reservedSlug.Reason != nil {
			response.Reason = *reservedSlug.Reason
		}
	}

	return response, nil
}

func (s *reservedSlugService) ListActiveSlugs(ctx context.Context) ([]*models.ReservedSlug, error) {
	return s.repo.ListActive(ctx)
}
