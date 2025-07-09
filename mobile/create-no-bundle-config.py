#!/usr/bin/env python3
import zipfile
import os

def create_aab_without_bundle_config():
    """Create AAB without BundleConfig.pb - let Google Play handle it"""
    print("🚀 Creating AAB without BundleConfig.pb...")
    
    # Remove old AAB
    if os.path.exists('ih-academy-v1.0.0.aab'):
        os.remove('ih-academy-v1.0.0.aab')
    
    # Create AAB excluding BundleConfig.pb
    with zipfile.ZipFile('ih-academy-v1.0.0.aab', 'w', zipfile.ZIP_DEFLATED) as aab_file:
        for root, dirs, files in os.walk('complete-aab'):
            for file in files:
                # SKIP BundleConfig.pb completely
                if file == 'BundleConfig.pb':
                    print(f"  ⏭️  Skipping: {file}")
                    continue
                    
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, 'complete-aab')
                aab_file.write(file_path, arc_path)
                
                if file.endswith('.png'):
                    print(f"  🎨 Added icon: {arc_path}")
                elif file.endswith('.xml'):
                    print(f"  📄 Added resource: {arc_path}")
                elif 'MANIFEST' in file:
                    print(f"  📋 Added manifest: {arc_path}")
                elif file.endswith('.dex'):
                    print(f"  💾 Added dex: {arc_path}")
    
    # Verify the file
    file_size = os.path.getsize('ih-academy-v1.0.0.aab')
    print(f"\n✅ AAB created without BundleConfig.pb!")
    print(f"📱 File: ih-academy-v1.0.0.aab")
    print(f"📊 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    # List contents
    with zipfile.ZipFile('ih-academy-v1.0.0.aab', 'r') as aab_file:
        files = aab_file.namelist()
        print(f"📋 Contents: {len(files)} files")
        if 'BundleConfig.pb' in files:
            print("❌ BundleConfig.pb still present")
        else:
            print("✅ BundleConfig.pb successfully excluded")
    
    return True

if __name__ == "__main__":
    create_aab_without_bundle_config()