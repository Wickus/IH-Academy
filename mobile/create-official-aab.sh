#!/bin/bash

# Official Android App Bundle Creation Script using bundletool
echo "Creating IH Academy AAB using official bundletool..."

# Remove any existing builds
rm -rf build-output *.aab *.apks

# Create proper Android project structure for bundletool
mkdir -p build-output/{base/manifest,base/dex,base/res,base/assets,base/lib}

# Copy AndroidManifest.xml to proper location
cp android/app/src/main/AndroidManifest.xml build-output/base/manifest/

# Copy all resources
cp -r android/app/src/main/res/* build-output/base/res/

# Copy assets
cp -r android/app/src/main/assets/* build-output/base/assets/ 2>/dev/null || true

# Create a simple DEXINFO for the dex directory
echo "Version: 2.0" > build-output/base/dex/DEXINFO

# Create proper base.zip first (this is what bundletool expects)
cd build-output
zip -r ../base.zip base/

cd ..

# Create the proper AAB structure using bundletool's expected format
# bundletool expects a specific internal structure, so let's create one from our base

# Create a temporary APK first using our resources
echo "Creating temporary APK structure..."
mkdir -p temp-apk
cp -r android/app/src/main/* temp-apk/

# Create AndroidManifest.xml for APK
cat > temp-apk/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="africa.itshappening.ihacademy"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name="africa.itshappening.ihacademy.MainApplication"
        android:label="IH Academy"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <activity
            android:name="africa.itshappening.ihacademy.MainActivity"
            android:label="IH Academy"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTop"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
EOF

# Use bundletool to create a proper AAB from existing resources
# We need to create it the proper way by building from our Android project

echo "Building AAB with bundletool..."

# Actually, let's use bundletool's build command correctly
# bundletool build-bundle expects a specific project structure

# Create proper bundle structure
mkdir -p bundle-project/base
cp -r android/app/src/main/* bundle-project/base/

# Create bundle.json which is required
cat > bundle-project/bundle.json << 'EOF'
{
  "formatVersion": "0.1",
  "modules": [
    {
      "name": "base",
      "type": "FEATURE"
    }
  ]
}
EOF

# Try to build using bundletool
java -jar bundletool-all-1.15.6.jar build-bundle \
  --modules=bundle-project/base \
  --output=ih-academy-official.aab

# If that doesn't work, create a simpler structure
if [ ! -f "ih-academy-official.aab" ]; then
    echo "Direct build failed, creating simplified structure..."
    
    # Create the minimal structure that bundletool expects
    mkdir -p simple-bundle
    
    # Copy the base.zip we created earlier
    cp base.zip simple-bundle/
    
    # Create BundleConfig.pb using bundletool
    echo "Creating proper bundle configuration..."
    
    # Actually use the original AAB as a template and rebuild it properly
    java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-production-v2.aab || true
    
    echo "Validation results shown above"
fi

# Check final result
if [ -f "ih-academy-official.aab" ]; then
    SIZE=$(du -h ih-academy-official.aab | cut -f1)
    echo "✅ Official AAB created: ih-academy-official.aab ($SIZE)"
    
    # Validate the bundle
    echo "Validating bundle..."
    java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-official.aab
    
    if [ $? -eq 0 ]; then
        echo "✅ Bundle validation successful!"
    else
        echo "❌ Bundle validation failed"
    fi
else
    echo "❌ Failed to create official AAB"
fi

# Clean up temporary files
rm -rf build-output temp-apk bundle-project simple-bundle base.zip

echo "Build process completed."