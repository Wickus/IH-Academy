#!/usr/bin/env python3
"""
Create prominent whistle app icon for iOS
Make the whistle larger and more visible while maintaining Apple's requirements
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

def create_prominent_whistle_icon():
    # Load the original IH Academy 6 image
    logo_path = "attached_assets/IH Academy 6 (1).png"
    output_path = "mobile/ios-xcode-project/IHAcademy/Assets.xcassets/AppIcon.appiconset/Icon-1024.png"
    
    # IH Academy brand colors
    primary_blue = (32, 54, 107)    # #20366B
    secondary_blue = (39, 141, 212) # #278DD4
    accent_green = (36, 211, 103)   # #24D367
    
    # Create background with gradient effect
    icon = Image.new('RGB', (1024, 1024), primary_blue)
    
    # Create a subtle gradient background
    draw = ImageDraw.Draw(icon)
    for i in range(1024):
        # Gradient from primary to secondary blue
        ratio = i / 1024
        r = int(primary_blue[0] * (1 - ratio) + secondary_blue[0] * ratio)
        g = int(primary_blue[1] * (1 - ratio) + secondary_blue[1] * ratio)
        b = int(primary_blue[2] * (1 - ratio) + secondary_blue[2] * ratio)
        draw.line([(0, i), (1024, i)], fill=(r, g, b))
    
    # Create whistle shape manually for better control
    # This creates a clean, prominent whistle design
    
    # Whistle body (main tube)
    whistle_color = 'white'
    draw.rounded_rectangle([300, 450, 700, 550], radius=50, fill=whistle_color, outline=None)
    
    # Whistle mouthpiece (left side)
    draw.rounded_rectangle([250, 470, 320, 530], radius=20, fill=whistle_color)
    
    # Whistle sound holes (top)
    for x in range(350, 650, 60):
        draw.line([(x, 420), (x, 440)], fill=whistle_color, width=8)
    
    # Whistle ring/chain attachment
    draw.ellipse([680, 430, 750, 500], outline=whistle_color, width=12)
    draw.ellipse([690, 440, 740, 490], outline=whistle_color, width=8)
    
    # Sound lines (whistle being blown)
    for i, length in enumerate([40, 30, 20]):
        y_offset = -15 + i * 15
        draw.line([(320, 480 + y_offset), (320 + length, 480 + y_offset)], 
                 fill=whistle_color, width=6)
    
    # Add "IH ACADEMY" text below whistle
    try:
        # Try to use a bold font if available
        font_size = 60
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default font
        try:
            font = ImageFont.load_default()
        except:
            font = None
    
    if font:
        text = "IH ACADEMY"
        # Get text size
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center text below whistle
        text_x = (1024 - text_width) // 2
        text_y = 600
        
        # Add text with outline for better visibility
        outline_color = primary_blue
        for dx in [-2, -1, 0, 1, 2]:
            for dy in [-2, -1, 0, 1, 2]:
                if dx != 0 or dy != 0:
                    draw.text((text_x + dx, text_y + dy), text, font=font, fill=outline_color)
        
        draw.text((text_x, text_y), text, font=font, fill='white')
    
    # Add a subtle circular border
    border_width = 8
    draw.ellipse([border_width, border_width, 1024-border_width, 1024-border_width], 
                outline='white', width=border_width)
    
    # Save as completely opaque RGB
    icon.save(output_path, 'PNG')
    
    # Verify no transparency
    test_icon = Image.open(output_path)
    print(f"✅ Prominent whistle icon created")
    print(f"✅ Mode: {test_icon.mode} (completely opaque)")
    print(f"✅ Size: {test_icon.size}")
    print(f"✅ Features: Custom whistle design with IH Academy branding")
    print(f"✅ Apple compliant: No transparency")
    print(f"✅ Saved to: {output_path}")

if __name__ == "__main__":
    create_prominent_whistle_icon()