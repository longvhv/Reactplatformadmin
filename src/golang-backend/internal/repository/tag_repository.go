package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type TagRepository interface {
	Create(ctx context.Context, tag *models.Tag) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Tag, error)
	GetBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*models.Tag, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.Tag, int, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Tag, error)
	Update(ctx context.Context, tag *models.Tag) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementUsage(ctx context.Context, id uuid.UUID) error
}

type tagRepository struct {
	db *sqlx.DB
}

func NewTagRepository(db *sqlx.DB) TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) Create(ctx context.Context, tag *models.Tag) error {
	query := `
		INSERT INTO tags (
			_id, tenant_id, name, slug, description, color,
			metadata, usage_count, created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := r.db.ExecContext(ctx, query,
		tag.ID, tag.TenantID, tag.Name, tag.Slug, tag.Description,
		tag.Color, tag.Metadata, tag.UsageCount, tag.CreatedAt,
		tag.UpdatedAt, tag.Version,
	)
	return err
}

func (r *tagRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	var tag models.Tag
	query := `SELECT * FROM tags WHERE _id = $1`
	err := r.db.GetContext(ctx, &tag, query, id)
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) GetBySlug(ctx context.Context, tenantID uuid.UUID, slug string) (*models.Tag, error) {
	var tag models.Tag
	query := `SELECT * FROM tags WHERE tenant_id = $1 AND slug = $2`
	err := r.db.GetContext(ctx, &tag, query, tenantID, slug)
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.Tag, int, error) {
	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tags %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM tags %s
		ORDER BY name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	var tags []*models.Tag
	err = r.db.SelectContext(ctx, &tags, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return tags, total, nil
}

func (r *tagRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Tag, error) {
	query := `SELECT * FROM tags WHERE tenant_id = $1 ORDER BY name ASC`

	var tags []*models.Tag
	err := r.db.SelectContext(ctx, &tags, query, tenantID)
	if err != nil {
		return nil, err
	}

	return tags, nil
}

func (r *tagRepository) Update(ctx context.Context, tag *models.Tag) error {
	query := `
		UPDATE tags SET
			name = $1,
			description = $2,
			color = $3,
			metadata = $4,
			updated_at = $5,
			version = version + 1
		WHERE _id = $6`

	tag.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		tag.Name, tag.Description, tag.Color, tag.Metadata,
		tag.UpdatedAt, tag.ID,
	)
	return err
}

func (r *tagRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tags WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *tagRepository) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE tags SET usage_count = usage_count + 1, updated_at = $1 WHERE _id = $2`
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}
