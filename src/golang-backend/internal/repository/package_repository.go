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

type PackageRepository struct {
	db *sql.DB
}

func NewPackageRepository(db *sql.DB) *PackageRepository {
	return &PackageRepository{db: db}
}

func (r *PackageRepository) GetAll(ctx context.Context, filters models.PackageFilters) ([]models.Package, error) {
	query := `
		SELECT _id, product_id, code, name, description, status, price, currency,
		       billing_cycle, trial_days, max_users, max_storage, included_features,
		       is_popular, sort_order, metadata, pricing_configuration,
		       created_at, updated_at, version
		FROM packages
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	if filters.ProductID != nil {
		query += fmt.Sprintf(" AND product_id = $%d", argIndex)
		args = append(args, *filters.ProductID)
		argIndex++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
		argIndex++
	}

	if filters.BillingCycle != nil {
		query += fmt.Sprintf(" AND billing_cycle = $%d", argIndex)
		args = append(args, *filters.BillingCycle)
		argIndex++
	}

	if filters.IsPopular != nil {
		query += fmt.Sprintf(" AND is_popular = $%d", argIndex)
		args = append(args, *filters.IsPopular)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR code ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY sort_order, price"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query packages: %w", err)
	}
	defer rows.Close()

	var packages []models.Package
	for rows.Next() {
		pkg, err := r.scanPackage(rows)
		if err != nil {
			return nil, err
		}
		packages = append(packages, *pkg)
	}

	return packages, rows.Err()
}

func (r *PackageRepository) GetByID(ctx context.Context, id string) (*models.Package, error) {
	query := `
		SELECT _id, product_id, code, name, description, status, price, currency,
		       billing_cycle, trial_days, max_users, max_storage, included_features,
		       is_popular, sort_order, metadata, pricing_configuration,
		       created_at, updated_at, version
		FROM packages
		WHERE _id = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, id)
	return r.scanPackageRow(row)
}

func (r *PackageRepository) GetByCode(ctx context.Context, productID, code string) (*models.Package, error) {
	query := `
		SELECT _id, product_id, code, name, description, status, price, currency,
		       billing_cycle, trial_days, max_users, max_storage, included_features,
		       is_popular, sort_order, metadata, pricing_configuration,
		       created_at, updated_at, version
		FROM packages
		WHERE product_id = $1 AND code = $2 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, productID, code)
	pkg, err := r.scanPackageRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return pkg, err
}

func (r *PackageRepository) Create(ctx context.Context, req models.CreatePackageRequest) (*models.Package, error) {
	status := req.Status
	if status == "" {
		status = models.PackageStatusActive
	}

	metadataJSON, _ := json.Marshal(req.Metadata)
	pricingJSON, _ := json.Marshal(req.PricingConfiguration)

	query := `
		INSERT INTO packages (product_id, code, name, description, status, price, currency,
		                     billing_cycle, trial_days, max_users, max_storage, included_features,
		                     is_popular, sort_order, metadata, pricing_configuration)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING _id, created_at, updated_at, version
	`

	var pkg models.Package
	pkg.ProductID = req.ProductID
	pkg.Code = req.Code
	pkg.Name = req.Name
	pkg.Description = req.Description
	pkg.Status = status
	pkg.Price = req.Price
	pkg.Currency = req.Currency
	pkg.BillingCycle = req.BillingCycle
	pkg.TrialDays = req.TrialDays
	pkg.MaxUsers = req.MaxUsers
	pkg.MaxStorage = req.MaxStorage
	pkg.IncludedFeatures = req.IncludedFeatures
	pkg.IsPopular = req.IsPopular
	pkg.SortOrder = req.SortOrder
	pkg.Metadata = req.Metadata
	pkg.PricingConfiguration = req.PricingConfiguration

	err := r.db.QueryRowContext(ctx, query,
		req.ProductID, req.Code, req.Name, req.Description, status, req.Price, req.Currency,
		req.BillingCycle, req.TrialDays, req.MaxUsers, req.MaxStorage, pq.Array(req.IncludedFeatures),
		req.IsPopular, req.SortOrder, metadataJSON, pricingJSON,
	).Scan(&pkg.ID, &pkg.CreatedAt, &pkg.UpdatedAt, &pkg.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create package: %w", err)
	}

	return &pkg, nil
}

func (r *PackageRepository) Update(ctx context.Context, id string, req models.UpdatePackageRequest) (*models.Package, error) {
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

	if req.Price != nil {
		sets = append(sets, fmt.Sprintf("price = $%d", argIndex))
		args = append(args, *req.Price)
		argIndex++
	}

	if req.Currency != nil {
		sets = append(sets, fmt.Sprintf("currency = $%d", argIndex))
		args = append(args, *req.Currency)
		argIndex++
	}

	if req.BillingCycle != nil {
		sets = append(sets, fmt.Sprintf("billing_cycle = $%d", argIndex))
		args = append(args, *req.BillingCycle)
		argIndex++
	}

	if req.TrialDays != nil {
		sets = append(sets, fmt.Sprintf("trial_days = $%d", argIndex))
		args = append(args, *req.TrialDays)
		argIndex++
	}

	if req.MaxUsers != nil {
		sets = append(sets, fmt.Sprintf("max_users = $%d", argIndex))
		args = append(args, *req.MaxUsers)
		argIndex++
	}

	if req.MaxStorage != nil {
		sets = append(sets, fmt.Sprintf("max_storage = $%d", argIndex))
		args = append(args, *req.MaxStorage)
		argIndex++
	}

	if req.IncludedFeatures != nil {
		sets = append(sets, fmt.Sprintf("included_features = $%d", argIndex))
		args = append(args, pq.Array(req.IncludedFeatures))
		argIndex++
	}

	if req.IsPopular != nil {
		sets = append(sets, fmt.Sprintf("is_popular = $%d", argIndex))
		args = append(args, *req.IsPopular)
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

	if req.PricingConfiguration != nil {
		pricingJSON, _ := json.Marshal(req.PricingConfiguration)
		sets = append(sets, fmt.Sprintf("pricing_configuration = $%d", argIndex))
		args = append(args, pricingJSON)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	sets = append(sets, "updated_at = NOW()", "version = version + 1")
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE packages SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, product_id, code, name, description, status, price, currency,
		          billing_cycle, trial_days, max_users, max_storage, included_features,
		          is_popular, sort_order, metadata, pricing_configuration,
		          created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	row := r.db.QueryRowContext(ctx, query, args...)
	return r.scanPackageRow(row)
}

func (r *PackageRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE packages SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, id)

	if err != nil {
		return fmt.Errorf("failed to delete package: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("package not found")
	}

	return nil
}

func (r *PackageRepository) scanPackage(rows *sql.Rows) (*models.Package, error) {
	var pkg models.Package
	var metadataJSON, pricingJSON []byte
	var features pq.StringArray

	err := rows.Scan(
		&pkg.ID, &pkg.ProductID, &pkg.Code, &pkg.Name, &pkg.Description,
		&pkg.Status, &pkg.Price, &pkg.Currency, &pkg.BillingCycle,
		&pkg.TrialDays, &pkg.MaxUsers, &pkg.MaxStorage, &features,
		&pkg.IsPopular, &pkg.SortOrder, &metadataJSON, &pricingJSON,
		&pkg.CreatedAt, &pkg.UpdatedAt, &pkg.Version,
	)
	if err != nil {
		return nil, err
	}

	pkg.IncludedFeatures = []string(features)
	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &pkg.Metadata)
	}
	if pricingJSON != nil {
		json.Unmarshal(pricingJSON, &pkg.PricingConfiguration)
	}

	return &pkg, nil
}

func (r *PackageRepository) scanPackageRow(row *sql.Row) (*models.Package, error) {
	var pkg models.Package
	var metadataJSON, pricingJSON []byte
	var features pq.StringArray

	err := row.Scan(
		&pkg.ID, &pkg.ProductID, &pkg.Code, &pkg.Name, &pkg.Description,
		&pkg.Status, &pkg.Price, &pkg.Currency, &pkg.BillingCycle,
		&pkg.TrialDays, &pkg.MaxUsers, &pkg.MaxStorage, &features,
		&pkg.IsPopular, &pkg.SortOrder, &metadataJSON, &pricingJSON,
		&pkg.CreatedAt, &pkg.UpdatedAt, &pkg.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("package not found")
	}
	if err != nil {
		return nil, err
	}

	pkg.IncludedFeatures = []string(features)
	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &pkg.Metadata)
	}
	if pricingJSON != nil {
		json.Unmarshal(pricingJSON, &pkg.PricingConfiguration)
	}

	return &pkg, nil
}
