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
