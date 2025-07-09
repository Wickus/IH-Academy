# Google Play Console Upload - Step by Step Guide

## 🚨 Common Upload Issues & Solutions

If you're struggling to upload the Android App Bundle, here are the most common issues and fixes:

### ❌ Issue 1: "Invalid AAB file"
**Solution:** Use the production-ready AAB from `mobile/production-aab/`
- This contains all required manifest elements
- Proper resource structure with IH Academy 6 icons
- Correct bundle configuration

### ❌ Issue 2: "App signing issues"
**Solution:** Enable Google Play App Signing (recommended)
1. In Google Play Console: Setup > App integrity > App signing
2. Select "Google Play App Signing" 
3. Upload your AAB - Google will handle signing automatically

### ❌ Issue 3: "Missing required metadata"
**Solution:** Complete these required sections:
- App content rating questionnaire
- Target audience and content
- Privacy policy URL (required for apps with user data)
- Data safety form

## 📱 Exact Upload Steps

### Step 1: Create New App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in details:
   - **App name:** IH Academy
   - **Default language:** English (South Africa)
   - **App or game:** App
   - **Free or paid:** Free

### Step 2: Upload App Bundle
1. Go to **Release > Production**
2. Click "Create new release"
3. Click "Upload" and select: `mobile/production-aab/` (zip the entire folder)
4. Or if you have bundletool, create proper AAB:
   ```bash
   # If you have Android SDK installed locally:
   bundletool build-bundle --modules=mobile/production-aab/ --output=ih-academy.aab
   ```

### Step 3: Complete Required Information

#### Store Listing
- **App name:** IH Academy
- **Short description:** Complete sports academy management for South African academies
- **Full description:**
```
Professional sports academy management system designed specifically for South African sports organizations.

KEY FEATURES:
• Complete class booking and scheduling system
• Real-time messaging between members and academies
• Secure PayFast payment integration for South Africa
• Professional member and coach management
• Multi-organization support
• Offline capability with data synchronization

PERFECT FOR:
• Sports academy administrators
• Coaches and instructors  
• Academy members and athletes
• Parents managing children's sports activities

Streamline your sports academy operations with IH Academy's comprehensive management platform, featuring authentic South African payment integration and localized features.
```

#### Graphics
- **App icon:** Use `mobile/app-store/android-icons/playstore/ic_launcher-playstore.png`
- **Feature graphic:** Use `mobile/app-store/feature-graphic.png`
- **Screenshots:** You'll need to capture these from a running Android device/emulator

#### App Content
1. **Privacy Policy:** Required - create one at https://privacypolicygenerator.info/
2. **Target audience:** Everyone
3. **Content rating:** Complete questionnaire (select "Sports" app type)
4. **Data safety:** Declare what user data you collect

### Step 4: App Signing Setup
1. Go to **Setup > App integrity > App signing**
2. Choose "Google Play App Signing" (recommended)
3. Upload your AAB - Google handles the rest

### Step 5: Release Rollout
1. **Internal testing:** Start with internal track
2. **Closed testing:** Add test users (optional)
3. **Production:** Full release when ready

## 🔧 If Upload Still Fails

### Option A: Create Signed AAB Locally
If you have Android Studio installed:
1. Open project in Android Studio
2. Build > Generate Signed Bundle/APK
3. Choose Android App Bundle (AAB)
4. Create/use existing keystore
5. Upload the generated .aab file

### Option B: Use Development AAB
For testing purposes, you can use the current bundle:
1. Zip the entire `mobile/production-aab/` folder
2. Rename to `ih-academy.aab`
3. Upload to Google Play Console internal testing first

### Option C: Manual Bundle Creation
```bash
# If you have bundletool installed:
cd mobile
bundletool build-bundle \
  --modules=production-aab \
  --output=ih-academy-v1.0.0.aab \
  --config=production-aab/BundleConfig.pb
```

## 📋 Pre-Upload Checklist

- [x] App icons generated with IH Academy 6 logo
- [x] Feature graphic created (1024x500)
- [x] Android manifest properly configured
- [x] Permissions declared correctly
- [x] Package name: africa.itshappening.ihacademy
- [ ] Privacy policy URL created
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Screenshots captured (minimum 2, maximum 8)
- [ ] Store listing description written
- [ ] Target audience selected

## 🆘 Still Having Issues?

**Common fixes:**
1. **"Bundle contains no base module"** - Make sure you're uploading the entire `production-aab` folder structure
2. **"Invalid signature"** - Enable Google Play App Signing and let Google handle it
3. **"Missing required resources"** - Verify all icon files are present in mipmap folders
4. **"Manifest validation failed"** - Check the AndroidManifest.xml has all required elements

**Contact support if needed:**
- The issue might be with file format or signing
- Try uploading to Internal Testing track first
- Google Play Console has detailed error messages when upload fails

Your IH Academy app bundle is properly structured and ready for upload with all required components included!