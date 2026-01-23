package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

type applicationRepository struct {
	db *sql.DB
}

func NewApplicationRepository(db *sql.DB) *applicationRepository {
	return &applicationRepository{db: db}
}

func (r *applicationRepository) Create(ctx context.Context, app *models.Application) error {
	query := `
		INSERT INTO applications (
			_id, code, name, description, is_active,
			created_at, updated_at, created_by, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.ExecContext(ctx, query,
		app.ID, app.Code, app.Name, app.Description, app.IsActive,
		app.CreatedAt, app.UpdatedAt, app.CreatedBy, app.Version,
	)

	return err
}

func (r *applicationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Application, error) {
	query := `
		SELECT _id, code, name, description, is_active,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM applications
		WHERE _id = $1 AND deleted_at IS NULL`

	app := &models.Application{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description, &app.IsActive,
		&app.CreatedAt, &app.UpdatedAt, &app.CreatedBy, &app.UpdatedBy,
		&app.DeletedAt, &app.DeletedBy, &app.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("application not found")
	}

	return app, err
}

func (r *applicationRepository) GetByCode(ctx context.Context, code string) (*models.Application, error) {
	query := `
		SELECT _id, code, name, description, is_active,
			created_at, updated_at, version
		FROM applications
		WHERE code = $1 AND deleted_at IS NULL`

	app := &models.Application{}
	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&app.ID, &app.Code, &app.Name, &app.Description, &app.IsActive,
		&app.CreatedAt, &app.UpdatedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("application not found")
	}

	return app, err
}

func (r *applicationRepository) List(ctx context.Context, page, limit int, isActive *bool) ([]*models.Application, int, error) {
	// Count
	var countQuery string
	var total int

	if isActive != nil {
		countQuery = `SELECT COUNT(*) FROM applications WHERE is_active = $1 AND deleted_at IS NULL`
		r.db.QueryRowContext(ctx, countQuery, *isActive).Scan(&total)
	} else {
		countQuery = `SELECT COUNT(*) FROM applications WHERE deleted_at IS NULL`
		r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	}

	// List
	offset := (page - 1) * limit
	var query string
	var rows *sql.Rows
	var err error

	if isActive != nil {
		query = `
			SELECT _id, code, name, description, is_active,
				created_at, updated_at, version
			FROM applications
			WHERE is_active = $1 AND deleted_at IS NULL
			ORDER BY name ASC
			LIMIT $2 OFFSET $3`
		rows, err = r.db.QueryContext(ctx, query, *isActive, limit, offset)
	} else {
		query = `
			SELECT _id, code, name, description, is_active,
				created_at, updated_at, version
			FROM applications
			WHERE deleted_at IS NULL
			ORDER BY name ASC
			LIMIT $1 OFFSET $2`
		rows, err = r.db.QueryContext(ctx, query, limit, offset)
	}

	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	apps := []*models.Application{}
	for rows.Next() {
		app := &models.Application{}
		rows.Scan(&app.ID, &app.Code, &app.Name, &app.Description, &app.IsActive,
			&app.CreatedAt, &app.UpdatedAt, &app.Version)
		apps = append(apps, app)
	}

	return apps, total, nil
}

func (r *applicationRepository) Update(ctx context.Context, app *models.Application) error {
	query := `
		UPDATE applications SET
			name = $2, description = $3, is_active = $4,
			updated_at = $5, updated_by = $6, version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		app.ID, app.Name, app.Description, app.IsActive,
		app.UpdatedAt, app.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("application not found")
	}

	return nil
}

func (r *applicationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE applications SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("application not found")
	}

	return nil
}

func (r *applicationRepository) Exists(ctx context.Context, code string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM applications WHERE code = $1 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, code).Scan(&exists)
	return exists, err
}
