# Flutter Integration Guide

## 📱 Flutter + React + Golang - Complete Integration

Tài liệu này mô tả cách Flutter app tích hợp với React frontend và Golang backend trong dự án BasicSoftTemplate.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Flutter)                    │
│  - Clean Architecture + BLoC                                 │
│  - VHV Widgets Library                                       │
│  - 6 Languages i18n                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Backend API (Golang)                      │
│  - JWT Authentication                                        │
│  - User Management                                           │
│  - Platform Settings                                         │
│  - ~90% Test Coverage                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ PostgreSQL/MySQL
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      Database                                │
│  - Users, Settings, etc.                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Web App (React)                          │
│  - VHV Platform Framework                                    │
│  - TailwindCSS v4.0                                          │
│  - Same Design System as Flutter                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Uses Same Backend API
                     │
                     └────────────────────────────────────────┐
```

---

## 🎨 Shared Design System

Flutter và React sử dụng **cùng một design system**:

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6366F1` | Main brand color, buttons, links |
| Background (Light) | `#FAFAFA` | Page background |
| Background (Dark) | `#0A0A0A` | Dark mode background |
| Success | `#10B981` | Success messages |
| Error | `#EF4444` | Error messages |
| Warning | `#F59E0B` | Warnings |
| Info | `#3B82F6` | Info messages |

### Typography

- **Font**: Inter
- **Weights**: 100-900 (9 weights)

### Spacing

- **XSmall**: 4px
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **XLarge**: 32px

### Border Radius

- **Small**: 6px
- **Medium**: 8px
- **Large**: 12px
- **XLarge**: 16px

---

## 🔗 API Integration

### Backend API Endpoints

**Base URL**: `http://localhost:8080/api/v1`

#### Authentication

```
POST   /auth/login          - User login
POST   /auth/logout         - User logout
POST   /auth/register       - User registration
GET    /auth/me             - Get current user
POST   /auth/refresh        - Refresh token
POST   /auth/forgot-password - Password reset
```

#### Users

```
GET    /users               - List users
GET    /users/:id           - Get user
POST   /users               - Create user
PUT    /users/:id           - Update user
DELETE /users/:id           - Delete user
```

#### Settings

```
GET    /settings            - List settings
GET    /settings/:key       - Get setting
POST   /settings            - Create setting
PUT    /settings/:key       - Update setting
DELETE /settings/:key       - Delete setting
```

### Flutter API Configuration

**Location**: `lib/core/di/injection.dart`

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'http://localhost:8080/api/v1',  // Development
  connectTimeout: const Duration(seconds: 30),
  receiveTimeout: const Duration(seconds: 30),
));
```

#### Environment-Specific URLs

```dart
// Local Development (iOS Simulator)
baseUrl: 'http://localhost:8080/api/v1'

// Local Development (Android Emulator)
baseUrl: 'http://10.0.2.2:8080/api/v1'

// Physical Device (replace with your IP)
baseUrl: 'http://192.168.1.100:8080/api/v1'

// Production
baseUrl: 'https://api.yourdomain.com/api/v1'
```

### React API Configuration

**Location**: `src/api/config.ts` (example)

```typescript
export const API_BASE_URL = 
  process.env.VITE_API_URL || 'http://localhost:8080/api/v1';
```

---

## 🔐 Authentication Flow

### 1. Login Process

#### Flutter Implementation

```dart
// User taps login button
context.read<AuthBloc>().add(
  AuthEvent.login(email: email, password: password),
);

// AuthBloc calls LoginUseCase
final result = await _loginUseCase.call(LoginParams(...));

// LoginUseCase calls AuthRepository
final response = await _authRepository.login(...);

// Repository calls API via DataSource
final authResponse = await _remoteDataSource.login(...);

// Token saved to FlutterSecureStorage
await _localDataSource.saveToken(authResponse.token);

// BLoC emits authenticated state
emit(AuthState.authenticated(user: authResponse.user));

// App navigates to Dashboard
context.go('/dashboard');
```

#### React Implementation

```typescript
// User submits login form
const handleLogin = async (email, password) => {
  const response = await authService.login(email, password);
  localStorage.setItem('auth_token', response.token);
  navigate('/dashboard');
};
```

#### Backend (Golang)

```go
// POST /auth/login
func (h *AuthHandler) Login(c *gin.Context) {
  // Validate credentials
  user, err := h.authService.ValidateCredentials(email, password)
  
  // Generate JWT token
  token, err := h.jwtService.GenerateToken(user)
  
  // Return response
  c.JSON(200, gin.H{
    "token": token,
    "user": user,
  })
}
```

### 2. Authenticated Requests

#### Flutter

```dart
// ApiInterceptor automatically adds token
class ApiInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, ...) async {
    final token = await _secureStorage.read(key: 'auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
  }
}

// Usage
await _dioClient.get('/users'); // Token added automatically
```

#### React

```typescript
// Axios interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Backend

```go
// Auth Middleware
func AuthMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    token := c.GetHeader("Authorization")
    // Validate JWT token
    claims, err := validateToken(token)
    c.Set("user_id", claims.UserID)
    c.Next()
  }
}
```

---

## 📊 Feature Parity

### Current Status

| Feature | Backend | React | Flutter |
|---------|---------|-------|---------|
| Authentication | ✅ | 🚧 | ✅ |
| User Profile | ✅ | 🚧 | ✅ |
| Dashboard | ✅ | 🚧 | ✅ |
| Settings | ✅ | 🚧 | ✅ |
| Theme Toggle | N/A | 🚧 | ✅ |
| Language Switch | N/A | 🚧 | ✅ |
| User Management | ✅ | ❌ | ❌ |

**Legend:**
- ✅ Complete
- 🚧 In Progress
- ❌ Not Started

### Planned Features

Next features to implement (in order of priority):

1. **User Management CRUD**
   - Backend: ✅ Ready
   - React: Create UI components
   - Flutter: Create feature module

2. **Platform Settings Management**
   - Backend: ✅ Ready
   - React: Settings UI
   - Flutter: Settings module

3. **Analytics Dashboard**
   - Backend: Create analytics endpoints
   - React: Charts and graphs
   - Flutter: Dashboard with charts

---

## 🌍 Internationalization

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
| Vietnamese | vi | ✅ |
| English | en | ✅ |
| Spanish | es | ✅ |
| Chinese | zh | ✅ |
| Japanese | ja | ✅ |
| Korean | ko | ✅ |

### Adding Translations

#### Flutter

1. Edit translation file:
```dart
// lib/core/l10n/translations/vi.dart
const Map<String, dynamic> viTranslations = {
  'feature': {
    'newKey': 'Giá trị mới',
  },
};
```

2. Use in widget:
```dart
Text(context.tr('feature.newKey'))
```

#### React

1. Edit translation file:
```json
// public/locales/vi/translation.json
{
  "feature": {
    "newKey": "Giá trị mới"
  }
}
```

2. Use in component:
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<div>{t('feature.newKey')}</div>
```

---

## 🧩 Component Mapping

Tương đồng giữa Flutter và React components:

| Flutter | React | Purpose |
|---------|-------|---------|
| `VHVButton` | `<Button>` | Primary button |
| `VHVCard` | `<Card>` | Container card |
| `VHVTextField` | `<Input>` | Text input |
| `AppScaffold` | `<Layout>` | Page layout |
| `BlocBuilder` | `useState/useReducer` | State management |
| `GoRouter` | `react-router` | Navigation |

### Example: Button Component

#### Flutter
```dart
VHVButton(
  text: context.tr('common.save'),
  onPressed: _handleSave,
  variant: VHVButtonVariant.primary,
  loading: isLoading,
)
```

#### React
```typescript
<Button
  onClick={handleSave}
  variant="primary"
  loading={isLoading}
>
  {t('common.save')}
</Button>
```

---

## 🔄 State Management

### Flutter (BLoC Pattern)

```dart
// Event
context.read<UserBloc>().add(UserEvent.load());

// State
BlocBuilder<UserBloc, UserState>(
  builder: (context, state) {
    return state.when(
      loading: () => CircularProgressIndicator(),
      loaded: (users) => UserList(users),
      error: (msg) => ErrorWidget(msg),
    );
  },
)
```

### React (Context/Redux/Zustand)

```typescript
// Context example
const { users, loading, error } = useUsers();

if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <UserList users={users} />;
```

---

## 🧪 Testing Strategy

### Backend (Golang)

```go
func TestUserService_GetUser(t *testing.T) {
  // Arrange
  mockRepo := new(MockUserRepository)
  service := NewUserService(mockRepo)
  
  // Act
  user, err := service.GetUser("123")
  
  // Assert
  assert.NoError(t, err)
  assert.Equal(t, "John", user.Name)
}
```

### Flutter

```dart
blocTest<UserBloc, UserState>(
  'emits [loading, loaded] when getUsers succeeds',
  build: () => UserBloc(getUsersUseCase: mockUseCase),
  act: (bloc) => bloc.add(UserEvent.load()),
  expect: () => [
    UserState.loading(),
    UserState.loaded(users: testUsers),
  ],
);
```

### React

```typescript
test('renders user list', async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

---

## 📱 Device-Specific Considerations

### iOS

```dart
// Info.plist permissions
<key>NSCameraUsageDescription</key>
<string>Camera access for profile photo</string>

// App Transport Security (for development)
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Android

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>

<!-- Network security config (for development) -->
<application
  android:usesCleartextTraffic="true">
```

---

## 🚀 Deployment

### Backend

```bash
# Build
cd golang-backend
go build -o main cmd/api/main.go

# Run
./main

# Docker
docker build -t backend:latest .
docker run -p 8080:8080 backend:latest
```

### React

```bash
# Build
npm run build

# Preview
npm run preview

# Deploy (example: Vercel)
vercel deploy
```

### Flutter

```bash
# Android
cd flutter
flutter build apk --release
flutter build appbundle --release

# iOS
flutter build ios --release

# Deploy
# Upload to Play Store / App Store
```

---

## 📋 Development Checklist

### When Adding a New Feature

- [ ] **Backend**
  - [ ] Create API endpoints
  - [ ] Write unit tests
  - [ ] Update API documentation
  - [ ] Test with Postman/curl

- [ ] **React**
  - [ ] Create components
  - [ ] Add translations
  - [ ] Implement API calls
  - [ ] Test responsive design

- [ ] **Flutter**
  - [ ] Create data layer (Repository, DataSource, Models)
  - [ ] Create domain layer (Entities, UseCases)
  - [ ] Create presentation layer (BLoC, Pages)
  - [ ] Use VHV Widgets
  - [ ] Add translations (6 languages)
  - [ ] Write tests

- [ ] **Documentation**
  - [ ] Update README files
  - [ ] Add code comments
  - [ ] Update API docs

---

## 🔍 Debugging

### Backend

```bash
# Enable debug logging
export LOG_LEVEL=debug
go run cmd/api/main.go
```

### React

```typescript
// Browser DevTools
console.log('Debug:', data);

// React DevTools extension
// Network tab for API calls
```

### Flutter

```dart
// Debug print
print('Debug: $data');

// Logger
Logger().d('Debug message');

// Flutter DevTools
flutter pub global activate devtools
flutter pub global run devtools
```

### Network Debugging

**Flutter:**
- Uses `pretty_dio_logger` - all requests logged automatically

**React:**
- Browser Network tab
- Redux DevTools (if using Redux)

---

## 📚 Resources

### Documentation
- [Backend API Docs](/golang-backend/README.md)
- [Flutter Setup](/flutter/FLUTTER_SETUP.md)
- [Flutter Architecture](/flutter/ARCHITECTURE.md)
- [Development Rules](/DEVELOPMENT_RULES.md)

### External Resources
- [VHV React Framework](https://github.com/vhvplatform/react-framework)
- [VHV Flutter Widgets](https://github.com/vhvplatform/flutter-vhv_widgets.git)
- [Flutter BLoC](https://bloclibrary.dev/)
- [Go Gin Framework](https://gin-gonic.com/)

---

## 💡 Best Practices

### 1. Keep Features Synchronized
Always implement features across all platforms simultaneously.

### 2. Use Shared Design Tokens
Never hardcode colors, spacing, or font sizes.

### 3. Maintain i18n
All user-facing text must be translatable.

### 4. Follow Architecture
Respect layer boundaries in both Flutter and React.

### 5. Test Thoroughly
Backend: ~90% coverage, Flutter: business logic tests.

### 6. Document Everything
Keep docs updated as features are added.

---

## 🎯 Quick Commands

```bash
# Start all services
cd golang-backend && make run &
cd .. && npm run dev &
cd flutter && make run-dev

# Run tests
cd golang-backend && make test
cd flutter && make test

# Build for production
cd golang-backend && make build
npm run build
cd flutter && make build-apk
```

---

**Happy Coding! 🚀**

For questions or issues, refer to the documentation or check the codebase structure.

Last Updated: 2026-01-03
