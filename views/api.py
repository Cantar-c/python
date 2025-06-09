from functools import wraps

from flask import Blueprint, request, session

api = Blueprint('api', __name__)


def check_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return

        return f(*args, **kwargs)
    return decorated_function


# 上传节点
@api.route('/upload', methods=['POST'])
def upload():
    pass


# 获取用户视频
@api.route('/user_videos', methods=['GET'])
def user_videos():
    pass


# 获取用户信息
@api.route('/user_info', methods=['GET'])
def user_info():
    pass


# 用户登录
@api.route('/login', methods=['POST'])
def login():
    pass


# 用户登出
@api.route('/logout', methods=['POST'])
def logout():
    pass


# 用户注册
@api.route('/register', methods=['POST'])
def register():
    pass


# 获取视频列表
@api.route('/videos', methods=['GET'])
def videos():
    pass
