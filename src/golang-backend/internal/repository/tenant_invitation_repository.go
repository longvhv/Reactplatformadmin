package repository

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/yourusername/golang-backend/internal/models"
)

type TenantInvitationRepository struct {
	db *sqlx.DB
}

func NewTenantInvitationRepository(db *sqlx.DB) *TenantInvitationRepository {
	return &TenantInvitationRepository{db: db}
}

// generateToken generates a random token for invitation
func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// Create creates a new tenant invitation
func (r *TenantInvitationRepository) Create(invitation *models.TenantInvitation) error {
	query := `
		INSERT INTO tenant_invitations (
			_id, tenant_id, email, role_ids, department_id,
			token, status, expires_at, invited_by, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		) RETURNING _id, created_at`

	invitation.ID = uuid.New()
	invitation.CreatedAt = time.Now()
	invitation.Status = "PENDING"

	// Generate token if not provided
	if invitation.Token == "" {
		token, err := generateToken()
		if err != nil {
			return err
		}
		invitation.Token = token
	}

	// Set default expiration (7 days) if not provided
	if invitation.ExpiresAt.IsZero() {
		invitation.ExpiresAt = time.Now().Add(7 * 24 * time.Hour)
	}

	if invitation.RoleIDs == nil {
		invitation.RoleIDs = pq.StringArray{}
	}

	return r.db.QueryRow(
		query,
		invitation.ID, invitation.TenantID, invitation.Email, invitation.RoleIDs,
		invitation.DepartmentID, invitation.Token, invitation.Status,
		invitation.ExpiresAt, invitation.InvitedBy, invitation.CreatedAt,
	).Scan(&invitation.ID, &invitation.CreatedAt)
}

// GetByID retrieves a tenant invitation by ID
func (r *TenantInvitationRepository) GetByID(id uuid.UUID) (*models.TenantInvitation, error) {
	invitation := &models.TenantInvitation{}
	query := `
		SELECT _id, tenant_id, email, role_ids, department_id, token,
		       status, expires_at, invited_by, created_at
		FROM tenant_invitations
		WHERE _id = $1`

	err := r.db.Get(invitation, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invitation not found")
	}
	return invitation, err
}

// GetByToken retrieves a tenant invitation by token
func (r *TenantInvitationRepository) GetByToken(token string) (*models.TenantInvitation, error) {
	invitation := &models.TenantInvitation{}
	query := `
		SELECT _id, tenant_id, email, role_ids, department_id, token,
		       status, expires_at, invited_by, created_at
		FROM tenant_invitations
		WHERE token = $1`

	err := r.db.Get(invitation, query, token)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invitation not found")
	}
	return invitation, err
}

// List retrieves tenant invitations with pagination and filters
func (r *TenantInvitationRepository) List(page, pageSize int, filters map[string]interface{}) ([]models.TenantInvitation, int, error) {
	var invitations []models.TenantInvitation
	var total int

	where := []string{"1=1"}
	args := []interface{}{}
	argCount := 1

	if tenantID, ok := filters["tenant_id"].(string); ok && tenantID != "" {
		where = append(where, fmt.Sprintf("tenant_id = $%d", argCount))
		args = append(args, tenantID)
		argCount++
	}

	if email, ok := filters["email"].(string); ok && email != "" {
		where = append(where, fmt.Sprintf("email ILIKE $%d", argCount))
		args = append(args, "%"+email+"%")
		argCount++
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argCount))
		args = append(args, status)
		argCount++
	}

	whereClause := strings.Join(where, " AND ")

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_invitations WHERE %s", whereClause)
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT _id, tenant_id, email, role_ids, department_id, token,
		       status, expires_at, invited_by, created_at
		FROM tenant_invitations
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argCount, argCount+1)

	args = append(args, pageSize, offset)
	err = r.db.Select(&invitations, query, args...)

	return invitations, total, err
}

// ListByTenantID retrieves all invitations for a specific tenant
func (r *TenantInvitationRepository) ListByTenantID(tenantID uuid.UUID, page, pageSize int) ([]models.TenantInvitation, int, error) {
	filters := map[string]interface{}{
		"tenant_id": tenantID.String(),
	}
	return r.List(page, pageSize, filters)
}

// Update updates a tenant invitation
func (r *TenantInvitationRepository) Update(id uuid.UUID, updates map[string]interface{}) (*models.TenantInvitation, error) {
	if len(updates) == 0 {
		return r.GetByID(id)
	}

	setClauses := []string{}
	args := []interface{}{}
	argCount := 1

	for key, value := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", key, argCount))
		args = append(args, value)
		argCount++
	}

	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE tenant_invitations
		SET %s
		WHERE _id = $%d
		RETURNING _id`, strings.Join(setClauses, ", "), argCount)

	var updatedID uuid.UUID
	err := r.db.QueryRow(query, args...).Scan(&updatedID)
	if err != nil {
		return nil, err
	}

	return r.GetByID(updatedID)
}

// UpdateStatus updates the status of an invitation
func (r *TenantInvitationRepository) UpdateStatus(id uuid.UUID, status string) error {
	query := `
		UPDATE tenant_invitations
		SET status = $1
		WHERE _id = $2`

	result, err := r.db.Exec(query, status, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("invitation not found")
	}

	return nil
}

// Delete deletes a tenant invitation
func (r *TenantInvitationRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM tenant_invitations WHERE _id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("invitation not found")
	}

	return nil
}

// ExpireOldInvitations marks old pending invitations as expired
func (r *TenantInvitationRepository) ExpireOldInvitations() (int64, error) {
	query := `
		UPDATE tenant_invitations
		SET status = 'EXPIRED'
		WHERE status = 'PENDING' AND expires_at < $1`

	result, err := r.db.Exec(query, time.Now())
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}
