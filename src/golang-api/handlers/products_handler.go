/**
 * Products API Handler
 * Handles CRUD operations for products
 */

package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductsHandler struct {
	db *sql.DB
}

func NewProductsHandler(db *sql.DB) *ProductsHandler {
	return &ProductsHandler{db: db}
}

// ==================== TYPES ====================

type Product struct {
	ID          string                 `json:"_id"`
	TenantID    string                 `json:"tenant_id"`
	Code        string                 `json:"code"`
	Name        string                 `json:"name"`
	ProductType string                 `json:"product_type"`
	Description *string                `json:"description,omitempty"`
	BasePrice   float64                `json:"base_price"`
	Currency    string                 `json:"currency"`
	IsActive    bool                   `json:"is_active"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	DeletedAt   *time.Time             `json:"deleted_at,omitempty"`
	Version     int64                  `json:"version"`
}

type CreateProductRequest struct {
	TenantID    string                 `json:"tenant_id" binding:"required"`
	Code        string                 `json:"code" binding:"required,min=1,max=50"`
	Name        string                 `json:"name" binding:"required,min=1,max=255"`
	ProductType string                 `json:"product_type" binding:"required,oneof=APP DOMAIN SSL SERVICE"`
	Description *string                `json:"description"`
	BasePrice   float64                `json:"base_price" binding:"gte=0"`
	Currency    string                 `json:"currency" binding:"required,len=3"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type UpdateProductRequest struct {
	Name        *string                 `json:"name,omitempty"`
	ProductType *string                 `json:"product_type,omitempty"`
	Description *string                 `json:"description"`
	BasePrice   *float64                `json:"base_price,omitempty"`
	Currency    *string                 `json:"currency,omitempty"`
	IsActive    *bool                   `json:"is_active,omitempty"`
	Metadata    *map[string]interface{} `json:"metadata,omitempty"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List products
// @Description Get list of products with optional filtering
// @Tags products
// @Accept json
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param product_type query string false "Filter by product type"
// @Param is_active query bool false "Filter by active status"
// @Param search query string false "Search in name and code"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} Product
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products [get]
func (h *ProductsHandler) GetAll(c *gin.Context) {
	// Query parameters
	tenantID := c.Query("tenant_id")
	productType := c.Query("product_type")
	isActiveStr := c.Query("is_active")
	search := c.Query("search")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	// Build query
	query := `
		SELECT _id, tenant_id, code, name, product_type, description,
		       base_price, currency, is_active, metadata,
		       created_at, updated_at, deleted_at, version
		FROM products
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argPos := 1

	if tenantID != "" {
		query += ` AND tenant_id = $` + fmt.Sprint(argPos)
		args = append(args, tenantID)
		argPos++
	}

	if productType != "" {
		query += ` AND product_type = $` + fmt.Sprint(argPos)
		args = append(args, productType)
		argPos++
	}

	if isActiveStr != "" {
		isActive := isActiveStr == "true"
		query += ` AND is_active = $` + fmt.Sprint(argPos)
		args = append(args, isActive)
		argPos++
	}

	if search != "" {
		query += ` AND (LOWER(name) LIKE $` + fmt.Sprint(argPos) +
			` OR LOWER(code) LIKE $` + fmt.Sprint(argPos) + `)`
		args = append(args, "%"+strings.ToLower(search)+"%")
		argPos++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprint(argPos) +
		` OFFSET $` + fmt.Sprint(argPos+1)
	args = append(args, limit, offset)

	// Execute query
	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch products",
		})
		return
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var p Product
		var metadataJSON []byte

		err := rows.Scan(
			&p.ID, &p.TenantID, &p.Code, &p.Name, &p.ProductType,
			&p.Description, &p.BasePrice, &p.Currency, &p.IsActive,
			&metadataJSON, &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt, &p.Version,
		)
		if err != nil {
			continue
		}

		// Parse metadata JSON
		if len(metadataJSON) > 0 {
			json.Unmarshal(metadataJSON, &p.Metadata)
		}

		products = append(products, p)
	}

	c.JSON(http.StatusOK, products)
}

// GetByID godoc
// @Summary Get product by ID
// @Description Get a single product by ID
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} Product
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id} [get]
func (h *ProductsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	query := `
		SELECT _id, tenant_id, code, name, product_type, description,
		       base_price, currency, is_active, metadata,
		       created_at, updated_at, deleted_at, version
		FROM products
		WHERE _id = $1 AND deleted_at IS NULL
	`

	var p Product
	var metadataJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&p.ID, &p.TenantID, &p.Code, &p.Name, &p.ProductType,
		&p.Description, &p.BasePrice, &p.Currency, &p.IsActive,
		&metadataJSON, &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt, &p.Version,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch product",
		})
		return
	}

	// Parse metadata
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &p.Metadata)
	}

	c.JSON(http.StatusOK, p)
}

// Create godoc
// @Summary Create product
// @Description Create a new product
// @Tags products
// @Accept json
// @Produce json
// @Param product body CreateProductRequest true "Product data"
// @Success 201 {object} Product
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products [post]
func (h *ProductsHandler) Create(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Validate product type
	validTypes := map[string]bool{
		"APP": true, "DOMAIN": true, "SSL": true, "SERVICE": true,
	}
	if !validTypes[req.ProductType] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product type",
		})
		return
	}

	// Validate currency
	if len(req.Currency) != 3 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency must be 3 characters (ISO 4217)",
		})
		return
	}

	// Check for duplicate code in tenant
	var exists bool
	checkQuery := `
		SELECT EXISTS(
			SELECT 1 FROM products 
			WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL
		)
	`
	err := h.db.QueryRow(checkQuery, req.TenantID, req.Code).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check duplicate",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Product with this code already exists in tenant",
		})
		return
	}

	// Generate UUID v7
	id := uuid.New().String()

	// Prepare metadata JSON
	metadataJSON := "{}"
	if req.Metadata != nil {
		metadataBytes, _ := json.Marshal(req.Metadata)
		metadataJSON = string(metadataBytes)
	}

	// Insert product
	query := `
		INSERT INTO products (
			_id, tenant_id, code, name, product_type, description,
			base_price, currency, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING _id, tenant_id, code, name, product_type, description,
		          base_price, currency, is_active, metadata,
		          created_at, updated_at, version
	`

	var p Product
	var returnedMetadataJSON []byte

	err = h.db.QueryRow(
		query,
		id, req.TenantID, req.Code, req.Name, req.ProductType,
		req.Description, req.BasePrice, req.Currency, metadataJSON,
	).Scan(
		&p.ID, &p.TenantID, &p.Code, &p.Name, &p.ProductType,
		&p.Description, &p.BasePrice, &p.Currency, &p.IsActive,
		&returnedMetadataJSON, &p.CreatedAt, &p.UpdatedAt, &p.Version,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create product: " + err.Error(),
		})
		return
	}

	// Parse metadata
	if len(returnedMetadataJSON) > 0 {
		json.Unmarshal(returnedMetadataJSON, &p.Metadata)
	}

	c.JSON(http.StatusCreated, p)
}

// Update godoc
// @Summary Update product
// @Description Update an existing product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param product body UpdateProductRequest true "Product data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id} [patch]
func (h *ProductsHandler) Update(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *req.Name)
		argPos++
	}

	if req.ProductType != nil {
		validTypes := map[string]bool{
			"APP": true, "DOMAIN": true, "SSL": true, "SERVICE": true,
		}
		if !validTypes[*req.ProductType] {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid product type",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("product_type = $%d", argPos))
		args = append(args, *req.ProductType)
		argPos++
	}

	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argPos))
		args = append(args, req.Description)
		argPos++
	}

	if req.BasePrice != nil {
		if *req.BasePrice < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Base price cannot be negative",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("base_price = $%d", argPos))
		args = append(args, *req.BasePrice)
		argPos++
	}

	if req.Currency != nil {
		if len(*req.Currency) != 3 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Currency must be 3 characters",
			})
			return
		}
		updates = append(updates, fmt.Sprintf("currency = $%d", argPos))
		args = append(args, *req.Currency)
		argPos++
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *req.IsActive)
		argPos++
	}

	if req.Metadata != nil {
		metadataJSON, _ := json.Marshal(*req.Metadata)
		updates = append(updates, fmt.Sprintf("metadata = $%d", argPos))
		args = append(args, string(metadataJSON))
		argPos++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No fields to update",
		})
		return
	}

	// Add updated_at and version
	updates = append(updates, "updated_at = NOW()")
	updates = append(updates, fmt.Sprintf("version = version + 1"))

	// Build final query
	query := fmt.Sprintf(
		"UPDATE products SET %s WHERE _id = $%d AND deleted_at IS NULL RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Product updated successfully",
		"updated_at": updatedAt,
	})
}

// Delete godoc
// @Summary Delete product
// @Description Soft delete a product
// @Tags products
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products/{id} [delete]
func (h *ProductsHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid product ID format",
		})
		return
	}

	query := `
		UPDATE products 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE _id = $1 AND deleted_at IS NULL
		RETURNING _id
	`

	var deletedID string
	err := h.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Product not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete product",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
	})
}
