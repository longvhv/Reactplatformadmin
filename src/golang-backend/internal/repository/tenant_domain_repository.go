package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
)

type TenantDomainRepository struct {
	db *sql.DB
}

func NewTenantDomainRepository(db *sql.DB) *TenantDomainRepository {
	return &TenantDomainRepository{db: db}
}

func (r *TenantDomainRepository) Create(domain *models.TenantDomain) error {
	query := `
		INSERT INTO tenant_domains (
			_id, tenant_id, domain, verification_status, verification_method,
			verification_token, policy, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING _id, created_at
	`

	return r.db.QueryRow(
		query,
		domain.ID,
		domain.TenantID,
		domain.Domain,
		domain.VerificationStatus,
		domain.VerificationMethod,
		domain.VerificationToken,
		domain.Policy,
	).Scan(&domain.ID, &domain.CreatedAt)
}

func (r *TenantDomainRepository) GetByID(id string) (*models.TenantDomain, error) {
	query := `
		SELECT 
			_id, tenant_id, domain, verification_status, verification_method,
			verification_token, policy, verified_at, created_at
		FROM tenant_domains
		WHERE _id = $1
	`

	domain := &models.TenantDomain{}
	err := r.db.QueryRow(query, id).Scan(
		&domain.ID,
		&domain.TenantID,
		&domain.Domain,
		&domain.VerificationStatus,
		&domain.VerificationMethod,
		&domain.VerificationToken,
		&domain.Policy,
		&domain.VerifiedAt,
		&domain.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant domain not found")
	}

	return domain, err
}

func (r *TenantDomainRepository) GetByDomain(domain string) (*models.TenantDomain, error) {
	query := `
		SELECT 
			_id, tenant_id, domain, verification_status, verification_method,
			verification_token, policy, verified_at, created_at
		FROM tenant_domains
		WHERE domain = $1
	`

	td := &models.TenantDomain{}
	err := r.db.QueryRow(query, domain).Scan(
		&td.ID,
		&td.TenantID,
		&td.Domain,
		&td.VerificationStatus,
		&td.VerificationMethod,
		&td.VerificationToken,
		&td.Policy,
		&td.VerifiedAt,
		&td.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant domain not found")
	}

	return td, err
}

func (r *TenantDomainRepository) List(tenantID *string, verificationStatus *string, page, pageSize int) ([]models.TenantDomain, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var conditions []string
	var args []interface{}
	argCount := 0

	if tenantID != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argCount))
		args = append(args, *tenantID)
	}

	if verificationStatus != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("verification_status = $%d", argCount))
		args = append(args, *verificationStatus)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_domains %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT 
			_id, tenant_id, domain, verification_status, verification_method,
			verification_token, policy, verified_at, created_at
		FROM tenant_domains
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

	var domains []models.TenantDomain
	for rows.Next() {
		var domain models.TenantDomain
		err := rows.Scan(
			&domain.ID,
			&domain.TenantID,
			&domain.Domain,
			&domain.VerificationStatus,
			&domain.VerificationMethod,
			&domain.VerificationToken,
			&domain.Policy,
			&domain.VerifiedAt,
			&domain.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		domains = append(domains, domain)
	}

	return domains, total, nil
}

func (r *TenantDomainRepository) Update(id string, req *models.UpdateTenantDomainRequest) error {
	var updates []string
	var args []interface{}
	argCount := 0

	if req.VerificationStatus != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("verification_status = $%d", argCount))
		args = append(args, *req.VerificationStatus)

		// If verified, set verified_at timestamp
		if *req.VerificationStatus == "VERIFIED" {
			argCount++
			updates = append(updates, fmt.Sprintf("verified_at = NOW()"))
		}
	}

	if req.VerificationMethod != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("verification_method = $%d", argCount))
		args = append(args, *req.VerificationMethod)
	}

	if req.Policy != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("policy = $%d", argCount))
		args = append(args, *req.Policy)
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	argCount++
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE tenant_domains
		SET %s
		WHERE _id = $%d
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
		return fmt.Errorf("tenant domain not found")
	}

	return nil
}

func (r *TenantDomainRepository) Delete(id string) error {
	query := `DELETE FROM tenant_domains WHERE _id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("tenant domain not found")
	}

	return nil
}

func (r *TenantDomainRepository) ListByTenantID(tenantID string) ([]models.TenantDomain, error) {
	query := `
		SELECT 
			_id, tenant_id, domain, verification_status, verification_method,
			verification_token, policy, verified_at, created_at
		FROM tenant_domains
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var domains []models.TenantDomain
	for rows.Next() {
		var domain models.TenantDomain
		err := rows.Scan(
			&domain.ID,
			&domain.TenantID,
			&domain.Domain,
			&domain.VerificationStatus,
			&domain.VerificationMethod,
			&domain.VerificationToken,
			&domain.Policy,
			&domain.VerifiedAt,
			&domain.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		domains = append(domains, domain)
	}

	return domains, nil
}

func generateVerificationToken() string {
	return uuid.New().String()
}
