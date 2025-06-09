from flask import Flask

from views.api import api
from views.page import page

app = Flask(__name__)

app.secret_key = 'JakHdQrCuGvNI4tnnV0DJgLy71qtBufS'

app.register_blueprint(page, url_prefix='/')
app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True)
