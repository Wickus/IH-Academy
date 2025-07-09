#!/usr/bin/env python3
import zipfile
import os

def create_valid_aab():
    print("🚀 Creating AAB with valid BundleConfig.pb...")
    
    # Create the minimal valid BundleConfig.pb
    bundle_config = bytes([
        # Field 1: bundletool_version (string) = "1.15.4"
        0x0a, 0x06,
        0x31, 0x2e, 0x31, 0x35, 0x2e, 0x34
    ])
    
    # Write the corrected config
    with open('complete-aab/BundleConfig.pb', 'wb') as f:
        f.write(bundle_config)
    
    print(f"✅ Created valid BundleConfig.pb ({len(bundle_config)} bytes)")
    
    # Remove old AAB
    if os.path.exists('ih-academy-v1.0.0.aab'):
        os.remove('ih-academy-v1.0.0.aab')
    
    # Create new AAB with fixed config
    with zipfile.ZipFile('ih-academy-v1.0.0.aab', 'w', zipfile.ZIP_DEFLATED) as aab_file:
        for root, dirs, files in os.walk('complete-aab'):
            for file in files:
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, 'complete-aab')
                aab_file.write(file_path, arc_path)
                if 'BundleConfig.pb' in file:
                    print(f"  ✅ Added fixed: {arc_path}")
                elif file.endswith('.png'):
                    print(f"  🎨 Added icon: {arc_path}")
                elif file.endswith('.xml'):
                    print(f"  📄 Added resource: {arc_path}")
    
    # Verify the file
    file_size = os.path.getsize('ih-academy-v1.0.0.aab')
    print(f"\n✅ Fixed AAB created successfully!")
    print(f"📱 File: ih-academy-v1.0.0.aab")
    print(f"📊 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    # Verify BundleConfig.pb in the ZIP
    with zipfile.ZipFile('ih-academy-v1.0.0.aab', 'r') as aab_file:
        config_data = aab_file.read('BundleConfig.pb')
        print(f"🔍 BundleConfig.pb size in AAB: {len(config_data)} bytes")
        print(f"🔍 BundleConfig.pb hex: {config_data.hex()}")
    
    return True

if __name__ == "__main__":
    create_valid_aab()