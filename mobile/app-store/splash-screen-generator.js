/**
 * Splash Screen Generator Script
 * Generates splash screens for iOS and Android in all required sizes
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// iOS Launch Screen Sizes
const iosLaunchScreens = [
  // iPhone
  { width: 640, height: 960, name: 'iphone4' },
  { width: 640, height: 1136, name: 'iphone5' },
  { width: 750, height: 1334, name: 'iphone6' },
  { width: 1242, height: 2208, name: 'iphone6plus' },
  { width: 828, height: 1792, name: 'iphoneXR' },
  { width: 1125, height: 2436, name: 'iphoneX' },
  { width: 1242, height: 2688, name: 'iphoneXSMax' },
  { width: 1170, height: 2532, name: 'iphone12' },
  { width: 1284, height: 2778, name: 'iphone12ProMax' },
  
  // iPad
  { width: 1536, height: 2048, name: 'ipad' },
  { width: 1668, height: 2224, name: 'ipadPro10' },
  { width: 1668, height: 2388, name: 'ipadPro11' },
  { width: 2048, height: 2732, name: 'ipadPro12' }
];

// Android Splash Screen Sizes
const androidSplashScreens = [
  { width: 320, height: 480, density: 'mdpi', folder: 'drawable-mdpi' },
  { width: 480, height: 720, density: 'hdpi', folder: 'drawable-hdpi' },
  { width: 640, height: 960, density: 'xhdpi', folder: 'drawable-xhdpi' },
  { width: 960, height: 1440, density: 'xxhdpi', folder: 'drawable-xxhdpi' },
  { width: 1280, height: 1920, density: 'xxxhdpi', folder: 'drawable-xxxhdpi' }
];

async function generateSplashScreens() {
  console.log('Generating iOS Launch Screens...');
  
  // Create iOS splash screens directory
  const iosDir = path.join(__dirname, 'ios-splash');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  // Generate iOS splash screens
  for (const screen of iosLaunchScreens) {
    const splashSvg = createSplashSVG(screen.width, screen.height);
    const filename = `LaunchScreen-${screen.name}.png`;
    
    await sharp(Buffer.from(splashSvg))
      .png({ quality: 100 })
      .toFile(path.join(iosDir, filename));
      
    console.log(`Generated ${filename} (${screen.width}x${screen.height})`);
  }

  console.log('Generating Android Splash Screens...');
  
  // Create Android splash screens directory
  const androidDir = path.join(__dirname, 'android-splash');
  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }

  // Generate Android splash screens
  for (const screen of androidSplashScreens) {
    const folderPath = path.join(androidDir, screen.folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const splashSvg = createSplashSVG(screen.width, screen.height);
    const filename = 'launch_screen.png';
    
    await sharp(Buffer.from(splashSvg))
      .png({ quality: 100 })
      .toFile(path.join(folderPath, filename));
      
    console.log(`Generated ${screen.folder}/${filename} (${screen.width}x${screen.height})`);
  }

  console.log('Splash screens generated successfully!');
}

function createSplashSVG(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate logo size based on screen size
  const logoSize = Math.min(width, height) * 0.3;
  const logoX = centerX - (logoSize / 2);
  const logoY = centerY - (logoSize / 2);
  
  // Text size based on screen size
  const titleSize = Math.max(24, logoSize * 0.15);
  const subtitleSize = Math.max(16, logoSize * 0.08);
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background gradient -->
      <defs>
        <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#20366B;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#278DD4;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#24D367;stop-opacity:1" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#splashBg)"/>
      
      <!-- Logo container -->
      <g transform="translate(${logoX}, ${logoY})">
        <!-- Logo background circle -->
        <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize * 0.4}" fill="white" opacity="0.15" filter="url(#glow)"/>
        
        <!-- Academy building -->
        <g transform="translate(${logoSize * 0.15}, ${logoSize * 0.15})">
          <rect x="${logoSize * 0.2}" y="${logoSize * 0.45}" width="${logoSize * 0.4}" height="${logoSize * 0.25}" rx="${logoSize * 0.02}" fill="white" opacity="0.9"/>
          
          <!-- Windows -->
          <rect x="${logoSize * 0.22}" y="${logoSize * 0.48}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#20366B"/>
          <rect x="${logoSize * 0.32}" y="${logoSize * 0.48}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#20366B"/>
          <rect x="${logoSize * 0.42}" y="${logoSize * 0.48}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#20366B"/>
          <rect x="${logoSize * 0.22}" y="${logoSize * 0.56}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#20366B"/>
          <rect x="${logoSize * 0.32}" y="${logoSize * 0.56}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#20366B"/>
          <rect x="${logoSize * 0.42}" y="${logoSize * 0.56}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#20366B"/>
          
          <!-- Door -->
          <rect x="${logoSize * 0.35}" y="${logoSize * 0.62}" width="${logoSize * 0.06}" height="${logoSize * 0.08}" rx="${logoSize * 0.01}" fill="#20366B"/>
        </g>
        
        <!-- IH Text -->
        <text x="${logoSize/2}" y="${logoSize * 0.35}" font-family="Arial, sans-serif" font-size="${logoSize * 0.12}" font-weight="bold" text-anchor="middle" fill="white" filter="url(#glow)">IH</text>
      </g>
      
      <!-- Main title -->
      <text x="${centerX}" y="${centerY + logoSize * 0.35}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="bold" text-anchor="middle" fill="white" filter="url(#glow)">IH Academy</text>
      
      <!-- Subtitle -->
      <text x="${centerX}" y="${centerY + logoSize * 0.35 + titleSize * 1.5}" font-family="Arial, sans-serif" font-size="${subtitleSize}" font-weight="normal" text-anchor="middle" fill="white" opacity="0.9">Sports Academy Management</text>
      
      <!-- Loading indicator -->
      <g transform="translate(${centerX - 30}, ${height - 100})">
        <circle cx="15" cy="15" r="3" fill="white" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="30" cy="15" r="3" fill="white" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.8;0.6" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
        </circle>
        <circle cx="45" cy="15" r="3" fill="white" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
        </circle>
      </g>
      
      <!-- Footer text -->
      <text x="${centerX}" y="${height - 40}" font-family="Arial, sans-serif" font-size="${Math.max(12, subtitleSize * 0.7)}" text-anchor="middle" fill="white" opacity="0.7">Powered by ItsHappening.Africa</text>
    </svg>
  `;
}

// Generate dark mode splash screens
async function generateDarkSplashScreens() {
  console.log('Generating Dark Mode Splash Screens...');
  
  const darkDir = path.join(__dirname, 'dark-splash');
  if (!fs.existsSync(darkDir)) {
    fs.mkdirSync(darkDir, { recursive: true });
  }

  // Generate a few key sizes for dark mode
  const darkSizes = [
    { width: 1125, height: 2436, name: 'iphoneX-dark' },
    { width: 1284, height: 2778, name: 'iphone12ProMax-dark' },
    { width: 960, height: 1440, name: 'android-xxhdpi-dark' }
  ];

  for (const screen of darkSizes) {
    const darkSvg = createDarkSplashSVG(screen.width, screen.height);
    const filename = `${screen.name}.png`;
    
    await sharp(Buffer.from(darkSvg))
      .png({ quality: 100 })
      .toFile(path.join(darkDir, filename));
      
    console.log(`Generated dark mode ${filename} (${screen.width}x${screen.height})`);
  }
}

function createDarkSplashSVG(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const logoSize = Math.min(width, height) * 0.3;
  const logoX = centerX - (logoSize / 2);
  const logoY = centerY - (logoSize / 2);
  const titleSize = Math.max(24, logoSize * 0.15);
  const subtitleSize = Math.max(16, logoSize * 0.08);
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Dark background -->
      <rect width="${width}" height="${height}" fill="#1a1a1a"/>
      
      <!-- Logo with accent colors -->
      <g transform="translate(${logoX}, ${logoY})">
        <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize * 0.4}" fill="#278DD4" opacity="0.1"/>
        
        <!-- Building in accent color -->
        <g transform="translate(${logoSize * 0.15}, ${logoSize * 0.15})">
          <rect x="${logoSize * 0.2}" y="${logoSize * 0.45}" width="${logoSize * 0.4}" height="${logoSize * 0.25}" rx="${logoSize * 0.02}" fill="#278DD4" opacity="0.8"/>
          <rect x="${logoSize * 0.22}" y="${logoSize * 0.48}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#24D367"/>
          <rect x="${logoSize * 0.32}" y="${logoSize * 0.48}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#24D367"/>
          <rect x="${logoSize * 0.42}" y="${logoSize * 0.48}" width="${logoSize * 0.08}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#24D367"/>
          <rect x="${logoSize * 0.35}" y="${logoSize * 0.62}" width="${logoSize * 0.06}" height="${logoSize * 0.08}" rx="${logoSize * 0.01}" fill="#24D367"/>
        </g>
        
        <text x="${logoSize/2}" y="${logoSize * 0.35}" font-family="Arial, sans-serif" font-size="${logoSize * 0.12}" font-weight="bold" text-anchor="middle" fill="#278DD4">IH</text>
      </g>
      
      <text x="${centerX}" y="${centerY + logoSize * 0.35}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="bold" text-anchor="middle" fill="#ffffff">IH Academy</text>
      <text x="${centerX}" y="${centerY + logoSize * 0.35 + titleSize * 1.5}" font-family="Arial, sans-serif" font-size="${subtitleSize}" font-weight="normal" text-anchor="middle" fill="#cccccc">Sports Academy Management</text>
      
      <!-- Loading indicator in accent color -->
      <g transform="translate(${centerX - 30}, ${height - 100})">
        <circle cx="15" cy="15" r="3" fill="#278DD4">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="30" cy="15" r="3" fill="#24D367">
          <animate attributeName="opacity" values="0.6;0.8;0.6" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
        </circle>
        <circle cx="45" cy="15" r="3" fill="#278DD4">
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
        </circle>
      </g>
      
      <text x="${centerX}" y="${height - 40}" font-family="Arial, sans-serif" font-size="${Math.max(12, subtitleSize * 0.7)}" text-anchor="middle" fill="#888888">Powered by ItsHappening.Africa</text>
    </svg>
  `;
}

// Main execution
async function main() {
  try {
    await generateSplashScreens();
    await generateDarkSplashScreens();
    console.log('All splash screens generated successfully!');
  } catch (error) {
    console.error('Error generating splash screens:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateSplashScreens, generateDarkSplashScreens };