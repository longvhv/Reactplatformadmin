package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type StorageFileRepository interface {
	Create(ctx context.Context, file *models.StorageFile) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.StorageFile, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, category, status *string, isFolder *bool) ([]*models.StorageFile, int, error)
	Update(ctx context.Context, file *models.StorageFile) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error)
	ListByParentID(ctx context.Context, parentID uuid.UUID) ([]*models.StorageFile, error)
	ListByCategory(ctx context.Context, category string) ([]*models.StorageFile, error)
	ListFolders(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	GetTotalSize(ctx context.Context, tenantID uuid.UUID) (int64, error)
}

type storageFileRepository struct {
	db *sqlx.DB
}

func NewStorageFileRepository(db *sqlx.DB) StorageFileRepository {
	return &storageFileRepository{db: db}
}

func (r *storageFileRepository) Create(ctx context.Context, file *models.StorageFile) error {
	query := `
		INSERT INTO storage_files (
			_id, tenant_id, parent_id, is_folder, original_name, storage_path,
			public_url, category, mime_type, extension, file_size,
			items_snapshot, metadata, storage_provider, visibility, status,
			uploaded_by, created_at, updated_at, version
		) VALUES (
			:_id, :tenant_id, :parent_id, :is_folder, :original_name, :storage_path,
			:public_url, :category, :mime_type, :extension, :file_size,
			:items_snapshot, :metadata, :storage_provider, :visibility, :status,
			:uploaded_by, :created_at, :updated_at, :version
		)`

	_, err := r.db.NamedExecContext(ctx, query, file)
	return err
}

func (r *storageFileRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.StorageFile, error) {
	var file models.StorageFile
	query := `SELECT * FROM storage_files WHERE _id = $1 AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &file, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("storage file not found")
	}
	return &file, err
}

func (r *storageFileRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, category, status *string, isFolder *bool) ([]*models.StorageFile, int, error) {
	var files []*models.StorageFile
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if category != nil {
		whereClause += fmt.Sprintf(" AND category = $%d", argPos)
		args = append(args, *category)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	if isFolder != nil {
		whereClause += fmt.Sprintf(" AND is_folder = $%d", argPos)
		args = append(args, *isFolder)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM storage_files %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM storage_files %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &files, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return files, total, nil
}

func (r *storageFileRepository) Update(ctx context.Context, file *models.StorageFile) error {
	query := `
		UPDATE storage_files SET
			original_name = :original_name,
			storage_path = :storage_path,
			public_url = :public_url,
			category = :category,
			file_size = :file_size,
			items_snapshot = :items_snapshot,
			metadata = :metadata,
			visibility = :visibility,
			status = :status,
			updated_at = :updated_at,
			version = version + 1
		WHERE _id = :_id AND version = :version AND deleted_at IS NULL`

	result, err := r.db.NamedExecContext(ctx, query, file)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("storage file not found or version mismatch")
	}

	return nil
}

func (r *storageFileRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM storage_files WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("storage file not found")
	}

	return nil
}

func (r *storageFileRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE storage_files
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("storage file not found")
	}

	return nil
}

func (r *storageFileRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error) {
	var files []*models.StorageFile
	query := `
		SELECT * FROM storage_files
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &files, query, tenantID)
	return files, err
}

func (r *storageFileRepository) ListByParentID(ctx context.Context, parentID uuid.UUID) ([]*models.StorageFile, error) {
	var files []*models.StorageFile
	query := `
		SELECT * FROM storage_files
		WHERE parent_id = $1 AND deleted_at IS NULL
		ORDER BY is_folder DESC, original_name ASC`

	err := r.db.SelectContext(ctx, &files, query, parentID)
	return files, err
}

func (r *storageFileRepository) ListByCategory(ctx context.Context, category string) ([]*models.StorageFile, error) {
	var files []*models.StorageFile
	query := `
		SELECT * FROM storage_files
		WHERE category = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &files, query, category)
	return files, err
}

func (r *storageFileRepository) ListFolders(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error) {
	var files []*models.StorageFile
	query := `
		SELECT * FROM storage_files
		WHERE tenant_id = $1 AND is_folder = true AND deleted_at IS NULL
		ORDER BY original_name ASC`

	err := r.db.SelectContext(ctx, &files, query, tenantID)
	return files, err
}

func (r *storageFileRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE storage_files
		SET status = $1, updated_at = NOW(), version = version + 1
		WHERE _id = $2 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("storage file not found")
	}

	return nil
}

func (r *storageFileRepository) GetTotalSize(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	var totalSize int64
	query := `
		SELECT COALESCE(SUM(file_size), 0)
		FROM storage_files
		WHERE tenant_id = $1 AND is_folder = false AND deleted_at IS NULL`

	err := r.db.GetContext(ctx, &totalSize, query, tenantID)
	return totalSize, err
}
