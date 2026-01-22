# 📚 Shim Usage Examples

Các ví dụ thực tế về cách sử dụng shim để viết code giống Next.js 100%.

---

## 1. Basic Navigation

### ✅ Correct - Sử dụng shim
```typescript
import { useRouter, Link } from '../shim/next-navigation';

export function MyComponent() {
  const router = useRouter();

  const handleClick = () => {
    // Client-side navigation
    router.push('/dashboard');
  };

  return (
    <div>
      <button onClick={handleClick}>Go to Dashboard</button>
      
      {/* Or use Link component */}
      <Link href="/dashboard">Dashboard</Link>
    </div>
  );
}
```

### ❌ Incorrect - Import trực tiếp từ react-router
```typescript
import { useNavigate, Link } from 'react-router'; // ❌ Sẽ phải sửa khi migration

export function MyComponent() {
  const navigate = useNavigate(); // ❌ API khác Next.js
  // ...
}
```

---

## 2. Dynamic Routes với Params

### ✅ Correct - Next.js compatible
```typescript
import { useParams, useRouter } from '../shim/next-navigation';

interface RoleDetailProps {
  // Props nếu có
}

export function RoleDetail() {
  // Type-safe params
  const params = useParams<{ id: string }>();
  const router = useRouter();
  
  const roleId = params.id; // Type: string
  
  const handleDelete = async () => {
    await deleteRole(roleId);
    router.push('/admin/roles'); // Navigate back
  };

  return (
    <div>
      <h1>Role #{roleId}</h1>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

---

## 3. Table với Clickable Rows

### ✅ Correct - Xử lý stopPropagation đúng cách
```typescript
import { useRouter } from '../shim/next-navigation';
import { Link } from '../shim/next-navigation';

interface Role {
  id: string;
  name: string;
  description: string;
}

export function RolesTable({ roles }: { roles: Role[] }) {
  const router = useRouter();
  
  const handleRowClick = (roleId: string) => {
    router.push(`/admin/roles/${roleId}`);
  };
  
  const handleEdit = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation(); // Prevent row click
    router.push(`/admin/roles/${roleId}/edit`);
  };
  
  const handleDelete = async (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation(); // Prevent row click
    await deleteRole(roleId);
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {roles.map((role) => (
          <tr 
            key={role.id}
            onClick={() => handleRowClick(role.id)}
            className="cursor-pointer hover:bg-gray-100"
          >
            <td>
              {/* Link với stopPropagation */}
              <Link 
                href={`/admin/roles/${role.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline"
              >
                {role.name}
              </Link>
            </td>
            <td>{role.description}</td>
            <td>
              <button 
                onClick={(e) => handleEdit(e, role.id)}
                className="mr-2"
              >
                Edit
              </button>
              <button 
                onClick={(e) => handleDelete(e, role.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 4. Search Params (Query Strings)

### ✅ Correct - Next.js compatible
```typescript
import { useSearchParams, useRouter } from '../shim/next-navigation';

export function SearchableList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const router = useRouter();
  
  // Read search params
  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';
  
  const handleSearch = (newQuery: string) => {
    // Update search params
    const params = new URLSearchParams(searchParams);
    params.set('q', newQuery);
    params.set('page', '1'); // Reset to page 1
    setSearchParams(params);
  };
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      <div>Page: {page}</div>
      <button onClick={() => handlePageChange(Number(page) - 1)}>
        Previous
      </button>
      <button onClick={() => handlePageChange(Number(page) + 1)}>
        Next
      </button>
    </div>
  );
}
```

---

## 5. Breadcrumb Navigation

### ✅ Correct - Sử dụng usePathname
```typescript
import { usePathname, Link } from '../shim/next-navigation';

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Parse pathname to breadcrumb items
  const paths = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = paths.map((path, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/');
    const label = path.charAt(0).toUpperCase() + path.slice(1);
    
    return { href, label };
  });

  return (
    <nav className="breadcrumb">
      <Link href="/">Home</Link>
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.href}>
          {' / '}
          {index === breadcrumbs.length - 1 ? (
            <span>{crumb.label}</span>
          ) : (
            <Link href={crumb.href}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
```

---

## 6. Protected Route Component

### ✅ Correct - Redirect với useRouter
```typescript
import { useRouter } from '../shim/next-navigation';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return null; // Will redirect
  }
  
  return <>{children}</>;
}
```

---

## 7. Form với Navigation sau Submit

### ✅ Correct - Router push sau khi submit thành công
```typescript
import { useRouter } from '../shim/next-navigation';
import { useState } from 'react';

interface RoleFormData {
  name: string;
  description: string;
}

export function RoleForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newRole = await createRole(formData);
      
      // Navigate to detail page after success
      router.push(`/admin/roles/${newRole.id}`);
      
      // Or back to list
      // router.push('/admin/roles');
    } catch (error) {
      console.error('Failed to create role:', error);
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Role name"
        required
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Role'}
      </button>
      <button 
        type="button" 
        onClick={() => router.back()}
      >
        Cancel
      </button>
    </form>
  );
}
```

---

## 8. Conditional Navigation

### ✅ Correct - Check conditions trước khi navigate
```typescript
import { useRouter } from '../shim/next-navigation';

export function DashboardCard({ hasAccess }: { hasAccess: boolean }) {
  const router = useRouter();
  
  const handleClick = () => {
    if (!hasAccess) {
      alert('You do not have access to this feature');
      return;
    }
    
    router.push('/admin/advanced-features');
  };

  return (
    <div onClick={handleClick} className="card">
      <h3>Advanced Features</h3>
      {!hasAccess && <span className="badge">Locked</span>}
    </div>
  );
}
```

---

## 9. Back Button với Fallback

### ✅ Correct - Fallback nếu không có history
```typescript
import { useRouter, usePathname } from '../shim/next-navigation';

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleBack = () => {
    // Check if there's history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to parent route
      const parentPath = pathname.split('/').slice(0, -1).join('/') || '/';
      router.push(parentPath);
    }
  };

  return (
    <button onClick={handleBack}>
      ← Back
    </button>
  );
}
```

---

## 10. Multi-step Form với Query Params

### ✅ Correct - Persist state trong URL
```typescript
import { useSearchParams, useRouter } from '../shim/next-navigation';

export function MultiStepForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const router = useRouter();
  
  const currentStep = Number(searchParams.get('step') || '1');
  
  const goToStep = (step: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step.toString());
    setSearchParams(params);
  };
  
  const handleNext = () => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    } else {
      // Submit and redirect
      submitForm();
      router.push('/success');
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  return (
    <div>
      <div>Step {currentStep} of 3</div>
      
      {currentStep === 1 && <Step1Form />}
      {currentStep === 2 && <Step2Form />}
      {currentStep === 3 && <Step3Form />}
      
      <div className="actions">
        {currentStep > 1 && (
          <button onClick={handlePrev}>Previous</button>
        )}
        <button onClick={handleNext}>
          {currentStep === 3 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🎓 Best Practices Summary

1. **Always import từ shim** - Không bao giờ import trực tiếp từ react-router
2. **Use router.push()** thay vì window.location
3. **stopPropagation() trong nested clicks** - Tránh conflicts
4. **Type-safe params** - Luôn define interface cho useParams
5. **Handle loading states** - Check loading trước khi redirect
6. **Fallback navigation** - Có plan B cho router.back()
7. **Preserve query params** - Dùng URLSearchParams để update
8. **Consistent Link usage** - Prefer Link component over onClick navigation

---

**Lưu ý:** Tất cả examples này sẽ hoạt động 100% khi migration sang Next.js mà không cần sửa logic code!
