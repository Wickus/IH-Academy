# Android Studio Project - Files to Replace

## CRITICAL: Replace These Exact Files

### 1. Main Resource Files (REQUIRED)
Replace these files in your Android Studio project:

**From:** `mobile/android-studio-package/app/src/main/res/values/`
**To:** `YourProject/app/src/main/res/values/`

```
✅ strings.xml          → Replace completely (eliminates duplicates)
✅ colors.xml           → Replace completely (IH Academy colors)
✅ styles.xml           → Replace completely (Material Design + IH Academy theme)
✅ attrs.xml            → Replace completely (custom attributes)
✅ dimens.xml           → Replace completely (dimensions)
```

### 2. Drawable Resources (REQUIRED)
Replace these files in your Android Studio project:

**From:** `mobile/android-studio-package/app/src/main/res/drawable/`
**To:** `YourProject/app/src/main/res/drawable/`

```
✅ All .xml files       → Replace all drawable XML files
✅ All .png files       → Replace all icon/image files
```

### 3. AndroidManifest.xml (REQUIRED)
**From:** `mobile/android-studio-package/app/src/main/AndroidManifest.xml`
**To:** `YourProject/app/src/main/AndroidManifest.xml`

### 4. build.gradle Files (REQUIRED)
```
✅ app/build.gradle     → Replace module-level build.gradle
✅ build.gradle         → Replace project-level build.gradle
```

## Step-by-Step Replacement Process

### Step 1: Backup Your Current Files
1. Create backup folder in your Android Studio project
2. Copy current `res/values/` folder to backup

### Step 2: Replace Resource Files
1. **Delete** existing `app/src/main/res/values/strings.xml`
2. **Copy** new `strings.xml` from mobile/android-studio-package
3. **Replace** all other files in `res/values/` folder
4. **Replace** all files in `res/drawable/` folder

### Step 3: Replace Manifest and Build Files
1. **Replace** AndroidManifest.xml
2. **Replace** both build.gradle files
3. **Sync** project in Android Studio

### Step 4: Clean and Rebuild
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**
3. **Build** → **Generate Signed Bundle/APK**

## What This Fixes

### ❌ Before (Errors):
- "Found item String/this_week more than one time"
- Missing drawable resources
- Build failures

### ✅ After (Fixed):
- No duplicate string resources
- Complete IH Academy 6 branding
- All missing resources provided
- Clean AAB build ready for Play Store

## File Locations Summary

**Source (What to copy FROM):**
```
mobile/android-studio-package/app/src/main/res/values/strings.xml
mobile/android-studio-package/app/src/main/res/values/colors.xml
mobile/android-studio-package/app/src/main/res/values/styles.xml
mobile/android-studio-package/app/src/main/res/values/attrs.xml
mobile/android-studio-package/app/src/main/res/values/dimens.xml
mobile/android-studio-package/app/src/main/res/drawable/*
mobile/android-studio-package/app/src/main/AndroidManifest.xml
mobile/android-studio-package/app/build.gradle
mobile/android-studio-package/build.gradle
```

**Destination (What to copy TO):**
```
YourAndroidProject/app/src/main/res/values/strings.xml
YourAndroidProject/app/src/main/res/values/colors.xml
YourAndroidProject/app/src/main/res/values/styles.xml
YourAndroidProject/app/src/main/res/values/attrs.xml
YourAndroidProject/app/src/main/res/values/dimens.xml
YourAndroidProject/app/src/main/res/drawable/*
YourAndroidProject/app/src/main/AndroidManifest.xml
YourAndroidProject/app/build.gradle
YourAndroidProject/build.gradle
```

---
**Result:** Complete elimination of duplicate resource errors and successful AAB build