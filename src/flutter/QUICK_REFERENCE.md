# Flutter Quick Reference

## 🚀 Common Commands

```bash
# Setup & Dependencies
make setup              # First time setup
make get                # Get dependencies
make clean              # Clean project

# Code Generation
make build-runner       # Generate code once
make watch             # Auto-generate on file changes

# Run App
make run-dev           # Debug mode
make run-prod          # Release mode
flutter run -d <device-id>  # Specific device

# Testing
make test              # Run all tests
make test-coverage     # Tests with coverage
flutter test <path>    # Specific test file

# Code Quality
make analyze           # Analyze code
make format            # Format code

# Build
make build-apk         # Android APK
make build-appbundle   # Android App Bundle
make build-ios         # iOS build

# Utility
make help              # Show all commands
flutter doctor -v      # Check Flutter installation
```

## 📦 VHV Widgets Usage

### Buttons

```dart
// Primary Button
VHVButton(
  text: context.tr('common.save'),
  onPressed: _handleSave,
  variant: VHVButtonVariant.primary,
  loading: false,
)

// Outlined Button
VHVButton(
  text: context.tr('common.cancel'),
  onPressed: _handleCancel,
  variant: VHVButtonVariant.outlined,
)

// Text Button
VHVButton(
  text: context.tr('common.skip'),
  onPressed: _handleSkip,
  variant: VHVButtonVariant.text,
)

// Loading State
VHVButton(
  text: context.tr('common.submit'),
  onPressed: null,
  loading: true,
  variant: VHVButtonVariant.primary,
)
```

### Cards

```dart
// Simple Card
VHVCard(
  child: Padding(
    padding: const EdgeInsets.all(AppTheme.spacingMedium),
    child: Text('Card Content'),
  ),
)

// Card with custom padding
VHVCard(
  padding: const EdgeInsets.all(AppTheme.spacingLarge),
  child: Column(
    children: [
      Text('Title'),
      Text('Description'),
    ],
  ),
)
```

### Text Fields

```dart
// Basic TextField
VHVTextField(
  controller: _controller,
  labelText: context.tr('auth.email'),
  keyboardType: TextInputType.emailAddress,
)

// Password Field
VHVTextField(
  controller: _passwordController,
  labelText: context.tr('auth.password'),
  obscureText: true,
  suffixIcon: IconButton(
    icon: Icon(Icons.visibility_outlined),
    onPressed: () => setState(() => _obscure = !_obscure),
  ),
)

// With Validation
VHVTextField(
  controller: _emailController,
  labelText: context.tr('auth.email'),
  validator: (value) {
    if (value?.isEmpty ?? true) {
      return context.tr('validation.required');
    }
    if (!value!.contains('@')) {
      return context.tr('validation.invalidEmail');
    }
    return null;
  },
)

// Disabled State
VHVTextField(
  controller: _controller,
  labelText: context.tr('common.name'),
  enabled: false,
)
```

## 🎨 AppTheme Reference

### Colors

```dart
// Primary
AppTheme.primaryColor            // #6366F1

// Background
AppTheme.backgroundLight         // #FAFAFA
AppTheme.backgroundDark          // #0A0A0A

// Surface
AppTheme.surfaceLight            // #FFFFFF
AppTheme.surfaceDark             // #1A1A1A

// Text
AppTheme.textPrimaryLight        // #171717
AppTheme.textPrimaryDark         // #FAFAFA
AppTheme.textSecondaryLight      // #737373
AppTheme.textSecondaryDark       // #A3A3A3

// Status
AppTheme.success                 // #10B981
AppTheme.error                   // #EF4444
AppTheme.warning                 // #F59E0B
AppTheme.info                    // #3B82F6
```

### Spacing

```dart
AppTheme.spacingXSmall          // 4.0
AppTheme.spacingSmall           // 8.0
AppTheme.spacingMedium          // 16.0
AppTheme.spacingLarge           // 24.0
AppTheme.spacingXLarge          // 32.0
```

### Border Radius

```dart
AppTheme.radiusSmall            // 6.0
AppTheme.radiusMedium           // 8.0
AppTheme.radiusLarge            // 12.0
AppTheme.radiusXLarge           // 16.0
```

### Usage Examples

```dart
// Container with theme
Container(
  padding: const EdgeInsets.all(AppTheme.spacingMedium),
  decoration: BoxDecoration(
    color: AppTheme.surfaceLight,
    borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.05),
        blurRadius: 10,
        offset: const Offset(0, 2),
      ),
    ],
  ),
  child: Text(
    'Content',
    style: TextStyle(color: AppTheme.textPrimaryLight),
  ),
)

// SizedBox spacing
const SizedBox(height: AppTheme.spacingMedium)
const SizedBox(width: AppTheme.spacingLarge)
```

## 🌍 i18n (Translations)

### Usage in Widgets

```dart
// Simple translation
Text(context.tr('auth.login'))

// Translation with interpolation (if supported)
Text(context.tr('user.greeting'))

// Common translations
context.tr('common.save')
context.tr('common.cancel')
context.tr('common.submit')
context.tr('common.delete')
context.tr('common.edit')
context.tr('common.add')
context.tr('common.search')
context.tr('common.filter')
```

### Translation Keys Structure

```dart
// Authentication
context.tr('auth.login')
context.tr('auth.logout')
context.tr('auth.email')
context.tr('auth.password')
context.tr('auth.forgotPassword')

// Dashboard
context.tr('dashboard.title')
context.tr('dashboard.welcome')
context.tr('dashboard.recentActivity')

// Settings
context.tr('settings.title')
context.tr('settings.general')
context.tr('settings.appearance')
context.tr('settings.language')
context.tr('settings.notifications')
context.tr('settings.privacy')

// Common
context.tr('common.save')
context.tr('common.cancel')
context.tr('common.submit')
context.tr('common.delete')
context.tr('common.edit')
```

### Adding New Translations

1. Open language file (e.g., `lib/core/l10n/translations/vi.dart`)
2. Add new key:

```dart
const Map<String, dynamic> viTranslations = {
  'feature': {
    'newKey': 'Giá trị mới',
  },
};
```

3. Repeat for all 6 languages (vi, en, es, zh, ja, ko)
4. Use in widget: `context.tr('feature.newKey')`

## 🏗️ BLoC Pattern Quick Reference

### Creating a BLoC

```dart
// 1. Define Events
@freezed
class FeatureEvent with _$FeatureEvent {
  const factory FeatureEvent.load() = Load;
  const factory FeatureEvent.create({required Data data}) = Create;
  const factory FeatureEvent.update({required Data data}) = Update;
  const factory FeatureEvent.delete({required String id}) = Delete;
}

// 2. Define States
@freezed
class FeatureState with _$FeatureState {
  const factory FeatureState.initial() = Initial;
  const factory FeatureState.loading() = Loading;
  const factory FeatureState.loaded({required List<Data> items}) = Loaded;
  const factory FeatureState.error({required String message}) = Error;
}

// 3. Create BLoC
class FeatureBloc extends Bloc<FeatureEvent, FeatureState> {
  final GetDataUseCase _getDataUseCase;
  
  FeatureBloc({required GetDataUseCase getDataUseCase})
      : _getDataUseCase = getDataUseCase,
        super(const FeatureState.initial()) {
    on<Load>(_onLoad);
  }
  
  Future<void> _onLoad(Load event, Emitter<FeatureState> emit) async {
    emit(const FeatureState.loading());
    final result = await _getDataUseCase.call();
    result.fold(
      (failure) => emit(FeatureState.error(message: failure.message)),
      (data) => emit(FeatureState.loaded(items: data)),
    );
  }
}
```

### Using BLoC in Widget

```dart
// Provide BLoC
BlocProvider(
  create: (context) => getIt<FeatureBloc>()..add(const FeatureEvent.load()),
  child: FeaturePage(),
)

// Listen to BLoC
BlocListener<FeatureBloc, FeatureState>(
  listener: (context, state) {
    state.maybeWhen(
      error: (message) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      },
      orElse: () {},
    );
  },
  child: ChildWidget(),
)

// Build UI based on BLoC state
BlocBuilder<FeatureBloc, FeatureState>(
  builder: (context, state) {
    return state.when(
      initial: () => const SizedBox(),
      loading: () => const CircularProgressIndicator(),
      loaded: (items) => ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) => ListTile(
          title: Text(items[index].name),
        ),
      ),
      error: (message) => Text(message),
    );
  },
)

// BlocConsumer (Listener + Builder)
BlocConsumer<FeatureBloc, FeatureState>(
  listener: (context, state) {
    // Handle side effects
  },
  builder: (context, state) {
    // Build UI
  },
)

// Add Event
context.read<FeatureBloc>().add(const FeatureEvent.load());
```

## 🔧 Dependency Injection

### Registering Dependencies

```dart
// In lib/core/di/injection.dart

// Singleton (created once, lives forever)
getIt.registerSingleton<Dio>(dio);

// Lazy Singleton (created on first access)
getIt.registerLazySingleton<AuthRepository>(
  () => AuthRepositoryImpl(
    remoteDataSource: getIt<AuthRemoteDataSource>(),
  ),
);

// Factory (new instance every time)
getIt.registerFactory<AuthBloc>(
  () => AuthBloc(loginUseCase: getIt<LoginUseCase>()),
);
```

### Using Dependencies

```dart
// In widget
final authBloc = getIt<AuthBloc>();

// In BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _loginUseCase;
  
  AuthBloc({required LoginUseCase loginUseCase})
      : _loginUseCase = loginUseCase,
        super(const AuthState.initial());
}
```

## 🌐 API Integration

### Making API Calls

```dart
// In DataSource
class UserRemoteDataSource {
  final DioClient _dioClient;
  
  Future<List<UserModel>> getUsers() async {
    final response = await _dioClient.get('/users');
    return (response.data as List)
        .map((json) => UserModel.fromJson(json))
        .toList();
  }
  
  Future<UserModel> createUser(UserModel user) async {
    final response = await _dioClient.post(
      '/users',
      data: user.toJson(),
    );
    return UserModel.fromJson(response.data);
  }
}
```

### Error Handling

```dart
// In Repository
Future<Either<Failure, List<User>>> getUsers() async {
  try {
    final users = await _remoteDataSource.getUsers();
    return Right(users.map((model) => model.toEntity()).toList());
  } on DioException catch (e) {
    return Left(ServerFailure(
      message: e.response?.data['message'] ?? 'Server error',
    ));
  } catch (e) {
    return Left(ServerFailure(message: e.toString()));
  }
}
```

## 📱 Navigation

### GoRouter Routes

```dart
// Define routes
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
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsPage(),
      routes: [
        GoRoute(
          path: 'appearance',
          builder: (context, state) => const AppearancePage(),
        ),
      ],
    ),
  ],
);

// Navigate
context.go('/dashboard');              // Navigate to route
context.push('/settings');             // Push new route
context.pop();                         // Go back
context.go('/settings/appearance');    // Nested route
```

## 💾 Local Storage

### Secure Storage (Tokens)

```dart
// Save
await _secureStorage.write(key: 'auth_token', value: token);

// Read
final token = await _secureStorage.read(key: 'auth_token');

// Delete
await _secureStorage.delete(key: 'auth_token');

// Delete all
await _secureStorage.deleteAll();
```

### Shared Preferences (Settings)

```dart
// Save
await _prefs.setString('theme_mode', 'dark');
await _prefs.setBool('notifications_enabled', true);
await _prefs.setInt('user_id', 123);

// Read
final themeMode = _prefs.getString('theme_mode') ?? 'light';
final notificationsEnabled = _prefs.getBool('notifications_enabled') ?? false;
final userId = _prefs.getInt('user_id') ?? 0;

// Remove
await _prefs.remove('theme_mode');

// Clear all
await _prefs.clear();
```

## 🧪 Testing

### UseCase Test

```dart
test('should return User when login is successful', () async {
  // Arrange
  when(() => mockRepository.login(any(), any()))
      .thenAnswer((_) async => Right(testUser));
  
  // Act
  final result = await useCase.call(LoginParams(
    email: 'test@example.com',
    password: 'password',
  ));
  
  // Assert
  expect(result, Right(testUser));
  verify(() => mockRepository.login('test@example.com', 'password'))
      .called(1);
});
```

### BLoC Test

```dart
blocTest<AuthBloc, AuthState>(
  'emits [loading, authenticated] when login succeeds',
  build: () {
    when(() => mockLoginUseCase.call(any()))
        .thenAnswer((_) async => Right(testUser));
    return AuthBloc(loginUseCase: mockLoginUseCase);
  },
  act: (bloc) => bloc.add(const AuthEvent.login(
    email: 'test@example.com',
    password: 'password',
  )),
  expect: () => [
    const AuthState.loading(),
    AuthState.authenticated(user: testUser),
  ],
  verify: (_) {
    verify(() => mockLoginUseCase.call(any())).called(1);
  },
);
```

## 🎯 Common Patterns

### Loading State

```dart
BlocBuilder<FeatureBloc, FeatureState>(
  builder: (context, state) {
    return state.maybeWhen(
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
      orElse: () => ContentWidget(),
    );
  },
)
```

### Error Handling

```dart
BlocListener<FeatureBloc, FeatureState>(
  listener: (context, state) {
    state.maybeWhen(
      error: (message) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppTheme.error,
          ),
        );
      },
      orElse: () {},
    );
  },
  child: ChildWidget(),
)
```

### Pull to Refresh

```dart
RefreshIndicator(
  onRefresh: () async {
    context.read<FeatureBloc>().add(const FeatureEvent.load());
  },
  child: ListView(...),
)
```

### Form Validation

```dart
final _formKey = GlobalKey<FormState>();

Form(
  key: _formKey,
  child: Column(
    children: [
      VHVTextField(
        validator: (value) {
          if (value?.isEmpty ?? true) {
            return 'Required field';
          }
          return null;
        },
      ),
      VHVButton(
        text: 'Submit',
        onPressed: () {
          if (_formKey.currentState?.validate() ?? false) {
            // Form is valid
          }
        },
      ),
    ],
  ),
)
```

## 📝 Code Snippets

### Freezed Data Class

```dart
@freezed
class ClassName with _$ClassName {
  const factory ClassName({
    required String id,
    required String name,
  }) = _ClassName;
  
  factory ClassName.fromJson(Map<String, dynamic> json) =>
      _$ClassNameFromJson(json);
}
```

### JSON Serializable Model

```dart
@JsonSerializable()
class ClassNameModel {
  final String id;
  final String name;
  
  ClassNameModel({required this.id, required this.name});
  
  factory ClassNameModel.fromJson(Map<String, dynamic> json) =>
      _$ClassNameModelFromJson(json);
  
  Map<String, dynamic> toJson() => _$ClassNameModelToJson(this);
}
```

---

## 🔗 More Resources

- **Architecture Guide**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Setup Guide**: [FLUTTER_SETUP.md](FLUTTER_SETUP.md)
- **Development Rules**: [/DEVELOPMENT_RULES.md](/DEVELOPMENT_RULES.md)
- **VHV Widgets**: https://github.com/vhvplatform/flutter-vhv_widgets.git

---

**Quick help**: `make help` or check README.md
