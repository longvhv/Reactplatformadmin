package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
)

// TenantRepository handles database operations for tenants
type TenantRepository struct {
	db *sql.DB
}

// NewTenantRepository creates a new tenant repository
func NewTenantRepository(db *sql.DB) *TenantRepository {
	return &TenantRepository{db: db}
}

// GetAll retrieves all tenants with optional filters
func (r *TenantRepository) GetAll(ctx context.Context, filters models.TenantFilters) ([]models.Tenant, error) {
	query := `
		SELECT _id, code, name, parent_tenant_id, path, tier, status,
		       data_region, compliance_level, timezone, billing_type,
		       profile, settings, created_at, updated_at, version
		FROM tenants
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	if filters.Tier != nil {
		query += fmt.Sprintf(" AND tier = $%d", argIndex)
		args = append(args, *filters.Tier)
		argIndex++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
		argIndex++
	}

	if filters.ParentTenantID != nil {
		query += fmt.Sprintf(" AND parent_tenant_id = $%d", argIndex)
		args = append(args, *filters.ParentTenantID)
		argIndex++
	}

	if filters.DataRegion != nil && *filters.DataRegion != "" {
		query += fmt.Sprintf(" AND data_region = $%d", argIndex)
		args = append(args, *filters.DataRegion)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR code ILIKE $%d)", argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query tenants: %w", err)
	}
	defer rows.Close()

	var tenants []models.Tenant
	for rows.Next() {
		tenant, err := r.scanTenant(rows)
		if err != nil {
			return nil, err
		}
		tenants = append(tenants, *tenant)
	}

	return tenants, rows.Err()
}

// GetByID retrieves a tenant by ID
func (r *TenantRepository) GetByID(ctx context.Context, id string) (*models.Tenant, error) {
	query := `
		SELECT _id, code, name, parent_tenant_id, path, tier, status,
		       data_region, compliance_level, timezone, billing_type,
		       profile, settings, created_at, updated_at, version
		FROM tenants
		WHERE _id = $1 AND deleted_at IS NULL
	`

	row := r.db.QueryRowContext(ctx, query, id)
	return r.scanTenantRow(row)
}

// GetByCode retrieves a tenant by code
func (r *TenantRepository) GetByCode(ctx context.Context, code string) (*models.Tenant, error) {
	query := `
		SELECT _id, code, name, parent_tenant_id, path, tier, status,
		       data_region, compliance_level, timezone, billing_type,
		       profile, settings, created_at, updated_at, version
		FROM tenants
		WHERE code = $1 AND deleted_at IS NULL
	`

	row := r.db.QueryRowContext(ctx, query, code)
	tenant, err := r.scanTenantRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return tenant, err
}

// Create creates a new tenant
func (r *TenantRepository) Create(ctx context.Context, req models.CreateTenantRequest) (*models.Tenant, error) {
	profileJSON, _ := json.Marshal(req.Profile)
	settingsJSON, _ := json.Marshal(req.Settings)

	tier := req.Tier
	if tier == "" {
		tier = models.TenantTierFree
	}
	status := req.Status
	if status == "" {
		status = models.TenantStatusTrial
	}

	query := `
		INSERT INTO tenants (code, name, parent_tenant_id, tier, status, 
		                     data_region, compliance_level, timezone, billing_type,
		                     profile, settings, partner_tenant_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING _id, path, created_at, updated_at, version
	`

	var tenant models.Tenant
	tenant.Code = req.Code
	tenant.Name = req.Name
	tenant.ParentTenantID = req.ParentTenantID
	tenant.Tier = tier
	tenant.Status = status
	tenant.DataRegion = req.DataRegion
	tenant.ComplianceLevel = req.ComplianceLevel
	tenant.Timezone = req.Timezone
	tenant.BillingType = req.BillingType
	tenant.Profile = req.Profile
	tenant.Settings = req.Settings
	tenant.PartnerTenantID = req.PartnerTenantID

	err := r.db.QueryRowContext(ctx, query,
		req.Code, req.Name, req.ParentTenantID, tier, status,
		req.DataRegion, req.ComplianceLevel, req.Timezone, req.BillingType,
		profileJSON, settingsJSON, req.PartnerTenantID,
	).Scan(&tenant.ID, &tenant.Path, &tenant.CreatedAt, &tenant.UpdatedAt, &tenant.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	return &tenant, nil
}

// Update updates a tenant
func (r *TenantRepository) Update(ctx context.Context, id string, req models.UpdateTenantRequest) (*models.Tenant, error) {
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Tier != nil {
		sets = append(sets, fmt.Sprintf("tier = $%d", argIndex))
		args = append(args, *req.Tier)
		argIndex++
	}

	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.ComplianceLevel != nil {
		sets = append(sets, fmt.Sprintf("compliance_level = $%d", argIndex))
		args = append(args, *req.ComplianceLevel)
		argIndex++
	}

	if req.Timezone != nil {
		sets = append(sets, fmt.Sprintf("timezone = $%d", argIndex))
		args = append(args, *req.Timezone)
		argIndex++
	}

	if req.BillingType != nil {
		sets = append(sets, fmt.Sprintf("billing_type = $%d", argIndex))
		args = append(args, *req.BillingType)
		argIndex++
	}

	if req.Profile != nil {
		profileJSON, _ := json.Marshal(req.Profile)
		sets = append(sets, fmt.Sprintf("profile = $%d", argIndex))
		args = append(args, profileJSON)
		argIndex++
	}

	if req.Settings != nil {
		settingsJSON, _ := json.Marshal(req.Settings)
		sets = append(sets, fmt.Sprintf("settings = $%d", argIndex))
		args = append(args, settingsJSON)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	sets = append(sets, "updated_at = NOW()", "version = version + 1")
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE tenants SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, code, name, parent_tenant_id, path, tier, status,
		          data_region, compliance_level, timezone, billing_type,
		          profile, settings, created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	row := r.db.QueryRowContext(ctx, query, args...)
	return r.scanTenantRow(row)
}

// Delete soft deletes a tenant
func (r *TenantRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE tenants SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, id)
	
	if err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("tenant not found")
	}

	return nil
}

// Helper methods
func (r *TenantRepository) scanTenant(rows *sql.Rows) (*models.Tenant, error) {
	var tenant models.Tenant
	var profileJSON, settingsJSON []byte

	err := rows.Scan(
		&tenant.ID, &tenant.Code, &tenant.Name, &tenant.ParentTenantID, &tenant.Path,
		&tenant.Tier, &tenant.Status, &tenant.DataRegion, &tenant.ComplianceLevel,
		&tenant.Timezone, &tenant.BillingType, &profileJSON, &settingsJSON,
		&tenant.CreatedAt, &tenant.UpdatedAt, &tenant.Version,
	)
	if err != nil {
		return nil, err
	}

	if profileJSON != nil {
		json.Unmarshal(profileJSON, &tenant.Profile)
	}
	if settingsJSON != nil {
		json.Unmarshal(settingsJSON, &tenant.Settings)
	}

	return &tenant, nil
}

func (r *TenantRepository) scanTenantRow(row *sql.Row) (*models.Tenant, error) {
	var tenant models.Tenant
	var profileJSON, settingsJSON []byte

	err := row.Scan(
		&tenant.ID, &tenant.Code, &tenant.Name, &tenant.ParentTenantID, &tenant.Path,
		&tenant.Tier, &tenant.Status, &tenant.DataRegion, &tenant.ComplianceLevel,
		&tenant.Timezone, &tenant.BillingType, &profileJSON, &settingsJSON,
		&tenant.CreatedAt, &tenant.UpdatedAt, &tenant.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant not found")
	}
	if err != nil {
		return nil, err
	}

	if profileJSON != nil {
		json.Unmarshal(profileJSON, &tenant.Profile)
	}
	if settingsJSON != nil {
		json.Unmarshal(settingsJSON, &tenant.Settings)
	}

	return &tenant, nil
}
