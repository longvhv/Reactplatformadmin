package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
)

type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) GetAll(ctx context.Context, filters models.OrderFilters) ([]models.Order, error) {
	query := `
		SELECT _id, tenant_id, created_by, order_number, po_number, type, status,
		       currency_code, subtotal_amount, tax_amount, discount_amount, credit_applied,
		       total_amount, items_snapshot, billing_info, payment_method, payment_ref_id,
		       created_at, updated_at, version
		FROM subscription_orders
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	if filters.TenantID != nil {
		query += fmt.Sprintf(" AND tenant_id = $%d", argIndex)
		args = append(args, *filters.TenantID)
		argIndex++
	}

	if filters.CreatedBy != nil {
		query += fmt.Sprintf(" AND created_by = $%d", argIndex)
		args = append(args, *filters.CreatedBy)
		argIndex++
	}

	if filters.Type != nil {
		query += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, *filters.Type)
		argIndex++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND (order_number ILIKE $%d OR po_number ILIKE $%d)", argIndex, argIndex)
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	if filters.StartDate != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", argIndex)
		args = append(args, *filters.StartDate)
		argIndex++
	}

	if filters.EndDate != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", argIndex)
		args = append(args, *filters.EndDate)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query orders: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		order, err := r.scanOrder(rows)
		if err != nil {
			return nil, err
		}
		orders = append(orders, *order)
	}

	return orders, rows.Err()
}

func (r *OrderRepository) GetByID(ctx context.Context, id string) (*models.Order, error) {
	query := `
		SELECT _id, tenant_id, created_by, order_number, po_number, type, status,
		       currency_code, subtotal_amount, tax_amount, discount_amount, credit_applied,
		       total_amount, items_snapshot, billing_info, payment_method, payment_ref_id,
		       created_at, updated_at, version
		FROM subscription_orders
		WHERE _id = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, id)
	return r.scanOrderRow(row)
}

func (r *OrderRepository) GetByOrderNumber(ctx context.Context, orderNumber string) (*models.Order, error) {
	query := `
		SELECT _id, tenant_id, created_by, order_number, po_number, type, status,
		       currency_code, subtotal_amount, tax_amount, discount_amount, credit_applied,
		       total_amount, items_snapshot, billing_info, payment_method, payment_ref_id,
		       created_at, updated_at, version
		FROM subscription_orders
		WHERE order_number = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, orderNumber)
	order, err := r.scanOrderRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return order, err
}

func (r *OrderRepository) Create(ctx context.Context, req models.CreateOrderRequest) (*models.Order, error) {
	status := req.Status
	if status == "" {
		status = models.OrderStatusPending
	}

	itemsJSON, _ := json.Marshal(req.ItemsSnapshot)
	billingJSON, _ := json.Marshal(req.BillingInfo)

	query := `
		INSERT INTO subscription_orders (tenant_id, created_by, order_number, po_number, type, status,
		                                currency_code, subtotal_amount, tax_amount, discount_amount,
		                                credit_applied, total_amount, items_snapshot, billing_info,
		                                payment_method, payment_ref_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING _id, created_at, updated_at, version
	`

	var order models.Order
	order.TenantID = req.TenantID
	order.CreatedBy = req.CreatedBy
	order.OrderNumber = req.OrderNumber
	order.PONumber = req.PONumber
	order.Type = req.Type
	order.Status = status
	order.CurrencyCode = req.CurrencyCode
	order.SubtotalAmount = req.SubtotalAmount
	order.TaxAmount = req.TaxAmount
	order.DiscountAmount = req.DiscountAmount
	order.CreditApplied = req.CreditApplied
	order.TotalAmount = req.TotalAmount
	order.ItemsSnapshot = req.ItemsSnapshot
	order.BillingInfo = req.BillingInfo
	order.PaymentMethod = req.PaymentMethod
	order.PaymentRefID = req.PaymentRefID

	err := r.db.QueryRowContext(ctx, query,
		req.TenantID, req.CreatedBy, req.OrderNumber, req.PONumber, req.Type, status,
		req.CurrencyCode, req.SubtotalAmount, req.TaxAmount, req.DiscountAmount,
		req.CreditApplied, req.TotalAmount, itemsJSON, billingJSON,
		req.PaymentMethod, req.PaymentRefID,
	).Scan(&order.ID, &order.CreatedAt, &order.UpdatedAt, &order.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return &order, nil
}

func (r *OrderRepository) Update(ctx context.Context, id string, req models.UpdateOrderRequest) (*models.Order, error) {
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.PONumber != nil {
		sets = append(sets, fmt.Sprintf("po_number = $%d", argIndex))
		args = append(args, *req.PONumber)
		argIndex++
	}

	if req.SubtotalAmount != nil {
		sets = append(sets, fmt.Sprintf("subtotal_amount = $%d", argIndex))
		args = append(args, *req.SubtotalAmount)
		argIndex++
	}

	if req.TaxAmount != nil {
		sets = append(sets, fmt.Sprintf("tax_amount = $%d", argIndex))
		args = append(args, *req.TaxAmount)
		argIndex++
	}

	if req.DiscountAmount != nil {
		sets = append(sets, fmt.Sprintf("discount_amount = $%d", argIndex))
		args = append(args, *req.DiscountAmount)
		argIndex++
	}

	if req.CreditApplied != nil {
		sets = append(sets, fmt.Sprintf("credit_applied = $%d", argIndex))
		args = append(args, *req.CreditApplied)
		argIndex++
	}

	if req.TotalAmount != nil {
		sets = append(sets, fmt.Sprintf("total_amount = $%d", argIndex))
		args = append(args, *req.TotalAmount)
		argIndex++
	}

	if req.ItemsSnapshot != nil {
		itemsJSON, _ := json.Marshal(req.ItemsSnapshot)
		sets = append(sets, fmt.Sprintf("items_snapshot = $%d", argIndex))
		args = append(args, itemsJSON)
		argIndex++
	}

	if req.BillingInfo != nil {
		billingJSON, _ := json.Marshal(req.BillingInfo)
		sets = append(sets, fmt.Sprintf("billing_info = $%d", argIndex))
		args = append(args, billingJSON)
		argIndex++
	}

	if req.PaymentMethod != nil {
		sets = append(sets, fmt.Sprintf("payment_method = $%d", argIndex))
		args = append(args, *req.PaymentMethod)
		argIndex++
	}

	if req.PaymentRefID != nil {
		sets = append(sets, fmt.Sprintf("payment_ref_id = $%d", argIndex))
		args = append(args, *req.PaymentRefID)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	sets = append(sets, "updated_at = NOW()", "version = version + 1")
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE subscription_orders SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, tenant_id, created_by, order_number, po_number, type, status,
		          currency_code, subtotal_amount, tax_amount, discount_amount, credit_applied,
		          total_amount, items_snapshot, billing_info, payment_method, payment_ref_id,
		          created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	row := r.db.QueryRowContext(ctx, query, args...)
	return r.scanOrderRow(row)
}

func (r *OrderRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE subscription_orders SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, id)

	if err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

func (r *OrderRepository) scanOrder(rows *sql.Rows) (*models.Order, error) {
	var order models.Order
	var itemsJSON, billingJSON []byte

	err := rows.Scan(
		&order.ID, &order.TenantID, &order.CreatedBy, &order.OrderNumber, &order.PONumber,
		&order.Type, &order.Status, &order.CurrencyCode, &order.SubtotalAmount,
		&order.TaxAmount, &order.DiscountAmount, &order.CreditApplied, &order.TotalAmount,
		&itemsJSON, &billingJSON, &order.PaymentMethod, &order.PaymentRefID,
		&order.CreatedAt, &order.UpdatedAt, &order.Version,
	)
	if err != nil {
		return nil, err
	}

	if itemsJSON != nil {
		json.Unmarshal(itemsJSON, &order.ItemsSnapshot)
	}
	if billingJSON != nil {
		json.Unmarshal(billingJSON, &order.BillingInfo)
	}

	return &order, nil
}

func (r *OrderRepository) scanOrderRow(row *sql.Row) (*models.Order, error) {
	var order models.Order
	var itemsJSON, billingJSON []byte

	err := row.Scan(
		&order.ID, &order.TenantID, &order.CreatedBy, &order.OrderNumber, &order.PONumber,
		&order.Type, &order.Status, &order.CurrencyCode, &order.SubtotalAmount,
		&order.TaxAmount, &order.DiscountAmount, &order.CreditApplied, &order.TotalAmount,
		&itemsJSON, &billingJSON, &order.PaymentMethod, &order.PaymentRefID,
		&order.CreatedAt, &order.UpdatedAt, &order.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, err
	}

	if itemsJSON != nil {
		json.Unmarshal(itemsJSON, &order.ItemsSnapshot)
	}
	if billingJSON != nil {
		json.Unmarshal(billingJSON, &order.BillingInfo)
	}

	return &order, nil
}
