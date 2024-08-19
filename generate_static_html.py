from flask import Flask, render_template, url_for
from update_data import download_jsons, config
import os
import shutil

app = Flask(__name__)

missing = download_jsons()

def render_static_html():
    with app.app_context():
        if not os.path.exists('_site'):
            os.makedirs('_site')

        static_dir = os.path.join('_site', 'static')
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
            os.makedirs(os.path.join(static_dir, 'css'))
            os.makedirs(os.path.join(static_dir, 'js'))

        shutil.copy('static/css/style.css', os.path.join(static_dir, 'css/style.css'))

        shutil.copy('static/js/showTables.js', os.path.join(static_dir, 'js/showTables.js'))

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
