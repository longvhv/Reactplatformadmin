package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type TenantServiceDeliveryRepository interface {
	Create(ctx context.Context, delivery *models.TenantServiceDelivery) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TenantServiceDelivery, error)
	List(ctx context.Context, page, pageSize int, tenantID, productID *uuid.UUID, status *string) ([]*models.TenantServiceDelivery, int, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantServiceDelivery, error)
	ListBySubscription(ctx context.Context, subscriptionID uuid.UUID) ([]*models.TenantServiceDelivery, error)
	Update(ctx context.Context, delivery *models.TenantServiceDelivery) error
	UpdateProgress(ctx context.Context, id uuid.UUID, deliveredUnits float64) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type tenantServiceDeliveryRepository struct {
	db *sqlx.DB
}

func NewTenantServiceDeliveryRepository(db *sqlx.DB) TenantServiceDeliveryRepository {
	return &tenantServiceDeliveryRepository{db: db}
}

func (r *tenantServiceDeliveryRepository) Create(ctx context.Context, delivery *models.TenantServiceDelivery) error {
	query := `
		INSERT INTO tenant_service_deliveries (
			_id, tenant_id, product_id, subscription_id, unit_type,
			total_units, delivered_units, unit_price, currency_code,
			status, service_metadata, created_at, updated_at, version
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	_, err := r.db.ExecContext(ctx, query,
		delivery.ID, delivery.TenantID, delivery.ProductID, delivery.SubscriptionID,
		delivery.UnitType, delivery.TotalUnits, delivery.DeliveredUnits,
		delivery.UnitPrice, delivery.CurrencyCode, delivery.Status,
		delivery.ServiceMetadata, delivery.CreatedAt, delivery.UpdatedAt, delivery.Version,
	)
	return err
}

func (r *tenantServiceDeliveryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantServiceDelivery, error) {
	var delivery models.TenantServiceDelivery
	query := `SELECT * FROM tenant_service_deliveries WHERE _id = $1`
	err := r.db.GetContext(ctx, &delivery, query, id)
	if err != nil {
		return nil, err
	}
	return &delivery, nil
}

func (r *tenantServiceDeliveryRepository) List(ctx context.Context, page, pageSize int, tenantID, productID *uuid.UUID, status *string) ([]*models.TenantServiceDelivery, int, error) {
	offset := (page - 1) * pageSize
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}
	if productID != nil {
		whereClause += fmt.Sprintf(" AND product_id = $%d", argPos)
		args = append(args, *productID)
		argPos++
	}
	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tenant_service_deliveries %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM tenant_service_deliveries %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)
	args = append(args, pageSize, offset)

	var deliveries []*models.TenantServiceDelivery
	err = r.db.SelectContext(ctx, &deliveries, query, args...)
	return deliveries, total, err
}

func (r *tenantServiceDeliveryRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantServiceDelivery, error) {
	query := `SELECT * FROM tenant_service_deliveries WHERE tenant_id = $1 ORDER BY created_at DESC`
	var deliveries []*models.TenantServiceDelivery
	err := r.db.SelectContext(ctx, &deliveries, query, tenantID)
	return deliveries, err
}

func (r *tenantServiceDeliveryRepository) ListBySubscription(ctx context.Context, subscriptionID uuid.UUID) ([]*models.TenantServiceDelivery, error) {
	query := `SELECT * FROM tenant_service_deliveries WHERE subscription_id = $1 ORDER BY created_at DESC`
	var deliveries []*models.TenantServiceDelivery
	err := r.db.SelectContext(ctx, &deliveries, query, subscriptionID)
	return deliveries, err
}

func (r *tenantServiceDeliveryRepository) Update(ctx context.Context, delivery *models.TenantServiceDelivery) error {
	query := `
		UPDATE tenant_service_deliveries SET
			delivered_units = $1, status = $2, service_metadata = $3,
			updated_at = $4, version = version + 1
		WHERE _id = $5`

	delivery.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query,
		delivery.DeliveredUnits, delivery.Status, delivery.ServiceMetadata,
		delivery.UpdatedAt, delivery.ID,
	)
	return err
}

func (r *tenantServiceDeliveryRepository) UpdateProgress(ctx context.Context, id uuid.UUID, deliveredUnits float64) error {
	query := `
		UPDATE tenant_service_deliveries SET
			delivered_units = $1,
			status = CASE
				WHEN $1 >= total_units THEN 'COMPLETED'
				WHEN $1 > 0 THEN 'IN_PROGRESS'
				ELSE status
			END,
			updated_at = $2,
			version = version + 1
		WHERE _id = $3`

	_, err := r.db.ExecContext(ctx, query, deliveredUnits, time.Now(), id)
	return err
}

func (r *tenantServiceDeliveryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tenant_service_deliveries WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
