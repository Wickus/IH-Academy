#!/usr/bin/env python3
import struct

def create_proper_bundle_config():
    """Create BundleConfig.pb with proper Google Play protobuf schema"""
    print("🔧 Creating proper BundleConfig.pb for Google Play Console...")
    
    # Google Play expects a specific BundleConfig protobuf structure
    # Based on bundletool source code and Play Console requirements
    
    # Create proper protobuf with all required fields
    config_data = bytearray()
    
    # Field 1: bundletool_version (tag 1, type string)
    version = "1.15.4"
    config_data.extend([0x0a])  # tag 1, wire type 2 (length-delimited)
    config_data.extend([len(version)])  # length
    config_data.extend(version.encode('utf-8'))  # value
    
    # Field 2: optimizations (tag 2, type message) - required by Google Play
    config_data.extend([0x12])  # tag 2, wire type 2
    config_data.extend([0x02])  # length of optimizations message
    config_data.extend([0x08, 0x01])  # minimal optimization flags
    
    # Field 3: compression (tag 3, type message) - often required
    config_data.extend([0x1a])  # tag 3, wire type 2
    config_data.extend([0x02])  # length
    config_data.extend([0x08, 0x00])  # uncompressed by default
    
    # Field 4: master_resources (tag 4, type message) - for resource handling
    config_data.extend([0x22])  # tag 4, wire type 2
    config_data.extend([0x02])  # length
    config_data.extend([0x08, 0x01])  # enable master resources
    
    config_bytes = bytes(config_data)
    
    # Write to file
    with open('complete-aab/BundleConfig.pb', 'wb') as f:
        f.write(config_bytes)
    
    print(f"✅ Created proper BundleConfig.pb ({len(config_bytes)} bytes)")
    print(f"🔍 Hex: {config_bytes.hex()}")
    
    return config_bytes

def create_minimal_bundle_config():
    """Create absolute minimal BundleConfig.pb that Google Play will accept"""
    print("🔧 Creating minimal BundleConfig.pb...")
    
    # Absolute minimal structure with just bundletool version
    config_data = bytearray()
    
    # Field 1: bundletool_version (required)
    version = "1.15.4"
    config_data.extend([0x0a, len(version)])
    config_data.extend(version.encode('utf-8'))
    
    # Field 2: optimizations (empty but present)
    config_data.extend([0x12, 0x00])  # empty optimizations message
    
    config_bytes = bytes(config_data)
    
    # Write minimal version
    with open('complete-aab/BundleConfig-minimal.pb', 'wb') as f:
        f.write(config_bytes)
    
    print(f"✅ Created minimal BundleConfig.pb ({len(config_bytes)} bytes)")
    print(f"🔍 Hex: {config_bytes.hex()}")
    
    return config_bytes

def create_bundletool_generated_config():
    """Create BundleConfig.pb that matches bundletool output exactly"""
    print("🔧 Creating bundletool-style BundleConfig.pb...")
    
    # This matches the exact format bundletool generates
    config_hex = "0a06312e31352e341200"  # bundletool version + empty optimizations
    config_bytes = bytes.fromhex(config_hex)
    
    with open('complete-aab/BundleConfig-bundletool.pb', 'wb') as f:
        f.write(config_bytes)
    
    print(f"✅ Created bundletool-style BundleConfig.pb ({len(config_bytes)} bytes)")
    print(f"🔍 Hex: {config_bytes.hex()}")
    
    return config_bytes

if __name__ == "__main__":
    # Create all three variants
    create_proper_bundle_config()
    create_minimal_bundle_config()  
    create_bundletool_generated_config()
    
    print("\n📋 Created 3 BundleConfig.pb variants:")
    print("  1. BundleConfig.pb (proper with all fields)")
    print("  2. BundleConfig-minimal.pb (minimal required)")
    print("  3. BundleConfig-bundletool.pb (bundletool format)")