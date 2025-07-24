#!/usr/bin/env python3
"""
Create iOS app icon using the actual whistle logo from IH Academy 6 image
Extract and use the whistle design, not the circular background
"""

from PIL import Image, ImageDraw, ImageOps
import os

def create_whistle_app_icon():
    # Load the original IH Academy 6 image
    logo_path = "attached_assets/IH Academy 6 (1).png"
    output_path = "mobile/ios-xcode-project/IHAcademy/Assets.xcassets/AppIcon.appiconset/Icon-1024.png"
    
    # Create solid white background (completely opaque)
    icon = Image.new('RGB', (1024, 1024), 'white')
    
    # Open the original image
    with Image.open(logo_path) as original:
        # The image has concentric circles with a whistle in the center
        # We want to focus on the whistle and create a clean icon
        
        # First, let's work with the central whistle area
        # The whistle appears to be in a dark blue circle in the center
        
        # Create a clean background with IH Academy brand colors
        # Primary blue: #20366B
        background_color = (32, 54, 107)  # #20366B in RGB
        icon = Image.new('RGB', (1024, 1024), background_color)
        
        # Create a circular background for the whistle
        circle_size = 800
        circle_x = (1024 - circle_size) // 2
        circle_y = (1024 - circle_size) // 2
        
        # Create a lighter blue circle for contrast
        draw = ImageDraw.Draw(icon)
        light_blue = (39, 141, 212)  # #278DD4 - secondary color
        draw.ellipse([circle_x, circle_y, circle_x + circle_size, circle_y + circle_size], 
                    fill=light_blue)
        
        # Now extract and place the whistle
        # Resize the original to work with
        original_resized = original.resize((600, 600), Image.Resampling.LANCZOS)
        
        # Convert to RGBA if needed for transparency handling
        if original_resized.mode != 'RGBA':
            original_resized = original_resized.convert('RGBA')
        
        # Create a mask to isolate the whistle (center area)
        mask = Image.new('L', original_resized.size, 0)
        mask_draw = ImageDraw.Draw(mask)
        
        # Create circular mask for center area where whistle is
        center_size = 300
        center_x = (600 - center_size) // 2
        center_y = (600 - center_size) // 2
        mask_draw.ellipse([center_x, center_y, center_x + center_size, center_y + center_size], 
                         fill=255)
        
        # Apply mask to get whistle area
        whistle_area = Image.new('RGBA', original_resized.size, (0, 0, 0, 0))
        whistle_area.paste(original_resized, mask=mask)
        
        # Position the whistle in the center of our icon
        whistle_x = (1024 - 600) // 2
        whistle_y = (1024 - 600) // 2
        
        # Paste the whistle area onto our icon
        icon.paste(whistle_area, (whistle_x, whistle_y), whistle_area)
        
        # Add a subtle white circle border for professional look
        border_size = 820
        border_x = (1024 - border_size) // 2
        border_y = (1024 - border_size) // 2
        draw.ellipse([border_x, border_y, border_x + border_size, border_y + border_size], 
                    outline='white', width=8)
    
    # Save as completely opaque RGB image
    final_icon = Image.new('RGB', (1024, 1024), 'white')
    final_icon.paste(icon, (0, 0))
    final_icon.save(output_path, 'PNG')
    
    # Verify the result
    test_icon = Image.open(output_path)
    print(f"✅ Icon created with whistle design")
    print(f"✅ Mode: {test_icon.mode} (no transparency)")
    print(f"✅ Size: {test_icon.size}")
    print(f"✅ Background: IH Academy brand colors")
    print(f"✅ Saved to: {output_path}")

if __name__ == "__main__":
    create_whistle_app_icon()