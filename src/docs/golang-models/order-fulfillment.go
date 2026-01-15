package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ORDER FULFILLMENT - Fulfillment Management
// ============================================================================
// Purpose: Track order fulfillment and prepare for shipping
// Table: order_fulfillments
// Primary Key: _id (UUID)
// Features: Multi-item fulfillment, Partial fulfillment, Warehouse tracking
// ============================================================================

type OrderFulfillment struct {
	// Identity (3 fields)
	ID          uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID     uuid.UUID  `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`
	WarehouseID *uuid.UUID `gorm:"column:warehouse_id;type:uuid;index" json:"warehouse_id,omitempty"`

	// Fulfillment Info (4 fields)
	FulfillmentNumber string            `gorm:"column:fulfillment_number;type:varchar(50);uniqueIndex;not null" json:"fulfillment_number"`
	Status            FulfillmentStatus `gorm:"column:status;type:varchar(30);not null;index" json:"status"`
	Type              string            `gorm:"column:type;type:varchar(20)" json:"type"` // standard, express, pickup
	Notes             *string           `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Dates (3 fields)
	FulfilledAt       *time.Time `gorm:"column:fulfilled_at" json:"fulfilled_at,omitempty"`
	ShippedAt         *time.Time `gorm:"column:shipped_at" json:"shipped_at,omitempty"`
	EstimatedDelivery *time.Time `gorm:"column:estimated_delivery" json:"estimated_delivery,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Order              *Order                    `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Warehouse          *Warehouse                `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	FulfillmentItems   []OrderFulfillmentItem    `gorm:"foreignKey:FulfillmentID" json:"items,omitempty"`
	Shipment           *OrderShipment            `gorm:"foreignKey:FulfillmentID" json:"shipment,omitempty"`
}

func (OrderFulfillment) TableName() string {
	return "order_fulfillments"
}

func (of *OrderFulfillment) IsFulfilled() bool {
	return of.Status == FulfillmentStatusFulfilled
}

func (of *OrderFulfillment) MarkAsFulfilled(userID *uuid.UUID) {
	now := time.Now()
	of.Status = FulfillmentStatusFulfilled
	of.FulfilledAt = &now
	of.UpdatedBy = userID
}

// ============================================================================
// ORDER FULFILLMENT ITEM - Items in fulfillment
// ============================================================================

type OrderFulfillmentItem struct {
	// Identity (3 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	FulfillmentID uuid.UUID `gorm:"column:fulfillment_id;type:uuid;not null;index" json:"fulfillment_id"`
	OrderItemID   uuid.UUID `gorm:"column:order_item_id;type:uuid;not null;index" json:"order_item_id"`

	// Item Info (2 fields)
	Quantity         int     `gorm:"column:quantity;not null" json:"quantity"`
	SerialNumbers    *string `gorm:"column:serial_numbers;type:text" json:"serial_numbers,omitempty"` // For tracked items

	// Location (2 fields)
	WarehouseID     *uuid.UUID `gorm:"column:warehouse_id;type:uuid" json:"warehouse_id,omitempty"`
	BinLocation     *string    `gorm:"column:bin_location;type:varchar(50)" json:"bin_location,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Fulfillment *OrderFulfillment `gorm:"foreignKey:FulfillmentID" json:"fulfillment,omitempty"`
	OrderItem   *OrderItem        `gorm:"foreignKey:OrderItemID" json:"order_item,omitempty"`
}

func (OrderFulfillmentItem) TableName() string {
	return "order_fulfillment_items"
}

// ============================================================================
// ORDER SHIPMENT - Shipping Information
// ============================================================================

type ShipmentStatus string

const (
	ShipmentStatusPending    ShipmentStatus = "PENDING"
	ShipmentStatusPicked     ShipmentStatus = "PICKED"
	ShipmentStatusPacked     ShipmentStatus = "PACKED"
	ShipmentStatusShipped    ShipmentStatus = "SHIPPED"
	ShipmentStatusInTransit  ShipmentStatus = "IN_TRANSIT"
	ShipmentStatusOutForDelivery ShipmentStatus = "OUT_FOR_DELIVERY"
	ShipmentStatusDelivered  ShipmentStatus = "DELIVERED"
	ShipmentStatusFailed     ShipmentStatus = "FAILED"
	ShipmentStatusReturned   ShipmentStatus = "RETURNED"
)

type OrderShipment struct {
	// Identity (3 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID       uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`
	FulfillmentID uuid.UUID `gorm:"column:fulfillment_id;type:uuid;not null;index" json:"fulfillment_id"`

	// Shipment Info (6 fields)
	TrackingNumber string         `gorm:"column:tracking_number;type:varchar(100);index" json:"tracking_number"`
	Carrier        string         `gorm:"column:carrier;type:varchar(50);not null" json:"carrier"` // UPS, FedEx, DHL, etc.
	Service        *string        `gorm:"column:service;type:varchar(50)" json:"service,omitempty"` // Ground, Express, etc.
	Status         ShipmentStatus `gorm:"column:status;type:varchar(30);not null;index" json:"status"`
	TrackingURL    *string        `gorm:"column:tracking_url;type:text" json:"tracking_url,omitempty"`
	LabelURL       *string        `gorm:"column:label_url;type:text" json:"label_url,omitempty"`

	// Costs (2 fields)
	ShippingCost float64 `gorm:"column:shipping_cost;type:decimal(10,2)" json:"shipping_cost"`
	Currency     string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Package Info (3 fields)
	Weight     *float64 `gorm:"column:weight;type:decimal(10,2)" json:"weight,omitempty"` // kg
	Dimensions JSONB    `gorm:"column:dimensions;type:jsonb" json:"dimensions,omitempty"` // length, width, height
	PackageCount int    `gorm:"column:package_count;default:1" json:"package_count"`

	// Dates (4 fields)
	ShippedAt         *time.Time `gorm:"column:shipped_at" json:"shipped_at,omitempty"`
	EstimatedDelivery *time.Time `gorm:"column:estimated_delivery" json:"estimated_delivery,omitempty"`
	ActualDelivery    *time.Time `gorm:"column:actual_delivery" json:"actual_delivery,omitempty"`
	LastTrackedAt     *time.Time `gorm:"column:last_tracked_at" json:"last_tracked_at,omitempty"`

	// Delivery Info (3 fields)
	DeliveredTo      *string `gorm:"column:delivered_to;type:varchar(255)" json:"delivered_to,omitempty"` // Person who received
	DeliverySignature *string `gorm:"column:delivery_signature;type:text" json:"delivery_signature,omitempty"` // Signature URL
	DeliveryNotes    *string `gorm:"column:delivery_notes;type:text" json:"delivery_notes,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Order            *Order              `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Fulfillment      *OrderFulfillment   `gorm:"foreignKey:FulfillmentID" json:"fulfillment,omitempty"`
	TrackingEvents   []ShipmentTracking  `gorm:"foreignKey:ShipmentID" json:"tracking_events,omitempty"`
}

func (OrderShipment) TableName() string {
	return "order_shipments"
}

func (os *OrderShipment) IsDelivered() bool {
	return os.Status == ShipmentStatusDelivered
}

func (os *OrderShipment) MarkAsShipped(userID *uuid.UUID) {
	now := time.Now()
	os.Status = ShipmentStatusShipped
	os.ShippedAt = &now
	os.UpdatedBy = userID
}

func (os *OrderShipment) MarkAsDelivered(deliveredTo string, userID *uuid.UUID) {
	now := time.Now()
	os.Status = ShipmentStatusDelivered
	os.ActualDelivery = &now
	os.DeliveredTo = &deliveredTo
	os.UpdatedBy = userID
}

// ============================================================================
// SHIPMENT TRACKING - Tracking Events
// ============================================================================

type ShipmentTracking struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ShipmentID uuid.UUID `gorm:"column:shipment_id;type:uuid;not null;index" json:"shipment_id"`

	// Event Info (5 fields)
	Status      ShipmentStatus `gorm:"column:status;type:varchar(30);not null" json:"status"`
	Location    *string        `gorm:"column:location;type:varchar(255)" json:"location,omitempty"`
	Description string         `gorm:"column:description;type:text;not null" json:"description"`
	EventTime   time.Time      `gorm:"column:event_time;not null;index" json:"event_time"`
	Source      *string        `gorm:"column:source;type:varchar(50)" json:"source,omitempty"` // carrier, manual, webhook

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Shipment *OrderShipment `gorm:"foreignKey:ShipmentID" json:"shipment,omitempty"`
}

func (ShipmentTracking) TableName() string {
	return "shipment_tracking"
}

// ============================================================================
// SHIPPING CARRIER - Carrier Configuration
// ============================================================================

type ShippingCarrier struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Carrier Info (6 fields)
	Code        string  `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"` // UPS, FEDEX, DHL
	Name        string  `gorm:"column:name;type:varchar(100);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	TrackingURL *string `gorm:"column:tracking_url;type:text" json:"tracking_url,omitempty"` // URL template with {tracking_number}
	LogoURL     *string `gorm:"column:logo_url;type:text" json:"logo_url,omitempty"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Configuration (2 fields)
	APIConfig JSONB `gorm:"column:api_config;type:jsonb" json:"api_config,omitempty"` // API credentials, endpoints
	Settings  JSONB `gorm:"column:settings;type:jsonb" json:"settings,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Version (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

func (ShippingCarrier) TableName() string {
	return "shipping_carriers"
}

func (sc *ShippingCarrier) GetTrackingURL(trackingNumber string) string {
	if sc.TrackingURL == nil {
		return ""
	}
	return strings.ReplaceAll(*sc.TrackingURL, "{tracking_number}", trackingNumber)
}

// ============================================================================
// SHIPPING RATE - Shipping Rate Calculation
// ============================================================================

type ShippingRate struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	CarrierID uuid.UUID `gorm:"column:carrier_id;type:uuid;not null;index" json:"carrier_id"`

	// Rate Info (5 fields)
	Name        string  `gorm:"column:name;type:varchar(100);not null" json:"name"` // Ground, Express, etc.
	Service     string  `gorm:"column:service;type:varchar(50);not null" json:"service"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	BaseRate    float64 `gorm:"column:base_rate;type:decimal(10,2);not null" json:"base_rate"`
	Currency    string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Conditions (5 fields)
	MinWeight     *float64 `gorm:"column:min_weight;type:decimal(10,2)" json:"min_weight,omitempty"` // kg
	MaxWeight     *float64 `gorm:"column:max_weight;type:decimal(10,2)" json:"max_weight,omitempty"`
	MinOrderValue *float64 `gorm:"column:min_order_value;type:decimal(15,2)" json:"min_order_value,omitempty"`
	FreeShippingThreshold *float64 `gorm:"column:free_shipping_threshold;type:decimal(15,2)" json:"free_shipping_threshold,omitempty"`
	DeliveryDays  *int     `gorm:"column:delivery_days" json:"delivery_days,omitempty"` // Estimated delivery days

	// Status (2 fields)
	IsActive  bool `gorm:"column:is_active;default:true" json:"is_active"`
	IsDefault bool `gorm:"column:is_default;default:false" json:"is_default"`

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

	// Relationship
	Carrier *ShippingCarrier `gorm:"foreignKey:CarrierID" json:"carrier,omitempty"`
}

func (ShippingRate) TableName() string {
	return "shipping_rates"
}

func (sr *ShippingRate) CalculateRate(weight float64, orderValue float64) float64 {
	// Check free shipping threshold
	if sr.FreeShippingThreshold != nil && orderValue >= *sr.FreeShippingThreshold {
		return 0
	}

	// Check weight limits
	if sr.MinWeight != nil && weight < *sr.MinWeight {
		return 0 // Not applicable
	}
	if sr.MaxWeight != nil && weight > *sr.MaxWeight {
		return 0 // Not applicable
	}

	// Check order value minimum
	if sr.MinOrderValue != nil && orderValue < *sr.MinOrderValue {
		return 0 // Not applicable
	}

	return sr.BaseRate
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateFulfillmentNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("FUL-%s-%s", dateStr, randomStr)
}

func generateTrackingNumber(carrier string) string {
	// Simple implementation - in production, use carrier API
	now := time.Now()
	prefix := strings.ToUpper(carrier[:3])
	return fmt.Sprintf("%s%d", prefix, now.Unix())
}

// CreateFulfillment creates a fulfillment for an order
func CreateFulfillment(
	db *gorm.DB,
	orderID uuid.UUID,
	warehouseID *uuid.UUID,
	items []OrderFulfillmentItem,
	userID *uuid.UUID,
) (*OrderFulfillment, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create fulfillment
		fulfillment := &OrderFulfillment{
			OrderID:           orderID,
			WarehouseID:       warehouseID,
			FulfillmentNumber: generateFulfillmentNumber(),
			Status:            FulfillmentStatusUnfulfilled,
			CreatedBy:         userID,
		}

		if err := tx.Create(fulfillment).Error; err != nil {
			return err
		}

		// Create fulfillment items
		for i := range items {
			items[i].FulfillmentID = fulfillment.ID
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		// Update order items
		for _, item := range items {
			var orderItem OrderItem
			if err := tx.First(&orderItem, item.OrderItemID).Error; err != nil {
				return err
			}

			orderItem.FulfilledQuantity += item.Quantity
			if orderItem.IsFulfilled() {
				orderItem.FulfillmentStatus = FulfillmentStatusFulfilled
			} else {
				orderItem.FulfillmentStatus = FulfillmentStatusPartiallyFulfilled
			}

			if err := tx.Save(&orderItem).Error; err != nil {
				return err
			}
		}

		// Check if order is fully fulfilled
		var orderItems []OrderItem
		if err := tx.Where("order_id = ?", orderID).Find(&orderItems).Error; err != nil {
			return err
		}

		allFulfilled := true
		for _, item := range orderItems {
			if !item.IsFulfilled() {
				allFulfilled = false
				break
			}
		}

		// Update order fulfillment status
		var order Order
		if err := tx.First(&order, orderID).Error; err != nil {
			return err
		}

		if allFulfilled {
			order.FulfillmentStatus = FulfillmentStatusFulfilled
			now := time.Now()
			order.FulfilledAt = &now
		} else {
			order.FulfillmentStatus = FulfillmentStatusPartiallyFulfilled
		}

		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		fulfillment.FulfillmentItems = items
		return nil
	}), nil
}

// CreateShipment creates a shipment for a fulfillment
func CreateShipment(
	db *gorm.DB,
	fulfillmentID uuid.UUID,
	carrier string,
	service *string,
	shippingCost float64,
	weight *float64,
	userID *uuid.UUID,
) (*OrderShipment, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get fulfillment
		var fulfillment OrderFulfillment
		if err := tx.First(&fulfillment, fulfillmentID).Error; err != nil {
			return err
		}

		// Create shipment
		trackingNumber := generateTrackingNumber(carrier)
		shipment := &OrderShipment{
			OrderID:        fulfillment.OrderID,
			FulfillmentID:  fulfillmentID,
			TrackingNumber: trackingNumber,
			Carrier:        carrier,
			Service:        service,
			Status:         ShipmentStatusPending,
			ShippingCost:   shippingCost,
			Weight:         weight,
			CreatedBy:      userID,
		}

		if err := tx.Create(shipment).Error; err != nil {
			return err
		}

		// Create initial tracking event
		tracking := &ShipmentTracking{
			ShipmentID:  shipment.ID,
			Status:      ShipmentStatusPending,
			Description: "Shipment created",
			EventTime:   time.Now(),
			Source:      strPtr("system"),
			CreatedBy:   userID,
		}

		if err := tx.Create(tracking).Error; err != nil {
			return err
		}

		return nil
	}), nil
}

// UpdateShipmentStatus updates shipment status and creates tracking event
func UpdateShipmentStatus(
	db *gorm.DB,
	shipmentID uuid.UUID,
	newStatus ShipmentStatus,
	location *string,
	description string,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get shipment
		var shipment OrderShipment
		if err := tx.First(&shipment, shipmentID).Error; err != nil {
			return err
		}

		// Update shipment
		shipment.Status = newStatus
		shipment.UpdatedBy = userID
		now := time.Now()
		shipment.LastTrackedAt = &now

		// Update specific dates
		switch newStatus {
		case ShipmentStatusShipped:
			shipment.ShippedAt = &now
		case ShipmentStatusDelivered:
			shipment.ActualDelivery = &now
		}

		if err := tx.Save(&shipment).Error; err != nil {
			return err
		}

		// Create tracking event
		tracking := &ShipmentTracking{
			ShipmentID:  shipmentID,
			Status:      newStatus,
			Location:    location,
			Description: description,
			EventTime:   now,
			Source:      strPtr("manual"),
			CreatedBy:   userID,
		}

		if err := tx.Create(tracking).Error; err != nil {
			return err
		}

		// Update order if delivered
		if newStatus == ShipmentStatusDelivered {
			var order Order
			if err := tx.First(&order, shipment.OrderID).Error; err != nil {
				return err
			}

			if err := order.MarkAsDelivered(); err == nil {
				if err := tx.Save(&order).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// CalculateShippingRate calculates shipping rate for an order
func CalculateShippingRate(
	db *gorm.DB,
	orderID uuid.UUID,
	carrierCode string,
) (float64, error) {
	var order Order
	if err := db.Preload("Items").First(&order, orderID).Error; err != nil {
		return 0, err
	}

	// Calculate total weight (if available)
	var totalWeight float64
	// TODO: Get weight from products

	// Get carrier
	var carrier ShippingCarrier
	if err := db.Where("code = ? AND is_active = ?", carrierCode, true).
		First(&carrier).Error; err != nil {
		return 0, err
	}

	// Get applicable rates
	var rates []ShippingRate
	if err := db.Where("carrier_id = ? AND is_active = ? AND deleted_at IS NULL",
		carrier.ID, true).
		Order("base_rate ASC").
		Find(&rates).Error; err != nil {
		return 0, err
	}

	// Find best rate
	for _, rate := range rates {
		cost := rate.CalculateRate(totalWeight, order.TotalAmount)
		if cost >= 0 {
			return cost, nil
		}
	}

	return 0, errors.New("no applicable shipping rate found")
}
