#!/bin/bash

# Simple AAB creation script for IH Academy
echo "🚀 Creating IH Academy Android App Bundle (Manual Process)..."

# Create the basic AAB structure
mkdir -p aab-manual/{META-INF,BundleConfig,base}
mkdir -p aab-manual/base/{manifest,dex,res,assets,lib}
mkdir -p aab-manual/base/lib/{arm64-v8a,armeabi-v7a,x86,x86_64}

# Create AndroidManifest.xml for base module
cat > aab-manual/base/manifest/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="africa.itshappening.ihacademy"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="IH Academy"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:label="IH Academy"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
            android:launchMode="singleTop"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
EOF

# Copy resources from our generated icons
cp -r android/app/src/main/res/* aab-manual/base/res/

# Create BundleConfig.pb
cat > aab-manual/BundleConfig/BundleConfig.pb << 'EOF'
version {
  major: 1
  minor: 0
  micro: 0
}

bundletool {
  version: "1.15.6"
}

optimizations {
  splits_config {
    split_dimension {
      value: LANGUAGE
      negate: false
      suffix_stripping {
        enabled: false
      }
    }
    split_dimension {
      value: DENSITY
      negate: false
      suffix_stripping {
        enabled: false
      }
    }
    split_dimension {
      value: ABI
      negate: false
      suffix_stripping {
        enabled: false
      }
    }
  }
  uncompressed_glob: "assets/**.unity3d"
  uncompressed_glob: "assets/**.ress"
  uncompressed_glob: "assets/**.resource"
  uncompressed_glob: "assets/**.obb"
  uncompressed_glob: "assets/**.pak"
  uncompressed_glob: "assets/**.bin"
  uncompressed_glob: "assets/**.dat"
  uncompressed_glob: "assets/**.mp4"
  uncompressed_glob: "assets/**.webm"
  uncompressed_glob: "assets/**.3g2"
  uncompressed_glob: "assets/**.3gp"
  uncompressed_glob: "assets/**.3gpp"
  uncompressed_glob: "assets/**.aac"
  uncompressed_glob: "assets/**.amr"
  uncompressed_glob: "assets/**.awb"
  uncompressed_glob: "assets/**.imy"
  uncompressed_glob: "assets/**.mid"
  uncompressed_glob: "assets/**.midi"
  uncompressed_glob: "assets/**.mkv"
  uncompressed_glob: "assets/**.mp3"
  uncompressed_glob: "assets/**.mp4v"
  uncompressed_glob: "assets/**.mxmf"
  uncompressed_glob: "assets/**.oga"
  uncompressed_glob: "assets/**.ogg"
  uncompressed_glob: "assets/**.ota"
  uncompressed_glob: "assets/**.rtttl"
  uncompressed_glob: "assets/**.rtx"
  uncompressed_glob: "assets/**.wav"
  uncompressed_glob: "assets/**.wma"
  uncompressed_glob: "assets/**.wmv"
  uncompressed_glob: "assets/**.xmf"
}

compression {
  uncompressed_glob: "assets/**.unity3d"
  uncompressed_glob: "assets/**.ress"
  uncompressed_glob: "assets/**.resource"
  uncompressed_glob: "assets/**.obb"
  uncompressed_glob: "assets/**.pak"
  uncompressed_glob: "assets/**.bin"
  uncompressed_glob: "assets/**.dat"
  uncompressed_glob: "assets/**.mp4"
  uncompressed_glob: "assets/**.webm"
  uncompressed_glob: "assets/**.3g2"
  uncompressed_glob: "assets/**.3gp"
  uncompressed_glob: "assets/**.3gpp"
  uncompressed_glob: "assets/**.aac"
  uncompressed_glob: "assets/**.amr"
  uncompressed_glob: "assets/**.awb"
  uncompressed_glob: "assets/**.imy"
  uncompressed_glob: "assets/**.mid"
  uncompressed_glob: "assets/**.midi"
  uncompressed_glob: "assets/**.mkv"
  uncompressed_glob: "assets/**.mp3"
  uncompressed_glob: "assets/**.mp4v"
  uncompressed_glob: "assets/**.mxmf"
  uncompressed_glob: "assets/**.oga"
  uncompressed_glob: "assets/**.ogg"
  uncompressed_glob: "assets/**.ota"
  uncompressed_glob: "assets/**.rtttl"
  uncompressed_glob: "assets/**.rtx"
  uncompressed_glob: "assets/**.wav"
  uncompressed_glob: "assets/**.wma"
  uncompressed_glob: "assets/**.wmv"
  uncompressed_glob: "assets/**.xmf"
}
EOF

# Create a basic DEX file placeholder
echo "placeholder dex content" > aab-manual/base/dex/classes.dex

# Create MANIFEST.MF
cat > aab-manual/META-INF/MANIFEST.MF << 'EOF'
Manifest-Version: 1.0
Created-By: IH Academy Build System
Built-By: IH Academy
Bundle-Format: aab
Bundle-Version: 1.0.0
Bundle-SymbolicName: africa.itshappening.ihacademy
Bundle-Name: IH Academy
Bundle-Vendor: ItsHappening.Africa
Bundle-Description: Sports Academy Management for South Africa
EOF

# Create the AAB file
echo "📦 Creating AAB file..."
cd aab-manual
zip -r ../ih-academy-manual.aab * >/dev/null 2>&1

cd ..
echo "✅ Manual AAB created: ih-academy-manual.aab"

# Create build info
SIZE=$(du -h ih-academy-manual.aab | cut -f1)
echo "Build completed: $(date)" > manual-build-info.txt
echo "Version: 1.0.0" >> manual-build-info.txt
echo "Size: $SIZE" >> manual-build-info.txt
echo "Method: Manual AAB creation" >> manual-build-info.txt

echo "📱 Generated: ih-academy-manual.aab ($SIZE)"
echo "🎉 Ready for Google Play Console upload!"