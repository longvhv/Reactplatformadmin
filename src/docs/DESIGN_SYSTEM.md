# Design System Documentation

## 🎨 Overview

Design system của app lấy cảm hứng từ **Stripe, GitHub, Vercel, và Linear** với màu chủ đạo **Indigo (#6366f1)** và font chữ **Inter**.

---

## 📐 Design Principles

### 1. **Consistency First**
- Sử dụng design tokens từ `/constants/ui.ts` thay vì hardcoded values
- Một component cho mỗi use case, tránh duplicate code
- Patterns nhất quán xuyên suốt toàn bộ app

### 2. **Accessibility** 
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Color contrast ratios meet standards

### 3. **Performance**
- Tailwind CSS v4 for optimal bundle size
- GPU-accelerated animations
- Lazy loading for heavy components
- Will-change hints for smooth transitions

### 4. **Minimalism**
- Clean, uncluttered interfaces
- Meaningful whitespace
- Subtle shadows and borders
- Focus on content hierarchy

---

## 🎨 Color System

### **Primary Color: Indigo**
```css
--primary: #6366f1 (Indigo 500)
```

**Usage:**
- ✅ Primary CTAs (Save, Create, Submit)
- ✅ Active states
- ✅ Important highlights
- ❌ Don't overuse - reserved for main actions only

### **Color Palette**

| Color | Value | Usage |
|-------|-------|-------|
| Primary | `#6366f1` | Main CTAs, active states |
| Secondary | `#f4f4f5` | Secondary actions, backgrounds |
| Destructive | `#ef4444` | Delete, remove, errors |
| Success | `#10b981` | Success messages, confirmations |
| Warning | `#f59e0b` | Warnings, alerts |
| Muted | `#71717a` | Disabled text, hints |
| Border | `#e4e4e7` | Dividers, borders |

### **How to Use Colors**

**✅ CORRECT - Use design tokens:**
```tsx
import { UI_COLORS } from '@/constants/ui';

<button className={UI_COLORS.primary}>
  Save Changes
</button>
```

**❌ WRONG - Hardcoded colors:**
```tsx
<button className="bg-indigo-600 hover:bg-indigo-700 text-white">
  Save Changes
</button>
```

---

## 📏 Spacing Scale

Consistent spacing based on 4px base unit:

| Size | Value | Token | Usage |
|------|-------|-------|-------|
| XS | `0.25rem` (4px) | `gap-1` | Tight spacing |
| SM | `0.5rem` (8px) | `gap-2` | Related elements |
| MD | `0.75rem` (12px) | `gap-3` | Default spacing |
| LG | `1rem` (16px) | `gap-4` | Sections |
| XL | `1.5rem` (24px) | `gap-6` | Major sections |

**Example:**
```tsx
import { UI_SPACING } from '@/constants/ui';

<div className={UI_SPACING.gapMd}> {/* gap-3 */}
  <Button />
  <Button />
</div>
```

---

## 🔘 Border Radius

| Size | Value | Token | Usage |
|------|-------|-------|-------|
| SM | `2px` | `rounded-sm` | Nested elements |
| MD | `6px` | `rounded-md` | Default |
| LG | `12px` | `rounded-lg` | Cards, modals |
| XL | `16px` | `rounded-xl` | Large cards |
| Full | `9999px` | `rounded-full` | Pills, avatars |

**Default:** Use `rounded-lg` for cards, `rounded-md` for buttons and inputs.

---

## 🎯 Components

### **Buttons**

#### **Variants:**

**Primary** - Main CTAs
```tsx
import { BUTTON_VARIANTS } from '@/constants/ui';

<button className={BUTTON_VARIANTS.primary}>
  Save Changes
</button>
```

**Secondary** - Common actions
```tsx
<button className={BUTTON_VARIANTS.secondary}>
  Cancel
</button>
```

**Destructive** - Dangerous actions
```tsx
<button className={BUTTON_VARIANTS.destructive}>
  Delete
</button>
```

**Outline** - Less emphasis
```tsx
<button className={BUTTON_VARIANTS.outline}>
  Learn More
</button>
```

**Ghost** - Minimal
```tsx
<button className={BUTTON_VARIANTS.ghost}>
  View Details
</button>
```

**Icon Only** - Square icon buttons
```tsx
<button className={BUTTON_VARIANTS.icon}>
  <Edit className="w-4 h-4" />
</button>
```

#### **Sizes:**

Small, medium (default), large controlled via padding:
```tsx
// Small
<button className={cn(BUTTON_VARIANTS.primary, UI_SPACING.paddingSm)}>

// Medium (default)
<button className={BUTTON_VARIANTS.primary}>

// Large
<button className={cn(BUTTON_VARIANTS.primary, UI_SPACING.paddingLg)}>
```

---

### **Cards**

#### **Variants:**

**Default** - Standard card with hover effect
```tsx
import { CARD_VARIANTS } from '@/constants/ui';

<div className={CARD_VARIANTS.default}>
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>
```

**Flat** - No shadow
```tsx
<div className={CARD_VARIANTS.flat}>
```

**Elevated** - More prominent shadow
```tsx
<div className={CARD_VARIANTS.elevated}>
```

**Interactive** - Clickable card with hover state
```tsx
<div className={CARD_VARIANTS.interactive} onClick={handleClick}>
```

**Compact** - Smaller padding
```tsx
<div className={CARD_VARIANTS.compact}>
```

---

### **Inputs**

#### **Variants:**

**Default** - Standard input
```tsx
import { INPUT_VARIANTS } from '@/constants/ui';

<input 
  type="text"
  className={INPUT_VARIANTS.default}
  placeholder="Enter value..."
/>
```

**Error State**
```tsx
<input 
  className={INPUT_VARIANTS.error}
/>
<p className="text-sm text-destructive mt-1">
  This field is required
</p>
```

**Success State**
```tsx
<input className={INPUT_VARIANTS.success} />
```

---

### **Badges**

#### **Variants:**

```tsx
import { BADGE_VARIANTS } from '@/constants/ui';

// Default
<span className={BADGE_VARIANTS.default}>Default</span>

// Primary
<span className={BADGE_VARIANTS.primary}>Active</span>

// Success
<span className={BADGE_VARIANTS.success}>Verified</span>

// Warning
<span className={BADGE_VARIANTS.warning}>Pending</span>

// Destructive
<span className={BADGE_VARIANTS.destructive}>Banned</span>

// Outline
<span className={BADGE_VARIANTS.outline}>Draft</span>
```

---

### **Tables**

```tsx
import { TABLE_STYLES } from '@/constants/ui';

<div className={TABLE_STYLES.container}>
  <table className={TABLE_STYLES.table}>
    <thead className={TABLE_STYLES.thead}>
      <tr>
        <th className={TABLE_STYLES.th}>Name</th>
        <th className={TABLE_STYLES.th}>Email</th>
      </tr>
    </thead>
    <tbody className={TABLE_STYLES.tbody}>
      <tr className={TABLE_STYLES.tr}>
        <td className={TABLE_STYLES.td}>John Doe</td>
        <td className={TABLE_STYLES.td}>john@example.com</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🎭 Typography

### **Headings:**

```tsx
import { UI_TEXT } from '@/constants/ui';

<h1 className={UI_TEXT.heading1}>Main Title</h1>
<h2 className={UI_TEXT.heading2}>Section Title</h2>
<h3 className={UI_TEXT.heading3}>Subsection</h3>
<h4 className={UI_TEXT.heading4}>Small Heading</h4>
```

### **Body Text:**

```tsx
<p className={UI_TEXT.body}>Normal paragraph text</p>
<p className={UI_TEXT.caption}>Small caption or hint text</p>
<label className={UI_TEXT.label}>Form Label</label>
```

### **Font Weights:**

```tsx
<span className={UI_TEXT.light}>Light (300)</span>
<span className={UI_TEXT.normal}>Normal (400)</span>
<span className={UI_TEXT.medium}>Medium (500)</span>
<span className={UI_TEXT.semibold}>Semibold (600)</span>
<span className={UI_TEXT.bold}>Bold (700)</span>
```

---

## 🎬 Animations & Transitions

### **Transition Speeds:**

```tsx
import { UI_TRANSITION } from '@/constants/ui';

// All properties (default)
<div className={UI_TRANSITION.all}>

// Colors only
<button className={UI_TRANSITION.colors}>

// Transform only
<div className={UI_TRANSITION.transform}>

// Fast (150ms)
<div className={UI_TRANSITION.fast}>

// Slow (300ms)
<div className={UI_TRANSITION.slow}>
```

### **Best Practices:**

- ✅ Use `transition-colors` for hover effects on buttons
- ✅ Use `transition-transform` for scale/translate animations
- ✅ Use `transition-all` sparingly (can be expensive)
- ✅ Add `will-change` for complex animations
- ❌ Don't transition `all` on large elements

---

## 📱 Responsive Design

### **Breakpoints:**

Tailwind default breakpoints:

```css
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large desktops
```

### **Mobile-First Approach:**

```tsx
// Mobile first - default styles are mobile
<div className="p-4 md:p-6 lg:p-8">
  {/* 
    p-4 on mobile
    p-6 on tablets
    p-8 on desktop
  */}
</div>
```

---

## 🛠️ Utility Functions

### **cn() - Combine Classes**

```tsx
import { cn } from '@/constants/ui';

const className = cn(
  BUTTON_VARIANTS.primary,
  isLoading && 'opacity-50',
  customClass
);
```

### **Helper Functions:**

```tsx
import { 
  getButtonClasses,
  getCardClasses,
  getInputClasses,
  getBadgeClasses 
} from '@/constants/ui';

// Get button with custom classes
const btnClass = getButtonClasses('primary', 'w-full');

// Get card with custom classes
const cardClass = getCardClasses('interactive', 'max-w-md');
```

---

## 📋 Checklist for New Components

When creating a new component:

- [ ] ✅ Import design tokens from `/constants/ui.ts`
- [ ] ✅ Use semantic color names (primary, destructive) not hardcoded values
- [ ] ✅ Use consistent border radius (`rounded-lg` for cards, `rounded-md` for buttons)
- [ ] ✅ Use consistent spacing from `UI_SPACING`
- [ ] ✅ Add hover states with `UI_TRANSITION.colors`
- [ ] ✅ Support disabled state with `disabled:opacity-50`
- [ ] ✅ Add proper TypeScript types
- [ ] ✅ Follow accessibility guidelines
- [ ] ✅ Test in light and dark mode
- [ ] ✅ Test responsive behavior

---

## 🚫 Anti-Patterns to Avoid

### **❌ DON'T: Hardcode colors**
```tsx
<button className="bg-indigo-600 hover:bg-indigo-700 text-white">
```

### **✅ DO: Use design tokens**
```tsx
<button className={UI_COLORS.primary}>
```

---

### **❌ DON'T: Mix border radius styles**
```tsx
<div className="rounded-xl"> {/* Card */}
  <button className="rounded-sm"> {/* Button */}
```

### **✅ DO: Use consistent radius**
```tsx
<div className="rounded-lg"> {/* Card */}
  <button className="rounded-md"> {/* Button */}
```

---

### **❌ DON'T: Inline complex styles**
```tsx
<button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
```

### **✅ DO: Use pre-composed variants**
```tsx
<button className={BUTTON_VARIANTS.primary}>
```

---

## 🎓 Examples

### **Complete Form Example:**

```tsx
import { 
  INPUT_VARIANTS, 
  BUTTON_VARIANTS,
  UI_TEXT,
  UI_SPACING
} from '@/constants/ui';

function MyForm() {
  return (
    <form className={`space-y-4`}>
      <div>
        <label className={UI_TEXT.label}>
          Email Address
        </label>
        <input
          type="email"
          className={INPUT_VARIANTS.default}
          placeholder="you@example.com"
        />
      </div>
      
      <div className={`flex ${UI_SPACING.gapMd}`}>
        <button 
          type="button"
          className={BUTTON_VARIANTS.secondary}
        >
          Cancel
        </button>
        <button 
          type="submit"
          className={BUTTON_VARIANTS.primary}
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
```

### **Complete Card Example:**

```tsx
import { 
  CARD_VARIANTS,
  BADGE_VARIANTS,
  UI_TEXT 
} from '@/constants/ui';

function UserCard({ user }) {
  return (
    <div className={CARD_VARIANTS.interactive}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={UI_TEXT.heading3}>{user.name}</h3>
        <span className={BADGE_VARIANTS.success}>Active</span>
      </div>
      <p className={UI_TEXT.caption}>{user.email}</p>
    </div>
  );
}
```

---

## 📚 Additional Resources

- **Tailwind CSS v4 Docs:** https://tailwindcss.com/docs
- **Radix UI (Component primitives):** https://www.radix-ui.com/
- **Lucide Icons:** https://lucide.dev/
- **Inter Font:** https://rsms.me/inter/

---

## 🔄 Migration Guide

**For existing components using hardcoded styles:**

1. Import design tokens:
   ```tsx
   import { BUTTON_VARIANTS, UI_COLORS } from '@/constants/ui';
   ```

2. Replace hardcoded classes:
   ```tsx
   // Before
   <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
   
   // After
   <button className={BUTTON_VARIANTS.primary}>
   ```

3. Test in both light and dark mode

4. Verify responsive behavior

---

**Status:** ✅ Complete  
**Last Updated:** January 14, 2026  
**Version:** 1.0.0
