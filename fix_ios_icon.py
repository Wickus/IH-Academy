#!/usr/bin/env python3
"""
Fix iOS 1024x1024 app icon by removing transparency and adding solid background
Apple requires no alpha channel or transparency in the large app icon
"""

from PIL import Image, ImageDraw
import os

def fix_app_icon():
    # Load the original logo
    logo_path = "attached_assets/IH Academy 6 (1).png"
    output_path = "mobile/ios-xcode-project/IHAcademy/Assets.xcassets/AppIcon.appiconset/Icon-1024.png"
    
    # Open the original logo
    with Image.open(logo_path) as logo:
        # Create a new image with solid white background (no transparency)
        fixed_icon = Image.new('RGB', (1024, 1024), 'white')
        
        # Resize logo to fit nicely in the icon (with some padding)
        logo_size = 800  # Leave 112px padding on each side
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Convert logo to RGB if it has transparency
        if logo.mode == 'RGBA':
            # Create white background for logo
            logo_bg = Image.new('RGB', logo.size, 'white')
            logo_bg.paste(logo, mask=logo.split()[-1])  # Use alpha channel as mask
            logo = logo_bg
        
        # Center the logo on the white background
        logo_x = (1024 - logo_size) // 2
        logo_y = (1024 - logo_size) // 2
        fixed_icon.paste(logo, (logo_x, logo_y))
        
        # Save as PNG with no transparency
        fixed_icon.save(output_path, 'PNG', optimize=True)
        print(f"✅ Fixed app icon saved to: {output_path}")
        print("✅ Removed transparency and alpha channel")
        print("✅ Added solid white background")
        print("✅ Ready for App Store submission")

if __name__ == "__main__":
    fix_app_icon()