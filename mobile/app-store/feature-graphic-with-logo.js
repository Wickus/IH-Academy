/**
 * Feature Graphic Generator with Actual IH Academy 4 Logo
 * Creates 1024x500 feature graphic using the real logo image
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFeatureGraphicWithLogo() {
  const graphicPath = path.join(__dirname, 'feature-graphic.png');
  const logoPath = path.join(__dirname, 'IH Academy 4_resized.png');
  
  console.log('Creating feature graphic with actual IH Academy 4 logo...');
  
  // Check if logo exists
  if (!fs.existsSync(logoPath)) {
    console.error('IH Academy 4_resized.png not found!');
    return;
  }
  
  // Create background with gradient
  const backgroundSvg = `
    <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="primaryBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#20366B;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#278DD4;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#24D367;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
        </filter>
        <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      
      <rect width="1024" height="500" fill="url(#primaryBg)"/>
      
      <!-- Background pattern circles -->
      <g opacity="0.1">
        <circle cx="100" cy="100" r="80" fill="white"/>
        <circle cx="924" cy="400" r="60" fill="white"/>
        <circle cx="200" cy="400" r="40" fill="white"/>
        <circle cx="824" cy="100" r="50" fill="white"/>
      </g>
      
      <!-- App icon placeholder (will be replaced with actual logo) -->
      <rect x="100" y="150" width="120" height="120" rx="25" fill="white" opacity="0.95" filter="url(#shadow)" id="logo-placeholder"/>
      
      <!-- Sports icons around logo area -->
      <g opacity="0.8">
        <circle cx="80" cy="130" r="20" fill="#24D367"/>
        <text x="80" y="138" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">⚽</text>
        
        <circle cx="240" cy="130" r="20" fill="#24D367"/>
        <text x="240" y="138" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">🏀</text>
        
        <circle cx="80" cy="310" r="20" fill="#24D367"/>
        <text x="80" y="318" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">🏊</text>
        
        <circle cx="240" cy="310" r="20" fill="#24D367"/>
        <text x="240" y="318" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">🎾</text>
      </g>
      
      <!-- Main title and content -->
      <g transform="translate(330, 100)">
        <text x="0" y="80" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="white" filter="url(#textShadow)">IH Academy</text>
        <text x="0" y="120" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="white" opacity="0.9">Complete Sports Academy Management</text>
        
        <!-- Features -->
        <g transform="translate(0, 160)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ PayFast Integration</text>
          <text x="0" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Multi-Sport Support</text>
          <text x="0" y="60" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ South African Built</text>
          
          <text x="250" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Real-time Booking</text>
          <text x="250" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Mobile First Design</text>
          <text x="250" y="60" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Professional Reports</text>
        </g>
      </g>
      
      <!-- Phone mockup -->
      <g transform="translate(800, 100)">
        <rect x="0" y="0" width="170" height="300" rx="25" fill="#2C3E50" filter="url(#shadow)"/>
        <rect x="10" y="20" width="150" height="260" rx="20" fill="white"/>
        
        <!-- Phone content -->
        <rect x="15" y="25" width="140" height="50" rx="10" fill="url(#primaryBg)"/>
        <text x="85" y="45" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="white">IH Academy</text>
        <text x="85" y="60" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="white" opacity="0.8">Dashboard</text>
        
        <rect x="20" y="85" width="60" height="40" rx="8" fill="#F8FAFC" stroke="#278DD4" stroke-width="1"/>
        <text x="50" y="100" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#20366B">Classes</text>
        <text x="50" y="115" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#278DD4">24</text>
        
        <rect x="90" y="85" width="60" height="40" rx="8" fill="#F8FAFC" stroke="#24D367" stroke-width="1"/>
        <text x="120" y="100" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#20366B">Members</text>
        <text x="120" y="115" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#24D367">156</text>
        
        <rect x="20" y="135" width="130" height="60" rx="8" fill="#EBF4FF"/>
        <text x="85" y="150" font-family="Arial, sans-serif" font-size="9" font-weight="600" text-anchor="middle" fill="#20366B">Upcoming Classes</text>
        <text x="25" y="165" font-family="Arial, sans-serif" font-size="7" fill="#278DD4">Soccer Training</text>
        <text x="25" y="175" font-family="Arial, sans-serif" font-size="7" fill="#278DD4">Basketball Basics</text>
        <text x="25" y="185" font-family="Arial, sans-serif" font-size="7" fill="#278DD4">Swimming Lessons</text>
        
        <rect x="15" y="240" width="140" height="35" rx="10" fill="#20366B"/>
        <circle cx="35" cy="257" r="8" fill="#24D367"/>
        <circle cx="65" cy="257" r="6" fill="white" opacity="0.5"/>
        <circle cx="95" cy="257" r="6" fill="white" opacity="0.5"/>
        <circle cx="125" cy="257" r="6" fill="white" opacity="0.5"/>
      </g>
      
      <!-- Bottom accent -->
      <rect x="0" y="480" width="1024" height="20" fill="#24D367" opacity="0.8"/>
    </svg>
  `;
  
  // Create background first
  const backgroundBuffer = Buffer.from(backgroundSvg);
  
  // Resize the logo to fit the app icon area (120x120)
  const logoBuffer = await sharp(logoPath)
    .resize(120, 120, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toBuffer();
  
  // Composite the background with the actual logo
  await sharp(backgroundBuffer)
    .composite([
      {
        input: logoBuffer,
        top: 150,
        left: 100
      }
    ])
    .png({ quality: 100 })
    .toFile(graphicPath);
  
  console.log('Feature graphic with actual logo created successfully!');
}

// Main execution
async function main() {
  try {
    await createFeatureGraphicWithLogo();
    console.log('Feature graphic updated with IH Academy 4 logo!');
  } catch (error) {
    console.error('Error creating feature graphic:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createFeatureGraphicWithLogo };