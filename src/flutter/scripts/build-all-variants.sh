#!/bin/bash

# Build All Android Variants
# This script builds all APK and AAB variants for testing

set -e

echo "=================================="
echo "Building All Android Variants"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_DIR="build/app/outputs"

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
flutter clean
flutter pub get
echo ""

# Generate code
echo -e "${BLUE}⚙️  Generating code...${NC}"
flutter pub run build_runner build --delete-conflicting-outputs
echo ""

# Build Debug APKs
echo -e "${YELLOW}📱 Building Debug APKs...${NC}"
echo ""

echo "Building dev debug..."
flutter build apk --debug --flavor dev
echo -e "${GREEN}✅ Dev debug APK built${NC}"
echo ""

echo "Building staging debug..."
flutter build apk --debug --flavor staging
echo -e "${GREEN}✅ Staging debug APK built${NC}"
echo ""

echo "Building prod debug..."
flutter build apk --debug --flavor prod
echo -e "${GREEN}✅ Prod debug APK built${NC}"
echo ""

# Build Release APKs
echo -e "${YELLOW}📦 Building Release APKs...${NC}"
echo ""

echo "Building dev release..."
flutter build apk --release --flavor dev
echo -e "${GREEN}✅ Dev release APK built${NC}"
echo ""

echo "Building staging release..."
flutter build apk --release --flavor staging
echo -e "${GREEN}✅ Staging release APK built${NC}"
echo ""

echo "Building prod release..."
flutter build apk --release --flavor prod
echo -e "${GREEN}✅ Prod release APK built${NC}"
echo ""

# Build App Bundles
echo -e "${YELLOW}📚 Building App Bundles...${NC}"
echo ""

echo "Building dev bundle..."
flutter build appbundle --release --flavor dev
echo -e "${GREEN}✅ Dev bundle built${NC}"
echo ""

echo "Building staging bundle..."
flutter build appbundle --release --flavor staging
echo -e "${GREEN}✅ Staging bundle built${NC}"
echo ""

echo "Building prod bundle..."
flutter build appbundle --release --flavor prod
echo -e "${GREEN}✅ Prod bundle built${NC}"
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✅ All builds completed!${NC}"
echo "=================================="
echo ""

echo "📱 APKs:"
echo "  Debug:"
echo "    - $BUILD_DIR/flutter-apk/app-dev-debug.apk"
echo "    - $BUILD_DIR/flutter-apk/app-staging-debug.apk"
echo "    - $BUILD_DIR/flutter-apk/app-prod-debug.apk"
echo ""
echo "  Release:"
echo "    - $BUILD_DIR/flutter-apk/app-dev-release.apk"
echo "    - $BUILD_DIR/flutter-apk/app-staging-release.apk"
echo "    - $BUILD_DIR/flutter-apk/app-prod-release.apk"
echo ""

echo "📦 App Bundles:"
echo "    - $BUILD_DIR/bundle/devRelease/app-dev-release.aab"
echo "    - $BUILD_DIR/bundle/stagingRelease/app-staging-release.aab"
echo "    - $BUILD_DIR/bundle/prodRelease/app-prod-release.aab"
echo ""

# Calculate sizes
echo "📊 Build Sizes:"
if [ -f "$BUILD_DIR/flutter-apk/app-prod-release.apk" ]; then
    SIZE=$(du -h "$BUILD_DIR/flutter-apk/app-prod-release.apk" | cut -f1)
    echo "    Prod Release APK: $SIZE"
fi

if [ -f "$BUILD_DIR/bundle/prodRelease/app-prod-release.aab" ]; then
    SIZE=$(du -h "$BUILD_DIR/bundle/prodRelease/app-prod-release.aab" | cut -f1)
    echo "    Prod Release AAB: $SIZE"
fi

echo ""
echo -e "${YELLOW}🚀 Ready to deploy!${NC}"
