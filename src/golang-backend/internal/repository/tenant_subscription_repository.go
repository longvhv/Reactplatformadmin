package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yourusername/golang-backend/internal/models"
)

type TenantSubscriptionRepository struct {
	db *sql.DB
}

func NewTenantSubscriptionRepository(db *sql.DB) *TenantSubscriptionRepository {
	return &TenantSubscriptionRepository{db: db}
}

func (r *TenantSubscriptionRepository) Create(req *models.CreateTenantSubscriptionRequest) (*models.TenantSubscription, error) {
	query := `
		INSERT INTO tenant_subscriptions (
			tenant_id, plan_id, order_id, subscription_number, subscription_name,
			start_date, end_date, trial_end_date, renewal_date, status,
			auto_renew, is_trial, plan_name, billing_cycle, base_price,
			discount_amount, tax_amount, total_amount, currency, max_users,
			max_storage_gb, features, limits, payment_method, payment_status,
			billing_contact_name, billing_contact_email, billing_contact_phone,
			notes, metadata, tags
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
		) RETURNING _id, created_at, updated_at, version
	`

	subscription := &models.TenantSubscription{
		TenantID:            req.TenantID,
		PlanID:              req.PlanID,
		OrderID:             req.OrderID,
		SubscriptionNumber:  req.SubscriptionNumber,
		SubscriptionName:    req.SubscriptionName,
		StartDate:           req.StartDate,
		EndDate:             req.EndDate,
		TrialEndDate:        req.TrialEndDate,
		RenewalDate:         req.RenewalDate,
		Status:              req.Status,
		AutoRenew:           req.AutoRenew,
		IsTrial:             req.IsTrial,
		PlanName:            req.PlanName,
		BillingCycle:        req.BillingCycle,
		BasePrice:           req.BasePrice,
		DiscountAmount:      req.DiscountAmount,
		TaxAmount:           req.TaxAmount,
		TotalAmount:         req.TotalAmount,
		Currency:            req.Currency,
		MaxUsers:            req.MaxUsers,
		MaxStorageGB:        req.MaxStorageGB,
		Features:            req.Features,
		Limits:              req.Limits,
		PaymentMethod:       req.PaymentMethod,
		PaymentStatus:       req.PaymentStatus,
		BillingContactName:  req.BillingContactName,
		BillingContactEmail: req.BillingContactEmail,
		BillingContactPhone: req.BillingContactPhone,
		Notes:               req.Notes,
		Metadata:            req.Metadata,
		Tags:                req.Tags,
	}

	err := r.db.QueryRow(
		query,
		subscription.TenantID, subscription.PlanID, subscription.OrderID,
		subscription.SubscriptionNumber, subscription.SubscriptionName,
		subscription.StartDate, subscription.EndDate, subscription.TrialEndDate,
		subscription.RenewalDate, subscription.Status, subscription.AutoRenew,
		subscription.IsTrial, subscription.PlanName, subscription.BillingCycle,
		subscription.BasePrice, subscription.DiscountAmount, subscription.TaxAmount,
		subscription.TotalAmount, subscription.Currency, subscription.MaxUsers,
		subscription.MaxStorageGB, subscription.Features, subscription.Limits,
		subscription.PaymentMethod, subscription.PaymentStatus,
		subscription.BillingContactName, subscription.BillingContactEmail,
		subscription.BillingContactPhone, subscription.Notes, subscription.Metadata,
		subscription.Tags,
	).Scan(&subscription.ID, &subscription.CreatedAt, &subscription.UpdatedAt, &subscription.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create tenant subscription: %w", err)
	}

	return subscription, nil
}

func (r *TenantSubscriptionRepository) GetByID(id string) (*models.TenantSubscription, error) {
	query := `
		SELECT _id, tenant_id, plan_id, order_id, subscription_number, subscription_name,
			start_date, end_date, trial_end_date, renewal_date, status,
			auto_renew, is_trial, plan_name, billing_cycle, base_price,
			discount_amount, tax_amount, total_amount, currency, max_users,
			current_users, max_storage_gb, current_storage_gb, features, limits,
			payment_method, payment_status, last_payment_date, next_payment_date,
			billing_contact_name, billing_contact_email, billing_contact_phone,
			notes, metadata, tags, created_at, created_by, updated_at, updated_by,
			deleted_at, deleted_by, version
		FROM tenant_subscriptions
		WHERE _id = $1 AND deleted_at IS NULL
	`

	subscription := &models.TenantSubscription{}
	err := r.db.QueryRow(query, id).Scan(
		&subscription.ID, &subscription.TenantID, &subscription.PlanID,
		&subscription.OrderID, &subscription.SubscriptionNumber, &subscription.SubscriptionName,
		&subscription.StartDate, &subscription.EndDate, &subscription.TrialEndDate,
		&subscription.RenewalDate, &subscription.Status, &subscription.AutoRenew,
		&subscription.IsTrial, &subscription.PlanName, &subscription.BillingCycle,
		&subscription.BasePrice, &subscription.DiscountAmount, &subscription.TaxAmount,
		&subscription.TotalAmount, &subscription.Currency, &subscription.MaxUsers,
		&subscription.CurrentUsers, &subscription.MaxStorageGB, &subscription.CurrentStorageGB,
		&subscription.Features, &subscription.Limits, &subscription.PaymentMethod,
		&subscription.PaymentStatus, &subscription.LastPaymentDate, &subscription.NextPaymentDate,
		&subscription.BillingContactName, &subscription.BillingContactEmail,
		&subscription.BillingContactPhone, &subscription.Notes, &subscription.Metadata,
		&subscription.Tags, &subscription.CreatedAt, &subscription.CreatedBy,
		&subscription.UpdatedAt, &subscription.UpdatedBy, &subscription.DeletedAt,
		&subscription.DeletedBy, &subscription.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant subscription not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant subscription: %w", err)
	}

	return subscription, nil
}

func (r *TenantSubscriptionRepository) List(tenantID *string, status *string, limit, offset int) ([]*models.TenantSubscription, int, error) {
	conditions := []string{"deleted_at IS NULL"}
	args := []interface{}{}
	argIndex := 1

	if tenantID != nil {
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argIndex))
		args = append(args, *tenantID)
		argIndex++
	}

	if status != nil {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *status)
		argIndex++
	}

	whereClause := strings.Join(conditions, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_subscriptions WHERE %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count subscriptions: %w", err)
	}

	// Get subscriptions
	query := fmt.Sprintf(`
		SELECT _id, tenant_id, plan_id, order_id, subscription_number, subscription_name,
			start_date, end_date, trial_end_date, renewal_date, status,
			auto_renew, is_trial, plan_name, billing_cycle, base_price,
			discount_amount, tax_amount, total_amount, currency, max_users,
			current_users, max_storage_gb, current_storage_gb, features, limits,
			payment_method, payment_status, last_payment_date, next_payment_date,
			billing_contact_name, billing_contact_email, billing_contact_phone,
			notes, metadata, tags, created_at, created_by, updated_at, updated_by,
			deleted_at, deleted_by, version
		FROM tenant_subscriptions
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list subscriptions: %w", err)
	}
	defer rows.Close()

	subscriptions := []*models.TenantSubscription{}
	for rows.Next() {
		subscription := &models.TenantSubscription{}
		err := rows.Scan(
			&subscription.ID, &subscription.TenantID, &subscription.PlanID,
			&subscription.OrderID, &subscription.SubscriptionNumber, &subscription.SubscriptionName,
			&subscription.StartDate, &subscription.EndDate, &subscription.TrialEndDate,
			&subscription.RenewalDate, &subscription.Status, &subscription.AutoRenew,
			&subscription.IsTrial, &subscription.PlanName, &subscription.BillingCycle,
			&subscription.BasePrice, &subscription.DiscountAmount, &subscription.TaxAmount,
			&subscription.TotalAmount, &subscription.Currency, &subscription.MaxUsers,
			&subscription.CurrentUsers, &subscription.MaxStorageGB, &subscription.CurrentStorageGB,
			&subscription.Features, &subscription.Limits, &subscription.PaymentMethod,
			&subscription.PaymentStatus, &subscription.LastPaymentDate, &subscription.NextPaymentDate,
			&subscription.BillingContactName, &subscription.BillingContactEmail,
			&subscription.BillingContactPhone, &subscription.Notes, &subscription.Metadata,
			&subscription.Tags, &subscription.CreatedAt, &subscription.CreatedBy,
			&subscription.UpdatedAt, &subscription.UpdatedBy, &subscription.DeletedAt,
			&subscription.DeletedBy, &subscription.Version,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan subscription: %w", err)
		}
		subscriptions = append(subscriptions, subscription)
	}

	return subscriptions, total, nil
}

func (r *TenantSubscriptionRepository) Update(id string, req *models.UpdateTenantSubscriptionRequest) (*models.TenantSubscription, error) {
	sets := []string{"updated_at = CURRENT_TIMESTAMP", "version = version + 1"}
	args := []interface{}{}
	argIndex := 1

	if req.SubscriptionName != nil {
		sets = append(sets, fmt.Sprintf("subscription_name = $%d", argIndex))
		args = append(args, *req.SubscriptionName)
		argIndex++
	}
	if req.StartDate != nil {
		sets = append(sets, fmt.Sprintf("start_date = $%d", argIndex))
		args = append(args, *req.StartDate)
		argIndex++
	}
	if req.EndDate != nil {
		sets = append(sets, fmt.Sprintf("end_date = $%d", argIndex))
		args = append(args, *req.EndDate)
		argIndex++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}
	if req.AutoRenew != nil {
		sets = append(sets, fmt.Sprintf("auto_renew = $%d", argIndex))
		args = append(args, *req.AutoRenew)
		argIndex++
	}
	if req.PaymentStatus != nil {
		sets = append(sets, fmt.Sprintf("payment_status = $%d", argIndex))
		args = append(args, *req.PaymentStatus)
		argIndex++
	}
	if req.CurrentUsers != nil {
		sets = append(sets, fmt.Sprintf("current_users = $%d", argIndex))
		args = append(args, *req.CurrentUsers)
		argIndex++
	}
	if req.CurrentStorageGB != nil {
		sets = append(sets, fmt.Sprintf("current_storage_gb = $%d", argIndex))
		args = append(args, *req.CurrentStorageGB)
		argIndex++
	}
	if req.Metadata != nil {
		sets = append(sets, fmt.Sprintf("metadata = $%d", argIndex))
		args = append(args, req.Metadata)
		argIndex++
	}

	if len(sets) == 2 { // Only updated_at and version
		return r.GetByID(id)
	}

	query := fmt.Sprintf(`
		UPDATE tenant_subscriptions
		SET %s
		WHERE _id = $%d AND deleted_at IS NULL
	`, strings.Join(sets, ", "), argIndex)

	args = append(args, id)
	_, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update subscription: %w", err)
	}

	return r.GetByID(id)
}

func (r *TenantSubscriptionRepository) Delete(id string) error {
	query := `
		UPDATE tenant_subscriptions
		SET deleted_at = CURRENT_TIMESTAMP
		WHERE _id = $1 AND deleted_at IS NULL
	`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete subscription: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("subscription not found")
	}

	return nil
}
