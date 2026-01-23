package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantAppRouteService struct {
	routeRepo repository.TenantAppRouteRepository
}

func NewTenantAppRouteService(routeRepo repository.TenantAppRouteRepository) *TenantAppRouteService {
	return &TenantAppRouteService{
		routeRepo: routeRepo,
	}
}

type CreateTenantAppRouteRequest struct {
	TenantID        uuid.UUID `json:"tenant_id" binding:"required"`
	AppCode         string    `json:"app_code" binding:"required"`
	Domain          string    `json:"domain" binding:"required"`
	PathPrefix      string    `json:"path_prefix"`
	IsPrimary       bool      `json:"is_primary"`
	IsCustomDomain  bool      `json:"is_custom_domain"`
	RouteScope      string    `json:"route_scope"`
}

type UpdateTenantAppRouteRequest struct {
	PathPrefix *string `json:"path_prefix"`
	Status     *string `json:"status"`
	RouteScope *string `json:"route_scope"`
}

// GetByID gets route by ID
func (s *TenantAppRouteService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error) {
	return s.routeRepo.GetByID(ctx, id)
}

// GetByDomain gets route by domain
func (s *TenantAppRouteService) GetByDomain(ctx context.Context, domain string) (*models.TenantAppRoute, error) {
	return s.routeRepo.GetByDomain(ctx, domain)
}

// ListByTenant lists routes by tenant
func (s *TenantAppRouteService) ListByTenant(ctx context.Context, tenantID uuid.UUID, appCode, status string, page, limit int) ([]*models.TenantAppRoute, int64, error) {
	offset := (page - 1) * limit
	return s.routeRepo.ListByTenant(ctx, tenantID, appCode, status, limit, offset)
}

// CreateRoute creates a new route
func (s *TenantAppRouteService) CreateRoute(ctx context.Context, req CreateTenantAppRouteRequest) (*models.TenantAppRoute, error) {
	// Check if domain already exists
	existing, err := s.routeRepo.GetByDomain(ctx, req.Domain)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("domain already exists")
	}

	pathPrefix := req.PathPrefix
	if pathPrefix == "" {
		pathPrefix = "/"
	}

	routeScope := req.RouteScope
	if routeScope == "" {
		routeScope = "SPECIFIC_DOMAIN"
	}

	sslStatus := "NONE"
	if req.IsCustomDomain {
		sslStatus = "PENDING"
	}

	status := "ACTIVE"
	if req.IsCustomDomain {
		status = "PENDING_DNS"
	}

	route := &models.TenantAppRoute{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		AppCode:        req.AppCode,
		Domain:         req.Domain,
		PathPrefix:     pathPrefix,
		IsPrimary:      req.IsPrimary,
		IsCustomDomain: req.IsCustomDomain,
		SSLStatus:      sslStatus,
		Status:         status,
		RouteScope:     routeScope,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Version:        1,
	}

	// If setting as primary, unset other primary routes
	if req.IsPrimary {
		if err := s.routeRepo.UnsetPrimary(ctx, req.TenantID, req.AppCode); err != nil {
			return nil, fmt.Errorf("failed to unset existing primary: %w", err)
		}
	}

	if err := s.routeRepo.Create(ctx, route); err != nil {
		return nil, fmt.Errorf("failed to create route: %w", err)
	}

	// Trigger DNS verification if custom domain
	if req.IsCustomDomain {
		go s.verifyDNS(context.Background(), route)
	}

	return route, nil
}

// UpdateRoute updates a route
func (s *TenantAppRouteService) UpdateRoute(ctx context.Context, id uuid.UUID, req UpdateTenantAppRouteRequest) (*models.TenantAppRoute, error) {
	route, err := s.routeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("route not found: %w", err)
	}

	if req.PathPrefix != nil {
		route.PathPrefix = *req.PathPrefix
	}
	if req.Status != nil {
		route.Status = *req.Status
	}
	if req.RouteScope != nil {
		route.RouteScope = *req.RouteScope
	}

	route.UpdatedAt = time.Now()
	route.Version++

	if err := s.routeRepo.Update(ctx, route); err != nil {
		return nil, fmt.Errorf("failed to update route: %w", err)
	}

	return route, nil
}

// DeleteRoute deletes a route
func (s *TenantAppRouteService) DeleteRoute(ctx context.Context, id uuid.UUID) error {
	route, err := s.routeRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("route not found: %w", err)
	}

	if route.IsPrimary {
		return fmt.Errorf("cannot delete primary route")
	}

	return s.routeRepo.Delete(ctx, id)
}

// SetPrimary sets a route as primary
func (s *TenantAppRouteService) SetPrimary(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error) {
	route, err := s.routeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("route not found: %w", err)
	}

	if route.IsPrimary {
		return route, nil
	}

	// Unset existing primary
	if err := s.routeRepo.UnsetPrimary(ctx, route.TenantID, route.AppCode); err != nil {
		return nil, fmt.Errorf("failed to unset existing primary: %w", err)
	}

	route.IsPrimary = true
	route.UpdatedAt = time.Now()
	route.Version++

	if err := s.routeRepo.Update(ctx, route); err != nil {
		return nil, fmt.Errorf("failed to set primary: %w", err)
	}

	return route, nil
}

// VerifySSL initiates SSL verification
func (s *TenantAppRouteService) VerifySSL(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error) {
	route, err := s.routeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("route not found: %w", err)
	}

	if !route.IsCustomDomain {
		return nil, fmt.Errorf("SSL verification only for custom domains")
	}

	route.SSLStatus = "PENDING"
	route.UpdatedAt = time.Now()
	route.Version++

	if err := s.routeRepo.Update(ctx, route); err != nil {
		return nil, fmt.Errorf("failed to update SSL status: %w", err)
	}

	// Trigger SSL verification process
	go s.verifySSLCertificate(context.Background(), route)

	return route, nil
}

// verifyDNS verifies DNS configuration (simulation)
func (s *TenantAppRouteService) verifyDNS(ctx context.Context, route *models.TenantAppRoute) {
	// Simulate DNS verification
	time.Sleep(10 * time.Second)

	route.Status = "ACTIVE"
	route.UpdatedAt = time.Now()

	_ = s.routeRepo.Update(ctx, route)
}

// verifySSLCertificate verifies SSL certificate (simulation)
func (s *TenantAppRouteService) verifySSLCertificate(ctx context.Context, route *models.TenantAppRoute) {
	// Simulate SSL verification
	time.Sleep(15 * time.Second)

	route.SSLStatus = "ACTIVE"
	route.UpdatedAt = time.Now()

	_ = s.routeRepo.Update(ctx, route)
}

// GetPrimaryRoute gets primary route for tenant and app
func (s *TenantAppRouteService) GetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantAppRoute, error) {
	return s.routeRepo.GetPrimary(ctx, tenantID, appCode)
}
