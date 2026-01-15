package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// ============================================
// TYPES & MODELS
// ============================================

type BillingCycle string

const (
	BillingDaily     BillingCycle = "DAILY"
	BillingWeekly    BillingCycle = "WEEKLY"
	BillingMonthly   BillingCycle = "MONTHLY"
	BillingQuarterly BillingCycle = "QUARTERLY"
	BillingYearly    BillingCycle = "YEARLY"
	BillingLifetime  BillingCycle = "LIFETIME"
)

type ProductStatus string

const (
	ProductActive   ProductStatus = "active"
	ProductInactive ProductStatus = "inactive"
	ProductArchived ProductStatus = "archived"
)

// SaaSProduct represents a SaaS product in the system
type SaaSProduct struct {
	ID              string                 `json:"_id"`
	TenantID        string                 `json:"tenant_id"`
	Code            string                 `json:"code"`
	Name            string                 `json:"name"`
	Description     *string                `json:"description,omitempty"`
	ProductTypeCode *string                `json:"product_type_code,omitempty"`
	BasePrice       float64                `json:"base_price"`
	Currency        string                 `json:"currency"`
	BillingCycle    BillingCycle           `json:"billing_cycle"`
	TrialDays       int                    `json:"trial_days"`
	Features        map[string]interface{} `json:"features"`
	Limits          map[string]interface{} `json:"limits"`
	Status          ProductStatus          `json:"status"`
	IsFeatured      bool                   `json:"is_featured"`
	DisplayOrder    int                    `json:"display_order"`
	Metadata        map[string]interface{} `json:"metadata"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
	CreatedBy       *string                `json:"created_by,omitempty"`
	UpdatedBy       *string                `json:"updated_by,omitempty"`
	DeletedAt       *time.Time             `json:"deleted_at,omitempty"`
	DeletedBy       *string                `json:"deleted_by,omitempty"`
	Version         int64                  `json:"version"`
}

// CreateSaaSProductRequest represents the request body for creating a product
type CreateSaaSProductRequest struct {
	TenantID        string                 `json:"tenant_id"`
	Code            string                 `json:"code"`
	Name            string                 `json:"name"`
	Description     *string                `json:"description,omitempty"`
	ProductTypeCode *string                `json:"product_type_code,omitempty"`
	BasePrice       float64                `json:"base_price"`
	Currency        string                 `json:"currency"`
	BillingCycle    BillingCycle           `json:"billing_cycle"`
	TrialDays       int                    `json:"trial_days"`
	Features        map[string]interface{} `json:"features"`
	Limits          map[string]interface{} `json:"limits"`
	Status          ProductStatus          `json:"status"`
	IsFeatured      bool                   `json:"is_featured"`
	DisplayOrder    int                    `json:"display_order"`
	Metadata        map[string]interface{} `json:"metadata"`
	CreatedBy       *string                `json:"created_by,omitempty"`
}

// UpdateSaaSProductRequest represents the request body for updating a product
type UpdateSaaSProductRequest struct {
	Code            *string                 `json:"code,omitempty"`
	Name            *string                 `json:"name,omitempty"`
	Description     *string                 `json:"description,omitempty"`
	ProductTypeCode *string                 `json:"product_type_code,omitempty"`
	BasePrice       *float64                `json:"base_price,omitempty"`
	Currency        *string                 `json:"currency,omitempty"`
	BillingCycle    *BillingCycle           `json:"billing_cycle,omitempty"`
	TrialDays       *int                    `json:"trial_days,omitempty"`
	Features        map[string]interface{}  `json:"features,omitempty"`
	Limits          map[string]interface{}  `json:"limits,omitempty"`
	Status          *ProductStatus          `json:"status,omitempty"`
	IsFeatured      *bool                   `json:"is_featured,omitempty"`
	DisplayOrder    *int                    `json:"display_order,omitempty"`
	Metadata        map[string]interface{}  `json:"metadata,omitempty"`
	UpdatedBy       *string                 `json:"updated_by,omitempty"`
	Version         int64                   `json:"version"`
}

// ProductFilters represents filters for querying products
type ProductFilters struct {
	TenantID        *string
	Status          *ProductStatus
	ProductTypeCode *string
	IsFeatured      *bool
	Search          *string
	Limit           int
	Offset          int
}

// ProductStatistics represents aggregated statistics for products
type ProductStatistics struct {
	Total        int     `json:"total"`
	Active       int     `json:"active"`
	Inactive     int     `json:"inactive"`
	Archived     int     `json:"archived"`
	Featured     int     `json:"featured"`
	TotalRevenue float64 `json:"total_revenue"`
}

// ============================================
// HANDLER STRUCT
// ============================================

type SaaSProductHandler struct {
	DB *sql.DB
}

func NewSaaSProductHandler(db *sql.DB) *SaaSProductHandler {
	return &SaaSProductHandler{DB: db}
}

// ============================================
// CRUD OPERATIONS
// ============================================

// GetAllProducts handles GET /api/v1/saas-products
func (h *SaaSProductHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	filters := h.parseFilters(r)

	// Build query
	query := `
		SELECT 
			_id, tenant_id, code, name, description, product_type_code,
			base_price, currency, billing_cycle, trial_days, features, limits,
			status, is_featured, display_order, metadata,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM saas_products
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	argCount := 1

	// Apply filters
	if filters.TenantID != nil {
		query += fmt.Sprintf(" AND tenant_id = $%d", argCount)
		args = append(args, *filters.TenantID)
		argCount++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, *filters.Status)
		argCount++
	}

	if filters.ProductTypeCode != nil {
		query += fmt.Sprintf(" AND product_type_code = $%d", argCount)
		args = append(args, *filters.ProductTypeCode)
		argCount++
	}

	if filters.IsFeatured != nil {
		query += fmt.Sprintf(" AND is_featured = $%d", argCount)
		args = append(args, *filters.IsFeatured)
		argCount++
	}

	if filters.Search != nil {
		searchPattern := "%" + *filters.Search + "%"
		query += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d OR code ILIKE $%d)", argCount, argCount, argCount)
		args = append(args, searchPattern)
		argCount++
	}

	// Order and pagination
	query += " ORDER BY display_order ASC, created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, filters.Limit, filters.Offset)

	// Execute query
	rows, err := h.DB.Query(query, args...)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch products: "+err.Error())
		return
	}
	defer rows.Close()

	products := []SaaSProduct{}
	for rows.Next() {
		var product SaaSProduct
		var featuresJSON, limitsJSON, metadataJSON []byte

		err := rows.Scan(
			&product.ID, &product.TenantID, &product.Code, &product.Name, &product.Description, &product.ProductTypeCode,
			&product.BasePrice, &product.Currency, &product.BillingCycle, &product.TrialDays, &featuresJSON, &limitsJSON,
			&product.Status, &product.IsFeatured, &product.DisplayOrder, &metadataJSON,
			&product.CreatedAt, &product.UpdatedAt, &product.CreatedBy, &product.UpdatedBy, &product.DeletedAt, &product.DeletedBy, &product.Version,
		)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to scan product: "+err.Error())
			return
		}

		// Parse JSON fields
		json.Unmarshal(featuresJSON, &product.Features)
		json.Unmarshal(limitsJSON, &product.Limits)
		json.Unmarshal(metadataJSON, &product.Metadata)

		products = append(products, product)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM saas_products WHERE deleted_at IS NULL"
	var countArgs []interface{}
	if filters.TenantID != nil {
		countQuery += " AND tenant_id = $1"
		countArgs = append(countArgs, *filters.TenantID)
	}

	var total int
	err = h.DB.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		total = len(products)
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"data": products,
		"pagination": map[string]interface{}{
			"total":    total,
			"limit":    filters.Limit,
			"offset":   filters.Offset,
			"has_more": total > filters.Offset+filters.Limit,
		},
	})
}

// GetProductByID handles GET /api/v1/saas-products/{id}
func (h *SaaSProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	query := `
		SELECT 
			_id, tenant_id, code, name, description, product_type_code,
			base_price, currency, billing_cycle, trial_days, features, limits,
			status, is_featured, display_order, metadata,
			created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, version
		FROM saas_products
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var product SaaSProduct
	var featuresJSON, limitsJSON, metadataJSON []byte

	err := h.DB.QueryRow(query, id).Scan(
		&product.ID, &product.TenantID, &product.Code, &product.Name, &product.Description, &product.ProductTypeCode,
		&product.BasePrice, &product.Currency, &product.BillingCycle, &product.TrialDays, &featuresJSON, &limitsJSON,
		&product.Status, &product.IsFeatured, &product.DisplayOrder, &metadataJSON,
		&product.CreatedAt, &product.UpdatedAt, &product.CreatedBy, &product.UpdatedBy, &product.DeletedAt, &product.DeletedBy, &product.Version,
	)

	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Product not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch product: "+err.Error())
		return
	}

	// Parse JSON fields
	json.Unmarshal(featuresJSON, &product.Features)
	json.Unmarshal(limitsJSON, &product.Limits)
	json.Unmarshal(metadataJSON, &product.Metadata)

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"data": product,
	})
}

// CreateProduct handles POST /api/v1/saas-products
func (h *SaaSProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req CreateSaaSProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Validate required fields
	if err := h.validateCreateRequest(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check code uniqueness
	var exists bool
	err := h.DB.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM saas_products WHERE code = $1 AND tenant_id = $2 AND deleted_at IS NULL)",
		req.Code, req.TenantID,
	).Scan(&exists)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to check code uniqueness: "+err.Error())
		return
	}
	if exists {
		respondWithError(w, http.StatusConflict, "Product code already exists for this tenant")
		return
	}

	// Generate UUID
	productID := uuid.New().String()

	// Marshal JSON fields
	featuresJSON, _ := json.Marshal(req.Features)
	limitsJSON, _ := json.Marshal(req.Limits)
	metadataJSON, _ := json.Marshal(req.Metadata)

	// Insert product
	query := `
		INSERT INTO saas_products (
			_id, tenant_id, code, name, description, product_type_code,
			base_price, currency, billing_cycle, trial_days, features, limits,
			status, is_featured, display_order, metadata, created_by, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1
		)
		RETURNING _id, created_at, updated_at, version
	`

	var product SaaSProduct
	err = h.DB.QueryRow(
		query,
		productID, req.TenantID, req.Code, req.Name, req.Description, req.ProductTypeCode,
		req.BasePrice, req.Currency, req.BillingCycle, req.TrialDays, featuresJSON, limitsJSON,
		req.Status, req.IsFeatured, req.DisplayOrder, metadataJSON, req.CreatedBy,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt, &product.Version)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create product: "+err.Error())
		return
	}

	// Populate response
	product.TenantID = req.TenantID
	product.Code = req.Code
	product.Name = req.Name
	product.Description = req.Description
	product.ProductTypeCode = req.ProductTypeCode
	product.BasePrice = req.BasePrice
	product.Currency = req.Currency
	product.BillingCycle = req.BillingCycle
	product.TrialDays = req.TrialDays
	product.Features = req.Features
	product.Limits = req.Limits
	product.Status = req.Status
	product.IsFeatured = req.IsFeatured
	product.DisplayOrder = req.DisplayOrder
	product.Metadata = req.Metadata
	product.CreatedBy = req.CreatedBy

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"data": product,
	})
}

// UpdateProduct handles PATCH /api/v1/saas-products/{id}
func (h *SaaSProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req UpdateSaaSProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Check current version for optimistic locking
	var currentVersion int64
	err := h.DB.QueryRow(
		"SELECT version FROM saas_products WHERE _id = $1 AND deleted_at IS NULL",
		id,
	).Scan(&currentVersion)

	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Product not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch product version: "+err.Error())
		return
	}

	if req.Version != currentVersion {
		respondWithError(w, http.StatusConflict, "Version conflict: Product was modified by another user")
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Code != nil {
		updates = append(updates, fmt.Sprintf("code = $%d", argCount))
		args = append(args, *req.Code)
		argCount++
	}
	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argCount))
		args = append(args, *req.Name)
		argCount++
	}
	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argCount))
		args = append(args, *req.Description)
		argCount++
	}
	if req.ProductTypeCode != nil {
		updates = append(updates, fmt.Sprintf("product_type_code = $%d", argCount))
		args = append(args, *req.ProductTypeCode)
		argCount++
	}
	if req.BasePrice != nil {
		updates = append(updates, fmt.Sprintf("base_price = $%d", argCount))
		args = append(args, *req.BasePrice)
		argCount++
	}
	if req.Currency != nil {
		updates = append(updates, fmt.Sprintf("currency = $%d", argCount))
		args = append(args, *req.Currency)
		argCount++
	}
	if req.BillingCycle != nil {
		updates = append(updates, fmt.Sprintf("billing_cycle = $%d", argCount))
		args = append(args, *req.BillingCycle)
		argCount++
	}
	if req.TrialDays != nil {
		updates = append(updates, fmt.Sprintf("trial_days = $%d", argCount))
		args = append(args, *req.TrialDays)
		argCount++
	}
	if req.Features != nil {
		featuresJSON, _ := json.Marshal(req.Features)
		updates = append(updates, fmt.Sprintf("features = $%d", argCount))
		args = append(args, featuresJSON)
		argCount++
	}
	if req.Limits != nil {
		limitsJSON, _ := json.Marshal(req.Limits)
		updates = append(updates, fmt.Sprintf("limits = $%d", argCount))
		args = append(args, limitsJSON)
		argCount++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argCount))
		args = append(args, *req.Status)
		argCount++
	}
	if req.IsFeatured != nil {
		updates = append(updates, fmt.Sprintf("is_featured = $%d", argCount))
		args = append(args, *req.IsFeatured)
		argCount++
	}
	if req.DisplayOrder != nil {
		updates = append(updates, fmt.Sprintf("display_order = $%d", argCount))
		args = append(args, *req.DisplayOrder)
		argCount++
	}
	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(req.Metadata)
		updates = append(updates, fmt.Sprintf("metadata = $%d", argCount))
		args = append(args, metadataJSON)
		argCount++
	}
	if req.UpdatedBy != nil {
		updates = append(updates, fmt.Sprintf("updated_by = $%d", argCount))
		args = append(args, *req.UpdatedBy)
		argCount++
	}

	// Always update version and updated_at
	updates = append(updates, fmt.Sprintf("version = $%d", argCount))
	args = append(args, currentVersion+1)
	argCount++

	updates = append(updates, "updated_at = NOW()")

	if len(updates) == 0 {
		respondWithError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	// Add WHERE clause parameters
	args = append(args, id, currentVersion)

	query := fmt.Sprintf(`
		UPDATE saas_products 
		SET %s
		WHERE _id = $%d AND version = $%d AND deleted_at IS NULL
		RETURNING _id, tenant_id, code, name, description, product_type_code,
			base_price, currency, billing_cycle, trial_days, features, limits,
			status, is_featured, display_order, metadata,
			created_at, updated_at, created_by, updated_by, version
	`, strings.Join(updates, ", "), argCount, argCount+1)

	var product SaaSProduct
	var featuresJSON, limitsJSON, metadataJSON []byte

	err = h.DB.QueryRow(query, args...).Scan(
		&product.ID, &product.TenantID, &product.Code, &product.Name, &product.Description, &product.ProductTypeCode,
		&product.BasePrice, &product.Currency, &product.BillingCycle, &product.TrialDays, &featuresJSON, &limitsJSON,
		&product.Status, &product.IsFeatured, &product.DisplayOrder, &metadataJSON,
		&product.CreatedAt, &product.UpdatedAt, &product.CreatedBy, &product.UpdatedBy, &product.Version,
	)

	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusConflict, "Version conflict or product not found")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update product: "+err.Error())
		return
	}

	// Parse JSON fields
	json.Unmarshal(featuresJSON, &product.Features)
	json.Unmarshal(limitsJSON, &product.Limits)
	json.Unmarshal(metadataJSON, &product.Metadata)

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"data": product,
	})
}

// DeleteProduct handles DELETE /api/v1/saas-products/{id} (soft delete)
func (h *SaaSProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	deletedBy := r.URL.Query().Get("deleted_by")

	query := `
		UPDATE saas_products 
		SET deleted_at = NOW(), deleted_by = $1
		WHERE _id = $2 AND deleted_at IS NULL
		RETURNING _id
	`

	var deletedID string
	err := h.DB.QueryRow(query, deletedBy, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Product not found or already deleted")
		return
	}
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to delete product: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Product deleted successfully",
		"data": map[string]string{
			"_id": deletedID,
		},
	})
}

// GetProductStatistics handles GET /api/v1/saas-products/statistics
func (h *SaaSProductHandler) GetProductStatistics(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")

	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status = 'active') as active,
			COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
			COUNT(*) FILTER (WHERE status = 'archived') as archived,
			COUNT(*) FILTER (WHERE is_featured = true) as featured,
			COALESCE(SUM(base_price), 0) as total_revenue
		FROM saas_products
		WHERE deleted_at IS NULL
	`

	var args []interface{}
	if tenantID != "" {
		query += " AND tenant_id = $1"
		args = append(args, tenantID)
	}

	var stats ProductStatistics
	err := h.DB.QueryRow(query, args...).Scan(
		&stats.Total,
		&stats.Active,
		&stats.Inactive,
		&stats.Archived,
		&stats.Featured,
		&stats.TotalRevenue,
	)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch statistics: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"data": stats,
	})
}

// ============================================
// HELPER FUNCTIONS
// ============================================

func (h *SaaSProductHandler) parseFilters(r *http.Request) ProductFilters {
	filters := ProductFilters{
		Limit:  50,
		Offset: 0,
	}

	if tenantID := r.URL.Query().Get("tenant_id"); tenantID != "" {
		filters.TenantID = &tenantID
	}

	if status := r.URL.Query().Get("status"); status != "" {
		s := ProductStatus(status)
		filters.Status = &s
	}

	if productType := r.URL.Query().Get("product_type_code"); productType != "" {
		filters.ProductTypeCode = &productType
	}

	if featured := r.URL.Query().Get("is_featured"); featured != "" {
		f := featured == "true"
		filters.IsFeatured = &f
	}

	if search := r.URL.Query().Get("search"); search != "" {
		filters.Search = &search
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			filters.Limit = l
		}
	}

	if offset := r.URL.Query().Get("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil && o >= 0 {
			filters.Offset = o
		}
	}

	return filters
}

func (h *SaaSProductHandler) validateCreateRequest(req *CreateSaaSProductRequest) error {
	if req.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if req.Code == "" {
		return fmt.Errorf("code is required")
	}
	if req.Name == "" {
		return fmt.Errorf("name is required")
	}
	if req.BasePrice < 0 {
		return fmt.Errorf("base_price must be non-negative")
	}
	if req.Currency == "" {
		return fmt.Errorf("currency is required")
	}
	if req.BillingCycle == "" {
		return fmt.Errorf("billing_cycle is required")
	}

	// Initialize maps if nil
	if req.Features == nil {
		req.Features = make(map[string]interface{})
	}
	if req.Limits == nil {
		req.Limits = make(map[string]interface{})
	}
	if req.Metadata == nil {
		req.Metadata = make(map[string]interface{})
	}

	return nil
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

func respondWithJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	respondWithJSON(w, statusCode, map[string]string{"error": message})
}
