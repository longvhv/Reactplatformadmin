package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantDomainService struct {
	domainRepo repository.TenantDomainRepository
}

func NewTenantDomainService(domainRepo repository.TenantDomainRepository) *TenantDomainService {
	return &TenantDomainService{
		domainRepo: domainRepo,
	}
}

type CreateTenantDomainRequest struct {
	TenantID           uuid.UUID `json:"tenant_id" binding:"required"`
	Domain             string    `json:"domain" binding:"required"`
	VerificationMethod string    `json:"verification_method"`
	Policy             string    `json:"policy"`
}

type UpdateTenantDomainRequest struct {
	Policy *string `json:"policy"`
}

// GetByID gets domain by ID
func (s *TenantDomainService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantDomain, error) {
	return s.domainRepo.GetByID(ctx, id)
}

// ListByTenant lists domains by tenant
func (s *TenantDomainService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.TenantDomain, int64, error) {
	offset := (page - 1) * limit
	return s.domainRepo.ListByTenant(ctx, tenantID, limit, offset)
}

// CreateDomain creates a new tenant domain
func (s *TenantDomainService) CreateDomain(ctx context.Context, req CreateTenantDomainRequest) (*models.TenantDomain, error) {
	// Normalize domain
	domain := strings.ToLower(strings.TrimSpace(req.Domain))
	if domain == "" {
		return nil, fmt.Errorf("domain is required")
	}

	// Check if domain already exists
	exists, err := s.domainRepo.ExistsByDomain(ctx, domain)
	if err != nil {
		return nil, fmt.Errorf("failed to check domain: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("domain already registered")
	}

	verificationMethod := req.VerificationMethod
	if verificationMethod == "" {
		verificationMethod = "DNS_TXT"
	}

	policy := req.Policy
	if policy == "" {
		policy = "NONE"
	}

	// Generate verification token
	verificationToken, err := generateVerificationToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	tenantDomain := &models.TenantDomain{
		ID:                 uuid.New(),
		TenantID:           req.TenantID,
		Domain:             domain,
		VerificationStatus: "PENDING",
		VerificationMethod: &verificationMethod,
		VerificationToken:  &verificationToken,
		Policy:             policy,
		CreatedAt:          time.Now(),
	}

	if err := s.domainRepo.Create(ctx, tenantDomain); err != nil {
		return nil, fmt.Errorf("failed to create domain: %w", err)
	}

	return tenantDomain, nil
}

// UpdateDomain updates a tenant domain
func (s *TenantDomainService) UpdateDomain(ctx context.Context, id uuid.UUID, req UpdateTenantDomainRequest) (*models.TenantDomain, error) {
	domain, err := s.domainRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("domain not found: %w", err)
	}

	if req.Policy != nil {
		domain.Policy = *req.Policy
	}

	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, fmt.Errorf("failed to update domain: %w", err)
	}

	return domain, nil
}

// DeleteDomain deletes a tenant domain
func (s *TenantDomainService) DeleteDomain(ctx context.Context, id uuid.UUID) error {
	return s.domainRepo.Delete(ctx, id)
}

// VerifyDomain verifies domain ownership
func (s *TenantDomainService) VerifyDomain(ctx context.Context, id uuid.UUID) (*models.TenantDomain, error) {
	domain, err := s.domainRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("domain not found: %w", err)
	}

	if domain.VerificationStatus == "VERIFIED" {
		return domain, nil
	}

	// Perform verification based on method
	verified := false
	if domain.VerificationMethod != nil {
		switch *domain.VerificationMethod {
		case "DNS_TXT":
			verified, err = s.verifyDNSTXT(domain.Domain, *domain.VerificationToken)
		case "HTML_FILE":
			verified, err = s.verifyHTMLFile(domain.Domain, *domain.VerificationToken)
		}
	}

	if err != nil {
		return nil, fmt.Errorf("verification failed: %w", err)
	}

	if verified {
		domain.VerificationStatus = "VERIFIED"
		now := time.Now()
		domain.VerifiedAt = &now

		if err := s.domainRepo.Update(ctx, domain); err != nil {
			return nil, fmt.Errorf("failed to update domain: %w", err)
		}
	} else {
		return nil, fmt.Errorf("domain verification failed")
	}

	return domain, nil
}

// GetVerificationInfo gets verification instructions
func (s *TenantDomainService) GetVerificationInfo(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	domain, err := s.domainRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("domain not found: %w", err)
	}

	info := map[string]interface{}{
		"domain":              domain.Domain,
		"verification_status": domain.VerificationStatus,
		"verification_method": domain.VerificationMethod,
	}

	if domain.VerificationToken != nil && domain.VerificationMethod != nil {
		switch *domain.VerificationMethod {
		case "DNS_TXT":
			info["instructions"] = map[string]string{
				"type":  "DNS_TXT",
				"host":  "_vhv-verification." + domain.Domain,
				"value": *domain.VerificationToken,
				"ttl":   "3600",
			}
		case "HTML_FILE":
			info["instructions"] = map[string]string{
				"type":     "HTML_FILE",
				"path":     "/.well-known/vhv-verification.txt",
				"content":  *domain.VerificationToken,
				"full_url": fmt.Sprintf("https://%s/.well-known/vhv-verification.txt", domain.Domain),
			}
		}
	}

	return info, nil
}

// Verification methods
func (s *TenantDomainService) verifyDNSTXT(domain, expectedToken string) (bool, error) {
	// Look up TXT records for _vhv-verification subdomain
	txtRecords, err := net.LookupTXT("_vhv-verification." + domain)
	if err != nil {
		return false, err
	}

	// Check if any record matches the token
	for _, record := range txtRecords {
		if record == expectedToken {
			return true, nil
		}
	}

	return false, nil
}

func (s *TenantDomainService) verifyHTMLFile(domain, expectedToken string) (bool, error) {
	// TODO: Implement HTTP verification
	// This would fetch https://domain/.well-known/vhv-verification.txt
	// and check if it contains the expectedToken
	
	// For now, return false as placeholder
	return false, fmt.Errorf("HTML file verification not yet implemented")
}

// Helper functions
func generateVerificationToken() (string, error) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
