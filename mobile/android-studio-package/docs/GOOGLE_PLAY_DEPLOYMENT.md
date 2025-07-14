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
