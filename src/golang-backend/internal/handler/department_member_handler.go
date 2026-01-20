package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

type DepartmentMemberHandler struct {
	service service.DepartmentMemberService
}

func NewDepartmentMemberHandler(service service.DepartmentMemberService) *DepartmentMemberHandler {
	return &DepartmentMemberHandler{service: service}
}

func (h *DepartmentMemberHandler) AddMember(c *gin.Context) {
	var req models.CreateDepartmentMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.service.AddMember(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, member)
}

func (h *DepartmentMemberHandler) ListMembers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID *uuid.UUID
	if tenantIDStr := c.Query("tenant_id"); tenantIDStr != "" {
		parsed, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id"})
			return
		}
		tenantID = &parsed
	}

	var departmentID *uuid.UUID
	if deptIDStr := c.Query("department_id"); deptIDStr != "" {
		parsed, err := uuid.Parse(deptIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department_id"})
			return
		}
		departmentID = &parsed
	}

	var tenantMemberID *uuid.UUID
	if memberIDStr := c.Query("tenant_member_id"); memberIDStr != "" {
		parsed, err := uuid.Parse(memberIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_member_id"})
			return
		}
		tenantMemberID = &parsed
	}

	members, total, err := h.service.ListMembers(c.Request.Context(), page, pageSize, tenantID, departmentID, tenantMemberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      members,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *DepartmentMemberHandler) GetMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	member, err := h.service.GetMember(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

func (h *DepartmentMemberHandler) UpdateMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	var req models.UpdateDepartmentMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.service.UpdateMember(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

func (h *DepartmentMemberHandler) RemoveMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	if err := h.service.RemoveMember(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "member removed successfully"})
}

func (h *DepartmentMemberHandler) ListByDepartment(c *gin.Context) {
	departmentID, err := uuid.Parse(c.Param("department_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department ID"})
		return
	}

	members, err := h.service.ListMembersByDepartment(c.Request.Context(), departmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": members})
}

func (h *DepartmentMemberHandler) GetActiveCount(c *gin.Context) {
	departmentID, err := uuid.Parse(c.Param("department_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department ID"})
		return
	}

	count, err := h.service.GetActiveCount(c.Request.Context(), departmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"department_id": departmentID,
		"active_count":  count,
	})
}
