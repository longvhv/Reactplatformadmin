#!/bin/bash

# Test coverage script for VHV Platform Backend

set -e

echo "========================================="
echo "Running Go Tests with Coverage"
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create coverage directory
mkdir -p coverage

# Run tests with coverage
echo -e "${YELLOW}Running all tests...${NC}"
go test -v -race -coverprofile=coverage/coverage.out -covermode=atomic ./... 2>&1 | tee coverage/test.log

# Check if tests passed
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi

# Generate coverage report
echo -e "${YELLOW}Generating coverage report...${NC}"
go tool cover -html=coverage/coverage.out -o coverage/coverage.html

# Calculate total coverage
COVERAGE=$(go tool cover -func=coverage/coverage.out | grep total | awk '{print $3}')
echo -e "${GREEN}Total Coverage: ${COVERAGE}${NC}"

# Generate coverage by package
echo -e "${YELLOW}Coverage by package:${NC}"
go tool cover -func=coverage/coverage.out | grep -v "total:" | awk '{print $1 " " $3}' | column -t > coverage/coverage_by_package.txt
cat coverage/coverage_by_package.txt

# Check minimum coverage threshold (70%)
COVERAGE_NUM=$(echo $COVERAGE | sed 's/%//')
THRESHOLD=70

if (( $(echo "$COVERAGE_NUM < $THRESHOLD" | bc -l) )); then
    echo -e "${RED}✗ Coverage ${COVERAGE} is below threshold ${THRESHOLD}%${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Coverage ${COVERAGE} meets threshold ${THRESHOLD}%${NC}"
fi

echo ""
echo "========================================="
echo "Coverage Report Summary"
echo "========================================="
echo "Total Coverage: ${COVERAGE}"
echo "HTML Report: coverage/coverage.html"
echo "Detailed Report: coverage/coverage_by_package.txt"
echo "Test Log: coverage/test.log"
echo "========================================="
