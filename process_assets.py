import os
from PIL import Image

brain_dir = "/home/satyendra-pc/.gemini/antigravity/brain/d5df8ff5-620f-4aec-b6b6-3283177d2fc9"
icon_path = os.path.join(brain_dir, "media__1777609351615.jpg")
splash_path = os.path.join(brain_dir, "media__1777609351702.png")

assets_dir = "/home/satyendra-pc/mathscalc/calcmind-app/assets"
os.makedirs(assets_dir, exist_ok=True)

# 1. Process Icon (Convert to PNG)
try:
    with Image.open(icon_path) as img:
        img = img.convert("RGBA")
        img.save(os.path.join(assets_dir, "icon.png"), "PNG")
    print("Icon processed successfully.")
except Exception as e:
    print(f"Error processing icon: {e}")

# 2. Process Splash (Paste onto 2732x2732 black canvas)
try:
    with Image.open(splash_path) as splash_img:
        splash_img = splash_img.convert("RGBA")
        
        # Create a new black image
        canvas_size = 2732
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 255))
        
        # Calculate offset to center the splash image
        offset_x = (canvas_size - splash_img.width) // 2
        offset_y = (canvas_size - splash_img.height) // 2
        
        # Paste the splash image
        canvas.paste(splash_img, (offset_x, offset_y), splash_img)
        canvas.save(os.path.join(assets_dir, "splash.png"), "PNG")
    print("Splash processed successfully.")
except Exception as e:
    print(f"Error processing splash: {e}")
