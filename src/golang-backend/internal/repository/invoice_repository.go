package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/vhv-platform/backend/internal/models"
)

type InvoiceRepository struct {
	db *sql.DB
}

func NewInvoiceRepository(db *sql.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

func (r *InvoiceRepository) GetAll(ctx context.Context, filters models.InvoiceFilters) ([]models.Invoice, error) {
	query := `
		SELECT _id, tenant_id, subscription_id, order_id, invoice_number, status,
		       currency_code, subtotal, tax_amount, discount_amount, total_amount,
		       amount_paid, amount_due, billing_info, items_snapshot, tax_breakdown,
		       billing_period_start, billing_period_end, due_date, paid_at,
		       metadata, price_adjustments, pdf_url,
		       created_at, updated_at, version
		FROM subscription_invoices
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argIndex := 1

	if filters.TenantID != nil {
		query += fmt.Sprintf(" AND tenant_id = $%d", argIndex)
		args = append(args, *filters.TenantID)
		argIndex++
	}

	if filters.SubscriptionID != nil {
		query += fmt.Sprintf(" AND subscription_id = $%d", argIndex)
		args = append(args, *filters.SubscriptionID)
		argIndex++
	}

	if filters.OrderID != nil {
		query += fmt.Sprintf(" AND order_id = $%d", argIndex)
		args = append(args, *filters.OrderID)
		argIndex++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, *filters.Status)
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		query += fmt.Sprintf(" AND invoice_number ILIKE $%d", argIndex)
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

	if filters.Overdue != nil && *filters.Overdue {
		query += fmt.Sprintf(" AND due_date < $%d AND status != 'PAID' AND status != 'VOID'", argIndex)
		args = append(args, time.Now())
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query invoices: %w", err)
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		invoice, err := r.scanInvoice(rows)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, *invoice)
	}

	return invoices, rows.Err()
}

func (r *InvoiceRepository) GetByID(ctx context.Context, id string) (*models.Invoice, error) {
	query := `
		SELECT _id, tenant_id, subscription_id, order_id, invoice_number, status,
		       currency_code, subtotal, tax_amount, discount_amount, total_amount,
		       amount_paid, amount_due, billing_info, items_snapshot, tax_breakdown,
		       billing_period_start, billing_period_end, due_date, paid_at,
		       metadata, price_adjustments, pdf_url,
		       created_at, updated_at, version
		FROM subscription_invoices
		WHERE _id = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, id)
	return r.scanInvoiceRow(row)
}

func (r *InvoiceRepository) GetByInvoiceNumber(ctx context.Context, invoiceNumber string) (*models.Invoice, error) {
	query := `
		SELECT _id, tenant_id, subscription_id, order_id, invoice_number, status,
		       currency_code, subtotal, tax_amount, discount_amount, total_amount,
		       amount_paid, amount_due, billing_info, items_snapshot, tax_breakdown,
		       billing_period_start, billing_period_end, due_date, paid_at,
		       metadata, price_adjustments, pdf_url,
		       created_at, updated_at, version
		FROM subscription_invoices
		WHERE invoice_number = $1 AND deleted_at IS NULL
	`
	row := r.db.QueryRowContext(ctx, query, invoiceNumber)
	invoice, err := r.scanInvoiceRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return invoice, err
}

func (r *InvoiceRepository) Create(ctx context.Context, req models.CreateInvoiceRequest) (*models.Invoice, error) {
	status := req.Status
	if status == "" {
		status = models.InvoiceStatusDraft
	}

	billingJSON, _ := json.Marshal(req.BillingInfo)
	itemsJSON, _ := json.Marshal(req.ItemsSnapshot)
	taxJSON, _ := json.Marshal(req.TaxBreakdown)
	metadataJSON, _ := json.Marshal(req.Metadata)
	adjustmentsJSON, _ := json.Marshal(req.PriceAdjustments)

	query := `
		INSERT INTO subscription_invoices (tenant_id, subscription_id, order_id, invoice_number,
		                                   status, currency_code, subtotal, tax_amount, discount_amount,
		                                   total_amount, billing_info, items_snapshot, tax_breakdown,
		                                   billing_period_start, billing_period_end, due_date,
		                                   metadata, price_adjustments, pdf_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		RETURNING _id, amount_paid, amount_due, created_at, updated_at, version
	`

	var invoice models.Invoice
	invoice.TenantID = req.TenantID
	invoice.SubscriptionID = req.SubscriptionID
	invoice.OrderID = req.OrderID
	invoice.InvoiceNumber = req.InvoiceNumber
	invoice.Status = status
	invoice.CurrencyCode = req.CurrencyCode
	invoice.Subtotal = req.Subtotal
	invoice.TaxAmount = req.TaxAmount
	invoice.DiscountAmount = req.DiscountAmount
	invoice.TotalAmount = req.TotalAmount
	invoice.BillingInfo = req.BillingInfo
	invoice.ItemsSnapshot = req.ItemsSnapshot
	invoice.TaxBreakdown = req.TaxBreakdown
	invoice.BillingPeriodStart = req.BillingPeriodStart
	invoice.BillingPeriodEnd = req.BillingPeriodEnd
	invoice.DueDate = req.DueDate
	invoice.Metadata = req.Metadata
	invoice.PriceAdjustments = req.PriceAdjustments
	invoice.PDFURL = req.PDFURL

	err := r.db.QueryRowContext(ctx, query,
		req.TenantID, req.SubscriptionID, req.OrderID, req.InvoiceNumber,
		status, req.CurrencyCode, req.Subtotal, req.TaxAmount, req.DiscountAmount,
		req.TotalAmount, billingJSON, itemsJSON, taxJSON,
		req.BillingPeriodStart, req.BillingPeriodEnd, req.DueDate,
		metadataJSON, adjustmentsJSON, req.PDFURL,
	).Scan(&invoice.ID, &invoice.AmountPaid, &invoice.AmountDue, &invoice.CreatedAt, &invoice.UpdatedAt, &invoice.Version)

	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return &invoice, nil
}

func (r *InvoiceRepository) Update(ctx context.Context, id string, req models.UpdateInvoiceRequest) (*models.Invoice, error) {
	sets := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.Subtotal != nil {
		sets = append(sets, fmt.Sprintf("subtotal = $%d", argIndex))
		args = append(args, *req.Subtotal)
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

	if req.TotalAmount != nil {
		sets = append(sets, fmt.Sprintf("total_amount = $%d", argIndex))
		args = append(args, *req.TotalAmount)
		argIndex++
	}

	if req.AmountPaid != nil {
		sets = append(sets, fmt.Sprintf("amount_paid = $%d", argIndex))
		args = append(args, *req.AmountPaid)
		argIndex++
	}

	if req.BillingInfo != nil {
		billingJSON, _ := json.Marshal(req.BillingInfo)
		sets = append(sets, fmt.Sprintf("billing_info = $%d", argIndex))
		args = append(args, billingJSON)
		argIndex++
	}

	if req.ItemsSnapshot != nil {
		itemsJSON, _ := json.Marshal(req.ItemsSnapshot)
		sets = append(sets, fmt.Sprintf("items_snapshot = $%d", argIndex))
		args = append(args, itemsJSON)
		argIndex++
	}

	if req.TaxBreakdown != nil {
		taxJSON, _ := json.Marshal(req.TaxBreakdown)
		sets = append(sets, fmt.Sprintf("tax_breakdown = $%d", argIndex))
		args = append(args, taxJSON)
		argIndex++
	}

	if req.DueDate != nil {
		sets = append(sets, fmt.Sprintf("due_date = $%d", argIndex))
		args = append(args, *req.DueDate)
		argIndex++
	}

	if req.PaidAt != nil {
		sets = append(sets, fmt.Sprintf("paid_at = $%d", argIndex))
		args = append(args, *req.PaidAt)
		argIndex++
	}

	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(req.Metadata)
		sets = append(sets, fmt.Sprintf("metadata = $%d", argIndex))
		args = append(args, metadataJSON)
		argIndex++
	}

	if req.PriceAdjustments != nil {
		adjustmentsJSON, _ := json.Marshal(req.PriceAdjustments)
		sets = append(sets, fmt.Sprintf("price_adjustments = $%d", argIndex))
		args = append(args, adjustmentsJSON)
		argIndex++
	}

	if req.PDFURL != nil {
		sets = append(sets, fmt.Sprintf("pdf_url = $%d", argIndex))
		args = append(args, *req.PDFURL)
		argIndex++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	sets = append(sets, "updated_at = NOW()", "version = version + 1")
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE subscription_invoices SET %s
		WHERE _id = $%d AND deleted_at IS NULL
		RETURNING _id, tenant_id, subscription_id, order_id, invoice_number, status,
		          currency_code, subtotal, tax_amount, discount_amount, total_amount,
		          amount_paid, amount_due, billing_info, items_snapshot, tax_breakdown,
		          billing_period_start, billing_period_end, due_date, paid_at,
		          metadata, price_adjustments, pdf_url,
		          created_at, updated_at, version
	`, strings.Join(sets, ", "), argIndex)

	row := r.db.QueryRowContext(ctx, query, args...)
	return r.scanInvoiceRow(row)
}

func (r *InvoiceRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE subscription_invoices SET deleted_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
	`, id)

	if err != nil {
		return fmt.Errorf("failed to delete invoice: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("invoice not found")
	}

	return nil
}

func (r *InvoiceRepository) scanInvoice(rows *sql.Rows) (*models.Invoice, error) {
	var invoice models.Invoice
	var billingJSON, itemsJSON, taxJSON, metadataJSON, adjustmentsJSON []byte

	err := rows.Scan(
		&invoice.ID, &invoice.TenantID, &invoice.SubscriptionID, &invoice.OrderID,
		&invoice.InvoiceNumber, &invoice.Status, &invoice.CurrencyCode,
		&invoice.Subtotal, &invoice.TaxAmount, &invoice.DiscountAmount,
		&invoice.TotalAmount, &invoice.AmountPaid, &invoice.AmountDue,
		&billingJSON, &itemsJSON, &taxJSON,
		&invoice.BillingPeriodStart, &invoice.BillingPeriodEnd,
		&invoice.DueDate, &invoice.PaidAt, &metadataJSON, &adjustmentsJSON,
		&invoice.PDFURL, &invoice.CreatedAt, &invoice.UpdatedAt, &invoice.Version,
	)
	if err != nil {
		return nil, err
	}

	if billingJSON != nil {
		json.Unmarshal(billingJSON, &invoice.BillingInfo)
	}
	if itemsJSON != nil {
		json.Unmarshal(itemsJSON, &invoice.ItemsSnapshot)
	}
	if taxJSON != nil {
		json.Unmarshal(taxJSON, &invoice.TaxBreakdown)
	}
	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &invoice.Metadata)
	}
	if adjustmentsJSON != nil {
		json.Unmarshal(adjustmentsJSON, &invoice.PriceAdjustments)
	}

	return &invoice, nil
}

func (r *InvoiceRepository) scanInvoiceRow(row *sql.Row) (*models.Invoice, error) {
	var invoice models.Invoice
	var billingJSON, itemsJSON, taxJSON, metadataJSON, adjustmentsJSON []byte

	err := row.Scan(
		&invoice.ID, &invoice.TenantID, &invoice.SubscriptionID, &invoice.OrderID,
		&invoice.InvoiceNumber, &invoice.Status, &invoice.CurrencyCode,
		&invoice.Subtotal, &invoice.TaxAmount, &invoice.DiscountAmount,
		&invoice.TotalAmount, &invoice.AmountPaid, &invoice.AmountDue,
		&billingJSON, &itemsJSON, &taxJSON,
		&invoice.BillingPeriodStart, &invoice.BillingPeriodEnd,
		&invoice.DueDate, &invoice.PaidAt, &metadataJSON, &adjustmentsJSON,
		&invoice.PDFURL, &invoice.CreatedAt, &invoice.UpdatedAt, &invoice.Version,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invoice not found")
	}
	if err != nil {
		return nil, err
	}

	if billingJSON != nil {
		json.Unmarshal(billingJSON, &invoice.BillingInfo)
	}
	if itemsJSON != nil {
		json.Unmarshal(itemsJSON, &invoice.ItemsSnapshot)
	}
	if taxJSON != nil {
		json.Unmarshal(taxJSON, &invoice.TaxBreakdown)
	}
	if metadataJSON != nil {
		json.Unmarshal(metadataJSON, &invoice.Metadata)
	}
	if adjustmentsJSON != nil {
		json.Unmarshal(adjustmentsJSON, &invoice.PriceAdjustments)
	}

	return &invoice, nil
}
