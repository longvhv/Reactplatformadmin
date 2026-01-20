package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type LocationRepository interface {
	Create(ctx context.Context, location *models.Location) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, typeID *uuid.UUID, status *string) ([]*models.Location, int, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Location, error)
	ListByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Location, error)
	Update(ctx context.Context, location *models.Location) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
}

type locationRepository struct {
	db *sqlx.DB
}

func NewLocationRepository(db *sqlx.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) Create(ctx context.Context, location *models.Location) error {
	query := `
		INSERT INTO locations (_id, tenant_id, parent_id, type_id, name, code, path, status, address,
		coordinates, radius_meters, timezone, is_headquarter, metadata, created_at, updated_at, version)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`
	_, err := r.db.ExecContext(ctx, query, location.ID, location.TenantID, location.ParentID, location.TypeID,
		location.Name, location.Code, location.Path, location.Status, location.Address, location.Coordinates,
		location.RadiusMeters, location.Timezone, location.IsHeadquarter, location.Metadata,
		location.CreatedAt, location.UpdatedAt, location.Version)
	return err
}

func (r *locationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	var location models.Location
	query := `SELECT * FROM locations WHERE _id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &location, query, id)
	return &location, err
}

func (r *locationRepository) List(ctx context.Context, page, pageSize int, tenantID, typeID *uuid.UUID, status *string) ([]*models.Location, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}
	if typeID != nil {
		whereClause += fmt.Sprintf(" AND type_id = $%d", argPos)
		args = append(args, *typeID)
		argPos++
	}
	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM locations %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM locations %s ORDER BY name ASC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var locations []*models.Location
	err := r.db.SelectContext(ctx, &locations, query, args...)
	return locations, total, err
}

func (r *locationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Location, error) {
	query := `SELECT * FROM locations WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name ASC`
	var locations []*models.Location
	err := r.db.SelectContext(ctx, &locations, query, tenantID)
	return locations, err
}

func (r *locationRepository) ListByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Location, error) {
	query := `SELECT * FROM locations WHERE parent_id = $1 AND deleted_at IS NULL ORDER BY name ASC`
	var locations []*models.Location
	err := r.db.SelectContext(ctx, &locations, query, parentID)
	return locations, err
}

func (r *locationRepository) Update(ctx context.Context, location *models.Location) error {
	query := `
		UPDATE locations SET name = $1, code = $2, status = $3, address = $4, coordinates = $5,
		radius_meters = $6, timezone = $7, is_headquarter = $8, metadata = $9, updated_at = $10,
		version = version + 1 WHERE _id = $11 AND deleted_at IS NULL`
	location.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query, location.Name, location.Code, location.Status, location.Address,
		location.Coordinates, location.RadiusMeters, location.Timezone, location.IsHeadquarter,
		location.Metadata, location.UpdatedAt, location.ID)
	return err
}

func (r *locationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM locations WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *locationRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE locations SET deleted_at = $1, version = version + 1 WHERE _id = $2 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}
