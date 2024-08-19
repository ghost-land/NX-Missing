from flask import Flask, render_template
from update_data import download_jsons, config
import os
import shutil

app = Flask(__name__)

missing = download_jsons()

def render_static_html():
    with app.app_context():
        if not os.path.exists('_site'):
            os.makedirs('_site')

        static_src_dir = 'static'
        static_dest_dir = os.path.join('_site', 'static')
        
        if os.path.exists(static_dest_dir):
            shutil.rmtree(static_dest_dir)
        shutil.copytree(static_src_dir, static_dest_dir)

        rendered = render_template(
            'index.html',
            missing=missing,
            images_size=config.get('images-size', 100),
            len=len
        )
        with open(os.path.join('_site', 'index.html'), 'w', encoding='utf-8') as f:
            f.write(rendered)

if __name__ == "__main__":
    render_static_html()
