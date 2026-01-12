#!/bin/bash

# Android Setup Script
# Prepares Android environment for development

set -e

echo "=================================="
echo "Android Environment Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Flutter
echo -e "${BLUE}🔍 Checking Flutter installation...${NC}"
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}❌ Flutter not found!${NC}"
    echo "Please install Flutter: https://flutter.dev/docs/get-started/install"
    exit 1
fi
echo -e "${GREEN}✅ Flutter found: $(flutter --version | head -n 1)${NC}"
echo ""

# Check Android SDK
echo -e "${BLUE}🔍 Checking Android SDK...${NC}"
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo -e "${YELLOW}⚠️  Android SDK environment variable not set${NC}"
    echo "Set ANDROID_HOME or ANDROID_SDK_ROOT in your shell profile"
else
    echo -e "${GREEN}✅ Android SDK found${NC}"
fi
echo ""

# Run Flutter doctor
echo -e "${BLUE}🏥 Running Flutter doctor...${NC}"
flutter doctor
echo ""

# Get dependencies
echo -e "${BLUE}📦 Getting Flutter dependencies...${NC}"
flutter pub get
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Generate code
echo -e "${BLUE}⚙️  Generating code...${NC}"
flutter pub run build_runner build --delete-conflicting-outputs
echo -e "${GREEN}✅ Code generated${NC}"
echo ""

# Check for Android licenses
echo -e "${BLUE}📜 Checking Android licenses...${NC}"
if command -v sdkmanager &> /dev/null; then
    echo "Accepting Android licenses..."
    yes | sdkmanager --licenses > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ Android licenses accepted${NC}"
else
    echo -e "${YELLOW}⚠️  sdkmanager not found. Please accept licenses manually:${NC}"
    echo "   flutter doctor --android-licenses"
fi
echo ""

# Create local.properties if not exists
LOCAL_PROPS="android/local.properties"
if [ ! -f "$LOCAL_PROPS" ]; then
    echo -e "${BLUE}📝 Creating local.properties...${NC}"
    
    if [ ! -z "$ANDROID_HOME" ]; then
        echo "sdk.dir=$ANDROID_HOME" > "$LOCAL_PROPS"
        echo -e "${GREEN}✅ local.properties created${NC}"
    elif [ ! -z "$ANDROID_SDK_ROOT" ]; then
        echo "sdk.dir=$ANDROID_SDK_ROOT" > "$LOCAL_PROPS"
        echo -e "${GREEN}✅ local.properties created${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not auto-create local.properties${NC}"
        echo "   Please create android/local.properties manually:"
        echo "   sdk.dir=/path/to/android/sdk"
    fi
else
    echo -e "${GREEN}✅ local.properties exists${NC}"
fi
echo ""

# Check for key.properties
if [ ! -f "android/key.properties" ]; then
    echo -e "${YELLOW}⚠️  Release signing not configured${NC}"
    echo "   To build release APKs, run:"
    echo "   bash scripts/generate-keystore.sh"
    echo ""
else
    echo -e "${GREEN}✅ Release signing configured${NC}"
    echo ""
fi

# Summary
echo "=================================="
echo -e "${GREEN}✅ Android setup complete!${NC}"
echo "=================================="
echo ""
echo "📱 Next steps:"
echo "  1. Connect an Android device or start an emulator"
echo "  2. Run: flutter run --flavor dev"
echo "  3. Or build: make build-dev-debug"
echo ""
echo "📚 Documentation:"
echo "  - Setup: FLUTTER_SETUP.md"
echo "  - Android: ANDROID_BUILD_GUIDE.md"
echo "  - Architecture: ARCHITECTURE.md"
echo ""
