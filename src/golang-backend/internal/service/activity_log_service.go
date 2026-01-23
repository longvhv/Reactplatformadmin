package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type ActivityLogService struct {
	activityRepo repository.ActivityLogRepository
}

func NewActivityLogService(activityRepo repository.ActivityLogRepository) *ActivityLogService {
	return &ActivityLogService{
		activityRepo: activityRepo,
	}
}

type LogActivityRequest struct {
	TenantID     uuid.UUID              `json:"tenant_id"`
	UserID       *uuid.UUID             `json:"user_id"`
	ActivityType string                 `json:"activity_type" binding:"required"`
	EntityType   *string                `json:"entity_type"`
	EntityID     *uuid.UUID             `json:"entity_id"`
	Action       string                 `json:"action" binding:"required"`
	Description  *string                `json:"description"`
	IPAddress    *string                `json:"ip_address"`
	UserAgent    *string                `json:"user_agent"`
	Changes      map[string]interface{} `json:"changes"`
	Metadata     map[string]interface{} `json:"metadata"`
	Severity     *string                `json:"severity"`
}

type SearchActivityRequest struct {
	TenantID     uuid.UUID   `json:"tenant_id"`
	UserID       *uuid.UUID  `json:"user_id"`
	ActivityType *string     `json:"activity_type"`
	EntityType   *string     `json:"entity_type"`
	EntityID     *uuid.UUID  `json:"entity_id"`
	Action       *string     `json:"action"`
	StartDate    *string     `json:"start_date"`
	EndDate      *string     `json:"end_date"`
	Severity     *string     `json:"severity"`
	SearchText   *string     `json:"search_text"`
	Page         int         `json:"page"`
	Limit        int         `json:"limit"`
}

// GetByID gets activity log by ID
func (s *ActivityLogService) GetByID(ctx context.Context, id uuid.UUID) (*models.ActivityLog, error) {
	return s.activityRepo.GetByID(ctx, id)
}

// ListByTenant lists activity logs by tenant
func (s *ActivityLogService) ListByTenant(ctx context.Context, tenantID uuid.UUID, activityType, entityType string, page, limit int) ([]*models.ActivityLog, int64, error) {
	offset := (page - 1) * limit
	return s.activityRepo.ListByTenant(ctx, tenantID, activityType, entityType, limit, offset)
}

// GetByUser gets activity logs by user
func (s *ActivityLogService) GetByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]*models.ActivityLog, int64, error) {
	offset := (page - 1) * limit
	return s.activityRepo.GetByUser(ctx, userID, limit, offset)
}

// GetByEntity gets activity logs by entity
func (s *ActivityLogService) GetByEntity(ctx context.Context, entityType string, entityID uuid.UUID, page, limit int) ([]*models.ActivityLog, int64, error) {
	offset := (page - 1) * limit
	return s.activityRepo.GetByEntity(ctx, entityType, entityID, limit, offset)
}

// LogActivity logs a new activity
func (s *ActivityLogService) LogActivity(ctx context.Context, req LogActivityRequest) (*models.ActivityLog, error) {
	// Validate activity type
	validTypes := []string{"user", "auth", "data", "system", "security", "api", "integration", "payment", "admin", "custom"}
	if !containsActivityType(validTypes, req.ActivityType) {
		return nil, fmt.Errorf("invalid activity type, must be one of: %v", validTypes)
	}

	severity := "info"
	if req.Severity != nil {
		severity = *req.Severity
	}

	changes := req.Changes
	if changes == nil {
		changes = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	log := &models.ActivityLog{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		UserID:       req.UserID,
		ActivityType: req.ActivityType,
		EntityType:   req.EntityType,
		EntityID:     req.EntityID,
		Action:       req.Action,
		Description:  req.Description,
		IPAddress:    req.IPAddress,
		UserAgent:    req.UserAgent,
		Changes:      changes,
		Metadata:     metadata,
		Severity:     severity,
		Timestamp:    time.Now(),
		CreatedAt:    time.Now(),
	}

	if err := s.activityRepo.Create(ctx, log); err != nil {
		return nil, fmt.Errorf("failed to log activity: %w", err)
	}

	return log, nil
}

// Search searches activity logs
func (s *ActivityLogService) Search(ctx context.Context, req SearchActivityRequest) ([]*models.ActivityLog, int64, error) {
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 50
	}

	// This would use a more sophisticated search in production
	// For now, use basic filtering
	offset := (req.Page - 1) * req.Limit
	
	activityType := ""
	if req.ActivityType != nil {
		activityType = *req.ActivityType
	}
	
	entityType := ""
	if req.EntityType != nil {
		entityType = *req.EntityType
	}

	logs, total, err := s.activityRepo.ListByTenant(ctx, req.TenantID, activityType, entityType, req.Limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Filter by additional criteria
	filtered := make([]*models.ActivityLog, 0)
	for _, log := range logs {
		if req.UserID != nil && (log.UserID == nil || *log.UserID != *req.UserID) {
			continue
		}
		if req.EntityID != nil && (log.EntityID == nil || *log.EntityID != *req.EntityID) {
			continue
		}
		if req.Action != nil && log.Action != *req.Action {
			continue
		}
		if req.Severity != nil && log.Severity != *req.Severity {
			continue
		}
		
		// Date range filtering
		if req.StartDate != nil && *req.StartDate != "" {
			startDate, err := time.Parse(time.RFC3339, *req.StartDate)
			if err == nil && log.Timestamp.Before(startDate) {
				continue
			}
		}
		if req.EndDate != nil && *req.EndDate != "" {
			endDate, err := time.Parse(time.RFC3339, *req.EndDate)
			if err == nil && log.Timestamp.After(endDate) {
				continue
			}
		}
		
		// Text search
		if req.SearchText != nil && *req.SearchText != "" {
			searchText := strings.ToLower(*req.SearchText)
			matched := false
			if strings.Contains(strings.ToLower(log.Action), searchText) {
				matched = true
			}
			if log.Description != nil && strings.Contains(strings.ToLower(*log.Description), searchText) {
				matched = true
			}
			if !matched {
				continue
			}
		}
		
		filtered = append(filtered, log)
	}

	return filtered, int64(len(filtered)), nil
}

// GetStats gets activity statistics
func (s *ActivityLogService) GetStats(ctx context.Context, tenantID uuid.UUID, startDate, endDate string) (map[string]interface{}, error) {
	logs, _, err := s.activityRepo.ListByTenant(ctx, tenantID, "", "", 100000, 0)
	if err != nil {
		return nil, err
	}

	// Filter by date range
	var start, end time.Time
	if startDate != "" {
		start, _ = time.Parse(time.RFC3339, startDate)
	}
	if endDate != "" {
		end, _ = time.Parse(time.RFC3339, endDate)
	}

	typeCount := make(map[string]int)
	actionCount := make(map[string]int)
	severityCount := make(map[string]int)
	userActivity := make(map[string]int)

	for _, log := range logs {
		// Date filtering
		if !start.IsZero() && log.Timestamp.Before(start) {
			continue
		}
		if !end.IsZero() && log.Timestamp.After(end) {
			continue
		}

		typeCount[log.ActivityType]++
		actionCount[log.Action]++
		severityCount[log.Severity]++
		
		if log.UserID != nil {
			userActivity[log.UserID.String()]++
		}
	}

	stats := map[string]interface{}{
		"total_activities": len(logs),
		"by_type":          typeCount,
		"by_action":        actionCount,
		"by_severity":      severityCount,
		"top_users":        s.getTopUsers(userActivity, 10),
		"period": map[string]interface{}{
			"start": startDate,
			"end":   endDate,
		},
	}

	return stats, nil
}

// GetTimeline gets activity timeline
func (s *ActivityLogService) GetTimeline(ctx context.Context, tenantID uuid.UUID, days int) ([]map[string]interface{}, error) {
	logs, _, err := s.activityRepo.ListByTenant(ctx, tenantID, "", "", 100000, 0)
	if err != nil {
		return nil, err
	}

	cutoff := time.Now().AddDate(0, 0, -days)
	
	// Group by date
	dateGroups := make(map[string][]map[string]interface{})
	
	for _, log := range logs {
		if log.Timestamp.Before(cutoff) {
			continue
		}
		
		dateKey := log.Timestamp.Format("2006-01-02")
		
		item := map[string]interface{}{
			"id":            log.ID,
			"activity_type": log.ActivityType,
			"action":        log.Action,
			"description":   log.Description,
			"user_id":       log.UserID,
			"timestamp":     log.Timestamp,
			"severity":      log.Severity,
		}
		
		dateGroups[dateKey] = append(dateGroups[dateKey], item)
	}

	// Convert to timeline format
	timeline := make([]map[string]interface{}, 0)
	for date, activities := range dateGroups {
		timeline = append(timeline, map[string]interface{}{
			"date":       date,
			"count":      len(activities),
			"activities": activities,
		})
	}

	return timeline, nil
}

// Export exports activity logs
func (s *ActivityLogService) Export(ctx context.Context, tenantID uuid.UUID, format, startDate, endDate string) ([]byte, string, error) {
	logs, _, err := s.activityRepo.ListByTenant(ctx, tenantID, "", "", 100000, 0)
	if err != nil {
		return nil, "", err
	}

	// Filter by date range
	var start, end time.Time
	if startDate != "" {
		start, _ = time.Parse(time.RFC3339, startDate)
	}
	if endDate != "" {
		end, _ = time.Parse(time.RFC3339, endDate)
	}

	filtered := make([]*models.ActivityLog, 0)
	for _, log := range logs {
		if !start.IsZero() && log.Timestamp.Before(start) {
			continue
		}
		if !end.IsZero() && log.Timestamp.After(end) {
			continue
		}
		filtered = append(filtered, log)
	}

	var data []byte
	fileName := fmt.Sprintf("activity_logs_%s.%s", time.Now().Format("20060102"), format)

	switch format {
	case "json":
		data, err = json.MarshalIndent(filtered, "", "  ")
		if err != nil {
			return nil, "", err
		}

	case "csv":
		var builder strings.Builder
		writer := csv.NewWriter(&builder)
		
		// Header
		_ = writer.Write([]string{"ID", "Timestamp", "User ID", "Activity Type", "Action", "Entity Type", "Entity ID", "Severity", "Description"})
		
		// Data
		for _, log := range filtered {
			userID := ""
			if log.UserID != nil {
				userID = log.UserID.String()
			}
			entityType := ""
			if log.EntityType != nil {
				entityType = *log.EntityType
			}
			entityID := ""
			if log.EntityID != nil {
				entityID = log.EntityID.String()
			}
			description := ""
			if log.Description != nil {
				description = *log.Description
			}
			
			_ = writer.Write([]string{
				log.ID.String(),
				log.Timestamp.Format(time.RFC3339),
				userID,
				log.ActivityType,
				log.Action,
				entityType,
				entityID,
				log.Severity,
				description,
			})
		}
		
		writer.Flush()
		data = []byte(builder.String())

	default:
		return nil, "", fmt.Errorf("unsupported format: %s", format)
	}

	return data, fileName, nil
}

// Helper functions
func (s *ActivityLogService) getTopUsers(userActivity map[string]int, limit int) []map[string]interface{} {
	type userCount struct {
		UserID string
		Count  int
	}
	
	counts := make([]userCount, 0)
	for userID, count := range userActivity {
		counts = append(counts, userCount{UserID: userID, Count: count})
	}
	
	// Simple sort (in production, use proper sorting)
	result := make([]map[string]interface{}, 0)
	for i := 0; i < len(counts) && i < limit; i++ {
		result = append(result, map[string]interface{}{
			"user_id": counts[i].UserID,
			"count":   counts[i].Count,
		})
	}
	
	return result
}

func containsActivityType(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
