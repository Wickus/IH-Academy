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
