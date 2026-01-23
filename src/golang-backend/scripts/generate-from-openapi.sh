#!/bin/bash

# Code Generation from OpenAPI Specification
# Phase 3: Generate Golang code from OpenAPI 3.0 specs

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SPEC_FILE="api/openapi/openapi.yaml"
OUTPUT_DIR="internal/generated"

echo "========================================="
echo "OpenAPI Code Generation"
echo "========================================="
echo ""

# Check dependencies
echo "1. Checking dependencies..."

if ! command -v oapi-codegen &> /dev/null; then
    echo -e "${YELLOW}Installing oapi-codegen...${NC}"
    go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@latest
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies OK${NC}"
echo ""

# Validate spec first
echo "2. Validating OpenAPI spec..."
if ! npx @redocly/cli lint "$SPEC_FILE" --skip-rule=no-unused-schemas > /dev/null 2>&1; then
    echo -e "${RED}❌ Validation failed!${NC}"
    npx @redocly/cli lint "$SPEC_FILE" --skip-rule=no-unused-schemas
    exit 1
fi
echo -e "${GREEN}✅ Validation passed${NC}"
echo ""

# Bundle spec
echo "3. Bundling specification..."
npx @redocly/cli bundle "$SPEC_FILE" -o api/openapi/bundled.yaml --dereferenced
echo -e "${GREEN}✅ Bundled spec created${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"/{models,server,client}

# Generate models
echo "4. Generating models..."
oapi-codegen -package models \
    -generate types \
    api/openapi/bundled.yaml > "$OUTPUT_DIR/models/types.go"
echo -e "${GREEN}✅ Models generated at $OUTPUT_DIR/models/types.go${NC}"
echo ""

# Generate server interfaces
echo "5. Generating server interfaces..."
oapi-codegen -package server \
    -generate chi-server \
    api/openapi/bundled.yaml > "$OUTPUT_DIR/server/server.go"
echo -e "${GREEN}✅ Server interfaces generated at $OUTPUT_DIR/server/server.go${NC}"
echo ""

# Generate client
echo "6. Generating client..."
oapi-codegen -package client \
    -generate client \
    api/openapi/bundled.yaml > "$OUTPUT_DIR/client/client.go"
echo -e "${GREEN}✅ Client generated at $OUTPUT_DIR/client/client.go${NC}"
echo ""

# Generate spec embedder
echo "7. Generating spec embedder..."
oapi-codegen -package server \
    -generate spec \
    api/openapi/bundled.yaml > "$OUTPUT_DIR/server/spec.go"
echo -e "${GREEN}✅ Spec embedder generated${NC}"
echo ""

# Format generated code
echo "8. Formatting generated code..."
go fmt "$OUTPUT_DIR/..."
echo -e "${GREEN}✅ Code formatted${NC}"
echo ""

# Statistics
echo "========================================="
echo -e "${GREEN}✅ Code Generation Complete!${NC}"
echo "========================================="
echo ""
echo "Generated files:"
echo "  • Models: $OUTPUT_DIR/models/types.go"
echo "  • Server: $OUTPUT_DIR/server/server.go"
echo "  • Client: $OUTPUT_DIR/client/client.go"
echo "  • Spec: $OUTPUT_DIR/server/spec.go"
echo ""
echo "File statistics:"
find "$OUTPUT_DIR" -name "*.go" -exec wc -l {} + | tail -1
echo ""
echo "Next steps:"
echo "  1. Review generated code"
echo "  2. Implement server interfaces"
echo "  3. Add business logic to handlers"
echo "  4. Write tests"
echo ""
