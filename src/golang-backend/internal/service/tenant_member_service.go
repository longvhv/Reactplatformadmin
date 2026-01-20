package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type TenantMemberService struct {
	repo *repository.TenantMemberRepository
}

func NewTenantMemberService(repo *repository.TenantMemberRepository) *TenantMemberService {
	return &TenantMemberService{repo: repo}
}

// CreateMember creates a new tenant member
func (s *TenantMemberService) CreateMember(req *models.CreateTenantMemberRequest) (*models.TenantMember, error) {
	// Check if member already exists
	existing, _ := s.repo.GetByTenantAndUser(req.TenantID, req.UserID)
	if existing != nil {
		return nil, fmt.Errorf("user is already a member of this tenant")
	}

	member := &models.TenantMember{
		TenantID:     req.TenantID,
		UserID:       req.UserID,
		Role:         req.Role,
		Status:       req.Status,
		JoinedAt:     req.JoinedAt,
		ManagerID:    req.ManagerID,
		Permissions:  req.Permissions,
		Metadata:     req.Metadata,
	}

	if req.EmployeeCode != "" {
		member.EmployeeCode.String = req.EmployeeCode
		member.EmployeeCode.Valid = true
	}
	if req.InternalEmail != "" {
		member.InternalEmail.String = req.InternalEmail
		member.InternalEmail.Valid = true
	}
	if req.JobTitle != "" {
		member.JobTitle.String = req.JobTitle
		member.JobTitle.Valid = true
	}

	if member.Status == "" {
		member.Status = "ACTIVE"
	}
	if member.JoinedAt == nil {
		now := time.Now()
		member.JoinedAt = &now
	}
	if member.Permissions == nil {
		member.Permissions = models.JSONB("[]")
	}
	if member.Metadata == nil {
		member.Metadata = models.JSONB("{}")
	}

	err := s.repo.Create(member)
	if err != nil {
		return nil, err
	}

	return member, nil
}

// GetMember retrieves a tenant member by ID
func (s *TenantMemberService) GetMember(id uuid.UUID) (*models.TenantMember, error) {
	return s.repo.GetByID(id)
}

// GetMemberByTenantAndUser retrieves a tenant member by tenant and user ID
func (s *TenantMemberService) GetMemberByTenantAndUser(tenantID, userID uuid.UUID) (*models.TenantMember, error) {
	return s.repo.GetByTenantAndUser(tenantID, userID)
}

// ListMembers retrieves tenant members with pagination and filters
func (s *TenantMemberService) ListMembers(page, pageSize int, filters map[string]interface{}) ([]models.TenantMember, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	return s.repo.List(page, pageSize, filters)
}

// ListMembersByTenant retrieves all members of a specific tenant
func (s *TenantMemberService) ListMembersByTenant(tenantID uuid.UUID, page, pageSize int) ([]models.TenantMember, int, error) {
	return s.repo.ListByTenantID(tenantID, page, pageSize)
}

// UpdateMember updates a tenant member
func (s *TenantMemberService) UpdateMember(id uuid.UUID, req *models.UpdateTenantMemberRequest) (*models.TenantMember, error) {
	updates := make(map[string]interface{})

	if req.EmployeeCode != nil {
		updates["employee_code"] = *req.EmployeeCode
	}
	if req.InternalEmail != nil {
		updates["internal_email"] = *req.InternalEmail
	}
	if req.JobTitle != nil {
		updates["job_title"] = *req.JobTitle
	}
	if req.ManagerID != nil {
		updates["manager_id"] = *req.ManagerID
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.JoinedAt != nil {
		updates["joined_at"] = *req.JoinedAt
	}
	if req.LeftAt != nil {
		updates["left_at"] = *req.LeftAt
	}
	if req.Permissions != nil {
		updates["permissions"] = req.Permissions
	}
	if req.Metadata != nil {
		updates["metadata"] = req.Metadata
	}

	return s.repo.Update(id, updates)
}

// DeleteMember soft deletes a tenant member
func (s *TenantMemberService) DeleteMember(id uuid.UUID) error {
	return s.repo.Delete(id)
}

// UpdateMemberStatus updates the status of a tenant member
func (s *TenantMemberService) UpdateMemberStatus(id uuid.UUID, status string) error {
	// Validate status
	validStatuses := map[string]bool{
		"ACTIVE":     true,
		"RESIGNED":   true,
		"ONBOARDING": true,
		"SUSPENDED":  true,
	}

	if !validStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	return s.repo.UpdateStatus(id, status)
}

// UpdateMemberRole updates the role of a tenant member
func (s *TenantMemberService) UpdateMemberRole(id uuid.UUID, role string) error {
	// Validate role
	validRoles := map[string]bool{
		"OWNER":  true,
		"ADMIN":  true,
		"MEMBER": true,
		"VIEWER": true,
	}

	if !validRoles[role] {
		return fmt.Errorf("invalid role: %s", role)
	}

	return s.repo.UpdateRole(id, role)
}

// GetActiveCount returns the count of active members in a tenant
func (s *TenantMemberService) GetActiveCount(tenantID uuid.UUID) (int, error) {
	return s.repo.GetActiveCount(tenantID)
}
