package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type TenantAppRouteRepository interface {
	Create(ctx context.Context, route *models.TenantAppRoute) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode, status *string) ([]*models.TenantAppRoute, int, error)
	Update(ctx context.Context, route *models.TenantAppRoute) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantAppRoute, error)
	ListByAppCode(ctx context.Context, appCode string) ([]*models.TenantAppRoute, error)
	GetByDomain(ctx context.Context, domain string) (*models.TenantAppRoute, error)
	GetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantAppRoute, error)
	SetPrimary(ctx context.Context, tenantID uuid.UUID, appCode string, routeID uuid.UUID) error
	UpdateSSLStatus(ctx context.Context, id uuid.UUID, sslStatus string) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
}

type tenantAppRouteRepository struct {
	db *sqlx.DB
}

func NewTenantAppRouteRepository(db *sqlx.DB) TenantAppRouteRepository {
	return &tenantAppRouteRepository{db: db}
}

func (r *tenantAppRouteRepository) Create(ctx context.Context, route *models.TenantAppRoute) error {
	query := `
		INSERT INTO tenant_app_routes (
			_id, tenant_id, app_code, domain, path_prefix,
			is_primary, is_custom_domain, ssl_status, status, route_scope,
			created_at, updated_at, version
		) VALUES (
			:_id, :tenant_id, :app_code, :domain, :path_prefix,
			:is_primary, :is_custom_domain, :ssl_status, :status, :route_scope,
			:created_at, :updated_at, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, route)
	return err
}

func (r *tenantAppRouteRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error) {
	var route models.TenantAppRoute
	query := `SELECT * FROM tenant_app_routes WHERE _id = $1`

	err := r.db.GetContext(ctx, &route, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("app route not found")
	}
	return &route, err
}

func (r *tenantAppRouteRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode, status *string) ([]*models.TenantAppRoute, int, error) {
	var routes []*models.TenantAppRoute
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

	if appCode != nil {
		whereClause += fmt.Sprintf(" AND app_code = $%d", argPos)
		args = append(args, *appCode)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_app_routes %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM tenant_app_routes %s
		ORDER BY is_primary DESC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &routes, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return routes, total, nil
}

func (r *tenantAppRouteRepository) Update(ctx context.Context, route *models.TenantAppRoute) error {
	query := `
		UPDATE tenant_app_routes SET
			path_prefix = :path_prefix,
			is_primary = :is_primary,
			is_custom_domain = :is_custom_domain,
			ssl_status = :ssl_status,
			status = :status,
			route_scope = :route_scope,
			updated_at = :updated_at,
			version = version + 1
		WHERE _id = :_id AND version = :version`

	result, err := r.db.NamedExecContext(ctx, query, route)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("app route not found or version mismatch")
	}

	return nil
}

func (r *tenantAppRouteRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tenant_app_routes WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("app route not found")
	}

	return nil
}

func (r *tenantAppRouteRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantAppRoute, error) {
	var routes []*models.TenantAppRoute
	query := `
		SELECT * FROM tenant_app_routes
		WHERE tenant_id = $1
		ORDER BY is_primary DESC, created_at DESC`

	err := r.db.SelectContext(ctx, &routes, query, tenantID)
	return routes, err
}

func (r *tenantAppRouteRepository) ListByAppCode(ctx context.Context, appCode string) ([]*models.TenantAppRoute, error) {
	var routes []*models.TenantAppRoute
	query := `
		SELECT * FROM tenant_app_routes
		WHERE app_code = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &routes, query, appCode)
	return routes, err
}

func (r *tenantAppRouteRepository) GetByDomain(ctx context.Context, domain string) (*models.TenantAppRoute, error) {
	var route models.TenantAppRoute
	query := `
		SELECT * FROM tenant_app_routes
		WHERE domain = $1
		LIMIT 1`

	err := r.db.GetContext(ctx, &route, query, domain)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("app route not found")
	}
	return &route, err
}

func (r *tenantAppRouteRepository) GetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantAppRoute, error) {
	var route models.TenantAppRoute
	query := `
		SELECT * FROM tenant_app_routes
		WHERE tenant_id = $1 AND app_code = $2 AND is_primary = true
		LIMIT 1`

	err := r.db.GetContext(ctx, &route, query, tenantID, appCode)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("primary route not found")
	}
	return &route, err
}

func (r *tenantAppRouteRepository) SetPrimary(ctx context.Context, tenantID uuid.UUID, appCode string, routeID uuid.UUID) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Unset all primary flags for tenant and app
	_, err = tx.ExecContext(ctx, `
		UPDATE tenant_app_routes
		SET is_primary = false, updated_at = NOW()
		WHERE tenant_id = $1 AND app_code = $2
	`, tenantID, appCode)
	if err != nil {
		return err
	}

	// Set new primary
	result, err := tx.ExecContext(ctx, `
		UPDATE tenant_app_routes
		SET is_primary = true, updated_at = NOW(), version = version + 1
		WHERE _id = $1 AND tenant_id = $2 AND app_code = $3
	`, routeID, tenantID, appCode)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("app route not found")
	}

	return tx.Commit()
}

func (r *tenantAppRouteRepository) UpdateSSLStatus(ctx context.Context, id uuid.UUID, sslStatus string) error {
	query := `
		UPDATE tenant_app_routes
		SET ssl_status = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2`

	result, err := r.db.ExecContext(ctx, query, sslStatus, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("app route not found")
	}

	return nil
}

func (r *tenantAppRouteRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE tenant_app_routes
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
		return fmt.Errorf("app route not found")
	}

	return nil
}
