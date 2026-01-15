package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ROLE AUDIT LOG - Audit Trail
// ============================================================================
// Purpose: Track all role and permission changes
// Table: role_audit_logs
// Primary Key: _id (UUID)
// Features: Complete audit trail, Compliance, Change tracking
// ============================================================================

type AuditAction string

const (
	AuditActionCreate   AuditAction = "CREATE"
	AuditActionUpdate   AuditAction = "UPDATE"
	AuditActionDelete   AuditAction = "DELETE"
	AuditActionAssign   AuditAction = "ASSIGN"
	AuditActionRevoke   AuditAction = "REVOKE"
	AuditActionDelegate AuditAction = "DELEGATE"
	AuditActionEnable   AuditAction = "ENABLE"
	AuditActionDisable  AuditAction = "DISABLE"
)

type AuditEntityType string

const (
	AuditEntityRole       AuditEntityType = "ROLE"
	AuditEntityPermission AuditEntityType = "PERMISSION"
	AuditEntityAssignment AuditEntityType = "ASSIGNMENT"
	AuditEntityDelegation AuditEntityType = "DELEGATION"
)

type RoleAuditLog struct {
	// Identity (4 fields)
	ID         uuid.UUID       `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID      `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	EntityType AuditEntityType `gorm:"column:entity_type;type:varchar(20);not null;index" json:"entity_type"`
	EntityID   uuid.UUID       `gorm:"column:entity_id;type:uuid;not null;index" json:"entity_id"`

	// Action Info (4 fields)
	Action      AuditAction `gorm:"column:action;type:varchar(20);not null;index" json:"action"`
	Description string      `gorm:"column:description;type:text;not null" json:"description"`
	UserID      *uuid.UUID  `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`
	ActorID     *uuid.UUID  `gorm:"column:actor_id;type:uuid;index" json:"actor_id,omitempty"` // Who performed the action

	// Changes (3 fields)
	OldValues JSONB  `gorm:"column:old_values;type:jsonb" json:"old_values,omitempty"`
	NewValues JSONB  `gorm:"column:new_values;type:jsonb" json:"new_values,omitempty"`
	Changes   JSONB  `gorm:"column:changes;type:jsonb" json:"changes,omitempty"` // Detailed changes

	// Context (4 fields)
	IPAddress  *string `gorm:"column:ip_address;type:varchar(50)" json:"ip_address,omitempty"`
	UserAgent  *string `gorm:"column:user_agent;type:varchar(255)" json:"user_agent,omitempty"`
	RequestID  *string `gorm:"column:request_id;type:varchar(100)" json:"request_id,omitempty"`
	SessionID  *string `gorm:"column:session_id;type:varchar(100)" json:"session_id,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
}

func (RoleAuditLog) TableName() string {
	return "role_audit_logs"
}

// ============================================================================
// ACCESS CONTROL LOG - Permission Checks
// ============================================================================

type AccessResult string

const (
	AccessResultAllowed AccessResult = "ALLOWED"
	AccessResultDenied  AccessResult = "DENIED"
)

type AccessControlLog struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Access Info (5 fields)
	UserID    uuid.UUID    `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`
	Resource  string       `gorm:"column:resource;type:varchar(100);not null;index" json:"resource"`
	Action    string       `gorm:"column:action;type:varchar(100);not null;index" json:"action"`
	Result    AccessResult `gorm:"column:result;type:varchar(20);not null;index" json:"result"`
	Reason    *string      `gorm:"column:reason;type:text" json:"reason,omitempty"`

	// Context (6 fields)
	RoleID       *uuid.UUID `gorm:"column:role_id;type:uuid" json:"role_id,omitempty"`
	PermissionID *uuid.UUID `gorm:"column:permission_id;type:uuid" json:"permission_id,omitempty"`
	ScopeID      *uuid.UUID `gorm:"column:scope_id;type:uuid" json:"scope_id,omitempty"`
	ScopeType    *string    `gorm:"column:scope_type;type:varchar(50)" json:"scope_type,omitempty"`
	IPAddress    *string    `gorm:"column:ip_address;type:varchar(50)" json:"ip_address,omitempty"`
	UserAgent    *string    `gorm:"column:user_agent;type:varchar(255)" json:"user_agent,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
}

func (AccessControlLog) TableName() string {
	return "access_control_logs"
}

// ============================================================================
// ROLE ANALYTICS - Usage Analytics
// ============================================================================

type AnalyticsInterval string

const (
	AnalyticsIntervalHour  AnalyticsInterval = "HOUR"
	AnalyticsIntervalDay   AnalyticsInterval = "DAY"
	AnalyticsIntervalWeek  AnalyticsInterval = "WEEK"
	AnalyticsIntervalMonth AnalyticsInterval = "MONTH"
)

type RoleAnalytics struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	RoleID   *uuid.UUID `gorm:"column:role_id;type:uuid;index" json:"role_id,omitempty"`

	// Time Bucket (3 fields)
	Interval    AnalyticsInterval `gorm:"column:interval;type:varchar(20);not null;index" json:"interval"`
	BucketStart time.Time         `gorm:"column:bucket_start;not null;index" json:"bucket_start"`
	BucketEnd   time.Time         `gorm:"column:bucket_end;not null" json:"bucket_end"`

	// Assignment Metrics (5 fields)
	TotalAssignments   int64 `gorm:"column:total_assignments;default:0" json:"total_assignments"`
	NewAssignments     int64 `gorm:"column:new_assignments;default:0" json:"new_assignments"`
	RevokedAssignments int64 `gorm:"column:revoked_assignments;default:0" json:"revoked_assignments"`
	ActiveAssignments  int64 `gorm:"column:active_assignments;default:0" json:"active_assignments"`
	ExpiredAssignments int64 `gorm:"column:expired_assignments;default:0" json:"expired_assignments"`

	// User Metrics (3 fields)
	UniqueUsers   int64 `gorm:"column:unique_users;default:0" json:"unique_users"`
	ActiveUsers   int64 `gorm:"column:active_users;default:0" json:"active_users"`
	InactiveUsers int64 `gorm:"column:inactive_users;default:0" json:"inactive_users"`

	// Access Metrics (4 fields)
	TotalAccessChecks   int64 `gorm:"column:total_access_checks;default:0" json:"total_access_checks"`
	AllowedAccess       int64 `gorm:"column:allowed_access;default:0" json:"allowed_access"`
	DeniedAccess        int64 `gorm:"column:denied_access;default:0" json:"denied_access"`
	UniqueResources     int64 `gorm:"column:unique_resources;default:0" json:"unique_resources"`

	// Delegation Metrics (2 fields)
	TotalDelegations  int64 `gorm:"column:total_delegations;default:0" json:"total_delegations"`
	ActiveDelegations int64 `gorm:"column:active_delegations;default:0" json:"active_delegations"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (RoleAnalytics) TableName() string {
	return "role_analytics"
}

func (ra *RoleAnalytics) GetAccessRate() float64 {
	if ra.TotalAccessChecks == 0 {
		return 0
	}
	return (float64(ra.AllowedAccess) / float64(ra.TotalAccessChecks)) * 100
}

// ============================================================================
// PERMISSION REPORT - Permission Reports
// ============================================================================

type ReportType string

const (
	ReportTypeRoleUsage       ReportType = "ROLE_USAGE"
	ReportTypePermissionUsage ReportType = "PERMISSION_USAGE"
	ReportTypeAccessControl   ReportType = "ACCESS_CONTROL"
	ReportTypeCompliance      ReportType = "COMPLIANCE"
	ReportTypeAnomalies       ReportType = "ANOMALIES"
)

type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "PENDING"
	ReportStatusGenerating ReportStatus = "GENERATING"
	ReportStatusCompleted ReportStatus = "COMPLETED"
	ReportStatusFailed    ReportStatus = "FAILED"
)

type PermissionReport struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Report Info (5 fields)
	ReportNumber string       `gorm:"column:report_number;type:varchar(50);uniqueIndex;not null" json:"report_number"`
	Type         ReportType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status       ReportStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title        string       `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description  *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// Period (2 fields)
	PeriodStart time.Time `gorm:"column:period_start;not null;index" json:"period_start"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null;index" json:"period_end"`

	// Summary (10 fields)
	TotalRoles         int64 `gorm:"column:total_roles;default:0" json:"total_roles"`
	ActiveRoles        int64 `gorm:"column:active_roles;default:0" json:"active_roles"`
	TotalPermissions   int64 `gorm:"column:total_permissions;default:0" json:"total_permissions"`
	TotalAssignments   int64 `gorm:"column:total_assignments;default:0" json:"total_assignments"`
	TotalUsers         int64 `gorm:"column:total_users;default:0" json:"total_users"`
	TotalAccessChecks  int64 `gorm:"column:total_access_checks;default:0" json:"total_access_checks"`
	AllowedAccess      int64 `gorm:"column:allowed_access;default:0" json:"allowed_access"`
	DeniedAccess       int64 `gorm:"column:denied_access;default:0" json:"denied_access"`
	TotalDelegations   int64 `gorm:"column:total_delegations;default:0" json:"total_delegations"`
	ComplianceScore    float64 `gorm:"column:compliance_score;type:decimal(5,2)" json:"compliance_score"`

	// Analysis (3 fields)
	TopRoles        JSONB `gorm:"column:top_roles;type:jsonb" json:"top_roles,omitempty"`
	TopPermissions  JSONB `gorm:"column:top_permissions;type:jsonb" json:"top_permissions,omitempty"`
	Findings        JSONB `gorm:"column:findings;type:jsonb" json:"findings,omitempty"`

	// Generation (4 fields)
	GeneratedAt    *time.Time `gorm:"column:generated_at" json:"generated_at,omitempty"`
	GeneratedBy    *uuid.UUID `gorm:"column:generated_by;type:uuid" json:"generated_by,omitempty"`
	GenerationTime *int       `gorm:"column:generation_time" json:"generation_time,omitempty"` // Seconds
	ErrorMessage   *string    `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Export (2 fields)
	FileURL  *string `gorm:"column:file_url;type:text" json:"file_url,omitempty"`
	FileSize *int64  `gorm:"column:file_size" json:"file_size,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (PermissionReport) TableName() string {
	return "permission_reports"
}

func (r *PermissionReport) GetAccessRate() float64 {
	if r.TotalAccessChecks == 0 {
		return 0
	}
	return (float64(r.AllowedAccess) / float64(r.TotalAccessChecks)) * 100
}

// ============================================================================
// Helper Functions
// ============================================================================

// LogAudit logs an audit entry
func LogAudit(
	db *gorm.DB,
	entityType AuditEntityType,
	entityID uuid.UUID,
	action AuditAction,
	description string,
	actorID *uuid.UUID,
	oldValues, newValues map[string]interface{},
) error {
	log := &RoleAuditLog{
		EntityType:  entityType,
		EntityID:    entityID,
		Action:      action,
		Description: description,
		ActorID:     actorID,
		OldValues:   oldValues,
		NewValues:   newValues,
	}

	// Calculate changes
	if oldValues != nil && newValues != nil {
		changes := make(map[string]interface{})
		for key, newVal := range newValues {
			if oldVal, exists := oldValues[key]; !exists || oldVal != newVal {
				changes[key] = map[string]interface{}{
					"old": oldVal,
					"new": newVal,
				}
			}
		}
		log.Changes = changes
	}

	return db.Create(log).Error
}

// LogAccessControl logs an access control check
func LogAccessControl(
	db *gorm.DB,
	userID uuid.UUID,
	resource, action string,
	result AccessResult,
	reason *string,
	roleID, permissionID *uuid.UUID,
) error {
	log := &AccessControlLog{
		UserID:       userID,
		Resource:     resource,
		Action:       action,
		Result:       result,
		Reason:       reason,
		RoleID:       roleID,
		PermissionID: permissionID,
	}

	return db.Create(log).Error
}

// GetAuditHistory gets audit history for an entity
func GetAuditHistory(
	db *gorm.DB,
	entityType AuditEntityType,
	entityID uuid.UUID,
	limit int,
) ([]RoleAuditLog, error) {
	var logs []RoleAuditLog

	err := db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error

	return logs, err
}

// GetUserAuditHistory gets audit history for a user
func GetUserAuditHistory(
	db *gorm.DB,
	userID uuid.UUID,
	limit int,
) ([]RoleAuditLog, error) {
	var logs []RoleAuditLog

	err := db.Where("user_id = ? OR actor_id = ?", userID, userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error

	return logs, err
}

// GetAccessLogs gets access control logs for a user
func GetAccessLogs(
	db *gorm.DB,
	userID uuid.UUID,
	startDate, endDate time.Time,
) ([]AccessControlLog, error) {
	var logs []AccessControlLog

	err := db.Where("user_id = ? AND created_at BETWEEN ? AND ?", 
		userID, startDate, endDate).
		Order("created_at DESC").
		Find(&logs).Error

	return logs, err
}

// AggregateAnalytics aggregates role analytics
func AggregateAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	bucketStart, bucketEnd time.Time,
	roleID *uuid.UUID,
) error {
	analytics := &RoleAnalytics{
		RoleID:      roleID,
		Interval:    interval,
		BucketStart: bucketStart,
		BucketEnd:   bucketEnd,
	}

	// Count assignments
	query := db.Model(&RoleAssignment{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd)

	if roleID != nil {
		query = query.Where("role_id = ?", roleID)
	}

	query.Count(&analytics.TotalAssignments)

	// New assignments
	query.Where("status = ?", AssignmentStatusActive).Count(&analytics.NewAssignments)

	// Revoked assignments
	db.Model(&RoleAssignment{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Where("status = ?", AssignmentStatusRevoked).
		Count(&analytics.RevokedAssignments)

	// Active assignments
	db.Model(&RoleAssignment{}).
		Where("status = ?", AssignmentStatusActive).
		Count(&analytics.ActiveAssignments)

	// Unique users
	db.Model(&RoleAssignment{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("user_id").
		Count(&analytics.UniqueUsers)

	// Access checks
	accessQuery := db.Model(&AccessControlLog{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd)

	if roleID != nil {
		accessQuery = accessQuery.Where("role_id = ?", roleID)
	}

	accessQuery.Count(&analytics.TotalAccessChecks)

	accessQuery.Where("result = ?", AccessResultAllowed).Count(&analytics.AllowedAccess)
	accessQuery.Where("result = ?", AccessResultDenied).Count(&analytics.DeniedAccess)

	// Delegations
	db.Model(&RoleDelegation{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Count(&analytics.TotalDelegations)

	db.Model(&RoleDelegation{}).
		Where("status = ?", DelegationStatusActive).
		Count(&analytics.ActiveDelegations)

	return db.Create(analytics).Error
}

// GeneratePermissionReport generates a permission report
func GeneratePermissionReport(
	db *gorm.DB,
	reportType ReportType,
	startDate, endDate time.Time,
	userID *uuid.UUID,
) (*PermissionReport, error) {
	startTime := time.Now()

	report := &PermissionReport{
		ReportNumber: generateReportNumber(),
		Type:         reportType,
		Status:       ReportStatusGenerating,
		Title:        fmt.Sprintf("%s Report", reportType),
		PeriodStart:  startDate,
		PeriodEnd:    endDate,
		GeneratedBy:  userID,
	}

	if err := db.Create(report).Error; err != nil {
		return nil, err
	}

	// Calculate statistics
	if err := calculateReportStats(db, report, startDate, endDate); err != nil {
		report.Status = ReportStatusFailed
		report.ErrorMessage = strPtr(err.Error())
		db.Save(report)
		return report, err
	}

	// Complete report
	now := time.Now()
	generationTime := int(now.Sub(startTime).Seconds())
	report.Status = ReportStatusCompleted
	report.GeneratedAt = &now
	report.GenerationTime = &generationTime

	db.Save(report)

	return report, nil
}

func calculateReportStats(
	db *gorm.DB,
	report *PermissionReport,
	startDate, endDate time.Time,
) error {
	// Total roles
	db.Model(&Role{}).Count(&report.TotalRoles)
	db.Model(&Role{}).Where("status = ?", RoleStatusActive).Count(&report.ActiveRoles)

	// Total permissions
	db.Model(&Permission{}).Count(&report.TotalPermissions)

	// Total assignments
	db.Model(&RoleAssignment{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.TotalAssignments)

	// Unique users
	db.Model(&RoleAssignment{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("user_id").
		Count(&report.TotalUsers)

	// Access checks
	db.Model(&AccessControlLog{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.TotalAccessChecks)

	db.Model(&AccessControlLog{}).
		Where("created_at BETWEEN ? AND ? AND result = ?", 
			startDate, endDate, AccessResultAllowed).
		Count(&report.AllowedAccess)

	db.Model(&AccessControlLog{}).
		Where("created_at BETWEEN ? AND ? AND result = ?", 
			startDate, endDate, AccessResultDenied).
		Count(&report.DeniedAccess)

	// Delegations
	db.Model(&RoleDelegation{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.TotalDelegations)

	// Compliance score (simplified)
	if report.TotalAccessChecks > 0 {
		report.ComplianceScore = (float64(report.AllowedAccess) / 
			float64(report.TotalAccessChecks)) * 100
	}

	// Top roles
	var topRoles []struct {
		RoleID          uuid.UUID
		AssignmentCount int64
	}
	db.Model(&RoleAssignment{}).
		Select("role_id, count(*) as assignment_count").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("role_id").
		Order("assignment_count DESC").
		Limit(10).
		Scan(&topRoles)

	topRolesJSON := make([]map[string]interface{}, len(topRoles))
	for i, tr := range topRoles {
		topRolesJSON[i] = map[string]interface{}{
			"role_id": tr.RoleID,
			"count":   tr.AssignmentCount,
		}
	}
	report.TopRoles = JSONB{"roles": topRolesJSON}

	return nil
}

func generateReportNumber() string {
	now := time.Now()
	return fmt.Sprintf("RPT-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}

// GetRoleUsageStats gets usage statistics for a role
func GetRoleUsageStats(
	db *gorm.DB,
	roleID uuid.UUID,
	startDate, endDate time.Time,
) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total assignments
	var totalAssignments int64
	db.Model(&RoleAssignment{}).
		Where("role_id = ? AND created_at BETWEEN ? AND ?", 
			roleID, startDate, endDate).
		Count(&totalAssignments)
	stats["total_assignments"] = totalAssignments

	// Active assignments
	var activeAssignments int64
	db.Model(&RoleAssignment{}).
		Where("role_id = ? AND status = ?", roleID, AssignmentStatusActive).
		Count(&activeAssignments)
	stats["active_assignments"] = activeAssignments

	// Access checks
	var accessChecks int64
	db.Model(&AccessControlLog{}).
		Where("role_id = ? AND created_at BETWEEN ? AND ?", 
			roleID, startDate, endDate).
		Count(&accessChecks)
	stats["access_checks"] = accessChecks

	return stats, nil
}

// CleanupOldAuditLogs removes old audit logs
func CleanupOldAuditLogs(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("created_at < ?", cutoff).
		Delete(&RoleAuditLog{}).Error
}

// CleanupOldAccessLogs removes old access logs
func CleanupOldAccessLogs(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("created_at < ?", cutoff).
		Delete(&AccessControlLog{}).Error
}
