package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/lib/pq"
	"github.com/vhv-platform/backend/internal/models"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) GetAll(ctx context.Context, filters models.ProductFilters) ([]models.Product, error) {
	query := `
		SELECT _id, application_id, code, name, description, type, status,
		       features, sort_order, metadata, created_at, updated_at, version
		FROM products
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	if filters.ApplicationID != nil {
		query += fmt.Sprintf(" AND application_id = $%d", argIndex)
		args = append(args, *filters.ApplicationID)
		argIndex++
	}

	if filters.Type != nil {
		query += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, *filters.Type)
		argIndex++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
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
		return nil, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		product, err := r.scanProduct(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, *product)
	}

	return products, rows.Err()
}

func (r *ProductRepository) GetByID(ctx context.Context, id string) (*models.Product, error) {
	query := `
		SELECT _id, application_id, code, name, description, type, status,
		       features, sort_order, metadata, created_at, updated_at, version
		FROM products
		WHERE _id = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, id)
	return r.scanProductRow(row)
}

func (r *ProductRepository) GetByCode(ctx context.Context, applicationID, code string) (*models.Product, error) {
	query := `
		SELECT _id, application_id, code, name, description, type, status,
		       features, sort_order, metadata, created_at, updated_at, version
		FROM products
		WHERE application_id = $1 AND code = $2 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, applicationID, code)
	product, err := r.scanProductRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return product, err
}

func (r *ProductRepository) Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	status := req.Status
	if status == "" {
		status = models.ProductStatusActive
	}

	metadataJSON, _ := json.Marshal(req.Metadata)

	query := `
		INSERT INTO products (application_id, code, name, description, type, status,
		                     features, sort_order, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, created_at, updated_at, version
	`

	var product models.Product
	product.ApplicationID = req.ApplicationID
	product.Code = req.Code
	product.Name = req.Name
	product.Description = req.Description
	product.Type = req.Type
	product.Status = status
	product.Features = req.Features
	product.SortOrder = req.SortOrder
	product.Metadata = req.Metadata

	err := r.db.QueryRowContext(ctx, query,
		req.ApplicationID, req.Code, req.Name, req.Description, req.Type, status,
		pq.Array(req.Features), req.SortOrder, metadataJSON,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt, &product.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	return &product, nil
}

func (r *ProductRepository) Update(ctx context.Context, id string, req models.UpdateProductRequest) (*models.Product, error) {
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

	if req.Features != nil {
		sets = append(sets, fmt.Sprintf("features = $%d", argIndex))
		args = append(args, pq.Array(req.Features))
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

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	sets = append(sets, "updated_at = NOW()", "version = version + 1")
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE products SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, application_id, code, name, description, type, status,
		          features, sort_order, metadata, created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	row := r.db.QueryRowContext(ctx, query, args...)
	return r.scanProductRow(row)
}

func (r *ProductRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE products SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, id)

	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

func (r *ProductRepository) scanProduct(rows *sql.Rows) (*models.Product, error) {
	var product models.Product
	var metadataJSON []byte
	var features pq.StringArray

	err := rows.Scan(
		&product.ID, &product.ApplicationID, &product.Code, &product.Name,
		&product.Description, &product.Type, &product.Status, &features,
		&product.SortOrder, &metadataJSON,
		&product.CreatedAt, &product.UpdatedAt, &product.Version,
	)
	if err != nil {
		return nil, err
	}

	product.Features = []string(features)
	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &product.Metadata)
	}

	return &product, nil
}

func (r *ProductRepository) scanProductRow(row *sql.Row) (*models.Product, error) {
	var product models.Product
	var metadataJSON []byte
	var features pq.StringArray

	err := row.Scan(
		&product.ID, &product.ApplicationID, &product.Code, &product.Name,
		&product.Description, &product.Type, &product.Status, &features,
		&product.SortOrder, &metadataJSON,
		&product.CreatedAt, &product.UpdatedAt, &product.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, err
	}

	product.Features = []string(features)
	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &product.Metadata)
	}

	return &product, nil
}
