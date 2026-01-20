package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type UserMFAMethodService interface {
	CreateMFAMethod(ctx context.Context, req *models.CreateUserMFAMethodRequest) (*models.UserMFAMethod, error)
	GetMFAMethod(ctx context.Context, id uuid.UUID) (*models.UserMFAMethod, error)
	ListMFAMethods(ctx context.Context, page, pageSize int, userID *uuid.UUID, methodType, status *string) ([]*models.UserMFAMethod, int, error)
	ListMFAMethodsByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserMFAMethod, error)
	GetPrimaryMethod(ctx context.Context, userID uuid.UUID) (*models.UserMFAMethod, error)
	UpdateMFAMethod(ctx context.Context, id uuid.UUID, req *models.UpdateUserMFAMethodRequest) (*models.UserMFAMethod, error)
	DeleteMFAMethod(ctx context.Context, id uuid.UUID) error
	ActivateMFAMethod(ctx context.Context, id uuid.UUID) error
	DeactivateMFAMethod(ctx context.Context, id uuid.UUID) error
	VerifyMFAMethod(ctx context.Context, id uuid.UUID) error
	SetPrimaryMethod(ctx context.Context, userID, methodID uuid.UUID) error
	RecordMFAUsage(ctx context.Context, id uuid.UUID, success bool) error
}

type userMFAMethodService struct {
	repo repository.UserMFAMethodRepository
}

func NewUserMFAMethodService(repo repository.UserMFAMethodRepository) UserMFAMethodService {
	return &userMFAMethodService{repo: repo}
}

func (s *userMFAMethodService) CreateMFAMethod(ctx context.Context, req *models.CreateUserMFAMethodRequest) (*models.UserMFAMethod, error) {
	now := time.Now()
	method := &models.UserMFAMethod{
		ID:               uuid.New(),
		UserID:           req.UserID,
		MethodType:       req.MethodType,
		Status:           "PENDING",
		IsVerified:       false,
		IsPrimary:        req.IsPrimary,
		IsEnforced:       req.IsEnforced,
		SuccessCount:     0,
		FailureCount:     0,
		BackupCodesUsed:  0,
		BackupCodesTotal: 10,
		CreatedAt:        now,
		UpdatedAt:        now,
		Version:          1,
	}

	if req.MethodName != "" {
		method.MethodName.String = req.MethodName
		method.MethodName.Valid = true
	}

	if req.SMSPhoneNumber != "" {
		method.SMSPhoneNumber.String = req.SMSPhoneNumber
		method.SMSPhoneNumber.Valid = true
		method.SMSPhoneVerified = false
	}

	if req.EmailAddress != "" {
		method.EmailAddress.String = req.EmailAddress
		method.EmailAddress.Valid = true
		method.EmailVerified = false
	}

	if req.DeviceName != "" {
		method.DeviceName.String = req.DeviceName
		method.DeviceName.Valid = true
	}

	if req.DeviceType != "" {
		method.DeviceType.String = req.DeviceType
		method.DeviceType.Valid = true
	}

	if req.BackupCodesTotal > 0 {
		method.BackupCodesTotal = req.BackupCodesTotal
	}

	// Set metadata
	metadata := map[string]interface{}{}
	metadataJSON, _ := json.Marshal(metadata)
	method.Metadata = metadataJSON

	if err := s.repo.Create(ctx, method); err != nil {
		return nil, fmt.Errorf("failed to create MFA method: %w", err)
	}

	return method, nil
}

func (s *userMFAMethodService) GetMFAMethod(ctx context.Context, id uuid.UUID) (*models.UserMFAMethod, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userMFAMethodService) ListMFAMethods(ctx context.Context, page, pageSize int, userID *uuid.UUID, methodType, status *string) ([]*models.UserMFAMethod, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, userID, methodType, status)
}

func (s *userMFAMethodService) ListMFAMethodsByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserMFAMethod, error) {
	return s.repo.ListByUserID(ctx, userID)
}

func (s *userMFAMethodService) GetPrimaryMethod(ctx context.Context, userID uuid.UUID) (*models.UserMFAMethod, error) {
	return s.repo.GetPrimaryMethod(ctx, userID)
}

func (s *userMFAMethodService) UpdateMFAMethod(ctx context.Context, id uuid.UUID, req *models.UpdateUserMFAMethodRequest) (*models.UserMFAMethod, error) {
	method, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.MethodName != nil {
		if *req.MethodName == "" {
			method.MethodName.Valid = false
		} else {
			method.MethodName.String = *req.MethodName
			method.MethodName.Valid = true
		}
	}

	if req.Status != nil {
		method.Status = *req.Status
	}

	if req.IsPrimary != nil {
		method.IsPrimary = *req.IsPrimary
	}

	if req.IsEnforced != nil {
		method.IsEnforced = *req.IsEnforced
	}

	if req.SMSPhoneNumber != nil {
		if *req.SMSPhoneNumber == "" {
			method.SMSPhoneNumber.Valid = false
		} else {
			method.SMSPhoneNumber.String = *req.SMSPhoneNumber
			method.SMSPhoneNumber.Valid = true
		}
	}

	if req.SMSPhoneVerified != nil {
		method.SMSPhoneVerified = *req.SMSPhoneVerified
	}

	if req.EmailAddress != nil {
		if *req.EmailAddress == "" {
			method.EmailAddress.Valid = false
		} else {
			method.EmailAddress.String = *req.EmailAddress
			method.EmailAddress.Valid = true
		}
	}

	if req.EmailVerified != nil {
		method.EmailVerified = *req.EmailVerified
	}

	method.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, method); err != nil {
		return nil, fmt.Errorf("failed to update MFA method: %w", err)
	}

	return method, nil
}

func (s *userMFAMethodService) DeleteMFAMethod(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *userMFAMethodService) ActivateMFAMethod(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, "ACTIVE")
}

func (s *userMFAMethodService) DeactivateMFAMethod(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, "INACTIVE")
}

func (s *userMFAMethodService) VerifyMFAMethod(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.UpdateVerificationStatus(ctx, id, true); err != nil {
		return err
	}
	// Also activate the method after verification
	return s.repo.UpdateStatus(ctx, id, "ACTIVE")
}

func (s *userMFAMethodService) SetPrimaryMethod(ctx context.Context, userID, methodID uuid.UUID) error {
	return s.repo.SetPrimary(ctx, userID, methodID)
}

func (s *userMFAMethodService) RecordMFAUsage(ctx context.Context, id uuid.UUID, success bool) error {
	return s.repo.UpdateUsageStats(ctx, id, success)
}
