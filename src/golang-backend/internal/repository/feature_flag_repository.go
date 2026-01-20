package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type FeatureFlagRepository interface {
	Create(ctx context.Context, flag *models.FeatureFlag) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error)
	GetByKey(ctx context.Context, key string) (*models.FeatureFlag, error)
	List(ctx context.Context, page, pageSize int, environment *string, isEnabled *bool) ([]*models.FeatureFlag, int, error)
	Update(ctx context.Context, flag *models.FeatureFlag) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByEnvironment(ctx context.Context, environment string) ([]*models.FeatureFlag, error)
	ListEnabled(ctx context.Context, environment string) ([]*models.FeatureFlag, error)
	Enable(ctx context.Context, id uuid.UUID) error
	Disable(ctx context.Context, id uuid.UUID) error
	UpdateRolloutPercentage(ctx context.Context, id uuid.UUID, percentage int) error
}

type featureFlagRepository struct {
	db *sqlx.DB
}

func NewFeatureFlagRepository(db *sqlx.DB) FeatureFlagRepository {
	return &featureFlagRepository{db: db}
}

func (r *featureFlagRepository) Create(ctx context.Context, flag *models.FeatureFlag) error {
	query := `
		INSERT INTO feature_flags (
			id, flag_key, flag_name, description, is_enabled, environment,
			flag_type, target_audience, percentage_rollout, conditions,
			metadata, created_by, created_at, updated_at
		) VALUES (
			:id, :flag_key, :flag_name, :description, :is_enabled, :environment,
			:flag_type, :target_audience, :percentage_rollout, :conditions,
			:metadata, :created_by, :created_at, :updated_at
		)`

	_, err := r.db.NamedExecContext(ctx, query, flag)
	return err
}

func (r *featureFlagRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error) {
	var flag models.FeatureFlag
	query := `SELECT * FROM feature_flags WHERE id = $1`

	err := r.db.GetContext(ctx, &flag, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("feature flag not found")
	}
	return &flag, err
}

func (r *featureFlagRepository) GetByKey(ctx context.Context, key string) (*models.FeatureFlag, error) {
	var flag models.FeatureFlag
	query := `SELECT * FROM feature_flags WHERE flag_key = $1`

	err := r.db.GetContext(ctx, &flag, query, key)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("feature flag not found")
	}
	return &flag, err
}

func (r *featureFlagRepository) List(ctx context.Context, page, pageSize int, environment *string, isEnabled *bool) ([]*models.FeatureFlag, int, error) {
	var flags []*models.FeatureFlag
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if environment != nil {
		whereClause += fmt.Sprintf(" AND environment = $%d", argPos)
		args = append(args, *environment)
		argPos++
	}

	if isEnabled != nil {
		whereClause += fmt.Sprintf(" AND is_enabled = $%d", argPos)
		args = append(args, *isEnabled)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM feature_flags %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM feature_flags %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &flags, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return flags, total, nil
}

func (r *featureFlagRepository) Update(ctx context.Context, flag *models.FeatureFlag) error {
	query := `
		UPDATE feature_flags SET
			flag_name = :flag_name,
			description = :description,
			is_enabled = :is_enabled,
			environment = :environment,
			flag_type = :flag_type,
			target_audience = :target_audience,
			percentage_rollout = :percentage_rollout,
			conditions = :conditions,
			metadata = :metadata,
			updated_at = :updated_at
		WHERE id = :id`

	result, err := r.db.NamedExecContext(ctx, query, flag)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("feature flag not found")
	}

	return nil
}

func (r *featureFlagRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM feature_flags WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("feature flag not found")
	}

	return nil
}

func (r *featureFlagRepository) ListByEnvironment(ctx context.Context, environment string) ([]*models.FeatureFlag, error) {
	var flags []*models.FeatureFlag
	query := `
		SELECT * FROM feature_flags
		WHERE environment = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &flags, query, environment)
	return flags, err
}

func (r *featureFlagRepository) ListEnabled(ctx context.Context, environment string) ([]*models.FeatureFlag, error) {
	var flags []*models.FeatureFlag
	query := `
		SELECT * FROM feature_flags
		WHERE environment = $1 AND is_enabled = true
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &flags, query, environment)
	return flags, err
}

func (r *featureFlagRepository) Enable(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE feature_flags
		SET is_enabled = true, enabled_at = NOW(), updated_at = NOW()
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("feature flag not found")
	}

	return nil
}

func (r *featureFlagRepository) Disable(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE feature_flags
		SET is_enabled = false, disabled_at = NOW(), updated_at = NOW()
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("feature flag not found")
	}

	return nil
}

func (r *featureFlagRepository) UpdateRolloutPercentage(ctx context.Context, id uuid.UUID, percentage int) error {
	query := `
		UPDATE feature_flags
		SET percentage_rollout = $1, updated_at = NOW()
		WHERE id = $2`

	result, err := r.db.ExecContext(ctx, query, percentage, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("feature flag not found")
	}

	return nil
}
