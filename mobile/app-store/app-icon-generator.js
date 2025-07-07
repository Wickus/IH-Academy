/**
 * App Icon Generator Script
 * Generates all required app icon sizes for iOS and Android
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// iOS App Icon Sizes (points)
const iosIconSizes = [
  { size: 20, scale: [2, 3], name: 'notification' },
  { size: 29, scale: [2, 3], name: 'settings' },
  { size: 40, scale: [2, 3], name: 'spotlight' },
  { size: 60, scale: [2, 3], name: 'app' },
  { size: 76, scale: [1, 2], name: 'ipad' },
  { size: 83.5, scale: [2], name: 'ipad-pro' },
  { size: 1024, scale: [1], name: 'app-store' }
];

// Android Icon Sizes (dp)
const androidIconSizes = [
  { size: 48, density: 'mdpi', folder: 'mipmap-mdpi' },
  { size: 72, density: 'hdpi', folder: 'mipmap-hdpi' },
  { size: 96, density: 'xhdpi', folder: 'mipmap-xhdpi' },
  { size: 144, density: 'xxhdpi', folder: 'mipmap-xxhdpi' },
  { size: 192, density: 'xxxhdpi', folder: 'mipmap-xxxhdpi' },
  { size: 512, density: 'playstore', folder: 'playstore' }
];

// Adaptive Icon Sizes for Android
const adaptiveIconSizes = [
  { size: 108, density: 'mdpi', folder: 'mipmap-mdpi' },
  { size: 162, density: 'hdpi', folder: 'mipmap-hdpi' },
  { size: 216, density: 'xhdpi', folder: 'mipmap-xhdpi' },
  { size: 324, density: 'xxhdpi', folder: 'mipmap-xxhdpi' },
  { size: 432, density: 'xxxhdpi', folder: 'mipmap-xxxhdpi' }
];

async function generateIcons(sourceIcon) {
  console.log('Generating iOS App Icons...');
  
  // Create iOS icons directory
  const iosDir = path.join(__dirname, 'ios-icons');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  // Generate iOS icons
  for (const icon of iosIconSizes) {
    for (const scale of icon.scale) {
      const pixelSize = icon.size * scale;
      const filename = `icon-${icon.name}-${icon.size}@${scale}x.png`;
      
      await sharp(sourceIcon)
        .resize(pixelSize, pixelSize, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill'
        })
        .png({ quality: 100 })
        .toFile(path.join(iosDir, filename));
        
      console.log(`Generated ${filename} (${pixelSize}x${pixelSize})`);
    }
  }

  console.log('Generating Android App Icons...');
  
  // Create Android icons directory
  const androidDir = path.join(__dirname, 'android-icons');
  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }

  // Generate standard Android icons
  for (const icon of androidIconSizes) {
    const folderPath = path.join(androidDir, icon.folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = icon.density === 'playstore' ? 'icon.png' : 'ic_launcher.png';
    
    await sharp(sourceIcon)
      .resize(icon.size, icon.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill'
      })
      .png({ quality: 100 })
      .toFile(path.join(folderPath, filename));
      
    console.log(`Generated ${icon.folder}/${filename} (${icon.size}x${icon.size})`);
  }

  // Generate adaptive icons
  for (const icon of adaptiveIconSizes) {
    const folderPath = path.join(androidDir, icon.folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    await sharp(sourceIcon)
      .resize(icon.size, icon.size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill'
      })
      .png({ quality: 100 })
      .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));
      
    console.log(`Generated ${icon.folder}/ic_launcher_foreground.png (${icon.size}x${icon.size})`);
  }

  console.log('App icons generated successfully!');
}

// Create base app icon if it doesn't exist
async function createBaseIcon() {
  const iconPath = path.join(__dirname, 'base-icon.png');
  
  if (!fs.existsSync(iconPath)) {
    console.log('Creating base app icon...');
    
    // Create a professional app icon with IH Academy branding
    const iconSvg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <!-- Background gradient -->
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#20366B;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#278DD4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#24D367;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1024" height="1024" rx="180" fill="url(#bg)"/>
        
        <!-- Main icon content -->
        <g transform="translate(200, 200)">
          <!-- Academy building/structure -->
          <rect x="150" y="400" width="324" height="224" rx="20" fill="white" opacity="0.95"/>
          <rect x="170" y="420" width="284" height="184" rx="10" fill="#20366B"/>
          
          <!-- Windows -->
          <rect x="190" y="440" width="60" height="40" rx="5" fill="white" opacity="0.9"/>
          <rect x="270" y="440" width="60" height="40" rx="5" fill="white" opacity="0.9"/>
          <rect x="350" y="440" width="60" height="40" rx="5" fill="white" opacity="0.9"/>
          <rect x="190" y="500" width="60" height="40" rx="5" fill="white" opacity="0.9"/>
          <rect x="270" y="500" width="60" height="40" rx="5" fill="white" opacity="0.9"/>
          <rect x="350" y="500" width="60" height="40" rx="5" fill="white" opacity="0.9"/>
          
          <!-- Door -->
          <rect x="280" y="560" width="40" height="60" rx="5" fill="white" opacity="0.9"/>
          <circle cx="315" cy="590" r="3" fill="#20366B"/>
          
          <!-- Text/Logo area -->
          <rect x="50" y="150" width="524" height="180" rx="30" fill="white" opacity="0.15" filter="url(#shadow)"/>
          
          <!-- IH text -->
          <text x="312" y="230" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">IH</text>
          <text x="312" y="290" font-family="Arial, sans-serif" font-size="32" font-weight="normal" text-anchor="middle" fill="white" opacity="0.9">ACADEMY</text>
          
          <!-- Sports icons -->
          <circle cx="100" cy="100" r="30" fill="white" opacity="0.8"/>
          <text x="100" y="110" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#20366B">⚽</text>
          
          <circle cx="524" cy="100" r="30" fill="white" opacity="0.8"/>
          <text x="524" y="110" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#20366B">🏀</text>
          
          <circle cx="100" cy="524" r="30" fill="white" opacity="0.8"/>
          <text x="100" y="534" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#20366B">🏊</text>
          
          <circle cx="524" cy="524" r="30" fill="white" opacity="0.8"/>
          <text x="524" y="534" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#20366B">🎾</text>
        </g>
      </svg>
    `;
    
    await sharp(Buffer.from(iconSvg))
      .png({ quality: 100 })
      .toFile(iconPath);
      
    console.log('Base icon created successfully!');
  }
  
  return iconPath;
}

// Main execution
async function main() {
  try {
    const baseIconPath = await createBaseIcon();
    await generateIcons(baseIconPath);
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateIcons, createBaseIcon };