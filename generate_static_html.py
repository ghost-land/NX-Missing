from flask import Flask, render_template
from update_data import download_jsons, config
import os

app = Flask(__name__)

missing = download_jsons()

def render_static_html():
    with app.app_context():
        if not os.path.exists('_site'):
            os.makedirs('_site')
        
        rendered = render_template(
            'index.html',
            missing=missing,
            images_size=config.get('images-size', 100),
            len=len
        )
        with open('_site/index.html', 'w', encoding='utf-8') as f:
            f.write(rendered)

if __name__ == "__main__":
    render_static_html()
