/**
 * Feature Graphic Generator for Google Play Store
 * Creates 1024x500 feature graphic for IH Academy
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFeatureGraphic() {
  const graphicPath = path.join(__dirname, 'feature-graphic.png');
  
  console.log('Creating Google Play Store feature graphic...');
  
  // Create a professional feature graphic with IH Academy branding
  const featureGraphicSvg = `
    <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <!-- Background and definitions -->
      <defs>
        <!-- Primary gradient background -->
        <linearGradient id="primaryBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#20366B;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#278DD4;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#24D367;stop-opacity:1" />
        </linearGradient>
        
        <!-- Accent gradient for elements -->
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#278DD4;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#24D367;stop-opacity:0.8" />
        </linearGradient>
        
        <!-- Shadow filter -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
        </filter>
        
        <!-- Text shadow -->
        <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      
      <!-- Main background -->
      <rect width="1024" height="500" fill="url(#primaryBg)"/>
      
      <!-- Background pattern circles for visual interest -->
      <g opacity="0.1">
        <circle cx="100" cy="100" r="80" fill="white"/>
        <circle cx="924" cy="400" r="60" fill="white"/>
        <circle cx="200" cy="400" r="40" fill="white"/>
        <circle cx="824" cy="100" r="50" fill="white"/>
      </g>
      
      <!-- Main content area -->
      <g transform="translate(50, 50)">
        <!-- Left side - App icon and branding -->
        <g transform="translate(0, 0)">
          <!-- App icon background -->
          <rect x="50" y="100" width="120" height="120" rx="25" fill="white" opacity="0.95" filter="url(#shadow)"/>
          
          <!-- Mini app icon -->
          <g transform="translate(110, 160)">
            <!-- IH monogram -->
            <text x="-25" y="0" font-family="Arial, sans-serif" font-size="35" font-weight="800" text-anchor="middle" fill="#20366B">I</text>
            <text x="15" y="0" font-family="Arial, sans-serif" font-size="35" font-weight="800" text-anchor="middle" fill="#20366B">H</text>
            <text x="-5" y="25" font-family="Arial, sans-serif" font-size="8" font-weight="600" text-anchor="middle" fill="#278DD4" letter-spacing="1px">ACADEMY</text>
          </g>
          
          <!-- Sports icons around app icon -->
          <circle cx="30" cy="80" r="20" fill="url(#accentGradient)"/>
          <text x="30" y="88" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">⚽</text>
          
          <circle cx="190" cy="80" r="20" fill="url(#accentGradient)"/>
          <text x="190" y="88" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">🏀</text>
          
          <circle cx="30" cy="260" r="20" fill="url(#accentGradient)"/>
          <text x="30" y="268" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">🏊</text>
          
          <circle cx="190" cy="260" r="20" fill="url(#accentGradient)"/>
          <text x="190" y="268" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">🎾</text>
        </g>
        
        <!-- Center - Main title and tagline -->
        <g transform="translate(280, 50)">
          <!-- Main title -->
          <text x="0" y="80" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="white" filter="url(#textShadow)">IH Academy</text>
          
          <!-- Tagline -->
          <text x="0" y="120" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="white" opacity="0.9">Complete Sports Academy Management</text>
          
          <!-- Key features -->
          <g transform="translate(0, 160)">
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ PayFast Integration</text>
            <text x="0" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Multi-Sport Support</text>
            <text x="0" y="60" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ South African Built</text>
            
            <text x="250" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Real-time Booking</text>
            <text x="250" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Mobile First Design</text>
            <text x="250" y="60" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#24D367">✓ Professional Reports</text>
          </g>
        </g>
        
        <!-- Right side - Phone mockup with app interface -->
        <g transform="translate(750, 50)">
          <!-- Phone frame -->
          <rect x="0" y="0" width="170" height="300" rx="25" fill="#2C3E50" filter="url(#shadow)"/>
          <rect x="10" y="20" width="150" height="260" rx="20" fill="white"/>
          
          <!-- Phone screen content - mini dashboard -->
          <rect x="15" y="25" width="140" height="50" rx="10" fill="url(#primaryBg)"/>
          <text x="85" y="45" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="white">IH Academy</text>
          <text x="85" y="60" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="white" opacity="0.8">Dashboard</text>
          
          <!-- Mini cards -->
          <rect x="20" y="85" width="60" height="40" rx="8" fill="#F8FAFC" stroke="#278DD4" stroke-width="1"/>
          <text x="50" y="100" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#20366B">Classes</text>
          <text x="50" y="115" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#278DD4">24</text>
          
          <rect x="90" y="85" width="60" height="40" rx="8" fill="#F8FAFC" stroke="#24D367" stroke-width="1"/>
          <text x="120" y="100" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#20366B">Members</text>
          <text x="120" y="115" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#24D367">156</text>
          
          <!-- Mini upcoming classes -->
          <rect x="20" y="135" width="130" height="60" rx="8" fill="#EBF4FF"/>
          <text x="85" y="150" font-family="Arial, sans-serif" font-size="9" font-weight="600" text-anchor="middle" fill="#20366B">Upcoming Classes</text>
          <text x="25" y="165" font-family="Arial, sans-serif" font-size="7" fill="#278DD4">Soccer Training</text>
          <text x="25" y="175" font-family="Arial, sans-serif" font-size="7" fill="#278DD4">Basketball Basics</text>
          <text x="25" y="185" font-family="Arial, sans-serif" font-size="7" fill="#278DD4">Swimming Lessons</text>
          
          <!-- Bottom navigation -->
          <rect x="15" y="240" width="140" height="35" rx="10" fill="#20366B"/>
          <circle cx="35" cy="257" r="8" fill="#24D367"/>
          <circle cx="65" cy="257" r="6" fill="white" opacity="0.5"/>
          <circle cx="95" cy="257" r="6" fill="white" opacity="0.5"/>
          <circle cx="125" cy="257" r="6" fill="white" opacity="0.5"/>
        </g>
      </g>
      
      <!-- Bottom accent line -->
      <rect x="0" y="480" width="1024" height="20" fill="url(#accentGradient)"/>
    </svg>
  `;
  
  await sharp(Buffer.from(featureGraphicSvg))
    .png({ quality: 100 })
    .toFile(graphicPath);
    
  console.log('Feature graphic created successfully!');
  return graphicPath;
}

// Create additional Play Store graphics
async function createAdditionalGraphics() {
  console.log('Creating additional Play Store graphics...');
  
  // Promotional graphic 180x120
  const promoGraphicSvg = `
    <svg width="180" height="120" viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="promoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#20366B;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#278DD4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="180" height="120" fill="url(#promoBg)"/>
      <text x="90" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="800" text-anchor="middle" fill="white">IH</text>
      <text x="90" y="70" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="white">ACADEMY</text>
      <text x="90" y="90" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#24D367">Sports Management</text>
    </svg>
  `;
  
  await sharp(Buffer.from(promoGraphicSvg))
    .png({ quality: 100 })
    .toFile(path.join(__dirname, 'promo-graphic.png'));
  
  console.log('All Play Store graphics created successfully!');
}

// Main execution
async function main() {
  try {
    await createFeatureGraphic();
    await createAdditionalGraphics();
    console.log('All graphics generated successfully!');
  } catch (error) {
    console.error('Error generating graphics:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createFeatureGraphic, createAdditionalGraphics };