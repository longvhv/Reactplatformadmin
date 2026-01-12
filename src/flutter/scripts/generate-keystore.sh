#!/bin/bash

# Generate Android Release Keystore
# This script helps you create a keystore for signing Android release builds

set -e

echo "=================================="
echo "Android Keystore Generator"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create keystore directory
KEYSTORE_DIR="../keystore"
mkdir -p "$KEYSTORE_DIR"

# Default values
DEFAULT_ALIAS="upload"
DEFAULT_VALIDITY="10000"
DEFAULT_KEYSIZE="2048"

echo "This script will generate a keystore for signing your Android app."
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep your keystore and passwords secure!${NC}"
echo "   - Store keystore in a safe location"
echo "   - Never commit keystore to version control"
echo "   - Keep backup of keystore and passwords"
echo ""

# Get user input
read -p "Enter key alias [$DEFAULT_ALIAS]: " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-$DEFAULT_ALIAS}

read -sp "Enter keystore password: " STORE_PASSWORD
echo ""
read -sp "Confirm keystore password: " STORE_PASSWORD_CONFIRM
echo ""

if [ "$STORE_PASSWORD" != "$STORE_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}❌ Passwords don't match!${NC}"
    exit 1
fi

read -sp "Enter key password (press Enter to use same as keystore): " KEY_PASSWORD
echo ""
if [ -z "$KEY_PASSWORD" ]; then
    KEY_PASSWORD="$STORE_PASSWORD"
fi

echo ""
echo "Enter certificate information:"
read -p "First and Last Name [VHV Platform]: " CN
CN=${CN:-"VHV Platform"}

read -p "Organizational Unit [Development]: " OU
OU=${OU:-"Development"}

read -p "Organization [VHV Platform]: " O
O=${O:-"VHV Platform"}

read -p "City/Locality [Ho Chi Minh]: " L
L=${L:-"Ho Chi Minh"}

read -p "State/Province [Ho Chi Minh]: " ST
ST=${ST:-"Ho Chi Minh"}

read -p "Country Code (2 letters) [VN]: " C
C=${C:-"VN"}

# Keystore file path
KEYSTORE_FILE="$KEYSTORE_DIR/upload-keystore.jks"

echo ""
echo "Generating keystore..."
echo ""

# Generate keystore
keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -keyalg RSA \
    -keysize $DEFAULT_KEYSIZE \
    -validity $DEFAULT_VALIDITY \
    -alias "$KEY_ALIAS" \
    -storetype JKS \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$CN, OU=$OU, O=$O, L=$L, ST=$ST, C=$C"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Keystore generated successfully!${NC}"
    echo ""
    echo "Keystore location: $KEYSTORE_FILE"
    echo ""
    
    # Create key.properties file
    KEY_PROPERTIES="../android/key.properties"
    
    echo "Creating key.properties file..."
    cat > "$KEY_PROPERTIES" << EOF
# Android Signing Configuration
# IMPORTANT: DO NOT commit this file to version control!

storePassword=$STORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=../keystore/upload-keystore.jks
EOF
    
    echo -e "${GREEN}✅ key.properties created!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Summary:${NC}"
    echo "  - Keystore: $KEYSTORE_FILE"
    echo "  - Config: android/key.properties"
    echo "  - Alias: $KEY_ALIAS"
    echo ""
    echo -e "${YELLOW}⚠️  Next steps:${NC}"
    echo "  1. Backup your keystore file securely"
    echo "  2. Save your passwords in a password manager"
    echo "  3. Never commit key.properties or .jks files to Git"
    echo "  4. Add to .gitignore (already configured)"
    echo ""
    echo -e "${GREEN}🚀 You're ready to build release APKs!${NC}"
    echo ""
    echo "Build release:"
    echo "  make build-prod-release"
    echo ""
    echo "Build app bundle for Play Store:"
    echo "  make build-prod-bundle"
    echo ""
else
    echo -e "${RED}❌ Failed to generate keystore${NC}"
    exit 1
fi
