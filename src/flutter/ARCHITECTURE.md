# Flutter App Architecture

## 📐 Clean Architecture

Project này sử dụng **Clean Architecture** kết hợp với **BLoC Pattern** cho state management.

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│  (UI, Widgets, BLoC, Pages)                                │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│  (Entities, Use Cases, Repository Interfaces)              │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                             │
│  (Repository Implementations, Data Sources, Models)        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
lib/
├── core/                           # Core functionality
│   ├── di/                        # Dependency Injection
│   │   └── injection.dart        # GetIt configuration
│   ├── error/                    # Error handling
│   │   └── failures.dart        # Failure classes
│   ├── l10n/                     # Localization
│   │   ├── app_localizations.dart
│   │   └── translations/        # Translation files
│   │       ├── vi.dart          # Vietnamese
│   │       ├── en.dart          # English
│   │       ├── es.dart          # Spanish
│   │       ├── zh.dart          # Chinese
│   │       ├── ja.dart          # Japanese
│   │       └── ko.dart          # Korean
│   ├── network/                  # Network layer
│   │   ├── dio_client.dart      # HTTP client wrapper
│   │   └── api_interceptor.dart # Auth interceptor
│   ├── router/                   # Navigation
│   │   └── app_router.dart      # GoRouter configuration
│   ├── theme/                    # App theme
│   │   └── app_theme.dart       # Theme configuration
│   └── usecases/                 # Base use cases
│       └── usecase.dart         # UseCase interface
│
├── features/                      # Feature modules
│   ├── auth/                     # Authentication feature
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── auth_local_data_source.dart
│   │   │   │   └── auth_remote_data_source.dart
│   │   │   ├── models/
│   │   │   │   └── auth_response.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       ├── logout_usecase.dart
│   │   │       └── check_auth_status_usecase.dart
│   │   └── presentation/
│   │       ├── bloc/
│   │       │   ├── auth_bloc.dart
│   │       │   ├── auth_event.dart
│   │       │   └── auth_state.dart
│   │       └── pages/
│   │           └── login_page.dart
│   │
│   ├── dashboard/                # Dashboard feature
│   │   └── presentation/
│   │       └── pages/
│   │           └── dashboard_page.dart
│   │
│   ├── profile/                  # Profile feature
│   │   └── presentation/
│   │       └── pages/
│   │           └── profile_page.dart
│   │
│   └── settings/                 # Settings feature
│       └── presentation/
│           ├── bloc/
│           │   ├── theme_bloc.dart
│           │   ├── theme_event.dart
│           │   ├── theme_state.dart
│           │   ├── language_bloc.dart
│           │   ├── language_event.dart
│           │   └── language_state.dart
│           └── pages/
│               ├── settings_page.dart
│               └── appearance_page.dart
│
└── shared/                        # Shared components
    └── presentation/
        ├── pages/
        │   └── splash_page.dart
        └── widgets/
            └── app_scaffold.dart
```

## 🔄 Data Flow

### 1. Presentation Layer → Domain Layer → Data Layer

```
User Action
    ↓
Widget/Page
    ↓
BLoC Event
    ↓
BLoC (calls UseCase)
    ↓
UseCase (calls Repository)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Data)
    ↓
Data Source (Remote/Local)
    ↓
API/Storage
```

### 2. Data Layer → Domain Layer → Presentation Layer

```
API/Storage
    ↓
Data Source
    ↓
Repository Implementation
    ↓
UseCase
    ↓
BLoC State
    ↓
Widget/Page
    ↓
UI Update
```

## 🧩 Layer Responsibilities

### Presentation Layer

**Responsibility**: Hiển thị UI và xử lý user interactions

**Components**:
- **Pages**: Screen widgets
- **Widgets**: Reusable UI components
- **BLoC**: Business logic và state management

**Rules**:
- ✅ Sử dụng UseCase thông qua BLoC
- ✅ Listen BLoC states và update UI
- ❌ KHÔNG gọi Repository trực tiếp
- ❌ KHÔNG chứa business logic

**Example**:
```dart
class LoginPage extends StatelessWidget {
  void _handleLogin() {
    context.read<AuthBloc>().add(
      AuthEvent.login(email: email, password: password),
    );
  }
}
```

### Domain Layer

**Responsibility**: Business logic và entities

**Components**:
- **Entities**: Core business objects
- **Use Cases**: Business operations
- **Repository Interfaces**: Data contracts

**Rules**:
- ✅ Pure Dart (không depend vào Flutter)
- ✅ Define interfaces cho repositories
- ✅ Chứa business rules
- ❌ KHÔNG biết về implementation details

**Example**:
```dart
class LoginUseCase {
  final AuthRepository _repository;
  
  Future<Either<Failure, User>> call(LoginParams params) {
    return _repository.login(
      email: params.email,
      password: params.password,
    );
  }
}
```

### Data Layer

**Responsibility**: Data management và API calls

**Components**:
- **Repository Implementations**: Implement domain interfaces
- **Data Sources**: Local (cache) và Remote (API)
- **Models**: Data transfer objects

**Rules**:
- ✅ Implement repository interfaces
- ✅ Handle data transformation
- ✅ Manage caching strategy
- ❌ KHÔNG expose implementation details

**Example**:
```dart
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;
  
  Future<Either<Failure, User>> login(...) async {
    final response = await _remoteDataSource.login(...);
    await _localDataSource.saveToken(response.token);
    return Right(response.user);
  }
}
```

## 🎯 BLoC Pattern

### BLoC Components

```dart
// Event - User actions
@freezed
class AuthEvent with _$AuthEvent {
  const factory AuthEvent.login({
    required String email,
    required String password,
  }) = Login;
}

// State - UI states
@freezed
class AuthState with _$AuthState {
  const factory AuthState.authenticated({
    required User user,
  }) = AuthAuthenticated;
}

// BLoC - Business logic
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  Future<void> _onLogin(Login event, Emitter emit) async {
    emit(const AuthState.loading());
    final result = await _loginUseCase.call(...);
    result.fold(
      (failure) => emit(AuthState.error(...)),
      (user) => emit(AuthState.authenticated(user: user)),
    );
  }
}
```

### BLoC Flow

```
User Action → Widget
              ↓
          Add Event to BLoC
              ↓
          BLoC processes Event
              ↓
          Call UseCase
              ↓
          Emit new State
              ↓
          Widget rebuilds with new State
```

## 🔧 Dependency Injection

### GetIt Configuration

```dart
// Register dependencies
final getIt = GetIt.instance;

Future<void> configureDependencies() async {
  // Core
  getIt.registerSingleton<Dio>(dio);
  getIt.registerSingleton<DioClient>(DioClient(dio));
  
  // Data Sources
  getIt.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(getIt<DioClient>()),
  );
  
  // Repositories
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: getIt<AuthRemoteDataSource>(),
      localDataSource: getIt<AuthLocalDataSource>(),
    ),
  );
  
  // Use Cases
  getIt.registerLazySingleton(
    () => LoginUseCase(getIt<AuthRepository>()),
  );
  
  // BLoC
  getIt.registerFactory(
    () => AuthBloc(loginUseCase: getIt<LoginUseCase>()),
  );
}
```

### Usage

```dart
// In main.dart
await configureDependencies();

// In widget
BlocProvider(
  create: (context) => getIt<AuthBloc>(),
  child: LoginPage(),
)
```

## 🌐 API Integration

### Network Layer

```dart
class DioClient {
  Future<Response> get(String path) async {
    return await _dio.get(path);
  }
  
  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }
}
```

### API Interceptor

```dart
class ApiInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, ...) async {
    // Add auth token
    final token = await _secureStorage.read(key: 'auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
  }
}
```

## 💾 Local Storage

### Secure Storage (Tokens)

```dart
class AuthLocalDataSource {
  final FlutterSecureStorage _secureStorage;
  
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }
}
```

### Shared Preferences (Settings)

```dart
class ThemeBloc {
  final SharedPreferences _prefs;
  
  Future<void> _onChangeTheme(...) async {
    await _prefs.setString('theme_mode', themeMode.name);
  }
}
```

## 🧪 Testing Strategy

### Unit Tests

```dart
test('should return User when login is successful', () async {
  // Arrange
  when(() => mockRepository.login(...))
      .thenAnswer((_) async => Right(testUser));
  
  // Act
  final result = await useCase.call(testParams);
  
  // Assert
  expect(result, Right(testUser));
});
```

### BLoC Tests

```dart
blocTest<AuthBloc, AuthState>(
  'emits [loading, authenticated] when login succeeds',
  build: () => AuthBloc(loginUseCase: mockLoginUseCase),
  act: (bloc) => bloc.add(AuthEvent.login(...)),
  expect: () => [
    const AuthState.loading(),
    AuthState.authenticated(user: testUser),
  ],
);
```

## 📱 Navigation

### GoRouter Configuration

```dart
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardPage(),
    ),
  ],
  redirect: (context, state) {
    // Auth guard
    final isAuthenticated = ...;
    if (!isAuthenticated && state.location != '/login') {
      return '/login';
    }
    return null;
  },
);
```

## 🎨 Theming

### Theme Configuration

```dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        surface: surfaceLight,
      ),
      // ...
    );
  }
}
```

## 🌍 Internationalization

### Translation System

```dart
// Define translations
const Map<String, dynamic> viTranslations = {
  'common': {
    'welcome': 'Chào mừng',
  },
};

// Use in widget
Text(context.tr('common.welcome'))
```

## 🔒 Error Handling

### Failure Classes

```dart
abstract class Failure {
  final String message;
  const Failure({required this.message});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message});
}
```

### Error Propagation

```dart
// Repository
try {
  final response = await _remoteDataSource.login(...);
  return Right(response.user);
} catch (e) {
  return Left(ServerFailure(message: e.toString()));
}

// BLoC
result.fold(
  (failure) => emit(AuthState.error(message: failure.message)),
  (user) => emit(AuthState.authenticated(user: user)),
);
```

## 📊 Best Practices

### ✅ DO

1. **Separation of Concerns**: Mỗi layer có trách nhiệm riêng
2. **Dependency Inversion**: Depend on abstractions
3. **Single Responsibility**: Mỗi class có một mục đích duy nhất
4. **Immutability**: Sử dụng `@freezed` cho data classes
5. **Type Safety**: Sử dụng strong typing
6. **Error Handling**: Handle errors properly với `Either`
7. **Testing**: Write tests cho business logic

### ❌ DON'T

1. **God Classes**: Tránh classes quá lớn
2. **Direct Dependencies**: Không depend vào concrete implementations
3. **Business Logic in UI**: Giữ UI clean
4. **Mutable State**: Tránh mutable objects
5. **Magic Strings**: Sử dụng constants
6. **Hardcoded Values**: Sử dụng configuration
7. **Ignoring Errors**: Always handle errors

## 🚀 Performance Tips

1. **Lazy Loading**: Sử dụng `registerLazySingleton` cho DI
2. **Const Constructors**: Sử dụng `const` khi có thể
3. **Image Caching**: Sử dụng `cached_network_image`
4. **List Optimization**: Sử dụng `ListView.builder`
5. **State Management**: Chỉ rebuild widgets cần thiết

---

📚 **Further Reading**:
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [BLoC Pattern Documentation](https://bloclibrary.dev/)
- [Flutter Architecture Samples](https://github.com/brianegan/flutter_architecture_samples)
