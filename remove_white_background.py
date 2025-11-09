from PIL import Image
import os

# Input and output directories
input_dir = "src/assets/title-frames"
output_dir = "src/assets/title-frames-transparent"

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

def remove_white_background(input_path, output_path, threshold=240):
    """
    Remove white background from an image and make it transparent.
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image
        threshold: RGB values above this will be considered white (0-255)
    """
    # Open the image
    img = Image.open(input_path)
    
    # Convert to RGBA if not already
    img = img.convert("RGBA")
    
    # Get image data
    datas = img.getdata()
    
    # Create new image data with transparency
    new_data = []
    for item in datas:
        # If pixel is close to white, make it transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    
    # Update image data
    img.putdata(new_data)
    
    # Save as PNG (supports transparency)
    img.save(output_path, "PNG")
    print(f"Processed: {input_path} -> {output_path}")

# Process all JPG files in the input directory
for filename in sorted(os.listdir(input_dir)):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        input_path = os.path.join(input_dir, filename)
        # Change extension to .png for output
        output_filename = os.path.splitext(filename)[0] + '.png'
        output_path = os.path.join(output_dir, output_filename)
        
        remove_white_background(input_path, output_path)

print(f"\nAll frames processed! Check the '{output_dir}' folder.")


