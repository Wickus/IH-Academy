#!/usr/bin/env python3
import zipfile
import os

def rebuild_aab_with_config(config_type="proper"):
    """Rebuild AAB with specific BundleConfig.pb variant"""
    
    config_files = {
        "proper": "BundleConfig.pb",
        "minimal": "BundleConfig-minimal.pb", 
        "bundletool": "BundleConfig-bundletool.pb"
    }
    
    config_file = config_files.get(config_type, "BundleConfig.pb")
    output_file = f"ih-academy-{config_type}.aab"
    
    print(f"🚀 Building AAB with {config_file}...")
    
    # Remove old AAB
    if os.path.exists(output_file):
        os.remove(output_file)
    
    # Copy the selected config to the standard name
    if config_file != "BundleConfig.pb":
        source_config = f"complete-aab/{config_file}"
        target_config = "complete-aab/BundleConfig.pb"
        if os.path.exists(source_config):
            with open(source_config, 'rb') as src:
                with open(target_config, 'wb') as dst:
                    dst.write(src.read())
            print(f"  ✅ Using {config_file} as BundleConfig.pb")
    
    # Create AAB with all components
    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as aab_file:
        for root, dirs, files in os.walk('complete-aab'):
            for file in files:
                # Skip the variant config files, only include BundleConfig.pb
                if file.startswith('BundleConfig-'):
                    continue
                    
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, 'complete-aab')
                aab_file.write(file_path, arc_path)
                
                if file == 'BundleConfig.pb':
                    print(f"  ✅ Added: {arc_path}")
                elif file.endswith('.png'):
                    print(f"  🎨 Added: {arc_path}")
                elif 'manifest' in file.lower():
                    print(f"  📄 Added: {arc_path}")
    
    # Verify the file
    file_size = os.path.getsize(output_file)
    print(f"\n✅ AAB created: {output_file}")
    print(f"📊 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    # Verify BundleConfig.pb content
    with zipfile.ZipFile(output_file, 'r') as aab_file:
        config_data = aab_file.read('BundleConfig.pb')
        print(f"🔍 BundleConfig.pb: {len(config_data)} bytes")
        print(f"🔍 Hex: {config_data.hex()}")
    
    return output_file

if __name__ == "__main__":
    # Create all three AAB variants
    for config_type in ["proper", "minimal", "bundletool"]:
        rebuild_aab_with_config(config_type)
        print("-" * 50)