package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type UserIdentityRepository interface {
	Create(ctx context.Context, identity *models.UserIdentity) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserIdentity, error)
	GetByTypeAndValue(ctx context.Context, identityType, identityValue string) (*models.UserIdentity, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserIdentity, error)
	Update(ctx context.Context, identity *models.UserIdentity) error
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error
	VerifyIdentity(ctx context.Context, id uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type userIdentityRepository struct {
	db *sqlx.DB
}

func NewUserIdentityRepository(db *sqlx.DB) UserIdentityRepository {
	return &userIdentityRepository{db: db}
}

func (r *userIdentityRepository) Create(ctx context.Context, identity *models.UserIdentity) error {
	query := `INSERT INTO user_identities (_id, user_id, identity_type, identity_value, credential_secret,
		metadata, is_verified, created_at, updated_at, version)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.ExecContext(ctx, query, identity.ID, identity.UserID, identity.IdentityType,
		identity.IdentityValue, identity.CredentialSecret, identity.Metadata, identity.IsVerified,
		identity.CreatedAt, identity.UpdatedAt, identity.Version)
	return err
}

func (r *userIdentityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserIdentity, error) {
	var identity models.UserIdentity
	err := r.db.GetContext(ctx, &identity, `SELECT * FROM user_identities WHERE _id = $1`, id)
	return &identity, err
}

func (r *userIdentityRepository) GetByTypeAndValue(ctx context.Context, identityType, identityValue string) (*models.UserIdentity, error) {
	var identity models.UserIdentity
	query := `SELECT * FROM user_identities WHERE identity_type = $1 AND identity_value = $2`
	err := r.db.GetContext(ctx, &identity, query, identityType, identityValue)
	return &identity, err
}

func (r *userIdentityRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserIdentity, error) {
	var identities []*models.UserIdentity
	err := r.db.SelectContext(ctx, &identities,
		`SELECT * FROM user_identities WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	return identities, err
}

func (r *userIdentityRepository) Update(ctx context.Context, identity *models.UserIdentity) error {
	query := `UPDATE user_identities SET identity_value = $1, credential_secret = $2, metadata = $3,
		is_verified = $4, updated_at = $5, version = version + 1 WHERE _id = $6`
	identity.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query, identity.IdentityValue, identity.CredentialSecret,
		identity.Metadata, identity.IsVerified, identity.UpdatedAt, identity.ID)
	return err
}

func (r *userIdentityRepository) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE user_identities SET last_login_at = $1, updated_at = $1 WHERE _id = $2`, time.Now(), id)
	return err
}

func (r *userIdentityRepository) VerifyIdentity(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	_, err := r.db.ExecContext(ctx,
		`UPDATE user_identities SET is_verified = true, verified_at = $1, updated_at = $1 WHERE _id = $2`, now, id)
	return err
}

func (r *userIdentityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM user_identities WHERE _id = $1`, id)
	return err
}
