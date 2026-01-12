# System Categories - Use Cases Documentation

## Overview
This document outlines the use cases for the System Category Management feature.

---

## UC-SC-001: View System Categories List

### Description
User views a paginated and filterable list of all system categories.

### Actors
- Super Administrator
- Tenant Administrator (read-only)

### Preconditions
- User is authenticated
- User has appropriate permissions

### Main Flow
1. User navigates to System Categories page
2. System retrieves all system categories from database
3. System displays categories in card grid layout with:
   - Category name and code
   - Type and group badges
   - Status indicator
   - System protection badge (if applicable)
4. User can apply filters:
   - By type
   - By category group
   - By status
   - By search query (name, code, description)
5. System updates the list based on applied filters

### Postconditions
- System categories are displayed with filtering options
- Statistics cards show summary metrics

### Alternative Flows
**3a. No categories exist**
- System displays empty state message
- User can click "Add System Category" button

### Related APIs
- `GET /api/v1/system-categories` - List categories with filters
- `GET /api/v1/system-categories/types` - Get available types
- `GET /api/v1/system-categories/groups` - Get available groups

---

## UC-SC-002: View System Category Details

### Description
User views detailed information about a specific system category.

### Actors
- Super Administrator
- Tenant Administrator

### Preconditions
- User is authenticated
- System category exists

### Main Flow
1. User clicks on a system category card
2. System retrieves category details by ID
3. System displays detailed information:
   - Basic Information (code, name, type, group)
   - Status and editability settings
   - Description
   - Metadata (if available)
   - Timestamps (created_at, updated_at)
4. If category is system-protected, show warning badge

### Postconditions
- User can view all category details
- Edit and Delete buttons shown based on permissions

### Alternative Flows
**2a. Category not found**
- System displays error notification
- System redirects to category list

### Related APIs
- `GET /api/v1/system-categories/:id` - Get category details

---

## UC-SC-003: Create System Category

### Description
Administrator creates a new system category.

### Actors
- Super Administrator

### Preconditions
- User is authenticated as Super Administrator
- User has create permissions

### Main Flow
1. User clicks "Add System Category" button
2. System displays creation form with fields:
   - Code (required, auto-uppercase)
   - Name (required)
   - Type (required, dropdown)
   - Category Group (required, dropdown)
   - Description (optional)
   - Order (optional, default 0)
   - Status (active/inactive)
   - Is Editable (toggle)
   - Metadata (JSON, optional)
3. User fills in the form
4. System validates input:
   - Code format (uppercase, numbers, underscores)
   - Code uniqueness
   - Required fields
   - JSON metadata format
5. User clicks "Create Category"
6. System creates new category with is_system=true
7. System displays success notification
8. System navigates to category list

### Postconditions
- New system category is created
- Category appears in the list
- Success notification is shown

### Alternative Flows
**4a. Validation fails**
- System displays error messages
- Form remains populated with user input
- User corrects errors and resubmits

**4b. Code already exists**
- System displays "Code already exists" error
- User must choose a different code

### Exception Flows
**6a. Database error**
- System displays generic error message
- Transaction is rolled back
- No category is created

### Related APIs
- `POST /api/v1/system-categories` - Create new category
- `GET /api/v1/system-categories/types` - Get available types
- `GET /api/v1/system-categories/groups` - Get available groups

---

## UC-SC-004: Update System Category

### Description
Administrator updates an existing editable system category.

### Actors
- Super Administrator

### Preconditions
- User is authenticated as Super Administrator
- System category exists
- Category is editable (is_editable=true)

### Main Flow
1. User clicks "Edit" button on category detail page
2. System checks if category is editable
3. System displays edit form pre-filled with current data
4. User modifies allowed fields:
   - Name
   - Description
   - Order
   - Status
   - Metadata
5. System validates changes
6. User clicks "Update Category"
7. System updates category
8. System displays success notification
9. System navigates to category detail page

### Postconditions
- System category is updated
- updated_at timestamp is refreshed
- Changes are reflected immediately

### Alternative Flows
**2a. Category is system-protected**
- System displays warning message
- Edit form is disabled
- Only view mode is available

**5a. Validation fails**
- System displays error messages
- User corrects errors and resubmits

### Exception Flows
**7a. Concurrent update conflict**
- System detects version mismatch
- System displays conflict error
- User must reload and retry

### Related APIs
- `GET /api/v1/system-categories/:id` - Get current data
- `PUT /api/v1/system-categories/:id` - Update category

---

## UC-SC-005: Delete System Category

### Description
Administrator deletes an editable system category.

### Actors
- Super Administrator

### Preconditions
- User is authenticated as Super Administrator
- System category exists
- Category is editable (is_editable=true)
- Category is not in use by other entities

### Main Flow
1. User clicks "Delete" button on category detail page
2. System checks if category is editable
3. System displays confirmation dialog with warning message
4. User confirms deletion
5. System checks if category is referenced elsewhere
6. System deletes category
7. System displays success notification
8. System navigates to category list

### Postconditions
- System category is permanently deleted
- Category no longer appears in lists

### Alternative Flows
**2a. Category is system-protected**
- Delete button is not shown
- User cannot initiate deletion

**5a. Category is in use**
- System displays error message
- Deletion is prevented
- User must remove references first

**4a. User cancels**
- Dialog closes
- No changes are made

### Exception Flows
**6a. Database error**
- System displays error message
- Transaction is rolled back
- Category is not deleted

### Related APIs
- `DELETE /api/v1/system-categories/:id` - Delete category

---

## UC-SC-006: Filter and Search Categories

### Description
User filters and searches system categories by various criteria.

### Actors
- Super Administrator
- Tenant Administrator

### Preconditions
- User is on system categories page
- Categories exist in the system

### Main Flow
1. User enters search query or selects filters
2. System applies filters in real-time:
   - Search by name, code, or description
   - Filter by type
   - Filter by category group
   - Filter by status
3. System updates the displayed list
4. System shows count of filtered results
5. User can clear all filters to reset view

### Postconditions
- Only matching categories are displayed
- Filter selections are preserved during session

### Alternative Flows
**3a. No matches found**
- System displays "No results" message
- User can adjust filters or clear them

### Related APIs
- `GET /api/v1/system-categories?search=...&type=...&category_group=...&status=...`

---

## UC-SC-007: View System Category Types and Groups

### Description
System displays available category types and groups for selection.

### Actors
- Super Administrator

### Preconditions
- User is creating or filtering categories

### Main Flow
1. User opens type or group dropdown
2. System retrieves available options from database
3. System displays unique types/groups alphabetically
4. User selects desired option

### Postconditions
- User can select from valid options only

### Related APIs
- `GET /api/v1/system-categories/types` - Get types
- `GET /api/v1/system-categories/groups` - Get groups

---

## Business Rules

### BR-SC-001: Code Format
- Category codes must be uppercase letters, numbers, and underscores only
- Code must be unique across all system categories
- Code cannot be changed after creation

### BR-SC-002: System Protection
- All system categories have is_system=true
- Categories with is_editable=false cannot be modified or deleted
- These protect core system functionality

### BR-SC-003: Order Management
- Order must be a non-negative integer
- Lower numbers appear first in sorted lists
- Multiple categories can have the same order

### BR-SC-004: Status
- Only 'active' and 'inactive' statuses are allowed
- Inactive categories are hidden in most system operations
- Status can be changed for editable categories

### BR-SC-005: Metadata
- Must be valid JSON object if provided
- No size limit but should be reasonable
- Used for extending category attributes

### BR-SC-006: Deletion Protection
- Cannot delete if category is in use by other entities
- Cannot delete system-protected categories
- Hard delete only (no soft delete)

---

## Priority & Status

| Use Case | Priority | Status |
|----------|----------|--------|
| UC-SC-001 | High | Completed |
| UC-SC-002 | High | Completed |
| UC-SC-003 | High | Completed |
| UC-SC-004 | High | Completed |
| UC-SC-005 | Medium | Completed |
| UC-SC-006 | Medium | Completed |
| UC-SC-007 | Low | Completed |

---

## Future Enhancements

1. **UC-SC-008: Bulk Operations**
   - Import/export system categories
   - Bulk status updates
   - Bulk ordering

2. **UC-SC-009: Category History**
   - Track all changes to categories
   - View audit trail
   - Restore previous versions

3. **UC-SC-010: Category Dependencies**
   - View where category is used
   - Impact analysis before deletion
   - Relationship visualization

4. **UC-SC-011: Category Templates**
   - Pre-defined category sets
   - Quick setup for common scenarios
   - Industry-specific templates
