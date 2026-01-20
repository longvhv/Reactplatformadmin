package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

// UserDeviceRepository defines the interface for user device data access
type UserDeviceRepository interface {
	Create(ctx context.Context, device *models.UserDevice) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.UserDevice, error)
	GetByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*models.UserDevice, error)
	List(ctx context.Context, page, pageSize int, userID *uuid.UUID, status *string, deviceType *string) ([]*models.UserDevice, int, error)
	Update(ctx context.Context, device *models.UserDevice) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByUserID(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]*models.UserDevice, int, error)
	UpdateActivity(ctx context.Context, id uuid.UUID) error
	UpdateTrustStatus(ctx context.Context, id uuid.UUID, isTrusted bool) error
	RevokeDevice(ctx context.Context, id uuid.UUID, reason string) error
	GetActiveDevicesCount(ctx context.Context, userID uuid.UUID) (int, error)
	ListTrustedDevices(ctx context.Context, userID uuid.UUID) ([]*models.UserDevice, error)
}

type userDeviceRepository struct {
	db *sqlx.DB
}

// NewUserDeviceRepository creates a new user device repository
func NewUserDeviceRepository(db *sqlx.DB) UserDeviceRepository {
	return &userDeviceRepository{db: db}
}

// Create creates a new user device
func (r *userDeviceRepository) Create(ctx context.Context, device *models.UserDevice) error {
	query := `
		INSERT INTO user_devices (
			_id, user_id, device_type, device_name, device_model, manufacturer,
			os, os_version, browser, browser_version, app_name, app_version,
			ip_address, user_agent, location, is_trusted, fingerprint, push_token,
			first_seen_at, last_used_at, login_count, status, metadata,
			created_at, updated_at
		) VALUES (
			:_id, :user_id, :device_type, :device_name, :device_model, :manufacturer,
			:os, :os_version, :browser, :browser_version, :app_name, :app_version,
			:ip_address, :user_agent, :location, :is_trusted, :fingerprint, :push_token,
			:first_seen_at, :last_used_at, :login_count, :status, :metadata,
			:created_at, :updated_at
		)`

	_, err := r.db.NamedExecContext(ctx, query, device)
	return err
}

// GetByID gets a device by ID
func (r *userDeviceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserDevice, error) {
	var device models.UserDevice
	query := `SELECT * FROM user_devices WHERE _id = $1`

	err := r.db.GetContext(ctx, &device, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("device not found")
	}
	return &device, err
}

// GetByFingerprint gets a device by user ID and fingerprint
func (r *userDeviceRepository) GetByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*models.UserDevice, error) {
	var device models.UserDevice
	query := `SELECT * FROM user_devices WHERE user_id = $1 AND fingerprint = $2 ORDER BY last_used_at DESC LIMIT 1`

	err := r.db.GetContext(ctx, &device, query, userID, fingerprint)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("device not found")
	}
	return &device, err
}

// List lists devices with pagination and filters
func (r *userDeviceRepository) List(ctx context.Context, page, pageSize int, userID *uuid.UUID, status *string, deviceType *string) ([]*models.UserDevice, int, error) {
	var devices []*models.UserDevice
	var total int

	offset := (page - 1) * pageSize

	// Build WHERE clause
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if userID != nil {
		whereClause += fmt.Sprintf(" AND user_id = $%d", argPos)
		args = append(args, *userID)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	if deviceType != nil {
		whereClause += fmt.Sprintf(" AND device_type = $%d", argPos)
		args = append(args, *deviceType)
		argPos++
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_devices %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get devices
	query := fmt.Sprintf(`
		SELECT * FROM user_devices %s
		ORDER BY last_used_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &devices, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return devices, total, nil
}

// Update updates a user device
func (r *userDeviceRepository) Update(ctx context.Context, device *models.UserDevice) error {
	query := `
		UPDATE user_devices SET
			device_name = :device_name,
			is_trusted = :is_trusted,
			push_token = :push_token,
			status = :status,
			revoked_at = :revoked_at,
			revoked_reason = :revoked_reason,
			updated_at = :updated_at
		WHERE _id = :_id`

	result, err := r.db.NamedExecContext(ctx, query, device)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("device not found")
	}

	return nil
}

// Delete deletes a user device
func (r *userDeviceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM user_devices WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("device not found")
	}

	return nil
}

// ListByUserID lists devices for a specific user
func (r *userDeviceRepository) ListByUserID(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]*models.UserDevice, int, error) {
	var devices []*models.UserDevice
	var total int

	offset := (page - 1) * pageSize

	// Count total
	countQuery := `SELECT COUNT(*) FROM user_devices WHERE user_id = $1`
	err := r.db.GetContext(ctx, &total, countQuery, userID)
	if err != nil {
		return nil, 0, err
	}

	// Get devices
	query := `
		SELECT * FROM user_devices
		WHERE user_id = $1
		ORDER BY last_used_at DESC
		LIMIT $2 OFFSET $3`

	err = r.db.SelectContext(ctx, &devices, query, userID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return devices, total, nil
}

// UpdateActivity updates the device's last used timestamp and login count
func (r *userDeviceRepository) UpdateActivity(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE user_devices
		SET last_used_at = NOW(),
		    login_count = login_count + 1,
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
		return fmt.Errorf("device not found")
	}

	return nil
}

// UpdateTrustStatus updates the trust status of a device
func (r *userDeviceRepository) UpdateTrustStatus(ctx context.Context, id uuid.UUID, isTrusted bool) error {
	query := `
		UPDATE user_devices
		SET is_trusted = $1, updated_at = NOW()
		WHERE _id = $2`

	result, err := r.db.ExecContext(ctx, query, isTrusted, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("device not found")
	}

	return nil
}

// RevokeDevice revokes a device
func (r *userDeviceRepository) RevokeDevice(ctx context.Context, id uuid.UUID, reason string) error {
	query := `
		UPDATE user_devices
		SET status = 'revoked',
		    revoked_at = NOW(),
		    revoked_reason = $1,
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
		return fmt.Errorf("device not found")
	}

	return nil
}

// GetActiveDevicesCount gets the count of active devices for a user
func (r *userDeviceRepository) GetActiveDevicesCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_devices WHERE user_id = $1 AND status = 'active'`

	err := r.db.GetContext(ctx, &count, query, userID)
	return count, err
}

// ListTrustedDevices lists trusted devices for a user
func (r *userDeviceRepository) ListTrustedDevices(ctx context.Context, userID uuid.UUID) ([]*models.UserDevice, error) {
	var devices []*models.UserDevice
	query := `
		SELECT * FROM user_devices
		WHERE user_id = $1 AND is_trusted = true AND status = 'active'
		ORDER BY last_used_at DESC`

	err := r.db.SelectContext(ctx, &devices, query, userID)
	return devices, err
}
