package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantSubscriptionService struct {
	subscriptionRepo repository.TenantSubscriptionRepository
}

func NewTenantSubscriptionService(subscriptionRepo repository.TenantSubscriptionRepository) *TenantSubscriptionService {
	return &TenantSubscriptionService{
		subscriptionRepo: subscriptionRepo,
	}
}

type CreateTenantSubscriptionRequest struct {
	TenantID             uuid.UUID              `json:"tenant_id" binding:"required"`
	PlanID               *uuid.UUID             `json:"plan_id"`
	OrderID              *uuid.UUID             `json:"order_id"`
	SubscriptionName     string                 `json:"subscription_name" binding:"required"`
	StartDate            string                 `json:"start_date" binding:"required"`
	EndDate              string                 `json:"end_date" binding:"required"`
	TrialEndDate         *string                `json:"trial_end_date"`
	IsTrial              bool                   `json:"is_trial"`
	PlanName             *string                `json:"plan_name"`
	BillingCycle         string                 `json:"billing_cycle"`
	BasePrice            float64                `json:"base_price"`
	DiscountAmount       float64                `json:"discount_amount"`
	TaxAmount            float64                `json:"tax_amount"`
	TotalAmount          float64                `json:"total_amount"`
	Currency             string                 `json:"currency"`
	MaxUsers             int                    `json:"max_users"`
	MaxStorageGB         int                    `json:"max_storage_gb"`
	Features             []interface{}          `json:"features"`
	Limits               map[string]interface{} `json:"limits"`
	PaymentMethod        *string                `json:"payment_method"`
	BillingContactName   *string                `json:"billing_contact_name"`
	BillingContactEmail  *string                `json:"billing_contact_email"`
	BillingContactPhone  *string                `json:"billing_contact_phone"`
	Notes                *string                `json:"notes"`
	Metadata             map[string]interface{} `json:"metadata"`
	Tags                 []string               `json:"tags"`
	CreatedBy            uuid.UUID              `json:"-"`
}

type UpdateTenantSubscriptionRequest struct {
	SubscriptionName    *string                `json:"subscription_name"`
	Status              *string                `json:"status"`
	AutoRenew           *bool                  `json:"auto_renew"`
	MaxUsers            *int                   `json:"max_users"`
	MaxStorageGB        *int                   `json:"max_storage_gb"`
	Features            []interface{}          `json:"features"`
	Limits              map[string]interface{} `json:"limits"`
	PaymentMethod       *string                `json:"payment_method"`
	BillingContactName  *string                `json:"billing_contact_name"`
	BillingContactEmail *string                `json:"billing_contact_email"`
	BillingContactPhone *string                `json:"billing_contact_phone"`
	Notes               *string                `json:"notes"`
	Metadata            map[string]interface{} `json:"metadata"`
	Tags                []string               `json:"tags"`
	UpdatedBy           uuid.UUID              `json:"-"`
}

// GetByID gets subscription by ID
func (s *TenantSubscriptionService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantSubscription, error) {
	return s.subscriptionRepo.GetByID(ctx, id)
}

// GetActiveSubscription gets active subscription for tenant
func (s *TenantSubscriptionService) GetActiveSubscription(ctx context.Context, tenantID uuid.UUID) (*models.TenantSubscription, error) {
	return s.subscriptionRepo.GetActive(ctx, tenantID)
}

// ListByTenant lists subscriptions by tenant
func (s *TenantSubscriptionService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, page, limit int) ([]*models.TenantSubscription, int64, error) {
	offset := (page - 1) * limit
	return s.subscriptionRepo.ListByTenant(ctx, tenantID, status, limit, offset)
}

// CreateSubscription creates a new subscription
func (s *TenantSubscriptionService) CreateSubscription(ctx context.Context, req CreateTenantSubscriptionRequest) (*models.TenantSubscription, error) {
	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start_date format: %w", err)
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end_date format: %w", err)
	}

	var trialEndDate *time.Time
	if req.TrialEndDate != nil && *req.TrialEndDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.TrialEndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid trial_end_date format: %w", err)
		}
		trialEndDate = &parsed
	}

	// Generate subscription number
	subscriptionNumber := s.generateSubscriptionNumber()

	billingCycle := req.BillingCycle
	if billingCycle == "" {
		billingCycle = "monthly"
	}

	currency := req.Currency
	if currency == "" {
		currency = "USD"
	}

	features := req.Features
	if features == nil {
		features = []interface{}{}
	}

	limits := req.Limits
	if limits == nil {
		limits = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	status := "pending"
	if req.IsTrial {
		status = "trial"
	}

	subscription := &models.TenantSubscription{
		ID:                  uuid.New(),
		TenantID:            req.TenantID,
		PlanID:              req.PlanID,
		OrderID:             req.OrderID,
		SubscriptionNumber:  subscriptionNumber,
		SubscriptionName:    req.SubscriptionName,
		StartDate:           startDate,
		EndDate:             endDate,
		TrialEndDate:        trialEndDate,
		Status:              status,
		AutoRenew:           true,
		IsTrial:             req.IsTrial,
		PlanName:            req.PlanName,
		BillingCycle:        billingCycle,
		BasePrice:           req.BasePrice,
		DiscountAmount:      req.DiscountAmount,
		TaxAmount:           req.TaxAmount,
		TotalAmount:         req.TotalAmount,
		Currency:            currency,
		MaxUsers:            req.MaxUsers,
		CurrentUsers:        0,
		MaxStorageGB:        req.MaxStorageGB,
		CurrentStorageGB:    0,
		Features:            features,
		Limits:              limits,
		PaymentMethod:       req.PaymentMethod,
		PaymentStatus:       "unpaid",
		BillingContactName:  req.BillingContactName,
		BillingContactEmail: req.BillingContactEmail,
		BillingContactPhone: req.BillingContactPhone,
		Notes:               req.Notes,
		Metadata:            metadata,
		Tags:                req.Tags,
		CreatedAt:           time.Now(),
		CreatedBy:           &req.CreatedBy,
		UpdatedAt:           time.Now(),
		Version:             1,
	}

	if err := s.subscriptionRepo.Create(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	return subscription, nil
}

// UpdateSubscription updates a subscription
func (s *TenantSubscriptionService) UpdateSubscription(ctx context.Context, id uuid.UUID, req UpdateTenantSubscriptionRequest) (*models.TenantSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	if req.SubscriptionName != nil {
		subscription.SubscriptionName = *req.SubscriptionName
	}
	if req.Status != nil {
		subscription.Status = *req.Status
	}
	if req.AutoRenew != nil {
		subscription.AutoRenew = *req.AutoRenew
	}
	if req.MaxUsers != nil {
		subscription.MaxUsers = *req.MaxUsers
	}
	if req.MaxStorageGB != nil {
		subscription.MaxStorageGB = *req.MaxStorageGB
	}
	if req.Features != nil {
		subscription.Features = req.Features
	}
	if req.Limits != nil {
		subscription.Limits = req.Limits
	}
	if req.PaymentMethod != nil {
		subscription.PaymentMethod = req.PaymentMethod
	}
	if req.BillingContactName != nil {
		subscription.BillingContactName = req.BillingContactName
	}
	if req.BillingContactEmail != nil {
		subscription.BillingContactEmail = req.BillingContactEmail
	}
	if req.BillingContactPhone != nil {
		subscription.BillingContactPhone = req.BillingContactPhone
	}
	if req.Notes != nil {
		subscription.Notes = req.Notes
	}
	if req.Metadata != nil {
		subscription.Metadata = req.Metadata
	}
	if req.Tags != nil {
		subscription.Tags = req.Tags
	}

	subscription.UpdatedAt = time.Now()
	subscription.UpdatedBy = &req.UpdatedBy
	subscription.Version++

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to update subscription: %w", err)
	}

	return subscription, nil
}

// CancelSubscription cancels a subscription
func (s *TenantSubscriptionService) CancelSubscription(ctx context.Context, id uuid.UUID) (*models.TenantSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	subscription.Status = "cancelled"
	subscription.AutoRenew = false
	subscription.UpdatedAt = time.Now()
	subscription.Version++

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to cancel subscription: %w", err)
	}

	return subscription, nil
}

// RenewSubscription renews a subscription
func (s *TenantSubscriptionService) RenewSubscription(ctx context.Context, id uuid.UUID) (*models.TenantSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	// Calculate new end date based on billing cycle
	newEndDate := s.calculateNewEndDate(subscription.EndDate, subscription.BillingCycle)

	subscription.StartDate = subscription.EndDate
	subscription.EndDate = newEndDate
	subscription.RenewalDate = &newEndDate
	subscription.Status = "active"
	subscription.IsTrial = false
	subscription.UpdatedAt = time.Now()
	subscription.Version++

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to renew subscription: %w", err)
	}

	return subscription, nil
}

// SuspendSubscription suspends a subscription
func (s *TenantSubscriptionService) SuspendSubscription(ctx context.Context, id uuid.UUID) (*models.TenantSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	subscription.Status = "suspended"
	subscription.UpdatedAt = time.Now()
	subscription.Version++

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to suspend subscription: %w", err)
	}

	return subscription, nil
}

// ReactivateSubscription reactivates a subscription
func (s *TenantSubscriptionService) ReactivateSubscription(ctx context.Context, id uuid.UUID) (*models.TenantSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	if subscription.Status != "suspended" {
		return nil, fmt.Errorf("can only reactivate suspended subscriptions")
	}

	subscription.Status = "active"
	subscription.UpdatedAt = time.Now()
	subscription.Version++

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to reactivate subscription: %w", err)
	}

	return subscription, nil
}

// UpdateUsage updates subscription usage
func (s *TenantSubscriptionService) UpdateUsage(ctx context.Context, id uuid.UUID, currentUsers *int, currentStorageGB *float64) (*models.TenantSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	if currentUsers != nil {
		subscription.CurrentUsers = *currentUsers
	}
	if currentStorageGB != nil {
		subscription.CurrentStorageGB = *currentStorageGB
	}

	subscription.UpdatedAt = time.Now()

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to update usage: %w", err)
	}

	return subscription, nil
}

// Helper functions
func (s *TenantSubscriptionService) generateSubscriptionNumber() string {
	return fmt.Sprintf("SUB-%d", time.Now().Unix())
}

func (s *TenantSubscriptionService) calculateNewEndDate(currentEnd time.Time, billingCycle string) time.Time {
	switch billingCycle {
	case "monthly":
		return currentEnd.AddDate(0, 1, 0)
	case "quarterly":
		return currentEnd.AddDate(0, 3, 0)
	case "yearly":
		return currentEnd.AddDate(1, 0, 0)
	default:
		return currentEnd.AddDate(0, 1, 0)
	}
}
