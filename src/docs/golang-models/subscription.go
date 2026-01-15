package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// SUBSCRIPTION - Customer Subscriptions
// ============================================================================
// Purpose: Track customer subscriptions to service packages
// Table: subscriptions
// Primary Key: _id (UUID)
// Features: Trial, Renewal, Cancellation, Upgrade/Downgrade
// ============================================================================

// SubscriptionStatus represents the subscription lifecycle status
type SubscriptionStatus string

const (
	SubscriptionStatusTrial    SubscriptionStatus = "TRIAL"    // In trial period
	SubscriptionStatusActive   SubscriptionStatus = "ACTIVE"   // Active subscription
	SubscriptionStatusPastDue  SubscriptionStatus = "PAST_DUE" // Payment failed
	SubscriptionStatusCanceled SubscriptionStatus = "CANCELED" // Canceled
	SubscriptionStatusExpired  SubscriptionStatus = "EXPIRED"  // Expired
	SubscriptionStatusSuspended SubscriptionStatus = "SUSPENDED" // Suspended
)

// CancellationReason represents why subscription was canceled
type CancellationReason string

const (
	CancellationReasonUserRequest    CancellationReason = "USER_REQUEST"
	CancellationReasonPaymentFailed  CancellationReason = "PAYMENT_FAILED"
	CancellationReasonUpgraded       CancellationReason = "UPGRADED"
	CancellationReasonDowngraded     CancellationReason = "DOWNGRADED"
	CancellationReasonViolation      CancellationReason = "VIOLATION"
	CancellationReasonOther          CancellationReason = "OTHER"
)

type Subscription struct {
	// Identity (4 fields)
	ID          uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID    *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	PackageID   uuid.UUID  `gorm:"column:package_id;type:uuid;not null;index" json:"package_id"`
	CustomerID  uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Subscription Info (2 fields)
	Status      SubscriptionStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Quantity    int                `gorm:"column:quantity;default:1" json:"quantity"` // For per-user/per-unit pricing

	// Trial Period (3 fields)
	IsTrialUsed     bool       `gorm:"column:is_trial_used;default:false" json:"is_trial_used"`
	TrialStartDate  *time.Time `gorm:"column:trial_start_date" json:"trial_start_date,omitempty"`
	TrialEndDate    *time.Time `gorm:"column:trial_end_date" json:"trial_end_date,omitempty"`

	// Subscription Period (4 fields)
	StartDate         time.Time  `gorm:"column:start_date;not null" json:"start_date"`
	EndDate           *time.Time `gorm:"column:end_date" json:"end_date,omitempty"`
	CurrentPeriodStart time.Time `gorm:"column:current_period_start;not null" json:"current_period_start"`
	CurrentPeriodEnd  time.Time  `gorm:"column:current_period_end;not null" json:"current_period_end"`

	// Renewal (3 fields)
	AutoRenew         bool       `gorm:"column:auto_renew;default:true" json:"auto_renew"`
	RenewalCount      int        `gorm:"column:renewal_count;default:0" json:"renewal_count"`
	NextBillingDate   *time.Time `gorm:"column:next_billing_date" json:"next_billing_date,omitempty"`

	// Cancellation (3 fields)
	CanceledAt         *time.Time          `gorm:"column:canceled_at" json:"canceled_at,omitempty"`
	CancellationReason *CancellationReason `gorm:"column:cancellation_reason;type:varchar(50)" json:"cancellation_reason,omitempty"`
	CancelNote         *string             `gorm:"column:cancel_note;type:text" json:"cancel_note,omitempty"`

	// Pricing (3 fields)
	BaseAmount   float64 `gorm:"column:base_amount;type:decimal(15,2);not null" json:"base_amount"`
	TotalAmount  float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`
	Currency     string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Payment Info (2 fields)
	PaymentMethodID  *uuid.UUID `gorm:"column:payment_method_id;type:uuid" json:"payment_method_id,omitempty"`
	LastPaymentDate  *time.Time `gorm:"column:last_payment_date" json:"last_payment_date,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Package       *ServicePackage `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	PaymentMethod *PaymentMethod  `gorm:"foreignKey:PaymentMethodID" json:"payment_method,omitempty"`
}

func (Subscription) TableName() string {
	return "subscriptions"
}

// ============================================================================
// Helper Methods
// ============================================================================

func (s *Subscription) IsActive() bool {
	return (s.Status == SubscriptionStatusActive || s.Status == SubscriptionStatusTrial) &&
		s.DeletedAt == nil
}

func (s *Subscription) IsTrial() bool {
	return s.Status == SubscriptionStatusTrial
}

func (s *Subscription) IsExpired() bool {
	if s.EndDate == nil {
		return false
	}
	return time.Now().After(*s.EndDate)
}

func (s *Subscription) IsCanceled() bool {
	return s.Status == SubscriptionStatusCanceled
}

func (s *Subscription) DaysUntilExpiry() int {
	if s.EndDate == nil {
		return -1 // No expiry
	}
	duration := time.Until(*s.EndDate)
	return int(duration.Hours() / 24)
}

func (s *Subscription) DaysInTrial() int {
	if s.TrialStartDate == nil || s.TrialEndDate == nil {
		return 0
	}
	if time.Now().After(*s.TrialEndDate) {
		return 0
	}
	duration := time.Until(*s.TrialEndDate)
	return int(duration.Hours() / 24)
}

func (s *Subscription) Activate() error {
	if s.DeletedAt != nil {
		return errors.New("cannot activate deleted subscription")
	}
	s.Status = SubscriptionStatusActive
	return nil
}

func (s *Subscription) Suspend() {
	s.Status = SubscriptionStatusSuspended
}

func (s *Subscription) Cancel(reason CancellationReason, note *string) {
	now := time.Now()
	s.Status = SubscriptionStatusCanceled
	s.CanceledAt = &now
	s.CancellationReason = &reason
	s.CancelNote = note
	s.AutoRenew = false
}

func (s *Subscription) Renew(nextPeriodEnd time.Time) {
	s.CurrentPeriodStart = s.CurrentPeriodEnd
	s.CurrentPeriodEnd = nextPeriodEnd
	s.RenewalCount++
	s.NextBillingDate = &nextPeriodEnd
	s.Status = SubscriptionStatusActive
}

func (s *Subscription) UpdateQuantity(newQuantity int) error {
	if newQuantity < 1 {
		return errors.New("quantity must be at least 1")
	}
	s.Quantity = newQuantity
	return nil
}

// ============================================================================
// SUBSCRIPTION ADDON - Add-ons attached to subscriptions
// ============================================================================

type SubscriptionAddon struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`
	AddonID        uuid.UUID `gorm:"column:addon_id;type:uuid;not null;index" json:"addon_id"`

	// Addon Info (3 fields)
	Quantity    int     `gorm:"column:quantity;default:1" json:"quantity"`
	Price       float64 `gorm:"column:price;type:decimal(15,2);not null" json:"price"`
	TotalAmount float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`

	// Status (2 fields)
	IsActive    bool       `gorm:"column:is_active;default:true" json:"is_active"`
	ActivatedAt time.Time  `gorm:"column:activated_at;autoCreateTime" json:"activated_at"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Subscription *Subscription  `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	Addon        *PackageAddon  `gorm:"foreignKey:AddonID" json:"addon,omitempty"`
}

func (SubscriptionAddon) TableName() string {
	return "subscription_addons"
}

// ============================================================================
// PAYMENT METHOD - Payment methods for subscriptions
// ============================================================================

type PaymentMethodType string

const (
	PaymentMethodTypeCreditCard PaymentMethodType = "CREDIT_CARD"
	PaymentMethodTypeDebitCard  PaymentMethodType = "DEBIT_CARD"
	PaymentMethodTypePayPal     PaymentMethodType = "PAYPAL"
	PaymentMethodTypeBankTransfer PaymentMethodType = "BANK_TRANSFER"
	PaymentMethodTypeStripe     PaymentMethodType = "STRIPE"
)

type PaymentMethod struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	CustomerID uuid.UUID `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Payment Method Info (5 fields)
	Type            PaymentMethodType `gorm:"column:type;type:varchar(50);not null" json:"type"`
	Provider        string            `gorm:"column:provider;type:varchar(50)" json:"provider"` // stripe, paypal, etc.
	Last4           *string           `gorm:"column:last4;type:varchar(4)" json:"last4,omitempty"`
	ExpiryMonth     *int              `gorm:"column:expiry_month" json:"expiry_month,omitempty"`
	ExpiryYear      *int              `gorm:"column:expiry_year" json:"expiry_year,omitempty"`

	// Provider Data (2 fields)
	ProviderID    *string `gorm:"column:provider_id;type:varchar(255)" json:"provider_id,omitempty"` // Stripe customer ID, etc.
	ProviderToken *string `gorm:"column:provider_token;type:varchar(255)" json:"-"` // Encrypted token

	// Status (3 fields)
	IsDefault bool `gorm:"column:is_default;default:false" json:"is_default"`
	IsActive  bool `gorm:"column:is_active;default:true" json:"is_active"`
	IsVerified bool `gorm:"column:is_verified;default:false" json:"is_verified"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
}

func (PaymentMethod) TableName() string {
	return "payment_methods"
}

func (pm *PaymentMethod) IsExpired() bool {
	if pm.ExpiryMonth == nil || pm.ExpiryYear == nil {
		return false
	}
	now := time.Now()
	expiryDate := time.Date(*pm.ExpiryYear, time.Month(*pm.ExpiryMonth), 1, 0, 0, 0, 0, time.UTC)
	return now.After(expiryDate)
}

// ============================================================================
// INVOICE - Billing invoices
// ============================================================================

type InvoiceStatus string

const (
	InvoiceStatusDraft     InvoiceStatus = "DRAFT"
	InvoiceStatusOpen      InvoiceStatus = "OPEN"
	InvoiceStatusPaid      InvoiceStatus = "PAID"
	InvoiceStatusVoid      InvoiceStatus = "VOID"
	InvoiceStatusUncollectible InvoiceStatus = "UNCOLLECTIBLE"
)

type Invoice struct {
	// Identity (3 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`
	CustomerID     uuid.UUID `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Invoice Info (4 fields)
	InvoiceNumber string        `gorm:"column:invoice_number;type:varchar(50);uniqueIndex;not null" json:"invoice_number"`
	Status        InvoiceStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	DueDate       *time.Time    `gorm:"column:due_date" json:"due_date,omitempty"`
	Description   *string       `gorm:"column:description;type:text" json:"description,omitempty"`

	// Amounts (6 fields)
	Subtotal    float64 `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxAmount   float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	DiscountAmount float64 `gorm:"column:discount_amount;type:decimal(15,2);default:0" json:"discount_amount"`
	TotalAmount float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`
	PaidAmount  float64 `gorm:"column:paid_amount;type:decimal(15,2);default:0" json:"paid_amount"`
	Currency    string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Payment Info (3 fields)
	PaidAt          *time.Time `gorm:"column:paid_at" json:"paid_at,omitempty"`
	PaymentMethodID *uuid.UUID `gorm:"column:payment_method_id;type:uuid" json:"payment_method_id,omitempty"`
	TransactionID   *string    `gorm:"column:transaction_id;type:varchar(255)" json:"transaction_id,omitempty"`

	// Period (2 fields)
	PeriodStart time.Time `gorm:"column:period_start;not null" json:"period_start"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null" json:"period_end"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Subscription  *Subscription  `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	PaymentMethod *PaymentMethod `gorm:"foreignKey:PaymentMethodID" json:"payment_method,omitempty"`
	LineItems     []InvoiceLineItem `gorm:"foreignKey:InvoiceID" json:"line_items,omitempty"`
}

func (Invoice) TableName() string {
	return "invoices"
}

func (i *Invoice) IsPaid() bool {
	return i.Status == InvoiceStatusPaid
}

func (i *Invoice) IsOverdue() bool {
	if i.Status == InvoiceStatusPaid || i.DueDate == nil {
		return false
	}
	return time.Now().After(*i.DueDate)
}

func (i *Invoice) MarkAsPaid(transactionID string) {
	now := time.Now()
	i.Status = InvoiceStatusPaid
	i.PaidAt = &now
	i.PaidAmount = i.TotalAmount
	i.TransactionID = &transactionID
}

func (i *Invoice) Void() {
	i.Status = InvoiceStatusVoid
}

// ============================================================================
// INVOICE LINE ITEM - Invoice line items
// ============================================================================

type InvoiceLineItem struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	InvoiceID uuid.UUID `gorm:"column:invoice_id;type:uuid;not null;index" json:"invoice_id"`

	// Item Info (3 fields)
	Description string `gorm:"column:description;type:text;not null" json:"description"`
	Quantity    int    `gorm:"column:quantity;default:1" json:"quantity"`
	UnitPrice   float64 `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`

	// Amounts (2 fields)
	Amount      float64 `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	TaxAmount   float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`

	// Period (2 fields)
	PeriodStart *time.Time `gorm:"column:period_start" json:"period_start,omitempty"`
	PeriodEnd   *time.Time `gorm:"column:period_end" json:"period_end,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Invoice *Invoice `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
}

func (InvoiceLineItem) TableName() string {
	return "invoice_line_items"
}

// ============================================================================
// SUBSCRIPTION CHANGE - Track subscription changes (upgrades/downgrades)
// ============================================================================

type ChangeType string

const (
	ChangeTypeUpgrade   ChangeType = "UPGRADE"
	ChangeTypeDowngrade ChangeType = "DOWNGRADE"
	ChangeTypeRenewal   ChangeType = "RENEWAL"
	ChangeTypeCancellation ChangeType = "CANCELLATION"
	ChangeTypeReactivation ChangeType = "REACTIVATION"
	ChangeTypeQuantity  ChangeType = "QUANTITY"
)

type SubscriptionChange struct {
	// Identity (2 fields)
	ID             uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	SubscriptionID uuid.UUID `gorm:"column:subscription_id;type:uuid;not null;index" json:"subscription_id"`

	// Change Info (4 fields)
	ChangeType     ChangeType `gorm:"column:change_type;type:varchar(20);not null;index" json:"change_type"`
	OldPackageID   *uuid.UUID `gorm:"column:old_package_id;type:uuid" json:"old_package_id,omitempty"`
	NewPackageID   *uuid.UUID `gorm:"column:new_package_id;type:uuid" json:"new_package_id,omitempty"`
	Reason         *string    `gorm:"column:reason;type:text" json:"reason,omitempty"`

	// Pricing Impact (3 fields)
	OldAmount      float64 `gorm:"column:old_amount;type:decimal(15,2)" json:"old_amount"`
	NewAmount      float64 `gorm:"column:new_amount;type:decimal(15,2)" json:"new_amount"`
	ProrationAmount float64 `gorm:"column:proration_amount;type:decimal(15,2);default:0" json:"proration_amount"`

	// Timing (2 fields)
	EffectiveDate time.Time `gorm:"column:effective_date;not null" json:"effective_date"`
	ScheduledFor  *time.Time `gorm:"column:scheduled_for" json:"scheduled_for,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (3 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	ApprovedBy *uuid.UUID `gorm:"column:approved_by;type:uuid" json:"approved_by,omitempty"`

	// Relationships
	Subscription *Subscription   `gorm:"foreignKey:SubscriptionID" json:"subscription,omitempty"`
	OldPackage   *ServicePackage `gorm:"foreignKey:OldPackageID" json:"old_package,omitempty"`
	NewPackage   *ServicePackage `gorm:"foreignKey:NewPackageID" json:"new_package,omitempty"`
}

func (SubscriptionChange) TableName() string {
	return "subscription_changes"
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateSubscription creates a new subscription with trial if applicable
func CreateSubscription(
	db *gorm.DB,
	packageID uuid.UUID,
	customerID uuid.UUID,
	paymentMethodID *uuid.UUID,
	quantity int,
) (*Subscription, error) {
	var pkg ServicePackage
	if err := db.First(&pkg, packageID).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	subscription := &Subscription{
		PackageID:         packageID,
		CustomerID:        customerID,
		PaymentMethodID:   paymentMethodID,
		Quantity:          quantity,
		BaseAmount:        pkg.BasePrice,
		TotalAmount:       pkg.CalculatePriceForQuantity(quantity),
		Currency:          pkg.Currency,
		StartDate:         now,
		CurrentPeriodStart: now,
		AutoRenew:         true,
	}

	// Calculate current period end based on billing cycle
	subscription.CurrentPeriodEnd = calculateNextBillingDate(now, pkg.BillingCycle)
	subscription.NextBillingDate = &subscription.CurrentPeriodEnd

	// Setup trial if applicable
	if pkg.HasTrial && pkg.TrialDays > 0 {
		trialStart := now
		trialEnd := now.AddDate(0, 0, pkg.TrialDays)
		subscription.Status = SubscriptionStatusTrial
		subscription.IsTrialUsed = true
		subscription.TrialStartDate = &trialStart
		subscription.TrialEndDate = &trialEnd
	} else {
		subscription.Status = SubscriptionStatusActive
	}

	if err := db.Create(subscription).Error; err != nil {
		return nil, err
	}

	// Update package statistics
	pkg.IncrementSubscriptions()
	db.Save(&pkg)

	return subscription, nil
}

// RenewSubscription renews a subscription for the next billing cycle
func RenewSubscription(db *gorm.DB, subscriptionID uuid.UUID) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var subscription Subscription
		if err := tx.Preload("Package").First(&subscription, subscriptionID).Error; err != nil {
			return err
		}

		if subscription.Status != SubscriptionStatusActive {
			return errors.New("can only renew active subscriptions")
		}

		// Calculate next period
		nextPeriodEnd := calculateNextBillingDate(subscription.CurrentPeriodEnd, subscription.Package.BillingCycle)

		// Renew
		subscription.Renew(nextPeriodEnd)

		// Create invoice
		invoice := &Invoice{
			SubscriptionID: subscription.ID,
			CustomerID:     subscription.CustomerID,
			InvoiceNumber:  generateInvoiceNumber(),
			Status:         InvoiceStatusOpen,
			Subtotal:       subscription.TotalAmount,
			TotalAmount:    subscription.TotalAmount,
			Currency:       subscription.Currency,
			PeriodStart:    subscription.CurrentPeriodStart,
			PeriodEnd:      subscription.CurrentPeriodEnd,
			PaymentMethodID: subscription.PaymentMethodID,
		}

		dueDate := subscription.CurrentPeriodStart.AddDate(0, 0, 7) // 7 days to pay
		invoice.DueDate = &dueDate

		if err := tx.Create(invoice).Error; err != nil {
			return err
		}

		// Add line item
		lineItem := &InvoiceLineItem{
			InvoiceID:   invoice.ID,
			Description: fmt.Sprintf("%s - %s", subscription.Package.Name, subscription.Package.BillingCycle),
			Quantity:    subscription.Quantity,
			UnitPrice:   subscription.BaseAmount,
			Amount:      subscription.TotalAmount,
			PeriodStart: &subscription.CurrentPeriodStart,
			PeriodEnd:   &subscription.CurrentPeriodEnd,
		}

		if err := tx.Create(lineItem).Error; err != nil {
			return err
		}

		// Save subscription
		return tx.Save(&subscription).Error
	})
}

// CancelSubscription cancels a subscription
func CancelSubscription(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	reason CancellationReason,
	note *string,
	canceledBy *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var subscription Subscription
		if err := tx.Preload("Package").First(&subscription, subscriptionID).Error; err != nil {
			return err
		}

		subscription.Cancel(reason, note)
		subscription.UpdatedBy = canceledBy

		if err := tx.Save(&subscription).Error; err != nil {
			return err
		}

		// Update package statistics
		subscription.Package.DecrementSubscriptions()
		if err := tx.Save(subscription.Package).Error; err != nil {
			return err
		}

		// Log change
		change := &SubscriptionChange{
			SubscriptionID: subscriptionID,
			ChangeType:     ChangeTypeCancellation,
			Reason:         note,
			OldAmount:      subscription.TotalAmount,
			NewAmount:      0,
			EffectiveDate:  time.Now(),
			CreatedBy:      canceledBy,
		}

		return tx.Create(change).Error
	})
}

// UpgradeSubscription upgrades a subscription to a new package
func UpgradeSubscription(
	db *gorm.DB,
	subscriptionID uuid.UUID,
	newPackageID uuid.UUID,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var subscription Subscription
		if err := tx.Preload("Package").First(&subscription, subscriptionID).Error; err != nil {
			return err
		}

		var newPackage ServicePackage
		if err := tx.First(&newPackage, newPackageID).Error; err != nil {
			return err
		}

		oldPackageID := subscription.PackageID
		oldAmount := subscription.TotalAmount

		// Update subscription
		subscription.PackageID = newPackageID
		subscription.BaseAmount = newPackage.BasePrice
		subscription.TotalAmount = newPackage.CalculatePriceForQuantity(subscription.Quantity)
		subscription.UpdatedBy = userID

		if err := tx.Save(&subscription).Error; err != nil {
			return err
		}

		// Update package statistics
		subscription.Package.DecrementSubscriptions()
		tx.Save(subscription.Package)

		newPackage.IncrementSubscriptions()
		tx.Save(&newPackage)

		// Log change
		change := &SubscriptionChange{
			SubscriptionID: subscriptionID,
			ChangeType:     ChangeTypeUpgrade,
			OldPackageID:   &oldPackageID,
			NewPackageID:   &newPackageID,
			OldAmount:      oldAmount,
			NewAmount:      subscription.TotalAmount,
			EffectiveDate:  time.Now(),
			CreatedBy:      userID,
		}

		return tx.Create(change).Error
	})
}

// Utility functions
func calculateNextBillingDate(from time.Time, cycle BillingCycle) time.Time {
	switch cycle {
	case BillingCycleDaily:
		return from.AddDate(0, 0, 1)
	case BillingCycleWeekly:
		return from.AddDate(0, 0, 7)
	case BillingCycleMonthly:
		return from.AddDate(0, 1, 0)
	case BillingCycleQuarterly:
		return from.AddDate(0, 3, 0)
	case BillingCycleYearly:
		return from.AddDate(1, 0, 0)
	case BillingCycleLifetime:
		return from.AddDate(100, 0, 0) // Far future
	default:
		return from.AddDate(0, 1, 0)
	}
}

func generateInvoiceNumber() string {
	// Simple implementation - should use a more sophisticated numbering system
	return fmt.Sprintf("INV-%d", time.Now().Unix())
}
