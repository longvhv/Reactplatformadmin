package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type SystemCategoryRepository interface {
	Create(ctx context.Context, category *models.SystemCategory) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SystemCategory, error)
	GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SystemCategory, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, categoryType *string, status *int16) ([]*models.SystemCategory, int, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemCategory, error)
	ListByType(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]*models.SystemCategory, error)
	Update(ctx context.Context, category *models.SystemCategory) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
}

type systemCategoryRepository struct {
	db *sqlx.DB
}

func NewSystemCategoryRepository(db *sqlx.DB) SystemCategoryRepository {
	return &systemCategoryRepository{db: db}
}

func (r *systemCategoryRepository) Create(ctx context.Context, category *models.SystemCategory) error {
	query := `
		INSERT INTO system_categories (
			_id, tenant_id, type, code, name, status, "order",
			description, parent_id, group_category_id, collection_name,
			extra_fields, metadata, is_system, is_editable,
			created_at, updated_at, created_by, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
		)`

	_, err := r.db.ExecContext(ctx, query,
		category.ID, category.TenantID, category.Type, category.Code, category.Name,
		category.Status, category.Order, category.Description, category.ParentID,
		category.GroupCategoryID, category.CollectionName, category.ExtraFields,
		category.Metadata, category.IsSystem, category.IsEditable,
		category.CreatedAt, category.UpdatedAt, category.CreatedBy, category.Version,
	)
	return err
}

func (r *systemCategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemCategory, error) {
	var category models.SystemCategory
	query := `SELECT * FROM system_categories WHERE _id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &category, query, id)
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *systemCategoryRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SystemCategory, error) {
	var category models.SystemCategory
	query := `SELECT * FROM system_categories WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &category, query, tenantID, code)
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *systemCategoryRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, categoryType *string, status *int16) ([]*models.SystemCategory, int, error) {
	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if categoryType != nil {
		whereClause += fmt.Sprintf(" AND type = $%d", argPos)
		args = append(args, *categoryType)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	// Get total count
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM system_categories %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query := fmt.Sprintf(`
		SELECT * FROM system_categories %s
		ORDER BY "order" ASC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	var categories []*models.SystemCategory
	err = r.db.SelectContext(ctx, &categories, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return categories, total, nil
}

func (r *systemCategoryRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemCategory, error) {
	query := `
		SELECT * FROM system_categories
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY "order" ASC, created_at DESC
	`

	var categories []*models.SystemCategory
	err := r.db.SelectContext(ctx, &categories, query, tenantID)
	if err != nil {
		return nil, err
	}

	return categories, nil
}

func (r *systemCategoryRepository) ListByType(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]*models.SystemCategory, error) {
	query := `
		SELECT * FROM system_categories
		WHERE tenant_id = $1 AND type = $2 AND deleted_at IS NULL
		ORDER BY "order" ASC, created_at DESC
	`

	var categories []*models.SystemCategory
	err := r.db.SelectContext(ctx, &categories, query, tenantID, categoryType)
	if err != nil {
		return nil, err
	}

	return categories, nil
}

func (r *systemCategoryRepository) Update(ctx context.Context, category *models.SystemCategory) error {
	query := `
		UPDATE system_categories SET
			name = $1,
			status = $2,
			"order" = $3,
			description = $4,
			parent_id = $5,
			group_category_id = $6,
			extra_fields = $7,
			metadata = $8,
			updated_at = $9,
			updated_by = $10,
			version = version + 1
		WHERE _id = $11 AND deleted_at IS NULL`

	category.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		category.Name, category.Status, category.Order, category.Description,
		category.ParentID, category.GroupCategoryID, category.ExtraFields,
		category.Metadata, category.UpdatedAt, category.UpdatedBy, category.ID,
	)
	return err
}

func (r *systemCategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM system_categories WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *systemCategoryRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	query := `
		UPDATE system_categories SET
			deleted_at = $1,
			deleted_by = $2,
			version = version + 1
		WHERE _id = $3 AND deleted_at IS NULL`

	_, err := r.db.ExecContext(ctx, query, time.Now(), deletedBy, id)
	return err
}
