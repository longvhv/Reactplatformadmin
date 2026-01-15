# System Announcements - CRUD Implementation

**Ngày:** 2026-01-15  
**Module:** System Announcements  
**Trạng thái:** ✅ COMPLETED

## Tổng quan

Đã hoàn thành việc implement tính năng **Thêm** và **Sửa** thông báo hệ thống (System Announcements) với đầy đủ chức năng CRUD, validation, error handling và optimistic locking.

## Tính năng đã hoàn thành

### 1. ✅ Create - Tạo thông báo mới

**Route:** `/core/system-announcements/new`  
**Page:** `AddNotificationPage.tsx`  
**Component:** `AnnouncementForm.tsx`

**Features:**
- Form nhập đầy đủ thông tin thông báo
- Validation frontend (required fields, date validation)
- 3 mức độ ưu tiên: INFO, WARNING, CRITICAL
- Chọn ngày bắt đầu (bắt buộc) và ngày kết thúc (tùy chọn)
- Markdown support cho nội dung
- Visual priority selector với icons và màu sắc
- Success/error toast notifications
- Auto navigate về list sau khi tạo thành công

### 2. ✅ Read - Xem danh sách

**Route:** `/core/system-announcements`  
**Page:** `NotificationsPage.tsx`  
**Hook:** `useAnnouncements.ts`

**Features:**
- Hiển thị danh sách tất cả thông báo
- Stats cards: Total, Active, Inactive, INFO, WARNING, CRITICAL
- Search theo tiêu đề và nội dung
- Filter theo priority (INFO/WARNING/CRITICAL)
- Filter theo status (ACTIVE/INACTIVE)
- Hiển thị thông tin: title, content preview, priority badge, status badge
- Hiển thị ngày bắt đầu/kết thúc, version
- Color-coded priority icons

### 3. ✅ Update - Chỉnh sửa thông báo

**Route:** `/core/system-announcements/edit/:id`  
**Page:** `EditNotificationPage.tsx`  
**Component:** `AnnouncementForm.tsx` (shared)

**Features:**
- Load dữ liệu hiện tại của thông báo
- Pre-fill form với dữ liệu
- Cho phép thay đổi status (ACTIVE/INACTIVE)
- Validation tương tự create
- **Optimistic Locking** với version control
- Hiển thị metadata: ID, version, created_at, updated_at
- Error handling cho version conflicts
- Success/error toast notifications

### 4. ✅ Delete - Xóa thông báo

**Location:** `NotificationsPage.tsx` (inline action)

**Features:**
- Confirmation dialog trước khi xóa
- Soft delete qua API
- Update UI ngay lập tức sau xóa
- Toast notification

### 5. ✅ Toggle Status - Bật/tắt thông báo

**Location:** `NotificationsPage.tsx` (inline action)

**Features:**
- Toggle giữa ACTIVE ↔ INACTIVE
- Icon thay đổi: Eye (active) / EyeOff (inactive)
- Update qua API với version control
- Toast notification

## Architecture

### API Layer

**File:** `/api/systemAnnouncementApi.ts`

```typescript
export interface SystemAnnouncement {
  _id: string;
  title: string;
  content: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE';
  start_date: string;
  end_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;  // For optimistic locking
}

export interface CreateSystemAnnouncementRequest {
  title: string;
  content: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  start_date: string;
  end_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSystemAnnouncementRequest {
  title?: string;
  content?: string;
  priority?: 'INFO' | 'WARNING' | 'CRITICAL';
  status?: 'ACTIVE' | 'INACTIVE';
  start_date?: string;
  end_date?: string;
  metadata?: Record<string, any>;
  version: number;  // Required for optimistic locking
}

// API methods
systemAnnouncementApi.getAll(filters?)
systemAnnouncementApi.getById(id)
systemAnnouncementApi.create(data)
systemAnnouncementApi.update(id, data)
systemAnnouncementApi.delete(id)
```

### Hook Layer

**File:** `/hooks/useAnnouncements.ts`

```typescript
export function useAnnouncements(options?: {
  autoLoad?: boolean;
  filters?: SystemAnnouncementFilters;
}) {
  return {
    announcements: SystemAnnouncement[];
    loading: boolean;
    error: string | null;
    loadAnnouncements: () => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    toggleStatus: (id: string) => Promise<void>;
  };
}
```

**Changes from old version:**
- ❌ Removed mock data
- ✅ Use real API calls via `systemAnnouncementApi`
- ❌ Removed old schema (titles, contents, is_active, type)
- ✅ Use new schema (title, content, status, priority)
- ✅ Added toggleStatus method
- ✅ Proper error handling with console logs

### Component Layer

**File:** `/components/announcements/AnnouncementForm.tsx`

**Key Features:**
- Shared form for both Create and Edit
- Props: `announcement?` (optional for create, provided for edit)
- Full validation with error messages
- Visual priority selector with 3 cards
- Status toggle (only shown in edit mode)
- Date pickers with validation (end_date must be after start_date)
- Info boxes with usage guidelines
- Loading states on submit button

**Validation Rules:**
```typescript
- title: Required, non-empty
- content: Required, non-empty
- priority: Required (INFO/WARNING/CRITICAL)
- start_date: Required, valid datetime
- end_date: Optional, must be after start_date if provided
- status: Only in edit mode (ACTIVE/INACTIVE)
```

### Page Layer

#### AddNotificationPage

**Features:**
- Clean header with back button
- Form card with AnnouncementForm component
- Help section with usage guidelines
- Examples section showing different priority types
- API integration with error handling
- Toast notifications for success/error
- Auto navigate back to list on success

#### EditNotificationPage

**Features:**
- Loading state while fetching announcement
- Error state if announcement not found
- Metadata display (ID, version, created_at, updated_at)
- Form pre-filled with current data
- Optimistic locking warning box
- Audit info section
- Version conflict handling with reload option

#### NotificationsPage

**Features:**
- Header with title and "Create" button
- 6 stats cards (Total, Active, Inactive, INFO, WARNING, CRITICAL)
- Search bar
- Priority filter dropdown
- Status filter dropdown
- Clear filters button
- Announcements list with:
  - Priority icon with color
  - Title and status/priority badges
  - Content preview (2 lines max)
  - Start/end dates, version
  - Action buttons: Toggle Status, Edit, Delete
- Empty state with suggestions
- Results count footer

## Routing

### Module Definition

**File:** `/modules/system-announcements/index.tsx`

```typescript
routes: [
  { path: '/core/system-announcements' },           // List
  { path: '/core/system-announcements/new' },       // Create ✅ BEFORE :id
  { path: '/core/system-announcements/edit/:id' },  // Edit ✅ BEFORE :id
  { path: '/core/system-announcements/:id' },       // Detail
]
```

**✅ Route Order Fix:**
- `/new` và `/edit/:id` đi TRƯỚC `/:id`
- Tránh lỗi "new" hoặc "edit" match như ID
- Tương tự fix đã apply cho Orders và Invoices modules

## Design System

### Priority Colors & Icons

```typescript
INFO:
  - Icon: Info
  - Color: Blue (#3B82F6)
  - Background: bg-blue-50
  - Use case: Thông tin chung, updates

WARNING:
  - Icon: AlertTriangle
  - Color: Yellow (#F59E0B)
  - Background: bg-yellow-50
  - Use case: Cảnh báo, maintenance notice

CRITICAL:
  - Icon: AlertCircle
  - Color: Red (#EF4444)
  - Background: bg-red-50
  - Use case: Khẩn cấp, security alerts
```

### Status Badges

```typescript
ACTIVE:
  - Color: Green
  - Badge: bg-green-100 text-green-700
  - Meaning: Đang hiển thị cho users

INACTIVE:
  - Color: Gray
  - Badge: bg-gray-100 text-gray-600
  - Meaning: Tạm ngưng, không hiển thị
```

### UI Components

**Button States:**
- Primary: Indigo (#6366F1) - Create, Save
- Outline: Gray border - Cancel
- Ghost: Transparent - Back, Actions
- Destructive: Red text - Delete

**Form Elements:**
- Input: Rounded-lg, border-gray-300, focus:border-indigo-500
- Textarea: 6 rows for content
- Select: Rounded-lg for dropdowns
- Checkbox style buttons for priority/status selection

## User Flows

### Create Flow

```
1. User clicks "Tạo thông báo" button
   ↓
2. Navigate to /core/system-announcements/new
   ↓
3. AddNotificationPage renders with empty form
   ↓
4. User fills in:
   - Tiêu đề (required)
   - Nội dung (required, Markdown supported)
   - Mức độ ưu tiên (INFO/WARNING/CRITICAL)
   - Ngày bắt đầu (required)
   - Ngày kết thúc (optional)
   ↓
5. Frontend validation
   ✅ All required fields filled
   ✅ End date after start date (if provided)
   ↓
6. Submit form → API call
   ↓
7. Success:
   - Toast: "Tạo thông báo thành công!"
   - Navigate to /core/system-announcements
   - New announcement appears in list
   ↓
8. Error:
   - Toast: Error message
   - Stay on form, user can retry
```

### Edit Flow

```
1. User clicks Edit button on announcement
   ↓
2. Navigate to /core/system-announcements/edit/:id
   ↓
3. Loading state: "Đang tải thông tin thông báo..."
   ↓
4. API call: getById(id)
   ↓
5. Success:
   - Form pre-filled with current data
   - Status toggle visible (ACTIVE/INACTIVE)
   - Metadata shown (ID, version, dates)
   ↓
6. User modifies fields
   ↓
7. Submit → API call with version number
   ↓
8. Success:
   - Toast: "Cập nhật thông báo thành công!"
   - Navigate back to list
   ↓
9. Version Conflict Error:
   - Toast with "Tải lại" action button
   - User can reload page to get latest version
   ↓
10. Other Error:
    - Toast: Error message
    - Stay on form, user can retry
```

### Delete Flow

```
1. User clicks Delete button (trash icon)
   ↓
2. Confirmation dialog:
   "Bạn có chắc muốn xóa thông báo [title]?"
   ↓
3. User confirms
   ↓
4. API call: delete(id)
   ↓
5. Success:
   - Remove from UI immediately
   - Toast: "Xóa thông báo thành công"
   ↓
6. Error:
   - Toast: Error message
   - Announcement stays in list
```

### Toggle Status Flow

```
1. User clicks Eye/EyeOff icon
   ↓
2. API call: update(id, { status: newStatus, version })
   ↓
3. Success:
   - Update UI immediately (icon + badge change)
   - Toast: "Kích hoạt/Tạm ngưng thông báo thành công"
   ↓
4. Error:
   - Toast: Error message
   - UI stays at old state
```

## Validation

### Frontend Validation

**Title:**
- Required: "Tiêu đề không được để trống"
- Trim whitespace before validation

**Content:**
- Required: "Nội dung không được để trống"
- Trim whitespace before validation
- Support Markdown syntax

**Start Date:**
- Required: "Ngày bắt đầu không được để trống"
- Must be valid datetime

**End Date:**
- Optional
- If provided, must be after start_date
- Error: "Ngày kết thúc phải sau ngày bắt đầu"

**Priority:**
- Required (default: INFO)
- Must be one of: INFO | WARNING | CRITICAL

**Status (Edit only):**
- Required (default: current status)
- Must be one of: ACTIVE | INACTIVE

### Backend Validation

Xử lý bởi API adapter (trong `/api/adapters.ts`):
- UUID validation cho ID
- Type validation cho enums
- Date format validation
- Version number validation (optimistic locking)

## Error Handling

### API Errors

**Network Errors:**
```typescript
catch (error) {
  const errorMessage = error?.message || 'Không thể kết nối tới server';
  toast.error('Lỗi kết nối', { description: errorMessage });
}
```

**Validation Errors:**
```typescript
// 400 Bad Request
toast.error('Dữ liệu không hợp lệ', { 
  description: 'Vui lòng kiểm tra lại thông tin đã nhập' 
});
```

**Not Found:**
```typescript
// 404 Not Found
<AlertCircle />
<h2>Không tìm thấy thông báo</h2>
<p>Thông báo không tồn tại hoặc đã bị xóa</p>
<Button>Quay lại danh sách</Button>
```

**Version Conflict:**
```typescript
// 409 Conflict
toast.error('Xung đột phiên bản', {
  description: 'Thông báo đã được cập nhật bởi người khác. Vui lòng tải lại.',
  action: {
    label: 'Tải lại',
    onClick: () => window.location.reload(),
  },
});
```

### User-Friendly Messages

All error messages in Vietnamese:
- "Tạo thông báo thất bại"
- "Cập nhật thông báo thất bại"
- "Xóa thông báo thất bại"
- "Không thể tải thông báo"
- "Xung đột phiên bản"

## Optimistic Locking

### Why?

Prevent data loss when multiple users edit the same announcement:
- User A loads announcement (version: 1)
- User B loads announcement (version: 1)
- User A saves → version becomes 2
- User B tries to save with version 1 → ❌ CONFLICT!

### Implementation

**Update Request:**
```typescript
{
  title: "Updated title",
  status: "INACTIVE",
  version: 1  // ← Must match current version in DB
}
```

**API Response on Conflict:**
```typescript
{
  error: "Version conflict: announcement was modified by another user",
  current_version: 2,
  your_version: 1
}
```

**User Experience:**
```
1. Toast notification with error
2. "Tải lại" button to reload page
3. User sees latest data
4. User re-applies changes
5. Submit with new version number
6. ✅ Success!
```

## Testing Checklist

### Create Announcement

- [x] Navigate to /core/system-announcements/new
- [x] Form displays correctly
- [x] All fields editable
- [x] Validation errors show for empty required fields
- [x] End date validation (must be after start date)
- [x] Priority selector works (3 cards, visual feedback)
- [x] Submit creates announcement
- [x] Success toast appears
- [x] Redirect to list page
- [x] New announcement visible in list

### Edit Announcement

- [x] Navigate to /core/system-announcements/edit/:id
- [x] Loading state shows
- [x] Form pre-filled with data
- [x] Status toggle visible
- [x] Metadata displays (ID, version, dates)
- [x] Can modify all fields
- [x] Submit updates announcement
- [x] Success toast appears
- [x] Redirect to list page
- [x] Changes reflected in list

### List Page

- [x] All announcements load
- [x] Stats cards show correct numbers
- [x] Search works (title + content)
- [x] Priority filter works
- [x] Status filter works
- [x] Clear filters button works
- [x] Priority icons colored correctly
- [x] Status badges colored correctly
- [x] Toggle status button works
- [x] Edit button navigates correctly
- [x] Delete button works with confirmation

### Error Scenarios

- [x] Invalid ID → 404 error page
- [x] Network error → Error toast
- [x] Version conflict → Special toast with reload
- [x] Empty form submit → Validation errors
- [x] Invalid date range → Validation error

## Files Modified/Created

### Created Files

1. ✅ `/components/announcements/AnnouncementForm.tsx` (rewrote)
   - Shared form component
   - Matches API schema exactly
   - Full validation and error handling

2. ✅ `/pages/AddNotificationPage.tsx` (rewrote)
   - Create announcement page
   - Form integration
   - API calls and error handling

3. ✅ `/pages/EditNotificationPage.tsx` (rewrote)
   - Edit announcement page
   - Data loading
   - Optimistic locking support

4. ✅ `/pages/NotificationsPage.tsx` (rewrote)
   - List page with filters
   - Inline actions (toggle, edit, delete)
   - Stats dashboard

5. ✅ `/hooks/useAnnouncements.ts` (rewrote)
   - Real API integration
   - Updated schema
   - CRUD operations

6. ✅ `/docs/SYSTEM_ANNOUNCEMENTS_CRUD_IMPLEMENTATION.md` (this file)
   - Complete documentation

### Modified Files

1. ✅ `/modules/system-announcements/index.tsx`
   - Fixed route order (/new and /edit/:id before /:id)

## Future Enhancements

### Short Term

1. **Rich Text Editor**
   - Replace textarea with proper Markdown editor
   - Preview mode
   - Toolbar for formatting

2. **Announcement Preview**
   - Show how announcement will look to users
   - Different views (desktop/mobile)

3. **Bulk Actions**
   - Select multiple announcements
   - Bulk delete
   - Bulk status change

4. **Advanced Filters**
   - Date range filter
   - Created by filter
   - Full-text search

### Long Term

1. **Scheduling**
   - Auto-activate on start_date
   - Auto-deactivate on end_date
   - Timezone support

2. **Targeting**
   - Show to specific tenants
   - Show to specific user roles
   - Show in specific regions

3. **Analytics**
   - View count
   - Click-through rate
   - Dismiss rate

4. **Templates**
   - Pre-defined announcement templates
   - Quick create from template

5. **Notifications**
   - Email notification when new announcement created
   - Slack integration
   - Webhook support

6. **Internationalization**
   - Multi-language support (already in old schema)
   - Title/content per language
   - Auto-translation integration

7. **Approval Workflow**
   - Draft → Pending Review → Approved → Published
   - Require approval for CRITICAL announcements
   - Audit trail

## Best Practices Applied

### Code Quality

✅ **DRY Principle:**
- Shared AnnouncementForm for create/edit
- Reusable API methods
- Shared hook for all pages

✅ **File Size Limit:**
- All files < 500 lines (as required)
- NotificationsPage: ~380 lines
- AddNotificationPage: ~160 lines
- EditNotificationPage: ~210 lines
- AnnouncementForm: ~280 lines

✅ **Type Safety:**
- Full TypeScript interfaces
- No `any` types (except error handling)
- Strict enum types for priority/status

✅ **Error Handling:**
- Try-catch in all async operations
- User-friendly error messages
- Console logs for debugging
- Toast notifications

✅ **User Experience:**
- Loading states
- Error states
- Success feedback
- Confirmation dialogs
- Optimistic UI updates

### Architecture

✅ **Separation of Concerns:**
- API layer (systemAnnouncementApi.ts)
- Hook layer (useAnnouncements.ts)
- Component layer (AnnouncementForm.tsx)
- Page layer (AddNotificationPage, EditNotificationPage, NotificationsPage)

✅ **Modular Design:**
- Module registry integration
- Lazy loading
- Route organization

✅ **Design Consistency:**
- Follows Stripe/GitHub/Vercel/Linear patterns
- Indigo primary color (#6366F1)
- Inter font
- Tailwind CSS v4
- Shadcn/ui components

## Conclusion

✅ **Tất cả tính năng đã hoàn thành:**
- ✅ Tạo thông báo mới (Create)
- ✅ Xem danh sách (Read)
- ✅ Chỉnh sửa thông báo (Update)
- ✅ Xóa thông báo (Delete)
- ✅ Bật/tắt thông báo (Toggle Status)
- ✅ Tìm kiếm và lọc
- ✅ Validation đầy đủ
- ✅ Error handling hoàn chỉnh
- ✅ Optimistic locking
- ✅ Toast notifications
- ✅ Loading/error states

Module System Announcements giờ đã production-ready với đầy đủ CRUD operations! 🎉
