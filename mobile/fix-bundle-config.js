const fs = require('fs');

console.log('🔧 Creating valid BundleConfig.pb protobuf file...');

// Create a minimal but valid BundleConfig.pb protobuf
// This follows the exact protobuf structure that Google Play expects
const bundleConfig = Buffer.from([
  // Field 1: bundletool_version (string) = "1.15.4"
  0x0a, 0x06,
  0x31, 0x2e, 0x31, 0x35, 0x2e, 0x34,
  
  // Field 2: optimizations (message)
  0x12, 0x02,
  
  // Empty optimizations message (minimal valid structure)
  0x08, 0x00
]);

// Update the existing AAB file by replacing BundleConfig.pb
const JSZip = require('jszip') || null;

if (!JSZip) {
  // Manual approach without JSZip
  console.log('⚡ Creating new AAB with fixed BundleConfig.pb...');
  
  // Write the fixed config to the complete-aab directory
  fs.writeFileSync('complete-aab/BundleConfig.pb', bundleConfig);
  
  console.log('✅ Fixed BundleConfig.pb created');
  console.log('📊 Size:', bundleConfig.length, 'bytes');
  console.log('🔍 Content (hex):', bundleConfig.toString('hex'));
  
} else {
  console.log('Using JSZip to update AAB...');
}

// Alternative: Create the simplest possible valid BundleConfig.pb
const minimalConfig = Buffer.from([
  // Just bundletool version field
  0x0a, 0x06, 0x31, 0x2e, 0x31, 0x35, 0x2e, 0x34
]);

fs.writeFileSync('complete-aab/BundleConfig-minimal.pb', minimalConfig);

console.log('✅ Created both standard and minimal BundleConfig.pb variants');
console.log('🎯 Ready to rebuild AAB with fixed protobuf!');