package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// SERVICE CONTRACT - Service Contracts
// ============================================================================
// Purpose: Formal service agreements with customers
// Table: service_contracts
// Primary Key: _id (UUID)
// Features: SLA management, Terms & conditions, Auto-renewal
// ============================================================================

type ContractType string

const (
	ContractTypeStandard    ContractType = "STANDARD"
	ContractTypeCustom      ContractType = "CUSTOM"
	ContractTypeEnterprise  ContractType = "ENTERPRISE"
	ContractTypeTrial       ContractType = "TRIAL"
	ContractTypeMSA         ContractType = "MSA" // Master Service Agreement
)

type ContractStatus string

const (
	ContractStatusDraft      ContractStatus = "DRAFT"
	ContractStatusPendingSig ContractStatus = "PENDING_SIGNATURE"
	ContractStatusActive     ContractStatus = "ACTIVE"
	ContractStatusExpiring   ContractStatus = "EXPIRING"
	ContractStatusExpired    ContractStatus = "EXPIRED"
	ContractStatusTerminated ContractStatus = "TERMINATED"
	ContractStatusRenewed    ContractStatus = "RENEWED"
)

type ServiceContract struct {
	// ========== Identity (3 fields) ==========
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CustomerID uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// ========== Contract Info (7 fields) ==========
	ContractNumber string         `gorm:"column:contract_number;type:varchar(50);uniqueIndex;not null" json:"contract_number"`
	Type           ContractType   `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Status         ContractStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title          string         `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description    *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	Version        int            `gorm:"column:version;default:1" json:"version"`
	ParentContractID *uuid.UUID   `gorm:"column:parent_contract_id;type:uuid" json:"parent_contract_id,omitempty"` // For renewals

	// ========== Dates (5 fields) ==========
	StartDate      time.Time  `gorm:"column:start_date;not null;index" json:"start_date"`
	EndDate        time.Time  `gorm:"column:end_date;not null;index" json:"end_date"`
	SignedDate     *time.Time `gorm:"column:signed_date" json:"signed_date,omitempty"`
	TerminatedDate *time.Time `gorm:"column:terminated_date" json:"terminated_date,omitempty"`
	RenewalDate    *time.Time `gorm:"column:renewal_date" json:"renewal_date,omitempty"`

	// ========== Financial (4 fields) ==========
	ContractValue    float64 `gorm:"column:contract_value;type:decimal(20,2);not null" json:"contract_value"`
	BilledAmount     float64 `gorm:"column:billed_amount;type:decimal(20,2);default:0" json:"billed_amount"`
	PaidAmount       float64 `gorm:"column:paid_amount;type:decimal(20,2);default:0" json:"paid_amount"`
	Currency         string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// ========== Renewal (4 fields) ==========
	AutoRenew          bool `gorm:"column:auto_renew;default:false" json:"auto_renew"`
	RenewalTermMonths  *int `gorm:"column:renewal_term_months" json:"renewal_term_months,omitempty"`
	RenewalNoticeDays  *int `gorm:"column:renewal_notice_days" json:"renewal_notice_days,omitempty"` // Days before end date
	NoticeGiven        bool `gorm:"column:notice_given;default:false" json:"notice_given"`

	// ========== Terms (3 fields) ==========
	TermsAndConditions *string `gorm:"column:terms_and_conditions;type:text" json:"terms_and_conditions,omitempty"`
	PaymentTerms       *string `gorm:"column:payment_terms;type:text" json:"payment_terms,omitempty"`
	CancellationPolicy *string `gorm:"column:cancellation_policy;type:text" json:"cancellation_policy,omitempty"`

	// ========== Documents (3 fields) ==========
	DocumentURL    *string `gorm:"column:document_url;type:text" json:"document_url,omitempty"`
	SignedDocURL   *string `gorm:"column:signed_doc_url;type:text" json:"signed_doc_url,omitempty"`
	AttachmentsURL JSONB   `gorm:"column:attachments_url;type:jsonb" json:"attachments_url,omitempty"`

	// ========== Signatures (4 fields) ==========
	CustomerSignature  *string    `gorm:"column:customer_signature;type:text" json:"customer_signature,omitempty"`
	CustomerSignedDate *time.Time `gorm:"column:customer_signed_date" json:"customer_signed_date,omitempty"`
	VendorSignature    *string    `gorm:"column:vendor_signature;type:text" json:"vendor_signature,omitempty"`
	VendorSignedDate   *time.Time `gorm:"column:vendor_signed_date" json:"vendor_signed_date,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete (2 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Services     []ContractService `gorm:"foreignKey:ContractID" json:"services,omitempty"`
	SLAs         []ServiceSLA      `gorm:"foreignKey:ContractID" json:"slas,omitempty"`
	Milestones   []ContractMilestone `gorm:"foreignKey:ContractID" json:"milestones,omitempty"`
	ParentContract *ServiceContract `gorm:"foreignKey:ParentContractID" json:"parent_contract,omitempty"`
}

func (ServiceContract) TableName() string {
	return "service_contracts"
}

// Helper Methods
func (sc *ServiceContract) IsActive() bool {
	return sc.Status == ContractStatusActive
}

func (sc *ServiceContract) IsExpired() bool {
	return time.Now().After(sc.EndDate)
}

func (sc *ServiceContract) IsExpiringSoon(days int) bool {
	if sc.Status != ContractStatusActive {
		return false
	}
	daysUntilEnd := int(time.Until(sc.EndDate).Hours() / 24)
	return daysUntilEnd <= days && daysUntilEnd > 0
}

func (sc *ServiceContract) IsSigned() bool {
	return sc.CustomerSignedDate != nil && sc.VendorSignedDate != nil
}

func (sc *ServiceContract) DaysRemaining() int {
	duration := time.Until(sc.EndDate)
	return int(duration.Hours() / 24)
}

func (sc *ServiceContract) DurationDays() int {
	duration := sc.EndDate.Sub(sc.StartDate)
	return int(duration.Hours() / 24)
}

func (sc *ServiceContract) GetOutstandingAmount() float64 {
	return sc.BilledAmount - sc.PaidAmount
}

func (sc *ServiceContract) Sign(isCustomer bool, signature string, userID *uuid.UUID) {
	now := time.Now()
	if isCustomer {
		sc.CustomerSignature = &signature
		sc.CustomerSignedDate = &now
	} else {
		sc.VendorSignature = &signature
		sc.VendorSignedDate = &now
	}

	if sc.IsSigned() {
		sc.Status = ContractStatusActive
		sc.SignedDate = &now
	}

	sc.UpdatedBy = userID
}

func (sc *ServiceContract) Terminate(reason string, userID *uuid.UUID) {
	now := time.Now()
	sc.Status = ContractStatusTerminated
	sc.TerminatedDate = &now
	sc.UpdatedBy = userID

	if sc.Metadata == nil {
		sc.Metadata = JSONB{}
	}
	sc.Metadata["termination_reason"] = reason
}

// ============================================================================
// CONTRACT SERVICE - Services in Contract
// ============================================================================

type ContractService struct {
	// Identity (3 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ContractID uuid.UUID `gorm:"column:contract_id;type:uuid;not null;index" json:"contract_id"`
	ServiceID  uuid.UUID `gorm:"column:service_id;type:uuid;not null;index" json:"service_id"`

	// Service Details (5 fields)
	PlanID      *uuid.UUID `gorm:"column:plan_id;type:uuid" json:"plan_id,omitempty"`
	Quantity    int        `gorm:"column:quantity;default:1" json:"quantity"`
	UnitPrice   float64    `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`
	TotalPrice  float64    `gorm:"column:total_price;type:decimal(15,2);not null" json:"total_price"`
	Description *string    `gorm:"column:description;type:text" json:"description,omitempty"`

	// Dates (2 fields)
	StartDate time.Time  `gorm:"column:start_date;not null" json:"start_date"`
	EndDate   *time.Time `gorm:"column:end_date" json:"end_date,omitempty"`

	// Status (1 field)
	IsActive bool `gorm:"column:is_active;default:true" json:"is_active"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Contract *ServiceContract `gorm:"foreignKey:ContractID" json:"contract,omitempty"`
	Service  *Service         `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
	Plan     *ServicePlan     `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
}

func (ContractService) TableName() string {
	return "contract_services"
}

// ============================================================================
// SERVICE SLA - Service Level Agreement
// ============================================================================

type SLAMetricType string

const (
	SLAMetricUptime      SLAMetricType = "UPTIME"       // System uptime %
	SLAMetricResponse    SLAMetricType = "RESPONSE"     // Response time
	SLAMetricResolution  SLAMetricType = "RESOLUTION"   // Issue resolution time
	SLAMetricAvailability SLAMetricType = "AVAILABILITY" // Service availability %
	SLAMetricPerformance SLAMetricType = "PERFORMANCE"  // Performance metric
	SLAMetricSupport     SLAMetricType = "SUPPORT"      // Support response time
)

type SLAStatus string

const (
	SLAStatusActive   SLAStatus = "ACTIVE"
	SLAStatusBreached SLAStatus = "BREACHED"
	SLAStatusSuspended SLAStatus = "SUSPENDED"
)

type ServiceSLA struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ContractID uuid.UUID `gorm:"column:contract_id;type:uuid;not null;index" json:"contract_id"`

	// SLA Info (5 fields)
	Name        string        `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string       `gorm:"column:description;type:text" json:"description,omitempty"`
	MetricType  SLAMetricType `gorm:"column:metric_type;type:varchar(20);not null" json:"metric_type"`
	Status      SLAStatus     `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Priority    int           `gorm:"column:priority;default:0" json:"priority"`

	// Target & Threshold (4 fields)
	TargetValue    float64 `gorm:"column:target_value;type:decimal(10,4);not null" json:"target_value"` // e.g., 99.9 for 99.9% uptime
	ThresholdValue float64 `gorm:"column:threshold_value;type:decimal(10,4)" json:"threshold_value"`   // Warning threshold
	Unit           string  `gorm:"column:unit;type:varchar(20);not null" json:"unit"`                  // %, seconds, minutes, etc.
	MeasurementPeriod string `gorm:"column:measurement_period;type:varchar(20)" json:"measurement_period"` // monthly, weekly, etc.

	// Compliance (3 fields)
	CurrentValue    *float64   `gorm:"column:current_value;type:decimal(10,4)" json:"current_value,omitempty"`
	LastMeasuredAt  *time.Time `gorm:"column:last_measured_at" json:"last_measured_at,omitempty"`
	ComplianceRate  *float64   `gorm:"column:compliance_rate;type:decimal(5,2)" json:"compliance_rate,omitempty"` // %

	// Penalties (3 fields)
	PenaltyEnabled bool     `gorm:"column:penalty_enabled;default:false" json:"penalty_enabled"`
	PenaltyAmount  *float64 `gorm:"column:penalty_amount;type:decimal(15,2)" json:"penalty_amount,omitempty"`
	PenaltyType    *string  `gorm:"column:penalty_type;type:varchar(50)" json:"penalty_type,omitempty"` // fixed, percentage, credit

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Contract *ServiceContract `gorm:"foreignKey:ContractID" json:"contract,omitempty"`
	Breaches []SLABreach      `gorm:"foreignKey:SLAID" json:"breaches,omitempty"`
}

func (ServiceSLA) TableName() string {
	return "service_slas"
}

func (sla *ServiceSLA) IsCompliant() bool {
	if sla.CurrentValue == nil {
		return true
	}
	return *sla.CurrentValue >= sla.TargetValue
}

func (sla *ServiceSLA) IsAtRisk() bool {
	if sla.CurrentValue == nil {
		return false
	}
	return *sla.CurrentValue < sla.ThresholdValue && *sla.CurrentValue >= sla.TargetValue
}

func (sla *ServiceSLA) UpdateMeasurement(value float64) {
	sla.CurrentValue = &value
	now := time.Now()
	sla.LastMeasuredAt = &now

	if !sla.IsCompliant() && sla.Status == SLAStatusActive {
		sla.Status = SLAStatusBreached
	}
}

// ============================================================================
// SLA BREACH - SLA Breach Records
// ============================================================================

type BreachSeverity string

const (
	BreachSeverityLow      BreachSeverity = "LOW"
	BreachSeverityMedium   BreachSeverity = "MEDIUM"
	BreachSeverityHigh     BreachSeverity = "HIGH"
	BreachSeverityCritical BreachSeverity = "CRITICAL"
)

type BreachStatus string

const (
	BreachStatusOpen     BreachStatus = "OPEN"
	BreachStatusResolved BreachStatus = "RESOLVED"
	BreachStatusWaived   BreachStatus = "WAIVED"
)

type SLABreach struct {
	// Identity (2 fields)
	ID    uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SLAID uuid.UUID `gorm:"column:sla_id;type:uuid;not null;index" json:"sla_id"`

	// Breach Info (6 fields)
	BreachNumber string         `gorm:"column:breach_number;type:varchar(50);uniqueIndex;not null" json:"breach_number"`
	Severity     BreachSeverity `gorm:"column:severity;type:varchar(20);not null" json:"severity"`
	Status       BreachStatus   `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Description  string         `gorm:"column:description;type:text;not null" json:"description"`
	RootCause    *string        `gorm:"column:root_cause;type:text" json:"root_cause,omitempty"`
	Resolution   *string        `gorm:"column:resolution;type:text" json:"resolution,omitempty"`

	// Measurement (3 fields)
	TargetValue  float64 `gorm:"column:target_value;type:decimal(10,4);not null" json:"target_value"`
	ActualValue  float64 `gorm:"column:actual_value;type:decimal(10,4);not null" json:"actual_value"`
	Deviation    float64 `gorm:"column:deviation;type:decimal(10,4)" json:"deviation"` // Target - Actual

	// Dates (4 fields)
	BreachDate   time.Time  `gorm:"column:breach_date;not null;index" json:"breach_date"`
	DetectedAt   time.Time  `gorm:"column:detected_at;not null" json:"detected_at"`
	ResolvedAt   *time.Time `gorm:"column:resolved_at" json:"resolved_at,omitempty"`
	AckDeadline  *time.Time `gorm:"column:ack_deadline" json:"ack_deadline,omitempty"`

	// Impact (2 fields)
	AffectedUsers *int     `gorm:"column:affected_users" json:"affected_users,omitempty"`
	DowntimeMinutes *int   `gorm:"column:downtime_minutes" json:"downtime_minutes,omitempty"`

	// Financial (2 fields)
	PenaltyApplied bool     `gorm:"column:penalty_applied;default:false" json:"penalty_applied"`
	PenaltyAmount  *float64 `gorm:"column:penalty_amount;type:decimal(15,2)" json:"penalty_amount,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt  time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	ResolvedBy *uuid.UUID `gorm:"column:resolved_by;type:uuid" json:"resolved_by,omitempty"`
	WaivedBy   *uuid.UUID `gorm:"column:waived_by;type:uuid" json:"waived_by,omitempty"`

	// Relationship
	SLA *ServiceSLA `gorm:"foreignKey:SLAID" json:"sla,omitempty"`
}

func (SLABreach) TableName() string {
	return "sla_breaches"
}

func (breach *SLABreach) Resolve(resolution string, userID uuid.UUID) {
	now := time.Now()
	breach.Status = BreachStatusResolved
	breach.ResolvedAt = &now
	breach.Resolution = &resolution
	breach.ResolvedBy = &userID
}

func (breach *SLABreach) Waive(reason string, userID uuid.UUID) {
	breach.Status = BreachStatusWaived
	breach.WaivedBy = &userID
	if breach.Metadata == nil {
		breach.Metadata = JSONB{}
	}
	breach.Metadata["waiver_reason"] = reason
}

// ============================================================================
// CONTRACT MILESTONE - Contract Milestones
// ============================================================================

type MilestoneStatus string

const (
	MilestoneStatusPending    MilestoneStatus = "PENDING"
	MilestoneStatusInProgress MilestoneStatus = "IN_PROGRESS"
	MilestoneStatusCompleted  MilestoneStatus = "COMPLETED"
	MilestoneStatusDelayed    MilestoneStatus = "DELAYED"
	MilestoneStatusSkipped    MilestoneStatus = "SKIPPED"
)

type ContractMilestone struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ContractID uuid.UUID `gorm:"column:contract_id;type:uuid;not null;index" json:"contract_id"`

	// Milestone Info (5 fields)
	Name         string          `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description  *string         `gorm:"column:description;type:text" json:"description,omitempty"`
	Status       MilestoneStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	DisplayOrder int             `gorm:"column:display_order;default:0" json:"display_order"`
	IsOptional   bool            `gorm:"column:is_optional;default:false" json:"is_optional"`

	// Dates (4 fields)
	DueDate       time.Time  `gorm:"column:due_date;not null" json:"due_date"`
	StartedAt     *time.Time `gorm:"column:started_at" json:"started_at,omitempty"`
	CompletedAt   *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	ActualEndDate *time.Time `gorm:"column:actual_end_date" json:"actual_end_date,omitempty"`

	// Financial (2 fields)
	PaymentAmount   *float64 `gorm:"column:payment_amount;type:decimal(15,2)" json:"payment_amount,omitempty"`
	PaymentReleased bool     `gorm:"column:payment_released;default:false" json:"payment_released"`

	// Progress (2 fields)
	ProgressPercentage int     `gorm:"column:progress_percentage;default:0" json:"progress_percentage"`
	Notes              *string `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt   time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CompletedBy *uuid.UUID `gorm:"column:completed_by;type:uuid" json:"completed_by,omitempty"`
	UpdatedBy   *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationship
	Contract *ServiceContract `gorm:"foreignKey:ContractID" json:"contract,omitempty"`
}

func (ContractMilestone) TableName() string {
	return "contract_milestones"
}

func (cm *ContractMilestone) IsCompleted() bool {
	return cm.Status == MilestoneStatusCompleted
}

func (cm *ContractMilestone) IsOverdue() bool {
	return !cm.IsCompleted() && time.Now().After(cm.DueDate)
}

func (cm *ContractMilestone) Start(userID *uuid.UUID) {
	now := time.Now()
	cm.Status = MilestoneStatusInProgress
	cm.StartedAt = &now
	cm.UpdatedBy = userID
}

func (cm *ContractMilestone) Complete(userID uuid.UUID) {
	now := time.Now()
	cm.Status = MilestoneStatusCompleted
	cm.CompletedAt = &now
	cm.ActualEndDate = &now
	cm.ProgressPercentage = 100
	cm.CompletedBy = &userID
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateContractNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("CTR-%s-%s", dateStr, randomStr)
}

func generateBreachNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("BRH-%s-%s", dateStr, randomStr)
}

// CreateContract creates a new service contract
func CreateContract(
	db *gorm.DB,
	contract *ServiceContract,
	services []ContractService,
	slas []ServiceSLA,
	milestones []ContractMilestone,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		contract.ContractNumber = generateContractNumber()
		contract.CreatedBy = userID

		if err := tx.Create(contract).Error; err != nil {
			return err
		}

		// Create services
		if len(services) > 0 {
			for i := range services {
				services[i].ContractID = contract.ID
			}
			if err := tx.Create(&services).Error; err != nil {
				return err
			}
		}

		// Create SLAs
		if len(slas) > 0 {
			for i := range slas {
				slas[i].ContractID = contract.ID
				slas[i].CreatedBy = userID
			}
			if err := tx.Create(&slas).Error; err != nil {
				return err
			}
		}

		// Create milestones
		if len(milestones) > 0 {
			for i := range milestones {
				milestones[i].ContractID = contract.ID
			}
			if err := tx.Create(&milestones).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// RenewContract creates a new contract from an expiring one
func RenewContract(
	db *gorm.DB,
	oldContractID uuid.UUID,
	termMonths int,
	userID *uuid.UUID,
) (*ServiceContract, error) {
	var newContract *ServiceContract

	err := db.Transaction(func(tx *gorm.DB) error {
		// Get old contract
		var oldContract ServiceContract
		if err := tx.Preload("Services").Preload("SLAs").
			First(&oldContract, oldContractID).Error; err != nil {
			return err
		}

		// Create new contract
		startDate := oldContract.EndDate.AddDate(0, 0, 1)
		endDate := startDate.AddDate(0, termMonths, 0)

		newContract = &ServiceContract{
			CustomerID:         oldContract.CustomerID,
			Type:               oldContract.Type,
			Status:             ContractStatusDraft,
			Title:              oldContract.Title + " (Renewal)",
			Description:        oldContract.Description,
			Version:            1,
			ParentContractID:   &oldContract.ID,
			StartDate:          startDate,
			EndDate:            endDate,
			ContractValue:      oldContract.ContractValue,
			Currency:           oldContract.Currency,
			AutoRenew:          oldContract.AutoRenew,
			RenewalTermMonths:  &termMonths,
			TermsAndConditions: oldContract.TermsAndConditions,
			PaymentTerms:       oldContract.PaymentTerms,
			CreatedBy:          userID,
		}

		if err := tx.Create(newContract).Error; err != nil {
			return err
		}

		// Copy services
		for _, service := range oldContract.Services {
			newService := ContractService{
				ContractID:  newContract.ID,
				ServiceID:   service.ServiceID,
				PlanID:      service.PlanID,
				Quantity:    service.Quantity,
				UnitPrice:   service.UnitPrice,
				TotalPrice:  service.TotalPrice,
				Description: service.Description,
				StartDate:   startDate,
				IsActive:    true,
			}
			if err := tx.Create(&newService).Error; err != nil {
				return err
			}
		}

		// Copy SLAs
		for _, sla := range oldContract.SLAs {
			newSLA := ServiceSLA{
				ContractID:        newContract.ID,
				Name:              sla.Name,
				Description:       sla.Description,
				MetricType:        sla.MetricType,
				Status:            SLAStatusActive,
				Priority:          sla.Priority,
				TargetValue:       sla.TargetValue,
				ThresholdValue:    sla.ThresholdValue,
				Unit:              sla.Unit,
				MeasurementPeriod: sla.MeasurementPeriod,
				PenaltyEnabled:    sla.PenaltyEnabled,
				PenaltyAmount:     sla.PenaltyAmount,
				PenaltyType:       sla.PenaltyType,
				CreatedBy:         userID,
			}
			if err := tx.Create(&newSLA).Error; err != nil {
				return err
			}
		}

		// Update old contract
		now := time.Now()
		oldContract.Status = ContractStatusRenewed
		oldContract.RenewalDate = &now
		if err := tx.Save(&oldContract).Error; err != nil {
			return err
		}

		return nil
	})

	return newContract, err
}

// RecordSLABreach records an SLA breach
func RecordSLABreach(
	db *gorm.DB,
	slaID uuid.UUID,
	actualValue float64,
	description string,
	severity BreachSeverity,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get SLA
		var sla ServiceSLA
		if err := tx.First(&sla, slaID).Error; err != nil {
			return err
		}

		// Create breach
		breach := &SLABreach{
			SLAID:        slaID,
			BreachNumber: generateBreachNumber(),
			Severity:     severity,
			Status:       BreachStatusOpen,
			Description:  description,
			TargetValue:  sla.TargetValue,
			ActualValue:  actualValue,
			Deviation:    sla.TargetValue - actualValue,
			BreachDate:   time.Now(),
			DetectedAt:   time.Now(),
		}

		// Calculate penalty if enabled
		if sla.PenaltyEnabled && sla.PenaltyAmount != nil {
			breach.PenaltyApplied = true
			breach.PenaltyAmount = sla.PenaltyAmount
		}

		if err := tx.Create(breach).Error; err != nil {
			return err
		}

		// Update SLA status
		sla.Status = SLAStatusBreached
		sla.UpdateMeasurement(actualValue)

		return tx.Save(&sla).Error
	})
}

// CheckExpiringContracts checks for contracts expiring soon
func CheckExpiringContracts(db *gorm.DB, daysThreshold int) ([]ServiceContract, error) {
	threshold := time.Now().AddDate(0, 0, daysThreshold)

	var contracts []ServiceContract
	err := db.Where("status = ? AND end_date <= ? AND end_date >= ?",
		ContractStatusActive, threshold, time.Now()).
		Find(&contracts).Error

	// Update status to expiring
	for i := range contracts {
		if contracts[i].Status == ContractStatusActive {
			contracts[i].Status = ContractStatusExpiring
			db.Save(&contracts[i])
		}
	}

	return contracts, err
}

// ExpireContracts expires contracts that have passed their end date
func ExpireContracts(db *gorm.DB) error {
	return db.Model(&ServiceContract{}).
		Where("status IN ? AND end_date < ?",
			[]ContractStatus{ContractStatusActive, ContractStatusExpiring},
			time.Now()).
		Update("status", ContractStatusExpired).Error
}
