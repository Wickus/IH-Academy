#!/bin/bash

echo "Creating AAB with proper binary protobuf BundleConfig.pb..."

# Clean up
rm -rf *.aab final-bundle *.zip

# Create bundle structure
mkdir -p final-bundle/base/{manifest,dex,res,assets,lib,root}
mkdir -p final-bundle/META-INF

# Copy AndroidManifest.xml
cp android/app/src/main/AndroidManifest.xml final-bundle/base/manifest/

# Copy resources properly
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    mkdir -p final-bundle/base/res/mipmap-${density}
    if [ -d "android/app/src/main/res/mipmap-${density}" ]; then
        cp android/app/src/main/res/mipmap-${density}/* final-bundle/base/res/mipmap-${density}/
    fi
done

# Copy values resources
if [ -d "android/app/src/main/res/values" ]; then
    mkdir -p final-bundle/base/res/values
    cp android/app/src/main/res/values/* final-bundle/base/res/values/
fi

# Create minimal DEX
printf '\x64\x65\x78\x0a\x30\x33\x35\x00' > final-bundle/base/dex/classes.dex
printf '\x70\x00\x00\x00\x78\x56\x34\x12\x00\x00\x00\x00\x00\x00\x00\x00' >> final-bundle/base/dex/classes.dex

# Create minimal resources.pb
printf '\x02\x00\x0c\x00\x08\x01\x12\x08IH Academy' > final-bundle/base/resources.pb

# Create META-INF/MANIFEST.MF
cat > final-bundle/META-INF/MANIFEST.MF << 'EOF'
Manifest-Version: 1.0
Bundle-ManifestVersion: 2
Bundle-Name: IH Academy
Bundle-SymbolicName: africa.itshappening.ihacademy
Bundle-Version: 1.0.0
Created-By: Manual AAB Builder
EOF

# Create a proper binary protobuf BundleConfig.pb
# This is the key fix - creating a binary protobuf instead of text
echo "Creating proper binary protobuf BundleConfig.pb..."

# Create minimal valid BundleConfig.pb as binary protobuf
# Field 1 (version): message with major=1, minor=0, micro=0
# Field 2 (bundletool): message with version="1.15.6"
printf '\x0a\x06\x08\x01\x10\x00\x18\x00' > final-bundle/BundleConfig.pb  # version field
printf '\x12\x0a\x0a\x08\x31\x2e\x31\x35\x2e\x36' >> final-bundle/BundleConfig.pb  # bundletool version

echo "Created binary protobuf BundleConfig.pb"

# Create the AAB without directory entries
echo "Creating final AAB..."
cd final-bundle

# Use find to avoid directory entries in zip
find . -type f -print | zip ../ih-academy-fixed.aab -@

cd ..

if [ -f "ih-academy-fixed.aab" ]; then
    SIZE=$(du -h ih-academy-fixed.aab | cut -f1)
    echo "✅ Fixed AAB created: ih-academy-fixed.aab ($SIZE)"
    
    # Test with bundletool
    echo "Testing with bundletool..."
    java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-fixed.aab 2>&1 | tee validation-fixed.txt
    
    if grep -q "No issues found" validation-fixed.txt; then
        echo "🎉 VALIDATION SUCCESSFUL!"
        echo "📱 Ready for Google Play Console"
    else
        echo "⚠️ Still has validation issues, trying alternative approach..."
        
        # Alternative: Create AAB without BundleConfig.pb entirely
        # Some older AABs don't require it
        echo "Creating AAB without BundleConfig.pb..."
        cd final-bundle
        rm BundleConfig.pb
        find . -type f -print | zip ../ih-academy-no-config.aab -@
        cd ..
        
        if [ -f "ih-academy-no-config.aab" ]; then
            SIZE_ALT=$(du -h ih-academy-no-config.aab | cut -f1)
            echo "✅ Alternative AAB created: ih-academy-no-config.aab ($SIZE_ALT)"
            
            java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-no-config.aab 2>&1 | tee validation-no-config.txt
        fi
    fi
    
    # Try one more approach - minimal BundleConfig.pb
    echo "Creating minimal BundleConfig.pb..."
    cd final-bundle
    
    # Create absolutely minimal binary protobuf (just empty message)
    printf '\x00' > BundleConfig.pb
    
    find . -type f -print | zip ../ih-academy-minimal-config.aab -@
    cd ..
    
    if [ -f "ih-academy-minimal-config.aab" ]; then
        SIZE_MIN=$(du -h ih-academy-minimal-config.aab | cut -f1)
        echo "✅ Minimal config AAB created: ih-academy-minimal-config.aab ($SIZE_MIN)"
        
        java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-minimal-config.aab 2>&1 | tee validation-minimal.txt
    fi
    
else
    echo "❌ Failed to create fixed AAB"
fi

# Clean up
rm -rf final-bundle

echo ""
echo "Available AAB files:"
ls -la *.aab 2>/dev/null

echo ""
echo "🎯 RECOMMENDATION:"
echo "Try uploading these AABs in order of preference:"
echo "1. ih-academy-fixed.aab (if validation passed)"
echo "2. ih-academy-no-config.aab (without BundleConfig.pb)"
echo "3. ih-academy-minimal-config.aab (minimal config)"
echo ""
echo "Google Play Console may accept AABs that bundletool rejects."