package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type LocationTypeRepository interface {
	Create(ctx context.Context, locationType *models.LocationType) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.LocationType, error)
	GetByCode(ctx context.Context, code string) (*models.LocationType, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.LocationType, int, error)
	ListActive(ctx context.Context) ([]*models.LocationType, error)
	Update(ctx context.Context, locationType *models.LocationType) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type locationTypeRepository struct {
	db *sqlx.DB
}

func NewLocationTypeRepository(db *sqlx.DB) LocationTypeRepository {
	return &locationTypeRepository{db: db}
}

func (r *locationTypeRepository) Create(ctx context.Context, locationType *models.LocationType) error {
	query := `
		INSERT INTO location_types (_id, tenant_id, code, name, description, extra_fields, is_system, is_active, created_at, updated_at, version)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
	_, err := r.db.ExecContext(ctx, query, locationType.ID, locationType.TenantID, locationType.Code,
		locationType.Name, locationType.Description, locationType.ExtraFields, locationType.IsSystem,
		locationType.IsActive, locationType.CreatedAt, locationType.UpdatedAt, locationType.Version)
	return err
}

func (r *locationTypeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.LocationType, error) {
	var locationType models.LocationType
	query := `SELECT * FROM location_types WHERE _id = $1`
	err := r.db.GetContext(ctx, &locationType, query, id)
	return &locationType, err
}

func (r *locationTypeRepository) GetByCode(ctx context.Context, code string) (*models.LocationType, error) {
	var locationType models.LocationType
	query := `SELECT * FROM location_types WHERE code = $1`
	err := r.db.GetContext(ctx, &locationType, query, code)
	return &locationType, err
}

func (r *locationTypeRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.LocationType, int, error) {
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
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM location_types %s", whereClause)
	r.db.GetContext(ctx, &total, countQuery, args...)

	query := fmt.Sprintf(`SELECT * FROM location_types %s ORDER BY name ASC LIMIT $%d OFFSET $%d`,
		whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var locationTypes []*models.LocationType
	err := r.db.SelectContext(ctx, &locationTypes, query, args...)
	return locationTypes, total, err
}

func (r *locationTypeRepository) ListActive(ctx context.Context) ([]*models.LocationType, error) {
	query := `SELECT * FROM location_types WHERE is_active = true ORDER BY name ASC`
	var locationTypes []*models.LocationType
	err := r.db.SelectContext(ctx, &locationTypes, query)
	return locationTypes, err
}

func (r *locationTypeRepository) Update(ctx context.Context, locationType *models.LocationType) error {
	query := `
		UPDATE location_types SET name = $1, description = $2, extra_fields = $3, is_active = $4,
		updated_at = $5, version = version + 1 WHERE _id = $6`
	locationType.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query, locationType.Name, locationType.Description, locationType.ExtraFields,
		locationType.IsActive, locationType.UpdatedAt, locationType.ID)
	return err
}

func (r *locationTypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM location_types WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
