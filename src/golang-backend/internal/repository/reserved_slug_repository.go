package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type ReservedSlugRepository interface {
	Create(ctx context.Context, slug *models.ReservedSlug) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ReservedSlug, error)
	GetBySlug(ctx context.Context, slug string) (*models.ReservedSlug, error)
	List(ctx context.Context, page, pageSize int, slugType *string, isActive *bool) ([]*models.ReservedSlug, int, error)
	ListByType(ctx context.Context, slugType string) ([]*models.ReservedSlug, error)
	Update(ctx context.Context, slug *models.ReservedSlug) error
	Delete(ctx context.Context, id uuid.UUID) error
	CheckSlug(ctx context.Context, slug string) (bool, *models.ReservedSlug, error)
	ListActive(ctx context.Context) ([]*models.ReservedSlug, error)
}

type reservedSlugRepository struct {
	db *sqlx.DB
}

func NewReservedSlugRepository(db *sqlx.DB) ReservedSlugRepository {
	return &reservedSlugRepository{db: db}
}

func (r *reservedSlugRepository) Create(ctx context.Context, slug *models.ReservedSlug) error {
	query := `
		INSERT INTO reserved_slugs (
			_id, slug, type, match_type, items_snapshot,
			reason, is_active, created_at, updated_at, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)`

	_, err := r.db.ExecContext(ctx, query,
		slug.ID, slug.Slug, slug.Type, slug.MatchType, slug.ItemsSnapshot,
		slug.Reason, slug.IsActive, slug.CreatedAt, slug.UpdatedAt, slug.Version,
	)
	return err
}

func (r *reservedSlugRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ReservedSlug, error) {
	var slug models.ReservedSlug
	query := `SELECT * FROM reserved_slugs WHERE _id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &slug, query, id)
	if err != nil {
		return nil, err
	}
	return &slug, nil
}

func (r *reservedSlugRepository) GetBySlug(ctx context.Context, slug string) (*models.ReservedSlug, error) {
	var reservedSlug models.ReservedSlug
	query := `SELECT * FROM reserved_slugs WHERE slug = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &reservedSlug, query, slug)
	if err != nil {
		return nil, err
	}
	return &reservedSlug, nil
}

func (r *reservedSlugRepository) List(ctx context.Context, page, pageSize int, slugType *string, isActive *bool) ([]*models.ReservedSlug, int, error) {
	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if slugType != nil {
		whereClause += fmt.Sprintf(" AND type = $%d", argPos)
		args = append(args, *slugType)
		argPos++
	}

	if isActive != nil {
		whereClause += fmt.Sprintf(" AND is_active = $%d", argPos)
		args = append(args, *isActive)
		argPos++
	}

	// Get total count
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM reserved_slugs %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query := fmt.Sprintf(`
		SELECT * FROM reserved_slugs %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	var slugs []*models.ReservedSlug
	err = r.db.SelectContext(ctx, &slugs, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return slugs, total, nil
}

func (r *reservedSlugRepository) ListByType(ctx context.Context, slugType string) ([]*models.ReservedSlug, error) {
	query := `
		SELECT * FROM reserved_slugs
		WHERE type = $1 AND is_active = true AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	var slugs []*models.ReservedSlug
	err := r.db.SelectContext(ctx, &slugs, query, slugType)
	if err != nil {
		return nil, err
	}

	return slugs, nil
}

func (r *reservedSlugRepository) Update(ctx context.Context, slug *models.ReservedSlug) error {
	query := `
		UPDATE reserved_slugs SET
			type = $1,
			match_type = $2,
			items_snapshot = $3,
			reason = $4,
			is_active = $5,
			updated_at = $6,
			version = version + 1
		WHERE _id = $7 AND deleted_at IS NULL`

	slug.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		slug.Type, slug.MatchType, slug.ItemsSnapshot, slug.Reason,
		slug.IsActive, slug.UpdatedAt, slug.ID,
	)
	return err
}

func (r *reservedSlugRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM reserved_slugs WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *reservedSlugRepository) CheckSlug(ctx context.Context, slug string) (bool, *models.ReservedSlug, error) {
	// Check for exact match
	var exactMatch models.ReservedSlug
	query := `
		SELECT * FROM reserved_slugs
		WHERE slug = $1 AND match_type = 'EXACT' AND is_active = true AND deleted_at IS NULL
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &exactMatch, query, slug)
	if err == nil {
		return true, &exactMatch, nil
	}

	// Check for prefix match
	var prefixMatches []*models.ReservedSlug
	query = `
		SELECT * FROM reserved_slugs
		WHERE match_type = 'PREFIX' AND is_active = true AND deleted_at IS NULL
	`
	err = r.db.SelectContext(ctx, &prefixMatches, query)
	if err == nil {
		for _, rs := range prefixMatches {
			if len(slug) >= len(rs.Slug) && slug[:len(rs.Slug)] == rs.Slug {
				return true, rs, nil
			}
		}
	}

	// TODO: Add regex matching if needed

	return false, nil, nil
}

func (r *reservedSlugRepository) ListActive(ctx context.Context) ([]*models.ReservedSlug, error) {
	query := `
		SELECT * FROM reserved_slugs
		WHERE is_active = true AND deleted_at IS NULL
		ORDER BY type, slug
	`

	var slugs []*models.ReservedSlug
	err := r.db.SelectContext(ctx, &slugs, query)
	if err != nil {
		return nil, err
	}

	return slugs, nil
}
