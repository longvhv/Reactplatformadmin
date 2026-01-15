package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// PRODUCT INVENTORY - Stock & Warehouse Management
// ============================================================================
// Purpose: Track product inventory across warehouses
// Table: product_inventory
// Primary Key: _id (UUID)
// Features: Multi-warehouse, Low stock alerts, Batch tracking
// ============================================================================

// InventoryStatus represents the inventory status
type InventoryStatus string

const (
	InventoryStatusInStock    InventoryStatus = "IN_STOCK"
	InventoryStatusLowStock   InventoryStatus = "LOW_STOCK"
	InventoryStatusOutOfStock InventoryStatus = "OUT_OF_STOCK"
	InventoryStatusBackorder  InventoryStatus = "BACKORDER"
	InventoryStatusDiscontinued InventoryStatus = "DISCONTINUED"
)

type ProductInventory struct {
	// Identity (3 fields)
	ID          uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID   uuid.UUID  `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	VariantID   *uuid.UUID `gorm:"column:variant_id;type:uuid;index" json:"variant_id,omitempty"`
	WarehouseID *uuid.UUID `gorm:"column:warehouse_id;type:uuid;index" json:"warehouse_id,omitempty"`

	// Stock Levels (5 fields)
	QuantityOnHand      int `gorm:"column:quantity_on_hand;default:0;not null" json:"quantity_on_hand"`
	QuantityReserved    int `gorm:"column:quantity_reserved;default:0" json:"quantity_reserved"`
	QuantityAvailable   int `gorm:"column:quantity_available;default:0" json:"quantity_available"`
	ReorderPoint        int `gorm:"column:reorder_point;default:10" json:"reorder_point"`
	ReorderQuantity     int `gorm:"column:reorder_quantity;default:50" json:"reorder_quantity"`

	// Status (2 fields)
	Status            InventoryStatus `gorm:"column:status;type:varchar(20);default:'IN_STOCK'" json:"status"`
	AllowBackorder    bool            `gorm:"column:allow_backorder;default:false" json:"allow_backorder"`

	// Tracking (3 fields)
	LastStockCheck    *time.Time `gorm:"column:last_stock_check" json:"last_stock_check,omitempty"`
	LastRestockedAt   *time.Time `gorm:"column:last_restocked_at" json:"last_restocked_at,omitempty"`
	NextRestockDate   *time.Time `gorm:"column:next_restock_date" json:"next_restock_date,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Product   *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Variant   *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
	Warehouse *Warehouse      `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
}

func (ProductInventory) TableName() string {
	return "product_inventory"
}

// CalculateAvailable calculates available quantity
func (pi *ProductInventory) CalculateAvailable() {
	pi.QuantityAvailable = pi.QuantityOnHand - pi.QuantityReserved
	if pi.QuantityAvailable < 0 {
		pi.QuantityAvailable = 0
	}
}

// UpdateStatus updates the inventory status based on quantity
func (pi *ProductInventory) UpdateStatus() {
	if pi.QuantityAvailable <= 0 {
		if pi.AllowBackorder {
			pi.Status = InventoryStatusBackorder
		} else {
			pi.Status = InventoryStatusOutOfStock
		}
	} else if pi.QuantityAvailable <= pi.ReorderPoint {
		pi.Status = InventoryStatusLowStock
	} else {
		pi.Status = InventoryStatusInStock
	}
}

// IsAvailable checks if product is available
func (pi *ProductInventory) IsAvailable() bool {
	return pi.QuantityAvailable > 0 || (pi.QuantityAvailable <= 0 && pi.AllowBackorder)
}

// NeedsReorder checks if reorder is needed
func (pi *ProductInventory) NeedsReorder() bool {
	return pi.QuantityAvailable <= pi.ReorderPoint
}

// Reserve reserves quantity for an order
func (pi *ProductInventory) Reserve(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	if pi.QuantityAvailable < quantity && !pi.AllowBackorder {
		return fmt.Errorf("insufficient quantity: available=%d, requested=%d", 
			pi.QuantityAvailable, quantity)
	}

	pi.QuantityReserved += quantity
	pi.CalculateAvailable()
	pi.UpdateStatus()
	return nil
}

// Release releases reserved quantity
func (pi *ProductInventory) Release(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	if pi.QuantityReserved < quantity {
		return errors.New("cannot release more than reserved")
	}

	pi.QuantityReserved -= quantity
	pi.CalculateAvailable()
	pi.UpdateStatus()
	return nil
}

// Deduct deducts quantity from stock (after order fulfillment)
func (pi *ProductInventory) Deduct(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}

	pi.QuantityOnHand -= quantity
	pi.QuantityReserved -= quantity
	if pi.QuantityOnHand < 0 {
		pi.QuantityOnHand = 0
	}
	if pi.QuantityReserved < 0 {
		pi.QuantityReserved = 0
	}

	pi.CalculateAvailable()
	pi.UpdateStatus()
	return nil
}

// Restock adds quantity to stock
func (pi *ProductInventory) Restock(quantity int) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}

	pi.QuantityOnHand += quantity
	now := time.Now()
	pi.LastRestockedAt = &now
	pi.CalculateAvailable()
	pi.UpdateStatus()
	return nil
}

// ============================================================================
// WAREHOUSE - Warehouse/Location Management
// ============================================================================

type WarehouseStatus string

const (
	WarehouseStatusActive   WarehouseStatus = "ACTIVE"
	WarehouseStatusInactive WarehouseStatus = "INACTIVE"
	WarehouseStatusClosed   WarehouseStatus = "CLOSED"
)

type Warehouse struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Warehouse Info (5 fields)
	Code        string          `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string          `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string         `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        string          `gorm:"column:type;type:varchar(50)" json:"type"` // main, regional, fulfillment, etc.
	Status      WarehouseStatus `gorm:"column:status;type:varchar(20);default:'ACTIVE'" json:"status"`

	// Address (1 field - JSONB)
	Address JSONB `gorm:"column:address;type:jsonb" json:"address,omitempty"`

	// Contact (3 fields)
	Phone       *string `gorm:"column:phone;type:varchar(20)" json:"phone,omitempty"`
	Email       *string `gorm:"column:email;type:varchar(255)" json:"email,omitempty"`
	ManagerID   *uuid.UUID `gorm:"column:manager_id;type:uuid" json:"manager_id,omitempty"`

	// Configuration (2 fields)
	IsDefault bool  `gorm:"column:is_default;default:false" json:"is_default"`
	Priority  int   `gorm:"column:priority;default:0" json:"priority"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Versioning (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

func (Warehouse) TableName() string {
	return "warehouses"
}

func (w *Warehouse) IsActive() bool {
	return w.Status == WarehouseStatusActive && w.DeletedAt == nil
}

// ============================================================================
// INVENTORY TRANSACTION - Stock Movement Tracking
// ============================================================================

type TransactionType string

const (
	TransactionTypeReceive     TransactionType = "RECEIVE"      // Stock receipt
	TransactionTypeIssue       TransactionType = "ISSUE"        // Stock issue
	TransactionTypeTransfer    TransactionType = "TRANSFER"     // Transfer between warehouses
	TransactionTypeAdjustment  TransactionType = "ADJUSTMENT"   // Manual adjustment
	TransactionTypeReturn      TransactionType = "RETURN"       // Customer return
	TransactionTypeDamage      TransactionType = "DAMAGE"       // Damaged goods
	TransactionTypeStockCount  TransactionType = "STOCK_COUNT"  // Physical count
)

type InventoryTransaction struct {
	// Identity (3 fields)
	ID          uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID   uuid.UUID  `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	VariantID   *uuid.UUID `gorm:"column:variant_id;type:uuid;index" json:"variant_id,omitempty"`

	// Transaction Info (5 fields)
	TransactionType TransactionType `gorm:"column:transaction_type;type:varchar(20);not null;index" json:"transaction_type"`
	ReferenceType   *string         `gorm:"column:reference_type;type:varchar(50)" json:"reference_type,omitempty"` // order, transfer, etc.
	ReferenceID     *uuid.UUID      `gorm:"column:reference_id;type:uuid;index" json:"reference_id,omitempty"`
	Quantity        int             `gorm:"column:quantity;not null" json:"quantity"` // Positive for in, negative for out
	Notes           *string         `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Warehouse (2 fields)
	FromWarehouseID *uuid.UUID `gorm:"column:from_warehouse_id;type:uuid;index" json:"from_warehouse_id,omitempty"`
	ToWarehouseID   *uuid.UUID `gorm:"column:to_warehouse_id;type:uuid;index" json:"to_warehouse_id,omitempty"`

	// Before/After (2 fields)
	QuantityBefore int `gorm:"column:quantity_before;not null" json:"quantity_before"`
	QuantityAfter  int `gorm:"column:quantity_after;not null" json:"quantity_after"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Product       *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Variant       *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
	FromWarehouse *Warehouse      `gorm:"foreignKey:FromWarehouseID" json:"from_warehouse,omitempty"`
	ToWarehouse   *Warehouse      `gorm:"foreignKey:ToWarehouseID" json:"to_warehouse,omitempty"`
}

func (InventoryTransaction) TableName() string {
	return "inventory_transactions"
}

// ============================================================================
// STOCK ALERT - Low Stock Alerts
// ============================================================================

type AlertStatus string

const (
	AlertStatusPending    AlertStatus = "PENDING"
	AlertStatusAcknowledged AlertStatus = "ACKNOWLEDGED"
	AlertStatusResolved   AlertStatus = "RESOLVED"
	AlertStatusIgnored    AlertStatus = "IGNORED"
)

type StockAlert struct {
	// Identity (3 fields)
	ID          uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID   uuid.UUID  `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	WarehouseID *uuid.UUID `gorm:"column:warehouse_id;type:uuid;index" json:"warehouse_id,omitempty"`

	// Alert Info (5 fields)
	AlertType   string      `gorm:"column:alert_type;type:varchar(50);not null" json:"alert_type"` // low_stock, out_of_stock, overstock
	Severity    string      `gorm:"column:severity;type:varchar(20);not null" json:"severity"`     // low, medium, high, critical
	Message     string      `gorm:"column:message;type:text;not null" json:"message"`
	Status      AlertStatus `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`
	CurrentQty  int         `gorm:"column:current_qty;not null" json:"current_qty"`

	// Response (3 fields)
	AcknowledgedAt *time.Time `gorm:"column:acknowledged_at" json:"acknowledged_at,omitempty"`
	AcknowledgedBy *uuid.UUID `gorm:"column:acknowledged_by;type:uuid" json:"acknowledged_by,omitempty"`
	ResolvedAt     *time.Time `gorm:"column:resolved_at" json:"resolved_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Product   *Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Warehouse *Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
}

func (StockAlert) TableName() string {
	return "stock_alerts"
}

func (sa *StockAlert) Acknowledge(userID uuid.UUID) {
	now := time.Now()
	sa.Status = AlertStatusAcknowledged
	sa.AcknowledgedAt = &now
	sa.AcknowledgedBy = &userID
}

func (sa *StockAlert) Resolve() {
	now := time.Now()
	sa.Status = AlertStatusResolved
	sa.ResolvedAt = &now
}

func (sa *StockAlert) Ignore() {
	sa.Status = AlertStatusIgnored
}

// ============================================================================
// BATCH/LOT TRACKING - For perishable or serialized items
// ============================================================================

type BatchStatus string

const (
	BatchStatusActive   BatchStatus = "ACTIVE"
	BatchStatusExpired  BatchStatus = "EXPIRED"
	BatchStatusRecalled BatchStatus = "RECALLED"
	BatchStatusSoldOut  BatchStatus = "SOLD_OUT"
)

type ProductBatch struct {
	// Identity (3 fields)
	ID          uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID   uuid.UUID  `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	WarehouseID *uuid.UUID `gorm:"column:warehouse_id;type:uuid;index" json:"warehouse_id,omitempty"`

	// Batch Info (5 fields)
	BatchNumber      string      `gorm:"column:batch_number;type:varchar(100);uniqueIndex;not null" json:"batch_number"`
	LotNumber        *string     `gorm:"column:lot_number;type:varchar(100)" json:"lot_number,omitempty"`
	ManufactureDate  *time.Time  `gorm:"column:manufacture_date" json:"manufacture_date,omitempty"`
	ExpirationDate   *time.Time  `gorm:"column:expiration_date;index" json:"expiration_date,omitempty"`
	Status           BatchStatus `gorm:"column:status;type:varchar(20);default:'ACTIVE'" json:"status"`

	// Quantity (3 fields)
	InitialQuantity int `gorm:"column:initial_quantity;not null" json:"initial_quantity"`
	CurrentQuantity int `gorm:"column:current_quantity;not null" json:"current_quantity"`
	ReservedQuantity int `gorm:"column:reserved_quantity;default:0" json:"reserved_quantity"`

	// Supplier Info (2 fields)
	SupplierID      *uuid.UUID `gorm:"column:supplier_id;type:uuid" json:"supplier_id,omitempty"`
	PurchaseOrderID *uuid.UUID `gorm:"column:purchase_order_id;type:uuid" json:"purchase_order_id,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationship
	Product   *Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Warehouse *Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
}

func (ProductBatch) TableName() string {
	return "product_batches"
}

func (pb *ProductBatch) IsExpired() bool {
	if pb.ExpirationDate == nil {
		return false
	}
	return time.Now().After(*pb.ExpirationDate)
}

func (pb *ProductBatch) IsActive() bool {
	return pb.Status == BatchStatusActive && !pb.IsExpired() && pb.CurrentQuantity > 0
}

func (pb *ProductBatch) GetAvailableQuantity() int {
	return pb.CurrentQuantity - pb.ReservedQuantity
}

func (pb *ProductBatch) DaysUntilExpiration() int {
	if pb.ExpirationDate == nil {
		return -1 // No expiration
	}
	duration := time.Until(*pb.ExpirationDate)
	return int(duration.Hours() / 24)
}

// ============================================================================
// Helper Functions
// ============================================================================

// GetTotalInventory gets total inventory across all warehouses for a product
func GetTotalInventory(db *gorm.DB, productID uuid.UUID, variantID *uuid.UUID) (int, error) {
	var total int64
	query := db.Model(&ProductInventory{}).
		Where("product_id = ?", productID)

	if variantID != nil {
		query = query.Where("variant_id = ?", variantID)
	}

	err := query.Select("COALESCE(SUM(quantity_available), 0)").Scan(&total).Error
	return int(total), err
}

// CreateInventoryTransaction creates an inventory transaction
func CreateInventoryTransaction(
	db *gorm.DB,
	productID uuid.UUID,
	variantID *uuid.UUID,
	transactionType TransactionType,
	quantity int,
	warehouseID *uuid.UUID,
	referenceType *string,
	referenceID *uuid.UUID,
	userID *uuid.UUID,
	notes *string,
) error {
	// Get current inventory
	var inventory ProductInventory
	query := db.Where("product_id = ?", productID)
	if variantID != nil {
		query = query.Where("variant_id = ?", variantID)
	}
	if warehouseID != nil {
		query = query.Where("warehouse_id = ?", warehouseID)
	}

	err := query.First(&inventory).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	quantityBefore := inventory.QuantityOnHand

	// Create transaction
	transaction := &InventoryTransaction{
		ProductID:       productID,
		VariantID:       variantID,
		TransactionType: transactionType,
		ReferenceType:   referenceType,
		ReferenceID:     referenceID,
		Quantity:        quantity,
		Notes:           notes,
		QuantityBefore:  quantityBefore,
		QuantityAfter:   quantityBefore + quantity,
		CreatedBy:       userID,
	}

	if transactionType == TransactionTypeTransfer {
		transaction.FromWarehouseID = warehouseID
		// ToWarehouseID should be set separately
	} else if quantity > 0 {
		transaction.ToWarehouseID = warehouseID
	} else {
		transaction.FromWarehouseID = warehouseID
	}

	return db.Create(transaction).Error
}

// CheckLowStock checks for low stock and creates alerts
func CheckLowStock(db *gorm.DB) error {
	var inventories []ProductInventory
	err := db.Where("quantity_available <= reorder_point AND status != ?", 
		InventoryStatusDiscontinued).
		Preload("Product").
		Find(&inventories).Error

	if err != nil {
		return err
	}

	for _, inv := range inventories {
		// Check if alert already exists
		var existingAlert StockAlert
		err := db.Where("product_id = ? AND warehouse_id = ? AND status = ?",
			inv.ProductID, inv.WarehouseID, AlertStatusPending).
			First(&existingAlert).Error

		if err == gorm.ErrRecordNotFound {
			// Create new alert
			alertType := "low_stock"
			severity := "medium"
			if inv.QuantityAvailable <= 0 {
				alertType = "out_of_stock"
				severity = "high"
			}

			alert := &StockAlert{
				ProductID:   inv.ProductID,
				WarehouseID: inv.WarehouseID,
				AlertType:   alertType,
				Severity:    severity,
				Message:     fmt.Sprintf("Low stock alert: %d units remaining", inv.QuantityAvailable),
				Status:      AlertStatusPending,
				CurrentQty:  inv.QuantityAvailable,
			}

			if err := db.Create(alert).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// CheckExpiredBatches checks for expired batches
func CheckExpiredBatches(db *gorm.DB) error {
	now := time.Now()
	return db.Model(&ProductBatch{}).
		Where("status = ? AND expiration_date IS NOT NULL AND expiration_date < ?",
			BatchStatusActive, now).
		Update("status", BatchStatusExpired).Error
}

// TransferStock transfers stock between warehouses
func TransferStock(
	db *gorm.DB,
	productID uuid.UUID,
	variantID *uuid.UUID,
	fromWarehouseID uuid.UUID,
	toWarehouseID uuid.UUID,
	quantity int,
	userID *uuid.UUID,
	notes *string,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get source inventory
		var fromInv ProductInventory
		query := tx.Where("product_id = ? AND warehouse_id = ?", productID, fromWarehouseID)
		if variantID != nil {
			query = query.Where("variant_id = ?", variantID)
		}
		if err := query.First(&fromInv).Error; err != nil {
			return err
		}

		// Check availability
		if fromInv.QuantityAvailable < quantity {
			return errors.New("insufficient quantity for transfer")
		}

		// Deduct from source
		fromInv.QuantityOnHand -= quantity
		fromInv.CalculateAvailable()
		fromInv.UpdateStatus()
		if err := tx.Save(&fromInv).Error; err != nil {
			return err
		}

		// Get or create destination inventory
		var toInv ProductInventory
		query = tx.Where("product_id = ? AND warehouse_id = ?", productID, toWarehouseID)
		if variantID != nil {
			query = query.Where("variant_id = ?", variantID)
		}
		err := query.First(&toInv).Error
		if err == gorm.ErrRecordNotFound {
			// Create new inventory record
			toInv = ProductInventory{
				ProductID:   productID,
				VariantID:   variantID,
				WarehouseID: &toWarehouseID,
				QuantityOnHand: quantity,
			}
			toInv.CalculateAvailable()
			toInv.UpdateStatus()
			if err := tx.Create(&toInv).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			// Update existing
			toInv.QuantityOnHand += quantity
			toInv.CalculateAvailable()
			toInv.UpdateStatus()
			if err := tx.Save(&toInv).Error; err != nil {
				return err
			}
		}

		// Create transaction record
		refType := "transfer"
		transaction := &InventoryTransaction{
			ProductID:       productID,
			VariantID:       variantID,
			TransactionType: TransactionTypeTransfer,
			ReferenceType:   &refType,
			Quantity:        quantity,
			FromWarehouseID: &fromWarehouseID,
			ToWarehouseID:   &toWarehouseID,
			Notes:           notes,
			QuantityBefore:  fromInv.QuantityOnHand + quantity,
			QuantityAfter:   fromInv.QuantityOnHand,
			CreatedBy:       userID,
		}

		return tx.Create(transaction).Error
	})
}
