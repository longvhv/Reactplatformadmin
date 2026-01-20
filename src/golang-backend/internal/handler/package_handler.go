package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

type PackageHandler struct {
	service *service.PackageService
}

func NewPackageHandler(service *service.PackageService) *PackageHandler {
	return &PackageHandler{service: service}
}

func (h *PackageHandler) GetAll(c *gin.Context) {
	filters := models.PackageFilters{}

	if productID := c.Query("product_id"); productID != "" {
		filters.ProductID = &productID
	}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.PackageStatus(statusStr)
		filters.Status = &status
	}

	if cycleStr := c.Query("billing_cycle"); cycleStr != "" {
		cycle := models.BillingCycle(cycleStr)
		filters.BillingCycle = &cycle
	}

	if popularStr := c.Query("is_popular"); popularStr != "" {
		isPopular := popularStr == "true"
		filters.IsPopular = &isPopular
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	packages, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, packages)
}

func (h *PackageHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	pkg, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "package not found" || err.Error() == "invalid package ID format" {
			utils.NotFoundResponse(c, "Package")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, pkg)
}

func (h *PackageHandler) Create(c *gin.Context) {
	var req models.CreatePackageRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	pkg, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "package code already exists for this product" {
			utils.ErrorResponse(c, http.StatusConflict, "CODE_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, pkg)
}

func (h *PackageHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	pkg, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "package not found" || err.Error() == "invalid package ID format" {
			utils.NotFoundResponse(c, "Package")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, pkg)
}

func (h *PackageHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "package not found" || err.Error() == "invalid package ID format" {
			utils.NotFoundResponse(c, "Package")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
