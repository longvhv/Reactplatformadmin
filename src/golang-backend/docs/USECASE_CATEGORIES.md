# Category Management Use Cases

## Overview
This document describes the use cases for the Category Management system, which provides classification and organization capabilities across the platform.

---

## UC-CAT-001: View Category List

### Description
User views a list of all categories with filtering and search capabilities.

### Actor
- System Administrator
- Manager
- User (read-only)

### Preconditions
- User is authenticated
- User has `categories.view` permission

### Main Flow
1. User navigates to Categories page (`/categories`)
2. System loads all categories from database
3. System displays categories in grid/list view showing:
   - Category name
   - Category code
   - Category type
   - Status badge
   - Description (truncated)
4. User can filter by:
   - Category type (dropdown)
   - Status (active/inactive)
5. User can search by:
   - Name
   - Code
   - Description
6. System updates displayed categories based on filters in real-time

### Postconditions
- Category list is displayed
- Filters are applied
- User can navigate to detail/edit pages

### Alternative Flows
**A1: No categories exist**
- System displays empty state with "Add Category" button

**A2: No results found**
- System displays "No results" message with option to clear filters

### Related APIs
- `GET /api/v1/categories`
- `GET /api/v1/categories/types`

### Priority
High

### Status
Completed

---

## UC-CAT-002: Create New Category

### Description
Administrator creates a new category to classify system entities.

### Actor
- System Administrator
- Manager

### Preconditions
- User is authenticated
- User has `categories.create` permission

### Main Flow
1. User clicks "Add Category" button
2. System navigates to Add Category page (`/categories/add`)
3. System displays category creation form with fields:
   - Code (required, unique)
   - Name (required)
   - Type (required, dropdown)
   - Description (optional)
   - Parent Category (optional, dropdown)
   - Order (optional, number)
   - Status (required, default: active)
   - Metadata (optional, JSON)
4. User fills in required fields
5. User clicks "Create" button
6. System validates input:
   - Code is unique
   - Code format: uppercase, numbers, underscores only
   - All required fields are filled
   - Metadata is valid JSON (if provided)
7. System sends POST request to API
8. API creates category in database
9. System displays success message
10. System redirects to category detail page

### Postconditions
- New category is created in database
- Category appears in category list
- User is redirected to detail page

### Alternative Flows
**A1: Validation fails**
1. System displays validation errors inline
2. User corrects errors
3. User resubmits form
4. Continue from step 6 in main flow

**A2: Code already exists**
1. API returns 409 Conflict error
2. System displays error message
3. User changes code
4. Continue from step 5 in main flow

**A3: User cancels**
1. User clicks "Cancel" button
2. System navigates back to categories list
3. No category is created

### Exception Flows
**E1: Network error**
1. System displays error message
2. Form data is preserved
3. User can retry submission

**E2: Server error**
1. System displays generic error message
2. User can retry or cancel

### Related APIs
- `POST /api/v1/categories`
- `GET /api/v1/categories` (for parent dropdown)

### Business Rules
- BR-CAT-001: Category code must be unique across all categories
- BR-CAT-002: Category code is immutable after creation
- BR-CAT-003: Parent category must be of same type
- BR-CAT-004: Maximum hierarchy depth is 10 levels

### Priority
High

### Status
Completed

---

## UC-CAT-003: Edit Category

### Description
User updates an existing category's information.

### Actor
- System Administrator
- Manager

### Preconditions
- User is authenticated
- User has `categories.edit` permission
- Category exists in system

### Main Flow
1. User navigates to category detail page
2. User clicks "Edit" button
3. System navigates to Edit Category page (`/categories/:id/edit`)
4. System loads category data
5. System pre-fills form with existing data
6. User modifies fields (except Code)
7. User clicks "Save" button
8. System validates input
9. System sends PUT request to API
10. API updates category in database
11. System displays success message
12. System redirects to category detail page

### Postconditions
- Category is updated in database
- Updated information is displayed
- Update timestamp is recorded

### Alternative Flows
**A1: Category not found**
1. System displays error message
2. User is redirected to categories list

**A2: User cancels edit**
1. User clicks "Cancel" button
2. System navigates to detail page
3. No changes are saved

### Exception Flows
**E1: Concurrent modification**
1. Another user modified the category
2. System displays conflict message
3. User can reload and retry

### Related APIs
- `GET /api/v1/categories/:id`
- `PUT /api/v1/categories/:id`

### Business Rules
- BR-CAT-005: Code field is read-only in edit mode
- BR-CAT-006: Cannot change parent if category has children

### Priority
High

### Status
Completed

---

## UC-CAT-004: Delete Category

### Description
User deletes a category from the system.

### Actor
- System Administrator

### Preconditions
- User is authenticated
- User has `categories.delete` permission
- Category exists and is not in use

### Main Flow
1. User views category detail or list page
2. User clicks "Delete" button
3. System displays confirmation dialog:
   - Warning message
   - "Are you sure?" prompt
   - Confirm/Cancel buttons
4. User clicks "Confirm"
5. System sends DELETE request to API
6. API checks if category is in use
7. API deletes category from database
8. System displays success message
9. System redirects to categories list

### Postconditions
- Category is permanently deleted
- Category no longer appears in lists
- Any references are handled according to cascading rules

### Alternative Flows
**A1: User cancels deletion**
1. User clicks "Cancel" in confirmation dialog
2. Dialog closes
3. No deletion occurs

### Exception Flows
**E1: Category is in use**
1. API returns 409 Conflict error
2. System displays error message explaining:
   - Category is being used
   - Cannot be deleted
   - Suggests deactivating instead
3. Deletion is cancelled

**E2: Category has children**
1. API returns 409 Conflict error
2. System displays error message
3. Suggests deleting children first
4. Deletion is cancelled

### Related APIs
- `DELETE /api/v1/categories/:id`

### Business Rules
- BR-CAT-007: Cannot delete category if it has child categories
- BR-CAT-008: Cannot delete category if it's referenced by other entities
- BR-CAT-009: Suggest status change to "inactive" instead of deletion

### Priority
Medium

### Status
Completed

---

## UC-CAT-005: View Category Details

### Description
User views detailed information about a specific category.

### Actor
- All authenticated users

### Preconditions
- User is authenticated
- Category exists

### Main Flow
1. User clicks on category from list
2. System navigates to detail page (`/categories/:id`)
3. System loads category data
4. System displays:
   - **Basic Information:**
     - Code
     - Name
     - Type
     - Status
   - **Hierarchy:**
     - Parent category (if exists)
     - Child categories count
   - **Settings:**
     - Order
     - Description
   - **Metadata:**
     - JSON data (formatted)
   - **Audit Information:**
     - Created date/time
     - Updated date/time
     - Created by
     - Updated by
5. System displays action buttons:
   - Edit (if has permission)
   - Delete (if has permission)
   - Back to list

### Postconditions
- Category details are displayed
- User can navigate to edit or back to list

### Alternative Flows
**A1: Category not found**
1. System displays 404 error
2. Provides link back to categories list

### Related APIs
- `GET /api/v1/categories/:id`

### Priority
High

### Status
Completed

---

## UC-CAT-006: Filter Categories by Type

### Description
User filters categories to view only specific type.

### Actor
- All authenticated users

### Preconditions
- User is on categories list page
- Categories exist in system

### Main Flow
1. User clicks type filter dropdown
2. System displays available types:
   - All Types
   - Tenant Type
   - User Role
   - User Status
   - Document Type
   - Priority Level
   - Status Type
   - Custom
3. User selects a type
4. System filters categories client-side
5. System updates displayed count
6. Only categories of selected type are shown

### Postconditions
- Filtered results are displayed
- Filter state is maintained during session
- Count reflects filtered results

### Alternative Flows
**A1: No categories of selected type**
1. System displays empty state
2. Shows message "No categories found for this type"

### Related APIs
- Uses client-side filtering (no API call)
- Initial data from `GET /api/v1/categories`

### Priority
Medium

### Status
Completed

---

## UC-CAT-007: Bulk Import Categories

### Description
Administrator imports multiple categories from JSON file.

### Actor
- System Administrator

### Preconditions
- User is authenticated
- User has `categories.create` permission
- Valid JSON file is prepared

### Main Flow
1. User clicks "Import" button
2. System displays file upload dialog
3. User selects JSON file
4. System validates file format
5. System previews categories to be imported
6. User confirms import
7. System sends bulk create request
8. API processes each category
9. System displays results:
   - Successful imports count
   - Failed imports with reasons
10. System refreshes category list

### Postconditions
- Valid categories are imported
- Import summary is displayed
- Category list is updated

### Exception Flows
**E1: Invalid file format**
1. System displays error message
2. User can select different file

**E2: Duplicate codes detected**
1. System skips duplicates
2. Reports in summary

### Related APIs
- `POST /api/v1/categories/bulk`

### Priority
Low

### Status
Planned

---

## Summary Table

| ID | Use Case | Actor | Priority | Status |
|----|----------|-------|----------|--------|
| UC-CAT-001 | View Category List | All Users | High | Completed |
| UC-CAT-002 | Create New Category | Admin/Manager | High | Completed |
| UC-CAT-003 | Edit Category | Admin/Manager | High | Completed |
| UC-CAT-004 | Delete Category | Admin | Medium | Completed |
| UC-CAT-005 | View Category Details | All Users | High | Completed |
| UC-CAT-006 | Filter Categories | All Users | Medium | Completed |
| UC-CAT-007 | Bulk Import | Admin | Low | Planned |

---

## Related Documentation
- [Category API Documentation](./API_CATEGORIES.md)
- [Database Schema](../migrations/005_create_categories_table.sql)
- [Frontend Implementation](/pages/CategoriesPage.tsx)
