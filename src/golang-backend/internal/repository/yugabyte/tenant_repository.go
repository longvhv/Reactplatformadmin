package yugabyte

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type tenantRepository struct {
	db *sql.DB
}

func NewTenantRepository(db *sql.DB) repository.TenantRepository {
	return &tenantRepository{db: db}
}

func (r *tenantRepository) Create(ctx context.Context, tenant *models.Tenant) error {
	query := `
		INSERT INTO tenants (
			_id, name, code, description, logo_url, website, industry, company_size,
			country, city, address, tax_id, billing_email, support_email, phone_number,
			is_active, max_users, max_storage, current_storage, owner_id,
			created_at, updated_at, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
		)`

	_, err := r.db.ExecContext(ctx, query,
		tenant.ID, tenant.Name, tenant.Code, tenant.Description, tenant.LogoURL,
		tenant.Website, tenant.Industry, tenant.CompanySize, tenant.Country, tenant.City,
		tenant.Address, tenant.TaxID, tenant.BillingEmail, tenant.SupportEmail,
		tenant.PhoneNumber, tenant.IsActive, tenant.MaxUsers, tenant.MaxStorage,
		tenant.CurrentStorage, tenant.OwnerID, tenant.CreatedAt, tenant.UpdatedAt, tenant.Version,
	)

	return err
}

func (r *tenantRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	query := `
		SELECT _id, name, code, description, logo_url, website, industry, company_size,
			country, city, address, tax_id, billing_email, support_email, phone_number,
			is_active, trial_ends_at, subscription_plan, max_users, max_storage,
			current_storage, settings, metadata, owner_id,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM tenants
		WHERE _id = $1 AND deleted_at IS NULL`

	tenant := &models.Tenant{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&tenant.ID, &tenant.Name, &tenant.Code, &tenant.Description, &tenant.LogoURL,
		&tenant.Website, &tenant.Industry, &tenant.CompanySize, &tenant.Country,
		&tenant.City, &tenant.Address, &tenant.TaxID, &tenant.BillingEmail,
		&tenant.SupportEmail, &tenant.PhoneNumber, &tenant.IsActive,
		&tenant.TrialEndsAt, &tenant.SubscriptionPlan, &tenant.MaxUsers,
		&tenant.MaxStorage, &tenant.CurrentStorage, &tenant.Settings, &tenant.Metadata,
		&tenant.OwnerID, &tenant.CreatedAt, &tenant.UpdatedAt, &tenant.CreatedBy,
		&tenant.UpdatedBy, &tenant.DeletedAt, &tenant.DeletedBy, &tenant.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant not found")
	}

	return tenant, err
}

func (r *tenantRepository) GetByCode(ctx context.Context, code string) (*models.Tenant, error) {
	query := `
		SELECT _id, name, code, description, logo_url, website, industry, company_size,
			country, city, address, tax_id, billing_email, support_email, phone_number,
			is_active, trial_ends_at, subscription_plan, max_users, max_storage,
			current_storage, settings, metadata, owner_id,
			created_at, updated_at, version
		FROM tenants
		WHERE code = $1 AND deleted_at IS NULL`

	tenant := &models.Tenant{}
	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&tenant.ID, &tenant.Name, &tenant.Code, &tenant.Description, &tenant.LogoURL,
		&tenant.Website, &tenant.Industry, &tenant.CompanySize, &tenant.Country,
		&tenant.City, &tenant.Address, &tenant.TaxID, &tenant.BillingEmail,
		&tenant.SupportEmail, &tenant.PhoneNumber, &tenant.IsActive,
		&tenant.TrialEndsAt, &tenant.SubscriptionPlan, &tenant.MaxUsers,
		&tenant.MaxStorage, &tenant.CurrentStorage, &tenant.Settings, &tenant.Metadata,
		&tenant.OwnerID, &tenant.CreatedAt, &tenant.UpdatedAt, &tenant.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant not found")
	}

	return tenant, err
}

func (r *tenantRepository) Update(ctx context.Context, tenant *models.Tenant) error {
	query := `
		UPDATE tenants SET
			name = $2, description = $3, logo_url = $4, website = $5, industry = $6,
			company_size = $7, country = $8, city = $9, address = $10, tax_id = $11,
			billing_email = $12, support_email = $13, phone_number = $14,
			is_active = $15, max_users = $16, max_storage = $17, current_storage = $18,
			settings = $19, metadata = $20, updated_at = $21, updated_by = $22,
			version = version + 1
		WHERE _id = $1 AND deleted_at IS NULL`

	result, err := r.db.ExecContext(ctx, query,
		tenant.ID, tenant.Name, tenant.Description, tenant.LogoURL, tenant.Website,
		tenant.Industry, tenant.CompanySize, tenant.Country, tenant.City, tenant.Address,
		tenant.TaxID, tenant.BillingEmail, tenant.SupportEmail, tenant.PhoneNumber,
		tenant.IsActive, tenant.MaxUsers, tenant.MaxStorage, tenant.CurrentStorage,
		tenant.Settings, tenant.Metadata, tenant.UpdatedAt, tenant.UpdatedBy,
	)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("tenant not found")
	}

	return nil
}

func (r *tenantRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE tenants SET deleted_at = NOW(), updated_at = NOW() WHERE _id = $1 AND deleted_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("tenant not found")
	}

	return nil
}

func (r *tenantRepository) List(ctx context.Context, filter models.TenantListFilter) ([]*models.Tenant, int, error) {
	where := "deleted_at IS NULL"
	args := []interface{}{}
	argCount := 1

	if filter.Name != nil {
		where += fmt.Sprintf(" AND name ILIKE $%d", argCount)
		args = append(args, "%"+*filter.Name+"%")
		argCount++
	}

	if filter.Code != nil {
		where += fmt.Sprintf(" AND code = $%d", argCount)
		args = append(args, *filter.Code)
		argCount++
	}

	if filter.IsActive != nil {
		where += fmt.Sprintf(" AND is_active = $%d", argCount)
		args = append(args, *filter.IsActive)
		argCount++
	}

	if filter.Search != nil && *filter.Search != "" {
		where += fmt.Sprintf(" AND (name ILIKE $%d OR code ILIKE $%d)", argCount, argCount)
		args = append(args, "%"+*filter.Search+"%")
		argCount++
	}

	// Count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenants WHERE %s", where)
	var total int
	r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)

	// List
	sortBy := "created_at"
	if filter.SortBy != "" {
		sortBy = filter.SortBy
	}
	sortOrder := "DESC"
	if filter.SortOrder != "" {
		sortOrder = filter.SortOrder
	}

	offset := (filter.Page - 1) * filter.Limit
	query := fmt.Sprintf(`
		SELECT _id, name, code, is_active, owner_id, max_users, max_storage,
			current_storage, created_at, updated_at, version
		FROM tenants WHERE %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		where, sortBy, sortOrder, argCount, argCount+1)

	args = append(args, filter.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	tenants := []*models.Tenant{}
	for rows.Next() {
		t := &models.Tenant{}
		rows.Scan(&t.ID, &t.Name, &t.Code, &t.IsActive, &t.OwnerID,
			&t.MaxUsers, &t.MaxStorage, &t.CurrentStorage,
			&t.CreatedAt, &t.UpdatedAt, &t.Version)
		tenants = append(tenants, t)
	}

	return tenants, total, nil
}

func (r *tenantRepository) Exists(ctx context.Context, code string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM tenants WHERE code = $1 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, code).Scan(&exists)
	return exists, err
}
