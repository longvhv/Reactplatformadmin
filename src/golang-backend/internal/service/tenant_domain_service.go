package service

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type TenantDomainService struct {
	repo *repository.TenantDomainRepository
}

func NewTenantDomainService(repo *repository.TenantDomainRepository) *TenantDomainService {
	return &TenantDomainService{repo: repo}
}

func (s *TenantDomainService) CreateDomain(req *models.CreateTenantDomainRequest) (*models.TenantDomain, error) {
	// Check if domain already exists
	existing, err := s.repo.GetByDomain(req.Domain)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("domain already exists")
	}

	domain := &models.TenantDomain{
		ID:                 uuid.New().String(),
		TenantID:           req.TenantID,
		Domain:             req.Domain,
		VerificationStatus: "PENDING",
		VerificationMethod: req.VerificationMethod,
		VerificationToken:  stringPtr(uuid.New().String()),
		Policy:             req.Policy,
	}

	err = s.repo.Create(domain)
	if err != nil {
		return nil, err
	}

	return domain, nil
}

func (s *TenantDomainService) GetDomain(id string) (*models.TenantDomain, error) {
	return s.repo.GetByID(id)
}

func (s *TenantDomainService) GetDomainByName(domain string) (*models.TenantDomain, error) {
	return s.repo.GetByDomain(domain)
}

func (s *TenantDomainService) ListDomains(tenantID *string, verificationStatus *string, page, pageSize int) ([]models.TenantDomain, int, error) {
	return s.repo.List(tenantID, verificationStatus, page, pageSize)
}

func (s *TenantDomainService) ListDomainsByTenant(tenantID string) ([]models.TenantDomain, error) {
	return s.repo.ListByTenantID(tenantID)
}

func (s *TenantDomainService) UpdateDomain(id string, req *models.UpdateTenantDomainRequest) error {
	return s.repo.Update(id, req)
}

func (s *TenantDomainService) DeleteDomain(id string) error {
	return s.repo.Delete(id)
}

func (s *TenantDomainService) VerifyDomain(id string) error {
	verified := "VERIFIED"
	req := &models.UpdateTenantDomainRequest{
		VerificationStatus: &verified,
	}
	return s.repo.Update(id, req)
}

func stringPtr(s string) *string {
	return &s
}
