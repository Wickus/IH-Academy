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
        <!-- Background and definitions -->
        <defs>
          <!-- Primary gradient background -->
          <linearGradient id="primaryBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#20366B;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#278DD4;stop-opacity:1" />
          </linearGradient>
          
          <!-- Accent gradient for elements -->
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#278DD4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#24D367;stop-opacity:1" />
          </linearGradient>
          
          <!-- Shadow filter -->
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
          </filter>
          
          <!-- Inner shadow for depth -->
          <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offset"/>
            <feFlood flood-color="#ffffff" flood-opacity="0.3"/>
            <feComposite in2="offset" operator="in"/>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        <!-- Main background with rounded corners -->
        <rect width="1024" height="1024" rx="200" fill="url(#primaryBg)"/>
        
        <!-- Central content area -->
        <g transform="translate(512, 512)">
          <!-- Main logo circle background -->
          <circle cx="0" cy="0" r="360" fill="white" opacity="0.12" filter="url(#shadow)"/>
          <circle cx="0" cy="0" r="320" fill="white" opacity="0.18"/>
          
          <!-- IH monogram container -->
          <rect x="-200" y="-120" width="400" height="160" rx="25" fill="white" opacity="0.95" filter="url(#shadow)"/>
          
          <!-- IH Letters with professional typography -->
          <text x="-60" y="20" font-family="Arial, sans-serif" font-size="120" font-weight="800" text-anchor="middle" fill="#20366B">I</text>
          <text x="60" y="20" font-family="Arial, sans-serif" font-size="120" font-weight="800" text-anchor="middle" fill="#20366B">H</text>
          
          <!-- Academy text -->
          <text x="0" y="80" font-family="Arial, sans-serif" font-size="28" font-weight="600" text-anchor="middle" fill="#278DD4" letter-spacing="4px">ACADEMY</text>
          
          <!-- Decorative elements - sports icons in circles -->
          <g opacity="0.9">
            <!-- Top left - Soccer -->
            <circle cx="-200" cy="-200" r="45" fill="url(#accentGradient)" filter="url(#shadow)"/>
            <circle cx="-200" cy="-200" r="25" fill="white"/>
            <text x="-200" y="-190" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" fill="#20366B">⚽</text>
            
            <!-- Top right - Basketball -->
            <circle cx="200" cy="-200" r="45" fill="url(#accentGradient)" filter="url(#shadow)"/>
            <circle cx="200" cy="-200" r="25" fill="white"/>
            <text x="200" y="-190" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" fill="#20366B">🏀</text>
            
            <!-- Bottom left - Swimming -->
            <circle cx="-200" cy="200" r="45" fill="url(#accentGradient)" filter="url(#shadow)"/>
            <circle cx="-200" cy="200" r="25" fill="white"/>
            <text x="-200" y="210" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" fill="#20366B">🏊</text>
            
            <!-- Bottom right - Tennis -->
            <circle cx="200" cy="200" r="45" fill="url(#accentGradient)" filter="url(#shadow)"/>
            <circle cx="200" cy="200" r="25" fill="white"/>
            <text x="200" y="210" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" fill="#20366B">🎾</text>
          </g>
          
          <!-- Connecting lines for visual balance -->
          <g opacity="0.3" stroke="#24D367" stroke-width="3" fill="none">
            <line x1="-155" y1="-155" x2="-50" y2="-50"/>
            <line x1="155" y1="-155" x2="50" y2="-50"/>
            <line x1="-155" y1="155" x2="-50" y2="50"/>
            <line x1="155" y1="155" x2="50" y2="50"/>
          </g>
          
          <!-- Central highlight for depth -->
          <ellipse cx="0" cy="-20" rx="180" ry="60" fill="white" opacity="0.15" filter="url(#innerShadow)"/>
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