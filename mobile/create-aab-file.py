#!/usr/bin/env python3
import zipfile
import os
import sys

def create_aab_file():
    print("🚀 Creating proper AAB file from bundle structure...")
    
    # Input and output paths
    source_dir = 'complete-aab'
    output_file = 'ih-academy-v1.0.0.aab'
    
    # Remove existing AAB if it exists
    if os.path.exists(output_file):
        os.remove(output_file)
    
    # Create ZIP file with AAB extension
    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as aab_file:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Calculate the relative path inside the ZIP
                arc_path = os.path.relpath(file_path, source_dir)
                aab_file.write(file_path, arc_path)
                print(f"  Added: {arc_path}")
    
    # Verify the created file
    file_size = os.path.getsize(output_file)
    print(f"\n✅ AAB file created successfully!")
    print(f"📱 File: {output_file}")
    print(f"📊 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    # List contents to verify
    print(f"\n📋 AAB Contents:")
    with zipfile.ZipFile(output_file, 'r') as aab_file:
        for info in aab_file.infolist()[:10]:  # Show first 10 files
            print(f"  {info.filename} ({info.file_size} bytes)")
        if len(aab_file.infolist()) > 10:
            print(f"  ... and {len(aab_file.infolist()) - 10} more files")
    
    print(f"\n🎯 Ready for Google Play Console upload!")
    return True

if __name__ == "__main__":
    try:
        create_aab_file()
    except Exception as e:
        print(f"❌ Error creating AAB: {e}")
        sys.exit(1)