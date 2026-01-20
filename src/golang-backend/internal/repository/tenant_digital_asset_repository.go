package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type TenantDigitalAssetRepository interface {
	Create(ctx context.Context, asset *models.TenantDigitalAsset) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, assetType, status *string) ([]*models.TenantDigitalAsset, int, error)
	Update(ctx context.Context, asset *models.TenantDigitalAsset) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error)
	ListByOrderID(ctx context.Context, orderID uuid.UUID) ([]*models.TenantDigitalAsset, error)
	ListByAssetType(ctx context.Context, assetType string) ([]*models.TenantDigitalAsset, error)
	ListActiveAssets(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error)
	ListExpiringAssets(ctx context.Context, beforeDate time.Time) ([]*models.TenantDigitalAsset, error)
	Activate(ctx context.Context, id uuid.UUID) error
	Suspend(ctx context.Context, id uuid.UUID) error
	Expire(ctx context.Context, id uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
}

type tenantDigitalAssetRepository struct {
	db *sqlx.DB
}

func NewTenantDigitalAssetRepository(db *sqlx.DB) TenantDigitalAssetRepository {
	return &tenantDigitalAssetRepository{db: db}
}

func (r *tenantDigitalAssetRepository) Create(ctx context.Context, asset *models.TenantDigitalAsset) error {
	query := `
		INSERT INTO tenant_digital_assets (
			_id, tenant_id, order_id, asset_type, name, status,
			auto_renew, asset_metadata, activated_at, expires_at,
			created_at, updated_at, version
		) VALUES (
			:_id, :tenant_id, :order_id, :asset_type, :name, :status,
			:auto_renew, :asset_metadata, :activated_at, :expires_at,
			:created_at, :updated_at, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, asset)
	return err
}

func (r *tenantDigitalAssetRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantDigitalAsset, error) {
	var asset models.TenantDigitalAsset
	query := `SELECT * FROM tenant_digital_assets WHERE _id = $1`

	err := r.db.GetContext(ctx, &asset, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("digital asset not found")
	}
	return &asset, err
}

func (r *tenantDigitalAssetRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, assetType, status *string) ([]*models.TenantDigitalAsset, int, error) {
	var assets []*models.TenantDigitalAsset
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if assetType != nil {
		whereClause += fmt.Sprintf(" AND asset_type = $%d", argPos)
		args = append(args, *assetType)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_digital_assets %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM tenant_digital_assets %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &assets, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return assets, total, nil
}

func (r *tenantDigitalAssetRepository) Update(ctx context.Context, asset *models.TenantDigitalAsset) error {
	query := `
		UPDATE tenant_digital_assets SET
			name = :name,
			status = :status,
			auto_renew = :auto_renew,
			asset_metadata = :asset_metadata,
			expires_at = :expires_at,
			updated_at = :updated_at,
			version = version + 1
		WHERE _id = :_id AND version = :version`

	result, err := r.db.NamedExecContext(ctx, query, asset)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("digital asset not found or version mismatch")
	}

	return nil
}

func (r *tenantDigitalAssetRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tenant_digital_assets WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("digital asset not found")
	}

	return nil
}

func (r *tenantDigitalAssetRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error) {
	var assets []*models.TenantDigitalAsset
	query := `
		SELECT * FROM tenant_digital_assets
		WHERE tenant_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &assets, query, tenantID)
	return assets, err
}

func (r *tenantDigitalAssetRepository) ListByOrderID(ctx context.Context, orderID uuid.UUID) ([]*models.TenantDigitalAsset, error) {
	var assets []*models.TenantDigitalAsset
	query := `
		SELECT * FROM tenant_digital_assets
		WHERE order_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &assets, query, orderID)
	return assets, err
}

func (r *tenantDigitalAssetRepository) ListByAssetType(ctx context.Context, assetType string) ([]*models.TenantDigitalAsset, error) {
	var assets []*models.TenantDigitalAsset
	query := `
		SELECT * FROM tenant_digital_assets
		WHERE asset_type = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &assets, query, assetType)
	return assets, err
}

func (r *tenantDigitalAssetRepository) ListActiveAssets(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantDigitalAsset, error) {
	var assets []*models.TenantDigitalAsset
	query := `
		SELECT * FROM tenant_digital_assets
		WHERE tenant_id = $1
		  AND status = 'ACTIVE'
		  AND (expires_at IS NULL OR expires_at > NOW())
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &assets, query, tenantID)
	return assets, err
}

func (r *tenantDigitalAssetRepository) ListExpiringAssets(ctx context.Context, beforeDate time.Time) ([]*models.TenantDigitalAsset, error) {
	var assets []*models.TenantDigitalAsset
	query := `
		SELECT * FROM tenant_digital_assets
		WHERE status = 'ACTIVE'
		  AND expires_at IS NOT NULL
		  AND expires_at <= $1
		ORDER BY expires_at ASC`

	err := r.db.SelectContext(ctx, &assets, query, beforeDate)
	return assets, err
}

func (r *tenantDigitalAssetRepository) Activate(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE tenant_digital_assets
		SET status = 'ACTIVE',
		    activated_at = NOW(),
		    updated_at = NOW(),
		    version = version + 1
		WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("digital asset not found")
	}

	return nil
}

func (r *tenantDigitalAssetRepository) Suspend(ctx context.Context, id uuid.UUID) error {
	return r.UpdateStatus(ctx, id, "SUSPENDED")
}

func (r *tenantDigitalAssetRepository) Expire(ctx context.Context, id uuid.UUID) error {
	return r.UpdateStatus(ctx, id, "EXPIRED")
}

func (r *tenantDigitalAssetRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE tenant_digital_assets
		SET status = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2`

	result, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("digital asset not found")
	}

	return nil
}
