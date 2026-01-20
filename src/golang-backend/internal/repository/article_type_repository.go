package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type ArticleTypeRepository interface {
	Create(ctx context.Context, articleType *models.ArticleType) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ArticleType, error)
	GetByCode(ctx context.Context, appCode, code string) (*models.ArticleType, error)
	List(ctx context.Context, page, pageSize int, appCode *string) ([]*models.ArticleType, int, error)
	ListByApp(ctx context.Context, appCode string) ([]*models.ArticleType, error)
	Update(ctx context.Context, articleType *models.ArticleType) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type articleTypeRepository struct {
	db *sqlx.DB
}

func NewArticleTypeRepository(db *sqlx.DB) ArticleTypeRepository {
	return &articleTypeRepository{db: db}
}

func (r *articleTypeRepository) Create(ctx context.Context, articleType *models.ArticleType) error {
	query := `
		INSERT INTO article_types (_id, app_code, code, name, icon_url, config_schema, is_system, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.ExecContext(ctx, query, articleType.ID, articleType.AppCode, articleType.Code,
		articleType.Name, articleType.IconURL, articleType.ConfigSchema, articleType.IsSystem,
		articleType.IsActive, articleType.CreatedAt)
	return err
}

func (r *articleTypeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ArticleType, error) {
	var articleType models.ArticleType
	query := `SELECT * FROM article_types WHERE _id = $1`
	err := r.db.GetContext(ctx, &articleType, query, id)
	if err != nil {
		return nil, err
	}
	return &articleType, nil
}

func (r *articleTypeRepository) GetByCode(ctx context.Context, appCode, code string) (*models.ArticleType, error) {
	var articleType models.ArticleType
	query := `SELECT * FROM article_types WHERE app_code = $1 AND code = $2`
	err := r.db.GetContext(ctx, &articleType, query, appCode, code)
	if err != nil {
		return nil, err
	}
	return &articleType, nil
}

func (r *articleTypeRepository) List(ctx context.Context, page, pageSize int, appCode *string) ([]*models.ArticleType, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if appCode != nil {
		whereClause += fmt.Sprintf(" AND app_code = $%d", argPos)
		args = append(args, *appCode)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM article_types %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT * FROM article_types %s ORDER BY name ASC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var articleTypes []*models.ArticleType
	err = r.db.SelectContext(ctx, &articleTypes, query, args...)
	return articleTypes, total, err
}

func (r *articleTypeRepository) ListByApp(ctx context.Context, appCode string) ([]*models.ArticleType, error) {
	query := `SELECT * FROM article_types WHERE app_code = $1 AND is_active = true ORDER BY name ASC`
	var articleTypes []*models.ArticleType
	err := r.db.SelectContext(ctx, &articleTypes, query, appCode)
	return articleTypes, err
}

func (r *articleTypeRepository) Update(ctx context.Context, articleType *models.ArticleType) error {
	query := `UPDATE article_types SET name = $1, icon_url = $2, config_schema = $3, is_active = $4 WHERE _id = $5`
	_, err := r.db.ExecContext(ctx, query, articleType.Name, articleType.IconURL, articleType.ConfigSchema,
		articleType.IsActive, articleType.ID)
	return err
}

func (r *articleTypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM article_types WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
