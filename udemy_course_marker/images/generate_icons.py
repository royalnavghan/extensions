from PIL import Image, ImageDraw
import os


bg_color = "#a435f0"  # Udemy purple
fg_color = "#FFFFFF"  # White

def create_icon(size):

    img = Image.new('RGBA', (size, size), color=bg_color)
    draw = ImageDraw.Draw(img)
    

    circle_radius = size // 3
    draw.ellipse(
        (
            size//2 - circle_radius,
            size//2 - circle_radius,
            size//2 + circle_radius,
            size//2 + circle_radius
        ),
        fill=fg_color
    )
    

    triangle_size = circle_radius * 0.8
    draw.polygon(
        [
            (size//2 - triangle_size//2, size//2 - triangle_size//2),
            (size//2 - triangle_size//2, size//2 + triangle_size//2),
            (size//2 + triangle_size//2, size//2),
        ],
        fill=bg_color
    )
    

    plus_radius = size // 6
    draw.ellipse(
        (
            size - plus_radius*2,
            0,
            size,
            plus_radius*2
        ),
        fill="#5624d0"
    )
    

    line_width = max(1, size // 32)
    draw.line(
        (
            size - plus_radius,
            plus_radius//2,
            size - plus_radius,
            plus_radius*3//2
        ),
        fill=fg_color,
        width=line_width
    )
    draw.line(
        (
            size - plus_radius*3//2,
            plus_radius,
            size - plus_radius//2,
            plus_radius
        ),
        fill=fg_color,
        width=line_width
    )
    
    return img


def create_fallback_icons():
    print("Creating fallback icons without PIL...")
    for size in [16, 48, 128]:

        html_content = f"""
        <html>
        <body>
        <div style="width: {size}px; height: {size}px; background-color: {bg_color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: {size//4}px;">
            U
        </div>
        </body>
        </html>
        """
        
        with open(f"icon{size}.html", "w") as f:
            f.write(html_content)
        
        print(f"Created fallback icon{size}.html")


def create_simple_icon(size):
    from PIL import Image, ImageDraw
    

    img = Image.new('RGBA', (size, size), color=bg_color)
    

    return img

try:

    for size in [16, 48, 128]:
        try:
            icon = create_icon(size)
            icon.save(f"icon{size}.png")
            print(f"Created icon{size}.png")
        except Exception as e:
            print(f"Error creating icon{size}.png: {e}")

            simple_icon = create_simple_icon(size)
            simple_icon.save(f"icon{size}.png")
            print(f"Created simple icon{size}.png")
except ImportError:

    create_fallback_icons()

print("Icon generation complete!") 
