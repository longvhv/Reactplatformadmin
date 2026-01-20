package service

import (
	"fmt"

	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type TenantSubscriptionService struct {
	repo *repository.TenantSubscriptionRepository
}

func NewTenantSubscriptionService(repo *repository.TenantSubscriptionRepository) *TenantSubscriptionService {
	return &TenantSubscriptionService{repo: repo}
}

func (s *TenantSubscriptionService) CreateSubscription(req *models.CreateTenantSubscriptionRequest) (*models.TenantSubscription, error) {
	// Validate dates
	if req.EndDate.Before(req.StartDate) {
		return nil, fmt.Errorf("end_date must be after start_date")
	}

	if req.TrialEndDate != nil && req.TrialEndDate.Before(req.StartDate) {
		return nil, fmt.Errorf("trial_end_date must be after start_date")
	}

	// Validate pricing
	if req.TotalAmount < 0 {
		return nil, fmt.Errorf("total_amount cannot be negative")
	}

	return s.repo.Create(req)
}

func (s *TenantSubscriptionService) GetSubscription(id string) (*models.TenantSubscription, error) {
	return s.repo.GetByID(id)
}

func (s *TenantSubscriptionService) ListSubscriptions(tenantID *string, status *string, page, pageSize int) ([]*models.TenantSubscription, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(tenantID, status, pageSize, offset)
}

func (s *TenantSubscriptionService) UpdateSubscription(id string, req *models.UpdateTenantSubscriptionRequest) (*models.TenantSubscription, error) {
	// Validate dates if provided
	if req.StartDate != nil && req.EndDate != nil && req.EndDate.Before(*req.StartDate) {
		return nil, fmt.Errorf("end_date must be after start_date")
	}

	return s.repo.Update(id, req)
}

func (s *TenantSubscriptionService) DeleteSubscription(id string) error {
	return s.repo.Delete(id)
}
