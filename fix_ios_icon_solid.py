#!/usr/bin/env python3
"""
Create completely solid background iOS icon - no transparency whatsoever
Apple requires 100% opaque images for the 1024x1024 app icon
"""

from PIL import Image, ImageDraw
import os

def create_solid_app_icon():
    # Load the original logo
    logo_path = "attached_assets/IH Academy 6 (1).png"
    output_path = "mobile/ios-xcode-project/IHAcademy/Assets.xcassets/AppIcon.appiconset/Icon-1024.png"
    
    # Create a completely solid white background (RGB mode - no alpha)
    icon = Image.new('RGB', (1024, 1024), 'white')
    
    # Open and process the original logo
    with Image.open(logo_path) as logo:
        # Resize logo to fit the icon with padding
        logo_size = 900  # Larger size, smaller padding
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # If logo has transparency, remove it by compositing over white
        if logo.mode in ('RGBA', 'LA', 'P'):
            # Create white background same size as logo
            white_bg = Image.new('RGB', logo.size, 'white')
            
            # If the logo has an alpha channel, use it for compositing
            if logo.mode == 'RGBA':
                white_bg.paste(logo, (0, 0), logo)
            elif logo.mode == 'P' and 'transparency' in logo.info:
                # Handle palette images with transparency
                logo = logo.convert('RGBA')
                white_bg.paste(logo, (0, 0), logo)
            else:
                # No transparency, just convert to RGB
                logo = logo.convert('RGB')
                white_bg = logo
            
            logo = white_bg
        else:
            # Already RGB, just make sure it's RGB
            logo = logo.convert('RGB')
        
        # Center the logo
        x = (1024 - logo_size) // 2
        y = (1024 - logo_size) // 2
        
        # Paste logo onto white background
        icon.paste(logo, (x, y))
    
    # Save as RGB PNG (no alpha channel)
    icon.save(output_path, 'PNG')
    
    # Verify no transparency
    test_icon = Image.open(output_path)
    print(f"✅ Icon mode: {test_icon.mode}")
    print(f"✅ Icon size: {test_icon.size}")
    print(f"✅ Has transparency: {test_icon.mode in ('RGBA', 'LA', 'P')}")
    print(f"✅ Saved to: {output_path}")
    print("✅ Ready for App Store - completely opaque!")

if __name__ == "__main__":
    create_solid_app_icon()