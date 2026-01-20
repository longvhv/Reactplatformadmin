package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type ArticleTypeService interface {
	CreateArticleType(ctx context.Context, req *models.CreateArticleTypeRequest) (*models.ArticleType, error)
	GetArticleType(ctx context.Context, id uuid.UUID) (*models.ArticleType, error)
	GetArticleTypeByCode(ctx context.Context, appCode, code string) (*models.ArticleType, error)
	ListArticleTypes(ctx context.Context, page, pageSize int, appCode *string) ([]*models.ArticleType, int, error)
	ListArticleTypesByApp(ctx context.Context, appCode string) ([]*models.ArticleType, error)
	UpdateArticleType(ctx context.Context, id uuid.UUID, req *models.UpdateArticleTypeRequest) (*models.ArticleType, error)
	DeleteArticleType(ctx context.Context, id uuid.UUID) error
}

type articleTypeService struct {
	repo repository.ArticleTypeRepository
}

func NewArticleTypeService(repo repository.ArticleTypeRepository) ArticleTypeService {
	return &articleTypeService{repo: repo}
}

func (s *articleTypeService) CreateArticleType(ctx context.Context, req *models.CreateArticleTypeRequest) (*models.ArticleType, error) {
	articleType := &models.ArticleType{
		ID:           uuid.New(),
		AppCode:      req.AppCode,
		Code:         req.Code,
		Name:         req.Name,
		IconURL:      req.IconURL,
		ConfigSchema: req.ConfigSchema,
		IsSystem:     false,
		IsActive:     true,
		CreatedAt:    time.Now(),
	}
	err := s.repo.Create(ctx, articleType)
	return articleType, err
}

func (s *articleTypeService) GetArticleType(ctx context.Context, id uuid.UUID) (*models.ArticleType, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *articleTypeService) GetArticleTypeByCode(ctx context.Context, appCode, code string) (*models.ArticleType, error) {
	return s.repo.GetByCode(ctx, appCode, code)
}

func (s *articleTypeService) ListArticleTypes(ctx context.Context, page, pageSize int, appCode *string) ([]*models.ArticleType, int, error) {
	return s.repo.List(ctx, page, pageSize, appCode)
}

func (s *articleTypeService) ListArticleTypesByApp(ctx context.Context, appCode string) ([]*models.ArticleType, error) {
	return s.repo.ListByApp(ctx, appCode)
}

func (s *articleTypeService) UpdateArticleType(ctx context.Context, id uuid.UUID, req *models.UpdateArticleTypeRequest) (*models.ArticleType, error) {
	articleType, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		articleType.Name = *req.Name
	}
	if req.IconURL != nil {
		articleType.IconURL = req.IconURL
	}
	if req.ConfigSchema != nil {
		articleType.ConfigSchema = req.ConfigSchema
	}
	if req.IsActive != nil {
		articleType.IsActive = *req.IsActive
	}
	err = s.repo.Update(ctx, articleType)
	return articleType, err
}

func (s *articleTypeService) DeleteArticleType(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
