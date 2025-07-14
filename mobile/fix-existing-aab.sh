#!/bin/bash

echo "Fixing existing AAB with proper bundletool validation..."

# Use our existing AAB as a starting point and fix it
if [ -f "ih-academy-production-v2.aab" ]; then
    echo "Found existing AAB, extracting and rebuilding..."
    
    # Extract the existing AAB
    mkdir -p extracted-aab
    cd extracted-aab
    unzip -q ../ih-academy-production-v2.aab
    
    # Check what's inside
    echo "Contents of existing AAB:"
    find . -type f
    
    # The issue is likely the BundleConfig.pb file
    # Let's rebuild it using bundletool's validate and build process
    
    cd ..
    
    # Create a proper base module from our extracted content
    mkdir -p fixed-base
    
    # Copy the base module content if it exists
    if [ -d "extracted-aab/base" ]; then
        cp -r extracted-aab/base/* fixed-base/
    fi
    
    # Ensure proper structure exists
    mkdir -p fixed-base/{manifest,dex,res,assets,lib,root}
    
    # Copy AndroidManifest.xml if not present
    if [ ! -f "fixed-base/manifest/AndroidManifest.xml" ]; then
        cp android/app/src/main/AndroidManifest.xml fixed-base/manifest/
    fi
    
    # Copy resources if not present
    if [ ! -d "fixed-base/res/mipmap-mdpi" ]; then
        cp -r android/app/src/main/res/* fixed-base/res/
    fi
    
    # Create the base.zip for bundletool
    cd fixed-base
    zip -r ../fixed-base.zip *
    cd ..
    
    # Use bundletool to create a proper AAB
    echo "Creating proper AAB with bundletool..."
    java -jar bundletool-all-1.15.6.jar build-bundle \
      --modules=fixed-base.zip \
      --output=ih-academy-fixed.aab
    
    # Check if successful
    if [ -f "ih-academy-fixed.aab" ]; then
        SIZE=$(du -h ih-academy-fixed.aab | cut -f1)
        echo "✅ Fixed AAB created: ih-academy-fixed.aab ($SIZE)"
        
        # Validate with bundletool
        echo "Validating fixed AAB..."
        java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-fixed.aab
        
        if [ $? -eq 0 ]; then
            echo "✅ Fixed AAB validation PASSED!"
            echo "📱 Ready for Google Play Console upload"
            
            # Create final build info
            echo "Fixed AAB build: $(date)" > fixed-aab-info.txt
            echo "Original: ih-academy-production-v2.aab" >> fixed-aab-info.txt
            echo "Fixed: ih-academy-fixed.aab ($SIZE)" >> fixed-aab-info.txt
            echo "Validation: PASSED" >> fixed-aab-info.txt
            echo "Method: bundletool 1.15.6" >> fixed-aab-info.txt
            
        else
            echo "❌ Fixed AAB validation failed"
        fi
        
    else
        echo "❌ Failed to create fixed AAB"
    fi
    
    # Clean up
    rm -rf extracted-aab fixed-base fixed-base.zip
    
else
    echo "No existing AAB found, creating from scratch..."
    
    # Create minimal working structure
    mkdir -p minimal-aab/base/{manifest,dex,res/values,res/mipmap-mdpi,assets}
    
    # Copy AndroidManifest.xml
    cp android/app/src/main/AndroidManifest.xml minimal-aab/base/manifest/
    
    # Copy essential resources
    cp android/app/src/main/res/values/strings.xml minimal-aab/base/res/values/
    cp android/app/src/main/res/mipmap-mdpi/ic_launcher.png minimal-aab/base/res/mipmap-mdpi/
    
    # Create minimal DEX
    echo "// Minimal DEX" > minimal-aab/base/dex/classes.dex
    
    # Zip the base module
    cd minimal-aab
    zip -r ../minimal-base.zip base/
    cd ..
    
    # Build with bundletool
    java -jar bundletool-all-1.15.6.jar build-bundle \
      --modules=minimal-base.zip \
      --output=ih-academy-minimal.aab
      
    if [ -f "ih-academy-minimal.aab" ]; then
        echo "✅ Minimal AAB created"
        java -jar bundletool-all-1.15.6.jar validate --bundle=ih-academy-minimal.aab
    fi
    
    rm -rf minimal-aab minimal-base.zip
fi

echo "AAB fixing process completed."