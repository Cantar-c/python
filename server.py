from flask import Flask

from utils.extensions import db
from views.api import api
from views.page import page

app = Flask(__name__)

app.secret_key = 'JakHdQrCuGvNI4tnnV0DJgLy71qtBufS'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///my_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # 关闭修改跟踪

db.init_app(app)

app.register_blueprint(page, url_prefix='/')
app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', debug=True)
