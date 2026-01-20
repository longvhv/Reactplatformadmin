package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/yourusername/golang-backend/internal/models"
)

type TenantApplicationRepository struct {
	db *sql.DB
}

func NewTenantApplicationRepository(db *sql.DB) *TenantApplicationRepository {
	return &TenantApplicationRepository{db: db}
}

func (r *TenantApplicationRepository) Create(app *models.TenantApplication) error {
	query := `
		INSERT INTO tenant_applications (
			_id, tenant_id, app_code, is_active, activated_at, license_type,
			max_users, expires_at, settings, created_at, updated_at, created_by, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, 1
		)
		RETURNING _id, created_at, updated_at, version
	`

	var activatedAt *time.Time
	if app.IsActive {
		now := time.Now()
		activatedAt = &now
	}

	return r.db.QueryRow(
		query,
		app.ID,
		app.TenantID,
		app.AppCode,
		app.IsActive,
		activatedAt,
		app.LicenseType,
		app.MaxUsers,
		app.ExpiresAt,
		app.Settings,
		app.CreatedBy,
	).Scan(&app.ID, &app.CreatedAt, &app.UpdatedAt, &app.Version)
}

func (r *TenantApplicationRepository) GetByID(id string) (*models.TenantApplication, error) {
	query := `
		SELECT 
			_id, tenant_id, app_code, is_active, activated_at, deactivated_at,
			license_type, max_users, expires_at, settings,
			created_at, updated_at, created_by, updated_by,
			deleted_at, deleted_by, version
		FROM tenant_applications
		WHERE _id = $1 AND deleted_at IS NULL
	`

	app := &models.TenantApplication{}
	err := r.db.QueryRow(query, id).Scan(
		&app.ID,
		&app.TenantID,
		&app.AppCode,
		&app.IsActive,
		&app.ActivatedAt,
		&app.DeactivatedAt,
		&app.LicenseType,
		&app.MaxUsers,
		&app.ExpiresAt,
		&app.Settings,
		&app.CreatedAt,
		&app.UpdatedAt,
		&app.CreatedBy,
		&app.UpdatedBy,
		&app.DeletedAt,
		&app.DeletedBy,
		&app.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant application not found")
	}

	return app, err
}

func (r *TenantApplicationRepository) GetByTenantAndApp(tenantID, appCode string) (*models.TenantApplication, error) {
	query := `
		SELECT 
			_id, tenant_id, app_code, is_active, activated_at, deactivated_at,
			license_type, max_users, expires_at, settings,
			created_at, updated_at, created_by, updated_by,
			deleted_at, deleted_by, version
		FROM tenant_applications
		WHERE tenant_id = $1 AND app_code = $2 AND deleted_at IS NULL
	`

	app := &models.TenantApplication{}
	err := r.db.QueryRow(query, tenantID, appCode).Scan(
		&app.ID,
		&app.TenantID,
		&app.AppCode,
		&app.IsActive,
		&app.ActivatedAt,
		&app.DeactivatedAt,
		&app.LicenseType,
		&app.MaxUsers,
		&app.ExpiresAt,
		&app.Settings,
		&app.CreatedAt,
		&app.UpdatedAt,
		&app.CreatedBy,
		&app.UpdatedBy,
		&app.DeletedAt,
		&app.DeletedBy,
		&app.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant application not found")
	}

	return app, err
}

func (r *TenantApplicationRepository) List(tenantID *string, appCode *string, isActive *bool, page, pageSize int) ([]models.TenantApplication, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var conditions []string
	var args []interface{}
	argCount := 0

	conditions = append(conditions, "deleted_at IS NULL")

	if tenantID != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argCount))
		args = append(args, *tenantID)
	}

	if appCode != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("app_code = $%d", argCount))
		args = append(args, *appCode)
	}

	if isActive != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("is_active = $%d", argCount))
		args = append(args, *isActive)
	}

	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_applications %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT 
			_id, tenant_id, app_code, is_active, activated_at, deactivated_at,
			license_type, max_users, expires_at, settings,
			created_at, updated_at, created_by, updated_by,
			deleted_at, deleted_by, version
		FROM tenant_applications
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount+1, argCount+2)

	args = append(args, pageSize, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var apps []models.TenantApplication
	for rows.Next() {
		var app models.TenantApplication
		err := rows.Scan(
			&app.ID,
			&app.TenantID,
			&app.AppCode,
			&app.IsActive,
			&app.ActivatedAt,
			&app.DeactivatedAt,
			&app.LicenseType,
			&app.MaxUsers,
			&app.ExpiresAt,
			&app.Settings,
			&app.CreatedAt,
			&app.UpdatedAt,
			&app.CreatedBy,
			&app.UpdatedBy,
			&app.DeletedAt,
			&app.DeletedBy,
			&app.Version,
		)
		if err != nil {
			return nil, 0, err
		}
		apps = append(apps, app)
	}

	return apps, total, nil
}

func (r *TenantApplicationRepository) Update(id string, req *models.UpdateTenantApplicationRequest) error {
	var updates []string
	var args []interface{}
	argCount := 0

	if req.IsActive != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("is_active = $%d", argCount))
		args = append(args, *req.IsActive)

		if *req.IsActive {
			argCount++
			updates = append(updates, fmt.Sprintf("activated_at = NOW()"))
			updates = append(updates, "deactivated_at = NULL")
		} else {
			argCount++
			updates = append(updates, fmt.Sprintf("deactivated_at = NOW()"))
		}
	}

	if req.LicenseType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("license_type = $%d", argCount))
		args = append(args, *req.LicenseType)
	}

	if req.MaxUsers != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("max_users = $%d", argCount))
		args = append(args, *req.MaxUsers)
	}

	if req.ExpiresAt != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("expires_at = $%d", argCount))
		args = append(args, *req.ExpiresAt)
	}

	if req.Settings != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("settings = $%d", argCount))
		args = append(args, req.Settings)
	}

	if req.UpdatedBy != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("updated_by = $%d", argCount))
		args = append(args, *req.UpdatedBy)
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	updates = append(updates, "updated_at = NOW()")
	updates = append(updates, "version = version + 1")

	argCount++
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE tenant_applications
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
	`, strings.Join(updates, ", "), argCount)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("tenant application not found")
	}

	return nil
}

func (r *TenantApplicationRepository) Delete(id string, deletedBy *string) error {
	query := `
		UPDATE tenant_applications
		SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`
	result, err := r.db.Exec(query, id, deletedBy)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("tenant application not found")
	}

	return nil
}

func (r *TenantApplicationRepository) ListByTenantID(tenantID string) ([]models.TenantApplication, error) {
	query := `
		SELECT 
			_id, tenant_id, app_code, is_active, activated_at, deactivated_at,
			license_type, max_users, expires_at, settings,
			created_at, updated_at, created_by, updated_by,
			deleted_at, deleted_by, version
		FROM tenant_applications
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []models.TenantApplication
	for rows.Next() {
		var app models.TenantApplication
		err := rows.Scan(
			&app.ID,
			&app.TenantID,
			&app.AppCode,
			&app.IsActive,
			&app.ActivatedAt,
			&app.DeactivatedAt,
			&app.LicenseType,
			&app.MaxUsers,
			&app.ExpiresAt,
			&app.Settings,
			&app.CreatedAt,
			&app.UpdatedAt,
			&app.CreatedBy,
			&app.UpdatedBy,
			&app.DeletedAt,
			&app.DeletedBy,
			&app.Version,
		)
		if err != nil {
			return nil, err
		}
		apps = append(apps, app)
	}

	return apps, nil
}

func (r *TenantApplicationRepository) Activate(id string) error {
	query := `
		UPDATE tenant_applications
		SET is_active = true, activated_at = NOW(), deactivated_at = NULL, 
		    updated_at = NOW(), version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("tenant application not found")
	}

	return nil
}

func (r *TenantApplicationRepository) Deactivate(id string) error {
	query := `
		UPDATE tenant_applications
		SET is_active = false, deactivated_at = NOW(), 
		    updated_at = NOW(), version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("tenant application not found")
	}

	return nil
}
