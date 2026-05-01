import os
from PIL import Image

assets_icon = "/home/satyendra-pc/mathscalc/calcmind-app/assets/icon.png"
public_dir = "/home/satyendra-pc/mathscalc/calcmind-app/public"

try:
    with Image.open(assets_icon) as img:
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(os.path.join(public_dir, "icon-192.png"), "PNG")
        
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(os.path.join(public_dir, "icon-512.png"), "PNG")
        
    print("Web icons generated successfully.")
except Exception as e:
    print(f"Error generating web icons: {e}")
