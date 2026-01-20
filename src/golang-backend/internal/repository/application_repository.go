package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
)

type ApplicationRepository struct {
	db *sql.DB
}

func NewApplicationRepository(db *sql.DB) *ApplicationRepository {
	return &ApplicationRepository{db: db}
}

func (r *ApplicationRepository) GetAll(ctx context.Context, filters models.ApplicationFilters) ([]models.Application, error) {
	query := `
		SELECT _id, code, name, description, status, icon_url, base_url,
		       owner_tenant_id, is_public, sort_order, metadata, configuration,
		       created_at, updated_at, version
		FROM applications
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
		argIndex++
	}

	if filters.OwnerTenantID != nil {
		query += fmt.Sprintf(" AND owner_tenant_id = $%d", argIndex)
		args = append(args, *filters.OwnerTenantID)
		argIndex++
	}

	if filters.IsPublic != nil {
		query += fmt.Sprintf(" AND is_public = $%d", argIndex)
		args = append(args, *filters.IsPublic)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR code ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY sort_order, name"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query applications: %w", err)
	}
	defer rows.Close()

	var apps []models.Application
	for rows.Next() {
		app, err := r.scanApplication(rows)
		if err != nil {
			return nil, err
		}
		apps = append(apps, *app)
	}

	return apps, rows.Err()
}

func (r *ApplicationRepository) GetByID(ctx context.Context, id string) (*models.Application, error) {
	query := `
		SELECT _id, code, name, description, status, icon_url, base_url,
		       owner_tenant_id, is_public, sort_order, metadata, configuration,
		       created_at, updated_at, version
		FROM applications
		WHERE _id = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, id)
	return r.scanApplicationRow(row)
}

func (r *ApplicationRepository) GetByCode(ctx context.Context, code string) (*models.Application, error) {
	query := `
		SELECT _id, code, name, description, status, icon_url, base_url,
		       owner_tenant_id, is_public, sort_order, metadata, configuration,
		       created_at, updated_at, version
		FROM applications
		WHERE code = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, code)
	app, err := r.scanApplicationRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return app, err
}

func (r *ApplicationRepository) Create(ctx context.Context, req models.CreateApplicationRequest) (*models.Application, error) {
	status := req.Status
	if status == "" {
		status = models.ApplicationStatusActive
	}

	metadataJSON, _ := json.Marshal(req.Metadata)
	configJSON, _ := json.Marshal(req.Configuration)

	query := `
		INSERT INTO applications (code, name, description, status, icon_url, base_url,
		                         owner_tenant_id, is_public, sort_order, metadata, configuration)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING _id, created_at, updated_at, version
	`

	var app models.Application
	app.Code = req.Code
	app.Name = req.Name
	app.Description = req.Description
	app.Status = status
	app.IconURL = req.IconURL
	app.BaseURL = req.BaseURL
	app.OwnerTenantID = req.OwnerTenantID
	app.IsPublic = req.IsPublic
	app.SortOrder = req.SortOrder
	app.Metadata = req.Metadata
	app.Configuration = req.Configuration

	err := r.db.QueryRowContext(ctx, query,
		req.Code, req.Name, req.Description, status, req.IconURL, req.BaseURL,
		req.OwnerTenantID, req.IsPublic, req.SortOrder, metadataJSON, configJSON,
	).Scan(&app.ID, &app.CreatedAt, &app.UpdatedAt, &app.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return &app, nil
}

func (r *ApplicationRepository) Update(ctx context.Context, id string, req models.UpdateApplicationRequest) (*models.Application, error) {
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *req.Description)
		argIndex++
	}

	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.IconURL != nil {
		sets = append(sets, fmt.Sprintf("icon_url = $%d", argIndex))
		args = append(args, *req.IconURL)
		argIndex++
	}

	if req.BaseURL != nil {
		sets = append(sets, fmt.Sprintf("base_url = $%d", argIndex))
		args = append(args, *req.BaseURL)
		argIndex++
	}

	if req.IsPublic != nil {
		sets = append(sets, fmt.Sprintf("is_public = $%d", argIndex))
		args = append(args, *req.IsPublic)
		argIndex++
	}

	if req.SortOrder != nil {
		sets = append(sets, fmt.Sprintf("sort_order = $%d", argIndex))
		args = append(args, *req.SortOrder)
		argIndex++
	}

	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(req.Metadata)
		sets = append(sets, fmt.Sprintf("metadata = $%d", argIndex))
		args = append(args, metadataJSON)
		argIndex++
	}

	if req.Configuration != nil {
		configJSON, _ := json.Marshal(req.Configuration)
		sets = append(sets, fmt.Sprintf("configuration = $%d", argIndex))
		args = append(args, configJSON)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	sets = append(sets, "updated_at = NOW()", "version = version + 1")
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE applications SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, code, name, description, status, icon_url, base_url,
		          owner_tenant_id, is_public, sort_order, metadata, configuration,
		          created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	row := r.db.QueryRowContext(ctx, query, args...)
	return r.scanApplicationRow(row)
}

func (r *ApplicationRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE applications SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, id)

	if err != nil {
		return fmt.Errorf("failed to delete application: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("application not found")
	}

	return nil
}

func (r *ApplicationRepository) scanApplication(rows *sql.Rows) (*models.Application, error) {
	var app models.Application
	var metadataJSON, configJSON []byte

	err := rows.Scan(
		&app.ID, &app.Code, &app.Name, &app.Description, &app.Status,
		&app.IconURL, &app.BaseURL, &app.OwnerTenantID, &app.IsPublic,
		&app.SortOrder, &metadataJSON, &configJSON,
		&app.CreatedAt, &app.UpdatedAt, &app.Version,
	)
	if err != nil {
		return nil, err
	}

	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &app.Metadata)
	}
	if configJSON != nil {
		json.Unmarshal(configJSON, &app.Configuration)
	}

	return &app, nil
}

func (r *ApplicationRepository) scanApplicationRow(row *sql.Row) (*models.Application, error) {
	var app models.Application
	var metadataJSON, configJSON []byte

	err := row.Scan(
		&app.ID, &app.Code, &app.Name, &app.Description, &app.Status,
		&app.IconURL, &app.BaseURL, &app.OwnerTenantID, &app.IsPublic,
		&app.SortOrder, &metadataJSON, &configJSON,
		&app.CreatedAt, &app.UpdatedAt, &app.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("application not found")
	}
	if err != nil {
		return nil, err
	}

	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &app.Metadata)
	}
	if configJSON != nil {
		json.Unmarshal(configJSON, &app.Configuration)
	}

	return &app, nil
}
