#!/bin/bash

# IH Academy - Android App Bundle Build Script
# This script builds a production-ready AAB file for Google Play Store

echo "🚀 Building IH Academy Android App Bundle..."

# Set up environment
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate keystore if it doesn't exist
if [ ! -f android/app/debug.keystore ]; then
    echo "🔑 Generating debug keystore..."
    keytool -genkey -v -keystore android/app/debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"
fi

# Build the Android App Bundle
echo "🏗️ Building Android App Bundle..."
cd android

# Make gradlew executable
chmod +x gradlew

# Build release bundle
echo "Building release AAB..."
./gradlew bundleRelease

# Check if build was successful
if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
    echo "✅ Build successful!"
    
    # Copy AAB to root mobile directory
    cp app/build/outputs/bundle/release/app-release.aab ../ih-academy-production.aab
    
    # Get file size
    SIZE=$(du -h ../ih-academy-production.aab | cut -f1)
    echo "📱 Generated: ih-academy-production.aab ($SIZE)"
    
    # Create build info
    echo "Build completed: $(date)" > ../build-info.txt
    echo "Version: 1.0.0" >> ../build-info.txt
    echo "Size: $SIZE" >> ../build-info.txt
    
    echo "🎉 IH Academy Android App Bundle ready for Google Play Store!"
    echo "📁 Location: mobile/ih-academy-production.aab"
else
    echo "❌ Build failed!"
    exit 1
fi