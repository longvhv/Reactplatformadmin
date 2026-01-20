package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type RegionRepository interface {
	Create(ctx context.Context, region *models.Region) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Region, error)
	GetByCode(ctx context.Context, code string) (*models.Region, error)
	List(ctx context.Context, page, pageSize int, regionType *string, parentID *uuid.UUID) ([]*models.Region, int, error)
	ListByType(ctx context.Context, regionType string) ([]*models.Region, error)
	ListByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Region, error)
	Update(ctx context.Context, region *models.Region) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
}

type regionRepository struct {
	db *sqlx.DB
}

func NewRegionRepository(db *sqlx.DB) RegionRepository {
	return &regionRepository{db: db}
}

func (r *regionRepository) Create(ctx context.Context, region *models.Region) error {
	query := `
		INSERT INTO regions (
			_id, code, name, type, "order", status, parent_id,
			start_date, end_date, history_data, metadata, is_system,
			is_editable, created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`

	_, err := r.db.ExecContext(ctx, query,
		region.ID, region.Code, region.Name, region.Type, region.Order,
		region.Status, region.ParentID, region.StartDate, region.EndDate,
		region.HistoryData, region.Metadata, region.IsSystem, region.IsEditable,
		region.CreatedAt, region.UpdatedAt, region.CreatedBy, region.Version,
	)
	return err
}

func (r *regionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Region, error) {
	var region models.Region
	query := `SELECT * FROM regions WHERE _id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &region, query, id)
	if err != nil {
		return nil, err
	}
	return &region, nil
}

func (r *regionRepository) GetByCode(ctx context.Context, code string) (*models.Region, error) {
	var region models.Region
	query := `SELECT * FROM regions WHERE code = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &region, query, code)
	if err != nil {
		return nil, err
	}
	return &region, nil
}

func (r *regionRepository) List(ctx context.Context, page, pageSize int, regionType *string, parentID *uuid.UUID) ([]*models.Region, int, error) {
	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if regionType != nil {
		whereClause += fmt.Sprintf(" AND type = $%d", argPos)
		args = append(args, *regionType)
		argPos++
	}

	if parentID != nil {
		whereClause += fmt.Sprintf(" AND parent_id = $%d", argPos)
		args = append(args, *parentID)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM regions %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM regions %s
		ORDER BY "order" ASC, name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	var regions []*models.Region
	err = r.db.SelectContext(ctx, &regions, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return regions, total, nil
}

func (r *regionRepository) ListByType(ctx context.Context, regionType string) ([]*models.Region, error) {
	query := `
		SELECT * FROM regions
		WHERE type = $1 AND status = 1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC
	`

	var regions []*models.Region
	err := r.db.SelectContext(ctx, &regions, query, regionType)
	if err != nil {
		return nil, err
	}

	return regions, nil
}

func (r *regionRepository) ListByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Region, error) {
	query := `
		SELECT * FROM regions
		WHERE parent_id = $1 AND status = 1 AND deleted_at IS NULL
		ORDER BY "order" ASC, name ASC
	`

	var regions []*models.Region
	err := r.db.SelectContext(ctx, &regions, query, parentID)
	if err != nil {
		return nil, err
	}

	return regions, nil
}

func (r *regionRepository) Update(ctx context.Context, region *models.Region) error {
	query := `
		UPDATE regions SET
			name = $1, "order" = $2, status = $3, parent_id = $4,
			start_date = $5, end_date = $6, history_data = $7,
			metadata = $8, updated_at = $9, updated_by = $10,
			version = version + 1
		WHERE _id = $11 AND deleted_at IS NULL`

	region.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		region.Name, region.Order, region.Status, region.ParentID,
		region.StartDate, region.EndDate, region.HistoryData,
		region.Metadata, region.UpdatedAt, region.UpdatedBy, region.ID,
	)
	return err
}

func (r *regionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM regions WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *regionRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	query := `
		UPDATE regions SET
			deleted_at = $1, deleted_by = $2, version = version + 1
		WHERE _id = $3 AND deleted_at IS NULL`

	_, err := r.db.ExecContext(ctx, query, time.Now(), deletedBy, id)
	return err
}
