#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

def create_android_icons():
    """Generate all required Android app icons from IH Academy 6 whistle logo"""
    
    # Load the original IH Academy 6 whistle logo
    try:
        logo_path = "../attached_assets/IH Academy 6 (1).png"
        if os.path.exists(logo_path):
            logo = Image.open(logo_path)
        else:
            print("Logo not found, creating placeholder whistle icon")
            logo = create_whistle_icon()
    except Exception as e:
        print(f"Error loading logo: {e}")
        logo = create_whistle_icon()
    
    # Android icon specifications
    android_sizes = [
        ("mipmap-mdpi", 48),
        ("mipmap-hdpi", 72),
        ("mipmap-xhdpi", 96),
        ("mipmap-xxhdpi", 144),
        ("mipmap-xxxhdpi", 192)
    ]
    
    # Create directories and icons
    base_path = "android/app/src/main/res"
    os.makedirs(base_path, exist_ok=True)
    
    for folder, size in android_sizes:
        folder_path = os.path.join(base_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Create launcher icon
        icon = logo.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(os.path.join(folder_path, "ic_launcher.png"))
        
        # Create round icon
        round_icon = create_round_icon(icon, size)
        round_icon.save(os.path.join(folder_path, "ic_launcher_round.png"))
        
        # Create foreground icon for adaptive icons
        foreground = create_foreground_icon(logo, size)
        foreground.save(os.path.join(folder_path, "ic_launcher_foreground.png"))
        
        print(f"Created icons for {folder} ({size}x{size})")
    
    print("Android icons generated successfully!")

def create_whistle_icon():
    """Create whistle icon if original logo not available"""
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # IH Academy colors
    primary_color = "#20366B"
    secondary_color = "#278DD4"
    accent_color = "#24D367"
    
    # Draw whistle shape
    center = size // 2
    whistle_radius = size // 3
    
    # Main whistle body
    draw.ellipse([
        center - whistle_radius, center - whistle_radius//2,
        center + whistle_radius, center + whistle_radius//2
    ], fill=primary_color)
    
    # Whistle mouthpiece
    draw.ellipse([
        center - whistle_radius//3, center - whistle_radius//4,
        center + whistle_radius//3, center + whistle_radius//4
    ], fill=secondary_color)
    
    # Whistle ring
    draw.ellipse([
        center + whistle_radius//2, center - whistle_radius//6,
        center + whistle_radius, center + whistle_radius//6
    ], fill=accent_color)
    
    return img

def create_round_icon(icon, size):
    """Create round version of icon"""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)
    
    round_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    round_icon.paste(icon, (0, 0))
    round_icon.putalpha(mask)
    
    return round_icon

def create_foreground_icon(logo, size):
    """Create foreground icon for adaptive icons"""
    # Adaptive icons need extra padding (about 25% on each side)
    padding = size // 4
    fg_size = size - (padding * 2)
    
    foreground = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    resized_logo = logo.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
    
    # Center the logo
    foreground.paste(resized_logo, (padding, padding), resized_logo if resized_logo.mode == 'RGBA' else None)
    
    return foreground

if __name__ == "__main__":
    create_android_icons()