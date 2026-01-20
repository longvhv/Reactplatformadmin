package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type TagService interface {
	CreateTag(ctx context.Context, req *models.CreateTagRequest) (*models.Tag, error)
	GetTag(ctx context.Context, id uuid.UUID) (*models.Tag, error)
	GetTagBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*models.Tag, error)
	ListTags(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.Tag, int, error)
	ListTagsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Tag, error)
	UpdateTag(ctx context.Context, id uuid.UUID, req *models.UpdateTagRequest) (*models.Tag, error)
	DeleteTag(ctx context.Context, id uuid.UUID) error
	IncrementUsage(ctx context.Context, id uuid.UUID) error
}

type tagService struct {
	repo repository.TagRepository
}

func NewTagService(repo repository.TagRepository) TagService {
	return &tagService{repo: repo}
}

func (s *tagService) CreateTag(ctx context.Context, req *models.CreateTagRequest) (*models.Tag, error) {
	tag := &models.Tag{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Color:       req.Color,
		Metadata:    req.Metadata,
		UsageCount:  0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	err := s.repo.Create(ctx, tag)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *tagService) GetTag(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *tagService) GetTagBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*models.Tag, error) {
	return s.repo.GetBySlug(ctx, tenantID, slug)
}

func (s *tagService) ListTags(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.Tag, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID)
}

func (s *tagService) ListTagsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Tag, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *tagService) UpdateTag(ctx context.Context, id uuid.UUID, req *models.UpdateTagRequest) (*models.Tag, error) {
	tag, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		tag.Name = *req.Name
	}
	if req.Description != nil {
		tag.Description = req.Description
	}
	if req.Color != nil {
		tag.Color = req.Color
	}
	if req.Metadata != nil {
		tag.Metadata = req.Metadata
	}

	err = s.repo.Update(ctx, tag)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *tagService) DeleteTag(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *tagService) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementUsage(ctx, id)
}
