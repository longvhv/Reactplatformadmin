# Flutter App Setup Guide

## 📋 Prerequisites

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- Flutter SDK >= 3.2.0
- Dart SDK >= 3.2.0
- Android Studio / VS Code với Flutter plugins
- Xcode (cho iOS development - chỉ macOS)
- Git

## 🚀 Installation Steps

### 1. Kiểm tra Flutter Installation

```bash
flutter doctor -v
```

Đảm bảo tất cả các mục đều có dấu ✓ (trừ Xcode nếu không phát triển iOS).

### 2. Clone và Setup Project

```bash
# Di chuyển vào thư mục flutter
cd flutter

# Cài đặt dependencies
flutter pub get

# Generate code (freezed, json_serializable, injectable)
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Cấu hình Backend API

Mở file `lib/core/di/injection.dart` và cập nhật base URL:

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'http://localhost:8080/api/v1', // Thay đổi URL nếu cần
  connectTimeout: const Duration(seconds: 30),
  receiveTimeout: const Duration(seconds: 30),
));
```

**Development URLs:**
- Local: `http://localhost:8080/api/v1`
- Android Emulator: `http://10.0.2.2:8080/api/v1`
- iOS Simulator: `http://localhost:8080/api/v1`
- Physical Device: `http://YOUR_IP:8080/api/v1`

### 4. Thêm Inter Font

Download Inter font từ [Google Fonts](https://fonts.google.com/specimen/Inter) và đặt vào:

```
flutter/
  assets/
    fonts/
      Inter-Thin.ttf
      Inter-ExtraLight.ttf
      Inter-Light.ttf
      Inter-Regular.ttf
      Inter-Medium.ttf
      Inter-SemiBold.ttf
      Inter-Bold.ttf
      Inter-ExtraBold.ttf
      Inter-Black.ttf
```

### 5. Tạo Asset Folders

```bash
mkdir -p assets/images assets/icons assets/animations assets/translations
```

## 🏃 Running the App

### Development Mode

```bash
# Using Make
make run-dev

# Or directly with Flutter
flutter run --debug
```

### Production Mode

```bash
make run-prod
# Or
flutter run --release
```

### Specific Device

```bash
# List devices
flutter devices

# Run on specific device
flutter run -d <device-id>
```

## 🔧 Code Generation

Project này sử dụng code generation cho:
- **Freezed**: Immutable data classes
- **JSON Serializable**: JSON serialization
- **Injectable**: Dependency injection

### Generate Once

```bash
make build-runner
# Or
flutter pub run build_runner build --delete-conflicting-outputs
```

### Watch Mode (Auto-generate on changes)

```bash
make watch
# Or
flutter pub run build_runner watch --delete-conflicting-outputs
```

## 🧪 Testing

### Run All Tests

```bash
make test
# Or
flutter test
```

### Run Tests with Coverage

```bash
make test-coverage
# Or
flutter test --coverage
```

### View Coverage

```bash
# Install lcov (macOS)
brew install lcov

# Generate HTML report
genhtml coverage/lcov.info -o coverage/html

# Open in browser
open coverage/html/index.html
```

## 📱 Building

### Android

```bash
# Debug APK
flutter build apk --debug

# Release APK
make build-apk
# Or
flutter build apk --release

# App Bundle (cho Google Play)
make build-appbundle
# Or
flutter build appbundle --release
```

APK location: `build/app/outputs/flutter-apk/app-release.apk`

### iOS

```bash
# Release build
make build-ios
# Or
flutter build ios --release
```

**Note:** Cần macOS và Xcode để build iOS.

## 🐛 Troubleshooting

### Issue: "Module not found" errors

```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Issue: Generated files not found (*.freezed.dart, *.g.dart)

```bash
# Re-generate all files
make build-runner
```

### Issue: Hot reload không work

```bash
# Restart app
r (in terminal)

# Hot restart
R (in terminal)
```

### Issue: Platform channel errors

```bash
# Rebuild app completely
flutter clean
flutter pub get
flutter run
```

### Issue: Network connection errors on Android Emulator

Sử dụng `10.0.2.2` thay vì `localhost`:

```dart
baseUrl: 'http://10.0.2.2:8080/api/v1'
```

## 📊 Performance Profiling

### Run in Profile Mode

```bash
flutter run --profile
```

### Open DevTools

```bash
flutter pub global activate devtools
flutter pub global run devtools
```

## 🔍 Code Analysis

### Analyze Code

```bash
make analyze
# Or
flutter analyze
```

### Format Code

```bash
make format
# Or
dart format lib/ test/
```

## 📦 Dependencies Management

### Update Dependencies

```bash
make upgrade
# Or
flutter pub upgrade
```

### Check Outdated

```bash
make outdated
# Or
flutter pub outdated
```

## 🌍 Localization

App hỗ trợ 6 ngôn ngữ:
- Vietnamese (vi) - Default
- English (en)
- Spanish (es)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)

### Thêm Translation

1. Mở `lib/core/l10n/translations/vi.dart` (hoặc ngôn ngữ khác)
2. Thêm key mới:

```dart
const Map<String, dynamic> viTranslations = {
  'common': {
    'newKey': 'Giá trị mới',
  },
};
```

3. Sử dụng trong widget:

```dart
Text(context.tr('common.newKey'))
```

## 🎨 Theme Customization

### Thay đổi Primary Color

Mở `lib/core/theme/app_theme.dart`:

```dart
static const Color primaryColor = Color(0xFF6366F1); // Indigo
```

### Thêm Custom Color

```dart
static const Color customColor = Color(0xFFXXXXXX);
```

## 📝 Common Commands

```bash
# Setup project lần đầu
make setup

# Clean project
make clean

# Run tests
make test

# Analyze code
make analyze

# Format code
make format

# Build APK
make build-apk

# See all commands
make help
```

## 🔗 Useful Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Documentation](https://dart.dev/guides)
- [BLoC Pattern](https://bloclibrary.dev/)
- [Go Router](https://pub.dev/packages/go_router)
- [VHV Widgets](https://github.com/vhvplatform/flutter-vhv_widgets)

## 💡 Tips

1. **Hot Reload**: Press `r` trong terminal khi app đang chạy
2. **Hot Restart**: Press `R` để restart app
3. **DevTools**: Sử dụng Flutter DevTools để debug performance
4. **Widget Inspector**: Sử dụng để inspect widget tree
5. **Network Profiling**: Sử dụng để monitor network calls

## 🤝 Contributing

1. Tạo feature branch
2. Make changes
3. Run tests: `make test`
4. Run analyzer: `make analyze`
5. Format code: `make format`
6. Commit và push

---

Happy Coding! 🚀
