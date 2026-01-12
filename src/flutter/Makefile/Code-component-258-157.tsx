# BasicSoftTemplate Flutter Makefile
# Quick commands for common Flutter tasks and Android builds

.PHONY: help setup get clean build-runner watch test analyze format run-dev run-prod

help: ## Show this help message
	@echo "BasicSoftTemplate Flutter - Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# ========================================
# Setup & Dependencies
# ========================================

setup: ## Setup the project (first time only)
	@echo "Setting up Flutter project..."
	flutter pub get
	flutter pub run build_runner build --delete-conflicting-outputs
	@echo "✓ Setup complete!"

get: ## Get dependencies
	flutter pub get

clean: ## Clean the project
	flutter clean
	flutter pub get

# ========================================
# Code Generation
# ========================================

build-runner: ## Generate code with build_runner
	flutter pub run build_runner build --delete-conflicting-outputs

watch: ## Watch for changes and generate code
	flutter pub run build_runner watch --delete-conflicting-outputs

# ========================================
# Testing & Quality
# ========================================

test: ## Run tests
	flutter test

test-coverage: ## Run tests with coverage
	flutter test --coverage
	@echo "Coverage report generated in coverage/lcov.info"

analyze: ## Analyze code
	flutter analyze

format: ## Format code
	dart format lib/ test/

format-check: ## Check code formatting
	dart format --output=none --set-exit-if-changed lib/ test/

# ========================================
# Running App
# ========================================

run-dev: ## Run app in development mode
	flutter run --debug

run-prod: ## Run app in production mode
	flutter run --release

run-dev-flavor: ## Run app with dev flavor
	flutter run --debug --flavor dev

run-staging-flavor: ## Run app with staging flavor
	flutter run --debug --flavor staging

run-prod-flavor: ## Run app with prod flavor
	flutter run --debug --flavor prod

# ========================================
# Android Builds - Debug
# ========================================

build-dev-debug: ## Build dev debug APK
	@echo "Building dev debug APK..."
	flutter build apk --debug --flavor dev
	@echo "✓ APK: build/app/outputs/flutter-apk/app-dev-debug.apk"

build-staging-debug: ## Build staging debug APK
	@echo "Building staging debug APK..."
	flutter build apk --debug --flavor staging
	@echo "✓ APK: build/app/outputs/flutter-apk/app-staging-debug.apk"

build-prod-debug: ## Build prod debug APK
	@echo "Building prod debug APK..."
	flutter build apk --debug --flavor prod
	@echo "✓ APK: build/app/outputs/flutter-apk/app-prod-debug.apk"

# ========================================
# Android Builds - Release
# ========================================

build-dev-release: ## Build dev release APK
	@echo "Building dev release APK..."
	flutter build apk --release --flavor dev
	@echo "✓ APK: build/app/outputs/flutter-apk/app-dev-release.apk"

build-staging-release: ## Build staging release APK
	@echo "Building staging release APK..."
	flutter build apk --release --flavor staging
	@echo "✓ APK: build/app/outputs/flutter-apk/app-staging-release.apk"

build-prod-release: ## Build prod release APK
	@echo "Building prod release APK..."
	flutter build apk --release --flavor prod
	@echo "✓ APK: build/app/outputs/flutter-apk/app-prod-release.apk"

# ========================================
# Android App Bundle (for Play Store)
# ========================================

build-dev-bundle: ## Build dev App Bundle
	@echo "Building dev App Bundle..."
	flutter build appbundle --release --flavor dev
	@echo "✓ AAB: build/app/outputs/bundle/devRelease/app-dev-release.aab"

build-staging-bundle: ## Build staging App Bundle
	@echo "Building staging App Bundle..."
	flutter build appbundle --release --flavor staging
	@echo "✓ AAB: build/app/outputs/bundle/stagingRelease/app-staging-release.aab"

build-prod-bundle: ## Build prod App Bundle (for Google Play)
	@echo "Building prod App Bundle..."
	flutter build appbundle --release --flavor prod
	@echo "✓ AAB: build/app/outputs/bundle/prodRelease/app-prod-release.aab"
	@echo "📦 Ready to upload to Google Play Console!"

# ========================================
# Android - Split APKs
# ========================================

build-split-apk: ## Build split APKs per ABI
	@echo "Building split APKs..."
	flutter build apk --release --flavor prod --split-per-abi
	@echo "✓ Split APKs created in build/app/outputs/flutter-apk/"

# ========================================
# iOS Builds
# ========================================

build-ios: ## Build iOS app
	flutter build ios --release

build-ios-simulator: ## Build iOS for simulator
	flutter build ios --debug --simulator

# ========================================
# Install & Deploy
# ========================================

install-dev: ## Install dev debug on connected device
	flutter install --debug --flavor dev

install-staging: ## Install staging debug on connected device
	flutter install --debug --flavor staging

install-prod: ## Install prod debug on connected device
	flutter install --debug --flavor prod

# ========================================
# Gradle Commands
# ========================================

gradle-clean: ## Clean Android Gradle build
	cd android && ./gradlew clean

gradle-build: ## Build Android with Gradle
	cd android && ./gradlew build

gradle-assemble: ## Assemble all variants
	cd android && ./gradlew assembleRelease

# ========================================
# Utility Commands
# ========================================

doctor: ## Run Flutter doctor
	flutter doctor -v

upgrade: ## Upgrade Flutter dependencies
	flutter pub upgrade

outdated: ## Check for outdated dependencies
	flutter pub outdated

devices: ## List connected devices
	flutter devices

logs: ## View Flutter logs
	flutter logs

# ========================================
# Size Analysis
# ========================================

analyze-size: ## Analyze APK size
	@echo "Building APK for size analysis..."
	flutter build apk --release --flavor prod --analyze-size

# ========================================
# Common Workflows
# ========================================

dev: clean get build-runner build-dev-release ## Clean, get deps, generate code, build dev release

staging: clean get build-runner build-staging-release ## Clean, get deps, generate code, build staging release

prod: clean get build-runner build-prod-bundle ## Clean, get deps, generate code, build prod bundle

all-variants: ## Build all release variants
	@echo "Building all release variants..."
	make build-dev-release
	make build-staging-release
	make build-prod-release
	@echo "✓ All variants built!"

quick-test: ## Quick test workflow (format, analyze, test)
	make format
	make analyze
	make test
	@echo "✓ All checks passed!"

release-ready: ## Prepare for production release
	@echo "Preparing production release..."
	make clean
	make get
	make build-runner
	make quick-test
	make build-prod-bundle
	@echo "✓ Production release ready!"
	@echo "📦 Upload build/app/outputs/bundle/prodRelease/app-prod-release.aab to Play Store"

# ========================================
# Help Categories
# ========================================

help-android: ## Show Android build commands
	@echo "\n🤖 Android Build Commands:\n"
	@grep -E '^build-(dev|staging|prod).*:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

help-workflows: ## Show common workflows
	@echo "\n⚡ Common Workflows:\n"
	@echo "  make dev              - Build dev release (clean + deps + codegen + build)"
	@echo "  make staging          - Build staging release"
	@echo "  make prod             - Build prod bundle for Play Store"
	@echo "  make release-ready    - Full production release pipeline"
	@echo "  make quick-test       - Run all quality checks"

.DEFAULT_GOAL := help
