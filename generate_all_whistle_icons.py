#!/usr/bin/env python3
"""
Generate all iOS app icon sizes with the prominent whistle design
Create all required icon sizes from the 1024px master
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_whistle_icon(size):
    """Create a whistle icon at the specified size"""
    # IH Academy brand colors
    primary_blue = (32, 54, 107)    # #20366B
    secondary_blue = (39, 141, 212) # #278DD4
    
    # Create background with gradient
    icon = Image.new('RGB', (size, size), primary_blue)
    draw = ImageDraw.Draw(icon)
    
    # Create gradient background
    for i in range(size):
        ratio = i / size
        r = int(primary_blue[0] * (1 - ratio) + secondary_blue[0] * ratio)
        g = int(primary_blue[1] * (1 - ratio) + secondary_blue[1] * ratio)
        b = int(primary_blue[2] * (1 - ratio) + secondary_blue[2] * ratio)
        draw.line([(0, i), (size, i)], fill=(r, g, b))
    
    # Scale whistle elements based on icon size
    scale = size / 1024
    
    # Whistle body (main tube)
    whistle_color = 'white'
    body_left = int(300 * scale)
    body_top = int(450 * scale)
    body_right = int(700 * scale)
    body_bottom = int(550 * scale)
    radius = max(1, int(50 * scale))
    
    draw.rounded_rectangle([body_left, body_top, body_right, body_bottom], 
                          radius=radius, fill=whistle_color)
    
    # Whistle mouthpiece
    mouth_left = int(250 * scale)
    mouth_top = int(470 * scale)
    mouth_right = int(320 * scale)
    mouth_bottom = int(530 * scale)
    mouth_radius = max(1, int(20 * scale))
    
    draw.rounded_rectangle([mouth_left, mouth_top, mouth_right, mouth_bottom], 
                          radius=mouth_radius, fill=whistle_color)
    
    # Sound holes (only for larger icons)
    if size >= 64:
        hole_width = max(1, int(8 * scale))
        hole_spacing = int(60 * scale)
        hole_start = int(350 * scale)
        hole_end = int(650 * scale)
        hole_top = int(420 * scale)
        hole_bottom = int(440 * scale)
        
        for x in range(hole_start, hole_end, hole_spacing):
            draw.line([(x, hole_top), (x, hole_bottom)], fill=whistle_color, width=hole_width)
    
    # Whistle ring (only for larger icons)
    if size >= 40:
        ring_left = int(680 * scale)
        ring_top = int(430 * scale)
        ring_right = int(750 * scale)
        ring_bottom = int(500 * scale)
        ring_width = max(1, int(12 * scale))
        
        draw.ellipse([ring_left, ring_top, ring_right, ring_bottom], 
                    outline=whistle_color, width=ring_width)
        
        # Inner ring
        inner_offset = int(10 * scale)
        inner_width = max(1, int(8 * scale))
        draw.ellipse([ring_left + inner_offset, ring_top + inner_offset, 
                     ring_right - inner_offset, ring_bottom - inner_offset], 
                    outline=whistle_color, width=inner_width)
    
    # Sound lines (only for larger icons)
    if size >= 60:
        sound_start_x = int(320 * scale)
        sound_y_center = int(480 * scale)
        sound_width = max(1, int(6 * scale))
        
        for i, length in enumerate([40, 30, 20]):
            y_offset = int((-15 + i * 15) * scale)
            line_length = int(length * scale)
            draw.line([(sound_start_x, sound_y_center + y_offset), 
                      (sound_start_x + line_length, sound_y_center + y_offset)], 
                     fill=whistle_color, width=sound_width)
    
    # Add border for larger icons
    if size >= 60:
        border_width = max(1, int(8 * scale))
        draw.ellipse([border_width, border_width, size-border_width, size-border_width], 
                    outline='white', width=border_width)
    
    return icon

def generate_all_ios_icons():
    """Generate all required iOS icon sizes"""
    base_path = "mobile/ios-xcode-project/IHAcademy/Assets.xcassets/AppIcon.appiconset/"
    
    # iOS icon sizes and their filenames
    icon_sizes = [
        (20, "Icon-20.png"),
        (40, "Icon-20@2x.png"),  # 20pt @2x
        (60, "Icon-20@3x.png"),  # 20pt @3x
        (29, "Icon-29.png"),
        (58, "Icon-29@2x.png"),  # 29pt @2x
        (87, "Icon-29@3x.png"),  # 29pt @3x
        (40, "Icon-40.png"),
        (80, "Icon-40@2x.png"),  # 40pt @2x
        (120, "Icon-40@3x.png"), # 40pt @3x
        (120, "Icon-60@2x.png"), # 60pt @2x
        (180, "Icon-60@3x.png"), # 60pt @3x
        (76, "Icon-76.png"),
        (152, "Icon-76@2x.png"), # 76pt @2x
        (167, "Icon-83.5@2x.png"), # 83.5pt @2x (iPad Pro)
        (1024, "Icon-1024.png")  # App Store
    ]
    
    print("🎯 Generating all iOS icon sizes with whistle design...")
    
    for size, filename in icon_sizes:
        icon = create_whistle_icon(size)
        output_path = os.path.join(base_path, filename)
        icon.save(output_path, 'PNG')
        print(f"✅ Generated {filename} ({size}x{size})")
    
    print(f"✅ All {len(icon_sizes)} icon sizes generated successfully!")
    print("✅ All icons feature prominent whistle design")
    print("✅ All icons are completely opaque (Apple compliant)")
    print("✅ Ready for Xcode build and App Store submission")

if __name__ == "__main__":
    generate_all_ios_icons()