from flask import Flask, request, jsonify, render_template
from update_data import download_jsons, config

app = Flask(__name__)
download_jsons()

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/uptime', methods=['HEAD'])
def uptime():
    return '', 200

if __name__ == '__main__':
    app.run(
        host=config['host'],
        port=config['port'],
        debug=config.get('flask-debug', False)
    )
