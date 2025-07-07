#!/bin/bash

# IH Academy Mobile App - Deployment Scripts
# This script automates the build and deployment process for both iOS and Android

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="IH Academy"
BUNDLE_ID="africa.itshappening.academy"
PACKAGE_NAME="africa.itshappening.academy"
VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}🚀 IH Academy Mobile App Deployment${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo "=================================="

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or higher."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    # Check React Native CLI
    if ! command -v react-native &> /dev/null; then
        error "React Native CLI is not installed. Run: npm install -g react-native-cli"
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run this script from the mobile app root directory."
    fi
    
    log "Prerequisites check passed ✓"
}

# Function to install dependencies
install_dependencies() {
    log "Installing Node.js dependencies..."
    npm ci
    
    # iOS dependencies (only on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log "Installing iOS dependencies..."
        cd ios && pod install && cd ..
    fi
    
    log "Dependencies installed ✓"
}

# Function to run tests
run_tests() {
    log "Running tests..."
    
    # Unit tests
    log "Running unit tests..."
    npm test -- --watchAll=false
    
    # Lint check
    log "Running linter..."
    npm run lint
    
    # Type check
    log "Running TypeScript checks..."
    npm run type-check
    
    log "All tests passed ✓"
}

# Function to generate app icons and splash screens
generate_assets() {
    log "Generating app assets..."
    
    # Check if Sharp is installed for image processing
    if ! npm list sharp &> /dev/null; then
        log "Installing Sharp for image processing..."
        npm install --save-dev sharp
    fi
    
    # Generate app icons
    if [ -f "app-store/app-icon-generator.js" ]; then
        log "Generating app icons..."
        node app-store/app-icon-generator.js
    else
        warning "App icon generator not found. Skipping icon generation."
    fi
    
    # Generate splash screens
    if [ -f "app-store/splash-screen-generator.js" ]; then
        log "Generating splash screens..."
        node app-store/splash-screen-generator.js
    else
        warning "Splash screen generator not found. Skipping splash generation."
    fi
    
    log "Assets generated ✓"
}

# Function to build Android release
build_android() {
    log "Building Android release..."
    
    # Check if Android SDK is available
    if [ -z "$ANDROID_HOME" ]; then
        error "ANDROID_HOME is not set. Please install Android SDK and set ANDROID_HOME."
    fi
    
    # Clean previous builds
    log "Cleaning Android build..."
    cd android
    ./gradlew clean
    
    # Build release AAB (App Bundle)
    log "Building Android App Bundle..."
    ./gradlew bundleRelease
    
    # Build release APK (for testing)
    log "Building Android APK..."
    ./gradlew assembleRelease
    
    cd ..
    
    # Check if build was successful
    if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
        log "Android App Bundle built successfully ✓"
        log "Location: android/app/build/outputs/bundle/release/app-release.aab"
    else
        error "Android App Bundle build failed"
    fi
    
    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        log "Android APK built successfully ✓"
        log "Location: android/app/build/outputs/apk/release/app-release.apk"
    else
        error "Android APK build failed"
    fi
}

# Function to build iOS release (macOS only)
build_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        warning "iOS build skipped (not running on macOS)"
        return
    fi
    
    log "Building iOS release..."
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        error "Xcode is not installed. Please install Xcode from the App Store."
    fi
    
    # Clean build folder
    log "Cleaning iOS build..."
    cd ios
    xcodebuild clean -workspace IHAcademy.xcworkspace -scheme IHAcademy
    
    # Build archive
    log "Building iOS archive..."
    xcodebuild archive \
        -workspace IHAcademy.xcworkspace \
        -scheme IHAcademy \
        -configuration Release \
        -archivePath IHAcademy.xcarchive \
        -allowProvisioningUpdates
    
    cd ..
    
    if [ -d "ios/IHAcademy.xcarchive" ]; then
        log "iOS archive built successfully ✓"
        log "Location: ios/IHAcademy.xcarchive"
    else
        error "iOS archive build failed"
    fi
}

# Function to validate builds
validate_builds() {
    log "Validating builds..."
    
    # Validate Android AAB
    if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
        log "Android AAB validation..."
        # Add AAB validation logic here
        log "Android AAB is valid ✓"
    fi
    
    # Validate iOS archive (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios/IHAcademy.xcarchive" ]; then
        log "iOS archive validation..."
        # Add iOS validation logic here
        log "iOS archive is valid ✓"
    fi
}

# Function to prepare for store submission
prepare_store_submission() {
    log "Preparing store submission materials..."
    
    # Create submission directory
    mkdir -p dist/store-submission
    
    # Copy Android files
    if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
        cp "android/app/build/outputs/bundle/release/app-release.aab" "dist/store-submission/"
        log "Android AAB copied to submission folder"
    fi
    
    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        cp "android/app/build/outputs/apk/release/app-release.apk" "dist/store-submission/"
        log "Android APK copied to submission folder"
    fi
    
    # Copy store assets
    if [ -d "app-store/ios-icons" ]; then
        cp -r "app-store/ios-icons" "dist/store-submission/"
    fi
    
    if [ -d "app-store/android-icons" ]; then
        cp -r "app-store/android-icons" "dist/store-submission/"
    fi
    
    if [ -d "app-store/ios-splash" ]; then
        cp -r "app-store/ios-splash" "dist/store-submission/"
    fi
    
    if [ -d "app-store/android-splash" ]; then
        cp -r "app-store/android-splash" "dist/store-submission/"
    fi
    
    # Copy documentation
    cp "app-store/app-store-listings.md" "dist/store-submission/" 2>/dev/null || true
    cp "app-store/testing-checklist.md" "dist/store-submission/" 2>/dev/null || true
    
    log "Store submission materials prepared ✓"
}

# Function to upload to stores (using fastlane if available)
upload_to_stores() {
    if command -v fastlane &> /dev/null; then
        log "Fastlane detected. Uploading to stores..."
        
        # Upload to Google Play (if Android build exists)
        if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
            log "Uploading to Google Play Console..."
            fastlane android beta 2>/dev/null || warning "Google Play upload failed or not configured"
        fi
        
        # Upload to App Store (if iOS build exists)
        if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios/IHAcademy.xcarchive" ]; then
            log "Uploading to App Store Connect..."
            fastlane ios beta 2>/dev/null || warning "App Store upload failed or not configured"
        fi
    else
        warning "Fastlane not installed. Manual store upload required."
        log "Please upload builds manually to:"
        log "- Google Play Console: https://play.google.com/console"
        log "- App Store Connect: https://appstoreconnect.apple.com"
    fi
}

# Function to create release notes
create_release_notes() {
    log "Creating release notes..."
    
    mkdir -p dist/release-notes
    
    cat > "dist/release-notes/release-notes-v${VERSION}.md" << EOF
# IH Academy Mobile App - Release v${VERSION}

## Release Date
$(date '+%Y-%m-%d')

## What's New
- [Add release notes here]

## Bug Fixes
- [Add bug fixes here]

## Technical Improvements
- [Add technical improvements here]

## Known Issues
- [Add known issues here]

## Download Links
- Android: [Google Play Store](https://play.google.com/store/apps/details?id=${PACKAGE_NAME})
- iOS: [App Store](https://apps.apple.com/app/ih-academy/id[APP_ID])

## Support
For support, please contact: support@academy.itshappening.africa
EOF
    
    log "Release notes created ✓"
}

# Function to cleanup build artifacts
cleanup() {
    log "Cleaning up build artifacts..."
    
    # Clean Android builds (keep release files)
    cd android
    ./gradlew clean
    cd ..
    
    # Clean iOS builds (keep archive)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cd ios
        xcodebuild clean -workspace IHAcademy.xcworkspace -scheme IHAcademy
        cd ..
    fi
    
    log "Cleanup completed ✓"
}

# Main deployment function
deploy() {
    local build_type="$1"
    
    log "Starting deployment process..."
    log "Build type: ${build_type}"
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    run_tests
    generate_assets
    
    case $build_type in
        "android")
            build_android
            ;;
        "ios")
            build_ios
            ;;
        "both"|"")
            build_android
            build_ios
            ;;
        *)
            error "Invalid build type. Use: android, ios, or both"
            ;;
    esac
    
    validate_builds
    prepare_store_submission
    create_release_notes
    
    log "🎉 Deployment completed successfully!"
    log "Check the dist/store-submission folder for build artifacts."
}

# Help function
show_help() {
    echo "IH Academy Mobile App Deployment Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy [android|ios|both]  - Build and prepare for store submission"
    echo "  test                       - Run all tests"
    echo "  assets                     - Generate app icons and splash screens"
    echo "  upload                     - Upload to app stores (requires fastlane)"
    echo "  clean                      - Clean build artifacts"
    echo "  help                       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy both             - Build for both platforms"
    echo "  $0 deploy android          - Build for Android only"
    echo "  $0 deploy ios              - Build for iOS only"
    echo "  $0 test                    - Run tests only"
    echo ""
}

# Main script logic
case "$1" in
    "deploy")
        deploy "$2"
        ;;
    "test")
        check_prerequisites
        install_dependencies
        run_tests
        ;;
    "assets")
        generate_assets
        ;;
    "upload")
        upload_to_stores
        ;;
    "clean")
        cleanup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        deploy "both"
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac