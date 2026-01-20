package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type AuthIdentifierRepository interface {
	Create(ctx context.Context, identifier *models.AuthIdentifier) error
	GetByHash(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) (*models.AuthIdentifier, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.AuthIdentifier, error)
	Delete(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) error
}

type authIdentifierRepository struct {
	db *sqlx.DB
}

func NewAuthIdentifierRepository(db *sqlx.DB) AuthIdentifierRepository {
	return &authIdentifierRepository{db: db}
}

func (r *authIdentifierRepository) Create(ctx context.Context, identifier *models.AuthIdentifier) error {
	query := `INSERT INTO auth_identifiers (tenant_id, identifier_hash, user_id, identity_id, identifier_type, original_value)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.ExecContext(ctx, query, identifier.TenantID, identifier.IdentifierHash, identifier.UserID,
		identifier.IdentityID, identifier.IdentifierType, identifier.OriginalValue)
	return err
}

func (r *authIdentifierRepository) GetByHash(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) (*models.AuthIdentifier, error) {
	var identifier models.AuthIdentifier
	query := `SELECT * FROM auth_identifiers WHERE tenant_id = $1 AND identifier_hash = $2`
	err := r.db.GetContext(ctx, &identifier, query, tenantID, identifierHash)
	return &identifier, err
}

func (r *authIdentifierRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.AuthIdentifier, error) {
	var identifiers []*models.AuthIdentifier
	err := r.db.SelectContext(ctx, &identifiers, `SELECT * FROM auth_identifiers WHERE user_id = $1`, userID)
	return identifiers, err
}

func (r *authIdentifierRepository) Delete(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM auth_identifiers WHERE tenant_id = $1 AND identifier_hash = $2`,
		tenantID, identifierHash)
	return err
}
