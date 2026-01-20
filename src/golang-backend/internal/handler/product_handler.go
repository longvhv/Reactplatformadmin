package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

type ProductHandler struct {
	service *service.ProductService
}

func NewProductHandler(service *service.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) GetAll(c *gin.Context) {
	filters := models.ProductFilters{}

	if appID := c.Query("application_id"); appID != "" {
		filters.ApplicationID = &appID
	}

	if typeStr := c.Query("type"); typeStr != "" {
		productType := models.ProductType(typeStr)
		filters.Type = &productType
	}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.ProductStatus(statusStr)
		filters.Status = &status
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	products, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, products)
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	product, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "product not found" || err.Error() == "invalid product ID format" {
			utils.NotFoundResponse(c, "Product")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var req models.CreateProductRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	product, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "product code already exists for this application" {
			utils.ErrorResponse(c, http.StatusConflict, "CODE_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	product, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "product not found" || err.Error() == "invalid product ID format" {
			utils.NotFoundResponse(c, "Product")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "product not found" || err.Error() == "invalid product ID format" {
			utils.NotFoundResponse(c, "Product")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
