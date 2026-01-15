# 📖 System Announcements - Use Cases & Integration Guide

**Version:** 1.0.0  
**Last Updated:** January 13, 2026

---

## 📋 Table of Contents

1. [User Stories](#user-stories)
2. [Use Cases](#use-cases)
3. [Integration Examples](#integration-examples)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

---

## 👥 User Stories

### **As a Platform Admin**

1. **I want to notify all users about system maintenance**
   - So that users are prepared for downtime
   - Acceptance: All active users see the announcement banner

2. **I want to target announcements to specific regions**
   - So that only relevant users receive notifications (e.g., EU GDPR update)
   - Acceptance: Only users in targeted regions see the announcement

3. **I want to promote new features to premium users**
   - So that we can drive upgrades and engagement
   - Acceptance: Only PRO/ENTERPRISE users see promotional announcements

4. **I want to track announcement engagement**
   - So that I can measure effectiveness and improve messaging
   - Acceptance: Dashboard shows read count, percentage, and unread count

5. **I want to schedule announcements in advance**
   - So that I can prepare communications ahead of time
   - Acceptance: Announcements automatically appear/disappear at scheduled times

---

### **As an End User**

1. **I want to see announcements in my language**
   - So that I can understand important updates
   - Acceptance: Announcements display in user's preferred language with fallback

2. **I want to dismiss announcements I've read**
   - So that I don't see the same message repeatedly
   - Acceptance: Dismissed announcements don't reappear on refresh

3. **I want to see only relevant announcements**
   - So that I'm not overwhelmed with irrelevant information
   - Acceptance: Only announcements matching my region/plan are shown

4. **I want to be notified of critical issues immediately**
   - So that I can take action (e.g., security incident)
   - Acceptance: CRITICAL announcements are prominently displayed

---

## 🎯 Use Cases

### **Use Case 1: Scheduled System Maintenance**

**Actor:** Platform Admin  
**Goal:** Notify all users about upcoming maintenance  
**Precondition:** Admin has access to announcements management

**Flow:**

1. Admin navigates to Announcements → Create
2. Admin fills in announcement details:
   ```json
   {
     "titles": {
       "en": "Scheduled Maintenance - Jan 15, 2026",
       "vi": "Bảo trì định kỳ - 15/01/2026"
     },
     "contents": {
       "en": "We will perform system maintenance on Jan 15 from 2:00 AM to 4:00 AM PST. During this time, the service will be temporarily unavailable.",
       "vi": "Chúng tôi sẽ bảo trì hệ thống vào ngày 15/01 từ 2:00 sáng đến 4:00 sáng PST. Trong thời gian này, dịch vụ sẽ tạm thời không khả dụng."
     },
     "type": "WARNING",
     "target_regions": [],
     "target_plans": [],
     "is_active": true,
     "start_at": "2026-01-14T00:00:00Z",
     "end_at": "2026-01-15T12:00:00Z"
   }
   ```
3. System validates and creates announcement
4. On Jan 14, all users see the yellow warning banner
5. Users can dismiss by clicking "×" (marks as read)
6. After Jan 15 12:00 PM, announcement automatically expires

**Success Criteria:**
- ✅ All active users see the announcement
- ✅ Announcement displays in user's language
- ✅ Announcement auto-expires after maintenance window
- ✅ Admin can track read statistics

---

### **Use Case 2: Region-Specific GDPR Update**

**Actor:** Compliance Admin  
**Goal:** Notify only EU users about privacy policy update  
**Precondition:** Users have region metadata (e.g., "EU", "US")

**Flow:**

1. Admin creates announcement with EU targeting:
   ```json
   {
     "titles": {
       "en": "Privacy Policy Update - EU Users",
       "de": "Datenschutzrichtlinie-Update - EU-Benutzer"
     },
     "contents": {
       "en": "We have updated our privacy policy to comply with GDPR requirements...",
       "de": "Wir haben unsere Datenschutzrichtlinie aktualisiert..."
     },
     "type": "INFO",
     "target_regions": ["EU"],
     "target_plans": [],
     "is_active": true
   }
   ```
2. System filters announcements by user region
3. Only users with `region = "EU"` see the announcement
4. US/APAC users don't see this announcement

**API Call (Frontend):**

```typescript
// Fetch active announcements for EU user
const response = await fetch(
  '/api/v1/announcements/active?user_id=USER_UUID&region=EU'
);
```

**Success Criteria:**
- ✅ Only EU users see the announcement
- ✅ Non-EU users don't see it
- ✅ Multi-language support (EN, DE, FR)

---

### **Use Case 3: Premium Feature Promotion**

**Actor:** Marketing Team  
**Goal:** Promote new AI feature to PRO/ENTERPRISE users  
**Precondition:** Users have plan metadata

**Flow:**

1. Marketing creates promotional announcement:
   ```json
   {
     "titles": {
       "en": "🎉 New AI Assistant Available!",
       "vi": "🎉 Trợ lý AI mới ra mắt!"
     },
     "contents": {
       "en": "Try our new AI assistant to boost productivity by 50%! Available exclusively for PRO and ENTERPRISE users.",
       "vi": "Dùng thử trợ lý AI mới để tăng năng suất 50%! Chỉ dành cho người dùng PRO và ENTERPRISE."
     },
     "type": "PROMOTION",
     "target_regions": [],
     "target_plans": ["PRO", "ENTERPRISE"],
     "is_active": true,
     "start_at": "2026-01-13T00:00:00Z",
     "end_at": "2026-01-20T00:00:00Z"
   }
   ```
2. System filters by user plan
3. Only PRO/ENTERPRISE users see green promotion banner
4. FREE users don't see this announcement
5. After 7 days, announcement expires

**Success Criteria:**
- ✅ Only premium users see promotion
- ✅ Free users don't see it
- ✅ Drives feature adoption among target segment

---

### **Use Case 4: Critical Security Alert**

**Actor:** Security Team  
**Goal:** Immediately notify all users about security incident  
**Precondition:** Security incident detected

**Flow:**

1. Security team creates CRITICAL announcement:
   ```json
   {
     "titles": {
       "en": "🚨 SECURITY ALERT: Reset Your Password",
       "vi": "🚨 CẢNH BÁO BẢO MẬT: Đặt lại mật khẩu"
     },
     "contents": {
       "en": "We detected unusual activity. Please reset your password immediately for your account security.",
       "vi": "Chúng tôi phát hiện hoạt động bất thường. Vui lòng đặt lại mật khẩu ngay để bảo mật tài khoản."
     },
     "type": "CRITICAL",
     "target_regions": [],
     "target_plans": [],
     "is_active": true,
     "start_at": "2026-01-13T10:00:00Z"
   }
   ```
2. All users immediately see red CRITICAL banner
3. Banner is sticky (harder to dismiss)
4. Users are redirected to password reset flow

**Frontend Logic:**

```typescript
if (announcement.type === 'CRITICAL') {
  // Display persistent modal instead of dismissible banner
  showModal({
    title: announcement.titles[locale],
    content: announcement.contents[locale],
    icon: '🚨',
    color: 'red',
    dismissible: false,  // Cannot dismiss without action
    ctaText: 'Reset Password',
    ctaUrl: '/reset-password'
  });
}
```

**Success Criteria:**
- ✅ All users see alert immediately
- ✅ Prominent display (modal, not banner)
- ✅ Forces user action (password reset)

---

### **Use Case 5: Announcement Engagement Analytics**

**Actor:** Product Manager  
**Goal:** Measure effectiveness of announcements  
**Precondition:** Announcements have been published

**Flow:**

1. PM navigates to Announcements Dashboard
2. Selects announcement to analyze
3. System displays:
   ```json
   {
     "announcement_id": "01934a2f-8b6c-7890-1234-56789abcdef0",
     "title": "New Feature Available",
     "read_count": 3200,
     "total_users": 5000,
     "read_percentage": 64.00,
     "unread_count": 1800,
     "created_at": "2026-01-13T08:00:00Z"
   }
   ```
4. PM sees engagement metrics:
   - 64% read rate (good)
   - 1800 users haven't seen it
5. PM decides to:
   - Change type to WARNING for more visibility
   - Extend end_at to give more time
   - Send follow-up email to unread users

**API Call:**

```typescript
const stats = await fetch('/api/v1/announcements/ANNOUNCEMENT_ID/read-stats');
const data = await stats.json();

console.log(`Engagement: ${data.read_percentage}%`);

if (data.read_percentage < 30) {
  console.warn('Low engagement! Consider re-promoting.');
}
```

**Success Criteria:**
- ✅ Real-time engagement metrics
- ✅ Identify low-performing announcements
- ✅ Data-driven decision making

---

## 🔧 Integration Examples

### **Example 1: React Frontend Integration**

```typescript
// components/AnnouncementBanner.tsx
import { useEffect, useState } from 'react';
import { announcementsApi, getLocalizedTitle, getLocalizedContent } from '@/api/announcementsApi';

export function AnnouncementBanner({ userId, region, plan, locale = 'vi' }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    async function fetchAnnouncements() {
      const data = await announcementsApi.getActive({ user_id: userId, region, plan });
      setAnnouncements(data);
    }
    fetchAnnouncements();
    
    // Poll every 5 minutes for new announcements
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, region, plan]);

  const handleDismiss = async (announcementId: string) => {
    await announcementsApi.markAsRead(announcementId, userId);
    setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
  };

  return (
    <>
      {announcements.map(announcement => (
        <div key={announcement._id} className={`banner banner-${announcement.type.toLowerCase()}`}>
          <strong>{getLocalizedTitle(announcement, locale)}</strong>
          <p>{getLocalizedContent(announcement, locale)}</p>
          <button onClick={() => handleDismiss(announcement._id)}>×</button>
        </div>
      ))}
    </>
  );
}
```

**Usage:**

```tsx
// In App.tsx or Layout
<AnnouncementBanner 
  userId={currentUser.id} 
  region={currentUser.region}
  plan={currentUser.plan}
  locale={currentUser.locale}
/>
```

---

### **Example 2: Admin Create Form**

```typescript
// pages/admin/announcements/create.tsx
import { useState } from 'react';
import { announcementsApi } from '@/api/announcementsApi';

export function CreateAnnouncementPage() {
  const [formData, setFormData] = useState({
    titles: { en: '', vi: '' },
    contents: { en: '', vi: '' },
    type: 'INFO',
    target_regions: [],
    target_plans: [],
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const announcement = await announcementsApi.create(formData);
      alert(`Created announcement: ${announcement._id}`);
      // Redirect to list page
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Announcement</h1>
      
      {/* English Title */}
      <label>Title (English)</label>
      <input 
        value={formData.titles.en}
        onChange={(e) => setFormData({
          ...formData,
          titles: { ...formData.titles, en: e.target.value }
        })}
      />
      
      {/* Vietnamese Title */}
      <label>Tiêu đề (Tiếng Việt)</label>
      <input 
        value={formData.titles.vi}
        onChange={(e) => setFormData({
          ...formData,
          titles: { ...formData.titles, vi: e.target.value }
        })}
      />
      
      {/* Type Selection */}
      <label>Type</label>
      <select 
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
      >
        <option value="INFO">Info</option>
        <option value="WARNING">Warning</option>
        <option value="CRITICAL">Critical</option>
        <option value="PROMOTION">Promotion</option>
      </select>
      
      {/* Target Regions */}
      <label>Target Regions (comma-separated)</label>
      <input 
        placeholder="US, EU, APAC (empty = all)"
        onChange={(e) => setFormData({
          ...formData,
          target_regions: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
        })}
      />
      
      {/* Submit */}
      <button type="submit">Create Announcement</button>
    </form>
  );
}
```

---

### **Example 3: Analytics Dashboard**

```typescript
// components/AnnouncementStats.tsx
import { useEffect, useState } from 'react';
import { announcementsApi } from '@/api/announcementsApi';

export function AnnouncementStats({ announcementId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      const data = await announcementsApi.getReadStats(announcementId);
      setStats(data);
    }
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30 * 1000);
    return () => clearInterval(interval);
  }, [announcementId]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="stats-card">
      <h3>Engagement Metrics</h3>
      
      <div className="metric">
        <label>Read Count</label>
        <span>{stats.read_count.toLocaleString()}</span>
      </div>
      
      <div className="metric">
        <label>Total Users</label>
        <span>{stats.total_users.toLocaleString()}</span>
      </div>
      
      <div className="metric">
        <label>Read Percentage</label>
        <span className={stats.read_percentage > 50 ? 'text-green' : 'text-red'}>
          {stats.read_percentage.toFixed(2)}%
        </span>
      </div>
      
      <div className="metric">
        <label>Unread Count</label>
        <span>{stats.unread_count.toLocaleString()}</span>
      </div>
      
      {/* Progress bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${stats.read_percentage}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 🎯 Best Practices

### **1. i18n Strategy**

✅ **DO:**
- Always provide English (`en`) as fallback
- Use professional translation services
- Test all languages before publishing
- Keep translations consistent in tone

```json
{
  "titles": {
    "en": "System Maintenance",    // ✅ Required
    "vi": "Bảo trì hệ thống",
    "ja": "システムメンテナンス"
  }
}
```

❌ **DON'T:**
- Use machine translation for critical announcements
- Mix informal/formal tone across languages
- Forget to translate all fields (titles AND contents)

---

### **2. Announcement Types**

Use appropriate types for context:

| Type | When to Use | Color | Icon |
|------|-------------|-------|------|
| `INFO` | General updates, feature announcements | Blue | ℹ️ |
| `WARNING` | Maintenance, deprecations | Yellow | ⚠️ |
| `CRITICAL` | Security issues, outages | Red | 🚨 |
| `PROMOTION` | New features, upgrades | Green | 🎉 |

---

### **3. Targeting Strategy**

**Broad targeting (all users):**
```json
{
  "target_regions": [],
  "target_plans": []
}
```

**Specific targeting:**
```json
{
  "target_regions": ["US", "EU"],
  "target_plans": ["PRO", "ENTERPRISE"]
}
```

**Multiple targeting (AND logic):**
- User must match ALL criteria
- `region = "US" AND plan = "PRO"`

---

### **4. Scheduling**

**Immediate announcement:**
```json
{
  "start_at": "2026-01-13T10:00:00Z",  // NOW()
  "end_at": null                       // Never expires
}
```

**Scheduled announcement:**
```json
{
  "start_at": "2026-01-14T00:00:00Z",  // Tomorrow
  "end_at": "2026-01-15T00:00:00Z"     // 24 hours later
}
```

**Time-sensitive announcement:**
```json
{
  "start_at": "2026-01-15T02:00:00Z",  // Maintenance start
  "end_at": "2026-01-15T04:00:00Z"     // Maintenance end
}
```

---

### **5. Performance**

**Frontend polling:**
```typescript
// Poll every 5 minutes (not too aggressive)
const POLL_INTERVAL = 5 * 60 * 1000;

setInterval(async () => {
  const announcements = await fetchActiveAnnouncements();
  updateBanner(announcements);
}, POLL_INTERVAL);
```

**Cache active announcements:**
```typescript
// Cache for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let cachedAnnouncements = null;
let cacheTime = 0;

async function getAnnouncements() {
  if (Date.now() - cacheTime < CACHE_TTL) {
    return cachedAnnouncements;
  }
  
  cachedAnnouncements = await fetchActiveAnnouncements();
  cacheTime = Date.now();
  return cachedAnnouncements;
}
```

---

## 🐛 Troubleshooting

### **Problem 1: Announcements not showing**

**Symptoms:**
- User doesn't see active announcements
- Empty response from `/announcements/active`

**Checklist:**
1. ✅ Is `is_active = TRUE`?
2. ✅ Is `start_at <= NOW()`?
3. ✅ Is `end_at > NOW()` (or NULL)?
4. ✅ Does user match `target_regions`?
5. ✅ Does user match `target_plans`?
6. ✅ Has user already read it?

**Debug Query:**
```sql
SELECT * FROM system_announcements
WHERE is_active = TRUE
  AND start_at <= NOW()
  AND (end_at IS NULL OR end_at > NOW())
  AND (target_regions IS NULL OR 'US' = ANY(target_regions))
  AND _id NOT IN (
    SELECT announcement_id FROM user_announcement_reads WHERE user_id = 'USER_UUID'
  );
```

---

### **Problem 2: Duplicate read records**

**Symptoms:**
- Multiple read records for same user+announcement
- Read stats inflated

**Cause:** Not using upsert pattern

**Solution:**
```sql
-- Use ON CONFLICT
INSERT INTO user_announcement_reads (...)
VALUES (...)
ON CONFLICT (user_id, announcement_id) DO UPDATE
SET read_at = NOW();
```

---

### **Problem 3: Slow active announcements query**

**Symptoms:**
- `/announcements/active` takes > 100ms
- High CPU usage

**Checklist:**
1. ✅ Is partial index created?
2. ✅ Is `VACUUM ANALYZE` run recently?
3. ✅ Are GIN indexes created for targeting?

**Check index usage:**
```sql
EXPLAIN ANALYZE
SELECT * FROM system_announcements
WHERE is_active = TRUE
  AND start_at <= NOW()
  AND (end_at IS NULL OR end_at > NOW());
```

Should show: `Index Scan using idx_announcements_active_pull`

---

### **Problem 4: Wrong language displayed**

**Symptoms:**
- English shown instead of Vietnamese
- Missing translations

**Cause:** Locale mismatch or missing translation

**Solution:**
```typescript
// Proper fallback chain
const title = 
  announcement.titles[userLocale] ||      // User's language
  announcement.titles['en'] ||            // Fallback to English
  Object.values(announcement.titles)[0] || // Any available language
  'Untitled';                             // Last resort
```

---

**Version:** 1.0.0  
**Last Updated:** January 13, 2026  
**Maintainer:** Platform Team
