# Android Build Configuration - Setup Summary

## ✅ Completed Setup

Đã hoàn thành đầy đủ Android build configuration cho Flutter app BasicSoftTemplate.

---

## 📂 Created Files

### Build Configuration (10 files)

```
flutter/android/
├── build.gradle                          ✅ Root Gradle config
├── settings.gradle                       ✅ Gradle settings
├── gradle.properties                     ✅ Gradle properties
├── gradle/wrapper/
│   └── gradle-wrapper.properties        ✅ Gradle wrapper
├── .gitignore                           ✅ Android gitignore
├── key.properties.example               ✅ Signing config template
└── app/
    ├── build.gradle                      ✅ App Gradle config
    ├── proguard-rules.pro               ✅ ProGuard/R8 rules
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml      ✅ Main manifest
        │   ├── kotlin/.../MainActivity.kt ✅ Main activity
        │   └── res/
        │       ├── values/
        │       │   ├── colors.xml       ✅ Color definitions
        │       │   └── styles.xml       ✅ App styles
        │       ├── values-night/
        │       │   └── styles.xml       ✅ Dark mode styles
        │       ├── xml/
        │       │   └── network_security_config.xml ✅ Network config
        │       └── drawable/
        │           ├── launch_background.xml ✅ Splash screen
        │           └── launch_image.png      ✅ Splash image placeholder
        ├── debug/
        │   └── AndroidManifest.xml      ✅ Debug manifest
        └── profile/
            └── AndroidManifest.xml      ✅ Profile manifest
```

### Scripts (3 files)

```
flutter/scripts/
├── setup-android.sh          ✅ Android environment setup
├── generate-keystore.sh      ✅ Keystore generator
├── build-all-variants.sh     ✅ Build all variants
└── README.md                 ✅ Scripts documentation
```

### Documentation (2 files)

```
flutter/
├── ANDROID_BUILD_GUIDE.md    ✅ Complete Android guide
└── Makefile (updated)        ✅ Build commands
```

---

## 🎯 Key Features

### 1. Build Variants System

**3 Build Types:**
- Debug (debuggable, no minify)
- Staging (no debug, minify enabled)
- Release (production, full optimization)

**3 Product Flavors:**
- Dev (development environment)
- Staging (pre-production)
- Prod (production)

**Total: 9 Build Variants**

### 2. Application IDs

```
Dev:     com.vhvplatform.basicsofttemplate.dev
Staging: com.vhvplatform.basicsofttemplate.staging
Prod:    com.vhvplatform.basicsofttemplate
```

### 3. API Configuration

```gradle
dev {
    buildConfigField "String", "API_BASE_URL", 
        '"http://10.0.2.2:8080/api/v1"'
}

staging {
    buildConfigField "String", "API_BASE_URL", 
        '"https://staging-api.yourdomain.com/api/v1"'
}

prod {
    buildConfigField "String", "API_BASE_URL", 
        '"https://api.yourdomain.com/api/v1"'
}
```

### 4. Signing Configuration

**Debug Signing:**
- Keystore: `android/app/debug.keystore`
- Password: `android`
- Alias: `androiddebugkey`

**Release Signing:**
- Configurable via `android/key.properties`
- Template: `android/key.properties.example`
- Generate with: `bash scripts/generate-keystore.sh`

### 5. ProGuard/R8 Rules

Configured in `android/app/proguard-rules.pro`:
- ✅ Flutter framework preservation
- ✅ Gson serialization
- ✅ OkHttp/Retrofit network layer
- ✅ Kotlin Coroutines
- ✅ Data classes protection
- ✅ AndroidX compatibility
- ✅ Debug log removal
- ✅ Line numbers for crash reports

### 6. Gradle Optimizations

```properties
org.gradle.parallel=true           # Parallel builds
org.gradle.caching=true           # Build cache
android.enableR8.fullMode=true    # R8 full mode
org.gradle.jvmargs=-Xmx2048m      # Memory allocation
```

### 7. Network Security

**Development:**
- Allows HTTP (cleartext traffic)
- Localhost/Emulator access

**Production:**
- HTTPS only (update config)
- System certificates

### 8. Permissions

**Current:**
- INTERNET
- ACCESS_NETWORK_STATE
- WAKE_LOCK

**Optional (commented):**
- CAMERA
- STORAGE (READ/WRITE)
- LOCATION
- NOTIFICATIONS

---

## 🚀 Quick Start Commands

### Setup

```bash
# Initial setup
bash scripts/setup-android.sh

# Generate release keystore
bash scripts/generate-keystore.sh
```

### Development

```bash
# Run dev flavor
make run-dev-flavor

# Build dev debug
make build-dev-debug

# Install on device
make install-dev
```

### Testing

```bash
# Build staging
make build-staging-release

# Build all variants
bash scripts/build-all-variants.sh
```

### Production

```bash
# Build release APK
make build-prod-release

# Build App Bundle for Play Store
make build-prod-bundle

# Full release pipeline
make release-ready
```

### Makefile Commands

```bash
# View all commands
make help

# View Android commands
make help-android

# View workflows
make help-workflows
```

---

## 📱 Build Outputs

### APK Files

```
build/app/outputs/flutter-apk/
├── app-dev-debug.apk           # Dev debug
├── app-dev-release.apk         # Dev release
├── app-staging-debug.apk       # Staging debug
├── app-staging-release.apk     # Staging release
├── app-prod-debug.apk          # Prod debug
└── app-prod-release.apk        # Prod release
```

### App Bundle Files (for Play Store)

```
build/app/outputs/bundle/
├── devRelease/app-dev-release.aab
├── stagingRelease/app-staging-release.aab
└── prodRelease/app-prod-release.aab    # Upload to Play Store
```

---

## 🔧 Configuration Files

### 1. android/app/build.gradle

**Configured:**
- ✅ Package name: `com.vhvplatform.basicsofttemplate`
- ✅ Min SDK: 21 (Android 5.0)
- ✅ Target SDK: 34 (Android 14)
- ✅ Compile SDK: 34
- ✅ Multi-dex enabled
- ✅ Build variants (3 types × 3 flavors)
- ✅ Signing configs
- ✅ ProGuard rules
- ✅ Dependencies (AndroidX, Material, etc.)

### 2. android/gradle.properties

**Optimizations:**
- ✅ Parallel builds
- ✅ Build caching
- ✅ R8 full mode
- ✅ Configure on demand
- ✅ 2GB JVM heap

### 3. android/app/proguard-rules.pro

**Rules for:**
- ✅ Flutter
- ✅ Gson
- ✅ Retrofit/OkHttp
- ✅ Kotlin
- ✅ AndroidX
- ✅ Custom data classes

### 4. android/app/src/main/AndroidManifest.xml

**Configured:**
- ✅ Permissions (INTERNET, etc.)
- ✅ Application config
- ✅ Activity settings
- ✅ Network security
- ✅ Deep linking (template)
- ✅ Queries (Android 11+)

---

## 📋 Usage Matrix

| Task | Command | Output |
|------|---------|--------|
| Setup | `bash scripts/setup-android.sh` | Environment ready |
| Generate Keystore | `bash scripts/generate-keystore.sh` | keystore/*.jks + key.properties |
| Dev Build | `make build-dev-debug` | app-dev-debug.apk |
| Staging Build | `make build-staging-release` | app-staging-release.apk |
| Production APK | `make build-prod-release` | app-prod-release.apk |
| Play Store Bundle | `make build-prod-bundle` | app-prod-release.aab |
| All Variants | `bash scripts/build-all-variants.sh` | All APKs + AABs |
| Full Pipeline | `make release-ready` | Tested + Built AAB |

---

## 🔐 Security Checklist

### ✅ Implemented

- [x] Release signing with keystore
- [x] ProGuard/R8 code obfuscation
- [x] Debug keystore for development
- [x] Network security config
- [x] Separate debug/release configs
- [x] .gitignore for sensitive files
- [x] key.properties template

### ⚠️ Important Reminders

**Never commit:**
- ❌ `android/key.properties`
- ❌ `*.jks` or `*.keystore` files
- ❌ Passwords in plain text
- ❌ `google-services.json` (if using Firebase)

**Always:**
- ✅ Backup keystore file
- ✅ Store passwords securely
- ✅ Test release builds
- ✅ Use different keystores for different apps

---

## 📊 Build Variants Summary

### Debug Builds (Development)

| Variant | App ID Suffix | API URL | Debuggable | Minify |
|---------|--------------|---------|------------|--------|
| devDebug | .dev.debug | 10.0.2.2:8080 | Yes | No |
| stagingDebug | .staging.debug | staging-api | Yes | No |
| prodDebug | .debug | production | Yes | No |

### Release Builds (Production)

| Variant | App ID Suffix | API URL | Debuggable | Minify | Signing |
|---------|--------------|---------|------------|--------|---------|
| devRelease | .dev | 10.0.2.2:8080 | No | Yes | Debug |
| stagingRelease | .staging | staging-api | No | Yes | Debug |
| prodRelease | - | production | No | Yes | Release |

---

## 🎯 Next Steps

### For Development

1. Run setup script:
   ```bash
   bash scripts/setup-android.sh
   ```

2. Test build:
   ```bash
   make build-dev-debug
   ```

3. Install on device:
   ```bash
   make install-dev
   ```

### For Release

1. Generate keystore:
   ```bash
   bash scripts/generate-keystore.sh
   ```

2. Update API URLs in `android/app/build.gradle`

3. Update package name if needed

4. Build release:
   ```bash
   make release-ready
   ```

5. Upload to Play Store:
   ```bash
   # Upload: build/app/outputs/bundle/prodRelease/app-prod-release.aab
   ```

---

## 📚 Documentation

**Read these for details:**

1. **[ANDROID_BUILD_GUIDE.md](/flutter/ANDROID_BUILD_GUIDE.md)**
   - Complete Android configuration guide
   - Build variants explained
   - Signing setup
   - ProGuard configuration
   - Publishing to Play Store

2. **[scripts/README.md](/flutter/scripts/README.md)**
   - Script usage
   - Troubleshooting
   - Security notes

3. **[Makefile](/flutter/Makefile)**
   - All build commands
   - Workflows
   - Quick reference

4. **[FLUTTER_SETUP.md](/flutter/FLUTTER_SETUP.md)**
   - Flutter setup guide
   - Development workflow

---

## ✨ What's Configured

### ✅ Complete

- [x] Gradle build system (8.4)
- [x] Kotlin support (1.9.20)
- [x] Build variants (9 variants)
- [x] Signing configuration
- [x] ProGuard/R8 rules
- [x] Network security
- [x] App manifest
- [x] Splash screen config
- [x] Material Design 3
- [x] AndroidX libraries
- [x] Multi-dex support
- [x] Build scripts
- [x] Makefile commands
- [x] Documentation

### 🚀 Ready to Use

- ✅ Development builds
- ✅ Staging builds
- ✅ Production builds
- ✅ Play Store deployment
- ✅ Automated workflows
- ✅ Code obfuscation
- ✅ Optimized builds

---

## 🎉 Summary

**Android build configuration hoàn chỉnh với:**

✅ **9 Build Variants** (3 types × 3 flavors)  
✅ **Signing Configuration** (debug + release)  
✅ **ProGuard/R8** (code obfuscation)  
✅ **Build Scripts** (automation)  
✅ **Makefile Commands** (easy building)  
✅ **Complete Documentation**  
✅ **Production Ready**  

🚀 **Sẵn sàng build APK/AAB cho Google Play Store!**

```bash
# Generate keystore
bash scripts/generate-keystore.sh

# Build for Play Store
make build-prod-bundle

# Upload to Play Store
# ➡️ build/app/outputs/bundle/prodRelease/app-prod-release.aab
```

---

Last Updated: 2026-01-03  
Version: 1.0.0
