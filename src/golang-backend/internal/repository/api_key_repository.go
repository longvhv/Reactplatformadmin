package repository

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/yourusername/golang-backend/internal/models"
)

type APIKeyRepository struct {
	db *sqlx.DB
}

func NewAPIKeyRepository(db *sqlx.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

// generateAPIKey generates a random API key and returns the plain key and hash
func generateAPIKey() (plainKey, prefix, hash string, err error) {
	// Generate 32 random bytes
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", "", err
	}

	// Encode to base64
	plainKey = base64.URLEncoding.EncodeToString(b)
	
	// First 8 characters as prefix
	prefix = plainKey[:8]
	
	// SHA256 hash
	h := sha256.Sum256([]byte(plainKey))
	hash = fmt.Sprintf("%x", h)

	return plainKey, prefix, hash, nil
}

// Create creates a new API key
func (r *APIKeyRepository) Create(apiKey *models.APIKey) (string, error) {
	query := `
		INSERT INTO api_keys (
			_id, tenant_id, name, key_prefix, key_hash, scopes,
			allowed_ips, expires_at, created_at, created_by, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) RETURNING _id, created_at`

	apiKey.ID = uuid.New()
	apiKey.CreatedAt = time.Now()
	apiKey.Version = 1

	// Generate API key
	plainKey, prefix, hash, err := generateAPIKey()
	if err != nil {
		return "", err
	}

	apiKey.KeyPrefix = prefix
	apiKey.KeyHash = hash

	if apiKey.Scopes == nil {
		apiKey.Scopes = pq.StringArray{}
	}
	if apiKey.AllowedIPs == nil {
		apiKey.AllowedIPs = pq.StringArray{}
	}

	err = r.db.QueryRow(
		query,
		apiKey.ID, apiKey.TenantID, apiKey.Name, apiKey.KeyPrefix,
		apiKey.KeyHash, apiKey.Scopes, apiKey.AllowedIPs, apiKey.ExpiresAt,
		apiKey.CreatedAt, apiKey.CreatedBy, apiKey.Version,
	).Scan(&apiKey.ID, &apiKey.CreatedAt)

	if err != nil {
		return "", err
	}

	return plainKey, nil
}

// GetByID retrieves an API key by ID
func (r *APIKeyRepository) GetByID(id uuid.UUID) (*models.APIKey, error) {
	apiKey := &models.APIKey{}
	query := `
		SELECT _id, tenant_id, name, key_prefix, key_hash, scopes,
		       allowed_ips, expires_at, last_used_at, created_at, created_by, version
		FROM api_keys
		WHERE _id = $1`

	err := r.db.Get(apiKey, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("API key not found")
	}
	return apiKey, err
}

// GetByKeyHash retrieves an API key by its hash
func (r *APIKeyRepository) GetByKeyHash(keyHash string) (*models.APIKey, error) {
	apiKey := &models.APIKey{}
	query := `
		SELECT _id, tenant_id, name, key_prefix, key_hash, scopes,
		       allowed_ips, expires_at, last_used_at, created_at, created_by, version
		FROM api_keys
		WHERE key_hash = $1`

	err := r.db.Get(apiKey, query, keyHash)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("API key not found")
	}
	return apiKey, err
}

// List retrieves API keys with pagination and filters
func (r *APIKeyRepository) List(page, pageSize int, filters map[string]interface{}) ([]models.APIKey, int, error) {
	var apiKeys []models.APIKey
	var total int

	where := []string{"1=1"}
	args := []interface{}{}
	argCount := 1

	if tenantID, ok := filters["tenant_id"].(string); ok && tenantID != "" {
		where = append(where, fmt.Sprintf("tenant_id = $%d", argCount))
		args = append(args, tenantID)
		argCount++
	}

	if name, ok := filters["name"].(string); ok && name != "" {
		where = append(where, fmt.Sprintf("name ILIKE $%d", argCount))
		args = append(args, "%"+name+"%")
		argCount++
	}

	if isExpired, ok := filters["is_expired"].(bool); ok {
		if isExpired {
			where = append(where, fmt.Sprintf("expires_at < $%d", argCount))
		} else {
			where = append(where, fmt.Sprintf("(expires_at IS NULL OR expires_at >= $%d)", argCount))
		}
		args = append(args, time.Now())
		argCount++
	}

	whereClause := strings.Join(where, " AND ")

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM api_keys WHERE %s", whereClause)
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT _id, tenant_id, name, key_prefix, key_hash, scopes,
		       allowed_ips, expires_at, last_used_at, created_at, created_by, version
		FROM api_keys
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argCount, argCount+1)

	args = append(args, pageSize, offset)
	err = r.db.Select(&apiKeys, query, args...)

	return apiKeys, total, err
}

// ListByTenantID retrieves all API keys for a specific tenant
func (r *APIKeyRepository) ListByTenantID(tenantID uuid.UUID, page, pageSize int) ([]models.APIKey, int, error) {
	filters := map[string]interface{}{
		"tenant_id": tenantID.String(),
	}
	return r.List(page, pageSize, filters)
}

// Update updates an API key
func (r *APIKeyRepository) Update(id uuid.UUID, updates map[string]interface{}) (*models.APIKey, error) {
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

	setClauses = append(setClauses, fmt.Sprintf("version = version + 1"))
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE api_keys
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

// Delete deletes an API key
func (r *APIKeyRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM api_keys WHERE _id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("API key not found")
	}

	return nil
}

// UpdateLastUsed updates the last_used_at timestamp
func (r *APIKeyRepository) UpdateLastUsed(id uuid.UUID) error {
	query := `
		UPDATE api_keys
		SET last_used_at = $1
		WHERE _id = $2`

	_, err := r.db.Exec(query, time.Now(), id)
	return err
}

// ValidateKey validates an API key and returns the key record if valid
func (r *APIKeyRepository) ValidateKey(plainKey string) (*models.APIKey, error) {
	// Hash the plain key
	h := sha256.Sum256([]byte(plainKey))
	keyHash := fmt.Sprintf("%x", h)

	apiKey, err := r.GetByKeyHash(keyHash)
	if err != nil {
		return nil, fmt.Errorf("invalid API key")
	}

	// Check if expired
	if apiKey.ExpiresAt != nil && time.Now().After(*apiKey.ExpiresAt) {
		return nil, fmt.Errorf("API key has expired")
	}

	// Update last used timestamp
	_ = r.UpdateLastUsed(apiKey.ID)

	return apiKey, nil
}
