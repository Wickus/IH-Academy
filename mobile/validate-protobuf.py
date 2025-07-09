#!/usr/bin/env python3
import zipfile

def validate_protobuf_manually(aab_file):
    """Manually validate protobuf structure"""
    print(f"🔍 Validating protobuf in {aab_file}...")
    
    try:
        with zipfile.ZipFile(aab_file, 'r') as z:
            config = z.read('BundleConfig.pb')
            
        print(f"📊 File size: {len(config)} bytes")
        print(f"📊 Hex data: {config.hex()}")
        
        # Manual protobuf parsing
        if len(config) < 2:
            print("❌ Config too short")
            return False
            
        # Check first field (should be bundletool version)
        tag_byte = config[0]
        field_num = tag_byte >> 3
        wire_type = tag_byte & 0x07
        
        print(f"📊 First field: number={field_num}, wire_type={wire_type}")
        
        if field_num != 1:
            print("❌ First field should be field 1 (bundletool_version)")
            return False
            
        if wire_type != 2:
            print("❌ First field should be length-delimited (wire type 2)")
            return False
            
        # Check length
        if len(config) < 2:
            print("❌ Missing length byte")
            return False
            
        length = config[1]
        print(f"📊 String length: {length}")
        
        if len(config) < 2 + length:
            print("❌ Config shorter than declared string length")
            return False
            
        # Extract version string
        version_bytes = config[2:2+length]
        version_string = version_bytes.decode('utf-8')
        print(f"📊 Version string: '{version_string}'")
        
        # Check for valid version format
        if not version_string.replace('.', '').isdigit():
            print("❌ Invalid version format")
            return False
            
        # Check remaining bytes
        remaining = config[2+length:]
        if remaining:
            print(f"📊 Additional data: {len(remaining)} bytes - {remaining.hex()}")
            
            # If there's additional data, validate it
            pos = 2 + length
            while pos < len(config):
                if pos >= len(config):
                    break
                    
                tag_byte = config[pos]
                field_num = tag_byte >> 3
                wire_type = tag_byte & 0x07
                print(f"📊 Additional field: number={field_num}, wire_type={wire_type}")
                
                pos += 1
                
                if wire_type == 2:  # Length-delimited
                    if pos >= len(config):
                        print("❌ Missing length for additional field")
                        return False
                    field_length = config[pos]
                    pos += 1 + field_length
                elif wire_type == 0:  # Varint
                    # Skip varint (simplified)
                    pos += 1
                else:
                    print(f"❌ Unsupported wire type: {wire_type}")
                    return False
        
        print("✅ Protobuf structure appears valid")
        return True
        
    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False

def main():
    """Validate all AAB files"""
    aab_files = [
        "ih-academy-ultra-minimal.aab",
        "ih-academy-android-studio.aab", 
        "ih-academy-unity.aab",
        "ih-academy-proper.aab"
    ]
    
    print("Validating BundleConfig.pb in all AAB files...")
    print("=" * 60)
    
    for aab_file in aab_files:
        if os.path.exists(aab_file):
            validate_protobuf_manually(aab_file)
        else:
            print(f"❌ File not found: {aab_file}")
        print("-" * 40)

if __name__ == "__main__":
    import os
    main()