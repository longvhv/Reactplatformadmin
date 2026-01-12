# BasicSoftTemplate - Flutter App

VHV Platform Flutter Application - Modern, Professional, Elegant enterprise mobile application.

## 🎨 Design Philosophy

Inspired by **Stripe**, **GitHub**, **Vercel**, and **Linear** - featuring a Modern, Professional, Elegant, Clean, and Sophisticated design system.

### Design Tokens
- **Primary Color**: Indigo (#6366F1)
- **Background**: #FAFAFA (Light), #0A0A0A (Dark)
- **Font**: Inter
- **Spacing**: 4px base unit
- **Border Radius**: 6-16px

## 🏗️ Architecture

This app follows **Clean Architecture** principles with **BLoC** (Business Logic Component) pattern for state management.

```
lib/
├── core/                       # Core functionality
│   ├── di/                    # Dependency Injection
│   ├── error/                 # Error handling
│   ├── l10n/                  # Localization (6 languages)
│   ├── network/               # Network layer
│   ├── router/                # Navigation
│   ├── theme/                 # App theme
│   └── usecases/              # Base use cases
├── features/                   # Feature modules
│   ├── auth/                  # Authentication
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── dashboard/             # Dashboard
│   ├── profile/               # User profile
│   └── settings/              # App settings
└── shared/                     # Shared components
    └── presentation/
```

## 🚀 Getting Started

### Prerequisites

- Flutter SDK >= 3.2.0
- Dart SDK >= 3.2.0
- Android Studio / VS Code with Flutter plugins
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   cd flutter
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Run the app**
   ```bash
   flutter run
   ```

## 📦 Key Dependencies

### State Management
- **flutter_bloc**: ^8.1.3 - BLoC pattern implementation
- **bloc**: ^8.1.2 - Core BLoC library
- **equatable**: ^2.0.5 - Value equality

### UI Components
- **vhv_widgets**: Custom widget library from VHV Platform
- **flutter_svg**: SVG rendering
- **cached_network_image**: Image caching
- **shimmer**: Loading effects
- **lottie**: Animations

### Network
- **dio**: ^5.4.0 - HTTP client
- **retrofit**: ^4.0.3 - Type-safe HTTP client
- **pretty_dio_logger**: ^1.3.1 - Network logging

### Storage
- **shared_preferences**: ^2.2.2 - Simple key-value storage
- **flutter_secure_storage**: ^9.0.0 - Secure storage
- **hive**: ^2.2.3 - NoSQL database

### Navigation
- **go_router**: ^13.0.0 - Declarative routing

### Dependency Injection
- **get_it**: ^7.6.4 - Service locator
- **injectable**: ^2.3.2 - Code generation for DI

### Code Generation
- **freezed**: ^2.4.5 - Data classes and unions
- **json_serializable**: ^6.7.1 - JSON serialization

## 🌍 Localization

The app supports 6 languages:
- 🇻🇳 Vietnamese (vi)
- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇨🇳 Chinese (zh)
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)

### Adding Translations

1. Edit translation files in `lib/core/l10n/translations/`
2. Use `context.tr('key.subkey')` in widgets

Example:
```dart
Text(context.tr('common.welcome'))
```

## 🎨 Theme System

The app uses a custom theme system with light and dark modes.

### Using Theme
```dart
// Colors
AppTheme.primaryColor
AppTheme.backgroundLight
AppTheme.textPrimaryLight

// Spacing
AppTheme.spacingSmall   // 8px
AppTheme.spacingMedium  // 16px
AppTheme.spacingLarge   // 24px

// Border Radius
AppTheme.radiusSmall    // 6px
AppTheme.radiusMedium   // 8px
AppTheme.radiusLarge    // 12px
```

## 🔐 Authentication

The app connects to the Golang backend API for authentication.

**Base URL**: `http://localhost:8080/api/v1`

### API Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset

### Authentication Flow

1. User enters credentials
2. `AuthBloc` handles login event
3. `LoginUseCase` calls repository
4. Token stored in secure storage
5. Navigate to dashboard

## 🧪 Testing

### Unit Tests
```bash
flutter test
```

### Widget Tests
```bash
flutter test test/widget_test.dart
```

### Integration Tests
```bash
flutter test integration_test
```

## 📱 Build & Deploy

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## 🔧 Code Generation

This project uses code generation for:
- **Freezed**: Immutable data classes
- **JSON Serializable**: JSON serialization
- **Injectable**: Dependency injection

Run code generation:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Watch for changes:
```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

## 📂 VHV Widgets Library

This app uses the **vhv_widgets** library from:
https://github.com/vhvplatform/flutter-vhv_widgets.git

### Available Components
- `VHVButton` - Custom button with variants
- `VHVCard` - Material card component
- `VHVTextField` - Enhanced text field
- And more...

### Usage Example
```dart
VHVButton(
  text: 'Click Me',
  onPressed: () {},
  variant: VHVButtonVariant.primary,
  loading: false,
)
```

## 🐛 Debugging

### Enable logging
```dart
// In main.dart
Logger().level = Level.debug;
```

### Network debugging
All network requests are logged via `pretty_dio_logger`.

## 📝 Code Style

This project follows the official [Dart Style Guide](https://dart.dev/guides/language/effective-dart/style).

### Run linter
```bash
flutter analyze
```

### Format code
```bash
flutter format lib/
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linter
4. Create a pull request

## 📄 License

Copyright © 2024 VHV Platform

## 🔗 Related Projects

- **React Web App**: `/` (root directory)
- **Golang Backend**: `/golang-backend/`
- **React Framework**: https://github.com/vhvplatform/react-framework
- **Flutter Widgets**: https://github.com/vhvplatform/flutter-vhv_widgets.git

## 📞 Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ using Flutter and VHV Platform
