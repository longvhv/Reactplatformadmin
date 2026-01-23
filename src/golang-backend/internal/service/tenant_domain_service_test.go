package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockTenantDomainRepository is a mock of TenantDomainRepository
type MockTenantDomainRepository struct {
	mock.Mock
}

func (m *MockTenantDomainRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantDomain, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantDomain), args.Error(1)
}

func (m *MockTenantDomainRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantDomain, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantDomain), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantDomainRepository) ExistsByDomain(ctx context.Context, domain string) (bool, error) {
	args := m.Called(ctx, domain)
	return args.Bool(0), args.Error(1)
}

func (m *MockTenantDomainRepository) Create(ctx context.Context, domain *models.TenantDomain) error {
	args := m.Called(ctx, domain)
	return args.Error(0)
}

func (m *MockTenantDomainRepository) Update(ctx context.Context, domain *models.TenantDomain) error {
	args := m.Called(ctx, domain)
	return args.Error(0)
}

func (m *MockTenantDomainRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestTenantDomainService_CreateDomain(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantDomainRequest{
			TenantID: tenantID,
			Domain:   "example.com",
		}

		mockRepo.On("ExistsByDomain", ctx, "example.com").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantDomain")).Return(nil).Once()

		domain, err := service.CreateDomain(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, domain)
		assert.Equal(t, "example.com", domain.Domain)
		assert.Equal(t, "PENDING", domain.VerificationStatus)
		assert.NotNil(t, domain.VerificationMethod)
		assert.Equal(t, "DNS_TXT", *domain.VerificationMethod)
		assert.Equal(t, "NONE", domain.Policy)
		assert.NotNil(t, domain.VerificationToken)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom values", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantDomainRequest{
			TenantID:           tenantID,
			Domain:             "CUSTOM.COM", // Test normalization
			VerificationMethod: "HTML_FILE",
			Policy:             "SSO_REQUIRED",
		}

		mockRepo.On("ExistsByDomain", ctx, "custom.com").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantDomain")).Return(nil).Once()

		domain, err := service.CreateDomain(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "custom.com", domain.Domain) // Normalized
		assert.Equal(t, "HTML_FILE", *domain.VerificationMethod)
		assert.Equal(t, "SSO_REQUIRED", domain.Policy)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty domain", func(t *testing.T) {
		req := CreateTenantDomainRequest{
			TenantID: uuid.New(),
			Domain:   "   ",
		}

		domain, err := service.CreateDomain(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, domain)
		assert.Contains(t, err.Error(), "domain is required")
	})

	t.Run("duplicate domain", func(t *testing.T) {
		req := CreateTenantDomainRequest{
			TenantID: uuid.New(),
			Domain:   "existing.com",
		}

		mockRepo.On("ExistsByDomain", ctx, "existing.com").Return(true, nil).Once()

		domain, err := service.CreateDomain(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, domain)
		assert.Contains(t, err.Error(), "already registered")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateTenantDomainRequest{
			TenantID: uuid.New(),
			Domain:   "test.com",
		}

		mockRepo.On("ExistsByDomain", ctx, "test.com").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantDomain")).Return(errors.New("db error")).Once()

		domain, err := service.CreateDomain(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, domain)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantDomainService_UpdateDomain(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		domainID := uuid.New()
		existing := &models.TenantDomain{
			ID:     domainID,
			Domain: "example.com",
			Policy: "NONE",
		}

		newPolicy := "SSO_REQUIRED"
		req := UpdateTenantDomainRequest{
			Policy: &newPolicy,
		}

		mockRepo.On("GetByID", ctx, domainID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantDomain")).Return(nil).Once()

		domain, err := service.UpdateDomain(ctx, domainID, req)

		assert.NoError(t, err)
		assert.NotNil(t, domain)
		assert.Equal(t, "SSO_REQUIRED", domain.Policy)
		mockRepo.AssertExpectations(t)
	})

	t.Run("domain not found", func(t *testing.T) {
		domainID := uuid.New()
		req := UpdateTenantDomainRequest{}

		mockRepo.On("GetByID", ctx, domainID).Return(nil, errors.New("not found")).Once()

		domain, err := service.UpdateDomain(ctx, domainID, req)

		assert.Error(t, err)
		assert.Nil(t, domain)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantDomainService_VerifyDomain(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("already verified", func(t *testing.T) {
		domainID := uuid.New()
		verifiedTime := time.Now()
		existing := &models.TenantDomain{
			ID:                 domainID,
			Domain:             "example.com",
			VerificationStatus: "VERIFIED",
			VerifiedAt:         &verifiedTime,
		}

		mockRepo.On("GetByID", ctx, domainID).Return(existing, nil).Once()

		domain, err := service.VerifyDomain(ctx, domainID)

		assert.NoError(t, err)
		assert.NotNil(t, domain)
		assert.Equal(t, "VERIFIED", domain.VerificationStatus)
		mockRepo.AssertExpectations(t)
	})

	t.Run("domain not found", func(t *testing.T) {
		domainID := uuid.New()
		mockRepo.On("GetByID", ctx, domainID).Return(nil, errors.New("not found")).Once()

		domain, err := service.VerifyDomain(ctx, domainID)

		assert.Error(t, err)
		assert.Nil(t, domain)
		mockRepo.AssertExpectations(t)
	})

	// Note: Full DNS verification testing would require mocking net.LookupTXT
	// which is complex. We test the basic flow here.
}

func TestTenantDomainService_GetVerificationInfo(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("success - DNS_TXT", func(t *testing.T) {
		domainID := uuid.New()
		method := "DNS_TXT"
		token := "abc123def456"
		existing := &models.TenantDomain{
			ID:                 domainID,
			Domain:             "example.com",
			VerificationStatus: "PENDING",
			VerificationMethod: &method,
			VerificationToken:  &token,
		}

		mockRepo.On("GetByID", ctx, domainID).Return(existing, nil).Once()

		info, err := service.GetVerificationInfo(ctx, domainID)

		assert.NoError(t, err)
		assert.NotNil(t, info)
		assert.Equal(t, "example.com", info["domain"])
		assert.Equal(t, "PENDING", info["verification_status"])
		assert.NotNil(t, info["instructions"])

		instructions := info["instructions"].(map[string]string)
		assert.Equal(t, "DNS_TXT", instructions["type"])
		assert.Equal(t, "_vhv-verification.example.com", instructions["host"])
		assert.Equal(t, token, instructions["value"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - HTML_FILE", func(t *testing.T) {
		domainID := uuid.New()
		method := "HTML_FILE"
		token := "xyz789abc"
		existing := &models.TenantDomain{
			ID:                 domainID,
			Domain:             "custom.com",
			VerificationStatus: "PENDING",
			VerificationMethod: &method,
			VerificationToken:  &token,
		}

		mockRepo.On("GetByID", ctx, domainID).Return(existing, nil).Once()

		info, err := service.GetVerificationInfo(ctx, domainID)

		assert.NoError(t, err)
		assert.NotNil(t, info)

		instructions := info["instructions"].(map[string]string)
		assert.Equal(t, "HTML_FILE", instructions["type"])
		assert.Equal(t, "/.well-known/vhv-verification.txt", instructions["path"])
		assert.Equal(t, token, instructions["content"])
		assert.Contains(t, instructions["full_url"], "custom.com")
		mockRepo.AssertExpectations(t)
	})

	t.Run("domain not found", func(t *testing.T) {
		domainID := uuid.New()
		mockRepo.On("GetByID", ctx, domainID).Return(nil, errors.New("not found")).Once()

		info, err := service.GetVerificationInfo(ctx, domainID)

		assert.Error(t, err)
		assert.Nil(t, info)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantDomainService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		domainID := uuid.New()
		expected := &models.TenantDomain{
			ID:     domainID,
			Domain: "example.com",
		}

		mockRepo.On("GetByID", ctx, domainID).Return(expected, nil).Once()

		domain, err := service.GetByID(ctx, domainID)

		assert.NoError(t, err)
		assert.NotNil(t, domain)
		assert.Equal(t, domainID, domain.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		domainID := uuid.New()
		mockRepo.On("GetByID", ctx, domainID).Return(nil, errors.New("not found")).Once()

		domain, err := service.GetByID(ctx, domainID)

		assert.Error(t, err)
		assert.Nil(t, domain)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantDomainService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantDomain{
			{ID: uuid.New(), Domain: "example.com"},
			{ID: uuid.New(), Domain: "custom.com"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, 10, 0).Return(expected, int64(2), nil).Once()

		domains, total, err := service.ListByTenant(ctx, tenantID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, domains, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		tenantID := uuid.New()

		mockRepo.On("ListByTenant", ctx, tenantID, 10, 0).Return([]*models.TenantDomain{}, int64(0), nil).Once()

		domains, total, err := service.ListByTenant(ctx, tenantID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, domains, 0)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantDomainService_DeleteDomain(t *testing.T) {
	mockRepo := new(MockTenantDomainRepository)
	service := NewTenantDomainService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		domainID := uuid.New()

		mockRepo.On("Delete", ctx, domainID).Return(nil).Once()

		err := service.DeleteDomain(ctx, domainID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		domainID := uuid.New()

		mockRepo.On("Delete", ctx, domainID).Return(errors.New("db error")).Once()

		err := service.DeleteDomain(ctx, domainID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}
