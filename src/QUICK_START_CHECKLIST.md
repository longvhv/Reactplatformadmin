# ✅ QUICK START CHECKLIST - REFACTOR KICKOFF

## 🚀 TRƯỚC KHI BẮT ĐẦU (30 phút)

### **1. Team Setup (10 phút)**
- [ ] Schedule 2 days: [Date 1] & [Date 2]
- [ ] Confirm team: Dev A, Dev B, Dev C
- [ ] Block calendars (no meetings)
- [ ] Setup Slack channel: #refactor-pages-app
- [ ] Setup video call (for pair programming)

### **2. Tools Setup (10 phút)**
- [ ] Create Google Sheet từ TRACKING_SPREADSHEET_TEMPLATE.md
- [ ] Share với team (edit permissions)
- [ ] Pin sheet to favorites
- [ ] Test editing

### **3. Git Setup (5 phút)**
```bash
# Create feature branch
git checkout -p
git pull origin main
git checkout -b refactor/pages-to-app-router
git push -u origin refactor/pages-to-app-router
```

### **4. Environment Check (5 phút)**
```bash
# Verify everything works
npm install
npm run dev
npm run test
npm run type-check
npm run lint
```

**All green? ✅ Proceed!**

---

## 📋 KICKOFF MEETING (30 phút)

### **Agenda:**

**1. Review Master Plan (10 phút)**
- [ ] Open MASTER_REFACTOR_PLAN.md
- [ ] Explain timeline
- [ ] Show batch assignments
- [ ] Answer questions

**2. Demo Refactor Process (10 phút)**
- [ ] Live demo: Refactor 1 file
- [ ] Show logic file creation
- [ ] Show bridge file update
- [ ] Show testing

**3. Assign Batches (5 phút)**
- [ ] Dev A: Batches 1.1, 1.4, 2.1, 2.5, 3.1, ...
- [ ] Dev B: Batches 1.2, 2.2, 3.2, 3.5, 4.3, ...
- [ ] Dev C: Batches 1.3, 2.4, 3.3, 4.4, 5.5, ...

**4. Set Expectations (5 phút)**
- [ ] Quality over speed
- [ ] Test after each file
- [ ] Update tracking immediately
- [ ] Ask questions early
- [ ] Help each other

---

## 🎯 REFACTOR CHECKLIST (PER FILE)

### **Chuẩn bị (1 phút)**
- [ ] Open file: `pages/XxxPage.tsx`
- [ ] Identify module name
- [ ] Identify page type (list/detail/add/edit)
- [ ] Update tracking: Status → 🔄
- [ ] Record start time

### **Tạo Logic File (3 phút)**

**Bước 1: Create directory & file**
```bash
mkdir -p app/\(admin\)/[module]/[subpath]
touch app/\(admin\)/[module]/[subpath]/page.tsx
```

**Bước 2: Copy & Modify**
- [ ] Copy toàn bộ nội dung từ /pages/XxxPage.tsx
- [ ] Add `'use client';` ở đầu file
- [ ] Change: `import { useNavigate } from 'react-router'`
  → `import { useRouter } from '@/components/shim/next-navigation'`
- [ ] Change: `const navigate = useNavigate()`
  → `const router = useRouter()`
- [ ] Change: `navigate('/path')`
  → `router.push('/path')`
- [ ] Change: `navigate(-1)`
  → `router.back()`
- [ ] Wrap JSX: `return <Fragment>{/* JSX */}</Fragment>`
- [ ] Change exports:
  ```typescript
  // FROM:
  export default function XxxPage() { ... }
  
  // TO:
  function XxxPage() { ... }
  export { XxxPage };
  export default XxxPage;
  ```

### **Update Bridge File (1 phút)**

**Rewrite /pages/XxxPage.tsx:**
```typescript
import { XxxPage } from '@/app/(admin)/[module]/[subpath]/page';
export default XxxPage;
```

**CHỈ 2 DÒNG!**

### **Testing (2 phút)**
- [ ] Save all files
- [ ] Check browser auto-refresh
- [ ] Page loads without error
- [ ] Navigation works
- [ ] No console errors
- [ ] TypeScript compiles: `npm run type-check`

### **Complete (1 phút)**
- [ ] Update tracking: Status → ✅
- [ ] Record end time
- [ ] Note any issues
- [ ] Commit:
  ```bash
  git add .
  git commit -m "refactor: migrate XxxPage to app router"
  ```

**TOTAL: 6-8 phút/file**

---

## 🔄 BATCH CHECKLIST

### **Starting Batch:**
- [ ] Review file list
- [ ] Estimate time
- [ ] Update tracking
- [ ] Start timer

### **During Batch:**
- [ ] Work file by file
- [ ] Test each file
- [ ] Update progress
- [ ] Note issues

### **Completing Batch:**
- [ ] All files done
- [ ] All tests pass
- [ ] Update metrics
- [ ] Commit all:
  ```bash
  git add .
  git commit -m "refactor: complete batch X.Y - [module] module"
  git push
  ```
- [ ] Quick team sync
- [ ] Take 5-minute break

---

## ⏰ HOURLY CHECKLIST

**Every hour, on the hour:**
- [ ] Update tracking spreadsheet
- [ ] Check velocity (files/hour)
- [ ] Review quality (errors?)
- [ ] Adjust if needed
- [ ] Quick Slack update
- [ ] Take 5-minute break

---

## 🎯 CHECKPOINT CHECKLIST

**After each checkpoint (every 2 hours):**

### **Code:**
- [ ] All files in batch completed
- [ ] TypeScript compiles: `npm run type-check`
- [ ] Linter passes: `npm run lint`
- [ ] No console errors
- [ ] Navigation tested

### **Tracking:**
- [ ] Update all metrics
- [ ] Calculate velocity
- [ ] Note any issues
- [ ] Update estimates

### **Team:**
- [ ] Quick standup (5 min)
- [ ] Share progress
- [ ] Discuss blockers
- [ ] Help each other

### **Git:**
- [ ] Commit all changes
- [ ] Push to remote
- [ ] Check CI/CD (if setup)

---

## 🌅 END OF DAY CHECKLIST

### **Code:**
- [ ] All pending work committed
- [ ] All changes pushed
- [ ] Branch up to date
- [ ] No uncommitted changes

### **Tracking:**
- [ ] Final metrics updated
- [ ] Daily summary filled
- [ ] Issues logged
- [ ] Velocity calculated

### **Team:**
- [ ] End of day standup (15 min)
- [ ] Celebrate progress
- [ ] Discuss learnings
- [ ] Plan tomorrow

### **Personal:**
- [ ] Note tomorrow's start point
- [ ] Rest well
- [ ] Ready for tomorrow

---

## 🎉 COMPLETION CHECKLIST

### **Code Complete:**
- [ ] All 95 files refactored
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 warnings
- [ ] Build: Success
- [ ] Tests: All pass

### **Testing Complete:**
- [ ] Automated tests: Pass
- [ ] Manual testing: Done
- [ ] Browser testing: Pass
- [ ] Smoke testing: Pass

### **Review Complete:**
- [ ] Code reviewed
- [ ] Feedback addressed
- [ ] Quality approved
- [ ] PR approved

### **Documentation Complete:**
- [ ] Audit report updated
- [ ] Completion report created
- [ ] Lessons documented
- [ ] Metrics recorded

### **Deployment Ready:**
- [ ] Staging deployed
- [ ] Smoke tests pass
- [ ] Team approved
- [ ] Ready for production

---

## 🚨 BLOCKER CHECKLIST

**If stuck >15 minutes:**

### **Immediate Actions:**
- [ ] Note exact error
- [ ] Check console
- [ ] Check TypeScript
- [ ] Check similar files
- [ ] Search docs

### **If still stuck >30 minutes:**
- [ ] Post in Slack
- [ ] Tag team lead
- [ ] Share screen if needed
- [ ] Pair with teammate
- [ ] Move to next file (come back later)

### **Document:**
- [ ] Add to Issues Log
- [ ] Note attempted solutions
- [ ] Share learnings
- [ ] Update patterns doc

---

## 💡 QUICK REFERENCE

### **Common Commands:**
```bash
# Dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Test
npm run test

# Build
npm run build

# Commit
git add .
git commit -m "refactor: [message]"
git push
```

### **Common Patterns:**

**List Page:**
```
/pages/XxxsPage.tsx → /app/(admin)/xxxs/page.tsx
```

**Detail Page:**
```
/pages/XxxDetailPage.tsx → /app/(admin)/xxxs/[id]/page.tsx
```

**Add Page:**
```
/pages/AddXxxPage.tsx → /app/(admin)/xxxs/add/page.tsx
```

**Edit Page:**
```
/pages/EditXxxPage.tsx → /app/(admin)/xxxs/edit/[id]/page.tsx
```

### **Import Changes:**
```typescript
// OLD:
import { useNavigate, useParams } from 'react-router';

// NEW:
import { useRouter, useParams } from '@/components/shim/next-navigation';
```

### **Usage Changes:**
```typescript
// OLD:
const navigate = useNavigate();
navigate('/path');
navigate(-1);

// NEW:
const router = useRouter();
router.push('/path');
router.back();
```

---

## 📞 EMERGENCY CONTACTS

**Technical Issues:**
- Team Lead: [Name] - [Slack/Phone]
- Senior Dev: [Name] - [Slack/Phone]

**Process Questions:**
- Project Manager: [Name] - [Slack/Phone]

**Escalation:**
- If blocker >1 hour: Escalate to team lead
- If critical bug: All hands meeting
- If timeline at risk: Update stakeholders

---

## 🎯 SUCCESS REMINDERS

### **Quality First:**
- ✅ Better to take 10 min and do it right
- ✅ Test thoroughly
- ✅ Ask questions
- ✅ Help teammates

### **Stay Focused:**
- ✅ One file at a time
- ✅ Follow the process
- ✅ Update tracking
- ✅ Take breaks

### **Communicate:**
- ✅ Share progress
- ✅ Ask for help
- ✅ Celebrate wins
- ✅ Support team

### **Have Fun:**
- ✅ This is good work!
- ✅ We're improving the codebase
- ✅ Learning new patterns
- ✅ Building for the future

---

## 📋 PRINT & POST

**Print này và dán lên bàn:** 📌

### **Quick File Checklist:**
1. ✅ Create logic file in /app/(admin)/
2. ✅ Add 'use client'
3. ✅ Change imports to shim
4. ✅ Change useNavigate → useRouter
5. ✅ Wrap JSX in Fragment
6. ✅ Export both ways
7. ✅ Update bridge file (2 lines)
8. ✅ Test
9. ✅ Commit

**Remember:** 6-8 minutes per file! ⏱️

---

**CHECKLIST VERSION:** 1.0  
**DATE:** 2026-01-19  
**STATUS:** READY TO USE  

**PRINT, CHECK, SUCCEED!** ✅💪🚀
