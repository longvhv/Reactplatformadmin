package service

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type TenantApplicationService struct {
	repo *repository.TenantApplicationRepository
}

func NewTenantApplicationService(repo *repository.TenantApplicationRepository) *TenantApplicationService {
	return &TenantApplicationService{repo: repo}
}

func (s *TenantApplicationService) CreateApplication(req *models.CreateTenantApplicationRequest) (*models.TenantApplication, error) {
	// Check if application already exists for this tenant
	existing, err := s.repo.GetByTenantAndApp(req.TenantID, req.AppCode)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("application already exists for this tenant")
	}

	app := &models.TenantApplication{
		ID:          uuid.New().String(),
		TenantID:    req.TenantID,
		AppCode:     req.AppCode,
		IsActive:    req.IsActive,
		LicenseType: req.LicenseType,
		MaxUsers:    req.MaxUsers,
		ExpiresAt:   req.ExpiresAt,
		Settings:    req.Settings,
		CreatedBy:   req.CreatedBy,
	}

	err = s.repo.Create(app)
	if err != nil {
		return nil, err
	}

	return app, nil
}

func (s *TenantApplicationService) GetApplication(id string) (*models.TenantApplication, error) {
	return s.repo.GetByID(id)
}

func (s *TenantApplicationService) GetApplicationByTenantAndApp(tenantID, appCode string) (*models.TenantApplication, error) {
	return s.repo.GetByTenantAndApp(tenantID, appCode)
}

func (s *TenantApplicationService) ListApplications(tenantID *string, appCode *string, isActive *bool, page, pageSize int) ([]models.TenantApplication, int, error) {
	return s.repo.List(tenantID, appCode, isActive, page, pageSize)
}

func (s *TenantApplicationService) ListApplicationsByTenant(tenantID string) ([]models.TenantApplication, error) {
	return s.repo.ListByTenantID(tenantID)
}

func (s *TenantApplicationService) UpdateApplication(id string, req *models.UpdateTenantApplicationRequest) error {
	return s.repo.Update(id, req)
}

func (s *TenantApplicationService) DeleteApplication(id string, deletedBy *string) error {
	return s.repo.Delete(id, deletedBy)
}

func (s *TenantApplicationService) ActivateApplication(id string) error {
	return s.repo.Activate(id)
}

func (s *TenantApplicationService) DeactivateApplication(id string) error {
	return s.repo.Deactivate(id)
}
