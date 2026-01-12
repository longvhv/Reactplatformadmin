# Flutter Build Scripts

Helper scripts for Android development and building.

## 📜 Available Scripts

### 1. setup-android.sh

**Purpose**: Initial Android environment setup

**Usage:**
```bash
bash scripts/setup-android.sh
```

**What it does:**
- ✅ Checks Flutter installation
- ✅ Checks Android SDK
- ✅ Runs Flutter doctor
- ✅ Installs dependencies
- ✅ Generates code
- ✅ Accepts Android licenses
- ✅ Creates local.properties

### 2. generate-keystore.sh

**Purpose**: Generate release keystore for signing APKs

**Usage:**
```bash
bash scripts/generate-keystore.sh
```

**What it does:**
- ✅ Prompts for keystore details
- ✅ Generates JKS keystore file
- ✅ Creates key.properties config
- ✅ Provides security reminders

**Output:**
- `keystore/upload-keystore.jks`
- `android/key.properties`

**⚠️ IMPORTANT:**
- Keep keystore file secure
- Never commit keystore to Git
- Backup keystore and passwords
- Store passwords in password manager

### 3. build-all-variants.sh

**Purpose**: Build all APK and AAB variants at once

**Usage:**
```bash
bash scripts/build-all-variants.sh
```

**What it does:**
- ✅ Cleans previous builds
- ✅ Generates code
- ✅ Builds all debug APKs (dev, staging, prod)
- ✅ Builds all release APKs (dev, staging, prod)
- ✅ Builds all App Bundles (dev, staging, prod)
- ✅ Shows build sizes

**Time:** ~15-30 minutes depending on machine

**Output:**
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
    ├── devRelease/app-dev-release.aab
    ├── stagingRelease/app-staging-release.aab
    └── prodRelease/app-prod-release.aab
```

## 🚀 Quick Start Workflow

### First Time Setup

```bash
# 1. Setup environment
bash scripts/setup-android.sh

# 2. Generate keystore (for release builds)
bash scripts/generate-keystore.sh

# 3. Test with dev build
flutter run --flavor dev
```

### Development Workflow

```bash
# Run on device
flutter run --flavor dev

# Or use Makefile
make run-dev-flavor
```

### Release Workflow

```bash
# Single release build
make build-prod-release

# Or build everything
bash scripts/build-all-variants.sh

# Or use Makefile workflow
make release-ready
```

## 📋 Script Permissions

Make scripts executable:

```bash
chmod +x scripts/*.sh
```

Or on Windows (Git Bash):
```bash
git update-index --chmod=+x scripts/*.sh
```

## 🔒 Security Notes

### Keystore Security

**DO:**
- ✅ Keep keystore in secure location
- ✅ Backup keystore file
- ✅ Store passwords in password manager
- ✅ Use different passwords for different apps
- ✅ Limit access to keystore

**DON'T:**
- ❌ Commit keystore to Git
- ❌ Share keystore publicly
- ❌ Email keystore
- ❌ Store passwords in plain text
- ❌ Use weak passwords

### Files to Keep Secret

```
# These files should NEVER be committed:
keystore/*.jks
keystore/*.keystore
android/key.properties
android/app/google-services.json (if using Firebase)
```

Already in `.gitignore`:
```gitignore
key.properties
*.jks
*.keystore
```

## 🐛 Troubleshooting

### Script Permission Denied

```bash
# Make executable
chmod +x scripts/generate-keystore.sh

# Run with bash
bash scripts/generate-keystore.sh
```

### Android SDK Not Found

```bash
# Set environment variable
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Add to ~/.bashrc or ~/.zshrc for persistence
echo 'export ANDROID_HOME=/path/to/android/sdk' >> ~/.bashrc
```

### Flutter Command Not Found

```bash
# Add Flutter to PATH
export PATH=$PATH:/path/to/flutter/bin

# Add to shell profile
echo 'export PATH=$PATH:/path/to/flutter/bin' >> ~/.bashrc
```

### Keytool Command Not Found

```bash
# Keytool comes with Java JDK
# Install JDK if not present

# On macOS
brew install openjdk

# On Ubuntu/Debian
sudo apt-get install openjdk-11-jdk

# Verify
keytool -version
```

### Build Fails with Out of Memory

```bash
# Increase Gradle memory in android/gradle.properties
org.gradle.jvmargs=-Xmx4096m

# Or use environment variable
export GRADLE_OPTS="-Xmx4096m"
```

## 📚 Related Documentation

- [ANDROID_BUILD_GUIDE.md](../ANDROID_BUILD_GUIDE.md) - Complete Android build documentation
- [FLUTTER_SETUP.md](../FLUTTER_SETUP.md) - Flutter setup guide
- [Makefile](../Makefile) - Build commands

## 💡 Tips

### Speed Up Builds

1. **Enable Gradle Daemon** (already enabled)
   ```properties
   # android/gradle.properties
   org.gradle.daemon=true
   ```

2. **Use Build Cache**
   ```properties
   org.gradle.caching=true
   ```

3. **Parallel Builds**
   ```properties
   org.gradle.parallel=true
   ```

### CI/CD Integration

For automated builds in CI/CD:

```bash
# Example GitHub Actions
- name: Setup Android
  run: bash scripts/setup-android.sh

- name: Build Release
  run: make build-prod-bundle
```

### Multiple Keystores

For different apps, use different keystores:

```bash
# App 1
scripts/generate-keystore.sh  # Creates keystore/upload-keystore.jks

# App 2
# Rename first keystore
mv keystore/upload-keystore.jks keystore/app1-keystore.jks

# Generate new keystore
scripts/generate-keystore.sh  # Creates keystore/upload-keystore.jks
```

Update `key.properties` accordingly.

## 🎯 Common Use Cases

### Build for Testing

```bash
# Quick debug build
make build-dev-debug

# Install on device
make install-dev
```

### Build for QA Team

```bash
# Staging build
make build-staging-release

# Share APK
# build/app/outputs/flutter-apk/app-staging-release.apk
```

### Build for Production

```bash
# Full release pipeline
make release-ready

# Upload to Play Store
# build/app/outputs/bundle/prodRelease/app-prod-release.aab
```

### Build All Variants for Archive

```bash
# Build everything
bash scripts/build-all-variants.sh

# Create archive
tar -czf builds-$(date +%Y%m%d).tar.gz build/app/outputs/
```

---

## 📞 Support

For issues:
1. Check [ANDROID_BUILD_GUIDE.md](../ANDROID_BUILD_GUIDE.md)
2. Check [FLUTTER_SETUP.md](../FLUTTER_SETUP.md)
3. Run `flutter doctor -v`
4. Check script output for errors

---

**Happy Building! 🚀**
