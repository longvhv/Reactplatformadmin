package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type SystemAnnouncementRepository interface {
	Create(ctx context.Context, announcement *models.SystemAnnouncement) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.SystemAnnouncement, int, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error)
	ListPublished(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error)
	Update(ctx context.Context, announcement *models.SystemAnnouncement) error
	Delete(ctx context.Context, id uuid.UUID) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error
	Publish(ctx context.Context, id uuid.UUID) error
	IncrementView(ctx context.Context, id uuid.UUID) error
	IncrementClick(ctx context.Context, id uuid.UUID) error
}

type systemAnnouncementRepository struct {
	db *sqlx.DB
}

func NewSystemAnnouncementRepository(db *sqlx.DB) SystemAnnouncementRepository {
	return &systemAnnouncementRepository{db: db}
}

func (r *systemAnnouncementRepository) Create(ctx context.Context, announcement *models.SystemAnnouncement) error {
	query := `
		INSERT INTO system_announcements (
			_id, tenant_id, title, content, type, priority, category, status,
			is_published, is_pinned, start_date, end_date, target_audience,
			display_location, icon, color, link_url, link_text, attachments,
			metadata, view_count, click_count, created_at, created_by,
			updated_at, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
		)`

	_, err := r.db.ExecContext(ctx, query,
		announcement.ID, announcement.TenantID, announcement.Title, announcement.Content,
		announcement.Type, announcement.Priority, announcement.Category, announcement.Status,
		announcement.IsPublished, announcement.IsPinned, announcement.StartDate,
		announcement.EndDate, announcement.TargetAudience, announcement.DisplayLocation,
		announcement.Icon, announcement.Color, announcement.LinkURL, announcement.LinkText,
		announcement.Attachments, announcement.Metadata, announcement.ViewCount,
		announcement.ClickCount, announcement.CreatedAt, announcement.CreatedBy,
		announcement.UpdatedAt, announcement.Version,
	)
	return err
}

func (r *systemAnnouncementRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error) {
	var announcement models.SystemAnnouncement
	query := `SELECT * FROM system_announcements WHERE _id = $1 AND deleted_at IS NULL`
	err := r.db.GetContext(ctx, &announcement, query, id)
	if err != nil {
		return nil, err
	}
	return &announcement, nil
}

func (r *systemAnnouncementRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.SystemAnnouncement, int, error) {
	offset := (page - 1) * pageSize

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM system_announcements %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM system_announcements %s
		ORDER BY is_pinned DESC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	var announcements []*models.SystemAnnouncement
	err = r.db.SelectContext(ctx, &announcements, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return announcements, total, nil
}

func (r *systemAnnouncementRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error) {
	query := `
		SELECT * FROM system_announcements
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY is_pinned DESC, created_at DESC
	`

	var announcements []*models.SystemAnnouncement
	err := r.db.SelectContext(ctx, &announcements, query, tenantID)
	if err != nil {
		return nil, err
	}

	return announcements, nil
}

func (r *systemAnnouncementRepository) ListPublished(ctx context.Context, tenantID uuid.UUID) ([]*models.SystemAnnouncement, error) {
	now := time.Now()
	query := `
		SELECT * FROM system_announcements
		WHERE tenant_id = $1
		AND is_published = true
		AND status = 'published'
		AND deleted_at IS NULL
		AND (start_date IS NULL OR start_date <= $2)
		AND (end_date IS NULL OR end_date >= $2)
		ORDER BY is_pinned DESC, created_at DESC
	`

	var announcements []*models.SystemAnnouncement
	err := r.db.SelectContext(ctx, &announcements, query, tenantID, now)
	if err != nil {
		return nil, err
	}

	return announcements, nil
}

func (r *systemAnnouncementRepository) Update(ctx context.Context, announcement *models.SystemAnnouncement) error {
	query := `
		UPDATE system_announcements SET
			title = $1, content = $2, type = $3, priority = $4, category = $5,
			status = $6, is_pinned = $7, start_date = $8, end_date = $9,
			target_audience = $10, display_location = $11, icon = $12, color = $13,
			link_url = $14, link_text = $15, attachments = $16, metadata = $17,
			updated_at = $18, updated_by = $19, version = version + 1
		WHERE _id = $20 AND deleted_at IS NULL`

	announcement.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		announcement.Title, announcement.Content, announcement.Type, announcement.Priority,
		announcement.Category, announcement.Status, announcement.IsPinned,
		announcement.StartDate, announcement.EndDate, announcement.TargetAudience,
		announcement.DisplayLocation, announcement.Icon, announcement.Color,
		announcement.LinkURL, announcement.LinkText, announcement.Attachments,
		announcement.Metadata, announcement.UpdatedAt, announcement.UpdatedBy, announcement.ID,
	)
	return err
}

func (r *systemAnnouncementRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM system_announcements WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *systemAnnouncementRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	query := `
		UPDATE system_announcements SET
			deleted_at = $1, deleted_by = $2, version = version + 1
		WHERE _id = $3 AND deleted_at IS NULL`

	_, err := r.db.ExecContext(ctx, query, time.Now(), deletedBy, id)
	return err
}

func (r *systemAnnouncementRepository) Publish(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE system_announcements SET
			is_published = true,
			published_at = $1,
			status = 'published',
			updated_at = $1,
			version = version + 1
		WHERE _id = $2`

	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

func (r *systemAnnouncementRepository) IncrementView(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE system_announcements SET view_count = view_count + 1 WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *systemAnnouncementRepository) IncrementClick(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE system_announcements SET click_count = click_count + 1 WHERE _id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
