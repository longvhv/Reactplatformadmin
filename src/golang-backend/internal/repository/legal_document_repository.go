package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type LegalDocumentRepository interface {
	Create(ctx context.Context, doc *models.LegalDocument) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error)
	GetBySlug(ctx context.Context, slug string) (*models.LegalDocument, error)
	List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, docType, status, language *string) ([]*models.LegalDocument, int, error)
	Update(ctx context.Context, doc *models.LegalDocument) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByType(ctx context.Context, docType string) ([]*models.LegalDocument, error)
	ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.LegalDocument, error)
	ListPublished(ctx context.Context) ([]*models.LegalDocument, error)
	GetLatestByType(ctx context.Context, docType string, language string) (*models.LegalDocument, error)
	Publish(ctx context.Context, id, publishedBy uuid.UUID) error
	Archive(ctx context.Context, id uuid.UUID) error
	IncrementViewCount(ctx context.Context, id uuid.UUID) error
	IncrementAcceptCount(ctx context.Context, id uuid.UUID) error
}

type legalDocumentRepository struct {
	db *sqlx.DB
}

func NewLegalDocumentRepository(db *sqlx.DB) LegalDocumentRepository {
	return &legalDocumentRepository{db: db}
}

func (r *legalDocumentRepository) Create(ctx context.Context, doc *models.LegalDocument) error {
	query := `
		INSERT INTO legal_documents (
			_id, title, slug, type, version, content, summary, status,
			effective_date, expiry_date, tenant_id, language, is_active,
			view_count, accept_count, created_by, updated_by, metadata,
			created_at, updated_at
		) VALUES (
			:_id, :title, :slug, :type, :version, :content, :summary, :status,
			:effective_date, :expiry_date, :tenant_id, :language, :is_active,
			:view_count, :accept_count, :created_by, :updated_by, :metadata,
			:created_at, :updated_at
		)`

	_, err := r.db.NamedExecContext(ctx, query, doc)
	return err
}

func (r *legalDocumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error) {
	var doc models.LegalDocument
	query := `SELECT * FROM legal_documents WHERE _id = $1`

	err := r.db.GetContext(ctx, &doc, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("legal document not found")
	}
	return &doc, err
}

func (r *legalDocumentRepository) GetBySlug(ctx context.Context, slug string) (*models.LegalDocument, error) {
	var doc models.LegalDocument
	query := `SELECT * FROM legal_documents WHERE slug = $1`

	err := r.db.GetContext(ctx, &doc, query, slug)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("legal document not found")
	}
	return &doc, err
}

func (r *legalDocumentRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, docType, status, language *string) ([]*models.LegalDocument, int, error) {
	var docs []*models.LegalDocument
	var total int

	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if tenantID != nil {
		whereClause += fmt.Sprintf(" AND tenant_id = $%d", argPos)
		args = append(args, *tenantID)
		argPos++
	}

	if docType != nil {
		whereClause += fmt.Sprintf(" AND type = $%d", argPos)
		args = append(args, *docType)
		argPos++
	}

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	if language != nil {
		whereClause += fmt.Sprintf(" AND language = $%d", argPos)
		args = append(args, *language)
		argPos++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM legal_documents %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT * FROM legal_documents %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)
	err = r.db.SelectContext(ctx, &docs, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return docs, total, nil
}

func (r *legalDocumentRepository) Update(ctx context.Context, doc *models.LegalDocument) error {
	query := `
		UPDATE legal_documents SET
			title = :title,
			content = :content,
			summary = :summary,
			version = :version,
			effective_date = :effective_date,
			expiry_date = :expiry_date,
			language = :language,
			is_active = :is_active,
			updated_by = :updated_by,
			metadata = :metadata,
			updated_at = :updated_at
		WHERE _id = :_id`

	result, err := r.db.NamedExecContext(ctx, query, doc)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("legal document not found")
	}

	return nil
}

func (r *legalDocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM legal_documents WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("legal document not found")
	}

	return nil
}

func (r *legalDocumentRepository) ListByType(ctx context.Context, docType string) ([]*models.LegalDocument, error) {
	var docs []*models.LegalDocument
	query := `
		SELECT * FROM legal_documents
		WHERE type = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &docs, query, docType)
	return docs, err
}

func (r *legalDocumentRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID) ([]*models.LegalDocument, error) {
	var docs []*models.LegalDocument
	query := `
		SELECT * FROM legal_documents
		WHERE tenant_id = $1
		ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &docs, query, tenantID)
	return docs, err
}

func (r *legalDocumentRepository) ListPublished(ctx context.Context) ([]*models.LegalDocument, error) {
	var docs []*models.LegalDocument
	query := `
		SELECT * FROM legal_documents
		WHERE status = 'published' AND is_active = true
		ORDER BY published_at DESC`

	err := r.db.SelectContext(ctx, &docs, query)
	return docs, err
}

func (r *legalDocumentRepository) GetLatestByType(ctx context.Context, docType string, language string) (*models.LegalDocument, error) {
	var doc models.LegalDocument
	query := `
		SELECT * FROM legal_documents
		WHERE type = $1
		  AND language = $2
		  AND status = 'published'
		  AND is_active = true
		ORDER BY published_at DESC
		LIMIT 1`

	err := r.db.GetContext(ctx, &doc, query, docType, language)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no published document found")
	}
	return &doc, err
}

func (r *legalDocumentRepository) Publish(ctx context.Context, id, publishedBy uuid.UUID) error {
	query := `
		UPDATE legal_documents
		SET status = 'published',
		    published_by = $1,
		    published_at = NOW(),
		    updated_at = NOW()
		WHERE _id = $2`

	result, err := r.db.ExecContext(ctx, query, publishedBy, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("legal document not found")
	}

	return nil
}

func (r *legalDocumentRepository) Archive(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE legal_documents
		SET status = 'archived', is_active = false, updated_at = NOW()
		WHERE _id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("legal document not found")
	}

	return nil
}

func (r *legalDocumentRepository) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE legal_documents
		SET view_count = view_count + 1
		WHERE _id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *legalDocumentRepository) IncrementAcceptCount(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE legal_documents
		SET accept_count = accept_count + 1
		WHERE _id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
