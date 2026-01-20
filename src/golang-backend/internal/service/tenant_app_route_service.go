package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type TenantAppRouteService interface {
	CreateRoute(ctx context.Context, req *models.CreateTenantAppRouteRequest) (*models.TenantAppRoute, error)
	GetRoute(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error)
	ListRoutes(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode, status *string) ([]*models.TenantAppRoute, int, error)
	ListRoutesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantAppRoute, error)
	ListRoutesByAppCode(ctx context.Context, appCode string) ([]*models.TenantAppRoute, error)
	GetRouteByDomain(ctx context.Context, domain string) (*models.TenantAppRoute, error)
	GetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantAppRoute, error)
	UpdateRoute(ctx context.Context, id uuid.UUID, req *models.UpdateTenantAppRouteRequest) (*models.TenantAppRoute, error)
	SetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string, routeID uuid.UUID) error
	UpdateSSLStatus(ctx context.Context, id uuid.UUID, sslStatus string) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	DeleteRoute(ctx context.Context, id uuid.UUID) error
}

type tenantAppRouteService struct {
	repo repository.TenantAppRouteRepository
}

func NewTenantAppRouteService(repo repository.TenantAppRouteRepository) TenantAppRouteService {
	return &tenantAppRouteService{repo: repo}
}

func (s *tenantAppRouteService) CreateRoute(ctx context.Context, req *models.CreateTenantAppRouteRequest) (*models.TenantAppRoute, error) {
	now := time.Now()
	route := &models.TenantAppRoute{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		AppCode:        req.AppCode,
		Domain:         req.Domain,
		PathPrefix:     "/",
		IsPrimary:      req.IsPrimary,
		IsCustomDomain: req.IsCustomDomain,
		SSLStatus:      "NONE",
		Status:         "ACTIVE",
		RouteScope:     "SPECIFIC_DOMAIN",
		CreatedAt:      now,
		UpdatedAt:      now,
		Version:        1,
	}

	if req.PathPrefix != "" {
		route.PathPrefix = req.PathPrefix
	}

	if req.RouteScope != "" {
		route.RouteScope = req.RouteScope
	}

	// Set SSL status for custom domains
	if req.IsCustomDomain {
		route.SSLStatus = "PENDING"
		route.Status = "PENDING_DNS"
	}

	if err := s.repo.Create(ctx, route); err != nil {
		return nil, fmt.Errorf("failed to create app route: %w", err)
	}

	return route, nil
}

func (s *tenantAppRouteService) GetRoute(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *tenantAppRouteService) ListRoutes(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode, status *string) ([]*models.TenantAppRoute, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, appCode, status)
}

func (s *tenantAppRouteService) ListRoutesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantAppRoute, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *tenantAppRouteService) ListRoutesByAppCode(ctx context.Context, appCode string) ([]*models.TenantAppRoute, error) {
	return s.repo.ListByAppCode(ctx, appCode)
}

func (s *tenantAppRouteService) GetRouteByDomain(ctx context.Context, domain string) (*models.TenantAppRoute, error) {
	return s.repo.GetByDomain(ctx, domain)
}

func (s *tenantAppRouteService) GetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantAppRoute, error) {
	return s.repo.GetPrimaryRoute(ctx, tenantID, appCode)
}

func (s *tenantAppRouteService) UpdateRoute(ctx context.Context, id uuid.UUID, req *models.UpdateTenantAppRouteRequest) (*models.TenantAppRoute, error) {
	route, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.PathPrefix != nil {
		route.PathPrefix = *req.PathPrefix
	}

	if req.IsPrimary != nil {
		route.IsPrimary = *req.IsPrimary
	}

	if req.IsCustomDomain != nil {
		route.IsCustomDomain = *req.IsCustomDomain
	}

	if req.SSLStatus != nil {
		route.SSLStatus = *req.SSLStatus
	}

	if req.Status != nil {
		route.Status = *req.Status
	}

	if req.RouteScope != nil {
		route.RouteScope = *req.RouteScope
	}

	route.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, route); err != nil {
		return nil, fmt.Errorf("failed to update app route: %w", err)
	}

	return route, nil
}

func (s *tenantAppRouteService) SetPrimaryRoute(ctx context.Context, tenantID uuid.UUID, appCode string, routeID uuid.UUID) error {
	return s.repo.SetPrimary(ctx, tenantID, appCode, routeID)
}

func (s *tenantAppRouteService) UpdateSSLStatus(ctx context.Context, id uuid.UUID, sslStatus string) error {
	return s.repo.UpdateSSLStatus(ctx, id, sslStatus)
}

func (s *tenantAppRouteService) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *tenantAppRouteService) DeleteRoute(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
