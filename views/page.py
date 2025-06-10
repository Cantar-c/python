from flask import Blueprint, render_template

from utils.models import Video

page = Blueprint('page', __name__)


@page.route('/')
def index():
    return render_template('index.html')


@page.route('/login')
def login():
    return render_template('login.html')


@page.route('/register')
def register():
    return render_template('register.html')


@page.route('/upload')
def upload():
    return render_template('upload.html')


@page.route('/user')
def user():
    return render_template('user.html')


@page.route('/video/<video_id>')
def video(video_id):
    video = Video.query.filter_by(id=video_id).first()
    return render_template('video.html', video=video)
