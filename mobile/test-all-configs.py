#!/usr/bin/env python3
import zipfile
import os

def create_aab_with_config(config_name, output_name):
    """Create AAB with specific BundleConfig.pb variant"""
    print(f"🚀 Creating {output_name} with {config_name}...")
    
    # Copy the config file to standard name
    config_source = f"complete-aab/BundleConfig-{config_name}.pb"
    config_target = "complete-aab/BundleConfig.pb"
    
    if os.path.exists(config_source):
        with open(config_source, 'rb') as src:
            with open(config_target, 'wb') as dst:
                dst.write(src.read())
        print(f"  ✅ Using {config_name} config")
    else:
        print(f"  ❌ Config {config_name} not found")
        return None
    
    # Remove old AAB
    if os.path.exists(output_name):
        os.remove(output_name)
    
    # Create new AAB
    with zipfile.ZipFile(output_name, 'w', zipfile.ZIP_DEFLATED) as aab_file:
        for root, dirs, files in os.walk('complete-aab'):
            for file in files:
                # Skip variant configs
                if file.startswith('BundleConfig-'):
                    continue
                    
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, 'complete-aab')
                aab_file.write(file_path, arc_path)
    
    # Verify
    file_size = os.path.getsize(output_name)
    print(f"  ✅ Created {output_name} ({file_size:,} bytes)")
    
    # Verify BundleConfig.pb
    with zipfile.ZipFile(output_name, 'r') as aab_file:
        config_data = aab_file.read('BundleConfig.pb')
        print(f"  🔍 BundleConfig.pb: {len(config_data)} bytes, hex: {config_data.hex()}")
    
    return output_name

def main():
    """Create all AAB variants for testing"""
    variants = [
        ("ultra-minimal", "ih-academy-ultra-minimal.aab"),
        ("android-studio", "ih-academy-android-studio.aab"), 
        ("unity", "ih-academy-unity.aab")
    ]
    
    print("Creating AAB files with different BundleConfig.pb variants...")
    print("=" * 60)
    
    for config_name, output_name in variants:
        create_aab_with_config(config_name, output_name)
        print("-" * 40)
    
    print("\n📋 Created AAB variants:")
    for _, output_name in variants:
        if os.path.exists(output_name):
            size = os.path.getsize(output_name)
            print(f"  ✅ {output_name} ({size:,} bytes)")
    
    print(f"\n🎯 Try uploading in this order:")
    print(f"  1. ih-academy-ultra-minimal.aab (most basic)")
    print(f"  2. ih-academy-android-studio.aab (standard)")
    print(f"  3. ih-academy-unity.aab (with optimizations)")

if __name__ == "__main__":
    main()