package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type TenantAppRouteHandler struct {
	routeService *service.TenantAppRouteService
	authzService *service.AuthorizationService
}

func NewTenantAppRouteHandler(routeService *service.TenantAppRouteService, authzService *service.AuthorizationService) *TenantAppRouteHandler {
	return &TenantAppRouteHandler{
		routeService: routeService,
		authzService: authzService,
	}
}

// List lists tenant app routes
func (h *TenantAppRouteHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	appCode := c.Query("app_code")
	status := c.Query("status")

	routes, total, err := h.routeService.ListByTenant(ctx, tenantID, appCode, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, routes, total, page, limit)
}

// GetByID gets route by ID
func (h *TenantAppRouteHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	routeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid route id", nil)
		return
	}

	route, err := h.routeService.GetByID(ctx, routeID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "route not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, route)
}

// GetByDomain gets route by domain
func (h *TenantAppRouteHandler) GetByDomain(c *gin.Context) {
	ctx := c.Request.Context()

	domain := c.Param("domain")
	if domain == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "domain required", nil)
		return
	}

	route, err := h.routeService.GetByDomain(ctx, domain)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "route not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, route)
}

// Create creates a route
func (h *TenantAppRouteHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantAppRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	route, err := h.routeService.CreateRoute(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, route)
}

// Update updates a route
func (h *TenantAppRouteHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	routeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid route id", nil)
		return
	}

	var req service.UpdateTenantAppRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	route, err := h.routeService.UpdateRoute(ctx, routeID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, route)
}

// Delete deletes a route
func (h *TenantAppRouteHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	routeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid route id", nil)
		return
	}

	if err := h.routeService.DeleteRoute(ctx, routeID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "route deleted successfully"})
}

// SetPrimary sets a route as primary
func (h *TenantAppRouteHandler) SetPrimary(c *gin.Context) {
	ctx := c.Request.Context()

	routeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid route id", nil)
		return
	}

	route, err := h.routeService.SetPrimary(ctx, routeID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, route)
}

// VerifySSL initiates SSL verification
func (h *TenantAppRouteHandler) VerifySSL(c *gin.Context) {
	ctx := c.Request.Context()

	routeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid route id", nil)
		return
	}

	route, err := h.routeService.VerifySSL(ctx, routeID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, route)
}
