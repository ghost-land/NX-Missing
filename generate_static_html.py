from flask import Flask, render_template
from update_data import download_jsons, config

app = Flask(__name__)
missing = download_jsons()

def render_static_html():
    with app.app_context():
        rendered = render_template(
            'index.html',
            missing=missing,
            images_size=config.get('images-size', 100),
            len=len
        )
        with open('_site/index.html', 'w') as f:
            f.write(rendered)

if __name__ == "__main__":
    render_static_html()
