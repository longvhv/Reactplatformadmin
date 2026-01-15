package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// SERVICE SUBSCRIPTION - Customer Service Subscriptions
// ============================================================================
// Purpose: Manage customer subscriptions to services
// Table: service_subscriptions
// Primary Key: _id (UUID)
// Features: Full lifecycle, Auto-renewal, Usage tracking, Plan changes
// ============================================================================

type SubscriptionStatus string

const (
	SubscriptionStatusPending    SubscriptionStatus = "PENDING"     // Awaiting activation
	SubscriptionStatusTrial      SubscriptionStatus = "TRIAL"       // In trial period
	SubscriptionStatusActive     SubscriptionStatus = "ACTIVE"      // Active subscription
	SubscriptionStatusPastDue    SubscriptionStatus = "PAST_DUE"    // Payment failed
	SubscriptionStatusSuspended  SubscriptionStatus = "SUSPENDED"   // Temporarily suspended
	SubscriptionStatusCanceled   SubscriptionStatus = "CANCELED"    // Canceled by user
	SubscriptionStatusExpired    SubscriptionStatus = "EXPIRED"     // Expired
)

type ServiceSubscription struct {
	// ========== Identity (4 fields) ==========
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CustomerID uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`
	ServiceID  uuid.UUID  `gorm:"column:service_id;type:uuid;not null;index" json:"service_id"`
	PlanID     uuid.UUID  `gorm:"column:plan_id;type:uuid;not null;index" json:"plan_id"`

	// ========== Subscription Info (4 fields) ==========
	SubscriptionNumber string             `gorm:"column:subscription_number;type:varchar(50);uniqueIndex;not null" json:"subscription_number"`
	Status             SubscriptionStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Name               *string            `gorm:"column:name;type:varchar(255)" json:"name,omitempty"`
	Description        *string            `gorm:"column:description;type:text" json:"description,omitempty"`

	// ========== Billing (5 fields) ==========
	BillingCycle  BillingCycle `gorm:"column:billing_cycle;type:varchar(20);not null" json:"billing_cycle"`
	Price         float64      `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	SetupFee      float64      `gorm:"column:setup_fee;type:decimal(15,2);default:0" json:"setup_fee"`
	Currency      string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	NextBillingAmount float64  `gorm:"column:next_billing_amount;type:decimal(15,2)" json:"next_billing_amount"`

	// ========== Dates (7 fields) ==========
	StartDate         time.Time  `gorm:"column:start_date;not null;index" json:"start_date"`
	EndDate           *time.Time `gorm:"column:end_date;index" json:"end_date,omitempty"`
	TrialStartDate    *time.Time `gorm:"column:trial_start_date" json:"trial_start_date,omitempty"`
	TrialEndDate      *time.Time `gorm:"column:trial_end_date" json:"trial_end_date,omitempty"`
	CurrentPeriodStart time.Time `gorm:"column:current_period_start;not null" json:"current_period_start"`
	CurrentPeriodEnd   time.Time `gorm:"column:current_period_end;not null" json:"current_period_end"`
	NextBillingDate    time.Time  `gorm:"column:next_billing_date;not null;index" json:"next_billing_date"`

	// ========== Renewal (4 fields) ==========
	AutoRenew       bool       `gorm:"column:auto_renew;default:true" json:"auto_renew"`
	RenewalCount    int        `gorm:"column:renewal_count;default:0" json:"renewal_count"`
	LastRenewalDate *time.Time `gorm:"column:last_renewal_date" json:"last_renewal_date,omitempty"`
	CancelAtPeriodEnd bool     `gorm:"column:cancel_at_period_end;default:false" json:"cancel_at_period_end"`

	// ========== Cancellation (3 fields) ==========
	CanceledAt     *time.Time `gorm:"column:canceled_at" json:"canceled_at,omitempty"`
	CanceledBy     *uuid.UUID `gorm:"column:canceled_by;type:uuid" json:"canceled_by,omitempty"`
	CancellationReason *string `gorm:"column:cancellation_reason;type:text" json:"cancellation_reason,omitempty"`

	// ========== Usage & Quotas (5 fields) ==========
	UsedUsers      int `gorm:"column:used_users;default:0" json:"used_users"`
	UsedStorage    int `gorm:"column:used_storage;default:0" json:"used_storage"`    // In GB
	UsedBandwidth  int `gorm:"column:used_bandwidth;default:0" json:"used_bandwidth"` // In GB
	UsedAPIRequests int `gorm:"column:used_api_requests;default:0" json:"used_api_requests"`
	LastUsageUpdate *time.Time `gorm:"column:last_usage_update" json:"last_usage_update,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete & Version (3 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationships
	Service   *Service               `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
	Plan      *ServicePlan           `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	Addons    []SubscriptionAddon    `gorm:"foreignKey:SubscriptionID" json:"addons,omitempty"`
	History   []SubscriptionHistory  `gorm:"foreignKey:SubscriptionID" json:"history,omitempty"`
	Usage     []UsageRecord          `gorm:"foreignKey:SubscriptionID" json:"usage,omitempty"`
}

func (ServiceSubscription) TableName() string {
	return "service_subscriptions"
}

// Helper Methods
func (ss *ServiceSubscription) IsActive() bool {
	return ss.Status == SubscriptionStatusActive
}

func (ss *ServiceSubscription) IsInTrial() bool {
	return ss.Status == SubscriptionStatusTrial
}

func (ss *ServiceSubscription) IsCanceled() bool {
	return ss.Status == SubscriptionStatusCanceled
}

func (ss *ServiceSubscription) IsExpired() bool {
	if ss.EndDate == nil {
		return false
	}
	return time.Now().After(*ss.EndDate)
}

func (ss *ServiceSubscription) DaysUntilRenewal() int {
	duration := time.Until(ss.NextBillingDate)
	return int(duration.Hours() / 24)
}

func (ss *ServiceSubscription) DaysInCurrentPeriod() int {
	duration := ss.CurrentPeriodEnd.Sub(ss.CurrentPeriodStart)
	return int(duration.Hours() / 24)
}

func (ss *ServiceSubscription) IsTrialExpiringSoon(days int) bool {
	if !ss.IsInTrial() || ss.TrialEndDate == nil {
		return false
	}
	daysUntilEnd := int(time.Until(*ss.TrialEndDate).Hours() / 24)
	return daysUntilEnd <= days && daysUntilEnd > 0
}

func (ss *ServiceSubscription) Activate() {
	ss.Status = SubscriptionStatusActive
	now := time.Now()
	if ss.TrialEndDate != nil && now.Before(*ss.TrialEndDate) {
		ss.Status = SubscriptionStatusTrial
	}
}

func (ss *ServiceSubscription) Suspend(reason string) {
	ss.Status = SubscriptionStatusSuspended
	if ss.Metadata == nil {
		ss.Metadata = JSONB{}
	}
	ss.Metadata["suspension_reason"] = reason
	ss.Metadata["suspended_at"] = time.Now()
}

func (ss *ServiceSubscription) Resume() {
	if ss.Status == SubscriptionStatusSuspended {
		ss.Status = SubscriptionStatusActive
	}
}

func (ss *ServiceSubscription) Cancel(reason string, userID uuid.UUID, immediately bool) {
	now := time.Now()
	ss.CanceledAt = &now
	ss.CanceledBy = &userID
	ss.CancellationReason = &reason
	
	if immediately {
		ss.Status = SubscriptionStatusCanceled
		ss.EndDate = &now
	} else {
		ss.CancelAtPeriodEnd = true
	}
}

func (ss *ServiceSubscription) Renew() error {
	if !ss.AutoRenew {
		return errors.New("auto-renewal is disabled")
	}

	// Calculate next period
	nextPeriodStart := ss.CurrentPeriodEnd
	nextPeriodEnd := calculateNextPeriodEnd(nextPeriodStart, ss.BillingCycle)

	ss.CurrentPeriodStart = nextPeriodStart
	ss.CurrentPeriodEnd = nextPeriodEnd
	ss.NextBillingDate = nextPeriodEnd
	ss.RenewalCount++
	now := time.Now()
	ss.LastRenewalDate = &now

	// Reset usage counters for new period
	ss.UsedUsers = 0
	ss.UsedStorage = 0
	ss.UsedBandwidth = 0
	ss.UsedAPIRequests = 0

	return nil
}

// ============================================================================
// SUBSCRIPTION ADDON - Addon subscriptions
// ============================================================================

type SubscriptionAddon struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`
	AddonID        uuid.UUID `gorm:"column:addon_id;type:uuid;not null;index" json:"addon_id"`

	// Addon Info (3 fields)
	Quantity  int     `gorm:"column:quantity;default:1" json:"quantity"`
	Price     float64 `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	TotalPrice float64 `gorm:"column:total_price;type:decimal(15,2);not null" json:"total_price"`

	// Status (2 fields)
	IsActive  bool       `gorm:"column:is_active;default:true" json:"is_active"`
	StartDate time.Time  `gorm:"column:start_date;not null" json:"start_date"`
	EndDate   *time.Time `gorm:"column:end_date" json:"end_date,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Subscription *ServiceSubscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	Addon        *ServiceAddon        `gorm:"foreignKey:AddonID" json:"addon,omitempty"`
}

func (SubscriptionAddon) TableName() string {
	return "subscription_addons"
}

// ============================================================================
// SUBSCRIPTION HISTORY - Subscription Change History
// ============================================================================

type HistoryEventType string

const (
	HistoryEventCreated      HistoryEventType = "CREATED"
	HistoryEventActivated    HistoryEventType = "ACTIVATED"
	HistoryEventPlanChanged  HistoryEventType = "PLAN_CHANGED"
	HistoryEventAddonAdded   HistoryEventType = "ADDON_ADDED"
	HistoryEventAddonRemoved HistoryEventType = "ADDON_REMOVED"
	HistoryEventRenewed      HistoryEventType = "RENEWED"
	HistoryEventSuspended    HistoryEventType = "SUSPENDED"
	HistoryEventResumed      HistoryEventType = "RESUMED"
	HistoryEventCanceled     HistoryEventType = "CANCELED"
	HistoryEventExpired      HistoryEventType = "EXPIRED"
)

type SubscriptionHistory struct {
	// Identity (2 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`

	// Event Info (5 fields)
	EventType   HistoryEventType `gorm:"column:event_type;type:varchar(30);not null;index" json:"event_type"`
	Description string           `gorm:"column:description;type:text;not null" json:"description"`
	OldValue    *string          `gorm:"column:old_value;type:text" json:"old_value,omitempty"`
	NewValue    *string          `gorm:"column:new_value;type:text" json:"new_value,omitempty"`
	Metadata    JSONB            `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Subscription *ServiceSubscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
}

func (SubscriptionHistory) TableName() string {
	return "subscription_history"
}

// ============================================================================
// USAGE RECORD - Usage Tracking
// ============================================================================

type UsageMetric string

const (
	UsageMetricUsers       UsageMetric = "USERS"
	UsageMetricStorage     UsageMetric = "STORAGE"
	UsageMetricBandwidth   UsageMetric = "BANDWIDTH"
	UsageMetricAPIRequests UsageMetric = "API_REQUESTS"
	UsageMetricEmails      UsageMetric = "EMAILS"
	UsageMetricSMS         UsageMetric = "SMS"
	UsageMetricCompute     UsageMetric = "COMPUTE_HOURS"
	UsageMetricCustom      UsageMetric = "CUSTOM"
)

type UsageRecord struct {
	// Identity (2 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`

	// Usage Info (6 fields)
	Metric      UsageMetric `gorm:"column:metric;type:varchar(30);not null;index" json:"metric"`
	Quantity    float64     `gorm:"column:quantity;type:decimal(15,4);not null" json:"quantity"`
	Unit        string      `gorm:"column:unit;type:varchar(20);not null" json:"unit"`
	RecordedAt  time.Time   `gorm:"column:recorded_at;not null;index" json:"recorded_at"`
	PeriodStart time.Time   `gorm:"column:period_start;not null" json:"period_start"`
	PeriodEnd   time.Time   `gorm:"column:period_end;not null" json:"period_end"`

	// Billing (2 fields)
	IsBillable bool     `gorm:"column:is_billable;default:true" json:"is_billable"`
	Amount     *float64 `gorm:"column:amount;type:decimal(15,2)" json:"amount,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relationship
	Subscription *ServiceSubscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
}

func (UsageRecord) TableName() string {
	return "usage_records"
}

// ============================================================================
// PLAN CHANGE REQUEST - Plan Upgrade/Downgrade Requests
// ============================================================================

type ChangeType string

const (
	ChangeTypeUpgrade   ChangeType = "UPGRADE"
	ChangeTypeDowngrade ChangeType = "DOWNGRADE"
	ChangeTypeModify    ChangeType = "MODIFY"
)

type ChangeStatus string

const (
	ChangeStatusPending   ChangeStatus = "PENDING"
	ChangeStatusApproved  ChangeStatus = "APPROVED"
	ChangeStatusApplied   ChangeStatus = "APPLIED"
	ChangeStatusRejected  ChangeStatus = "REJECTED"
	ChangeStatusCanceled  ChangeStatus = "CANCELED"
)

type PlanChangeRequest struct {
	// Identity (2 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`

	// Change Info (6 fields)
	FromPlanID uuid.UUID    `gorm:"column:from_plan_id;type:uuid;not null" json:"from_plan_id"`
	ToPlanID   uuid.UUID    `gorm:"column:to_plan_id;type:uuid;not null" json:"to_plan_id"`
	ChangeType ChangeType   `gorm:"column:change_type;type:varchar(20);not null" json:"change_type"`
	Status     ChangeStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Reason     *string      `gorm:"column:reason;type:text" json:"reason,omitempty"`
	ApplyAt    *time.Time   `gorm:"column:apply_at" json:"apply_at,omitempty"` // When to apply (null = immediately)

	// Pricing (3 fields)
	PriceDifference float64 `gorm:"column:price_difference;type:decimal(15,2)" json:"price_difference"` // Positive = increase
	ProrationAmount float64 `gorm:"column:proration_amount;type:decimal(15,2)" json:"proration_amount"`
	Currency        string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Processing (3 fields)
	ProcessedAt *time.Time `gorm:"column:processed_at" json:"processed_at,omitempty"`
	ProcessedBy *uuid.UUID `gorm:"column:processed_by;type:uuid" json:"processed_by,omitempty"`
	Notes       *string    `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Subscription *ServiceSubscription `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	FromPlan     *ServicePlan         `gorm:"foreignKey:FromPlanID" json:"from_plan,omitempty"`
	ToPlan       *ServicePlan         `gorm:"foreignKey:ToPlanID" json:"to_plan,omitempty"`
}

func (PlanChangeRequest) TableName() string {
	return "plan_change_requests"
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateSubscriptionNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("SUB-%s-%s", dateStr, randomStr)
}

// CreateSubscription creates a new subscription
func CreateSubscription(
	db *gorm.DB,
	customerID uuid.UUID,
	planID uuid.UUID,
	startDate time.Time,
	userID *uuid.UUID,
) (*ServiceSubscription, error) {
	var subscription *ServiceSubscription

	err := db.Transaction(func(tx *gorm.DB) error {
		// Get plan details
		var plan ServicePlan
		if err := tx.Preload("Service").First(&plan, planID).Error; err != nil {
			return err
		}

		// Calculate dates
		currentPeriodStart := startDate
		currentPeriodEnd := calculateNextPeriodEnd(startDate, plan.BillingCycle)

		subscription = &ServiceSubscription{
			CustomerID:         customerID,
			ServiceID:          plan.ServiceID,
			PlanID:             planID,
			SubscriptionNumber: generateSubscriptionNumber(),
			Status:             SubscriptionStatusPending,
			BillingCycle:       plan.BillingCycle,
			Price:              plan.Price,
			SetupFee:           plan.SetupFee,
			Currency:           plan.Currency,
			StartDate:          startDate,
			CurrentPeriodStart: currentPeriodStart,
			CurrentPeriodEnd:   currentPeriodEnd,
			NextBillingDate:    currentPeriodEnd,
			NextBillingAmount:  plan.Price,
			AutoRenew:          true,
			CreatedBy:          userID,
		}

		// Handle trial period
		if plan.HasTrial && plan.TrialDays != nil && *plan.TrialDays > 0 {
			trialStart := startDate
			trialEnd := startDate.AddDate(0, 0, *plan.TrialDays)
			subscription.TrialStartDate = &trialStart
			subscription.TrialEndDate = &trialEnd
			subscription.Status = SubscriptionStatusTrial
			subscription.NextBillingDate = trialEnd
		} else {
			subscription.Status = SubscriptionStatusActive
		}

		if err := tx.Create(subscription).Error; err != nil {
			return err
		}

		// Create history
		history := &SubscriptionHistory{
			SubscriptionID: subscription.ID,
			EventType:      HistoryEventCreated,
			Description:    fmt.Sprintf("Subscription created for plan %s", plan.Name),
			CreatedBy:      userID,
		}
		if err := tx.Create(history).Error; err != nil {
			return err
		}

		return nil
	})

	return subscription, err
}

// AddSubscriptionAddon adds an addon to subscription
func AddSubscriptionAddon(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	addonID uuid.UUID,
	quantity int,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get addon
		var addon ServiceAddon
		if err := tx.First(&addon, addonID).Error; err != nil {
			return err
		}

		// Calculate price
		totalPrice := addon.CalculatePrice(quantity)

		// Create subscription addon
		subscriptionAddon := &SubscriptionAddon{
			SubscriptionID: subscriptionID,
			AddonID:        addonID,
			Quantity:       quantity,
			Price:          addon.Price,
			TotalPrice:     totalPrice,
			IsActive:       true,
			StartDate:      time.Now(),
			CreatedBy:      userID,
		}

		if err := tx.Create(subscriptionAddon).Error; err != nil {
			return err
		}

		// Create history
		history := &SubscriptionHistory{
			SubscriptionID: subscriptionID,
			EventType:      HistoryEventAddonAdded,
			Description:    fmt.Sprintf("Added addon %s (qty: %d)", addon.Name, quantity),
			CreatedBy:      userID,
		}
		return tx.Create(history).Error
	})
}

// ChangePlan creates a plan change request
func ChangePlan(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	newPlanID uuid.UUID,
	applyImmediately bool,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get subscription
		var subscription ServiceSubscription
		if err := tx.Preload("Plan").First(&subscription, subscriptionID).Error; err != nil {
			return err
		}

		// Get new plan
		var newPlan ServicePlan
		if err := tx.First(&newPlan, newPlanID).Error; err != nil {
			return err
		}

		// Determine change type
		var changeType ChangeType
		priceDiff := newPlan.Price - subscription.Plan.Price
		if priceDiff > 0 {
			changeType = ChangeTypeUpgrade
		} else if priceDiff < 0 {
			changeType = ChangeTypeDowngrade
		} else {
			changeType = ChangeTypeModify
		}

		// Calculate proration
		prorationAmount := calculateProration(&subscription, newPlan.Price)

		// Create change request
		changeRequest := &PlanChangeRequest{
			SubscriptionID:  subscriptionID,
			FromPlanID:      subscription.PlanID,
			ToPlanID:        newPlanID,
			ChangeType:      changeType,
			Status:          ChangeStatusPending,
			PriceDifference: priceDiff,
			ProrationAmount: prorationAmount,
			Currency:        subscription.Currency,
			CreatedBy:       userID,
		}

		if !applyImmediately {
			applyAt := subscription.CurrentPeriodEnd
			changeRequest.ApplyAt = &applyAt
		}

		if err := tx.Create(changeRequest).Error; err != nil {
			return err
		}

		// Auto-approve and apply if immediate
		if applyImmediately {
			return applyPlanChange(tx, changeRequest, userID)
		}

		return nil
	})
}

func applyPlanChange(tx *gorm.DB, changeRequest *PlanChangeRequest, userID *uuid.UUID) error {
	// Get subscription
	var subscription ServiceSubscription
	if err := tx.First(&subscription, changeRequest.SubscriptionID).Error; err != nil {
		return err
	}

	// Get new plan
	var newPlan ServicePlan
	if err := tx.First(&newPlan, changeRequest.ToPlanID).Error; err != nil {
		return err
	}

	// Update subscription
	subscription.PlanID = changeRequest.ToPlanID
	subscription.Price = newPlan.Price
	subscription.BillingCycle = newPlan.BillingCycle
	subscription.NextBillingAmount = newPlan.Price
	subscription.UpdatedBy = userID

	if err := tx.Save(&subscription).Error; err != nil {
		return err
	}

	// Update change request
	now := time.Now()
	changeRequest.Status = ChangeStatusApplied
	changeRequest.ProcessedAt = &now
	changeRequest.ProcessedBy = userID

	if err := tx.Save(changeRequest).Error; err != nil {
		return err
	}

	// Create history
	history := &SubscriptionHistory{
		SubscriptionID: subscription.ID,
		EventType:      HistoryEventPlanChanged,
		Description:    fmt.Sprintf("Plan changed to %s", newPlan.Name),
		CreatedBy:      userID,
	}

	return tx.Create(history).Error
}

// RecordUsage records usage for a subscription
func RecordUsage(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	metric UsageMetric,
	quantity float64,
	unit string,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get subscription
		var subscription ServiceSubscription
		if err := tx.First(&subscription, subscriptionID).Error; err != nil {
			return err
		}

		// Create usage record
		usage := &UsageRecord{
			SubscriptionID: subscriptionID,
			Metric:         metric,
			Quantity:       quantity,
			Unit:           unit,
			RecordedAt:     time.Now(),
			PeriodStart:    subscription.CurrentPeriodStart,
			PeriodEnd:      subscription.CurrentPeriodEnd,
			IsBillable:     true,
		}

		if err := tx.Create(usage).Error; err != nil {
			return err
		}

		// Update subscription usage counters
		switch metric {
		case UsageMetricUsers:
			subscription.UsedUsers += int(quantity)
		case UsageMetricStorage:
			subscription.UsedStorage += int(quantity)
		case UsageMetricBandwidth:
			subscription.UsedBandwidth += int(quantity)
		case UsageMetricAPIRequests:
			subscription.UsedAPIRequests += int(quantity)
		}

		now := time.Now()
		subscription.LastUsageUpdate = &now

		return tx.Save(&subscription).Error
	})
}

// RenewSubscriptions processes subscription renewals
func RenewSubscriptions(db *gorm.DB) error {
	var subscriptions []ServiceSubscription

	err := db.Where("status = ? AND auto_renew = ? AND next_billing_date <= ?",
		SubscriptionStatusActive, true, time.Now()).
		Find(&subscriptions).Error

	if err != nil {
		return err
	}

	for _, subscription := range subscriptions {
		if err := processRenewal(db, &subscription); err != nil {
			fmt.Printf("Error renewing subscription %s: %v\n", subscription.SubscriptionNumber, err)
		}
	}

	return nil
}

func processRenewal(db *gorm.DB, subscription *ServiceSubscription) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Renew subscription
		if err := subscription.Renew(); err != nil {
			return err
		}

		if err := tx.Save(subscription).Error; err != nil {
			return err
		}

		// Create history
		history := &SubscriptionHistory{
			SubscriptionID: subscription.ID,
			EventType:      HistoryEventRenewed,
			Description:    fmt.Sprintf("Subscription renewed (count: %d)", subscription.RenewalCount),
		}

		return tx.Create(history).Error
	})
}

func calculateNextPeriodEnd(startDate time.Time, cycle BillingCycle) time.Time {
	switch cycle {
	case BillingCycleMonthly:
		return startDate.AddDate(0, 1, 0)
	case BillingCycleQuarterly:
		return startDate.AddDate(0, 3, 0)
	case BillingCycleSemiAnnual:
		return startDate.AddDate(0, 6, 0)
	case BillingCycleAnnual:
		return startDate.AddDate(1, 0, 0)
	case BillingCycleBiennial:
		return startDate.AddDate(2, 0, 0)
	default:
		return startDate.AddDate(0, 1, 0)
	}
}

func calculateProration(subscription *ServiceSubscription, newPrice float64) float64 {
	// Calculate days remaining in period
	now := time.Now()
	totalDays := subscription.CurrentPeriodEnd.Sub(subscription.CurrentPeriodStart).Hours() / 24
	remainingDays := subscription.CurrentPeriodEnd.Sub(now).Hours() / 24

	if remainingDays <= 0 {
		return 0
	}

	// Calculate proration
	dailyRateOld := subscription.Price / totalDays
	dailyRateNew := newPrice / totalDays

	creditForUnused := dailyRateOld * remainingDays
	chargeForNew := dailyRateNew * remainingDays

	return chargeForNew - creditForUnused
}
