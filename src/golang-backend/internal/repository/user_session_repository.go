package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/yourusername/golang-backend/internal/models"
)

type UserSessionRepository struct {
	db *sql.DB
}

func NewUserSessionRepository(db *sql.DB) *UserSessionRepository {
	return &UserSessionRepository{db: db}
}

func (r *UserSessionRepository) Create(req *models.CreateUserSessionRequest) (*models.UserSession, error) {
	query := `
		INSERT INTO user_sessions (
			user_id, session_token, device_name, device_type, browser,
			os, ip_address, location, expires_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, is_active, last_activity_at, created_at, updated_at
	`

	session := &models.UserSession{
		UserID:       req.UserID,
		SessionToken: req.SessionToken,
		DeviceName:   req.DeviceName,
		DeviceType:   req.DeviceType,
		Browser:      req.Browser,
		OS:           req.OS,
		IPAddress:    req.IPAddress,
		Location:     req.Location,
		ExpiresAt:    req.ExpiresAt,
	}

	err := r.db.QueryRow(
		query,
		session.UserID, session.SessionToken, session.DeviceName,
		session.DeviceType, session.Browser, session.OS,
		session.IPAddress, session.Location, session.ExpiresAt,
	).Scan(&session.ID, &session.IsActive, &session.LastActivityAt, &session.CreatedAt, &session.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user session: %w", err)
	}

	return session, nil
}

func (r *UserSessionRepository) GetByID(id string) (*models.UserSession, error) {
	query := `
		SELECT _id, user_id, session_token, device_name, device_type, browser,
			os, ip_address, location, is_active, last_activity_at, expires_at,
			created_at, updated_at
		FROM user_sessions
		WHERE _id = $1
	`

	session := &models.UserSession{}
	err := r.db.QueryRow(query, id).Scan(
		&session.ID, &session.UserID, &session.SessionToken,
		&session.DeviceName, &session.DeviceType, &session.Browser,
		&session.OS, &session.IPAddress, &session.Location,
		&session.IsActive, &session.LastActivityAt, &session.ExpiresAt,
		&session.CreatedAt, &session.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user session not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user session: %w", err)
	}

	return session, nil
}

func (r *UserSessionRepository) GetByToken(token string) (*models.UserSession, error) {
	query := `
		SELECT _id, user_id, session_token, device_name, device_type, browser,
			os, ip_address, location, is_active, last_activity_at, expires_at,
			created_at, updated_at
		FROM user_sessions
		WHERE session_token = $1 AND is_active = true
	`

	session := &models.UserSession{}
	err := r.db.QueryRow(query, token).Scan(
		&session.ID, &session.UserID, &session.SessionToken,
		&session.DeviceName, &session.DeviceType, &session.Browser,
		&session.OS, &session.IPAddress, &session.Location,
		&session.IsActive, &session.LastActivityAt, &session.ExpiresAt,
		&session.CreatedAt, &session.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user session not found or inactive")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user session: %w", err)
	}

	// Check if session is expired
	if session.ExpiresAt != nil && session.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("session has expired")
	}

	return session, nil
}

func (r *UserSessionRepository) GetByUserID(userID string) ([]*models.UserSession, error) {
	query := `
		SELECT _id, user_id, session_token, device_name, device_type, browser,
			os, ip_address, location, is_active, last_activity_at, expires_at,
			created_at, updated_at
		FROM user_sessions
		WHERE user_id = $1
		ORDER BY last_activity_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	defer rows.Close()

	sessions := []*models.UserSession{}
	for rows.Next() {
		session := &models.UserSession{}
		err := rows.Scan(
			&session.ID, &session.UserID, &session.SessionToken,
			&session.DeviceName, &session.DeviceType, &session.Browser,
			&session.OS, &session.IPAddress, &session.Location,
			&session.IsActive, &session.LastActivityAt, &session.ExpiresAt,
			&session.CreatedAt, &session.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user session: %w", err)
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

func (r *UserSessionRepository) List(userID *string, isActive *bool, limit, offset int) ([]*models.UserSession, int, error) {
	conditions := []string{}
	args := []interface{}{}
	argIndex := 1

	if userID != nil {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIndex))
		args = append(args, *userID)
		argIndex++
	}

	if isActive != nil {
		conditions = append(conditions, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *isActive)
		argIndex++
	}

	whereClause := "1=1"
	if len(conditions) > 0 {
		whereClause = strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_sessions WHERE %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count user sessions: %w", err)
	}

	// Get sessions
	query := fmt.Sprintf(`
		SELECT _id, user_id, session_token, device_name, device_type, browser,
			os, ip_address, location, is_active, last_activity_at, expires_at,
			created_at, updated_at
		FROM user_sessions
		WHERE %s
		ORDER BY last_activity_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list user sessions: %w", err)
	}
	defer rows.Close()

	sessions := []*models.UserSession{}
	for rows.Next() {
		session := &models.UserSession{}
		err := rows.Scan(
			&session.ID, &session.UserID, &session.SessionToken,
			&session.DeviceName, &session.DeviceType, &session.Browser,
			&session.OS, &session.IPAddress, &session.Location,
			&session.IsActive, &session.LastActivityAt, &session.ExpiresAt,
			&session.CreatedAt, &session.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user session: %w", err)
		}
		sessions = append(sessions, session)
	}

	return sessions, total, nil
}

func (r *UserSessionRepository) Update(id string, req *models.UpdateUserSessionRequest) (*models.UserSession, error) {
	sets := []string{"updated_at = CURRENT_TIMESTAMP"}
	args := []interface{}{}
	argIndex := 1

	if req.IsActive != nil {
		sets = append(sets, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}
	if req.LastActivityAt != nil {
		sets = append(sets, fmt.Sprintf("last_activity_at = $%d", argIndex))
		args = append(args, *req.LastActivityAt)
		argIndex++
	}
	if req.ExpiresAt != nil {
		sets = append(sets, fmt.Sprintf("expires_at = $%d", argIndex))
		args = append(args, *req.ExpiresAt)
		argIndex++
	}

	if len(sets) == 1 { // Only updated_at
		return r.GetByID(id)
	}

	query := fmt.Sprintf(`
		UPDATE user_sessions
		SET %s
		WHERE _id = $%d
	`, strings.Join(sets, ", "), argIndex)

	args = append(args, id)
	_, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update user session: %w", err)
	}

	return r.GetByID(id)
}

func (r *UserSessionRepository) UpdateActivity(sessionID string) error {
	query := `
		UPDATE user_sessions
		SET last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE _id = $1
	`
	_, err := r.db.Exec(query, sessionID)
	return err
}

func (r *UserSessionRepository) Delete(id string) error {
	query := `DELETE FROM user_sessions WHERE _id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user session not found")
	}

	return nil
}

func (r *UserSessionRepository) DeleteByUserID(userID string) error {
	query := `DELETE FROM user_sessions WHERE user_id = $1`
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user sessions: %w", err)
	}
	return nil
}

func (r *UserSessionRepository) DeactivateExpiredSessions() (int64, error) {
	query := `
		UPDATE user_sessions
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE expires_at IS NOT NULL 
		AND expires_at < CURRENT_TIMESTAMP 
		AND is_active = true
	`
	result, err := r.db.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to deactivate expired sessions: %w", err)
	}

	return result.RowsAffected()
}
