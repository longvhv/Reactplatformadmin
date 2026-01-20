package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type UserConsentRepository interface {
	Create(ctx context.Context, consent *models.UserConsent) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserConsent, error)
	List(ctx context.Context, page, pageSize int, userID *uuid.UUID, documentID *uuid.UUID, withdrawn *bool) ([]*models.UserConsent, int, error)
	Update(ctx context.Context, consent *models.UserConsent) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error)
	ListByDocumentID(ctx context.Context, documentID uuid.UUID) ([]*models.UserConsent, error)
	GetLatestConsent(ctx context.Context, userID, documentID uuid.UUID) (*models.UserConsent, error)
	WithdrawConsent(ctx context.Context, id uuid.UUID, reason string) error
	RenewConsent(ctx context.Context, id uuid.UUID) error
	GetExpiredConsents(ctx context.Context) ([]*models.UserConsent, error)
}

type userConsentRepository struct {
	db *sqlx.DB
}

func NewUserConsentRepository(db *sqlx.DB) UserConsentRepository {
	return &userConsentRepository{db: db}
}

func (r *userConsentRepository) Create(ctx context.Context, consent *models.UserConsent) error {
	query := `
		INSERT INTO user_consents (
			_id, user_id, legal_document_id, consent_given, consent_date,
			consent_ip, consent_user_agent, consent_method,
			document_version, document_title, document_type,
			withdrawn, expires_at, renewal_required,
			source_application, source_page, metadata,
			created_at, updated_at
		) VALUES (
			:_id, :user_id, :legal_document_id, :consent_given, :consent_date,
			:consent_ip, :consent_user_agent, :consent_method,
			:document_version, :document_title, :document_type,
			:withdrawn, :expires_at, :renewal_required,
			:source_application, :source_page, :metadata,
			:created_at, :updated_at
		)`

	_, err := r.db.NamedExecContext(ctx, query, consent)
	return err
}

func (r *userConsentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserConsent, error) {
	var consent models.UserConsent
	query := `SELECT * FROM user_consents WHERE _id = $1`

	err := r.db.GetContext(ctx, &consent, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("consent not found")
	}
	return &consent, err
}

func (r *userConsentRepository) List(ctx context.Context, page, pageSize int, userID *uuid.UUID, documentID *uuid.UUID, withdrawn *bool) ([]*models.UserConsent, int, error) {
	var consents []*models.UserConsent
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if userID != nil {
		whereClause += fmt.Sprintf(" AND user_id = $%d", argPos)
		args = append(args, *userID)
		argPos++
	}

	if documentID != nil {
		whereClause += fmt.Sprintf(" AND legal_document_id = $%d", argPos)
		args = append(args, *documentID)
		argPos++
	}

	if withdrawn != nil {
		whereClause += fmt.Sprintf(" AND withdrawn = $%d", argPos)
		args = append(args, *withdrawn)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_consents %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM user_consents %s
		ORDER BY consent_date DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &consents, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return consents, total, nil
}

func (r *userConsentRepository) Update(ctx context.Context, consent *models.UserConsent) error {
	query := `
		UPDATE user_consents SET
			consent_given = :consent_given,
			withdrawn = :withdrawn,
			withdrawn_date = :withdrawn_date,
			withdrawn_reason = :withdrawn_reason,
			renewal_required = :renewal_required,
			last_renewed_at = :last_renewed_at,
			updated_at = :updated_at
		WHERE _id = :_id`

	result, err := r.db.NamedExecContext(ctx, query, consent)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("consent not found")
	}

	return nil
}

func (r *userConsentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM user_consents WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("consent not found")
	}

	return nil
}

func (r *userConsentRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error) {
	var consents []*models.UserConsent
	query := `
		SELECT * FROM user_consents
		WHERE user_id = $1
		ORDER BY consent_date DESC`

	err := r.db.SelectContext(ctx, &consents, query, userID)
	return consents, err
}

func (r *userConsentRepository) ListByDocumentID(ctx context.Context, documentID uuid.UUID) ([]*models.UserConsent, error) {
	var consents []*models.UserConsent
	query := `
		SELECT * FROM user_consents
		WHERE legal_document_id = $1
		ORDER BY consent_date DESC`

	err := r.db.SelectContext(ctx, &consents, query, documentID)
	return consents, err
}

func (r *userConsentRepository) GetLatestConsent(ctx context.Context, userID, documentID uuid.UUID) (*models.UserConsent, error) {
	var consent models.UserConsent
	query := `
		SELECT * FROM user_consents
		WHERE user_id = $1 AND legal_document_id = $2
		ORDER BY consent_date DESC
		LIMIT 1`

	err := r.db.GetContext(ctx, &consent, query, userID, documentID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no consent found")
	}
	return &consent, err
}

func (r *userConsentRepository) WithdrawConsent(ctx context.Context, id uuid.UUID, reason string) error {
	query := `
		UPDATE user_consents
		SET withdrawn = true,
		    withdrawn_date = NOW(),
		    withdrawn_reason = $1,
		    updated_at = NOW()
		WHERE _id = $2`

	result, err := r.db.ExecContext(ctx, query, reason, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("consent not found")
	}

	return nil
}

func (r *userConsentRepository) RenewConsent(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE user_consents
		SET last_renewed_at = NOW(),
		    renewal_required = false,
		    updated_at = NOW()
		WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("consent not found")
	}

	return nil
}

func (r *userConsentRepository) GetExpiredConsents(ctx context.Context) ([]*models.UserConsent, error) {
	var consents []*models.UserConsent
	query := `
		SELECT * FROM user_consents
		WHERE expires_at IS NOT NULL
		  AND expires_at < NOW()
		  AND withdrawn = false
		ORDER BY expires_at DESC`

	err := r.db.SelectContext(ctx, &consents, query)
	return consents, err
}
