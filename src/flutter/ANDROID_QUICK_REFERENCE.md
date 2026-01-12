# Android Build - Quick Reference Card

## ⚡ Quick Commands

### Setup (First Time)

```bash
# Environment setup
bash scripts/setup-android.sh

# Generate keystore
bash scripts/generate-keystore.sh
```

### Development

```bash
# Run on device
make run-dev-flavor
flutter run --flavor dev

# Build debug
make build-dev-debug

# Install
make install-dev
```

### Release Builds

```bash
# Production APK
make build-prod-release

# Play Store Bundle
make build-prod-bundle

# Full pipeline
make release-ready
```

---

## 📱 Build Variants

| Variant | Command | Output |
|---------|---------|--------|
| Dev Debug | `make build-dev-debug` | app-dev-debug.apk |
| Dev Release | `make build-dev-release` | app-dev-release.apk |
| Staging Debug | `make build-staging-debug` | app-staging-debug.apk |
| Staging Release | `make build-staging-release` | app-staging-release.apk |
| Prod Debug | `make build-prod-debug` | app-prod-debug.apk |
| Prod Release | `make build-prod-release` | app-prod-release.apk |
| **Prod Bundle** | `make build-prod-bundle` | **app-prod-release.aab** |

---

## 🔧 Common Tasks

### Build & Install

```bash
# Build and install dev
make build-dev-debug
make install-dev

# Or in one step
flutter run --flavor dev
```

### Test Release Build

```bash
# Build
make build-staging-release

# Install manually
adb install build/app/outputs/flutter-apk/app-staging-release.apk
```

### Build All Variants

```bash
bash scripts/build-all-variants.sh
```

### Clean Build

```bash
make clean
make build-prod-release
```

---

## 🔑 Signing

### Generate Keystore

```bash
bash scripts/generate-keystore.sh
```

**Creates:**
- `keystore/upload-keystore.jks`
- `android/key.properties`

### Manual Keystore

```bash
keytool -genkey -v \
  -keystore keystore/upload-keystore.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10000 -alias upload \
  -storetype JKS
```

---

## 📦 Build Outputs

### Locations

```bash
# APKs
build/app/outputs/flutter-apk/

# App Bundles
build/app/outputs/bundle/

# Prod Bundle for Play Store
build/app/outputs/bundle/prodRelease/app-prod-release.aab
```

### Check Build

```bash
# List outputs
ls -lh build/app/outputs/flutter-apk/

# Check APK info
aapt dump badging build/app/outputs/flutter-apk/app-prod-release.apk
```

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clean everything
flutter clean
cd android && ./gradlew clean
cd ..

# Rebuild
make build-prod-release
```

### Gradle Issues

```bash
# Verbose build
flutter build apk --release --flavor prod --verbose

# Check Gradle
cd android
./gradlew build --stacktrace
```

### Signing Issues

```bash
# Verify keystore exists
ls -la keystore/

# Verify key.properties
cat android/key.properties

# Regenerate if needed
bash scripts/generate-keystore.sh
```

---

## 📱 Device Commands

### List Devices

```bash
flutter devices
adb devices
```

### Install APK

```bash
# Auto-install
make install-dev

# Manual install
adb install -r build/app/outputs/flutter-apk/app-dev-debug.apk
```

### Uninstall

```bash
# Dev
adb uninstall com.vhvplatform.basicsofttemplate.dev

# Staging
adb uninstall com.vhvplatform.basicsofttemplate.staging

# Prod
adb uninstall com.vhvplatform.basicsofttemplate
```

### View Logs

```bash
# Flutter logs
flutter logs

# All logs
adb logcat

# Filtered
adb logcat | grep "flutter"
```

---

## 🎯 Workflows

### Development Workflow

```bash
# 1. Clean
make clean

# 2. Run
make run-dev-flavor

# 3. Hot reload (press 'r' in terminal)
```

### Testing Workflow

```bash
# 1. Build staging
make build-staging-release

# 2. Install
adb install build/app/outputs/flutter-apk/app-staging-release.apk

# 3. Test
```

### Release Workflow

```bash
# 1. Update version in pubspec.yaml
version: 1.0.1+2

# 2. Full pipeline
make release-ready

# 3. Upload AAB to Play Store
# build/app/outputs/bundle/prodRelease/app-prod-release.aab
```

---

## 🔍 Build Info

### Check Version

```bash
# From pubspec.yaml
grep version pubspec.yaml

# From APK
aapt dump badging app.apk | grep version
```

### Check Package

```bash
# APK package name
aapt dump badging app.apk | grep package

# Installed packages
adb shell pm list packages | grep vhvplatform
```

### Check Size

```bash
# APK size
ls -lh build/app/outputs/flutter-apk/*.apk

# AAB size
ls -lh build/app/outputs/bundle/*/*.aab
```

---

## ⚙️ Configuration

### Update Package Name

**1. android/app/build.gradle:**
```gradle
defaultConfig {
    applicationId "com.yourcompany.yourapp"
}

namespace "com.yourcompany.yourapp"
```

**2. Rename Kotlin package:**
```bash
mv android/app/src/main/kotlin/com/vhvplatform/basicsofttemplate \
   android/app/src/main/kotlin/com/yourcompany/yourapp
```

**3. Update MainActivity.kt:**
```kotlin
package com.yourcompany.yourapp
```

### Update API URLs

**android/app/build.gradle:**
```gradle
productFlavors {
    dev {
        buildConfigField "String", "API_BASE_URL", 
            '"http://10.0.2.2:8080/api/v1"'
    }
    prod {
        buildConfigField "String", "API_BASE_URL", 
            '"https://api.yourdomain.com/api/v1"'
    }
}
```

### Update App Name

**android/app/build.gradle:**
```gradle
productFlavors {
    dev {
        resValue "string", "app_name", "Your App Dev"
    }
    prod {
        resValue "string", "app_name", "Your App"
    }
}
```

---

## 🚀 Play Store

### Prepare Release

```bash
# 1. Update version
# pubspec.yaml: version: 1.0.1+2

# 2. Build bundle
make build-prod-bundle

# 3. Locate AAB
ls -lh build/app/outputs/bundle/prodRelease/app-prod-release.aab
```

### Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. **Production** → **Create new release**
4. Upload `app-prod-release.aab`
5. Fill release notes
6. Review and rollout

### Release Tracks

- **Internal Testing** - Team testing
- **Closed Testing** - Limited users
- **Open Testing** - Public beta
- **Production** - Public release

---

## 📋 Checklist

### Pre-Release

- [ ] Update version in pubspec.yaml
- [ ] Test all features
- [ ] Build release: `make build-prod-release`
- [ ] Test release build on real device
- [ ] Check APK size
- [ ] Verify ProGuard didn't break anything
- [ ] Update store listing
- [ ] Prepare screenshots

### Release

- [ ] Build bundle: `make build-prod-bundle`
- [ ] Upload to Play Console
- [ ] Fill release notes
- [ ] Submit for review
- [ ] Monitor for crashes

---

## 💡 Tips

### Speed Up Builds

```properties
# android/gradle.properties (already configured)
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.jvmargs=-Xmx2048m
```

### Reduce APK Size

```bash
# Use App Bundle (automatic optimization)
make build-prod-bundle

# Or split APKs by ABI
flutter build apk --split-per-abi --release --flavor prod
```

### Debug Release Build

```bash
# Build with debug symbols
flutter build apk --release --flavor prod --verbose

# Check ProGuard mapping
cat build/app/outputs/mapping/prodRelease/mapping.txt
```

---

## 📚 Documentation

- **[ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md)** - Complete guide
- **[scripts/README.md](scripts/README.md)** - Script usage
- **[Makefile](Makefile)** - All commands

---

## 🆘 Help

```bash
# Show all commands
make help

# Show Android commands
make help-android

# Show workflows
make help-workflows

# Flutter doctor
flutter doctor -v
```

---

## 🔗 Quick Links

| Task | Command |
|------|---------|
| Setup | `bash scripts/setup-android.sh` |
| Keystore | `bash scripts/generate-keystore.sh` |
| Dev Build | `make build-dev-debug` |
| Staging | `make build-staging-release` |
| Production | `make build-prod-bundle` |
| All Variants | `bash scripts/build-all-variants.sh` |
| Help | `make help` |

---

**Keep this card handy for quick reference! 🚀**
