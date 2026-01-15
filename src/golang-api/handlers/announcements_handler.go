/**
 * System Announcements API Handler
 * Handles system-wide announcements with i18n support
 */

package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type AnnouncementsHandler struct {
	db *sql.DB
}

func NewAnnouncementsHandler(db *sql.DB) *AnnouncementsHandler {
	return &AnnouncementsHandler{db: db}
}

// ==================== TYPES ====================

type Announcement struct {
	ID            string                 `json:"_id"`
	Titles        map[string]string      `json:"titles"`
	Contents      map[string]string      `json:"contents"`
	Type          string                 `json:"type"`
	TargetRegions []string               `json:"target_regions"`
	TargetPlans   []string               `json:"target_plans"`
	IsActive      bool                   `json:"is_active"`
	IsLocalTime   bool                   `json:"is_local_time"`
	StartAt       time.Time              `json:"start_at"`
	EndAt         *time.Time             `json:"end_at,omitempty"`
	Version       int64                  `json:"version"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
}

type AnnouncementWithStats struct {
	Announcement
	ReadCount  int `json:"read_count"`
	TotalUsers int `json:"total_users"`
}

type CreateAnnouncementRequest struct {
	Titles        map[string]string `json:"titles" binding:"required"`
	Contents      map[string]string `json:"contents" binding:"required"`
	Type          *string           `json:"type"`
	TargetRegions []string          `json:"target_regions"`
	TargetPlans   []string          `json:"target_plans"`
	IsActive      *bool             `json:"is_active"`
	IsLocalTime   *bool             `json:"is_local_time"`
	StartAt       *time.Time        `json:"start_at"`
	EndAt         *time.Time        `json:"end_at"`
}

type UpdateAnnouncementRequest struct {
	Titles        map[string]string `json:"titles"`
	Contents      map[string]string `json:"contents"`
	Type          *string           `json:"type"`
	TargetRegions []string          `json:"target_regions"`
	TargetPlans   []string          `json:"target_plans"`
	IsActive      *bool             `json:"is_active"`
	IsLocalTime   *bool             `json:"is_local_time"`
	StartAt       *time.Time        `json:"start_at"`
	EndAt         *time.Time        `json:"end_at"`
}

type MarkAsReadRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

type AnnouncementRead struct {
	ID             string    `json:"_id"`
	TenantID       string    `json:"tenant_id"`
	UserID         string    `json:"user_id"`
	AnnouncementID string    `json:"announcement_id"`
	ReadAt         time.Time `json:"read_at"`
	Version        int64     `json:"version"`
}

// ==================== HANDLERS ====================

// GetAll godoc
// @Summary List announcements
// @Description Get list of system announcements with filtering
// @Tags announcements
// @Accept json
// @Produce json
// @Param is_active query boolean false "Filter by active status"
// @Param type query string false "Filter by type"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset results" default(0)
// @Success 200 {array} Announcement
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /announcements [get]
func (h *AnnouncementsHandler) GetAll(c *gin.Context) {
	isActive := c.Query("is_active")
	announcementType := c.Query("type")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT _id, titles, contents, type, target_regions, target_plans,
		       is_active, is_local_time, start_at, end_at,
		       version, created_at, updated_at
		FROM system_announcements
		WHERE 1=1
	`
	args := []interface{}{}
	argPos := 1

	if isActive != "" {
		query += ` AND is_active = $` + fmt.Sprint(argPos)
		args = append(args, isActive == "true")
		argPos++
	}

	if announcementType != "" {
		query += ` AND type = $` + fmt.Sprint(argPos)
		args = append(args, announcementType)
		argPos++
	}

	query += ` ORDER BY start_at DESC LIMIT $` + fmt.Sprint(argPos) +
		` OFFSET $` + fmt.Sprint(argPos+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch announcements: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	announcements := []Announcement{}
	for rows.Next() {
		var a Announcement
		var titlesJSON, contentsJSON []byte

		err := rows.Scan(
			&a.ID, &titlesJSON, &contentsJSON, &a.Type,
			pq.Array(&a.TargetRegions), pq.Array(&a.TargetPlans),
			&a.IsActive, &a.IsLocalTime, &a.StartAt, &a.EndAt,
			&a.Version, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(titlesJSON, &a.Titles)
		json.Unmarshal(contentsJSON, &a.Contents)

		announcements = append(announcements, a)
	}

	c.JSON(http.StatusOK, announcements)
}

// GetActive godoc
// @Summary Get active announcements
// @Description Get active announcements for current user (filtering by time & targeting)
// @Tags announcements
// @Accept json
// @Produce json
// @Param user_id query string false "User ID to filter read announcements"
// @Param region query string false "User region for targeting"
// @Param plan query string false "User plan for targeting"
// @Success 200 {array} Announcement
// @Failure 500 {object} ErrorResponse
// @Router /announcements/active [get]
func (h *AnnouncementsHandler) GetActive(c *gin.Context) {
	userID := c.Query("user_id")
	region := c.Query("region")
	plan := c.Query("plan")

	now := time.Now()

	query := `
		SELECT _id, titles, contents, type, target_regions, target_plans,
		       is_active, is_local_time, start_at, end_at,
		       version, created_at, updated_at
		FROM system_announcements
		WHERE is_active = TRUE
		  AND start_at <= $1
		  AND (end_at IS NULL OR end_at > $1)
	`
	args := []interface{}{now}

	// Add targeting filters
	if region != "" {
		query += ` AND (target_regions IS NULL OR target_regions = '{}' OR $2 = ANY(target_regions))`
		args = append(args, region)
	}

	if plan != "" {
		argPos := len(args) + 1
		query += ` AND (target_plans IS NULL OR target_plans = '{}' OR $` + fmt.Sprint(argPos) + ` = ANY(target_plans))`
		args = append(args, plan)
	}

	query += ` ORDER BY start_at DESC`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch active announcements: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	announcements := []Announcement{}
	readAnnouncementIDs := make(map[string]bool)

	// Get read announcements for user
	if userID != "" {
		readQuery := `SELECT announcement_id FROM user_announcement_reads WHERE user_id = $1`
		readRows, err := h.db.Query(readQuery, userID)
		if err == nil {
			defer readRows.Close()
			for readRows.Next() {
				var announcementID string
				if readRows.Scan(&announcementID) == nil {
					readAnnouncementIDs[announcementID] = true
				}
			}
		}
	}

	for rows.Next() {
		var a Announcement
		var titlesJSON, contentsJSON []byte

		err := rows.Scan(
			&a.ID, &titlesJSON, &contentsJSON, &a.Type,
			pq.Array(&a.TargetRegions), pq.Array(&a.TargetPlans),
			&a.IsActive, &a.IsLocalTime, &a.StartAt, &a.EndAt,
			&a.Version, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			continue
		}

		json.Unmarshal(titlesJSON, &a.Titles)
		json.Unmarshal(contentsJSON, &a.Contents)

		// Skip if user has already read
		if userID != "" && readAnnouncementIDs[a.ID] {
			continue
		}

		announcements = append(announcements, a)
	}

	c.JSON(http.StatusOK, announcements)
}

// GetByID godoc
// @Summary Get announcement by ID
// @Description Get a single announcement by ID
// @Tags announcements
// @Accept json
// @Produce json
// @Param id path string true "Announcement ID"
// @Success 200 {object} Announcement
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /announcements/{id} [get]
func (h *AnnouncementsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid announcement ID format",
		})
		return
	}

	query := `
		SELECT _id, titles, contents, type, target_regions, target_plans,
		       is_active, is_local_time, start_at, end_at,
		       version, created_at, updated_at
		FROM system_announcements
		WHERE _id = $1
	`

	var a Announcement
	var titlesJSON, contentsJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&a.ID, &titlesJSON, &contentsJSON, &a.Type,
		pq.Array(&a.TargetRegions), pq.Array(&a.TargetPlans),
		&a.IsActive, &a.IsLocalTime, &a.StartAt, &a.EndAt,
		&a.Version, &a.CreatedAt, &a.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Announcement not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch announcement: " + err.Error(),
		})
		return
	}

	json.Unmarshal(titlesJSON, &a.Titles)
	json.Unmarshal(contentsJSON, &a.Contents)

	c.JSON(http.StatusOK, a)
}

// GetWithStats godoc
// @Summary Get announcement with read statistics
// @Description Get announcement with read count and total users
// @Tags announcements
// @Accept json
// @Produce json
// @Param id path string true "Announcement ID"
// @Success 200 {object} AnnouncementWithStats
// @Failure 404 {object} ErrorResponse
// @Router /announcements/{id}/stats [get]
func (h *AnnouncementsHandler) GetWithStats(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid announcement ID format",
		})
		return
	}

	query := `
		SELECT 
			a._id, a.titles, a.contents, a.type, a.target_regions, a.target_plans,
			a.is_active, a.is_local_time, a.start_at, a.end_at,
			a.version, a.created_at, a.updated_at,
			COALESCE(COUNT(DISTINCT r.user_id), 0) as read_count,
			(SELECT COUNT(*) FROM users) as total_users
		FROM system_announcements a
		LEFT JOIN user_announcement_reads r ON r.announcement_id = a._id
		WHERE a._id = $1
		GROUP BY a._id, a.titles, a.contents, a.type, a.target_regions, a.target_plans,
		         a.is_active, a.is_local_time, a.start_at, a.end_at,
		         a.version, a.created_at, a.updated_at
	`

	var as AnnouncementWithStats
	var titlesJSON, contentsJSON []byte

	err := h.db.QueryRow(query, id).Scan(
		&as.ID, &titlesJSON, &contentsJSON, &as.Type,
		pq.Array(&as.TargetRegions), pq.Array(&as.TargetPlans),
		&as.IsActive, &as.IsLocalTime, &as.StartAt, &as.EndAt,
		&as.Version, &as.CreatedAt, &as.UpdatedAt,
		&as.ReadCount, &as.TotalUsers,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Announcement not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch announcement stats: " + err.Error(),
		})
		return
	}

	json.Unmarshal(titlesJSON, &as.Titles)
	json.Unmarshal(contentsJSON, &as.Contents)

	c.JSON(http.StatusOK, as)
}

// Create godoc
// @Summary Create announcement
// @Description Create a new system announcement
// @Tags announcements
// @Accept json
// @Produce json
// @Param announcement body CreateAnnouncementRequest true "Announcement data"
// @Success 201 {object} Announcement
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /announcements [post]
func (h *AnnouncementsHandler) Create(c *gin.Context) {
	var req CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	announcementType := "INFO"
	if req.Type != nil {
		announcementType = *req.Type
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	isLocalTime := false
	if req.IsLocalTime != nil {
		isLocalTime = *req.IsLocalTime
	}

	startAt := time.Now()
	if req.StartAt != nil {
		startAt = *req.StartAt
	}

	id := uuid.New().String()
	titlesJSON, _ := json.Marshal(req.Titles)
	contentsJSON, _ := json.Marshal(req.Contents)

	insertQuery := `
		INSERT INTO system_announcements (
			_id, titles, contents, type, target_regions, target_plans,
			is_active, is_local_time, start_at, end_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING _id, titles, contents, type, target_regions, target_plans,
		          is_active, is_local_time, start_at, end_at,
		          version, created_at, updated_at
	`

	var a Announcement
	var returnedTitlesJSON, returnedContentsJSON []byte

	err := h.db.QueryRow(
		insertQuery,
		id, titlesJSON, contentsJSON, announcementType,
		pq.Array(req.TargetRegions), pq.Array(req.TargetPlans),
		isActive, isLocalTime, startAt, req.EndAt,
	).Scan(
		&a.ID, &returnedTitlesJSON, &returnedContentsJSON, &a.Type,
		pq.Array(&a.TargetRegions), pq.Array(&a.TargetPlans),
		&a.IsActive, &a.IsLocalTime, &a.StartAt, &a.EndAt,
		&a.Version, &a.CreatedAt, &a.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create announcement: " + err.Error(),
		})
		return
	}

	json.Unmarshal(returnedTitlesJSON, &a.Titles)
	json.Unmarshal(returnedContentsJSON, &a.Contents)

	c.JSON(http.StatusCreated, a)
}

// Update godoc
// @Summary Update announcement
// @Description Update an existing announcement
// @Tags announcements
// @Accept json
// @Produce json
// @Param id path string true "Announcement ID"
// @Param announcement body UpdateAnnouncementRequest true "Announcement data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /announcements/{id} [patch]
func (h *AnnouncementsHandler) Update(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid announcement ID format",
		})
		return
	}

	var req UpdateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Titles != nil {
		titlesJSON, _ := json.Marshal(req.Titles)
		updates = append(updates, fmt.Sprintf("titles = $%d", argPos))
		args = append(args, titlesJSON)
		argPos++
	}

	if req.Contents != nil {
		contentsJSON, _ := json.Marshal(req.Contents)
		updates = append(updates, fmt.Sprintf("contents = $%d", argPos))
		args = append(args, contentsJSON)
		argPos++
	}

	if req.Type != nil {
		updates = append(updates, fmt.Sprintf("type = $%d", argPos))
		args = append(args, *req.Type)
		argPos++
	}

	if req.TargetRegions != nil {
		updates = append(updates, fmt.Sprintf("target_regions = $%d", argPos))
		args = append(args, pq.Array(req.TargetRegions))
		argPos++
	}

	if req.TargetPlans != nil {
		updates = append(updates, fmt.Sprintf("target_plans = $%d", argPos))
		args = append(args, pq.Array(req.TargetPlans))
		argPos++
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *req.IsActive)
		argPos++
	}

	if req.IsLocalTime != nil {
		updates = append(updates, fmt.Sprintf("is_local_time = $%d", argPos))
		args = append(args, *req.IsLocalTime)
		argPos++
	}

	if req.StartAt != nil {
		updates = append(updates, fmt.Sprintf("start_at = $%d", argPos))
		args = append(args, *req.StartAt)
		argPos++
	}

	if req.EndAt != nil {
		updates = append(updates, fmt.Sprintf("end_at = $%d", argPos))
		args = append(args, *req.EndAt)
		argPos++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No fields to update",
		})
		return
	}

	updates = append(updates, "updated_at = NOW()")
	updates = append(updates, "version = version + 1")

	query := fmt.Sprintf(
		"UPDATE system_announcements SET %s WHERE _id = $%d RETURNING updated_at",
		strings.Join(updates, ", "),
		argPos,
	)
	args = append(args, id)

	var updatedAt time.Time
	err := h.db.QueryRow(query, args...).Scan(&updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Announcement not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update announcement: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Announcement updated successfully",
		"updated_at": updatedAt,
	})
}

// Delete godoc
// @Summary Delete announcement
// @Description Delete an announcement
// @Tags announcements
// @Accept json
// @Produce json
// @Param id path string true "Announcement ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} ErrorResponse
// @Router /announcements/{id} [delete]
func (h *AnnouncementsHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid announcement ID format",
		})
		return
	}

	query := `DELETE FROM system_announcements WHERE _id = $1 RETURNING _id`

	var deletedID string
	err := h.db.QueryRow(query, id).Scan(&deletedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Announcement not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete announcement: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Announcement deleted successfully",
	})
}

// MarkAsRead godoc
// @Summary Mark announcement as read
// @Description Mark an announcement as read by a user
// @Tags announcements
// @Accept json
// @Produce json
// @Param id path string true "Announcement ID"
// @Param read body MarkAsReadRequest true "User ID"
// @Success 200 {object} AnnouncementRead
// @Failure 400 {object} ErrorResponse
// @Router /announcements/{id}/mark-read [post]
func (h *AnnouncementsHandler) MarkAsRead(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid announcement ID format",
		})
		return
	}

	var req MarkAsReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	// Get user's tenant_id
	var tenantID string
	err := h.db.QueryRow(
		`SELECT tenant_id FROM users WHERE _id = $1`,
		req.UserID,
	).Scan(&tenantID)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User not found",
		})
		return
	}

	readID := uuid.New().String()

	insertQuery := `
		INSERT INTO user_announcement_reads (
			_id, tenant_id, user_id, announcement_id
		) VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, announcement_id) DO UPDATE
		SET read_at = NOW()
		RETURNING _id, tenant_id, user_id, announcement_id, read_at, version
	`

	var ar AnnouncementRead
	err = h.db.QueryRow(
		insertQuery,
		readID, tenantID, req.UserID, id,
	).Scan(
		&ar.ID, &ar.TenantID, &ar.UserID, &ar.AnnouncementID,
		&ar.ReadAt, &ar.Version,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to mark announcement as read: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, ar)
}

// GetReadStats godoc
// @Summary Get announcement read statistics
// @Description Get detailed read statistics for an announcement
// @Tags announcements
// @Accept json
// @Produce json
// @Param id path string true "Announcement ID"
// @Success 200 {object} map[string]interface{}
// @Router /announcements/{id}/read-stats [get]
func (h *AnnouncementsHandler) GetReadStats(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid announcement ID format",
		})
		return
	}

	query := `
		SELECT 
			COUNT(DISTINCT r.user_id) as read_count,
			(SELECT COUNT(*) FROM users) as total_users,
			COALESCE(
				ROUND(COUNT(DISTINCT r.user_id)::numeric / NULLIF((SELECT COUNT(*) FROM users), 0) * 100, 2),
				0
			) as read_percentage
		FROM user_announcement_reads r
		WHERE r.announcement_id = $1
	`

	var readCount, totalUsers int
	var readPercentage float64

	err := h.db.QueryRow(query, id).Scan(&readCount, &totalUsers, &readPercentage)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get read stats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"announcement_id":  id,
		"read_count":       readCount,
		"total_users":      totalUsers,
		"read_percentage":  readPercentage,
		"unread_count":     totalUsers - readCount,
	})
}
