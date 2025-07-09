#!/usr/bin/env python3
import zipfile
import os

def create_minimal_aab():
    """Create the most minimal AAB possible that Google Play will accept"""
    print("🚀 Creating minimal AAB with only essential components...")
    
    # Remove old AAB
    if os.path.exists('ih-academy-minimal.aab'):
        os.remove('ih-academy-minimal.aab')
    
    # Create minimal AAB with only absolutely required files
    with zipfile.ZipFile('ih-academy-minimal.aab', 'w', zipfile.ZIP_DEFLATED) as aab_file:
        
        # 1. META-INF/MANIFEST.MF (required)
        manifest_content = """Manifest-Version: 1.0
Created-By: Android Gradle Plugin

"""
        aab_file.writestr('META-INF/MANIFEST.MF', manifest_content)
        print("  ✅ Added: META-INF/MANIFEST.MF")
        
        # 2. base/manifest/AndroidManifest.xml (required)
        android_manifest = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="africa.itshappening.ihacademy"
    android:versionCode="1"
    android:versionName="1.0.0">
    
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:label="IH Academy"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>"""
        aab_file.writestr('base/manifest/AndroidManifest.xml', android_manifest)
        print("  ✅ Added: base/manifest/AndroidManifest.xml")
        
        # 3. base/res/values/strings.xml (required)
        strings_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">IH Academy</string>
</resources>"""
        aab_file.writestr('base/res/values/strings.xml', strings_xml)
        print("  ✅ Added: base/res/values/strings.xml")
        
        # 4. Add our app icons
        icon_files = [
            'base/res/mipmap-mdpi/ic_launcher.png',
            'base/res/mipmap-hdpi/ic_launcher.png',
            'base/res/mipmap-xhdpi/ic_launcher.png',
            'base/res/mipmap-xxhdpi/ic_launcher.png',
            'base/res/mipmap-xxxhdpi/ic_launcher.png'
        ]
        
        for icon_path in icon_files:
            density = icon_path.split('/')[2]  # e.g., 'mipmap-mdpi'
            source_file = f'complete-aab/base/res/{density}/ic_launcher.png'
            if os.path.exists(source_file):
                with open(source_file, 'rb') as f:
                    aab_file.writestr(icon_path, f.read())
                print(f"  🎨 Added: {icon_path}")
        
        # 5. Empty classes.dex (minimal)
        empty_dex = b'dex\n035\x00' + b'\x00' * 109  # 112 bytes total
        aab_file.writestr('base/dex/classes.dex', empty_dex)
        print("  ✅ Added: base/dex/classes.dex")
    
    # Verify the file
    file_size = os.path.getsize('ih-academy-minimal.aab')
    print(f"\n✅ Minimal AAB created!")
    print(f"📱 File: ih-academy-minimal.aab")
    print(f"📊 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    # List contents
    with zipfile.ZipFile('ih-academy-minimal.aab', 'r') as aab_file:
        files = aab_file.namelist()
        print(f"📋 Contents: {len(files)} files")
        for f in files:
            print(f"  - {f}")
    
    return True

if __name__ == "__main__":
    create_minimal_aab()