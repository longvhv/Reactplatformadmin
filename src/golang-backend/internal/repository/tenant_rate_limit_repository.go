package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yourusername/golang-backend/internal/models"
)

type TenantRateLimitRepository struct {
	db *sql.DB
}

func NewTenantRateLimitRepository(db *sql.DB) *TenantRateLimitRepository {
	return &TenantRateLimitRepository{db: db}
}

func (r *TenantRateLimitRepository) Create(limit *models.TenantRateLimit) error {
	query := `
		INSERT INTO tenant_rate_limits (
			_id, tenant_id, service_package_id, limit_name, limit_key,
			resource_type, endpoint_pattern, max_requests, time_window, window_unit,
			burst_limit, concurrent_limit, limit_type, limit_scope, is_enabled,
			is_strict, block_duration, retry_after, custom_error_message, custom_error_code,
			current_usage, peak_usage, exceeded_count, alert_threshold, alert_enabled,
			priority, can_override, description, tags, metadata, created_by,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
			$31, NOW(), NOW()
		)
		RETURNING _id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		limit.ID, limit.TenantID, limit.ServicePackageID, limit.LimitName, limit.LimitKey,
		limit.ResourceType, limit.EndpointPattern, limit.MaxRequests, limit.TimeWindow, limit.WindowUnit,
		limit.BurstLimit, limit.ConcurrentLimit, limit.LimitType, limit.LimitScope, limit.IsEnabled,
		limit.IsStrict, limit.BlockDuration, limit.RetryAfter, limit.CustomErrorMessage, limit.CustomErrorCode,
		limit.CurrentUsage, limit.PeakUsage, limit.ExceededCount, limit.AlertThreshold, limit.AlertEnabled,
		limit.Priority, limit.CanOverride, limit.Description, limit.Tags, limit.Metadata,
		limit.CreatedBy,
	).Scan(&limit.ID, &limit.CreatedAt, &limit.UpdatedAt)
}

func (r *TenantRateLimitRepository) GetByID(id string) (*models.TenantRateLimit, error) {
	query := `
		SELECT 
			_id, tenant_id, service_package_id, limit_name, limit_key,
			resource_type, endpoint_pattern, max_requests, time_window, window_unit,
			burst_limit, concurrent_limit, limit_type, limit_scope, is_enabled,
			is_strict, block_duration, retry_after, custom_error_message, custom_error_code,
			current_usage, peak_usage, last_exceeded_at, exceeded_count, alert_threshold,
			alert_enabled, priority, can_override, override_until, description,
			tags, metadata, created_at, updated_at, created_by, updated_by
		FROM tenant_rate_limits
		WHERE _id = $1
	`

	limit := &models.TenantRateLimit{}
	err := r.db.QueryRow(query, id).Scan(
		&limit.ID, &limit.TenantID, &limit.ServicePackageID, &limit.LimitName, &limit.LimitKey,
		&limit.ResourceType, &limit.EndpointPattern, &limit.MaxRequests, &limit.TimeWindow, &limit.WindowUnit,
		&limit.BurstLimit, &limit.ConcurrentLimit, &limit.LimitType, &limit.LimitScope, &limit.IsEnabled,
		&limit.IsStrict, &limit.BlockDuration, &limit.RetryAfter, &limit.CustomErrorMessage, &limit.CustomErrorCode,
		&limit.CurrentUsage, &limit.PeakUsage, &limit.LastExceededAt, &limit.ExceededCount, &limit.AlertThreshold,
		&limit.AlertEnabled, &limit.Priority, &limit.CanOverride, &limit.OverrideUntil, &limit.Description,
		&limit.Tags, &limit.Metadata, &limit.CreatedAt, &limit.UpdatedAt, &limit.CreatedBy, &limit.UpdatedBy,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("rate limit not found")
	}

	return limit, err
}

func (r *TenantRateLimitRepository) List(tenantID *string, resourceType *string, isEnabled *bool, page, pageSize int) ([]models.TenantRateLimit, int, error) {
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

	if resourceType != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("resource_type = $%d", argCount))
		args = append(args, *resourceType)
	}

	if isEnabled != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("is_enabled = $%d", argCount))
		args = append(args, *isEnabled)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_rate_limits %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT 
			_id, tenant_id, service_package_id, limit_name, limit_key,
			resource_type, endpoint_pattern, max_requests, time_window, window_unit,
			burst_limit, concurrent_limit, limit_type, limit_scope, is_enabled,
			is_strict, block_duration, retry_after, custom_error_message, custom_error_code,
			current_usage, peak_usage, last_exceeded_at, exceeded_count, alert_threshold,
			alert_enabled, priority, can_override, override_until, description,
			tags, metadata, created_at, updated_at, created_by, updated_by
		FROM tenant_rate_limits
		%s
		ORDER BY priority DESC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount+1, argCount+2)

	args = append(args, pageSize, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var limits []models.TenantRateLimit
	for rows.Next() {
		var limit models.TenantRateLimit
		err := rows.Scan(
			&limit.ID, &limit.TenantID, &limit.ServicePackageID, &limit.LimitName, &limit.LimitKey,
			&limit.ResourceType, &limit.EndpointPattern, &limit.MaxRequests, &limit.TimeWindow, &limit.WindowUnit,
			&limit.BurstLimit, &limit.ConcurrentLimit, &limit.LimitType, &limit.LimitScope, &limit.IsEnabled,
			&limit.IsStrict, &limit.BlockDuration, &limit.RetryAfter, &limit.CustomErrorMessage, &limit.CustomErrorCode,
			&limit.CurrentUsage, &limit.PeakUsage, &limit.LastExceededAt, &limit.ExceededCount, &limit.AlertThreshold,
			&limit.AlertEnabled, &limit.Priority, &limit.CanOverride, &limit.OverrideUntil, &limit.Description,
			&limit.Tags, &limit.Metadata, &limit.CreatedAt, &limit.UpdatedAt, &limit.CreatedBy, &limit.UpdatedBy,
		)
		if err != nil {
			return nil, 0, err
		}
		limits = append(limits, limit)
	}

	return limits, total, nil
}

func (r *TenantRateLimitRepository) Update(id string, req *models.UpdateTenantRateLimitRequest) error {
	var updates []string
	var args []interface{}
	argCount := 0

	if req.LimitName != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("limit_name = $%d", argCount))
		args = append(args, *req.LimitName)
	}

	if req.MaxRequests != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("max_requests = $%d", argCount))
		args = append(args, *req.MaxRequests)
	}

	if req.TimeWindow != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("time_window = $%d", argCount))
		args = append(args, *req.TimeWindow)
	}

	if req.WindowUnit != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("window_unit = $%d", argCount))
		args = append(args, *req.WindowUnit)
	}

	if req.BurstLimit != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("burst_limit = $%d", argCount))
		args = append(args, *req.BurstLimit)
	}

	if req.ConcurrentLimit != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("concurrent_limit = $%d", argCount))
		args = append(args, *req.ConcurrentLimit)
	}

	if req.IsEnabled != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("is_enabled = $%d", argCount))
		args = append(args, *req.IsEnabled)
	}

	if req.IsStrict != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("is_strict = $%d", argCount))
		args = append(args, *req.IsStrict)
	}

	if req.BlockDuration != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("block_duration = $%d", argCount))
		args = append(args, *req.BlockDuration)
	}

	if req.RetryAfter != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("retry_after = $%d", argCount))
		args = append(args, *req.RetryAfter)
	}

	if req.CustomErrorMessage != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("custom_error_message = $%d", argCount))
		args = append(args, *req.CustomErrorMessage)
	}

	if req.CustomErrorCode != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("custom_error_code = $%d", argCount))
		args = append(args, *req.CustomErrorCode)
	}

	if req.AlertThreshold != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("alert_threshold = $%d", argCount))
		args = append(args, *req.AlertThreshold)
	}

	if req.AlertEnabled != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("alert_enabled = $%d", argCount))
		args = append(args, *req.AlertEnabled)
	}

	if req.Priority != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("priority = $%d", argCount))
		args = append(args, *req.Priority)
	}

	if req.CanOverride != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("can_override = $%d", argCount))
		args = append(args, *req.CanOverride)
	}

	if req.Description != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("description = $%d", argCount))
		args = append(args, *req.Description)
	}

	if req.Tags != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("tags = $%d", argCount))
		args = append(args, models.StringArray(req.Tags))
	}

	if req.Metadata != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("metadata = $%d", argCount))
		args = append(args, req.Metadata)
	}

	if req.UpdatedBy != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("updated_by = $%d", argCount))
		args = append(args, *req.UpdatedBy)
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	updates = append(updates, "updated_at = NOW()")

	argCount++
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE tenant_rate_limits
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
		return fmt.Errorf("rate limit not found")
	}

	return nil
}

func (r *TenantRateLimitRepository) Delete(id string) error {
	query := `DELETE FROM tenant_rate_limits WHERE _id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("rate limit not found")
	}

	return nil
}

func (r *TenantRateLimitRepository) ListByTenantID(tenantID string) ([]models.TenantRateLimit, error) {
	query := `
		SELECT 
			_id, tenant_id, service_package_id, limit_name, limit_key,
			resource_type, endpoint_pattern, max_requests, time_window, window_unit,
			burst_limit, concurrent_limit, limit_type, limit_scope, is_enabled,
			is_strict, block_duration, retry_after, custom_error_message, custom_error_code,
			current_usage, peak_usage, last_exceeded_at, exceeded_count, alert_threshold,
			alert_enabled, priority, can_override, override_until, description,
			tags, metadata, created_at, updated_at, created_by, updated_by
		FROM tenant_rate_limits
		WHERE tenant_id = $1
		ORDER BY priority DESC, created_at DESC
	`

	rows, err := r.db.Query(query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var limits []models.TenantRateLimit
	for rows.Next() {
		var limit models.TenantRateLimit
		err := rows.Scan(
			&limit.ID, &limit.TenantID, &limit.ServicePackageID, &limit.LimitName, &limit.LimitKey,
			&limit.ResourceType, &limit.EndpointPattern, &limit.MaxRequests, &limit.TimeWindow, &limit.WindowUnit,
			&limit.BurstLimit, &limit.ConcurrentLimit, &limit.LimitType, &limit.LimitScope, &limit.IsEnabled,
			&limit.IsStrict, &limit.BlockDuration, &limit.RetryAfter, &limit.CustomErrorMessage, &limit.CustomErrorCode,
			&limit.CurrentUsage, &limit.PeakUsage, &limit.LastExceededAt, &limit.ExceededCount, &limit.AlertThreshold,
			&limit.AlertEnabled, &limit.Priority, &limit.CanOverride, &limit.OverrideUntil, &limit.Description,
			&limit.Tags, &limit.Metadata, &limit.CreatedAt, &limit.UpdatedAt, &limit.CreatedBy, &limit.UpdatedBy,
		)
		if err != nil {
			return nil, err
		}
		limits = append(limits, limit)
	}

	return limits, nil
}

func (r *TenantRateLimitRepository) IncrementUsage(id string) error {
	query := `
		UPDATE tenant_rate_limits
		SET 
			current_usage = current_usage + 1,
			peak_usage = CASE 
				WHEN current_usage + 1 > peak_usage THEN current_usage + 1
				ELSE peak_usage
			END,
			updated_at = NOW()
		WHERE _id = $1
	`

	_, err := r.db.Exec(query, id)
	return err
}

func (r *TenantRateLimitRepository) ResetUsage(id string) error {
	query := `
		UPDATE tenant_rate_limits
		SET current_usage = 0, updated_at = NOW()
		WHERE _id = $1
	`

	_, err := r.db.Exec(query, id)
	return err
}
