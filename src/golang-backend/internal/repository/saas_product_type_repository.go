package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type SaaSProductTypeRepository interface {
	Create(ctx context.Context, productType *models.SaaSProductType) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SaaSProductType, error)
	GetByCode(ctx context.Context, code string) (*models.SaaSProductType, error)
	List(ctx context.Context, page, pageSize int) ([]*models.SaaSProductType, int, error)
	ListActive(ctx context.Context) ([]*models.SaaSProductType, error)
	Update(ctx context.Context, productType *models.SaaSProductType) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type saasProductTypeRepository struct {
	db *sqlx.DB
}

func NewSaaSProductTypeRepository(db *sqlx.DB) SaaSProductTypeRepository {
	return &saasProductTypeRepository{db: db}
}

func (r *saasProductTypeRepository) Create(ctx context.Context, productType *models.SaaSProductType) error {
	query := `INSERT INTO saas_product_types (_id, code, name, description, is_active, created_at, updated_at, version)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.ExecContext(ctx, query, productType.ID, productType.Code, productType.Name,
		productType.Description, productType.IsActive, productType.CreatedAt, productType.UpdatedAt, productType.Version)
	return err
}

func (r *saasProductTypeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SaaSProductType, error) {
	var productType models.SaaSProductType
	err := r.db.GetContext(ctx, &productType, `SELECT * FROM saas_product_types WHERE _id = $1`, id)
	return &productType, err
}

func (r *saasProductTypeRepository) GetByCode(ctx context.Context, code string) (*models.SaaSProductType, error) {
	var productType models.SaaSProductType
	err := r.db.GetContext(ctx, &productType, `SELECT * FROM saas_product_types WHERE code = $1`, code)
	return &productType, err
}

func (r *saasProductTypeRepository) List(ctx context.Context, page, pageSize int) ([]*models.SaaSProductType, int, error) {
	offset := (page - 1) * pageSize
	var total int
	r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM saas_product_types")

	var productTypes []*models.SaaSProductType
	err := r.db.SelectContext(ctx, &productTypes,
		`SELECT * FROM saas_product_types ORDER BY name ASC LIMIT $1 OFFSET $2`, pageSize, offset)
	return productTypes, total, err
}

func (r *saasProductTypeRepository) ListActive(ctx context.Context) ([]*models.SaaSProductType, error) {
	var productTypes []*models.SaaSProductType
	err := r.db.SelectContext(ctx, &productTypes,
		`SELECT * FROM saas_product_types WHERE is_active = true ORDER BY name ASC`)
	return productTypes, err
}

func (r *saasProductTypeRepository) Update(ctx context.Context, productType *models.SaaSProductType) error {
	query := `UPDATE saas_product_types SET name = $1, description = $2, is_active = $3,
		updated_at = $4, version = version + 1 WHERE _id = $5`
	productType.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query, productType.Name, productType.Description,
		productType.IsActive, productType.UpdatedAt, productType.ID)
	return err
}

func (r *saasProductTypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM saas_product_types WHERE _id = $1`, id)
	return err
}
