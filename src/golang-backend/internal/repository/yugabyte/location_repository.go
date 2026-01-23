package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

type locationRepository struct {
	db *sql.DB
}

func NewLocationRepository(db *sql.DB) *locationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) Create(ctx context.Context, location *models.Location) error {
	query := `
		INSERT INTO locations (
			_id, tenant_id, parent_id, type_id, name, code, path,
			status, address, coordinates, radius_meters, timezone,
			is_headquarter, metadata, created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`

	_, err := r.db.ExecContext(ctx, query,
		location.ID, location.TenantID, location.ParentID, location.TypeID,
		location.Name, location.Code, location.Path, location.Status,
		location.Address, location.Coordinates, location.RadiusMeters,
		location.Timezone, location.IsHeadquarter, location.Metadata,
		location.CreatedAt, location.UpdatedAt, location.Version,
	)

	return err
}

func (r *locationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	query := `
		SELECT _id, tenant_id, parent_id, type_id, name, code, path,
			status, address, coordinates, radius_meters, timezone,
			is_headquarter, metadata, created_at, updated_at, deleted_at, version
		FROM locations
		WHERE _id = $1 AND deleted_at IS NULL`

	loc := &models.Location{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&loc.ID, &loc.TenantID, &loc.ParentID, &loc.TypeID, &loc.Name,
		&loc.Code, &loc.Path, &loc.Status, &loc.Address, &loc.Coordinates,
		&loc.RadiusMeters, &loc.Timezone, &loc.IsHeadquarter, &loc.Metadata,
		&loc.CreatedAt, &loc.UpdatedAt, &loc.DeletedAt, &loc.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("location not found")
	}

	return loc, err
}

func (r *locationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Location, int, error) {
	// Count
	countQuery := `SELECT COUNT(*) FROM locations WHERE tenant_id = $1 AND deleted_at IS NULL`
	var total int
	r.db.QueryRowContext(ctx, countQuery, tenantID).Scan(&total)

	// List
	offset := (page - 1) * limit
	query := `
		SELECT _id, tenant_id, parent_id, type_id, name, code,
			status, is_headquarter, timezone, created_at, updated_at, version
		FROM locations
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY is_headquarter DESC, name ASC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	locations := []*models.Location{}
	for rows.Next() {
		loc := &models.Location{}
		rows.Scan(&loc.ID, &loc.TenantID, &loc.ParentID, &loc.TypeID,
			&loc.Name, &loc.Code, &loc.Status, &loc.IsHeadquarter,
			&loc.Timezone, &loc.CreatedAt, &loc.UpdatedAt, &loc.Version)
		locations = append(locations, loc)
	}

	return locations, total, nil
}

func (r *locationRepository) Update(ctx context.Context, location *models.Location) error {
	query := `
		UPDATE locations SET
			name = $2, code = $3, parent_id = $4, status = $5,
			address = $6, coordinates = $7, radius_meters = $8,
			timezone = $9, is_headquarter = $10, metadata = $11,
			updated_at = $12, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		location.ID, location.Name, location.Code, location.ParentID,
		location.Status, location.Address, location.Coordinates,
		location.RadiusMeters, location.Timezone, location.IsHeadquarter,
		location.Metadata, location.UpdatedAt,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("location not found")
	}

	return nil
}

func (r *locationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE locations SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("location not found")
	}

	return nil
}
