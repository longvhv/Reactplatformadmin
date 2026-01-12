# Development Rules - Quy Tắc Phát Triển

## 🎯 Core Principles

### 1. **Đồng Bộ Web ↔️ Flutter**

**QUY TẮC VÀNG**: Mỗi khi tạo tính năng mới ở bản Web (React), BẮT BUỘC phải tạo tính năng tương ứng ở bản Flutter.

```
✅ ĐÚNG:
- Tạo User Management ở Web → Tạo User Management ở Flutter
- Tạo Dashboard Stats ở Web → Tạo Dashboard Stats ở Flutter
- Tạo Settings Feature ở Web → Tạo Settings Feature ở Flutter

❌ SAI:
- Tạo tính năng chỉ ở Web mà không có ở Flutter
- Tạo tính năng chỉ ở Flutter mà không có ở Web
```

### 2. **Flutter Widgets Library**

**QUY TẮC**: Bản Flutter app BẮT BUỘC sử dụng widgets từ thư viện `vhv_widgets` thay vì tự implement.

**VHV Widgets Repository**: https://github.com/vhvplatform/flutter-vhv_widgets.git

#### Available Components

```dart
// Buttons
VHVButton(
  text: 'Click Me',
  onPressed: () {},
  variant: VHVButtonVariant.primary, // primary, outlined, text
  loading: false,
)

// Cards
VHVCard(
  child: Widget,
  padding: EdgeInsets,
)

// Text Fields
VHVTextField(
  controller: controller,
  labelText: 'Label',
  obscureText: false,
  validator: (value) => null,
)

// And more... (check vhv_widgets documentation)
```

#### Usage Rules

```dart
✅ ĐÚNG:
import 'package:vhv_widgets/vhv_widgets.dart';

VHVButton(
  text: context.tr('common.submit'),
  onPressed: _handleSubmit,
  variant: VHVButtonVariant.primary,
)

❌ SAI:
// Tự tạo custom button
ElevatedButton(
  onPressed: _handleSubmit,
  child: Text('Submit'),
)
```

### 3. **Design System Consistency**

**Theme Values** - Sử dụng từ `AppTheme`:

```dart
// Colors
AppTheme.primaryColor        // #6366F1 (Indigo)
AppTheme.backgroundLight     // #FAFAFA
AppTheme.backgroundDark      // #0A0A0A
AppTheme.success            // #10B981
AppTheme.error              // #EF4444
AppTheme.warning            // #F59E0B
AppTheme.info               // #3B82F6

// Spacing
AppTheme.spacingXSmall      // 4px
AppTheme.spacingSmall       // 8px
AppTheme.spacingMedium      // 16px
AppTheme.spacingLarge       // 24px
AppTheme.spacingXLarge      // 32px

// Border Radius
AppTheme.radiusSmall        // 6px
AppTheme.radiusMedium       // 8px
AppTheme.radiusLarge        // 12px
AppTheme.radiusXLarge       // 16px
```

```dart
✅ ĐÚNG:
Container(
  padding: const EdgeInsets.all(AppTheme.spacingMedium),
  decoration: BoxDecoration(
    color: AppTheme.primaryColor,
    borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
  ),
)

❌ SAI:
Container(
  padding: const EdgeInsets.all(16), // Hardcoded value
  decoration: BoxDecoration(
    color: Color(0xFF6366F1), // Hardcoded color
    borderRadius: BorderRadius.circular(8), // Hardcoded radius
  ),
)
```

### 4. **Internationalization (i18n)**

**QUY TẮC**: KHÔNG BAO GIỜ sử dụng hardcoded text. Luôn luôn dùng translations.

```dart
✅ ĐÚNG:
Text(context.tr('auth.login'))
Text(context.tr('dashboard.welcome'))
Text(context.tr('common.save'))

❌ SAI:
Text('Login')
Text('Welcome to Dashboard')
Text('Save')
```

#### Translation Keys Structure

```dart
// Organized by feature/module
context.tr('auth.login')           // Authentication
context.tr('auth.email')
context.tr('auth.password')

context.tr('dashboard.title')      // Dashboard
context.tr('dashboard.welcome')

context.tr('settings.title')       // Settings
context.tr('settings.appearance')

context.tr('common.save')          // Common/Shared
context.tr('common.cancel')
context.tr('common.submit')
```

### 5. **Backend API Synchronization**

**QUY TẮC**: Mỗi tính năng mới phải được implement đồng bộ ở cả 3 layers:

```
1. Golang Backend API (trong /golang-backend/)
2. React Frontend (trong /src/)
3. Flutter Mobile App (trong /flutter/)
```

#### Example Flow

```
Feature: User Management CRUD

1. Golang Backend:
   ✅ /golang-backend/internal/api/handlers/user_handler.go
   ✅ /golang-backend/internal/domain/user/service.go
   ✅ /golang-backend/internal/domain/user/repository.go
   ✅ Unit tests

2. React Frontend:
   ✅ /src/features/users/UserList.tsx
   ✅ /src/features/users/UserForm.tsx
   ✅ /src/api/userService.ts

3. Flutter Mobile:
   ✅ /flutter/lib/features/users/data/
   ✅ /flutter/lib/features/users/domain/
   ✅ /flutter/lib/features/users/presentation/
```

### 6. **Clean Architecture in Flutter**

**QUY TẮC**: Tuân thủ Clean Architecture pattern:

```
features/
  feature_name/
    data/                   # Data Layer
      datasources/         # API + Local storage
      models/             # DTOs
      repositories/       # Repository implementations
    
    domain/                 # Domain Layer
      entities/            # Business objects
      repositories/       # Repository interfaces
      usecases/           # Business logic
    
    presentation/          # Presentation Layer
      bloc/               # State management
      pages/              # Screens
      widgets/            # Feature-specific widgets
```

```dart
✅ ĐÚNG Flow:
Widget → BLoC → UseCase → Repository Interface → Repository Impl → DataSource → API

❌ SAI:
Widget → Direct API call (bypassing architecture)
```

### 7. **State Management with BLoC**

**QUY TẮC**: Sử dụng BLoC pattern cho tất cả business logic.

```dart
✅ ĐÚNG:

// Event
@freezed
class UserEvent with _$UserEvent {
  const factory UserEvent.loadUsers() = LoadUsers;
  const factory UserEvent.createUser({required User user}) = CreateUser;
}

// State
@freezed
class UserState with _$UserState {
  const factory UserState.initial() = UserInitial;
  const factory UserState.loading() = UserLoading;
  const factory UserState.loaded({required List<User> users}) = UserLoaded;
  const factory UserState.error({required String message}) = UserError;
}

// BLoC
class UserBloc extends Bloc<UserEvent, UserState> {
  final GetUsersUseCase _getUsersUseCase;
  
  UserBloc({required GetUsersUseCase getUsersUseCase})
      : _getUsersUseCase = getUsersUseCase,
        super(const UserState.initial()) {
    on<LoadUsers>(_onLoadUsers);
  }
  
  Future<void> _onLoadUsers(LoadUsers event, Emitter<UserState> emit) async {
    emit(const UserState.loading());
    final result = await _getUsersUseCase.call();
    result.fold(
      (failure) => emit(UserState.error(message: failure.message)),
      (users) => emit(UserState.loaded(users: users)),
    );
  }
}

❌ SAI:
// Calling API directly in widget
class UserListPage extends StatefulWidget {
  void loadUsers() async {
    final response = await http.get(...); // Direct API call
  }
}
```

### 8. **Dependency Injection**

**QUY TẮC**: Sử dụng GetIt + Injectable cho DI.

```dart
✅ ĐÚNG:

// In injection.dart
@module
abstract class AppModule {
  @lazySingleton
  Dio get dio => Dio(BaseOptions(baseUrl: apiBaseUrl));
  
  @lazySingleton
  DioClient dioClient(Dio dio) => DioClient(dio);
}

// In feature
@lazySingleton
UserRemoteDataSource get userRemoteDataSource => UserRemoteDataSourceImpl(
  dioClient: getIt<DioClient>(),
);

@lazySingleton
UserRepository get userRepository => UserRepositoryImpl(
  remoteDataSource: getIt<UserRemoteDataSource>(),
);

// Usage in widget
BlocProvider(
  create: (context) => getIt<UserBloc>(),
  child: UserListPage(),
)

❌ SAI:
// Creating dependencies manually
final userBloc = UserBloc(
  getUsersUseCase: GetUsersUseCase(
    repository: UserRepositoryImpl(
      remoteDataSource: UserRemoteDataSourceImpl(...),
    ),
  ),
);
```

### 9. **Code Generation**

**QUY TẮC**: Sử dụng code generation cho boilerplate code.

```bash
# After making changes to @freezed or @JsonSerializable classes
flutter pub run build_runner build --delete-conflicting-outputs

# Or watch mode during development
flutter pub run build_runner watch --delete-conflicting-outputs
```

```dart
✅ ĐÚNG:

// Use @freezed for data classes
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

// Use @JsonSerializable for models
@JsonSerializable()
class UserModel {
  final String id;
  final String name;
  final String email;
  
  UserModel({required this.id, required this.name, required this.email});
  
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}

❌ SAI:
// Manual serialization
class User {
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}
```

### 10. **Testing**

**QUY TẮC**: Viết tests cho business logic.

```dart
✅ ĐÚNG:

// Unit test for UseCase
test('should return User when repository returns success', () async {
  // Arrange
  when(() => mockRepository.getUser(any()))
      .thenAnswer((_) async => Right(testUser));
  
  // Act
  final result = await useCase.call(GetUserParams(id: '123'));
  
  // Assert
  expect(result, Right(testUser));
  verify(() => mockRepository.getUser('123')).called(1);
});

// BLoC test
blocTest<UserBloc, UserState>(
  'emits [loading, loaded] when loadUsers succeeds',
  build: () => UserBloc(getUsersUseCase: mockGetUsersUseCase),
  act: (bloc) => bloc.add(const UserEvent.loadUsers()),
  expect: () => [
    const UserState.loading(),
    UserState.loaded(users: testUsers),
  ],
);
```

### 11. **Naming Conventions**

```dart
// Files: snake_case
user_bloc.dart
login_page.dart
user_repository.dart

// Classes: PascalCase
class UserBloc extends Bloc<UserEvent, UserState> {}
class LoginPage extends StatelessWidget {}
class UserRepository {}

// Variables & Functions: camelCase
final userName = 'John';
void loadUsers() {}
Future<void> handleSubmit() async {}

// Constants: camelCase with const
const apiBaseUrl = 'https://api.example.com';
const primaryColor = Color(0xFF6366F1);

// Private members: _camelCase
final _userRepository = UserRepository();
void _handleSubmit() {}
```

## 📋 Checklist for New Features

Khi tạo feature mới, đảm bảo hoàn thành tất cả các bước:

### ✅ Backend (Golang)

- [ ] Create handler in `/golang-backend/internal/api/handlers/`
- [ ] Create service in `/golang-backend/internal/domain/`
- [ ] Create repository in `/golang-backend/internal/domain/`
- [ ] Add routes in router
- [ ] Write unit tests (target: ~90% coverage)
- [ ] Update API documentation

### ✅ Frontend (React)

- [ ] Create feature components in `/src/features/`
- [ ] Create API service in `/src/api/`
- [ ] Use translations (no hardcoded text)
- [ ] Follow design system (colors, spacing, etc.)
- [ ] Implement responsive design
- [ ] Test on multiple screen sizes

### ✅ Mobile (Flutter)

- [ ] Create feature folder structure:
  - [ ] `data/datasources/`
  - [ ] `data/models/`
  - [ ] `data/repositories/`
  - [ ] `domain/entities/`
  - [ ] `domain/repositories/`
  - [ ] `domain/usecases/`
  - [ ] `presentation/bloc/`
  - [ ] `presentation/pages/`
  - [ ] `presentation/widgets/`
- [ ] Use VHV Widgets (not custom widgets)
- [ ] Use translations with `context.tr()`
- [ ] Use AppTheme constants
- [ ] Implement BLoC pattern
- [ ] Register dependencies in DI
- [ ] Run code generation
- [ ] Write tests (UseCase + BLoC)
- [ ] Update router configuration

### ✅ i18n

- [ ] Add translations to all 6 language files:
  - [ ] `vi.dart` (Vietnamese)
  - [ ] `en.dart` (English)
  - [ ] `es.dart` (Spanish)
  - [ ] `zh.dart` (Chinese)
  - [ ] `ja.dart` (Japanese)
  - [ ] `ko.dart` (Korean)

## 🚨 Common Mistakes to Avoid

### ❌ DON'T

1. **Không tạo tính năng chỉ ở 1 platform**
   ```
   BAD: Tạo User Management chỉ ở Web
   GOOD: Tạo User Management ở cả Web + Flutter + Backend
   ```

2. **Không dùng vhv_widgets**
   ```dart
   BAD: ElevatedButton(...)
   GOOD: VHVButton(variant: VHVButtonVariant.primary, ...)
   ```

3. **Hardcoded text**
   ```dart
   BAD: Text('Login')
   GOOD: Text(context.tr('auth.login'))
   ```

4. **Hardcoded colors/spacing**
   ```dart
   BAD: Color(0xFF6366F1)
   GOOD: AppTheme.primaryColor
   ```

5. **Skip architecture layers**
   ```dart
   BAD: Widget → API directly
   GOOD: Widget → BLoC → UseCase → Repository → DataSource → API
   ```

6. **Không viết tests**
   ```
   BAD: Code without tests
   GOOD: Code with unit tests + BLoC tests
   ```

## 📊 Quality Standards

### Code Coverage
- Backend (Golang): **~90% coverage**
- Flutter: **>70% coverage for business logic**

### Performance
- Flutter app startup: **<3 seconds**
- API response: **<500ms for simple queries**
- UI responsiveness: **60 FPS**

### Code Quality
- Run `flutter analyze` - **0 errors, 0 warnings**
- Run `dart format` - **All files formatted**
- Run linter - **Pass all rules**

## 🔄 Development Workflow

```bash
# 1. Create new feature branch
git checkout -b feature/user-management

# 2. Implement in Golang Backend
cd golang-backend
make test

# 3. Implement in React Frontend
cd ../
npm run dev

# 4. Implement in Flutter
cd flutter
make build-runner
make test
make analyze

# 5. Commit and push
git add .
git commit -m "feat: add user management feature"
git push origin feature/user-management
```

## 📚 References

- **Flutter Clean Architecture**: [ARCHITECTURE.md](/flutter/ARCHITECTURE.md)
- **Flutter Setup Guide**: [FLUTTER_SETUP.md](/flutter/FLUTTER_SETUP.md)
- **VHV Widgets**: https://github.com/vhvplatform/flutter-vhv_widgets.git
- **React Framework**: https://github.com/vhvplatform/react-framework

---

## 🎯 Summary

**3 QUY TẮC VÀNG**:

1. ⚡ **Đồng bộ**: Web feature = Flutter feature = Backend feature
2. 🎨 **VHV Widgets**: Luôn dùng vhv_widgets, không tự implement
3. 🌍 **i18n**: Không bao giờ hardcode text, luôn dùng translations

**Tuân thủ nghiêm ngặt để đảm bảo chất lượng và consistency!** ✨

---

Last Updated: 2026-01-03
