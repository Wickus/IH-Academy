# Build and Deployment Guide - IH Academy Mobile App

## Prerequisites

### Development Environment
- **Node.js**: v18.0.0 or higher
- **React Native CLI**: Latest version
- **Expo CLI**: Latest version
- **Android Studio**: Latest with Android SDK 33+
- **Xcode**: 14.0+ (for iOS builds, macOS only)
- **Java**: JDK 11 or higher

### Accounts Required
- **Apple Developer Account**: $99/year for iOS App Store
- **Google Play Console**: $25 one-time for Android Play Store
- **Firebase Project**: Free tier available for push notifications
- **Sentry Account**: Error tracking and monitoring (optional)

---

## Build Configuration

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Verify React Native setup
npx react-native doctor
```

### 2. Firebase Configuration

**iOS Setup:**
1. Create Firebase project at https://console.firebase.google.com
2. Add iOS app with bundle ID: `africa.itshappening.academy`
3. Download `GoogleService-Info.plist`
4. Place in `ios/IHAcademy/GoogleService-Info.plist`

**Android Setup:**
1. Add Android app with package name: `africa.itshappening.academy`
2. Download `google-services.json`
3. Place in `android/app/google-services.json`

### 3. Code Signing (iOS)

**Development Certificate:**
```bash
# Generate development certificate
openssl req -new -key development.key -out development.csr

# Import to Keychain and download from Apple Developer Portal
```

**Distribution Certificate:**
```bash
# Generate distribution certificate for App Store
openssl req -new -key distribution.key -out distribution.csr

# Import distribution certificate for release builds
```

**Provisioning Profiles:**
- Development Profile: Team ID with device UDIDs
- App Store Profile: Distribution certificate for App Store submission

### 4. Android Keystore

```bash
# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore ih-academy-release.keystore -alias ih-academy -keyalg RSA -keysize 2048 -validity 10000

# Add to android/gradle.properties
MYAPP_RELEASE_STORE_FILE=ih-academy-release.keystore
MYAPP_RELEASE_KEY_ALIAS=ih-academy
MYAPP_RELEASE_STORE_PASSWORD=***
MYAPP_RELEASE_KEY_PASSWORD=***
```

---

## Build Process

### Development Builds

**iOS Simulator:**
```bash
# Start Metro bundler
npx react-native start

# Run on iOS simulator
npx react-native run-ios
```

**Android Emulator:**
```bash
# Start Android emulator
emulator -avd Pixel_4_API_33

# Run on Android emulator
npx react-native run-android
```

### Production Builds

**iOS Release Build:**
```bash
# Clean build folder
cd ios && xcodebuild clean && cd ..

# Build for device
npx react-native run-ios --configuration Release --device

# Or build archive in Xcode:
# 1. Open ios/IHAcademy.xcworkspace in Xcode
# 2. Select "Any iOS Device" as target
# 3. Product → Archive
# 4. Upload to App Store Connect
```

**Android Release Build:**
```bash
# Clean previous builds
cd android && ./gradlew clean && cd ..

# Generate release APK
cd android && ./gradlew assembleRelease

# Generate release AAB (App Bundle)
cd android && ./gradlew bundleRelease

# APK location: android/app/build/outputs/apk/release/
# AAB location: android/app/build/outputs/bundle/release/
```

---

## App Store Submission

### iOS App Store Connect

**1. App Store Connect Setup:**
- Create new app in App Store Connect
- Bundle ID: `africa.itshappening.academy`
- App Name: `IH Academy`
- Primary Language: English (South Africa)
- Category: Sports

**2. App Information:**
- Upload app icon (1024x1024)
- Add app description and keywords
- Set pricing and availability
- Configure age rating questionnaire

**3. Build Upload:**
```bash
# Archive in Xcode and upload to App Store Connect
# Or use Xcode command line tools:
xcodebuild archive -workspace ios/IHAcademy.xcworkspace -scheme IHAcademy -archivePath IHAcademy.xcarchive

# Upload to App Store
xcodebuild -exportArchive -archivePath IHAcademy.xcarchive -exportPath IHAcademy -exportOptionsPlist ExportOptions.plist
```

**4. TestFlight:**
- Internal testing with team members
- External testing with beta testers
- Collect feedback and fix issues

**5. App Review:**
- Submit for review with all metadata
- Review guidelines compliance check
- Address any reviewer feedback

### Google Play Console

**1. Play Console Setup:**
- Create new app in Play Console
- Package name: `africa.itshappening.academy`
- App name: `IH Academy`
- Default language: English (South Africa)

**2. Store Listing:**
- Upload app icon and feature graphic
- Add description and screenshots
- Set content rating and target audience
- Configure pricing and distribution

**3. Release Management:**
```bash
# Upload AAB to Play Console
# Internal testing → Closed testing → Open testing → Production

# Use Play Console upload or fastlane:
fastlane supply --aab android/app/build/outputs/bundle/release/app-release.aab
```

**4. Review Process:**
- Automated pre-launch testing
- Manual review (if flagged)
- Policy compliance verification

---

## Automated Deployment

### Fastlane Configuration

**iOS Fastfile:**
```ruby
platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    build_app(workspace: "ios/IHAcademy.xcworkspace", scheme: "IHAcademy")
    upload_to_testflight
  end
  
  desc "Deploy to App Store"
  lane :release do
    build_app(workspace: "ios/IHAcademy.xcworkspace", scheme: "IHAcademy")
    upload_to_app_store
  end
end
```

**Android Fastfile:**
```ruby
platform :android do
  desc "Build and upload to Play Console"
  lane :beta do
    gradle(task: "bundleRelease")
    upload_to_play_store(track: 'internal')
  end
  
  desc "Deploy to Production"
  lane :release do
    gradle(task: "bundleRelease")
    upload_to_play_store(track: 'production')
  end
end
```

### GitHub Actions CI/CD

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: cd ios && pod install
      - run: fastlane ios beta
        if: startsWith(github.ref, 'refs/tags/')

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-java@v3
        with:
          java-version: 11
      - run: npm install
      - run: fastlane android beta
        if: startsWith(github.ref, 'refs/tags/')
```

---

## Testing Strategy

### Unit Testing
```bash
# Run Jest tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Testing
```bash
# Run Detox E2E tests
npm run e2e:ios
npm run e2e:android
```

### Device Testing
- **iOS**: iPhone 12, 13, 14 (multiple screen sizes)
- **Android**: Pixel 4, Samsung Galaxy S21, OnePlus 9
- **Tablets**: iPad Pro, Samsung Galaxy Tab

### Performance Testing
- App startup time
- Memory usage monitoring
- Network request optimization
- Battery usage analysis

---

## Monitoring and Analytics

### Crash Reporting
```javascript
// Sentry integration
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production'
});
```

### Analytics
```javascript
// Firebase Analytics
import analytics from '@react-native-firebase/analytics';

analytics().logEvent('class_booked', {
  class_id: classId,
  organization_id: orgId,
  user_type: userRole
});
```

### Performance Monitoring
- Firebase Performance Monitoring
- Custom performance metrics
- Network request tracking
- User journey analysis

---

## Release Checklist

### Pre-Release
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility testing done
- [ ] Device compatibility verified
- [ ] Network conditions tested (3G, WiFi, offline)

### Metadata
- [ ] App store descriptions updated
- [ ] Screenshots captured for all device sizes
- [ ] App icons generated in all required sizes
- [ ] Privacy policy and terms updated
- [ ] Age ratings and content warnings set

### Technical
- [ ] Build configuration verified
- [ ] Environment variables set correctly
- [ ] API endpoints pointing to production
- [ ] Error tracking and analytics configured
- [ ] Push notification certificates valid

### Post-Release
- [ ] Monitor crash reports and user feedback
- [ ] Track key performance indicators
- [ ] Update support documentation
- [ ] Plan next release iteration

---

## Support and Maintenance

### Version Numbering
- **Major.Minor.Patch** (e.g., 1.0.0)
- Major: Breaking changes or significant new features
- Minor: New features, backward compatible
- Patch: Bug fixes and minor improvements

### Update Strategy
- **Critical fixes**: Immediate patch release
- **Feature updates**: Monthly minor releases
- **Major updates**: Quarterly major releases

### Support Channels
- **Email**: support@academy.itshappening.africa
- **Documentation**: https://academy.itshappening.africa/docs
- **Community**: Discord/Slack community support
- **Emergency**: 24/7 support for critical issues

---

## Compliance and Legal

### Privacy Compliance
- POPIA (South Africa) compliance
- GDPR compliance (if applicable)
- App store privacy requirements
- Data retention and deletion policies

### Security Requirements
- Data encryption in transit and at rest
- Secure authentication (OAuth 2.0, biometrics)
- API security (rate limiting, authentication)
- Regular security audits and penetration testing

### Business Compliance
- South African business registration
- Tax compliance and invoicing
- Payment processor agreements (PayFast)
- Terms of service and privacy policy updates