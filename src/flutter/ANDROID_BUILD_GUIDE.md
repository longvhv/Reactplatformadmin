# Android Build Configuration Guide

## 📱 Overview

Tài liệu này mô tả chi tiết cấu hình Android build cho Flutter app BasicSoftTemplate.

---

## 🏗️ Build Structure

### Build Variants

App được cấu hình với **3 build types** và **3 product flavors**:

#### Build Types

1. **Debug** - Development
   - Application ID suffix: `.debug`
   - Debuggable: Yes
   - Minify: No
   - Signing: Debug keystore

2. **Staging** - Testing
   - Application ID suffix: `.staging`
   - Debuggable: No
   - Minify: Yes (ProGuard/R8)
   - Shrink Resources: Yes
   - Signing: Debug keystore

3. **Release** - Production
   - Application ID: Base
   - Debuggable: No
   - Minify: Yes (ProGuard/R8)
   - Shrink Resources: Yes
   - Signing: Release keystore

#### Product Flavors (Environment)

1. **Dev** - Development
   - App Name: "BasicSoft Dev"
   - Application ID: `com.vhvplatform.basicsofttemplate.dev`
   - API URL: `http://10.0.2.2:8080/api/v1` (Android Emulator)

2. **Staging** - Pre-production
   - App Name: "BasicSoft Staging"
   - Application ID: `com.vhvplatform.basicsofttemplate.staging`
   - API URL: `https://staging-api.yourdomain.com/api/v1`

3. **Prod** - Production
   - App Name: "BasicSoftTemplate"
   - Application ID: `com.vhvplatform.basicsofttemplate`
   - API URL: `https://api.yourdomain.com/api/v1`

### Build Variant Matrix

Tổng cộng có **9 build variants**:

| Flavor | Build Type | Output | Use Case |
|--------|-----------|--------|----------|
| Dev | Debug | devDebug | Local development |
| Dev | Staging | devStaging | Dev server testing |
| Dev | Release | devRelease | Dev server production build |
| Staging | Debug | stagingDebug | Staging debug |
| Staging | Staging | stagingStaging | Staging testing |
| Staging | Release | stagingRelease | Staging production build |
| Prod | Debug | prodDebug | Production debug |
| Prod | Staging | prodStaging | Production testing |
| Prod | Release | prodRelease | **Production release** |

---

## 🔐 Signing Configuration

### Debug Signing

Debug builds sử dụng Android debug keystore mặc định:
- Store: `android/app/debug.keystore`
- Password: `android`
- Alias: `androiddebugkey`

### Release Signing

#### 1. Generate Release Keystore

```bash
# Navigate to project directory
cd android/app

# Create keystore directory
mkdir -p ../../keystore

# Generate keystore
keytool -genkey -v \
  -keystore ../../keystore/upload-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload \
  -storetype JKS
```

**Prompts:**
```
Enter keystore password: [Create strong password]
Re-enter new password: [Repeat password]
What is your first and last name?: VHV Platform
What is the name of your organizational unit?: Development
What is the name of your organization?: VHV Platform
What is the name of your City or Locality?: Ho Chi Minh
What is the name of your State or Province?: Ho Chi Minh
What is the two-letter country code for this unit?: VN
Is CN=VHV Platform, OU=Development, O=VHV Platform, L=Ho Chi Minh, ST=Ho Chi Minh, C=VN correct?: yes

Enter key password for <upload>: [Same as keystore password or different]
```

#### 2. Configure Signing

Copy example config:
```bash
cd android
cp key.properties.example key.properties
```

Edit `key.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=../keystore/upload-keystore.jks
```

**⚠️ IMPORTANT**: Never commit `key.properties` or keystore files to Git!

#### 3. Verify Signing Config

The `android/app/build.gradle` will automatically use this configuration:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

---

## 🚀 Building APK/AAB

### Build Commands

#### Debug Build
```bash
# Dev debug
flutter build apk --debug --flavor dev

# Staging debug
flutter build apk --debug --flavor staging

# Prod debug
flutter build apk --debug --flavor prod
```

#### Release Build
```bash
# Dev release
flutter build apk --release --flavor dev

# Staging release
flutter build apk --release --flavor staging

# Production release (for Google Play)
flutter build appbundle --release --flavor prod
```

### Build with Makefile

Update `Makefile` with new commands:

```bash
# Development builds
make build-dev-debug          # Dev debug APK
make build-dev-release        # Dev release APK

# Staging builds
make build-staging-debug      # Staging debug APK
make build-staging-release    # Staging release APK

# Production builds
make build-prod-debug         # Prod debug APK
make build-prod-release       # Prod release APK
make build-prod-bundle        # Prod release AAB (for Play Store)
```

### Build Output Locations

```
build/app/outputs/
├── flutter-apk/
│   ├── app-dev-debug.apk
│   ├── app-dev-release.apk
│   ├── app-staging-debug.apk
│   ├── app-staging-release.apk
│   ├── app-prod-debug.apk
│   └── app-prod-release.apk
└── bundle/
    ├── devRelease/
    ├── stagingRelease/
    └── prodRelease/
        └── app-prod-release.aab
```

---

## 📦 ProGuard/R8 Configuration

### Rules Overview

ProGuard rules trong `android/app/proguard-rules.pro`:

1. **Flutter Framework** - Preserve Flutter classes
2. **Gson** - JSON serialization
3. **OkHttp/Retrofit** - Network layer
4. **Kotlin Coroutines** - Async operations
5. **Data Classes** - Keep domain/data models
6. **AndroidX** - Android Jetpack
7. **Remove Logs** - Strip debug logs in release
8. **Keep Line Numbers** - For crash reports

### Testing ProGuard

```bash
# Build with ProGuard
flutter build apk --release --flavor prod

# Test app thoroughly
# Check for crashes, missing data, etc.
```

### Common ProGuard Issues

**Problem**: App crashes with `ClassNotFoundException`
```proguard
# Solution: Add keep rule
-keep class com.your.package.ClassName { *; }
```

**Problem**: Reflection doesn't work
```proguard
# Solution: Keep classes used via reflection
-keep class * implements com.your.Interface { *; }
```

---

## 🔧 Gradle Optimization

### Enabled Optimizations

In `android/gradle.properties`:

```properties
# Parallel builds
org.gradle.parallel=true

# Build cache
org.gradle.caching=true
android.enableBuildCache=true

# R8 full mode
android.enableR8.fullMode=true

# Configure only necessary projects
org.gradle.configureondemand=true

# Increased memory
org.gradle.jvmargs=-Xmx2048m
```

### Build Performance Tips

1. **Use Gradle Daemon**
   ```bash
   # Daemon is enabled by default
   gradle --status
   ```

2. **Clean Build When Needed**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   flutter clean
   ```

3. **Use Build Cache**
   ```bash
   # Already enabled in gradle.properties
   # Speeds up subsequent builds
   ```

4. **Parallel Builds**
   ```bash
   # Already enabled
   # Uses multiple CPU cores
   ```

---

## 📱 App Configuration

### Update Package Name

1. **Change in `build.gradle`:**
   ```gradle
   defaultConfig {
       applicationId "com.yourcompany.yourapp"
   }
   ```

2. **Update namespace:**
   ```gradle
   android {
       namespace "com.yourcompany.yourapp"
   }
   ```

3. **Rename Kotlin package:**
   ```bash
   mv android/app/src/main/kotlin/com/vhvplatform/basicsofttemplate \
      android/app/src/main/kotlin/com/yourcompany/yourapp
   ```

4. **Update MainActivity.kt:**
   ```kotlin
   package com.yourcompany.yourapp
   ```

### Update App Name

Edit `android/app/build.gradle`:

```gradle
productFlavors {
    dev {
        resValue "string", "app_name", "Your App Dev"
    }
    staging {
        resValue "string", "app_name", "Your App Staging"
    }
    prod {
        resValue "string", "app_name", "Your App"
    }
}
```

### Update API URLs

Edit `android/app/build.gradle`:

```gradle
productFlavors {
    dev {
        buildConfigField "String", "API_BASE_URL", '"http://10.0.2.2:8080/api/v1"'
    }
    staging {
        buildConfigField "String", "API_BASE_URL", '"https://staging-api.yourdomain.com/api/v1"'
    }
    prod {
        buildConfigField "String", "API_BASE_URL", '"https://api.yourdomain.com/api/v1"'
    }
}
```

### Update App Icon

1. **Generate icons:**
   ```bash
   # Use a tool like https://appicon.co/
   # Or flutter_launcher_icons package
   ```

2. **Add to project:**
   ```
   android/app/src/main/res/
   ├── mipmap-mdpi/ic_launcher.png
   ├── mipmap-hdpi/ic_launcher.png
   ├── mipmap-xhdpi/ic_launcher.png
   ├── mipmap-xxhdpi/ic_launcher.png
   └── mipmap-xxxhdpi/ic_launcher.png
   ```

3. **Using flutter_launcher_icons:**
   
   Add to `pubspec.yaml`:
   ```yaml
   dev_dependencies:
     flutter_launcher_icons: ^0.13.1
   
   flutter_launcher_icons:
     android: true
     ios: false
     image_path: "assets/icon/app_icon.png"
   ```
   
   Run:
   ```bash
   flutter pub get
   flutter pub run flutter_launcher_icons
   ```

---

## 🌐 Network Security

### Development Configuration

`android/app/src/main/res/xml/network_security_config.xml` allows HTTP for development:

```xml
<base-config cleartextTrafficPermitted="true">
```

**⚠️ For Production**: Change to:

```xml
<base-config cleartextTrafficPermitted="false">
```

### Localhost Access

Allows connections to:
- `localhost`
- `10.0.2.2` (Android Emulator)
- `127.0.0.1`

---

## 📋 Permissions

### Current Permissions

In `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Adding More Permissions

Uncomment in `AndroidManifest.xml` as needed:

```xml
<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Storage (Android 12 and below) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Storage (Android 13+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Notifications (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## 🎯 Deep Linking

### Configure Deep Links

Edit `AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="yourdomain.com"
        android:pathPrefix="/app" />
</intent-filter>
```

### Test Deep Links

```bash
# Test with adb
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://yourdomain.com/app/page" \
  com.vhvplatform.basicsofttemplate
```

---

## 🧪 Testing Builds

### Install APK

```bash
# Install specific variant
flutter install --flavor dev

# Or install APK directly
adb install build/app/outputs/flutter-apk/app-dev-release.apk
```

### Test Different Variants

```bash
# Uninstall previous version
adb uninstall com.vhvplatform.basicsofttemplate.dev

# Install new variant
flutter install --flavor dev
```

### Check Build Info

```bash
# Check app info
adb shell dumpsys package com.vhvplatform.basicsofttemplate | grep version

# Check installed packages
adb shell pm list packages | grep vhvplatform
```

---

## 📤 Publishing to Google Play

### Prepare Release Build

1. **Update version:**
   ```bash
   # Edit pubspec.yaml
   version: 1.0.1+2
   # Format: version_name+version_code
   ```

2. **Build App Bundle:**
   ```bash
   flutter build appbundle --release --flavor prod
   ```

3. **Locate AAB:**
   ```
   build/app/outputs/bundle/prodRelease/app-prod-release.aab
   ```

### Google Play Console Setup

1. **Create app** in Google Play Console
2. **Upload AAB** to Internal Testing track
3. **Fill store listing** (title, description, screenshots)
4. **Set content rating**
5. **Add privacy policy**
6. **Submit for review**

### Release Tracks

1. **Internal Testing** - For team
2. **Closed Testing** - For selected users
3. **Open Testing** - Public beta
4. **Production** - Public release

---

## 🔍 Debugging

### View Logs

```bash
# View all logs
adb logcat

# Filter by package
adb logcat | grep com.vhvplatform.basicsofttemplate

# Flutter logs only
flutter logs
```

### Debug Build Issues

```bash
# Verbose build
flutter build apk --release --flavor prod --verbose

# Check Gradle issues
cd android
./gradlew build --stacktrace --info
```

### Common Issues

**Issue**: `Execution failed for task ':app:lintVitalProdRelease'`
```gradle
// Solution: In build.gradle
lintOptions {
    checkReleaseBuilds false
}
```

**Issue**: `OutOfMemoryError`
```properties
// Solution: In gradle.properties
org.gradle.jvmargs=-Xmx4096m
```

**Issue**: Build too slow
```bash
# Clean and rebuild
flutter clean
cd android && ./gradlew clean
flutter build apk --release --flavor prod
```

---

## 📊 Build Checklist

### Pre-Release Checklist

- [ ] Update version in `pubspec.yaml`
- [ ] Test all features thoroughly
- [ ] Check ProGuard rules
- [ ] Verify signing configuration
- [ ] Update API URLs for production
- [ ] Disable cleartext traffic in network security
- [ ] Test release build on real device
- [ ] Check app size (should be < 50MB for AAB)
- [ ] Verify permissions are necessary
- [ ] Update store listing
- [ ] Prepare screenshots and promotional graphics

### Build Commands

```bash
# 1. Clean
flutter clean

# 2. Get dependencies
flutter pub get

# 3. Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# 4. Build release
flutter build appbundle --release --flavor prod

# 5. Test
adb install build/app/outputs/bundle/prodRelease/app-prod-release.aab
```

---

## 💡 Best Practices

1. **Always test release builds** before publishing
2. **Use build flavors** for different environments
3. **Keep keystores secure** and backed up
4. **Enable ProGuard/R8** for release builds
5. **Monitor app size** regularly
6. **Use App Bundle** instead of APK for Play Store
7. **Version incrementally** (1.0.0 → 1.0.1 → 1.1.0)
8. **Test on multiple devices** and Android versions

---

## 📚 Resources

- [Flutter Build Modes](https://docs.flutter.dev/testing/build-modes)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [ProGuard Rules](https://www.guardsquare.com/manual/configuration/usage)
- [Google Play Console](https://play.google.com/console)

---

## 🎉 Summary

✅ **Android build configuration complete:**
- 3 build types (debug, staging, release)
- 3 product flavors (dev, staging, prod)
- Signing configuration
- ProGuard/R8 optimization
- Network security
- Multi-dex support
- Gradle optimization

🚀 **Ready to build production APK/AAB!**

```bash
flutter build appbundle --release --flavor prod
```

---

Last Updated: 2026-01-03
