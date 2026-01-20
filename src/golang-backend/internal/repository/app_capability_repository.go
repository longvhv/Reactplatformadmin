package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type AppCapabilityRepository interface {
	Create(ctx context.Context, capability *models.AppCapability) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AppCapability, error)
	List(ctx context.Context, page, pageSize int, tenantID, appID *uuid.UUID, capabilityType *string) ([]*models.AppCapability, int, error)
	ListByApp(ctx context.Context, appID uuid.UUID) ([]*models.AppCapability, error)
	Update(ctx context.Context, capability *models.AppCapability) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
}

type appCapabilityRepository struct {
	db *sqlx.DB
}

func NewAppCapabilityRepository(db *sqlx.DB) AppCapabilityRepository {
	return &appCapabilityRepository{db: db}
}

func (r *appCapabilityRepository) Create(ctx context.Context, capability *models.AppCapability) error {
	query := `
		INSERT INTO app_capabilities (
			_id, tenant_id, app_id, code, name, description, type,
			default_value, display_order, is_required, validation_rules,
			status, metadata, created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`

	_, err := r.db.ExecContext(ctx, query,
		capability.ID, capability.TenantID, capability.AppID, capability.Code,
		capability.Name, capability.Description, capability.Type, capability.DefaultValue,
		capability.DisplayOrder, capability.IsRequired, capability.ValidationRules,
		capability.Status, capability.Metadata, capability.CreatedAt, capability.UpdatedAt,
		capability.CreatedBy, capability.Version,
	)
	return err
}

func (r *appCapabilityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AppCapability, error) {
	var capability models.AppCapability
	query := `SELECT * FROM app_capabilities WHERE _id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &capability, query, id)
	if err != nil {
		return nil, err
	}
	return &capability, nil
}

func (r *appCapabilityRepository) List(ctx context.Context, page, pageSize int, tenantID, appID *uuid.UUID, capabilityType *string) ([]*models.AppCapability, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}
	if appID != nil {
		whereClause += fmt.Sprintf(" AND app_id = $%d", argPos)
		args = append(args, *appID)
		argPos++
	}
	if capabilityType != nil {
		whereClause += fmt.Sprintf(" AND type = $%d", argPos)
		args = append(args, *capabilityType)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM app_capabilities %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM app_capabilities %s
		ORDER BY display_order ASC, name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var capabilities []*models.AppCapability
	err = r.db.SelectContext(ctx, &capabilities, query, args...)
	return capabilities, total, err
}

func (r *appCapabilityRepository) ListByApp(ctx context.Context, appID uuid.UUID) ([]*models.AppCapability, error) {
	query := `
		SELECT * FROM app_capabilities
		WHERE app_id = $1 AND status = 'active' AND deleted_at IS NULL
		ORDER BY display_order ASC, name ASC`

	var capabilities []*models.AppCapability
	err := r.db.SelectContext(ctx, &capabilities, query, appID)
	return capabilities, err
}

func (r *appCapabilityRepository) Update(ctx context.Context, capability *models.AppCapability) error {
	query := `
		UPDATE app_capabilities SET
			name = $1, description = $2, default_value = $3, display_order = $4,
			is_required = $5, validation_rules = $6, status = $7, metadata = $8,
			updated_at = $9, updated_by = $10, version = version + 1
		WHERE _id = $11 AND deleted_at IS NULL`

	capability.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query,
		capability.Name, capability.Description, capability.DefaultValue, capability.DisplayOrder,
		capability.IsRequired, capability.ValidationRules, capability.Status, capability.Metadata,
		capability.UpdatedAt, capability.UpdatedBy, capability.ID,
	)
	return err
}

func (r *appCapabilityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM app_capabilities WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *appCapabilityRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	query := `
		UPDATE app_capabilities SET
			deleted_at = $1, deleted_by = $2, version = version + 1
		WHERE _id = $3 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, time.Now(), deletedBy, id)
	return err
}
