#!/bin/bash

# IH Academy - Android App Bundle Build Script
# Creates production-ready AAB file for Google Play Store submission

set -e

echo "🚀 Building IH Academy Android App Bundle for Play Store..."

# Check prerequisites
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

# Java should be available via Nix in Replit environment
if ! command -v java &> /dev/null; then
    echo "📱 Java not found. Using Replit environment Java..."
    export JAVA_HOME=/nix/store/*/lib/openjdk
    export PATH="$JAVA_HOME/bin:$PATH"
fi

# Set JAVA_HOME if not set
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=/nix/store/*/lib/openjdk
    echo "📱 Set JAVA_HOME to: $JAVA_HOME"
fi

# Install React Native CLI if not present
if ! command -v react-native &> /dev/null; then
    echo "📱 Installing React Native CLI..."
    npm install -g @react-native-community/cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate app icons with new IH Academy 6 logo
echo "🎨 Generating app icons with IH Academy 6 logo..."
cd app-store
node app-icon-generator.js
cd ..

# Create Android project structure
echo "📱 Setting up Android project structure..."
mkdir -p android/app/src/main/res

# Copy generated icons to Android structure
echo "🖼️ Copying app icons to Android project..."
cp -r app-store/android-icons/* android/app/src/main/res/ 2>/dev/null || true

# Create Android manifest
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="africa.itshappening.ihacademy">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:screenOrientation="portrait"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create strings.xml
mkdir -p android/app/src/main/res/values
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">IH Academy</string>
</resources>
EOF

# Create app theme
cat > android/app/src/main/res/values/styles.xml << 'EOF'
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:colorPrimary">#20366B</item>
        <item name="android:colorPrimaryDark">#20366B</item>
        <item name="android:colorAccent">#24D367</item>
        <item name="android:statusBarColor">#20366B</item>
        <item name="android:navigationBarColor">#20366B</item>
    </style>
</resources>
EOF

# Create build.gradle for app
mkdir -p android/app
cat > android/app/build.gradle << 'EOF'
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    namespace "africa.itshappening.ihacademy"
    
    defaultConfig {
        applicationId "africa.itshappening.ihacademy"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
    }
    
    signingConfigs {
        release {
            storeFile file("release-keystore.jks")
            storePassword "ihacademy2025"
            keyAlias "ihacademy"
            keyPassword "ihacademy2025"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
    
    bundle {
        language {
            enableSplit = false
        }
    }
}

dependencies {
    implementation "com.facebook.react:react-android"
    implementation "androidx.multidex:multidex:2.0.1"
}
EOF

# Create root build.gradle
cat > android/build.gradle << 'EOF'
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}
EOF

# Create gradle wrapper
mkdir -p android/gradle/wrapper
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Create settings.gradle
cat > android/settings.gradle << 'EOF'
rootProject.name = 'IHAcademy'
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')
EOF

# Create local.properties
cat > android/local.properties << 'EOF'
sdk.dir=/opt/android-sdk
EOF

# Generate release keystore
echo "🔐 Generating release keystore..."
keytool -genkeypair -v \
    -storetype JKS \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass ihacademy2025 \
    -keypass ihacademy2025 \
    -alias ihacademy \
    -keystore android/app/release-keystore.jks \
    -dname "CN=IH Academy, OU=Sports Management, O=ItsHappening.Africa, L=Cape Town, ST=Western Cape, C=ZA"

# Install Android SDK if not present
if [ ! -d "/opt/android-sdk" ]; then
    echo "📱 Installing Android SDK..."
    sudo mkdir -p /opt/android-sdk
    sudo chmod 777 /opt/android-sdk
    
    cd /tmp
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
    unzip -q commandlinetools-linux-9477386_latest.zip
    mv cmdline-tools /opt/android-sdk/
    mkdir -p /opt/android-sdk/cmdline-tools/latest
    mv /opt/android-sdk/cmdline-tools/* /opt/android-sdk/cmdline-tools/latest/ 2>/dev/null || true
    
    export PATH="/opt/android-sdk/cmdline-tools/latest/bin:$PATH"
    export ANDROID_HOME="/opt/android-sdk"
    
    # Accept licenses and install required packages
    yes | sdkmanager --licenses
    sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
    
    cd - > /dev/null
fi

export ANDROID_HOME="/opt/android-sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Build the Android App Bundle
echo "🏗️ Building Android App Bundle..."
cd android
chmod +x gradlew || ./gradlew wrapper
./gradlew bundleRelease

# Check if build succeeded
if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
    echo "✅ Android App Bundle created successfully!"
    echo "📁 Location: android/app/build/outputs/bundle/release/app-release.aab"
    echo "📱 Ready for Google Play Store upload!"
    
    # Create deployment info
    cat > ../app-bundle-info.txt << EOF
IH Academy Android App Bundle
============================

File: android/app/build/outputs/bundle/release/app-release.aab
Package: africa.itshappening.ihacademy
Version: 1.0.0 (Code: 1)
Target SDK: 34
Min SDK: 21

Keystore: android/app/release-keystore.jks
Alias: ihacademy
Store Password: ihacademy2025
Key Password: ihacademy2025

App Name: IH Academy
Description: Complete Sports Academy Management
Category: Sports & Fitness
Content Rating: Everyone

Ready for Google Play Console upload!
EOF
    
else
    echo "❌ Build failed! Check logs above for errors."
    exit 1
fi

echo "🎉 IH Academy Android App Bundle build complete!"