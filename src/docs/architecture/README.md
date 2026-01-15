# 🏗️ Architecture Documentation

Thư mục này chứa tất cả tài liệu về architecture của hệ thống.

---

## 📁 Documents

### **⭐ API_CLIENT_ARCHITECTURE.md**
**Mục đích:** Thiết kế tổng thể của API clients layer  
**Nội dung:**
- Design principles
- Abstraction layer pattern
- Migration strategy (Supabase → Golang)
- API client template
- Best practices

**Đọc khi nào:** 
- Muốn hiểu overall architecture
- Cần tạo API client mới
- Chuẩn bị migrate sang Golang

---

### **⭐ API_REFACTORING_GUIDE.md**
**Mục đích:** Hướng dẫn chi tiết refactor API clients  
**Nội dung:**
- Step-by-step refactoring guide
- Code examples (before/after)
- Adapter pattern usage
- Complex queries handling
- Business logic separation

**Đọc khi nào:**
- Đang refactor API client cụ thể
- Cần example code
- Muốn checklist đầy đủ

---

## 🎯 Quick Reference

### **Tôi muốn...**

#### **Tạo API client mới**
→ Đọc `API_CLIENT_ARCHITECTURE.md` phần "API Client Template"

#### **Refactor API client hiện tại**
→ Đọc `API_REFACTORING_GUIDE.md` từ đầu đến cuối

#### **Hiểu adapter pattern**
→ Đọc `API_CLIENT_ARCHITECTURE.md` phần "Migration Strategy"

#### **Migrate sang Golang**
→ Đọc `/docs/GOLANG_MIGRATION_READY.md`

#### **Fix bug API client**
→ Đọc `/docs/bugfix/BUGFIX_SUMMARY.md` xem pattern

---

## 🏗️ Architecture Overview

```
Frontend
    ↓
React Components
    ↓
API Clients (/api/*.ts)
    ↓
Adapters (createAdapter)
    ↓         ↓
Supabase   HTTP (Golang)
    ↓         ↓
   PostgreSQL
```

**Key Concepts:**
1. **Abstraction Layer** - Components không bao giờ gọi trực tiếp data source
2. **Adapter Pattern** - Switch giữa Supabase và Golang dễ dàng
3. **Configuration-Driven** - Thay đổi backend qua env vars
4. **Type-Safe** - TypeScript interfaces cho mọi entity
5. **Future-Proof** - Sẵn sàng cho bất kỳ backend nào

---

## 📊 Files trong /api/

```
/api/
├── config.ts                # Configuration & HTTP client
├── adapters/
│   ├── base.ts             # Base adapter interface
│   ├── supabase.ts         # Supabase implementation
│   ├── http.ts             # HTTP/Golang implementation
│   └── index.ts            # Factory & exports
├── subscriptionApi.ts      # ✅ Refactored (example)
├── productsApi.ts          # ⏳ To be refactored
├── ordersApi.ts            # ⏳ To be refactored
└── ... (45+ files)         # ⏳ To be refactored
```

---

## 🔄 Migration Phases

### **Phase 1: Foundation ✅ DONE**
- [x] Create HTTP client (`/api/config.ts`)
- [x] Create adapter base (`/api/adapters/base.ts`)
- [x] Create Supabase adapter (`/api/adapters/supabase.ts`)
- [x] Create HTTP adapter (`/api/adapters/http.ts`)
- [x] Create factory (`/api/adapters/index.ts`)
- [x] Document architecture
- [x] Create refactoring guide

### **Phase 2: Refactor APIs ⏳ IN PROGRESS**
- [x] Refactor `subscriptionApi` (example)
- [ ] Refactor remaining 47 clients
  - Use guide in `API_REFACTORING_GUIDE.md`
  - ~30 min per client
  - ~24 hours total

### **Phase 3: Golang Backend 🔮 FUTURE**
- [ ] Develop Golang microservices
- [ ] Deploy to staging
- [ ] Integration testing
- [ ] Deploy to production

### **Phase 4: Cutover 🔮 FUTURE**
- [ ] Set `API_MODE=golang`
- [ ] Monitor & optimize
- [ ] Remove Supabase code (optional)

---

## 📚 Related Documentation

### **Architecture**
- `API_CLIENT_ARCHITECTURE.md` - Design overview
- `API_REFACTORING_GUIDE.md` - Refactoring guide
- `/docs/GOLANG_MIGRATION_READY.md` - Migration readiness

### **Implementation**
- `/api/config.ts` - HTTP client code
- `/api/adapters/` - Adapter implementations
- `/api/subscriptionApi.ts` - Refactored example

### **Bug Fixes**
- `/docs/bugfix/BUGFIX_SUMMARY.md` - Why we refactored
- `/docs/bugfix/BUGFIX_SUBSCRIPTIONS.md` - Subscription fix
- `/docs/REFACTORING_COMPLETE.md` - What we achieved

---

## 🎓 Learning Path

### **Beginner**
1. Read `API_CLIENT_ARCHITECTURE.md` overview
2. Look at `/api/subscriptionApi.ts` example
3. Understand adapter pattern

### **Intermediate**
1. Read `API_REFACTORING_GUIDE.md`
2. Refactor one simple API client
3. Test with Supabase mode

### **Advanced**
1. Refactor complex API clients (with JOINs)
2. Handle business logic properly
3. Prepare for Golang migration

---

## ✅ Best Practices

### **When Creating New API Client**
1. Follow template in `API_CLIENT_ARCHITECTURE.md`
2. Use `createAdapter()` from start
3. Separate types, adapter, and business logic
4. Document all methods

### **When Refactoring Existing Client**
1. Follow checklist in `API_REFACTORING_GUIDE.md`
2. Test with Supabase mode first
3. Keep complex queries separate
4. Add TODOs for Golang

### **When Migrating to Golang**
1. Deploy Golang services
2. Set `API_MODE=hybrid` first
3. Migrate one entity at a time
4. Test thoroughly
5. Switch to `API_MODE=golang`

---

## 📞 Need Help?

### **Questions about architecture?**
→ Read `API_CLIENT_ARCHITECTURE.md`

### **Need refactoring help?**
→ Read `API_REFACTORING_GUIDE.md`

### **Want to see example?**
→ Look at `/api/subscriptionApi.ts`

### **Ready to migrate?**
→ Read `/docs/GOLANG_MIGRATION_READY.md`

---

## 🎯 Summary

**This directory contains:**
- ✅ Complete architecture design
- ✅ Step-by-step refactoring guide
- ✅ Code examples and templates
- ✅ Migration strategy

**Everything you need to:**
- ✅ Understand current architecture
- ✅ Refactor API clients
- ✅ Prepare for Golang migration
- ✅ Maintain consistency

---

**Start with `API_CLIENT_ARCHITECTURE.md` for overview!** 📖

**Follow `API_REFACTORING_GUIDE.md` for implementation!** 🔧

**Check `/docs/GOLANG_MIGRATION_READY.md` when ready to migrate!** 🚀
