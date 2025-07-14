#!/bin/bash

echo "Creating Android Studio build package..."

# Create a complete package for Android Studio
mkdir -p android-studio-package/{app-icons,manifest,resources,docs}

# Copy all the app icons
echo "Packaging app icons..."
cp -r android/app/src/main/res/mipmap-* android-studio-package/app-icons/

# Copy AndroidManifest.xml
echo "Packaging AndroidManifest.xml..."
cp android/app/src/main/AndroidManifest.xml android-studio-package/manifest/

# Copy resource files
echo "Packaging resources..."
cp android/app/src/main/res/values/* android-studio-package/resources/ 2>/dev/null || true

# Create Android Studio project structure guide
cat > android-studio-package/docs/ANDROID_STUDIO_SETUP.md << 'EOF'
# Android Studio Setup Guide for IH Academy

## Project Details
- **App Name:** IH Academy
- **Package Name:** africa.itshappening.ihacademy
- **Target SDK:** 33
- **Min SDK:** 21
- **Version Code:** 1
- **Version Name:** 1.0.0

## Step-by-Step Instructions

### 1. Create New Android Project
1. Open Android Studio
2. File → New → New Project
3. Choose "Empty Activity"
4. Set Application name: `IH Academy`
5. Set Package name: `africa.itshappening.ihacademy`
6. Set Save location: Choose your preferred directory
7. Set Language: Java or Kotlin (your preference)
8. Set Minimum SDK: API 21
9. Click Finish

### 2. Replace App Icons
1. Navigate to `app/src/main/res/`
2. Replace the following directories with our provided icons:
   - `mipmap-mdpi/` 
   - `mipmap-hdpi/`
   - `mipmap-xhdpi/`
   - `mipmap-xxhdpi/`
   - `mipmap-xxxhdpi/`
3. Copy all icon files from our `app-icons/` folder

### 3. Update AndroidManifest.xml
1. Open `app/src/main/AndroidManifest.xml`
2. Replace the entire contents with our provided manifest file
3. Make sure the package name matches: `africa.itshappening.ihacademy`

### 4. Update app/build.gradle
Add these configurations to your `app/build.gradle`:

```gradle
android {
    compileSdk 33
    
    defaultConfig {
        applicationId "africa.itshappening.ihacademy"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 5. Update Resource Files
1. Replace `app/src/main/res/values/strings.xml` with our version
2. Replace `app/src/main/res/values/colors.xml` with our version  
3. Replace `app/src/main/res/values/styles.xml` with our version

### 6. Build AAB File
1. Build → Clean Project
2. Build → Rebuild Project
3. Build → Generate Signed Bundle / APK
4. Choose "Android App Bundle (.aab)"
5. Create or select a keystore
6. Choose "release" build variant
7. Click "Create"

### 7. Locate Your AAB
The AAB file will be created in:
`app/release/app-release.aab`

This file is ready for Google Play Console upload!

## Troubleshooting

### Common Issues:
1. **Build errors:** Make sure all icon files are properly copied
2. **Package name conflicts:** Ensure package name is exactly `africa.itshappening.ihacademy`
3. **Permission errors:** Check AndroidManifest.xml permissions are correct

### Verification:
- App should build without errors
- All icons should display correctly
- Package name should match exactly
- AAB file should be around 2-10MB depending on your implementation
EOF

# Create a keystore generation guide
cat > android-studio-package/docs/KEYSTORE_SETUP.md << 'EOF'
# Android Keystore Setup for IH Academy

## Creating a Keystore for Signing

### Option 1: Android Studio GUI
1. Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle (.aab)"
3. Click "Create new..." for keystore
4. Fill in the details:
   - **Key store path:** Choose location for `ih-academy-keystore.jks`
   - **Password:** Create strong password
   - **Key alias:** `ih-academy-key`
   - **Key password:** Same or different password
   - **Validity:** 25 years (recommended)
   - **Certificate info:**
     - First and Last Name: IH Academy
     - Organizational Unit: Sports Management
     - Organization: ItsHappening.Africa
     - City: Your city
     - State: Your province
     - Country Code: ZA

### Option 2: Command Line
```bash
keytool -genkey -v -keystore ih-academy-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ih-academy-key
```

## Important Notes
- **SAVE YOUR KEYSTORE AND PASSWORDS SAFELY**
- You need the same keystore for all future app updates
- Google Play Store requires consistent signing
- Consider using a password manager for keystore credentials

## For Production Deployment
- Store keystore in secure location
- Backup keystore and passwords
- Consider Google Play App Signing for additional security
EOF

# Create deployment checklist
cat > android-studio-package/docs/GOOGLE_PLAY_DEPLOYMENT.md << 'EOF'
# Google Play Store Deployment Checklist

## Pre-Deployment Requirements ✅

### App Assets Ready
- [x] IH Academy 6 whistle logo implemented
- [x] All icon densities generated (mdpi to xxxhdpi)
- [x] App name: IH Academy
- [x] Package name: africa.itshappening.ihacademy

### Technical Requirements
- [x] Target SDK 33 (latest requirement)
- [x] Min SDK 21 (covers 99%+ devices)
- [x] Required permissions configured
- [x] App signing keystore created

## Google Play Console Steps

### 1. Create App Listing
1. Go to https://play.google.com/console
2. Create Application
3. App Details:
   - App name: IH Academy
   - Default language: English (South Africa)
   - App or game: App
   - Free or paid: Free (or as per business model)

### 2. Upload AAB
1. Release → Production → Create new release
2. Upload your `app-release.aab` file
3. Add release notes
4. Review and publish

### 3. Store Listing
- App description: Sports academy management for South Africa
- Screenshots: (prepare from React Native app)
- Feature graphic: Use IH Academy branding
- App icon: Will auto-populate from AAB

### 4. Content Rating
- Complete questionnaire for sports/educational app
- Should result in "Everyone" rating

### 5. App Category
- Category: Sports
- Tags: sports academy, management, booking, South Africa

## Launch Strategy
1. Internal testing first
2. Closed testing with beta users
3. Open testing (optional)
4. Production release

## Post-Launch
- Monitor Google Play Console for crashes
- Respond to user reviews
- Plan update releases
- Track download and engagement metrics
EOF

echo "✅ Android Studio build package created!"
echo ""
echo "📦 Package Contents:"
echo "- app-icons/: All IH Academy icon files"
echo "- manifest/: AndroidManifest.xml"
echo "- resources/: strings.xml, colors.xml, styles.xml"
echo "- docs/: Complete setup and deployment guides"
echo ""
echo "📋 Next Steps:"
echo "1. Copy this entire android-studio-package folder to your local machine"
echo "2. Follow ANDROID_STUDIO_SETUP.md guide"
echo "3. Build AAB using Android Studio"
echo "4. Upload to Google Play Console"
echo ""
echo "📱 Ready for Google Play Store deployment!"